// routes/health.js
import express from 'express';
const router = express.Router();

import { HealthModel } from '../schema/UserSchema.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ogadoctor-secret-change-in-production';


// ======================
// SIGNUP
// ======================
router.post('/signup', async (req, res) => {
  try {
    const { email, password, ...profileData } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUsers = await HealthModel.query('PK')
      .where('email').eq(normalizedEmail)
      .exec();

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const item = {
      PK: uuidv4(),
      email: normalizedEmail,
      entityType: 'EMAIL',
      password: hashedPassword, 
    };

    await HealthModel.create(item);

    const token = jwt.sign(
      { userId, email: normalizedEmail },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      userId,
      email: normalizedEmail,
      token,
      message: 'Account created successfully'
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

// ======================
// GET PROFILE
// ======================
router.get('/profile/:email', async (req, res) => {
  try {
    const normalizedEmail = req.params.email.toLowerCase().trim();

    const profile = await HealthModel.get({
      PK: `USER#${normalizedEmail}`,
      email: normalizedEmail
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Never return password
    const { password, ...safeProfile } = profile;
    res.json(safeProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
});

// ======================
// APPOINTMENTS
// ======================
router.post('/users/:userId/appointments', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body;
    const apptId = uuidv4();
    const now = new Date().toISOString();

    // You must provide email or derive it – here we expect it in body or fallback
    const email = data.email ? data.email.toLowerCase().trim() : 'unknown';

    const item = {
      PK: `USER#${userId}`,
      email,                          // Required rangeKey
      entityType: 'APPOINTMENT',
      apptId,
      startTime: data.startTime,
      endTime: data.endTime,
      ...data,
      // GSI for appointments by time
      GSI1PK: `USER#${userId}`,
      GSI1SK: data.startTime || now,
    };

    await HealthModel.create(item);

    if (global.io) {
      global.io.to(`user:${userId}`).emit('appointment-created', item);
    }

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create appointment', details: err.message });
  }
});

router.get('/users/:userId/appointments/upcoming', async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date().toISOString();

    const items = await HealthModel.query('PK')
      .eq(`USER#${userId}`)
      .where('entityType').eq('APPOINTMENT')
      .filter('startTime').ge(now)
      .descending()
      .limit(20)
      .exec();

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get upcoming appointments', details: err.message });
  }
});

// ======================
// VITALS
// ======================
router.post('/users/:userId/vitals', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body;
    const timestamp = new Date().toISOString();
    const email = data.email ? data.email.toLowerCase().trim() : 'unknown';

    const item = {
      PK: `USER#${userId}`,
      email,
      entityType: 'VITAL',
      ...data,
      // GSI example
      GSI2PK: `VITAL#${userId}`,
      GSI2SK: timestamp,
    };

    await HealthModel.create(item);
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vital', details: err.message });
  }
});

router.get('/users/:userId/vitals/recent', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Number(req.query.limit) || 10;

    const items = await HealthModel.query('PK')
      .eq(`USER#${userId}`)
      .where('entityType').eq('VITAL')
      .descending()
      .limit(limit)
      .exec();

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get recent vitals', details: err.message });
  }
});

// ======================
// NOTIFICATIONS
// ======================
router.post('/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body;
    const ts = new Date().toISOString();
    const email = data.email ? data.email.toLowerCase().trim() : 'unknown';

    const item = {
      PK: `USER#${userId}`,
      email,
      entityType: 'NOTIFICATION',
      read: false,
      notificationTimestamp: ts,
      ...data,
      // GSI for notifications
      GSI2PK: 'GLOBAL_NOTIFICATIONS',
      GSI2SK: ts,
    };

    await HealthModel.create(item);

    if (global.io) {
      global.io.to(`user:${userId}`).emit('new-notification', item);
    }

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create notification', details: err.message });
  }
});

router.get('/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;

    const items = await HealthModel.query('PK')
      .eq(`USER#${userId}`)
      .where('entityType').eq('NOTIFICATION')
      .descending()
      .exec();

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get notifications', details: err.message });
  }
});

export default router;