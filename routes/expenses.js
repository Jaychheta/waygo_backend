const express = require('express');
const router = express.Router();
const pool = require('../db');

// ખર્ચ ઉમેરવા માટે
router.post('/add', async (req, res) => {
    try {
        const { trip_id, amount, description, category } = req.body;
        // Map 'description' to 'title' to match trip_expenses table
        const newExpense = await pool.query(
            'INSERT INTO trip_expenses (trip_id, title, amount, category) VALUES ($1, $2, $3, $4) RETURNING *',
            [trip_id, description || 'Expense', amount, category || 'Others']
        );
        res.json(newExpense.rows[0]);
    } catch (err) {
        console.error('Add expense error:', err.message);
        res.status(500).send("Server Error");
    }
});

// GET expenses for a trip
router.get('/', async (req, res) => {
    try {
        const { trip_id } = req.query;
        if (!trip_id) return res.status(400).json({ error: "Missing trip_id" });
        
        const result = await pool.query(
            'SELECT * FROM trip_expenses WHERE trip_id = $1 ORDER BY date DESC',
            [trip_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get expenses error:', err.message);
        res.status(500).send("Server Error");
    }
});


module.exports = router;