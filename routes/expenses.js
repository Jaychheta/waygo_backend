const express = require('express');
const router = express.Router();
const pool = require('../db');

// ખર્ચ ઉમેરવા માટે
router.post('/add', async (req, res) => {
    try {
        const { trip_id, paid_by, amount, description, category } = req.body;
        const newExpense = await pool.query(
            'INSERT INTO expenses (trip_id, paid_by, amount, description, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [trip_id, paid_by, amount, description, category]
        );
        res.json(newExpense.rows[0]);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;