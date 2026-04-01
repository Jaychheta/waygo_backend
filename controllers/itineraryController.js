const Groq = require("groq-sdk");
const axios = require("axios");

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "llama-3.3-70b-versatile"; // ✅ Free, fast, smart

// ── Unique Place Image Fetcher ────────────────────────────────────────────────
// Uses Wikipedia REST API (no key needed) to get a SPECIFIC photo for each place.
// Falls back to Unsplash search by place name.
async function fetchPlaceImage(placeName, city) {
    const safePlace = (placeName || '').trim();
    const safeCity  = (city || '').trim();
    if (!safePlace) return '';

    // 1. Try Wikipedia REST API for specific place (most accurate)
    const queries = [
        `${safePlace} ${safeCity}`,
        safePlace,
        `${safePlace} ${safeCity.split(',')[0].trim()}`,
    ];
    for (const q of queries) {
        try {
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
            const resp = await axios.get(url, { headers: { 'User-Agent': 'WayGoApp/1.0' }, timeout: 4000 });
            const thumb = resp.data?.thumbnail?.source || resp.data?.originalimage?.source;
            // Filter out flag/coat-of-arms images
            if (thumb && !/flag|coat|arms|emblem|crest|seal/i.test(thumb)) {
                return thumb;
            }
        } catch (_) {}
    }

    // 2. Unsplash search by place name (free, no key, redirect to real photo)
    const encoded = encodeURIComponent(`${safePlace} ${safeCity}`.trim());
    return `https://source.unsplash.com/800x600/?${encoded}`;
}

// Enrich all places in days array with unique image_url (runs in parallel per day)
async function enrichDaysWithImages(days, destination) {
    return Promise.all(days.map(async (day) => ({
        ...day,
        places: await Promise.all(day.places.map(async (p) => ({
            ...p,
            image_url: await fetchPlaceImage(p.name || p.placeName, destination).catch(() => ''),
        }))),
    })));
}

// ── Mock Fallback Itinerary ──────────────────────────────────────────────────
function getMockItinerary(destination, days) {
    const numDays = parseInt(days, 10) || 2;
    const fallbackPools = {
        "mumbai": {
            themes: ["Heritage & Icons", "Culinary Trail", "Art & Architecture", "Coastal Vibes", "Markets & Culture"],
            days: [
                [
                    { time: "09:00 AM", name: "Gateway of India", description: "An iconic arch-monument overlooking the Arabian Sea, built in 1924.", category: "Heritage", rating: 4.8 },
                    { time: "11:00 AM", name: "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", description: "One of India's premier museums with art, archaeology and natural history.", category: "Culture", rating: 4.7 },
                    { time: "01:00 PM", name: "Leopold Cafe", description: "A legendary 1871 café famous for its Irani chai and Colaba vibe.", category: "Food", rating: 4.4 },
                    { time: "04:00 PM", name: "Marine Drive", description: "The sweeping 3.6 km promenade known as the Queen's Necklace at night.", category: "Nature", rating: 4.7 },
                    { time: "07:00 PM", name: "Haji Ali Dargah", description: "A stunning 15th-century mosque set on an islet in the Arabian Sea.", category: "Heritage", rating: 4.6 },
                ],
                [
                    { time: "09:00 AM", name: "Elephanta Caves", description: "UNESCO World Heritage rock-cut cave temples on Elephanta Island.", category: "Heritage", rating: 4.6 },
                    { time: "11:00 AM", name: "Bandra-Worli Sea Link", description: "An engineering marvel cable-stayed bridge linking Bandra to Worli.", category: "Architecture", rating: 4.5 },
                    { time: "01:00 PM", name: "Britannia & Co.", description: "A 100-year-old Parsi restaurant in Ballard Estate famous for berry pulao.", category: "Food", rating: 4.6 },
                    { time: "04:00 PM", name: "Sanjay Gandhi National Park", description: "A 104 sq km urban national park with Kanheri Caves inside.", category: "Nature", rating: 4.5 },
                    { time: "07:00 PM", name: "Juhu Beach", description: "Mumbai's most famous beach, buzzing with street food stalls at sunset.", category: "Entertainment", rating: 4.3 },
                ],
            ],
        },
        "delhi": {
            themes: ["Mughal Marvels", "Historic Delhi", "Food & Bazaars", "Modern Delhi", "Sacred Sites"],
            days: [
                [
                    { time: "09:00 AM", name: "Red Fort", description: "UNESCO-listed 17th-century Mughal fort of red sandstone in Old Delhi.", category: "Heritage", rating: 4.6 },
                    { time: "11:00 AM", name: "Jama Masjid", description: "One of the largest mosques in India, built by Shah Jahan in 1656.", category: "Heritage", rating: 4.5 },
                    { time: "01:00 PM", name: "Karim's", description: "Iconic Mughlai restaurant near Jama Masjid, operating since 1913.", category: "Food", rating: 4.5 },
                    { time: "04:00 PM", name: "Humayun's Tomb", description: "Stunning Mughal garden tomb and UNESCO World Heritage Site built in 1570.", category: "Heritage", rating: 4.7 },
                    { time: "07:00 PM", name: "India Gate", description: "42-metre war memorial archway on Rajpath, illuminated beautifully at night.", category: "Heritage", rating: 4.7 },
                ],
            ],
        },
    };

    const key = destination.toLowerCase().trim().split(",")[0].trim();
    const pool = fallbackPools[key];
    const result = [];

    if (pool) {
        for (let d = 1; d <= numDays; d++) {
            const dayData = pool.days[(d - 1) % pool.days.length];
            result.push({
                day: d,
                theme: pool.themes[(d - 1) % pool.themes.length],
                places: dayData.map(p => ({
                    ...p,
                    placeName: p.name,
                    location: destination,
                    isPopular: p.category === "Heritage" || p.category === "Food",
                    travelTime: 0,
                })),
            });
        }
    } else {
        const genericDay = [
            { time: "09:00 AM", name: "Amber Palace", description: "A majestic clifftop fort.", category: "Heritage", rating: 4.8 },
            { time: "11:00 AM", name: "City Center", description: "A vibrant local hub.", category: "Culture", rating: 4.4 },
            { time: "01:00 PM", name: "Leopold Cafe", description: "Historic restaurant.", category: "Food", rating: 4.5 },
            { time: "04:00 PM", name: "Sunset Point", description: "Beautiful views.", category: "Nature", rating: 4.6 },
            { time: "07:00 PM", name: "Old Quarter", description: "Historic walk.", category: "Culture", rating: 4.3 }
        ];
        for (let d = 1; d <= numDays; d++) {
            result.push({
                day: d,
                theme: "City Exploration",
                places: genericDay.map(p => ({ ...p, placeName: p.name, location: destination }))
            });
        }
    }

    return { tripTitle: `${numDays}-Day ${destination} Adventure`, days: result };
}

// ── Main Controller ──────────────────────────────────────────────────────────
const generateDynamicItinerary = async (req, res) => {
    try {
        const destination = req.body.destination || req.query.location || req.query.destination;
        const days = req.body.days || req.query.days;

        if (!destination || !days) {
            return res.status(400).json({ success: false, message: "Destination and days are required." });
        }

        const numberOfDays = Math.min(Math.max(parseInt(days, 10) || 1, 1), 14);
        console.log(`📅 Generating ${numberOfDays}-day itinerary for "${destination}"`);

        const prompt = `You are an expert travel planner for WayGo.
Generate a ${numberOfDays}-day travel itinerary for "${destination}".

CRITICAL RULES:
1. Return ONLY valid JSON. No explanation, no markdown, no code fences.
2. Every place MUST be physically located in "${destination}".
3. No place can be repeated across any day.
4. Use REAL, verifiable landmark names.
${numberOfDays > 7 ? '5. IMPORTANT: For this long trip (${numberOfDays} days), keep descriptions very concise (max 10 words) to avoid response truncation.' : ''}

REQUIRED JSON FORMAT:
{
  "destination": "${destination}",
  "tripTitle": "${numberOfDays}-Day ${destination} Trip",
  "days": [
    {
      "day": 1,
      "title": "Theme",
      "places": [
        {
          "time": "09:00 AM",
          "name": "Name",
          "description": "Short description.",
          "category": "Heritage",
          "rating": 4.5
        }
      ]
    }
  ]
}

Rules for places array: exactly 5 places per day at times: 09:00 AM, 11:00 AM, 01:00 PM, 04:00 PM, 07:00 PM.
Category must be one of: Heritage, Food, Nature, Entertainment, Culture.`;

        try {
            console.log(`🤖 Attempting Groq API call (${GROQ_MODEL})...`);

            const chatCompletion = await groq.chat.completions.create({
                model: GROQ_MODEL,
                max_tokens: 8192,
                temperature: 0.6,
                messages: [
                    {
                        role: "system",
                        content: "You are a travel planning expert. Always respond with valid JSON only. Keep responses within token limits."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
            });

            // Parse response safely — strip ```json fences if present
            let rawText = chatCompletion.choices[0]?.message?.content || "";
            rawText = rawText.replace(/```json|```/g, "").trim();
            const parsedData = JSON.parse(rawText);

            // Normalize structure for Flutter frontend
            const validatedDays = parsedData.days.map(d => ({
                day: d.day,
                theme: d.title || "Daily Highlights",
                places: d.places.map(p => ({
                    ...p,
                    placeName: p.name,
                    location: destination,
                    isPopular: ["Heritage", "Food"].includes(p.category),
                    travelTime: 0
                }))
            }));

            // Hallucination guard
            const majorOutsiders = [
                { name: "taj mahal", city: "agra" },
                { name: "hawa mahal", city: "jaipur" },
                { name: "red fort", city: "delhi" },
                { name: "gateway of india", city: "mumbai" }
            ];
            const destLower = destination.toLowerCase();

            for (const day of validatedDays) {
                for (const place of day.places) {
                    const pName = place.name.toLowerCase();
                    for (const outsider of majorOutsiders) {
                        if (!destLower.includes(outsider.city) && pName.includes(outsider.name)) {
                            console.error(`🚨 Hallucination guard triggered: [${place.name}] does not belong in [${destination}]`);
                            throw new Error("Location Hallucination Detected");
                        }
                    }
                }
            }

            console.log(`✅ Groq AI success! (${validatedDays.length} days generated for "${destination}")`);

            // Enrich each place with its OWN unique image
            const enrichedDays = await enrichDaysWithImages(validatedDays, destination);

            return res.status(200).json({
                success: true,
                data: {
                    tripTitle: parsedData.tripTitle || `${numberOfDays}-Day ${destination} Trip`,
                    days: enrichedDays
                }
            });

        } catch (apiErr) {
            console.warn(`⚠️ Groq API failed: ${apiErr.message}`);
        }

        // Fallback to mock — also enrich with images
        console.warn(`🆘 All AI models exhausted. Serving mock itinerary for "${destination}".`);
        const mockData = getMockItinerary(destination, numberOfDays);
        const enrichedMock = await enrichDaysWithImages(mockData.days, destination);
        return res.status(200).json({
            success: true,
            data: { ...mockData, days: enrichedMock }
        });

    } catch (globalErr) {
        console.error("🆘 Hard Failure in Itinerary Controller:", globalErr.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate itinerary.",
            error: globalErr.message
        });
    }
};

module.exports = { generateDynamicItinerary };