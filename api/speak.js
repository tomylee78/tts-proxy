// /api/speak.js - 最終版本：使用 Azure REST API 進行 TTS (修正 CORS 安全性)

const axios = require('axios');

// --- 設定環境變數 ---
const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION;

// 🚨 僅允許這些來源，確保安全性
const ALLOWED_ORIGINS = [
    'http://127.0.0.1:5500', 
    'https://tomylee78.github.io' // 您的 GitHub Pages 網址
];

// 根據區域設定 Azure TTS API 的端點
const ENDPOINT = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;


// 語言和語音名稱映射表
const voiceMap = {
    // 英文 (en-US)
    'en-US': 'en-US-JennyNeural', 
    // 台灣中文 (zh-TW)
    'zh-TW': 'zh-TW-HsiaoChenNeural', 
    // 大陸中文 (zh-CN)
    'zh-CN': 'zh-CN-XiaoxiaoNeural', 
    // 泰文 (th-TH)
    'th-TH': 'th-TH-AcharaNeural', 
    // 日文 (ja-JP)
    'ja-JP': 'ja-JP-NanamiNeural', 
};

// 輔助函數：用於解析 JSON Body
const parseJsonBody = (req) => {
    try {
        if (req.headers && req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            return req.body && typeof req.body === 'object' ? req.body : {};
        }
    } catch (e) {
        return {};
    }
    return {};
};


module.exports = async (req, res) => {
    
    // 獲取前端發送請求的來源
    const origin = req.headers.origin;

    // --- 1. 安全 CORS 處理 ---
    
    // 檢查請求來源是否在允許清單中
    if (ALLOWED_ORIGINS.includes(origin)) {
        // 如果允許，才設置 Access-Control-Allow-Origin 標頭
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // 🚨 關鍵：如果來源不被允許，則不設置 Access-Control-Allow-Origin 
        // 瀏覽器將會阻止請求，從而達到安全限制。
    }

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    
    // 處理 CORS 預檢請求 (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    // --- CORS 處理結束 ---

    try {
        // 2. 解析請求 Body
        const body = parseJsonBody(req);
        const { text, lang } = body; 
        
        // 檢查環境變數和請求參數
        if (!AZURE_KEY || !AZURE_REGION) {
            return res.status(500).send('Error: Environment variables AZURE_SPEECH_KEY or AZURE_SPEECH_REGION are not set.');
        }
        if (!text || !lang) {
            return res.status(400).send('Error: Missing text or lang in request body.');
        }

        // 3. 動態獲取語音名稱
        const voiceName = voiceMap[lang] || voiceMap['en-US']; 

        // 4. 建立 SSML 請求內容
        const ssml = `<speak version='1.0' xml:lang='${lang}'><voice name='${voiceName}'>${text}</voice></speak>`;

        // 5. 呼叫 Azure REST API (使用 Axios)
        const azureResponse = await axios({
            method: 'post',
            url: ENDPOINT,
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_KEY,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
                'User-Agent': 'tts-proxy-vercel'
            },
            data: ssml,
            responseType: 'arraybuffer' 
        });

        // 6. 回傳音訊數據給前端
        res.setHeader('Content-Type', 'audio/mpeg');
        res.status(200).send(Buffer.from(azureResponse.data));

    } catch (error) {
        // 捕獲所有錯誤，並提供詳細資訊
        const errorDetail = error.response ? error.response.data.toString() : error.message;
        console.error('API Error:', errorDetail);
        res.status(500).send(`Internal Server Error: Azure Call Failed. Details: ${errorDetail}`);
    }
};