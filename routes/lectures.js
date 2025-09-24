const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createLecture, getLectures, getLectureById, updateLecture, deleteLecture } = require('../controllers/lectures');

// Protected routes
router.post('/', authMiddleware, requireRole(['tutor', 'admin']), createLecture);
router.get('/', getLectures);
router.get('/:id', getLectureById);
router.put('/:id', authMiddleware, requireRole(['tutor', 'admin']), updateLecture);
router.delete('/:id', authMiddleware, requireRole(['admin']), deleteLecture);

module.exports = router;