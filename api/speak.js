// /api/speak.js - 最終版本：包含 Azure SDK 整合

const sdk = require("microsoft-cognitiveservices-speech-sdk");
const { Writable } = require("stream");

// 設置允許 CORS 的來源
const ALLOWED_ORIGIN = "http://127.0.0.1:5500";
const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION;

// 輔助函數：用於解析 JSON Body (防止 req.body undefined)
const parseJsonBody = (req) => {
    try {
        if (req.headers["content-type"] === "application/json") {
            return req.body && typeof req.body === "object" ? req.body : {};
        }
    } catch (e) {
        return {};
    }
    return {};
};

module.exports = async (req, res) => {
    // --- 1. CORS 處理 ---
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }
    // --- CORS 處理結束 ---

    try {
        // 2. 解析請求 Body
        const body = parseJsonBody(req);
        const { text, lang } = body;

        // 檢查金鑰和文本
        if (!AZURE_KEY || !AZURE_REGION) {
            return res.status(500).send("Environment variables AZURE_SPEECH_KEY or AZURE_SPEECH_REGION are not set.");
        }
        if (!text || !lang) {
            return res.status(400).send("Missing text or lang in request body.");
        }

        // 3. 建立 Azure 語音設定
        const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

        // 4. 建立 Stream Buffer
        const audioBuffer = [];
        const pushStream = sdk.AudioOutputStream.createPullStream();

        // 5. 將音訊流寫入 Node.js Writable Stream
        const audioWriteStream = new Writable({
            write(chunk, encoding, callback) {
                audioBuffer.push(chunk);
                callback();
            },
            final(callback) {
                callback();
            },
        });

        // 6. 建立合成器
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, sdk.AudioConfig.fromStreamOutput(pushStream));

        // 7. 執行語音合成
        synthesizer.speakTextAsync(
            text,
            (result) => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    // 將 PullStream 導向 Writable Stream
                    pushStream.read(audioWriteStream.write.bind(audioWriteStream));

                    // 設置回應標頭
                    res.setHeader("Content-Type", "audio/mpeg");
                    res.status(200).send(Buffer.concat(audioBuffer));
                } else if (result.reason === sdk.ResultReason.Canceled) {
                    const cancellation = sdk.CancellationDetails.fromResult(result);
                    console.error("Speech synthesis canceled:", cancellation.reason);
                    res.status(500).send(`Speech synthesis failed: ${cancellation.errorDetails}`);
                }
                synthesizer.close();
            },
            (err) => {
                console.error("Azure SDK Error:", err);
                res.status(500).send(`Azure SDK Error: ${err}`);
                synthesizer.close();
            }
        );
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
};
