const jwt = require('jsonwebtoken');
const User = require('../models/user');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

exports.authMiddleware = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided.' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user = await User.findById(decoded.id).select('role verified');
    if (!user || !user.verified) {
      return res.status(401).json({ message: 'User not found or not verified.' });
    }
    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Role-based middleware
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires ${roles.join(' or ')} role.` });
    }
    next();
  };
};
