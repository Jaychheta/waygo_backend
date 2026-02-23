const express = require('express');
const router = express.Router();
const pool = require('../db');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDDhqW2w-4LHP9oisOiF7lGxvKa617V5uw");

// ૧. AI Plan Generator
router.get('/generate-ai-plan', async (req, res) => {
    const { location, days } = req.query;
    console.log(`Generating AI plan for: ${location}`);
    try {
        // અહીં આપણે નવું લેટેસ્ટ મોડલ gemini-2.5-flash સેટ કર્યું છે
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Create a ${days}-day travel itinerary for ${location}. Return ONLY a JSON array. Format: [{"day": 1, "places": [{"time": "09:00 AM", "placeName": "Name", "description": "Info"}]}]`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = JSON.parse(responseText.replace(/```json|```/g, '').trim());
        res.json(cleanJson);
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ error: "Failed to generate AI plan" });
    }
});

// ૨. નવી ટ્રિપ સેવ કરવા માટે
router.post('/create', async (req, res) => {
    try {
        const { user_id, name, start_date, end_date, location } = req.body;
        const newTrip = await pool.query(
            'INSERT INTO trips (user_id, name, start_date, end_date, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, name, start_date, end_date, location]
        );
        res.json({ success: true, trip: newTrip.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ૩. યુઝર આઈડી વાળો રૂટ (આને હંમેશા સૌથી નીચે રાખો)
router.get('/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const allTrips = await pool.query(
            'SELECT * FROM trips WHERE user_id = $1 ORDER BY start_date DESC',
            [user_id]
        );
        res.json(allTrips.rows);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;