/**
 * Script to run the Comprehensive Agent Sequence (Monitor, Adaptation, Remediation) for a user.
 * Usage: node scripts/run-comprehensive-sequence.js <userId>
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { runComprehensiveSequence } = require('../dynamic-calendar/src/services/agentOrchestrator');

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
    console.log(`Running Comprehensive Agent Sequence (Monitor, Adaptation, Remediation) for user: ${userId}`);
    // Second param is options (empty {} for defaults)
    const result = await runComprehensiveSequence(userId, {}); 
    console.log('Comprehensive Sequence Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Error running Comprehensive Sequence for user ${userId}:`, error);
    throw error;
  }
}

async function main() {
  const userId = process.argv[2];

  if (!userId) {
    console.error('Please provide a user ID as a command line argument.');
    console.log('Usage: node scripts/run-comprehensive-sequence.js <userId>');
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
