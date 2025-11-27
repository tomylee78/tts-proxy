// /api/test.js

// 允許來自您本地開發環境的 CORS 請求
const ALLOWED_ORIGIN = 'http://127.0.0.1:5500';

module.exports = async (req, res) => {
    // --- 1. CORS 處理 ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    
    // 處理 CORS 預檢請求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // --- 2. 最小可行 API 邏輯 ---
    
    // 立即回傳 "OK" 字樣
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send('API Test SUCCESS: OK');
};