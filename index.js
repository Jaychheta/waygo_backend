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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});