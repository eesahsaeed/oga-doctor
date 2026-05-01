import dynamoose from 'dynamoose';
import {
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
} from '../helper.js';

const memoryUsers = new Map();

class InMemoryQuery {
  constructor(field) {
    this.field = field;
    this.value = undefined;
  }

  eq(value) {
    this.value = value;
    return this;
  }

  using() {
    return this;
  }

  async exec() {
    if (this.field === 'email') {
      const email = (this.value || '').toString().toLowerCase();
      return Array.from(memoryUsers.values()).filter(
        (user) => (user.email || '').toLowerCase() === email,
      );
    }

    return [];
  }
}

class InMemoryUser {
  constructor(payload = {}) {
    Object.assign(this, payload);
  }

  static query(field) {
    return new InMemoryQuery(field);
  }

  async save() {
    if (!this.id) {
      throw new Error('id is required');
    }

    const now = new Date().toISOString();
    this.updatedAt = now;
    this.createdAt = this.createdAt || now;
    memoryUsers.set(this.id, this);
    return this;
  }
}

const hasAwsCredentials =
  Boolean(AWS_ACCESS_KEY_ID) && Boolean(AWS_SECRET_ACCESS_KEY);

const forceInMemoryStore = process.env.USE_IN_MEMORY_DB === 'true';
const useInMemoryStore = forceInMemoryStore || !hasAwsCredentials;

if (hasAwsCredentials && !forceInMemoryStore) {
  try {
    const ddb = new dynamoose.aws.ddb.DynamoDB({
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
      region: AWS_REGION,
    });

    dynamoose.aws.ddb.set(ddb);
  } catch (error) {
    console.error(
      '[dynamodb] Failed to initialize DynamoDB client:',
      error?.message || error,
    );
  }
}

const userSchema = new dynamoose.Schema(
  {
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
    name: String,
    onboarding: Object,
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
  },
  {
    timestamps: true,
    saveUnknown: true,
  },
);

const User = dynamoose.model('User', userSchema, {
  create: false,
  update: false,
  waitForActive: false,
});

let UserModel = User;

if (useInMemoryStore) {
  const reason = forceInMemoryStore
    ? 'USE_IN_MEMORY_DB=true'
    : 'AWS credentials missing';

  console.log(`[storage] Using in-memory user store (${reason}).`);
  UserModel = InMemoryUser;
}

export default UserModel;
