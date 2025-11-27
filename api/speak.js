// /api/speak.js - 修正後的診斷程式碼

module.exports = async (req, res) => {
    // --- CORS 處理邏輯 (不變) ---
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
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
        // 🚨 關鍵修正：嘗試解析前端傳來的 JSON 內容
        const { text, lang } = req.body;

        // --- 最小可行診斷區 ---
        res.setHeader("Content-Type", "text/plain");
        // 確保變數存在，否則替換為預設值
        const outputText = text || "No Text Found";
        const outputLang = lang || "en-US";

        res.status(200).send(
            `Diagnostic Success: Received text: ${outputText} for language: ${outputLang}. Vercel environment is OK.`
        );
        return;
        // --- 診斷區結束 ---
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
};
