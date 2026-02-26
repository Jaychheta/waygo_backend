const express = require('express');
const router = express.Router();
const pool = require('../db');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// જાદુઈ કોડ: આ જાતે જ નવું ટેબલ બનાવી દેશે, તમારે PostgreSQL માં કઈ નથી કરવું!
pool.query(`
  CREATE TABLE IF NOT EXISTS trip_places (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER,
    place_data JSON
  )
`).then(() => console.log("✅ trip_places table is ready!"))
    .catch(err => console.error("Error creating table:", err));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ૧. AI Plan Generator
router.get('/generate-ai-plan', async (req, res) => {
    const { location, days } = req.query;
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: "application/json" },
        });
        const prompt = `Return ONLY a valid JSON array. ${days}-day itinerary for ${location}. Format: [{"day":1,"theme":"Theme","places":[{"time":"09:00 AM","placeName":"Name","description":"Info"}]}]`;
        const result = await model.generateContent(prompt);
        const cleanJson = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
        res.json(cleanJson);
    } catch (err) {
        res.status(500).json({ error: "Failed to generate AI plan" });
    }
});

// ૨. નવી ટ્રિપ સેવ કરવા 
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

// 🌟 ૩. નવું API: હાલની ટ્રિપમાં લોકેશન (Place) એડ કરવા 🌟
router.post('/add-place', async (req, res) => {
    try {
        const { trip_id, place_data } = req.body;
        // pg driver requires JSON columns to be passed as a string
        await pool.query(
            'INSERT INTO trip_places (trip_id, place_data) VALUES ($1, $2::json)',
            [trip_id, JSON.stringify(place_data)]
        );
        res.json({ success: true, message: "Place added to trip!" });
    } catch (err) {
        console.error("add-place error:", err.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 🌟 ૪. નવું API: ડેશબોર્ડ પરથી ટ્રિપના સેવ કરેલા પ્લેસીસ જોવા (AI વગર!) 🌟
router.get('/trip/:trip_id/places', async (req, res) => {
    try {
        const { trip_id } = req.params;
        const result = await pool.query('SELECT place_data FROM trip_places WHERE trip_id = $1', [trip_id]);
        res.json(result.rows.map(row => row.place_data));
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ── Expense Table Auto-Create ─────────────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS trip_expenses (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER,
    title VARCHAR(255),
    amount NUMERIC,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => console.log("✅ trip_expenses table is ready!"))
    .catch(err => console.error("Error creating expenses table:", err));

// ૫. ખર્ચ (Expense) એડ કરવા
router.post('/add-expense', async (req, res) => {
    try {
        const { trip_id, title, amount } = req.body;
        await pool.query(
            'INSERT INTO trip_expenses (trip_id, title, amount) VALUES ($1, $2, $3)',
            [trip_id, title, amount]
        );
        res.json({ success: true, message: "Expense added!" });
    } catch (err) {
        console.error("add-expense error:", err.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ૬. કોઈ એક ટ્રિપના બધા ખર્ચ જોવા
router.get('/trip/:trip_id/expenses', async (req, res) => {
    try {
        const { trip_id } = req.params;
        const result = await pool.query(
            'SELECT * FROM trip_expenses WHERE trip_id = $1 ORDER BY date DESC',
            [trip_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("get-expenses error:", err.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ૭. યુઝરની બધી ટ્રિપ્સ લાવવા (આ હંમેશા સૌથી નીચે રાખવું)
router.get('/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const allTrips = await pool.query('SELECT * FROM trips WHERE user_id = $1 ORDER BY start_date DESC', [user_id]);
        res.json(allTrips.rows);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;