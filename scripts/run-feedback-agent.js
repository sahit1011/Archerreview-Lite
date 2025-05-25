/**
 * Script to run the Feedback Agent for a user.
 * Usage: node scripts/run-feedback-agent.js <userId> "<feedbackText>"
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { processFeedbackOrchestrated } = require('../dynamic-calendar/src/services/agentOrchestrator');

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

async function runFeedback(userId, feedbackText) {
  try {
    console.log(`Running Feedback Agent for user: ${userId} with feedback: "${feedbackText}"`);
    // Second param is options (empty {} for defaults)
    const result = await processFeedbackOrchestrated(userId, feedbackText, {}); 
    console.log('Feedback Agent Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Error running Feedback Agent for user ${userId}:`, error);
    throw error;
  }
}

async function main() {
  const userId = process.argv[2];
  const feedbackText = process.argv[3];

  if (!userId || !feedbackText) {
    console.error('Please provide a user ID and feedback text as command line arguments.');
    console.log('Usage: node scripts/run-feedback-agent.js <userId> "<feedbackText>"');
    process.exit(1);
  }

  try {
    await connectToDatabase();
    await runFeedback(userId, feedbackText);
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
