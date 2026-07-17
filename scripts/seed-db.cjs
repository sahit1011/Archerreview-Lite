// Database seeding script for the Dynamic Calendar application
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection URI
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar';

// Subject categories for NEET/JEE topics
const categories = [
  'PHYSICS',
  'CHEMISTRY',
  'BIOLOGY',
  'MATHEMATICS'
];

// Difficulty levels
const difficulties = ['EASY', 'MEDIUM', 'HARD'];

// Task types
const taskTypes = ['VIDEO', 'QUIZ', 'READING', 'PRACTICE', 'REVIEW'];

// Sample topics data
// Sample topics data — NEET/JEE chapters tagged by subject + exam
const sampleTopics = [
  {
    name: "Kinematics",
    description: "Motion in one and two dimensions: displacement, velocity, acceleration, projectile motion.",
    category: "PHYSICS",
    subcategory: "Mechanics",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 9,
    estimatedDuration: 120
  },
  {
    name: "Laws of Motion",
    description: "Newton's laws, friction, circular motion dynamics and their applications.",
    category: "PHYSICS",
    subcategory: "Mechanics",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 9,
    estimatedDuration: 120
  },
  {
    name: "Work, Energy & Power",
    description: "Work-energy theorem, conservation of energy, collisions and power.",
    category: "PHYSICS",
    subcategory: "Mechanics",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 8,
    estimatedDuration: 100
  },
  {
    name: "Thermodynamics (Physics)",
    description: "Heat, temperature, laws of thermodynamics, heat engines and kinetic theory.",
    category: "PHYSICS",
    subcategory: "Heat & Thermodynamics",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "HARD",
    importance: 8,
    estimatedDuration: 120
  },
  {
    name: "Current Electricity",
    description: "Ohm's law, circuits, Kirchhoff's laws, resistivity and electrical measurements.",
    category: "PHYSICS",
    subcategory: "Electrodynamics",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 9,
    estimatedDuration: 120
  },
  {
    name: "Ray & Wave Optics",
    description: "Reflection, refraction, lenses, interference, diffraction and polarization.",
    category: "PHYSICS",
    subcategory: "Optics",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 8,
    estimatedDuration: 110
  },
  {
    name: "Modern Physics",
    description: "Photoelectric effect, Bohr model, nuclei, radioactivity and semiconductors.",
    category: "PHYSICS",
    subcategory: "Modern Physics",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 9,
    estimatedDuration: 110
  },
  {
    name: "Atomic Structure & Chemical Bonding",
    description: "Quantum numbers, orbitals, periodicity, ionic/covalent bonding, VSEPR and hybridization.",
    category: "CHEMISTRY",
    subcategory: "Physical Chemistry",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 9,
    estimatedDuration: 120
  },
  {
    name: "Equilibrium & Kinetics",
    description: "Chemical and ionic equilibrium, pH and buffers, rates of reaction and order.",
    category: "CHEMISTRY",
    subcategory: "Physical Chemistry",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "HARD",
    importance: 8,
    estimatedDuration: 130
  },
  {
    name: "General Organic Chemistry & Hydrocarbons",
    description: "IUPAC nomenclature, isomerism, reaction mechanisms, alkanes/alkenes/alkynes and aromaticity.",
    category: "CHEMISTRY",
    subcategory: "Organic Chemistry",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "HARD",
    importance: 9,
    estimatedDuration: 140
  },
  {
    name: "Periodic Table & p-Block Elements",
    description: "Periodic trends, group chemistry of p-block elements and their compounds.",
    category: "CHEMISTRY",
    subcategory: "Inorganic Chemistry",
    examTypes: ["NEET", "JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 7,
    estimatedDuration: 100
  },
  {
    name: "Cell Structure & Function",
    description: "Cell theory, organelles, biomolecules, cell cycle and cell division.",
    category: "BIOLOGY",
    subcategory: "Botany",
    examTypes: ["NEET"],
    prerequisites: [],
    difficulty: "EASY",
    importance: 8,
    estimatedDuration: 90
  },
  {
    name: "Genetics & Evolution",
    description: "Mendelian inheritance, molecular basis of inheritance, variation and evolution.",
    category: "BIOLOGY",
    subcategory: "Botany",
    examTypes: ["NEET"],
    prerequisites: [],
    difficulty: "HARD",
    importance: 9,
    estimatedDuration: 130
  },
  {
    name: "Human Physiology",
    description: "Digestion, breathing, circulation, excretion, neural control and endocrine system.",
    category: "BIOLOGY",
    subcategory: "Zoology",
    examTypes: ["NEET"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 10,
    estimatedDuration: 150
  },
  {
    name: "Plant Physiology",
    description: "Photosynthesis, respiration, transport in plants and plant growth regulators.",
    category: "BIOLOGY",
    subcategory: "Botany",
    examTypes: ["NEET"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 7,
    estimatedDuration: 100
  },
  {
    name: "Ecology & Environment",
    description: "Organisms and populations, ecosystems, biodiversity and environmental issues.",
    category: "BIOLOGY",
    subcategory: "Botany",
    examTypes: ["NEET"],
    prerequisites: [],
    difficulty: "EASY",
    importance: 7,
    estimatedDuration: 80
  },
  {
    name: "Algebra: Quadratics & Sequences",
    description: "Quadratic equations, complex numbers, progressions, permutations and combinations.",
    category: "MATHEMATICS",
    subcategory: "Algebra",
    examTypes: ["JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 9,
    estimatedDuration: 130
  },
  {
    name: "Calculus",
    description: "Limits, continuity, differentiation, applications of derivatives and integration.",
    category: "MATHEMATICS",
    subcategory: "Calculus",
    examTypes: ["JEE"],
    prerequisites: [],
    difficulty: "HARD",
    importance: 10,
    estimatedDuration: 150
  },
  {
    name: "Coordinate Geometry",
    description: "Straight lines, circles, parabola, ellipse and hyperbola.",
    category: "MATHEMATICS",
    subcategory: "Coordinate Geometry",
    examTypes: ["JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 8,
    estimatedDuration: 120
  },
  {
    name: "Vectors & 3D Geometry",
    description: "Vector algebra, scalar/vector products, lines and planes in space.",
    category: "MATHEMATICS",
    subcategory: "Vectors",
    examTypes: ["JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 8,
    estimatedDuration: 110
  },
  {
    name: "Trigonometry",
    description: "Trigonometric identities, equations, inverse functions and properties of triangles.",
    category: "MATHEMATICS",
    subcategory: "Trigonometry",
    examTypes: ["JEE"],
    prerequisites: [],
    difficulty: "MEDIUM",
    importance: 7,
    estimatedDuration: 100
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
    
    // Wire prerequisites: each topic may depend on up to 2 EARLIER topics of the
    // same subject (keeps the graph acyclic and pedagogically sensible).
    for (let i = 1; i < topics.length; i++) {
      const earlierSameSubject = topics
        .slice(0, i)
        .filter((t) => t.category === topics[i].category);
      if (earlierSameSubject.length === 0) continue;

      const numPrereqs = Math.min(
        Math.floor(Math.random() * 3),
        earlierSameSubject.length
      );
      const prereqIds = new Set();
      for (let j = 0; j < numPrereqs; j++) {
        const pick = earlierSameSubject[Math.floor(Math.random() * earlierSameSubject.length)];
        prereqIds.add(pick._id);
      }

      await db.collection('topics').updateOne(
        { _id: topics[i]._id },
        { $set: { prerequisites: Array.from(prereqIds) } }
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
