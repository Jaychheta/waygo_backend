const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'd:/SGP/waygo-backend/.env' });

async function findWorkingModel() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const candidateModels = [
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp"
    ];

    for (const m of candidateModels) {
        try {
            console.log(`Checking ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("ping");
            console.log(`✅ ${m} WORKS! Result: ${result.response.text()}`);
            return;
        } catch (e) {
            console.log(`❌ ${m} FAILED: ${e.message.split('\n')[0]}`);
        }
    }
}

findWorkingModel();
