// This script creates a sample quiz task for testing the quiz interface

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar';

async function createQuizTask() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const userCollection = db.collection('users');
    const studyPlanCollection = db.collection('studyplans');
    const contentCollection = db.collection('contents');
    const taskCollection = db.collection('tasks');
    const topicCollection = db.collection('topics');

    // Get the first user
    const user = await userCollection.findOne();
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }

    // Get the user's study plan
    const studyPlan = await studyPlanCollection.findOne({ user: user._id });
    if (!studyPlan) {
      console.log('No study plan found for this user. Please create a study plan first.');
      return;
    }

    // Get a quiz content
    const quizContent = await contentCollection.findOne({ type: 'QUIZ' });
    if (!quizContent) {
      console.log('No quiz content found. Please seed quiz content first.');
      return;
    }

    // Create a task for today
    const today = new Date();
    const startTime = new Date(today);
    startTime.setHours(10, 0, 0, 0); // 10:00 AM
    
    const endTime = new Date(today);
    endTime.setHours(10, quizContent.duration, 0, 0); // 10:00 AM + quiz duration

    const task = {
      plan: studyPlan._id,
      title: quizContent.title,
      description: quizContent.description,
      type: 'QUIZ',
      status: 'PENDING',
      startTime,
      endTime,
      duration: quizContent.duration,
      content: quizContent._id,
      topic: quizContent.topic,
      difficulty: quizContent.difficulty,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert task
    const result = await taskCollection.insertOne(task);
    console.log(`Inserted quiz task with ID: ${result.insertedId}`);

    console.log('Sample quiz task created successfully');
  } catch (error) {
    console.error('Error creating quiz task:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

createQuizTask().catch(console.error);
