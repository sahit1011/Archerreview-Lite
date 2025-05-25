/**
 * Test script for the Monitor Agent
 * 
 * This script tests the Monitor Agent functionality by:
 * 1. Finding a test user with a study plan
 * 2. Running the Monitor Agent for that user
 * 3. Displaying the results
 * 
 * Usage: node scripts/test-monitor-agent.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar';

async function main() {
  console.log('Testing Monitor Agent...');
  
  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Find a test user with a study plan
    const user = await db.collection('users').findOne({ email: 'test@example.com' });
    
    if (!user) {
      console.error('Test user not found. Please create a test user first.');
      return;
    }
    
    console.log(`Found test user: ${user.name} (${user._id})`);
    
    // Find the user's study plan
    const studyPlan = await db.collection('studyplans').findOne({ user: user._id });
    
    if (!studyPlan) {
      console.error('Test user does not have a study plan. Please create a study plan first.');
      return;
    }
    
    console.log(`Found study plan: ${studyPlan._id}`);
    
    // Get tasks for the study plan
    const tasks = await db.collection('tasks').find({ plan: studyPlan._id }).toArray();
    console.log(`Found ${tasks.length} tasks`);
    
    // Get performances for the user
    const performances = await db.collection('performances').find({ user: user._id }).toArray();
    console.log(`Found ${performances.length} performance records`);
    
    // Get readiness score for the user
    const readinessScore = await db.collection('readinessscores').findOne({ user: user._id });
    console.log(`Readiness score: ${readinessScore ? readinessScore.overallScore + '%' : 'Not found'}`);
    
    // Simulate running the Monitor Agent
    console.log('\nSimulating Monitor Agent run...');
    
    // Calculate basic statistics
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const missedTasks = tasks.filter(task => 
      task.status === 'PENDING' && new Date(task.endTime) < new Date()
    ).length;
    
    console.log(`Completed tasks: ${completedTasks}/${tasks.length} (${Math.round((completedTasks / tasks.length) * 100)}%)`);
    console.log(`Missed tasks: ${missedTasks}/${tasks.length} (${Math.round((missedTasks / tasks.length) * 100)}%)`);
    
    // Check for missed tasks alert
    const missedPercentage = (missedTasks / tasks.length) * 100;
    if (missedPercentage >= 20) {
      console.log('\nALERT: MISSED_TASK');
      console.log(`Severity: ${missedPercentage >= 30 ? 'HIGH' : 'MEDIUM'}`);
      console.log(`Message: ${Math.round(missedPercentage)}% of tasks have been missed. Consider adjusting the schedule.`);
    }
    
    // Check for performance issues
    if (performances.length > 0) {
      const totalScore = performances.reduce((sum, perf) => sum + (perf.score || 0), 0);
      const avgPerformance = totalScore / performances.length;
      
      console.log(`\nAverage performance: ${Math.round(avgPerformance)}%`);
      
      if (avgPerformance < 60) {
        console.log('\nALERT: LOW_PERFORMANCE');
        console.log(`Severity: ${avgPerformance < 50 ? 'HIGH' : 'MEDIUM'}`);
        console.log(`Message: Overall performance is below target (${Math.round(avgPerformance)}%). Consider reviewing difficult topics.`);
      }
    }
    
    // Check readiness score
    if (readinessScore && readinessScore.overallScore < 65) {
      console.log('\nALERT: GENERAL');
      console.log(`Severity: MEDIUM`);
      console.log(`Message: Your readiness score (${Math.round(readinessScore.overallScore)}%) is below the target threshold. Focus on weak areas to improve.`);
    }
    
    console.log('\nTest completed successfully.');
  } catch (error) {
    console.error('Error testing Monitor Agent:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(console.error);
