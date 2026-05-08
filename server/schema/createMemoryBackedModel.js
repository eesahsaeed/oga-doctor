import dynamoose from 'dynamoose';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
} from '../helper.js';

let dynamoConfigured = false;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runtimeEnv() {
  return String(process.env.NODE_ENV || '')
    .trim()
    .toLowerCase();
}

function isTestRuntime() {
  return runtimeEnv() === 'test';
}

function configureDynamoIfPossible() {
  if (dynamoConfigured) {
    return;
  }

  const hasAwsCredentials =
    Boolean(AWS_ACCESS_KEY_ID) && Boolean(AWS_SECRET_ACCESS_KEY);

  if (!hasAwsCredentials) {
    dynamoConfigured = true;
    return;
  }

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

  dynamoConfigured = true;
}

function valuesEqual(left, right) {
  if (typeof left === 'string' && typeof right === 'string') {
    return left.trim().toLowerCase() === right.trim().toLowerCase();
  }

  return left === right;
}

function shouldPersistLocalStore() {
  if (isTestRuntime()) {
    return false;
  }

  const raw = String(process.env.PERSIST_LOCAL_DB || 'true')
    .trim()
    .toLowerCase();

  return raw !== 'false' && raw !== '0';
}

function getLocalStoreFilePath(modelName) {
  const safeModelName = String(modelName || 'model')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-');

  return path.resolve(__dirname, '../.local-db', `${safeModelName}.json`);
}

function readLocalStoreRecords(modelName) {
  if (!shouldPersistLocalStore()) {
    return [];
  }

  const filePath = getLocalStoreFilePath(modelName);
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(
      `[storage] Unable to read local ${modelName} store:`,
      error?.message || error,
    );
    return [];
  }
}

function persistLocalStoreRecords(modelName, memoryStore) {
  if (!shouldPersistLocalStore()) {
    return;
  }

  const filePath = getLocalStoreFilePath(modelName);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const records = Array.from(memoryStore.values()).map((item) => ({
      ...item,
    }));
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf8');
  } catch (error) {
    console.warn(
      `[storage] Unable to persist local ${modelName} store:`,
      error?.message || error,
    );
  }
}

export function createMemoryBackedModel(modelName, definition) {
  const forceInMemoryStore = process.env.USE_IN_MEMORY_DB === 'true';
  const useInMemoryStore = forceInMemoryStore || isTestRuntime();

  if (!useInMemoryStore) {
    configureDynamoIfPossible();
    const schema = new dynamoose.Schema(definition, {
      timestamps: true,
      saveUnknown: true,
    });

    const DynamoModel = dynamoose.model(modelName, schema, {
      create: true,
      update: false,
      waitForActive: {
        enabled: true,
        check: {
          timeout: 180000,
          frequency: 1000,
        },
      },
      initialize: false,
    });

    let initializationPromise = null;
    const ensureModelInitialized = async () => {
      if (!initializationPromise) {
        initializationPromise = DynamoModel.table()
          .initialize()
          .catch((error) => {
            initializationPromise = null;
            throw error;
          });
      }

      return initializationPromise;
    };

    const wrapExec = (request) => {
      if (!request || typeof request.exec !== 'function') {
        return request;
      }

      const originalExec = request.exec.bind(request);
      request.exec = async (...args) => {
        await ensureModelInitialized();
        return originalExec(...args);
      };
      return request;
    };

    const originalScan = DynamoModel.scan.bind(DynamoModel);
    DynamoModel.scan = (...args) => wrapExec(originalScan(...args));

    const originalQuery = DynamoModel.query.bind(DynamoModel);
    DynamoModel.query = (...args) => wrapExec(originalQuery(...args));

    const originalGet = DynamoModel.get.bind(DynamoModel);
    DynamoModel.get = async (...args) => {
      await ensureModelInitialized();
      return originalGet(...args);
    };

    const originalSave = DynamoModel.prototype.save;
    DynamoModel.prototype.save = async function patchedSave(...args) {
      await ensureModelInitialized();
      return originalSave.apply(this, args);
    };

    return DynamoModel;
  }

  const memoryStore = new Map();
  const seedRecords = readLocalStoreRecords(modelName);

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
      return Array.from(memoryStore.values()).filter((item) =>
        valuesEqual(item?.[this.field], this.value),
      );
    }
  }

  class InMemoryScan {
    async exec() {
      return Array.from(memoryStore.values());
    }
  }

  class InMemoryModel {
    constructor(payload = {}) {
      Object.assign(this, payload);
    }

    static query(field) {
      return new InMemoryQuery(field);
    }

    static scan() {
      return new InMemoryScan();
    }

    static async get(key) {
      if (key && typeof key === 'object') {
        if (key.id) {
          return memoryStore.get(key.id) || null;
        }

        const match = Array.from(memoryStore.values()).find((item) =>
          Object.entries(key).every(([field, value]) =>
            valuesEqual(item?.[field], value),
          ),
        );
        return match || null;
      }

      return memoryStore.get(key) || null;
    }

    async save() {
      if (!this.id) {
        throw new Error(`${modelName} id is required`);
      }

      const now = new Date().toISOString();
      this.updatedAt = now;
      this.createdAt = this.createdAt || now;
      memoryStore.set(this.id, this);
      persistLocalStoreRecords(modelName, memoryStore);
      return this;
    }
  }

  seedRecords.forEach((record) => {
    if (!record?.id) {
      return;
    }

    memoryStore.set(record.id, new InMemoryModel(record));
  });

  const reason = isTestRuntime() ? 'test runtime' : 'USE_IN_MEMORY_DB=true';
  console.log(`[storage] Using in-memory ${modelName} store (${reason}).`);

  return InMemoryModel;
}
