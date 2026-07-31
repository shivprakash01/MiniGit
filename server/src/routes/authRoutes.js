import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { protect, generateToken } from '../middleware/auth.js';
import { isMemoryMode, memoryStore, generateId } from '../config/memoryDb.js';

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (isMemoryMode()) {
      const exists = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return res.status(400).json({ message: 'User with this email already exists' });

      const hash = await bcrypt.hash(password, 10);
      const newUser = {
        _id: `user_${generateId()}`,
        name,
        email,
        password: hash,
        role: role || 'employee',
        department: department || 'Engineering',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
        createdAt: new Date(),
      };
      memoryStore.users.push(newUser);

      return res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        avatar: newUser.avatar,
        token: generateToken(newUser._id),
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      department: department || 'Engineering',
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isMemoryMode()) {
      const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
          token: generateToken(user._id),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

export default router;
