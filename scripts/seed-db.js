// Database seeding script for the Dynamic Calendar application
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection URI
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar';

// Categories for NCLEX topics
const categories = [
  'MANAGEMENT_OF_CARE',
  'SAFETY_AND_INFECTION_CONTROL',
  'HEALTH_PROMOTION',
  'PSYCHOSOCIAL_INTEGRITY',
  'BASIC_CARE_AND_COMFORT',
  'PHARMACOLOGICAL_THERAPIES',
  'REDUCTION_OF_RISK_POTENTIAL',
  'PHYSIOLOGICAL_ADAPTATION'
];

// Difficulty levels
const difficulties = ['EASY', 'MEDIUM', 'HARD'];

// Task types
const taskTypes = ['VIDEO', 'QUIZ', 'READING', 'PRACTICE', 'REVIEW'];

// Sample topics data
const sampleTopics = [
  {
    name: 'Cardiovascular Nursing',
    description: 'Study of the heart and circulatory system',
    category: 'PHYSIOLOGICAL_ADAPTATION',
    subcategory: 'Cardiovascular',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 8,
    estimatedDuration: 120
  },
  {
    name: 'Respiratory Nursing',
    description: 'Study of the respiratory system',
    category: 'PHYSIOLOGICAL_ADAPTATION',
    subcategory: 'Respiratory',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 7,
    estimatedDuration: 90
  },
  {
    name: 'Medication Administration',
    description: 'Safe administration of medications',
    category: 'PHARMACOLOGICAL_THERAPIES',
    subcategory: 'Administration',
    prerequisites: [],
    difficulty: 'HARD',
    importance: 9,
    estimatedDuration: 150
  },
  {
    name: 'Infection Control',
    description: 'Prevention and control of infections',
    category: 'SAFETY_AND_INFECTION_CONTROL',
    subcategory: 'Infection Control',
    prerequisites: [],
    difficulty: 'EASY',
    importance: 8,
    estimatedDuration: 60
  },
  {
    name: 'Pain Management',
    description: 'Assessment and management of pain',
    category: 'BASIC_CARE_AND_COMFORT',
    subcategory: 'Pain Management',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 7,
    estimatedDuration: 90
  },
  {
    name: 'Fluid and Electrolyte Balance',
    description: 'Maintaining fluid and electrolyte balance',
    category: 'PHYSIOLOGICAL_ADAPTATION',
    subcategory: 'Fluids and Electrolytes',
    prerequisites: [],
    difficulty: 'HARD',
    importance: 8,
    estimatedDuration: 120
  },
  {
    name: 'Diabetes Management',
    description: 'Care of patients with diabetes',
    category: 'PHYSIOLOGICAL_ADAPTATION',
    subcategory: 'Endocrine',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 8,
    estimatedDuration: 120
  },
  {
    name: 'Wound Care',
    description: 'Assessment and management of wounds',
    category: 'BASIC_CARE_AND_COMFORT',
    subcategory: 'Skin Integrity',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 7,
    estimatedDuration: 90
  },
  {
    name: 'Mental Health Assessment',
    description: 'Assessment of mental health status',
    category: 'PSYCHOSOCIAL_INTEGRITY',
    subcategory: 'Mental Health',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 7,
    estimatedDuration: 90
  },
  {
    name: 'Pharmacology Basics',
    description: 'Basic principles of pharmacology',
    category: 'PHARMACOLOGICAL_THERAPIES',
    subcategory: 'Principles',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 9,
    estimatedDuration: 120
  },
  {
    name: 'IV Therapy',
    description: 'Administration of intravenous therapy',
    category: 'PHARMACOLOGICAL_THERAPIES',
    subcategory: 'IV Therapy',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 8,
    estimatedDuration: 90
  },
  {
    name: 'Cardiac Medications',
    description: 'Medications used in cardiac care',
    category: 'PHARMACOLOGICAL_THERAPIES',
    subcategory: 'Cardiac',
    prerequisites: [],
    difficulty: 'HARD',
    importance: 8,
    estimatedDuration: 120
  },
  {
    name: 'Respiratory Medications',
    description: 'Medications used in respiratory care',
    category: 'PHARMACOLOGICAL_THERAPIES',
    subcategory: 'Respiratory',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 7,
    estimatedDuration: 90
  },
  {
    name: 'Delegation and Supervision',
    description: 'Principles of delegation and supervision',
    category: 'MANAGEMENT_OF_CARE',
    subcategory: 'Delegation',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 8,
    estimatedDuration: 90
  },
  {
    name: 'Legal and Ethical Issues',
    description: 'Legal and ethical aspects of nursing practice',
    category: 'MANAGEMENT_OF_CARE',
    subcategory: 'Legal/Ethical',
    prerequisites: [],
    difficulty: 'MEDIUM',
    importance: 7,
    estimatedDuration: 120
  }
];

// Create a test user
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
  preferences: {
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    studyHoursPerDay: 3,
    preferredStudyTime: 'morning',
    notifications: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Main function to seed the database
async function seedDatabase() {
  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    // Get database
    const db = client.db();

    // Clear existing collections
    await db.collection('users').deleteMany({});
    await db.collection('topics').deleteMany({});
    await db.collection('studyplans').deleteMany({});
    await db.collection('tasks').deleteMany({});
    await db.collection('diagnosticresults').deleteMany({});
    console.log('Cleared existing collections');

    // Insert test user
    const userResult = await db.collection('users').insertOne(testUser);
    const userId = userResult.insertedId;
    console.log(`Created test user with ID: ${userId}`);

    // Insert topics
    const topicsWithIds = sampleTopics.map(topic => ({
      ...topic,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    const topicsResult = await db.collection('topics').insertMany(topicsWithIds);
    console.log(`Inserted ${topicsResult.insertedCount} topics`);

    // Get topic IDs
    const topics = await db.collection('topics').find().toArray();
    
    // Update topics with prerequisites (to avoid circular dependencies)
    for (let i = 5; i < topics.length; i++) {
      // Each topic can have 0-2 prerequisites from earlier topics
      const numPrereqs = Math.floor(Math.random() * 3);
      const prereqIndices = new Set();
      
      for (let j = 0; j < numPrereqs; j++) {
        const prereqIndex = Math.floor(Math.random() * i);
        prereqIndices.add(prereqIndex);
      }
      
      const prerequisites = Array.from(prereqIndices).map(idx => topics[idx]._id);
      
      await db.collection('topics').updateOne(
        { _id: topics[i]._id },
        { $set: { prerequisites } }
      );
    }
    console.log('Updated topics with prerequisites');

    // Create a study plan
    const studyPlan = {
      user: userId,
      examDate: testUser.examDate,
      isPersonalized: false,
      startDate: new Date(),
      endDate: testUser.examDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const planResult = await db.collection('studyplans').insertOne(studyPlan);
    const planId = planResult.insertedId;
    console.log(`Created study plan with ID: ${planId}`);

    // Create a diagnostic result (skipped)
    const diagnosticResult = {
      user: userId,
      completed: false,
      skipped: true,
      score: 0,
      categoryScores: [],
      answers: [],
      weakAreas: [],
      recommendedFocus: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const diagnosticResultResult = await db.collection('diagnosticresults').insertOne(diagnosticResult);
    console.log(`Created diagnostic result with ID: ${diagnosticResultResult.insertedId}`);

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the seeding function
seedDatabase();
