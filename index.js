const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/auth'); // Auth routes ને ઈમ્પોર્ટ કર્યા

// Middleware
app.use(cors());
app.use(express.json()); // JSON ડેટા વાંચવા માટે

// Routes Use કરવા
app.use('/api/auth', authRoutes);

// Server Start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});