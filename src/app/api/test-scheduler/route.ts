import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, Topic, StudyPlan } from '@/models';
import mongoose from 'mongoose';

/**
 * API endpoint for testing the scheduler agent
 * This endpoint creates sample topics and a test user if they don't exist
 * GET /api/test-scheduler
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Check if we have topics in the database
    const topicsCount = await Topic.countDocuments();
    
    // If no topics exist, create sample topics
    if (topicsCount === 0) {
      await createSampleTopics();
    }
    
    // Check if we have a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    // If no test user exists, create one
    if (!testUser) {
      testUser = await createTestUser();
    }
    
    // Check if the test user has a study plan
    const studyPlan = await StudyPlan.findOne({ user: testUser._id });
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Scheduler test setup complete',
      testUser,
      studyPlan,
      topicsCount: await Topic.countDocuments()
    });
  } catch (error) {
    console.error('Error setting up scheduler test:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to set up scheduler test',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Create sample topics for testing
 */
async function createSampleTopics() {
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
  
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  
  // Create 20 sample topics
  const topics = [];
  
  for (let i = 1; i <= 20; i++) {
    const topic = new Topic({
      name: `Sample Topic ${i}`,
      description: `Description for sample topic ${i}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      subcategory: `Subcategory ${Math.floor(i / 3) + 1}`,
      prerequisites: [], // Will be filled later
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      importance: Math.floor(Math.random() * 10) + 1,
      estimatedDuration: (Math.floor(Math.random() * 5) + 1) * 30 // 30-150 minutes
    });
    
    await topic.save();
    topics.push(topic);
  }
  
  // Add prerequisites (ensuring no circular dependencies)
  for (let i = 5; i < topics.length; i++) {
    // Each topic can have 0-2 prerequisites from earlier topics
    const numPrereqs = Math.floor(Math.random() * 3);
    const prereqIndices = new Set<number>();
    
    for (let j = 0; j < numPrereqs; j++) {
      const prereqIndex = Math.floor(Math.random() * i);
      prereqIndices.add(prereqIndex);
    }
    
    topics[i].prerequisites = Array.from(prereqIndices).map(idx => topics[idx]._id);
    await topics[i].save();
  }
  
  return topics;
}

/**
 * Create a test user for scheduler testing
 */
async function createTestUser() {
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 60); // Exam in 60 days
  
  const user = new User({
    name: 'Test User',
    email: 'test@example.com',
    examDate,
    preferences: {
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      studyHoursPerDay: 3,
      preferredStudyTime: 'morning',
      notifications: true
    }
  });
  
  await user.save();
  return user;
}
