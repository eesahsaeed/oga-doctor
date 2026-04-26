import dynamoose from 'dynamoose';
import { AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_ACCESS_KEY_ID } from '../helper.js';

// ✅ Correct way to configure custom DynamoDB instance in Dynamoose (v3+)
const ddb = new dynamoose.aws.ddb.DynamoDB({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  region: AWS_REGION,
});

// Set the custom DynamoDB instance for Dynamoose to use
dynamoose.aws.ddb.set(ddb);

const userSchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      hashKey: true,        // Primary Key (Partition Key)
      required: true,
    },

    email: { 
      type: String, 
      rangeKey: true, 
      required: true,
      index: {
        name: "emailIndex",
        global: true,
        project: true
      }
    },

    password: {
      type: String,
      required: true,
    },

    authType: {
      type: String,
      required: true
    },
    name: String,
    onboarding: Object,
    isPremium: {
      type: Boolean,
      default: false
    },
    notificationSettings: Object,
    appointments: {
      type: Array,
      schema: [Object],
      default: []
    },
    notifications: {
      type: Array,
      schema: [Object],
      default: []
    },
    vitals: {
      type: Array,
      schema: [Object],
      default: []
    },
    labResults: {
      type: Array,
      schema: [Object],
      default: []
    },
    documents: {
      type: Array,
      schema: [Object],
      default: []
    },
    vaccinations: {
      type: Array,
      schema: [String],
      default: []
    }
  },
  {
    timestamps: true,       // Automatically adds & manages createdAt + updatedAt
    saveUnknown: true,      // Allows app feature data without breaking writes
  }
);

// Create the model
const User = dynamoose.model('User', userSchema);

export default User;

// dynamoose.aws.ddb.set(ddb);

// const TABLE_NAME = 'HealthAppData';

// const HealthSchema = new dynamoose.Schema(
//   {
//     PK: { type: String, hashKey: true, required: true },
//     email: { type: String, rangeKey: true, required: true },

//     entityType: {
//       type: String,
//       required: true,
//       enum: ['PROFILE','APPOINTMENT','VITAL','LAB_RESULT','DOCUMENT','NOTIFICATION','PREGNANCY_MILESTONE','PRESCRIPTION'],
//     },

//     userId: String,

//     // Profile fields
//     language: String,
//     gender: String,
//     age: Number,
//     bloodType: String,
//     heightCm: Number,
//     weightKg: Number,
//     bmi: Number,
//     mainHealthCategory: String,
//     subHealthCategory: String,
//     womensStage: String,
//     pregnancyWeeks: Number,
//     dueDate: String,
//     isFirstPregnancy: Boolean,
//     conditions: Array,
//     allergies: Array,
//     currentMedications: Array,
//     isPremium: Boolean,
//     onboardingCompleted: Boolean,
    
//     // FIX: Change Mixed to Object
//     uiPreferences: Object,
//     preferences: Object,
//     customData: Object,

//     // Appointment
//     apptId: String,
//     startTime: String,
//     endTime: String,
//     doctor: String,
//     type: String,
//     reason: String,
//     status: String,
//     location: String,
//     notes: String,

//     // Vital
//     vitalType: String,
//     value: Number,
//     unit: String,
//     trend: String,
//     recordedAt: String,

//     // Notification
//     title: String,
//     description: String,
//     category: String,
//     read: Boolean,
//     actionLabel: String,
//     notificationTimestamp: String,

//     // GSI fields
//     GSI1PK: String,
//     GSI1SK: String,
//     GSI2PK: String,
//     GSI2SK: String,

//     // Note: timestamps: true handles createdAt/updatedAt automatically
//     // You don't strictly need them here unless you want to manually override
//   },
//   {
//     timestamps: true,
//     // Allows any keys inside the Objects or at the root level
//     saveUnknown: true, 
//     throughput: "ON_DEMAND", // Recommended over fixed 5/5 unless strictly budgeting
//     indexes: [
//       { name: 'WomensStageIndex', global: true, hashKey: 'womensStage', rangeKey: 'updatedAt', project: true },
//       { name: 'AppointmentsByTime', global: true, hashKey: 'GSI1PK', rangeKey: 'GSI1SK', project: true },
//       { name: 'NotificationsByTime', global: true, hashKey: 'GSI2PK', rangeKey: 'GSI2SK', project: true },
//     ],
//   }
// );

// const HealthModel = dynamoose.model('HealthModel', HealthSchema, { 
//   tableName: TABLE_NAME,
//   create: false // Set to true if you want Dynamoose to create the table for you
// });

// export { HealthModel };
