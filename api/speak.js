// [在 api/speak.js 中替換/添加]
module.exports = async (req, res) => {
    // --- 添加 CORS 標頭 ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); // 允許您的本地開發網址
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    // --- 處理 CORS 預檢請求 ---
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // ... (您的極簡診斷程式碼放在這裡)
        res.setHeader("Content-Type", "text/plain");
        res.status(200).send(`Diagnostic Success: Received text: ${text} for language: ${lang}. Vercel environment is OK.`);
        return; 

    } catch (error) {
        // ... (處理錯誤)
    }
};