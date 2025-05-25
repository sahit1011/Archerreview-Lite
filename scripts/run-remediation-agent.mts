/**
 * Script to run the Remediation Agent for a user. (ESM/TypeScript version)
 * Usage: node --loader ts-node/esm ../scripts/run-remediation-agent.mts <userId> (when CWD is dynamic-calendar)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
// Assuming agentOrchestrator.ts is in dynamic-calendar/src/services/
const agentOrchestratorModule = await import('../dynamic-calendar/src/services/agentOrchestrator.js');
const { runAgent } = agentOrchestratorModule;

async function connectToDatabase(): Promise<void> {
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

async function runRemediation(userId: string): Promise<any> {
  try {
    console.log(`Running Remediation Agent for user: ${userId}`);
    // Second param is params (empty {} for remediation), third is options (empty {} for defaults)
    const result = await runAgent('remediation', userId, {}, {}); 
    console.log('Remediation Agent Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Error running Remediation Agent for user ${userId}:`, error);
    throw error;
  }
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Please provide a user ID as a command line argument.');
    console.log('Usage: node --loader ts-node/esm ../scripts/run-remediation-agent.mts <userId>');
    process.exit(1);
  }

  try {
    await connectToDatabase();
    await runRemediation(userId);
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
