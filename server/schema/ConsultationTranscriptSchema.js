import { createMemoryBackedModel } from './createMemoryBackedModel.js';

const consultationTranscriptDefinition = {
  id: {
    type: String,
    hashKey: true,
    required: true,
  },
  roomName: {
    type: String,
    required: true,
    index: {
      name: 'roomNameIndex',
      global: true,
      project: true,
    },
  },
  consultationType: {
    type: String,
    default: 'video',
  },
  status: {
    type: String,
    default: 'active',
  },
  createdByUserId: String,
  lastSavedByUserId: String,
  startedAt: String,
  endedAt: String,
  users: {
    type: Array,
    schema: [Object],
    default: [],
  },
  participants: {
    type: Array,
    schema: [Object],
    default: [],
  },
  entries: {
    type: Array,
    schema: [Object],
    default: [],
  },
  summary: String,
};

const ConsultationTranscript = createMemoryBackedModel(
  'ConsultationTranscript',
  consultationTranscriptDefinition,
);

export default ConsultationTranscript;
