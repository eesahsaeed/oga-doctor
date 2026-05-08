import { createMemoryBackedModel } from './createMemoryBackedModel.js';

const doctorDefinition = {
  id: {
    type: String,
    hashKey: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
    index: {
      name: 'emailIndex',
      global: true,
      project: true,
    },
  },
  accountType: {
    type: String,
    default: 'doctor',
  },
  password: String,
  authType: String,
  name: {
    type: String,
    required: true,
  },
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
  notificationSettings: Object,
  title: String,
  specialty: String,
  isSpecialist: {
    type: Boolean,
    default: false,
  },
  bio: String,
  languages: {
    type: Array,
    schema: [String],
    default: [],
  },
  consultationModes: {
    type: Array,
    schema: [String],
    default: [],
  },
  yearsExperience: Number,
  responseTime: String,
  nextAvailable: String,
  status: String,
  avatar: String,
  priceLabel: String,
};

const Doctor = createMemoryBackedModel('Doctor', doctorDefinition);

export default Doctor;
