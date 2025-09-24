const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createGroup, getGroups, getGroupById, updateGroup, deleteGroup, joinGroup } = require('../controllers/groups');

// Protected routes
router.post('/', authMiddleware, requireRole(['tutor', 'admin']), createGroup);
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.put('/:id', authMiddleware, requireRole(['tutor', 'admin']), updateGroup);
router.delete('/:id', authMiddleware, requireRole(['admin']), deleteGroup);
router.post('/:id/join', authMiddleware, joinGroup);

module.exports = router;