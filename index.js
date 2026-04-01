require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const tripsRoutes = require('./routes/trips');
const expenseRouter = require('./routes/expenses');
const itineraryRoutes = require('./routes/itineraryRoutes');
const imageRoutes = require('./routes/imageRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/expenses', expenseRouter);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api', imageRoutes);
app.use('/api', searchRoutes);

// ── Sequential table initialisation ─────────────────────────────────────────
// Run AFTER server starts so startup is never blocked.
// Order matters: users → trips (FK) → trip_places → trip_expenses
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
      // Add column to existing trips table if it doesn't have it yet
      name: 'trips.cover_image_url migration',
      sql: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS cover_image_url TEXT`,
    },
    {
      name: 'trip_places',
      sql: `CREATE TABLE IF NOT EXISTS trip_places (
        id         SERIAL PRIMARY KEY,
        trip_id    INTEGER,
        place_data JSON
      )`,
    },
    {
      name: 'trip_expenses',
      sql: `CREATE TABLE IF NOT EXISTS trip_expenses (
        id       SERIAL PRIMARY KEY,
        trip_id  INTEGER,
        title    VARCHAR(255),
        amount   NUMERIC,
        category VARCHAR(50) DEFAULT 'Others',
        date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

// ── Port auto-increment ──────────────────────────────────────────────────────
const BASE_PORT = 3000;

function startServer(port) {
  const server = app.listen(port, () => {
    if (port !== BASE_PORT) {
      console.log(`✅ Server successfully running on port ${port} (Port ${BASE_PORT} was busy)`);
    } else {
      console.log(`✅ Server running on port ${port}`);
    }
    // Init tables only after server is up and DB has had a chance to connect
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

