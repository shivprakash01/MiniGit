import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { isMemoryMode, memoryStore } from '../config/memoryDb.js';

const JWT_SECRET = process.env.JWT_SECRET || 'minigit_secret_jwt_key_2026';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isMemoryMode()) {
      const memUser = memoryStore.users.find(u => u._id === decoded.id);
      if (!memUser) return res.status(401).json({ message: 'User account no longer exists' });
      req.user = memUser;
      return next();
    }

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User account no longer exists' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Requires Admin privilege' });
  }
};

export const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};
