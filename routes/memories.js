const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for saving memory photos
const uploadDir = 'uploads/memories';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'mem-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ── GET MEMORIES BY TRIP (all members) ────────────────────────────────────────
router.get('/trip/:trip_name', async (req, res) => {
  try {
    const { trip_name } = req.params;
    const result = await pool.query(
      `SELECT m.*, u.name as uploader_name 
       FROM memories m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.trip_name = $1 
       ORDER BY m.date DESC`,
      [decodeURIComponent(trip_name)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch trip memories error:', err.message);
    res.status(500).json([]);
  }
});

// ── GET MEMORIES (own only) ───────────────────────────────────────────────────
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM memories WHERE user_id = $1 ORDER BY date DESC',
      [user_id]
    );
    
    // Return relative paths, frontend will resolve them using ApiConfig.baseUrl
    const memories = result.rows.map(row => ({
      ...row,
      image_url: row.image_url, 
    }));
    
    res.json(memories);
  } catch (err) {
    console.error('Fetch memories error:', err.message);
    res.status(500).json([]);
  }
});

// ── UPLOAD MEMORY ────────────────────────────────────────────────────────────
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { user_id, trip_name } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No image provided.' });
    }

    const imageUrl = file.path.replace(/\\/g, '/'); // Use forward slashes

    await pool.query(
      'INSERT INTO memories (user_id, trip_name, image_url) VALUES ($1, $2, $3)',
      [user_id, trip_name || 'Global Expedition', imageUrl]
    );

    res.json({ success: true, message: 'Memory saved!' });
  } catch (err) {
    console.error('Upload memory error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upload.' });
  }
});

// ── DELETE MEMORY ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT image_url FROM memories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Memory not found.' });
    }
    const imageUrl = result.rows[0].image_url;
    // Delete file from disk
    if (imageUrl && !imageUrl.startsWith('http')) {
      try { fs.unlinkSync(imageUrl); } catch (_) {}
    }
    await pool.query('DELETE FROM memories WHERE id = $1', [id]);
    res.json({ success: true, message: 'Memory deleted.' });
  } catch (err) {
    console.error('Delete memory error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete.' });
  }
});

// ── UPDATE MEMORY TRIP NAME ───────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trip_name } = req.body;
    if (!trip_name) {
      return res.status(400).json({ success: false, message: 'trip_name required.' });
    }
    const result = await pool.query(
      'UPDATE memories SET trip_name = $1 WHERE id = $2 RETURNING *',
      [trip_name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Memory not found.' });
    }
    res.json({ success: true, memory: result.rows[0] });
  } catch (err) {
    console.error('Update memory error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update.' });
  }
});

module.exports = router;
