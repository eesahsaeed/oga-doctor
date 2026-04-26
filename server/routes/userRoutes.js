import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

import User from '../schema/UserSchema.js';
import { JWT_SECRET } from '../helper.js';

const router = express.Router();

function todayLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildDefaultAppointments() {
  return [
    {
      id: uuidv4(),
      day: '12',
      weekday: 'Tue',
      time: '09:30 AM',
      doctor: 'Dr. Mim Ankhtr',
      type: 'Video Consultation',
      reason: 'Depression follow-up & medication review',
      status: 'Confirmed',
      statusColor: '#10b981',
      isPast: false,
      scheduledAt: '2026-05-12T09:30:00.000Z',
    },
    {
      id: uuidv4(),
      day: '18',
      weekday: 'Mon',
      time: '02:15 PM',
      doctor: 'Dr. Sarah Bello',
      type: 'In-Person',
      reason: 'Routine physical examination',
      status: 'Pending',
      statusColor: '#f59e0b',
      isPast: false,
      scheduledAt: '2026-05-18T14:15:00.000Z',
    },
    {
      id: uuidv4(),
      day: '20',
      weekday: 'Thu',
      time: '10:45 AM',
      doctor: 'Dr. Adebayo',
      type: 'Video Consultation',
      reason: 'Initial depression screening',
      status: 'Completed',
      statusColor: '#64748b',
      isPast: true,
      scheduledAt: '2026-04-20T10:45:00.000Z',
    },
  ];
}

function buildDefaultNotifications() {
  return [
    {
      id: uuidv4(),
      category: 'appointment',
      title: 'Appointment Confirmed',
      description: 'Video consultation booked successfully.',
      timestamp: `Today • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      icon: 'calendar-check-outline',
      color: '#10b981',
      actionLabel: 'View details',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      category: 'lab',
      title: 'Lab Results Available',
      description: 'Your latest CBC report is now available.',
      timestamp: `Today • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      icon: 'beaker-outline',
      color: '#2563eb',
      actionLabel: 'View report',
      createdAt: new Date().toISOString(),
    },
  ];
}

function buildDefaultVitals() {
  return [
    {
      id: uuidv4(),
      metric: 'Heart Rate',
      value: '96 bpm',
      recordedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      metric: 'Weight',
      value: '80 kg',
      recordedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: uuidv4(),
      metric: 'Water Intake',
      value: '2.1 L',
      recordedAt: new Date().toISOString(),
    },
  ];
}

function buildDefaultLabResults() {
  return [
    { test: 'Full Blood Count (FBC)', date: 'Feb 18, 2026', status: 'Normal • Reviewed by Dr. Sarah' },
    { test: 'Lipid Profile', date: 'Jan 29, 2026', status: 'Cholesterol slightly elevated' },
    { test: 'HbA1c', date: 'Dec 12, 2025', status: '5.6% • Good control' },
  ];
}

function buildDefaultDocuments() {
  return [
    { title: 'Chest X-Ray Report', date: 'Feb 10, 2026', icon: 'file-document', color: '#2563eb' },
    { title: 'ECG Summary', date: 'Jan 15, 2026', icon: 'heart-pulse', color: '#ef4444' },
    { title: 'Prescription - Jan 2026', date: 'Jan 31, 2026', icon: 'pill', color: '#f59e0b' },
  ];
}

function buildDefaultVaccinations() {
  return [
    'COVID-19 Booster (Pfizer) – Oct 2025',
    'Influenza (Flu) – Sep 2025',
    'Hepatitis B (3rd dose) – Mar 2025',
  ];
}

function defaultNotificationSettings() {
  return {
    pushEnabled: true,
    appointmentReminders: true,
    pregnancyMilestones: true,
  };
}

function getSafeUser(user) {
  return {
    id: user.id,
    name: user.name || '',
    email: user.email,
    authType: user.authType,
    onboarding: user.onboarding || {},
    isPremium: Boolean(user.isPremium),
    notificationSettings: user.notificationSettings || defaultNotificationSettings(),
  };
}

async function findUserByEmail(email) {
  const users = await User.query('email').eq(email).using('emailIndex').exec();
  return users[0] || null;
}

async function hydrateUser(user) {
  if (!Array.isArray(user.appointments) || user.appointments.length === 0) {
    user.appointments = buildDefaultAppointments();
  }
  if (!Array.isArray(user.notifications) || user.notifications.length === 0) {
    user.notifications = buildDefaultNotifications();
  }
  if (!Array.isArray(user.vitals) || user.vitals.length === 0) {
    user.vitals = buildDefaultVitals();
  }
  if (!Array.isArray(user.labResults) || user.labResults.length === 0) {
    user.labResults = buildDefaultLabResults();
  }
  if (!Array.isArray(user.documents) || user.documents.length === 0) {
    user.documents = buildDefaultDocuments();
  }
  if (!Array.isArray(user.vaccinations) || user.vaccinations.length === 0) {
    user.vaccinations = buildDefaultVaccinations();
  }
  if (!user.notificationSettings) {
    user.notificationSettings = defaultNotificationSettings();
  }
  if (!user.onboarding) {
    user.onboarding = {};
  }

  await user.save();
  return user;
}

function buildDashboard(user) {
  const upcomingAppointments = (user.appointments || []).filter((item) => !item.isPast);
  const recentVitals = (user.vitals || []).slice(0, 3);

  return {
    tip: {
      title: "Today's Health Tip",
      body: 'Drinking 2–3 liters of water daily supports healthy blood pressure and kidney function.',
      date: todayLabel(),
    },
    womensStage: user.onboarding?.womensStage || 'general',
    pregnancyWeeks: user.onboarding?.pregnancyWeeks || '',
    isPremium: Boolean(user.isPremium),
    services: [
      { title: 'Consultation', icon: 'doctor', color: '#2563eb', bg: '#eff6ff' },
      { title: 'Lab Tests', icon: 'test-tube', color: '#3b82f6', bg: '#eff6ff' },
      { title: 'Prescriptions', icon: 'pill', color: '#1d4ed8', bg: '#eff6ff' },
      { title: 'Records', icon: 'folder-heart-outline', color: '#1e40af', bg: '#eff6ff' },
    ],
    articles: [
      {
        title: 'Managing Stress in Busy Lagos Life',
        category: 'Mental Health',
        image: 'https://images.unsplash.com/photo-1518644961665-ed172691bb7e?w=400',
      },
      {
        title: 'Why Blood Pressure Matters After 40',
        category: 'Cardiology',
        image: 'https://images.unsplash.com/photo-1579684384363-3f4e6b7e3e4e?w=400',
      },
    ],
    upcomingAppointments,
    recentVitals,
  };
}

function buildReports(user) {
  return {
    womensStage: user.onboarding?.womensStage || 'general',
    pregnancyWeeks: user.onboarding?.pregnancyWeeks || '',
    overview: {
      avgHeartRate: '92 bpm',
      bloodPressure: '118/78',
      weight: '79.8 kg',
      hydration: '68%',
    },
    labResults: user.labResults || [],
    documents: user.documents || [],
    vaccinations: user.vaccinations || [],
  };
}

const HEALTH_SYSTEM_PROMPT = `
You are Alex, a careful health consultation assistant for a mobile app.
Rules:
- Give supportive, concise, practical guidance.
- Ask 1-3 focused follow-up questions when needed.
- Clearly flag emergency red flags (severe chest pain, trouble breathing, stroke signs, severe bleeding, suicidal thoughts) and instruct urgent care immediately.
- Never claim a definitive diagnosis.
- Suggest next steps, home care, and when to seek in-person care.
- Keep responses plain language.
`;

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

async function getAuthedUser(req) {
  const tokenEmail = (req.auth?.email || '').toLowerCase();
  if (!tokenEmail) {
    return null;
  }

  const user = await findUserByEmail(tokenEmail);
  if (!user) {
    return null;
  }

  return hydrateUser(user);
}

router.post(
  '/auth/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await findUserByEmail(normalizedEmail);

      if (existingUser) {
        return res.status(409).json({ success: false, message: 'User with this email already exists' });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        id: uuidv4(),
        name: name.trim(),
        email: normalizedEmail,
        authType: 'EMAIL',
        password: hashedPassword,
        onboarding: { onboardingCompleted: false },
        isPremium: false,
        notificationSettings: defaultNotificationSettings(),
        appointments: buildDefaultAppointments(),
        notifications: buildDefaultNotifications(),
        vitals: buildDefaultVitals(),
        labResults: buildDefaultLabResults(),
        documents: buildDefaultDocuments(),
        vaccinations: buildDefaultVaccinations(),
      });

      await newUser.save();

      const token = jwt.sign(
        { userId: newUser.id, email: normalizedEmail, authType: newUser.authType },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: getSafeUser(newUser),
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
  }
);

router.post(
  '/auth/signin',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const user = await findUserByEmail(normalizedEmail);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      await hydrateUser(user);

      const token = jwt.sign(
        { userId: user.id, email: user.email, authType: user.authType },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Sign in successful',
        token,
        user: getSafeUser(user),
      });
    } catch (error) {
      console.error('Signin error:', error);
      return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
  }
);

router.get('/auth/me', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user: getSafeUser(user) });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load profile' });
  }
});

router.put('/auth/profile', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, isPremium } = req.body;
    if (typeof name === 'string') {
      user.name = name.trim();
    }
    if (typeof isPremium === 'boolean') {
      user.isPremium = isPremium;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

router.post('/auth/onboarding', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      language = 'en',
      gender = '',
      age = '',
      mainHealthCategory = 'general',
      subHealthCategory = '',
      womensStage = 'general',
      pregnancyWeeks = '',
      isFirstPregnancy = true,
      conditions = '',
      onboardingCompleted = true,
    } = req.body || {};

    user.onboarding = {
      language,
      gender,
      age,
      mainHealthCategory,
      subHealthCategory,
      womensStage,
      pregnancyWeeks,
      isFirstPregnancy,
      conditions,
      onboardingCompleted,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Onboarding saved',
      onboarding: user.onboarding,
    });
  } catch (error) {
    console.error('Onboarding save error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save onboarding' });
  }
});

router.get('/home/dashboard', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: buildDashboard(user) });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
});

router.get('/appointments', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const all = user.appointments || [];
    return res.status(200).json({
      success: true,
      upcoming: all.filter((item) => !item.isPast),
      past: all.filter((item) => item.isPast),
    });
  } catch (error) {
    console.error('Appointments list error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load appointments' });
  }
});

router.post('/appointments', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      day,
      weekday,
      time,
      doctor,
      type,
      reason,
      status = 'Scheduled',
      statusColor = '#2563eb',
      scheduledAt,
    } = req.body || {};

    if (!time || !doctor || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'time, doctor, type and reason are required',
      });
    }

    const appointment = {
      id: uuidv4(),
      day: day || '',
      weekday: weekday || '',
      time,
      doctor,
      type,
      reason,
      status,
      statusColor,
      isPast: false,
      scheduledAt: scheduledAt || new Date().toISOString(),
    };

    user.appointments = [appointment, ...(user.appointments || [])];
    await user.save();

    return res.status(201).json({ success: true, appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create appointment' });
  }
});

router.patch('/appointments/:appointmentId', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { appointmentId } = req.params;
    const index = (user.appointments || []).findIndex((item) => item.id === appointmentId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const next = {
      ...user.appointments[index],
      ...req.body,
    };

    user.appointments[index] = next;
    await user.save();

    return res.status(200).json({ success: true, appointment: next });
  } catch (error) {
    console.error('Update appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update appointment' });
  }
});

router.get('/notifications', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      notifications: user.notifications || [],
      unreadCount: (user.notifications || []).filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error('Notifications list error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
});

router.post('/notifications', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const payload = req.body || {};
    if (!payload.title || !payload.description) {
      return res.status(400).json({ success: false, message: 'title and description are required' });
    }

    const notification = {
      id: uuidv4(),
      category: payload.category || 'system',
      title: payload.title,
      description: payload.description,
      timestamp: payload.timestamp || `Today • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      icon: payload.icon || 'notifications-outline',
      color: payload.color || '#64748b',
      actionLabel: payload.actionLabel || null,
      createdAt: new Date().toISOString(),
    };

    user.notifications = [notification, ...(user.notifications || [])];
    await user.save();

    return res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
});

router.patch('/notifications/:notificationId/read', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { notificationId } = req.params;
    const index = (user.notifications || []).findIndex((item) => item.id === notificationId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    user.notifications[index] = {
      ...user.notifications[index],
      read: true,
    };

    await user.save();

    return res.status(200).json({ success: true, notification: user.notifications[index] });
  } catch (error) {
    console.error('Mark notification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

router.post('/notifications/mark-all-read', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.notifications = (user.notifications || []).map((item) => ({ ...item, read: true }));
    await user.save();

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

router.get('/notification-settings', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      settings: user.notificationSettings || defaultNotificationSettings(),
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load notification settings' });
  }
});

router.put('/notification-settings', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const current = user.notificationSettings || defaultNotificationSettings();
    user.notificationSettings = {
      ...current,
      ...req.body,
    };

    await user.save();

    return res.status(200).json({ success: true, settings: user.notificationSettings });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification settings' });
  }
});

router.get('/reports', authRequired, async (req, res) => {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: buildReports(user) });
  } catch (error) {
    console.error('Reports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load reports' });
  }
});

router.get('/search', authRequired, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (!q) {
      return res.status(200).json({ success: true, results: [] });
    }

    const user = await getAuthedUser(req);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const appointments = (user.appointments || [])
      .filter((item) => `${item.reason} ${item.doctor} ${item.type}`.toLowerCase().includes(q))
      .map((item) => ({ type: 'appointment', item }));

    const notifications = (user.notifications || [])
      .filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(q))
      .map((item) => ({ type: 'notification', item }));

    return res.status(200).json({ success: true, results: [...appointments, ...notifications] });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
});

router.post('/ai/health-chat', authRequired, async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_SECRET_KEY || '';
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_SECRET_KEY is missing on backend',
      });
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages array is required' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: HEALTH_SYSTEM_PROMPT.trim() },
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({
        success: false,
        message: 'OpenAI request failed',
        detail,
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error('AI health chat error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate AI response' });
  }
});

export default router;

