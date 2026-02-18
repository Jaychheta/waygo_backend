const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. REGISTER ROUTE (UPDATED)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(401).json({ message: "User already exists!" });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert User
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword]
    );

    // --- NEW: GENERATE TOKEN ---
    const token = jwt.sign({ id: newUser.rows[0].id }, "waygo_secret_key", { expiresIn: "1h" });

    // Send Token + User
    res.json({ 
      message: "Registration successful",
      token, 
      user: newUser.rows[0] 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. LOGIN ROUTE (Same as before)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Email or Password incorrect" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: "Email or Password incorrect" });
    }

    const token = jwt.sign({ id: user.rows[0].id }, "waygo_secret_key", { expiresIn: "1h" });

    res.json({ 
      message: "Login successful",
      token, 
      user: user.rows[0] 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;