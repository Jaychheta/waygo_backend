const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/search-cities', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json({ results: [] });

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;

        const response = await axios.get(url, { timeout: 8000 });

        if (!response.data.results) {
            return res.json({ results: [] });
        }

        const results = response.data.results.map(city => {
            const parts = [
                city.name,
                city.admin1 || '',
                city.country || ''
            ].filter(p => p.trim().length > 0);

            return parts.join(', ');
        });

        res.json({ results });

    } catch (error) {
        console.error('City Search Proxy Error:', error.message);
        res.json({ results: [] });
    }
});

module.exports = router;
