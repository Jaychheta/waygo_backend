const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'd:/SGP/waygo-backend/.env' });

async function testV1() {
    try {
        // Some versions of the SDK allow specifying the version in headers or config
        // but the default is v1beta.
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        console.log("Testing with v1-style model names...");
        const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("echo hello");
                console.log(`✅ Success with ${m}:`, result.response.text());
                return;
            } catch (e) {
                console.log(`❌ Failed ${m}:`, e.message);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

testV1();
