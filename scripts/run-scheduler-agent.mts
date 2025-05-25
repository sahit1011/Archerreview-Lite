/**
 * Script to run the Scheduler Agent for a user.
 * Usage: node scripts/run-scheduler-agent.js <userId>
 */

import 'dotenv/config'; // ESM way to load dotenv
import mongoose from 'mongoose';
// Dynamic import for agentOrchestrator
const agentOrchestratorModule = await import('../dynamic-calendar/src/services/agentOrchestrator.js'); // .js extension often needed for ESM imports of TS files
const { generateStudyPlanOrchestrated } = agentOrchestratorModule;


async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    console.log('Already connected to MongoDB');
    return;
  }
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set.');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function runScheduler(userId: string) { // Add type for userId
  try {
    console.log(`Running Scheduler Agent for user: ${userId}`);
    const result = await generateStudyPlanOrchestrated(userId);
    console.log('Scheduler Agent Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Error running Scheduler Agent for user ${userId}:`, error);
    throw error;
  }
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Please provide a user ID as a command line argument.');
    console.log('Usage: node scripts/run-scheduler-agent.js <userId>');
    process.exit(1);
  }

  try {
    await connectToDatabase();
    await runScheduler(userId);
  } catch (error) {
    // Error already logged in runScheduler
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
    process.exit(0); // Exit cleanly even if agent fails, error is logged.
  }
}

main();
