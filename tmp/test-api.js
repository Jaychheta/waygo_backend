const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'd:/SGP/waygo-backend/.env' });

async function test() {
    try {
        console.log("Testing with key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        console.log("Success:", result.response.text());
    } catch (err) {
        console.error("Detailed Error:", err);
    }
}

test();
