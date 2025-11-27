// [位於您的 Vercel 專案：api/speak.js]
const sdk = require('microsoft-cognitiveservices-speech-sdk');

// 設置語音映射表，讓 Vercel 知道前端的 lang 應該對應哪個 Azure 語音
const VOICE_MAP = {
    'en-US': 'en-US-JennyNeural', // 美式英文 (或其他您喜歡的)
    'zh-CN': 'zh-CN-XiaoxiaoNeural', // 簡體中文
    'zh-TW': 'zh-TW-HsiaoChenNeural', // 台灣中文 (推薦作為 zh-CN 的備援或主用)
    'th-TH': 'th-TH-AcharaNeural' // 泰文
};

// ... (其他不變的程式碼省略)

module.exports = async (req, res) => {
    // ... (CORS 和 Method 檢查邏輯不變)

    try {
        const { text, ssml, lang } = req.body; // 接收前端傳來的 text, ssml, 和 lang
        
        // ... (省略 text/ssml 檢查)

        const speechKey = process.env.AZURE_SPEECH_KEY;
        const speechRegion = process.env.AZURE_SPEECH_REGION;

        // ... (省略 Key/Region 檢查)

        const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        
        // === [核心修改] 根據 lang 參數設置語音 ===
        const voiceName = VOICE_MAP[lang] || VOICE_MAP['zh-TW']; // 找不到就用台灣中文作為預設
        speechConfig.speechSynthesisVoiceName = voiceName;
        // ====================================
        
        // ... (其餘合成邏輯不變)
        
    } catch (error) {
        // ... (錯誤處理不變)
    }
};