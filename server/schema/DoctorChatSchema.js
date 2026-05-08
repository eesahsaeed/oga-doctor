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
  lastMessageAt: String,
};

const DoctorChat = createMemoryBackedModel('DoctorChat', doctorChatDefinition);

export default DoctorChat;
