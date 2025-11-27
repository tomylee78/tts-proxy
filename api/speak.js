// [位於您的 Vercel 專案：api/speak.js]

// ... (省略所有 requires 和開頭的程式碼)

module.exports = async (req, res) => {
    // ... (CORS 和 Method 檢查邏輯不變)

    try {
        const { text, ssml, lang } = req.body;

        // ========== 臨時診斷區 START ==========
        // 收到前端資料，立即返回 200 成功，檢查 Vercel Function 本體是否正常運作
        if (!text && !ssml) {
            res.status(400).send("Diagnostic: Missing text/ssml. Frontend call succeeded.");
            return;
        }
        res.setHeader("Content-Type", "text/plain");
        res.status(200).send(
            `Diagnostic Success: Received text: ${text} for language: ${lang}. Vercel environment is OK.`
        );
        return;
        // ========== 臨時診斷區 END ==========

        // ** 以下 Azure SDK 的程式碼將不會被執行 **
        // ... (原有的 Azure SDK 程式碼全部被跳過)
    } catch (error) {
        // ... (錯誤處理)
    }
};
