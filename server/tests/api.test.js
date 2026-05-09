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

test('forgot password returns user not found for unknown email', async () => {
  const missingEmail = `missing-${Date.now()}@example.com`;

  const forgot = await request(app).post('/api/auth/forgot-password').send({
    email: missingEmail,
  });

  assert.equal(forgot.status, 404);
  assert.equal(forgot.body.success, false);
  assert.equal(forgot.body.message, 'User not found');
});

test('signin returns user not found for unknown email', async () => {
  const missingEmail = `signin-missing-${Date.now()}@example.com`;

  const signin = await request(app).post('/api/auth/signin').send({
    email: missingEmail,
    password: 'secret123',
  });

  assert.equal(signin.status, 404);
  assert.equal(signin.body.success, false);
  assert.equal(signin.body.message, 'User not found');
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

test('doctor onboarding can skip image upload and receive a generated avatar', async () => {
  const email = `doctor-onboarding-${Date.now()}@example.com`;
  const signup = await request(app).post('/api/auth/signup').send({
    name: 'Dr Amina Yusuf',
    email,
    password: 'secret123',
    accountType: 'doctor',
    title: 'Consultant Specialist',
    specialty: 'Cardiology',
  });

  assert.equal(signup.status, 201);
  assert.equal(signup.body.success, true);
  assert.equal(signup.body.user.onboarding.onboardingCompleted, false);

  const token = signup.body.token;
  const onboarding = await request(app)
    .post('/api/auth/onboarding')
    .set('Authorization', `Bearer ${token}`)
    .send({
      language: 'en',
      name: 'Dr Amina Yusuf',
      title: 'Consultant Cardiologist',
      specialty: 'Cardiology',
      bio: 'Cardiology specialist focused on long-term heart health follow-up.',
      yearsExperience: 8,
      responseTime: 'Replies in about 10 mins',
      nextAvailable: 'Today, 4:00 PM',
      priceLabel: 'From NGN 15,000',
      status: 'available',
      languages: ['en', 'ha'],
      consultationModes: ['doctor_chat', 'video'],
      profile: {
        phone: '+2348012345678',
        practiceAddress: 'Abuja Specialist Centre',
        licenseNumber: 'MDCN-123456',
        consultationFocus: 'Hypertension and long-term follow-up',
      },
      onboardingCompleted: true,
    });

  assert.equal(onboarding.status, 200);
  assert.equal(onboarding.body.success, true);
  assert.equal(onboarding.body.user.onboarding.onboardingCompleted, true);
  assert.equal(typeof onboarding.body.user.avatar, 'string');
  assert.match(onboarding.body.user.avatar, /^data:image\/svg\+xml/);
});

test('patients can skip onboarding and still enter the workspace later', async () => {
  const email = `patient-skip-${Date.now()}@example.com`;
  const signup = await request(app).post('/api/auth/signup').send({
    name: 'Skip Ready Patient',
    email,
    password: 'secret123',
    accountType: 'patient',
  });

  assert.equal(signup.status, 201);
  assert.equal(signup.body.user.onboarding.onboardingCompleted, false);

  const onboarding = await request(app)
    .post('/api/auth/onboarding')
    .set('Authorization', `Bearer ${signup.body.token}`)
    .send({
      language: 'ha',
      onboardingCompleted: true,
      onboardingSkipped: true,
    });

  assert.equal(onboarding.status, 200);
  assert.equal(onboarding.body.success, true);
  assert.equal(onboarding.body.user.onboarding.onboardingCompleted, true);
  assert.equal(onboarding.body.user.onboarding.onboardingSkipped, true);
  assert.equal(onboarding.body.user.onboarding.language, 'ha');
});

test('doctor chats list loads without DynamoDB key-shape errors', async () => {
  const doctorEmail = `doctor-chat-list-${Date.now()}@example.com`;
  const patientEmail = `patient-chat-list-${Date.now()}@example.com`;

  const doctorSignup = await request(app).post('/api/auth/signup').send({
    name: 'Dr Chat Ready',
    email: doctorEmail,
    password: 'secret123',
    accountType: 'doctor',
    title: 'Consultant Specialist',
    specialty: 'Cardiology',
  });

  assert.equal(doctorSignup.status, 201);

  const doctorOnboarding = await request(app)
    .post('/api/auth/onboarding')
    .set('Authorization', `Bearer ${doctorSignup.body.token}`)
    .send({
      language: 'en',
      name: 'Dr Chat Ready',
      title: 'Consultant Specialist',
      specialty: 'Cardiology',
      bio: 'Cardiology specialist ready for consultations.',
      yearsExperience: 7,
      responseTime: 'Replies in about 12 mins',
      nextAvailable: 'Today, 5:00 PM',
      priceLabel: 'From NGN 12,000',
      status: 'available',
      languages: ['en'],
      consultationModes: ['doctor_chat', 'video'],
      profile: {
        phone: '+2348011111111',
        practiceAddress: 'Heart Centre, Abuja',
        licenseNumber: 'MDCN-654321',
        consultationFocus: 'Heart care',
      },
      onboardingCompleted: true,
    });

  assert.equal(doctorOnboarding.status, 200);

  const patientSignup = await request(app).post('/api/auth/signup').send({
    name: 'Patient Chat Ready',
    email: patientEmail,
    password: 'secret123',
    accountType: 'patient',
  });

  assert.equal(patientSignup.status, 201);

  const chatCreate = await request(app)
    .post('/api/doctor-chats')
    .set('Authorization', `Bearer ${patientSignup.body.token}`)
    .send({
      doctorId: doctorSignup.body.user.id,
      subject: 'Need follow-up advice',
    });

  assert.equal(chatCreate.status, 201);

  const patientList = await request(app)
    .get('/api/doctor-chats')
    .set('Authorization', `Bearer ${patientSignup.body.token}`);

  assert.equal(patientList.status, 200);
  assert.equal(patientList.body.success, true);
  assert.equal(Array.isArray(patientList.body.chats), true);
  assert.equal(patientList.body.chats.length > 0, true);

  const doctorList = await request(app)
    .get('/api/doctor-chats')
    .set('Authorization', `Bearer ${doctorSignup.body.token}`);

  assert.equal(doctorList.status, 200);
  assert.equal(doctorList.body.success, true);
  assert.equal(Array.isArray(doctorList.body.chats), true);
  assert.equal(doctorList.body.chats.length > 0, true);
});

test('patients only see doctors with completed profiles and cannot start chats with incomplete ones', async () => {
  const doctorEmail = `doctor-hidden-${Date.now()}@example.com`;
  const patientEmail = `patient-visible-${Date.now()}@example.com`;

  const doctorSignup = await request(app).post('/api/auth/signup').send({
    name: 'Dr Hidden Profile',
    email: doctorEmail,
    password: 'secret123',
    accountType: 'doctor',
    title: 'Consultant Specialist',
    specialty: 'Cardiology',
  });

  assert.equal(doctorSignup.status, 201);
  assert.equal(doctorSignup.body.success, true);
  assert.equal(doctorSignup.body.user.onboarding.onboardingCompleted, false);

  const patientSignup = await request(app).post('/api/auth/signup').send({
    name: 'Patient Viewer',
    email: patientEmail,
    password: 'secret123',
  });

  assert.equal(patientSignup.status, 201);
  assert.equal(patientSignup.body.success, true);

  const patientToken = patientSignup.body.token;

  const doctorsRes = await request(app)
    .get('/api/doctors?kind=specialist')
    .set('Authorization', `Bearer ${patientToken}`);

  assert.equal(doctorsRes.status, 200);
  assert.equal(doctorsRes.body.success, true);
  assert.equal(
    doctorsRes.body.doctors.some(
      (doctor) => doctor.id === doctorSignup.body.user.id,
    ),
    false,
  );

  const chatRes = await request(app)
    .post('/api/doctor-chats')
    .set('Authorization', `Bearer ${patientToken}`)
    .send({
      doctorId: doctorSignup.body.user.id,
      subject: 'Cardiology consultation',
    });

  assert.equal(chatRes.status, 403);
  assert.equal(chatRes.body.success, false);
  assert.equal(
    chatRes.body.message,
    'Doctor profile is not available to patients yet.',
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
