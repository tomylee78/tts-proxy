// api/speak.js
const sdk = require('microsoft-cognitiveservices-speech-sdk');

// 設定允許您的 GitHub Pages 呼叫此 API (替換為您 GitHub Pages 的網址)
const ALLOWED_ORIGIN = 'https://您的GitHub帳號.github.io'; 
// 如果您的網頁沒有網域，可以暫時設為 '*' 允許所有來源，但在正式上線前強烈建議鎖定。

module.exports = async (req, res) => {
    // 設置 CORS Header，允許您的前端呼叫
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 處理 OPTIONS 請求 (這是瀏覽器在正式請求前發送的預檢請求)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只接受 POST 請求
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const { text, ssml } = req.body; // 接收前端傳來的文字或SSML

        if (!text && !ssml) {
            res.status(400).send('Missing text or ssml in request body');
            return;
        }

        // 從 Vercel 環境變數讀取金鑰 (安全!!!)
        const speechKey = process.env.AZURE_SPEECH_KEY;
        const speechRegion = process.env.AZURE_SPEECH_REGION;

        if (!speechKey || !speechRegion) {
            res.status(500).send('Server configuration error: Key or Region missing.');
            return;
        }

        const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        
        // 設置語音名稱 (台灣繁體中文)
        speechConfig.speechSynthesisVoiceName = "zh-TW-HsiaoChenNeural"; 
        
        // 設置音頻格式 (mp3)
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
        
        // 決定要合成普通文字還是 SSML
        const synthesisPromise = ssml 
            ? synthesizer.speakSsmlAsync(ssml) 
            : synthesizer.speakTextAsync(text);
        
        const result = await synthesisPromise;
        
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // 成功：將音訊數據作為 MP3 流返回
            const audioBuffer = Buffer.from(result.audioData);

            res.setHeader('Content-Type', 'audio/mp3');
            res.setHeader('Content-Length', audioBuffer.length);
            res.status(200).send(audioBuffer);

        } else {
            // 失敗
            console.error("Speech synthesis failed:", result.errorDetails);
            res.status(500).send(`Synthesis failed: ${result.errorDetails}`);
        }
        
        synthesizer.close();

    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).send('Internal Server Error');
    }
};