const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'd:/SGP/waygo-backend/.env' });

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // We can't easily list models from the SDK without a special client, 
        // but we can try the specific names that are known to work.

        const testModels = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp"
        ];

        for (const m of testModels) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("hi");
                console.log(`✅ Model ${m} works!`);
            } catch (e) {
                console.log(`❌ Model ${m} failed: ${e.message}`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

listModels();
