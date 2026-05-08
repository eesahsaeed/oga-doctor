import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.USE_IN_MEMORY_DB = 'true';
const { app, httpServer } = await import('../index.js');
const { default: LegacyUser } = await import('../schema/UserSchema.js');
const { default: Patient } = await import('../schema/PatientSchema.js');

test('GET /api/health returns healthy response', async () => {
  const res = await request(app).get('/api/health');

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.message, 'OK');
});

test('GET /api/auth/me requires auth token', async () => {
  const res = await request(app).get('/api/auth/me');

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('API responses localize top-level messages in pidgin', async () => {
  const health = await request(app).get('/api/health').set('x-language', 'pcm');
  assert.equal(health.status, 200);
  assert.equal(health.body.message, 'OK');

  const unauthorized = await request(app)
    .get('/api/auth/me')
    .set('x-language', 'pcm');
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.body.message, 'You no get permission.');
});

test('forgot password issues a reset token and accepts a new password', async () => {
  const email = `forgot-${Date.now()}@example.com`;
  const originalPassword = 'secret123';
  const nextPassword = 'newsecret456';

  const signup = await request(app).post('/api/auth/signup').send({
    name: 'Forgot Password Tester',
    email,
    password: originalPassword,
  });

  assert.equal(signup.status, 201);
  assert.equal(signup.body.success, true);

  const forgot = await request(app).post('/api/auth/forgot-password').send({
    email,
  });

  assert.equal(forgot.status, 200);
  assert.equal(forgot.body.success, true);
  assert.equal(typeof forgot.body?.debug?.resetToken, 'string');

  const validate = await request(app).get(
    `/api/auth/reset-password/validate?token=${encodeURIComponent(
      forgot.body.debug.resetToken,
    )}`,
  );

  assert.equal(validate.status, 200);
  assert.equal(validate.body.success, true);

  const reset = await request(app).post('/api/auth/reset-password').send({
    token: forgot.body.debug.resetToken,
    password: nextPassword,
  });

  assert.equal(reset.status, 200);
  assert.equal(reset.body.success, true);

  const oldSignin = await request(app).post('/api/auth/signin').send({
    email,
    password: originalPassword,
  });
  assert.equal(oldSignin.status, 401);

  const newSignin = await request(app).post('/api/auth/signin').send({
    email,
    password: nextPassword,
  });
  assert.equal(newSignin.status, 200);
  assert.equal(newSignin.body.success, true);
});

test('forgot password migrates a legacy User record into Patient storage', async () => {
  const email = `legacy-forgot-${Date.now()}@example.com`;
  const legacyUser = new LegacyUser({
    id: `legacy-${Date.now()}`,
    name: 'Legacy Patient',
    email,
    authType: 'EMAIL',
    password: 'hashed-legacy-password',
    onboarding: { language: 'en' },
    isPremium: false,
    notificationSettings: { appointmentReminders: true, pushEnabled: true },
    appointments: [],
    notifications: [],
    vitals: [],
    labResults: [],
    documents: [],
    vaccinations: [],
  });

  await legacyUser.save();

  const forgot = await request(app).post('/api/auth/forgot-password').send({
    email,
  });

  assert.equal(forgot.status, 200);
  assert.equal(forgot.body.success, true);
  assert.equal(typeof forgot.body?.debug?.resetToken, 'string');

  const migratedUsers = (await Patient.scan().exec()).filter(
    (user) => user.email === email,
  );
  assert.equal(migratedUsers.length, 1);
  assert.equal(migratedUsers[0].email, email);
  assert.equal(migratedUsers[0].accountType, 'patient');
  assert.equal(typeof migratedUsers[0].passwordResetTokenHash, 'string');
});

test('consultation transcripts can be saved and retrieved', async () => {
  const roomName = `oga-transcript-${Date.now()}`;
  const signup = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Transcript Tester',
      email: `transcript-${Date.now()}@example.com`,
      password: 'secret123',
    });

  assert.equal(signup.status, 201);
  assert.equal(signup.body.success, true);

  const token = signup.body.token;
  const save = await request(app)
    .post('/api/consultation/transcripts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      roomName,
      consultationType: 'video',
      participantName: 'Transcript Tester',
      identity: 'patient-abc123',
      participants: [
        {
          identity: 'doctor-room-1',
          name: 'Dr. Sarah Bello',
          userId: 'doctor-general-sarah-bello',
          accountType: 'doctor',
        },
      ],
      entries: [
        {
          id: 'entry-1',
          speakerIdentity: 'patient-abc123',
          speakerName: 'Transcript Tester',
          text: 'Good afternoon doctor, I have a headache.',
          at: '2026-05-07T13:30:00.000Z',
          source: 'manual',
        },
      ],
      status: 'active',
    });

  assert.equal(save.status, 200);
  assert.equal(save.body.success, true);
  assert.equal(save.body.transcript.roomName, roomName);
  assert.equal(save.body.transcript.entries.length, 1);
  assert.equal(save.body.transcript.participants.length, 2);
  assert.equal(save.body.transcript.users.length, 1);

  const fetch = await request(app)
    .get(`/api/consultation/transcripts/${roomName}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(fetch.status, 200);
  assert.equal(fetch.body.success, true);
  assert.equal(fetch.body.transcript.roomName, roomName);
  assert.equal(
    fetch.body.transcript.entries[0].text,
    'Good afternoon doctor, I have a headache.',
  );
});

test.after(async () => {
  if (httpServer?.listening) {
    await new Promise((resolve, reject) => {
      httpServer.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
});
