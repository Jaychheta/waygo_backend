require('dotenv').config();   // ← must be first — loads .env into process.env
const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/auth');
const tripsRoutes = require('./routes/trips');
const expenseRouter = require('./routes/expenses');

// Middleware
app.use(cors());
app.use(express.json());

// Routes Use કરવા
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/expenses', expenseRouter);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} in use. Run this to fix:\n   Get-Process -Name node | Stop-Process -Force`);
    process.exit(1);
  } else {
    throw err;
  }
});
