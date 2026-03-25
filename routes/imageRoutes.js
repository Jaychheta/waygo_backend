const express = require('express');
const axios = require('axios');
const router = express.Router();

const imageCache = new Map();

router.get('/place-image', async (req, res) => {
    try {
        const { place, city } = req.query;
        if (!place) return res.status(400).json({ error: 'Place is required' });

        const cacheKey = `${place.toLowerCase()}|${(city || '').toLowerCase()}`;
        if (imageCache.has(cacheKey)) {
            return res.json({ imageUrl: imageCache.get(cacheKey) });
        }

        const cleanCity = (city || '').split(',')[0].trim();
        let imageUrl = null;

        const getWikiImage = async (title) => {
            try {
                const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800&redirects=1`;
                const response = await axios.get(url, { headers: { 'User-Agent': 'WayGoApp/1.0' }, timeout: 5000 });
                const pages = response.data.query.pages;
                const pageId = Object.keys(pages)[0];
                return (pageId !== '-1' && pages[pageId].thumbnail) ? pages[pageId].thumbnail.source : null;
            } catch (err) { return null; }
        };

        // 1. Wikipedia direct lookups
        imageUrl = await getWikiImage(place);
        if (!imageUrl && cleanCity) imageUrl = await getWikiImage(`${place}, ${cleanCity}`);
        if (!imageUrl && cleanCity) imageUrl = await getWikiImage(`${place} ${cleanCity}`);

        // 2. Unsplash Fallback based on category
        if (!imageUrl) {
            const low = place.toLowerCase();
            if (/fort|palace|mahal|heritage|monument/.test(low)) {
                imageUrl = 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800';
            } else if (/temple|mandir|mosque|church|dargah/.test(low)) {
                imageUrl = 'https://images.unsplash.com/photo-1564804955877-2c3c7f068cd3?w=800';
            } else if (/beach|coast|sea|lake/.test(low)) {
                imageUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';
            } else if (/garden|park|nature|hill|forest/.test(low)) {
                imageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800';
            } else if (/food|cafe|restaurant|dhaba/.test(low)) {
                imageUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800';
            } else if (/museum|gallery|art/.test(low)) {
                imageUrl = 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800';
            } else {
                imageUrl = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800'; // Default
            }
        }

        imageCache.set(cacheKey, imageUrl);
        res.json({ imageUrl });

    } catch (error) {
        console.error('Image Proxy Error:', error.message);
        res.json({ imageUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800' });
    }
});

module.exports = router;
