import { createMemoryBackedModel } from './createMemoryBackedModel.js';

const doctorChatDefinition = {
  id: {
    type: String,
    hashKey: true,
    required: true,
  },
  patientId: {
    type: String,
    required: true,
    index: {
      name: 'patientIdIndex',
      global: true,
      project: true,
    },
  },
  doctorId: {
    type: String,
    required: true,
    index: {
      name: 'doctorIdIndex',
      global: true,
      project: true,
    },
  },
  subject: String,
  status: {
    type: String,
    default: 'active',
  },
  messages: {
    type: Array,
    schema: [Object],
    default: [],
  },
  typingState: {
    type: Object,
    schema: {
      senderType: String,
      senderId: String,
      senderName: String,
      expiresAt: String,
    },
  },
  lastMessageAt: String,
};

const DoctorChat = createMemoryBackedModel('DoctorChat', doctorChatDefinition);

export default DoctorChat;
