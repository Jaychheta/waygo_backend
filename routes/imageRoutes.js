const express = require('express');
const axios = require('axios');
const router = express.Router();

const imageCache = new Map();

// Curated city → Unsplash photo IDs for top travel destinations
// These are high-quality, reliable landmark photos
const CITY_PHOTO_MAP = {
  // Asia
  'tokyo':        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&fit=crop',
  'japan':        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&fit=crop',
  'osaka':        'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&fit=crop',
  'kyoto':        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&fit=crop',
  'seoul':        'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&fit=crop',
  'korea':        'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&fit=crop',
  'beijing':      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&fit=crop',
  'shanghai':     'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=800&fit=crop',
  'china':        'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&fit=crop',
  'bangkok':      'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&fit=crop',
  'thailand':     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop',
  'singapore':    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&fit=crop',
  'bali':         'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&fit=crop',
  'indonesia':    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&fit=crop',
  'dubai':        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&fit=crop',
  'uae':          'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&fit=crop',
  'maldives':     'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&fit=crop',
  'vietnam':      'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&fit=crop',
  'hanoi':        'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&fit=crop',
  'ho chi minh':  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&fit=crop',
  'hong kong':    'https://images.unsplash.com/photo-1576788369575-a6be0d038bdd?w=800&fit=crop',
  'taiwan':       'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&fit=crop',
  'taipei':       'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&fit=crop',
  'nepal':        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop',
  'kathmandu':    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop',
  'sri lanka':    'https://images.unsplash.com/photo-1578074847218-a9a9c2b0e0e1?w=800&fit=crop',
  'colombo':      'https://images.unsplash.com/photo-1578074847218-a9a9c2b0e0e1?w=800&fit=crop',
  'bhutan':       'https://images.unsplash.com/photo-1527838832700-5059252f4940?w=800&fit=crop',
  'myanmar':      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&fit=crop',
  'cambodia':     'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&fit=crop',
  'angkor':       'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&fit=crop',

  // India
  'goa':          'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=800&fit=crop',
  'mumbai':       'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&fit=crop',
  'delhi':        'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&fit=crop',
  'new delhi':    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&fit=crop',
  'jaipur':       'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&fit=crop',
  'agra':         'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&fit=crop',
  'taj mahal':    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&fit=crop',
  'varanasi':     'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&fit=crop',
  'kerala':       'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&fit=crop',
  'kochi':        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&fit=crop',
  'bangalore':    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&fit=crop',
  'bengaluru':    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&fit=crop',
  'hyderabad':    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&fit=crop',
  'chennai':      'https://images.unsplash.com/photo-1616498712450-bc48935d6e6c?w=800&fit=crop',
  'kolkata':      'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&fit=crop',
  'pune':         'https://images.unsplash.com/photo-1567445961397-65e87b8e9a5b?w=800&fit=crop',
  'shimla':       'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&fit=crop',
  'manali':       'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&fit=crop',
  'darjeeling':   'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop',
  'rishikesh':    'https://images.unsplash.com/photo-1572382489070-c6a4e9f14e7c?w=800&fit=crop',
  'amritsar':     'https://images.unsplash.com/photo-1615645406693-f9eedde05aaa?w=800&fit=crop',
  'golden temple':'https://images.unsplash.com/photo-1615645406693-f9eedde05aaa?w=800&fit=crop',
  'udaipur':      'https://images.unsplash.com/photo-1568454537842-d933259bb258?w=800&fit=crop',
  'jodhpur':      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&fit=crop',
  'mysore':       'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&fit=crop',
  'leh':          'https://images.unsplash.com/photo-1571049963079-b8b5a6d19fd1?w=800&fit=crop',
  'ladakh':       'https://images.unsplash.com/photo-1571049963079-b8b5a6d19fd1?w=800&fit=crop',

  // Europe
  'paris':        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&fit=crop',
  'france':       'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&fit=crop',
  'london':       'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&fit=crop',
  'uk':           'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&fit=crop',
  'rome':         'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800&fit=crop',
  'italy':        'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&fit=crop',
  'barcelona':    'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&fit=crop',
  'spain':        'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&fit=crop',
  'amsterdam':    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&fit=crop',
  'netherlands':  'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&fit=crop',
  'berlin':       'https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=800&fit=crop',
  'germany':      'https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=800&fit=crop',
  'prague':       'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&fit=crop',
  'vienna':       'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&fit=crop',
  'zurich':       'https://images.unsplash.com/photo-1548783280-d1eb2e2b70ba?w=800&fit=crop',
  'switzerland':  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&fit=crop',
  'santorini':    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&fit=crop',
  'greece':       'https://images.unsplash.com/photo-1503152394-c571994fd383?w=800&fit=crop',
  'athens':       'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&fit=crop',
  'venice':       'https://images.unsplash.com/photo-1512832084369-ad4f4ffe63f6?w=800&fit=crop',
  'florence':     'https://images.unsplash.com/photo-1541343672885-9be56236302a?w=800&fit=crop',
  'lisbon':       'https://images.unsplash.com/photo-1585208798174-6cedd4454a15?w=800&fit=crop',
  'portugal':     'https://images.unsplash.com/photo-1585208798174-6cedd4454a15?w=800&fit=crop',
  'istanbul':     'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop',
  'turkey':       'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&fit=crop',
  'copenhagen':   'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&fit=crop',
  'stockholm':    'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800&fit=crop',
  'oslo':         'https://images.unsplash.com/photo-1512852939750-1305098529bf?w=800&fit=crop',
  'norway':       'https://images.unsplash.com/photo-1601439678777-b2b3c56fa627?w=800&fit=crop',
  'edinburgh':    'https://images.unsplash.com/photo-1562790879-a0cfb8e95cf8?w=800&fit=crop',
  'scotland':     'https://images.unsplash.com/photo-1562790879-a0cfb8e95cf8?w=800&fit=crop',
  'budapest':     'https://images.unsplash.com/photo-1565426873118-a17ed65d74b9?w=800&fit=crop',
  'hungary':      'https://images.unsplash.com/photo-1565426873118-a17ed65d74b9?w=800&fit=crop',
  'brussels':     'https://images.unsplash.com/photo-1558178272-2c4233afc9e5?w=800&fit=crop',
  'belgium':      'https://images.unsplash.com/photo-1558178272-2c4233afc9e5?w=800&fit=crop',
  'dubai':        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&fit=crop',
  'moscow':       'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&fit=crop',
  'russia':       'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&fit=crop',

  // Americas
  'new york':     'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&fit=crop',
  'nyc':          'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&fit=crop',
  'usa':          'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&fit=crop',
  'los angeles':  'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&fit=crop',
  'las vegas':    'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&fit=crop',
  'chicago':      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&fit=crop',
  'san francisco':'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&fit=crop',
  'miami':        'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&fit=crop',
  'cancun':       'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&fit=crop',
  'mexico':       'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&fit=crop',
  'brazil':       'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&fit=crop',
  'rio':          'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&fit=crop',
  'buenos aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&fit=crop',
  'argentina':    'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&fit=crop',
  'toronto':      'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800&fit=crop',
  'canada':       'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800&fit=crop',
  'vancouver':    'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800&fit=crop',
  'peru':         'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&fit=crop',
  'machu picchu': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&fit=crop',

  // Africa / Middle East
  'cairo':        'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&fit=crop',
  'egypt':        'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&fit=crop',
  'cape town':    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&fit=crop',
  'south africa': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&fit=crop',
  'marrakech':    'https://images.unsplash.com/photo-1597212618440-806262de4f5b?w=800&fit=crop',
  'morocco':      'https://images.unsplash.com/photo-1597212618440-806262de4f5b?w=800&fit=crop',
  'nairobi':      'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&fit=crop',
  'kenya':        'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&fit=crop',
  'safari':       'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&fit=crop',
  'tanzania':     'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&fit=crop',
  'riyadh':       'https://images.unsplash.com/photo-1590694343014-f07d2f1fee21?w=800&fit=crop',
  'saudi':        'https://images.unsplash.com/photo-1590694343014-f07d2f1fee21?w=800&fit=crop',
  'tel aviv':     'https://images.unsplash.com/photo-1574868934318-85b37d4d3b3e?w=800&fit=crop',
  'israel':       'https://images.unsplash.com/photo-1574868934318-85b37d4d3b3e?w=800&fit=crop',

  // Oceania
  'sydney':       'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&fit=crop',
  'australia':    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&fit=crop',
  'melbourne':    'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&fit=crop',
  'new zealand':  'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&fit=crop',
  'auckland':     'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&fit=crop',
  'fiji':         'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=800&fit=crop',
  'surat':        'https://images.unsplash.com/photo-1596422846543-75c6fc18a5ce?w=800&fit=crop',
};

// Themed category fallbacks
const CATEGORY_FALLBACKS = {
  beach:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop',
  mountain: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&fit=crop',
  desert:   'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&fit=crop',
  city:     'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&fit=crop',
  forest:   'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&fit=crop',
  default:  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&fit=crop', // airplane/travel
};

function findCityMatch(input) {
  const lower = input.toLowerCase().trim();
  // Exact match
  if (CITY_PHOTO_MAP[lower]) return CITY_PHOTO_MAP[lower];
  // Partial match (destination contains or is contained by key)
  for (const [key, url] of Object.entries(CITY_PHOTO_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return url;
  }
  return null;
}

router.get('/place-image', async (req, res) => {
  try {
    const { place, city } = req.query;
    if (!place) return res.status(400).json({ error: 'Place is required' });

    const cacheKey = `${place.toLowerCase()}|${(city || '').toLowerCase()}`;
    if (imageCache.has(cacheKey)) {
      return res.json({ imageUrl: imageCache.get(cacheKey) });
    }

    // 1. Try Wikipedia REST API for landmarks (most accurate)
    let imageUrl = null;
    const isOnlyCity = place.toLowerCase().trim() === (city || '').toLowerCase().trim();

    if (!isOnlyCity) {
      const cleanPlace = place.split(',')[0].trim();
      const cleanCity  = (city || '').split(',')[0].trim();
      
      const getWikiSummary = async (title) => {
        try {
          const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
          const resp = await axios.get(url, { headers: { 'User-Agent': 'WayGoApp/1.0' }, timeout: 4000 });
          const thumb = resp.data?.thumbnail?.source || resp.data?.originalimage?.source;
          if (thumb && !/flag|coat|arms|emblem|crest|seal/i.test(thumb)) return thumb;
          return null;
        } catch (err) { return null; }
      };

      imageUrl = await getWikiSummary(cleanPlace);
      if (!imageUrl && cleanCity) imageUrl = await getWikiSummary(`${cleanPlace}, ${cleanCity}`);
      if (!imageUrl) imageUrl = await getWikiSummary(cleanPlace.replace(/\s+/g, '_'));
    }

    // 2. Fallback to curated city map if it's a city or wiki failed
    if (!imageUrl) {
        imageUrl = findCityMatch(place) || (city ? findCityMatch(city) : null);
    }

    // 3. Keyword-based theme fallback
    if (!imageUrl) {
      const low = `${place} ${city || ''}`.toLowerCase();
      if (/beach|coast|sea|ocean|island/.test(low))          imageUrl = CATEGORY_FALLBACKS.beach;
      else if (/mountain|hill|peak|alp|himala/.test(low))    imageUrl = CATEGORY_FALLBACKS.mountain;
      else if (/desert|sahara|sand dune/.test(low))          imageUrl = CATEGORY_FALLBACKS.desert;
      else if (/forest|jungle|rainforest|woods/.test(low))   imageUrl = CATEGORY_FALLBACKS.forest;
      else                                                    imageUrl = CATEGORY_FALLBACKS.city;
    }

    imageCache.set(cacheKey, imageUrl);
    res.json({ imageUrl });

  } catch (error) {
    console.error('Image Proxy Error:', error.message);
    res.json({ imageUrl: CATEGORY_FALLBACKS.default });
  }
});

module.exports = router;
