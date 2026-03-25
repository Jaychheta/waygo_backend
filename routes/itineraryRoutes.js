const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { generateDynamicItinerary } = require('../controllers/itineraryController');

// ── Shared JWT Auth Middleware ────────────────────────────────────────────────
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const secret = process.env.JWT_SECRET || 'waygo_secret_key';
        const decoded = jwt.verify(token, secret);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// SECURED: Only logged-in users can generate itineraries
router.post('/generate', authMiddleware, generateDynamicItinerary);
router.get('/generate', authMiddleware, generateDynamicItinerary);

module.exports = router;
