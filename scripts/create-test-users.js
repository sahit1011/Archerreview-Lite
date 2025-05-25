const { MongoClient, ObjectId } = require('mongodb');
const { format, addDays, addWeeks, addMonths } = require('date-fns');

// Connect to MongoDB
async function createTestUsers() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Create test users
    const users = [
      {
        _id: new ObjectId(),
        name: "Urgent Exam User",
        email: "urgent@example.com",
        examDate: addWeeks(new Date(), 2), // Exam in 2 weeks
        preferences: {
          availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          studyHoursPerDay: 4,
          preferredStudyTime: "evening",
          notifications: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Active User",
        email: "active@example.com",
        examDate: addMonths(new Date(), 3), // Exam in 3 months
        preferences: {
          availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          studyHoursPerDay: 2,
          preferredStudyTime: "morning",
          notifications: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "New User",
        email: "new@example.com",
        examDate: addMonths(new Date(), 6), // Exam in 6 months
        preferences: {
          availableDays: ["Monday", "Wednesday", "Friday"],
          studyHoursPerDay: 1,
          preferredStudyTime: "afternoon",
          notifications: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert users
    const result = await db.collection('users').insertMany(users);
    console.log(`${result.insertedCount} users inserted`);
    
    // Create study plans for each user
    const studyPlans = users.map(user => ({
      _id: new ObjectId(),
      user: user._id,
      examDate: user.examDate,
      isPersonalized: user.name === "Active User", // Only the active user has a personalized plan
      startDate: new Date(),
      endDate: user.examDate,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert study plans
    const plansResult = await db.collection('studyplans').insertMany(studyPlans);
    console.log(`${plansResult.insertedCount} study plans inserted`);
    
    // Create topics if they don't exist
    const existingTopics = await db.collection('topics').find({}).toArray();
    
    let topics = existingTopics;
    
    if (existingTopics.length === 0) {
      const newTopics = [
        {
          _id: new ObjectId(),
          name: "Pharmacology Basics",
          description: "Introduction to pharmacology principles",
          category: "PHARMACOLOGICAL_THERAPIES",
          difficulty: "MEDIUM",
          importance: 8,
          estimatedDuration: 120,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Patient Assessment",
          description: "Comprehensive patient assessment techniques",
          category: "HEALTH_PROMOTION",
          difficulty: "HARD",
          importance: 9,
          estimatedDuration: 150,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Infection Control",
          description: "Principles of infection prevention and control",
          category: "SAFETY_AND_INFECTION_CONTROL",
          difficulty: "MEDIUM",
          importance: 7,
          estimatedDuration: 90,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Mental Health Nursing",
          description: "Psychiatric and mental health nursing concepts",
          category: "PSYCHOSOCIAL_INTEGRITY",
          difficulty: "HARD",
          importance: 8,
          estimatedDuration: 180,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: "Cardiovascular Nursing",
          description: "Care of patients with cardiovascular disorders",
          category: "PHYSIOLOGICAL_ADAPTATION",
          difficulty: "HARD",
          importance: 9,
          estimatedDuration: 210,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const topicsResult = await db.collection('topics').insertMany(newTopics);
      console.log(`${topicsResult.insertedCount} topics inserted`);
      topics = newTopics;
    }
    
    // Create tasks for the urgent user (many tasks starting today)
    const urgentUserPlan = studyPlans.find(plan => plan.user.toString() === users[0]._id.toString());
    const urgentUserTasks = [];
    
    // Create 5 tasks for today and the next few days
    for (let i = 0; i < 5; i++) {
      const startTime = new Date();
      startTime.setHours(9 + i * 2, 0, 0, 0); // Tasks at 9am, 11am, 1pm, 3pm, 5pm
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1, 30, 0, 0); // Each task is 1.5 hours
      
      urgentUserTasks.push({
        _id: new ObjectId(),
        plan: urgentUserPlan._id,
        title: `${topics[i % topics.length].name} - Intensive Study`,
        description: `Focused study session on ${topics[i % topics.length].name}`,
        type: ["READING", "QUIZ", "VIDEO", "PRACTICE", "REVIEW"][i % 5],
        status: "PENDING",
        startTime,
        endTime,
        duration: 90, // 1.5 hours in minutes
        topic: topics[i % topics.length]._id,
        difficulty: topics[i % topics.length].difficulty,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Create tasks for the active user (some completed, some pending)
    const activeUserPlan = studyPlans.find(plan => plan.user.toString() === users[1]._id.toString());
    const activeUserTasks = [];
    
    // Create 10 tasks, 5 completed and 5 pending
    for (let i = 0; i < 10; i++) {
      const dayOffset = i < 5 ? -(i + 1) : i - 4; // First 5 in the past, next 5 in the future
      const startTime = addDays(new Date(), dayOffset);
      startTime.setHours(10, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1, 0, 0, 0); // Each task is 1 hour
      
      activeUserTasks.push({
        _id: new ObjectId(),
        plan: activeUserPlan._id,
        title: `${topics[i % topics.length].name} - Regular Study`,
        description: `Regular study session on ${topics[i % topics.length].name}`,
        type: ["READING", "QUIZ", "VIDEO", "PRACTICE", "REVIEW"][i % 5],
        status: i < 5 ? "COMPLETED" : "PENDING", // First 5 are completed
        startTime,
        endTime,
        duration: 60, // 1 hour in minutes
        topic: topics[i % topics.length]._id,
        difficulty: topics[i % topics.length].difficulty,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Insert all tasks
    const allTasks = [...urgentUserTasks, ...activeUserTasks];
    const tasksResult = await db.collection('tasks').insertMany(allTasks);
    console.log(`${tasksResult.insertedCount} tasks inserted`);
    
    // Create performance data for the active user's completed tasks
    const performances = activeUserTasks
      .filter(task => task.status === "COMPLETED")
      .map(task => {
        const score = Math.floor(Math.random() * 41) + 60; // Random score between 60-100
        return {
          _id: new ObjectId(),
          user: users[1]._id,
          task: task._id,
          topic: task.topic,
          score,
          timeSpent: task.duration - Math.floor(Math.random() * 15), // Slightly less than duration
          completed: true,
          confidence: Math.floor(score / 20), // 1-5 scale based on score
          createdAt: task.endTime,
          updatedAt: task.endTime
        };
      });
    
    if (performances.length > 0) {
      const performancesResult = await db.collection('performances').insertMany(performances);
      console.log(`${performancesResult.insertedCount} performances inserted`);
    }
    
    // Create readiness score for the active user
    const categoryScores = [
      { category: "PHARMACOLOGICAL_THERAPIES", score: 75 },
      { category: "HEALTH_PROMOTION", score: 82 },
      { category: "SAFETY_AND_INFECTION_CONTROL", score: 68 },
      { category: "PSYCHOSOCIAL_INTEGRITY", score: 60 },
      { category: "PHYSIOLOGICAL_ADAPTATION", score: 72 }
    ];
    
    const readinessScore = {
      _id: new ObjectId(),
      user: users[1]._id,
      plan: activeUserPlan._id,
      overallScore: 72, // Average of category scores
      categoryScores,
      weakAreas: [topics[3]._id, topics[2]._id], // Mental Health and Infection Control
      strongAreas: [topics[1]._id], // Patient Assessment
      projectedScore: 85, // Projected to improve
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('readinessscores').insertOne(readinessScore);
    console.log(`Readiness score inserted for active user`);
    
    console.log('Test data creation complete!');
    console.log('User IDs:');
    console.log(`Urgent Exam User: ${users[0]._id}`);
    console.log(`Active User: ${users[1]._id}`);
    console.log(`New User: ${users[2]._id}`);
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

createTestUsers();
