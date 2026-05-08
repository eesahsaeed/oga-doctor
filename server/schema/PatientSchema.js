import { createMemoryBackedModel } from './createMemoryBackedModel.js';

const patientDefinition = {
  id: {
    type: String,
    hashKey: true,
    required: true,
  },
  email: {
    type: String,
    rangeKey: true,
    required: true,
    index: {
      name: 'emailIndex',
      global: true,
      project: true,
    },
  },
  password: {
    type: String,
    required: true,
  },
  authType: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    default: 'patient',
  },
  name: String,
  passwordResetTokenHash: {
    type: String,
    index: {
      name: 'passwordResetTokenHashIndex',
      global: true,
      project: true,
    },
  },
  passwordResetExpiresAt: String,
  passwordResetRequestedAt: String,
  onboarding: Object,
  profile: Object,
  isPremium: {
    type: Boolean,
    default: false,
  },
  notificationSettings: Object,
  appointments: {
    type: Array,
    schema: [Object],
    default: [],
  },
  notifications: {
    type: Array,
    schema: [Object],
    default: [],
  },
  vitals: {
    type: Array,
    schema: [Object],
    default: [],
  },
  labResults: {
    type: Array,
    schema: [Object],
    default: [],
  },
  documents: {
    type: Array,
    schema: [Object],
    default: [],
  },
  vaccinations: {
    type: Array,
    schema: [String],
    default: [],
  },
};

const Patient = createMemoryBackedModel('Patient', patientDefinition);

export default Patient;
