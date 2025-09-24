// Aurikrex Academy Backend Entry
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const usersRoutes = require('./routes/users');
const lecturesRoutes = require('./routes/lectures');
const groupsRoutes = require('./routes/groups');
const { seedAdmin } = require('./seed');

const app = express();

// Enable CORS for all origins (adjust origin if needed)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/lectures', lecturesRoutes);
app.use('/api/groups', groupsRoutes);

// Health check route
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve frontend static files
app.use('/books', express.static(path.join(__dirname, '../Books')));
app.use(express.static(path.join(__dirname, '..')));

// Fallback route for SPA (optional, uncomment if using a single-page app)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'index.html'));
// });

const PORT = 5000;

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server and seed admin user
app.listen(PORT, async () => {
  try {
    await seedAdmin();
    console.log(`✅ Aurikrex Academy server running on port ${PORT}`);
  } catch (err) {
    console.error('❌ Failed to seed admin user:', err.message);
  }
});
