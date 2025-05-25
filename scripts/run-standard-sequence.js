/**
 * Script to run the Standard Agent Sequence (Monitor, Adaptation) for a user.
 * Usage: node scripts/run-standard-sequence.js <userId>
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { runStandardSequence } = require('../dynamic-calendar/src/services/agentOrchestrator');

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    console.log('Already connected to MongoDB');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function runSequence(userId) {
  try {
    console.log(`Running Standard Agent Sequence (Monitor, Adaptation) for user: ${userId}`);
    // Second param is options (empty {} for defaults)
    const result = await runStandardSequence(userId, {}); 
    console.log('Standard Sequence Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Error running Standard Sequence for user ${userId}:`, error);
    throw error;
  }
}

async function main() {
  const userId = process.argv[2];

  if (!userId) {
    console.error('Please provide a user ID as a command line argument.');
    console.log('Usage: node scripts/run-standard-sequence.js <userId>');
    process.exit(1);
  }

  try {
    await connectToDatabase();
    await runSequence(userId);
  } catch (error) {
    // Error already logged
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

main();
