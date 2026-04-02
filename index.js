require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const tripsRoutes = require('./routes/trips');
const expenseRouter = require('./routes/expenses');
const itineraryRoutes = require('./routes/itineraryRoutes');
const imageRoutes = require('./routes/imageRoutes');
const searchRoutes = require('./routes/searchRoutes');
const memoriesRoutes = require('./routes/memories');

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads statically
const uploadDir = 'uploads/memories';
app.use('/uploads/memories', express.static(path.join(__dirname, uploadDir)));

// Routes - Consolidated under /api prefix for consistency
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/expenses', expenseRouter); // Moved under /api
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/memories', memoriesRoutes); // New
app.use('/api', imageRoutes);
app.use('/api', searchRoutes);

// ── Sequential table initialisation ─────────────────────────────────────────
async function initTables() {
  const steps = [
    {
      name: 'users',
      sql: `CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(255),
        email      VARCHAR(255) UNIQUE NOT NULL,
        password   VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      name: 'trips',
      sql: `CREATE TABLE IF NOT EXISTS trips (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name            VARCHAR(255),
        start_date      TIMESTAMP,
        end_date        TIMESTAMP,
        location        VARCHAR(255),
        cover_image_url TEXT,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      name: 'trips.cover_image_url migration',
      sql: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS cover_image_url TEXT`,
    },
    {
      name: 'trip_places',
      sql: `CREATE TABLE IF NOT EXISTS trip_places (
        id         SERIAL PRIMARY KEY,
        trip_id    INTEGER REFERENCES trips(id) ON DELETE CASCADE,
        place_data JSON
      )`,
    },
    {
      name: 'trip_expenses',
      sql: `CREATE TABLE IF NOT EXISTS trip_expenses (
        id       SERIAL PRIMARY KEY,
        trip_id  INTEGER REFERENCES trips(id) ON DELETE CASCADE,
        title    VARCHAR(255),
        amount   NUMERIC,
        category VARCHAR(50) DEFAULT 'Others',
        date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      name: 'memories',
      sql: `CREATE TABLE IF NOT EXISTS memories (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        trip_name  VARCHAR(255),
        image_url  TEXT,
        date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      name: 'trips.join_code migration',
      sql: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS join_code VARCHAR(10) UNIQUE`,
    },
    {
      name: 'trip_members',
      sql: `CREATE TABLE IF NOT EXISTS trip_members (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(trip_id, user_id)
      )`,
    },
    {
      name: 'trip_expenses.user_id migration',
      sql: `ALTER TABLE trip_expenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`,
    },
    {
      name: 'trip_expenses.category migration',
      sql: `ALTER TABLE trip_expenses ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Others'`,
    },
    {
      name: 'trip_expenses.date migration',
      sql: `ALTER TABLE trip_expenses ADD COLUMN IF NOT EXISTS date TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    },
    {
      name: 'trip_messages',
      sql: `CREATE TABLE IF NOT EXISTS trip_messages (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    },
  ];

  for (const step of steps) {
    try {
      await pool.query(step.sql);
      console.log(`✅ ${step.name} table is ready!`);
    } catch (err) {
      console.error(`❌ Error creating ${step.name} table:`, err.message);
    }
  }
}

// ── Port configuration ──────────────────────────────────────────────────────
const BASE_PORT = 3000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    initTables();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

startServer(BASE_PORT);


