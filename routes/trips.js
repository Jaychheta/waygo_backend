const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Destination Image Fetcher ─────────────────────────────────────────────────
// Reuses same logic as imageRoutes so we can persist cover_image_url at creation
const CITY_PHOTO_MAP = {
  'tokyo':'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&fit=crop',
  'japan':'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&fit=crop',
  'osaka':'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&fit=crop',
  'kyoto':'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&fit=crop',
  'seoul':'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&fit=crop',
  'beijing':'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&fit=crop',
  'shanghai':'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=800&fit=crop',
  'bangkok':'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&fit=crop',
  'singapore':'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&fit=crop',
  'bali':'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&fit=crop',
  'dubai':'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&fit=crop',
  'maldives':'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&fit=crop',
  'vietnam':'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&fit=crop',
  'hanoi':'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&fit=crop',
  'hong kong':'https://images.unsplash.com/photo-1576788369575-a6be0d038bdd?w=800&fit=crop',
  'taiwan':'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&fit=crop',
  'nepal':'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop',
  'cambodia':'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&fit=crop',
  // India
  'goa':'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=800&fit=crop',
  'mumbai':'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&fit=crop',
  'delhi':'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&fit=crop',
  'new delhi':'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&fit=crop',
  'jaipur':'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&fit=crop',
  'agra':'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&fit=crop',
  'varanasi':'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&fit=crop',
  'kerala':'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&fit=crop',
  'bangalore':'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&fit=crop',
  'hyderabad':'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&fit=crop',
  'chennai':'https://images.unsplash.com/photo-1616498712450-bc48935d6e6c?w=800&fit=crop',
  'kolkata':'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&fit=crop',
  'shimla':'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&fit=crop',
  'manali':'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&fit=crop',
  'rishikesh':'https://images.unsplash.com/photo-1572382489070-c6a4e9f14e7c?w=800&fit=crop',
  'amritsar':'https://images.unsplash.com/photo-1615645406693-f9eedde05aaa?w=800&fit=crop',
  'udaipur':'https://images.unsplash.com/photo-1568454537842-d933259bb258?w=800&fit=crop',
  'leh':'https://images.unsplash.com/photo-1571049963079-b8b5a6d19fd1?w=800&fit=crop',
  'ladakh':'https://images.unsplash.com/photo-1571049963079-b8b5a6d19fd1?w=800&fit=crop',
  // Europe
  'paris':'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&fit=crop',
  'london':'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&fit=crop',
  'rome':'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800&fit=crop',
  'barcelona':'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&fit=crop',
  'amsterdam':'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&fit=crop',
  'berlin':'https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=800&fit=crop',
  'prague':'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&fit=crop',
  'santorini':'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&fit=crop',
  'venice':'https://images.unsplash.com/photo-1512832084369-ad4f4ffe63f6?w=800&fit=crop',
  'lisbon':'https://images.unsplash.com/photo-1585208798174-6cedd4454a15?w=800&fit=crop',
  'istanbul':'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop',
  'zurich':'https://images.unsplash.com/photo-1548783280-d1eb2e2b70ba?w=800&fit=crop',
  'budapest':'https://images.unsplash.com/photo-1565426873118-a17ed65d74b9?w=800&fit=crop',
  // Americas
  'new york':'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&fit=crop',
  'los angeles':'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&fit=crop',
  'las vegas':'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&fit=crop',
  'miami':'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&fit=crop',
  'cancun':'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&fit=crop',
  'rio':'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&fit=crop',
  'toronto':'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800&fit=crop',
  'machu picchu':'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&fit=crop',
  // Africa / Middle East
  'cairo':'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&fit=crop',
  'cape town':'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&fit=crop',
  'marrakech':'https://images.unsplash.com/photo-1597212618440-806262de4f5b?w=800&fit=crop',
  'safari':'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&fit=crop',
  // Oceania
  'sydney':'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&fit=crop',
  'melbourne':'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&fit=crop',
  'new zealand':'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&fit=crop',
  'bali':'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&fit=crop',
  'surat':'https://images.unsplash.com/photo-1596422846543-75c6fc18a5ce?w=800&fit=crop',
};

async function fetchDestinationImage(destination) {
  if (!destination) return 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&fit=crop';
  const lower = destination.toLowerCase().trim();

  // 1. Exact and partial match in curated map
  if (CITY_PHOTO_MAP[lower]) return CITY_PHOTO_MAP[lower];
  for (const [key, url] of Object.entries(CITY_PHOTO_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return url;
  }

  // 2. Wikipedia REST API — returns thumbnail for city/landmark pages
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(destination)}`;
    const resp = await axios.get(wikiUrl, { headers: { 'User-Agent': 'WayGoApp/1.0' }, timeout: 5000 });
    const thumb = resp.data?.thumbnail?.source || resp.data?.originalimage?.source;
    if (thumb && !/flag|coat|arms|emblem|crest|seal/i.test(thumb)) return thumb;
  } catch (_) {}

  // 3. Keyword fallback
  if (/beach|coast|sea|island/.test(lower)) return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop';
  if (/mountain|hill|peak|himala/.test(lower)) return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&fit=crop';
  if (/forest|jungle|park/.test(lower)) return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&fit=crop';

  // 4. Unsplash search as last resort (random real photo)
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(lower)},travel,city`;
}

// ── JWT Auth Middleware ────────────────────────────────────────────────────────
// Note: In a larger app, this should be moved to a separate middleware file.
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        // Use environment variable instead of hardcoded secret
        const secret = process.env.JWT_SECRET || 'waygo_secret_key'; 
        const decoded = jwt.verify(token, secret);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// ── Helper: Verify Trip Ownership ──────────────────────────────────────────────
async function verifyTripOwnership(req, res, next) {
    try {
        const tripId = req.params.trip_id || req.body.trip_id;
        if (!tripId) return res.status(400).json({ message: 'Trip ID is required' });

        const result = await pool.query(
            'SELECT user_id FROM trips WHERE id = $1',
            [tripId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        if (result.rows[0].user_id !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized access to this trip' });
        }

        next();
    } catch (err) {
        console.error('Ownership verification error:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Model Fallback Chain ──────────────────────────────────────────────────────
const MODEL_FALLBACK_CHAIN = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
];

// ── Unique Place Image Fetcher (Common) ──────────────────────────────────────
async function fetchPlaceImage(placeName, city) {
    const safePlace = (placeName || '').trim();
    const safeCity = (city || '').trim().split(',')[0].trim();
    if (!safePlace) return '';

    // 1. Try Wikipedia REST API with multiple query variations
    const queries = [
        `${safePlace} ${safeCity}`,
        safePlace,
        safePlace.replace(/\s+/g, '_'),
    ];

    for (const q of queries) {
        try {
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
            const resp = await axios.get(url, { headers: { 'User-Agent': 'WayGoApp/1.0' }, timeout: 4000 });
            const thumb = resp.data?.thumbnail?.source || resp.data?.originalimage?.source;
            if (thumb && !/flag|coat|arms|emblem|crest|seal/i.test(thumb)) return thumb;
        } catch (_) {}
    }

    // 2. Curated City Fallback (Real city photos for popular destinations)
    const findCityMatch = (p) => {
        const low = (p || '').toLowerCase();
        for (const [key, url] of Object.entries(CITY_PHOTO_MAP)) {
            if (low.includes(key) || key.includes(low)) return url;
        }
        return null;
    };

    const cityPhoto = findCityMatch(safeCity) || findCityMatch(safePlace);
    if (cityPhoto) return cityPhoto;

    // 3. Last resort placeholder (Real-looking travel photography)
    const keyword = encodeURIComponent(`${safePlace} ${safeCity}`.trim());
    return `https://loremflickr.com/800/600/city,travel,${keyword}?lock=${Math.floor(Math.random() * 500)}`;
}

async function enrichDaysWithImages(days, destination) {
    return Promise.all(days.map(async (day) => ({
        ...day,
        places: await Promise.all(day.places.map(async (p) => ({
            ...p,
            image_url: await fetchPlaceImage(p.placeName || p.name, destination).catch(() => ''),
        }))),
    })));
}

// ── Mock Fallback Itinerary ───────────────────────────────────────────────────
function getMockItinerary(location, days) {
    const numDays = parseInt(days, 10) || 2;
    const themes = ["Heritage & Icons", "Culinary Delights", "Nature & Views", "Arts & Culture", "Hidden Gems"];
    const result = [];
    for (let d = 1; d <= numDays; d++) {
        result.push({
            day: d,
            theme: themes[(d - 1) % themes.length],
            places: [
                {
                    time: "09:00 AM",
                    placeName: `${location} Discovery`,
                    description: `Start your Day ${d} in ${location} exploring local landmarks.`,
                    location: `${location} Center`,
                    rating: 4.7,
                    isPopular: true,
                    travelTime: 20,
                }
            ],
        });
    }
    return result;
}

async function tryModel(modelName, prompt) {
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
    });
    const result = await model.generateContent(prompt);
    if (!result || !result.response) throw new Error("Empty response from Gemini");
    const rawText = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(rawText);
}

function isSkippableError(err) {
    const msg = (err.message || "").toLowerCase();
    const code = err.status || err.statusCode || 0;
    return (code === 429 || msg.includes("quota") || code === 404 || msg.includes("not found"));
}

// ૧. AI Plan Generator — NOW SECURED
router.get('/generate-ai-plan', authMiddleware, async (req, res) => {
    const { location, days } = req.query;
    if (!location || !days) return res.status(400).json({ error: "Missing location or days." });

    const numberOfDays = Math.min(Math.max(parseInt(days, 10) || 1, 1), 14);
    const prompt = `Generate a ${numberOfDays}-day travel itinerary for ${location}. Return JSON only. Format: { tripTitle, days: [ { day, theme, places: [{time, name, description, category, rating}] } ] }`;

    for (const modelName of MODEL_FALLBACK_CHAIN) {
        try {
            const rawResponse = await tryModel(modelName, prompt);
            const rawDaysArray = Array.isArray(rawResponse) ? rawResponse : (rawResponse.days || []);
            const validatedItinerary = rawDaysArray.map((dayObj, idx) => ({
                day: parseInt(dayObj.day || (idx + 1)),
                theme: dayObj.theme || `Day ${idx + 1} Explore`,
                places: (dayObj.places || []).map(p => ({
                    time: p.time || "09:00 AM",
                    placeName: p.name || p.placeName || "Spot",
                    description: p.description || "Visit this place.",
                    location: p.location || location,
                    rating: parseFloat(p.rating) || 4.5,
                    isPopular: true,
                    travelTime: 15,
                    category: p.category || "General",
                }))
            }));
            
            // Enrich with unique images
            const enriched = await enrichDaysWithImages(validatedItinerary, location);
            return res.json(enriched);
        } catch (err) {
            if (isSkippableError(err)) continue;
            console.error(`Error with ${modelName}:`, err.message);
        }
    }
    const mock = getMockItinerary(location, numberOfDays);
    const enrichedMock = await enrichDaysWithImages(mock, location);
    return res.json(enrichedMock);
});

// ૨. CREATE TRIP — SECURED + REAL DESTINATION IMAGE
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { name, start_date, end_date, location } = req.body;
        const user_id = req.userId;
        if (!name || !start_date || !end_date) return res.status(400).json({ message: 'Missing fields' });

        // Fetch real destination image (non-blocking — won't fail the trip creation)
        const cover_image_url = await fetchDestinationImage(location || name).catch(() => null);

        const newTrip = await pool.query(
            'INSERT INTO trips (user_id, name, start_date, end_date, location, cover_image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [user_id, name, start_date, end_date, location, cover_image_url]
        );
        res.json({ success: true, trip: newTrip.rows[0] });
    } catch (err) {
        console.error('Create trip error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create trip.' });
    }
});

// ૩. ADD PLACE — SECURED & OWNERSHIP VERIFIED
router.post('/add-place', authMiddleware, verifyTripOwnership, async (req, res) => {
    try {
        const { trip_id, place_data } = req.body;
        await pool.query(
            'INSERT INTO trip_places (trip_id, place_data) VALUES ($1, $2::json)',
            [trip_id, JSON.stringify(place_data)]
        );
        res.json({ success: true, message: "Place added!" });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error adding place.' });
    }
});

// ૪. VIEW PLACES — SECURED & OWNERSHIP VERIFIED
router.get('/trip/:trip_id/places', authMiddleware, verifyTripOwnership, async (req, res) => {
    try {
        const { trip_id } = req.params;
        const result = await pool.query('SELECT place_data FROM trip_places WHERE trip_id = $1', [trip_id]);
        res.json(result.rows.map(row => row.place_data));
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching places.' });
    }
});

// ૫. ADD EXPENSE — SECURED & OWNERSHIP VERIFIED
router.post('/add-expense', authMiddleware, verifyTripOwnership, async (req, res) => {
    try {
        const { trip_id, title, amount, category } = req.body;
        await pool.query(
            'INSERT INTO trip_expenses (trip_id, title, amount, category) VALUES ($1, $2, $3, $4)',
            [trip_id, title, amount, category || 'Others']
        );
        res.json({ success: true, message: "Expense added!" });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error adding expense.' });
    }
});

// ૬. VIEW EXPENSES — SECURED & OWNERSHIP VERIFIED
router.get('/trip/:trip_id/expenses', authMiddleware, verifyTripOwnership, async (req, res) => {
    try {
        const { trip_id } = req.params;
        const result = await pool.query(
            'SELECT * FROM trip_expenses WHERE trip_id = $1 ORDER BY id DESC',
            [trip_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching expenses.' });
    }
});

// ૭. LOGGED-IN USER TRIPS
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const allTrips = await pool.query(
            'SELECT * FROM trips WHERE user_id = $1 ORDER BY start_date DESC',
            [req.userId]
        );
        res.json(allTrips.rows);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ૮. FALLBACK USER TRIPS — REMOVED PUBLIC TRIPS BY ID (SECURITY PRIVACY FIX)
// Instead of a public route, we now rely strictly on /my or authenticated user checks.
router.get('/user/:user_id', authMiddleware, async (req, res) => {
    try {
        const { user_id } = req.params;
        if (parseInt(user_id) !== req.userId) {
            return res.status(403).json({ message: 'Cannot view other users trips' });
        }
        const result = await pool.query('SELECT * FROM trips WHERE user_id = $1 ORDER BY start_date DESC', [user_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

// ૯. SAVE FULL ITINERARY — NEW ENDPOINT (Requested by frontend)
router.post('/ai/save-full', authMiddleware, async (req, res) => {
    try {
        const { userId, name, startDate, endDate, dayPlans } = req.body;
        const user_id = req.userId; // Use token userId for security

        // 1. Create the main trip record
        const cover_image_url = await fetchDestinationImage(name).catch(() => null);
        const tripResult = await pool.query(
            'INSERT INTO trips (user_id, name, start_date, end_date, location, cover_image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [user_id, name, startDate, endDate, name, cover_image_url]
        );
        const tripId = tripResult.rows[0].id;

        // 2. Save all places from dayPlans
        // We store it as one record per place-block if we follow the current schema
        for (const day of dayPlans) {
            for (const place of (day.places || day.activities || [])) {
                await pool.query(
                    'INSERT INTO trip_places (trip_id, place_data) VALUES ($1, $2::json)',
                    [tripId, JSON.stringify({ ...place, day: day.day, theme: day.theme })]
                );
            }
        }

        res.json({ success: true, tripId, message: "Full itinerary saved successfully!" });
    } catch (err) {
        console.error('Save full itinerary error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to save full itinerary.' });
    }
});

module.exports = router;