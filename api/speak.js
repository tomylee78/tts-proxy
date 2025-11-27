// /api/speak.js - 最終版本：使用 Azure REST API

const axios = require('axios');

// 設置環境變數
const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION;
const ALLOWED_ORIGIN = 'http://127.0.0.1:5500'; 
const ENDPOINT = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

// 輔助函數：用於解析 JSON Body
const parseJsonBody = (req) => {
    // Vercel 通常會自動處理，但我們提供一個防錯機制
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
    // --- 1. CORS 處理 ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN); 
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    if (req.method === 'OPTIONS') {
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
            return res.status(500).send('Environment variables AZURE_SPEECH_KEY or AZURE_SPEECH_REGION are not set.');
        }
        if (!text || !lang) {
            return res.status(400).send('Missing text or lang in request body.');
        }

        // 3. 建立 SSML (Speech Synthesis Markup Language) 請求內容
        // 使用一個標準的中文聲音作為範例 (您可以根據您的 lang 變數來調整)
        const ssml = `<speak version='1.0' xml:lang='${lang}'><voice name='zh-CN-XiaoxiaoNeural'>${text}</voice></speak>`;

        // 4. 呼叫 Azure REST API
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
            responseType: 'arraybuffer' // 接收二進制數據
        });

        // 5. 回傳音訊數據給前端
        res.setHeader('Content-Type', 'audio/mpeg');
        res.status(200).send(azureResponse.data);

    } catch (error) {
        console.error('API Error:', error.response ? error.response.data.toString() : error.message);
        res.status(500).send(`Internal Server Error: Azure Call Failed. Details: ${error.response ? error.response.data.toString() : error.message}`);
    }
};