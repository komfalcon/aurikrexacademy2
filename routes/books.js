const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getBooks } = require('../controllers/books');

// Get all books (protected for students)
router.get('/', authMiddleware, getBooks);

// For admin, perhaps more routes, but basic for now

module.exports = router;