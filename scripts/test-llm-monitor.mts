/**
 * Test script for the LLM-enhanced Monitor Agent (ESM/TypeScript version)
 * 
 * This script tests the LLM-enhanced Monitor Agent by running it for a specific user
 * and logging the results, including the LLM-generated insights.
 * 
 * Usage: node --loader ts-node/esm ../scripts/test-llm-monitor.mts <userId> (when CWD is dynamic-calendar)
 * or: cd dynamic-calendar && node --loader ts-node/esm -r tsconfig-paths/register ../scripts/test-llm-monitor.mts <userId>
 */

import 'dotenv/config'; // ESM way to load dotenv
import mongoose from 'mongoose';
// Assuming monitorAgent.ts is in dynamic-calendar/src/services/
// and this script is in scripts/ at the same level as dynamic-calendar/
const monitorAgentModule = await import('../dynamic-calendar/src/services/monitorAgent.js');
const { runMonitorAgent } = monitorAgentModule;

// Connect to MongoDB
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

// Run the monitor agent for a user
async function testMonitorAgent(userId: string): Promise<any> { // Return type can be more specific if MonitoringResult is exported
  try {
    console.log(`Running monitor agent for user: ${userId}`);
    
    // Set environment variable to enable LLM
    // Note: process.env modifications like this might not be consistently picked up by subsequently imported modules
    // depending on when they are imported and cached. It's generally better to configure this via .env or other means.
    process.env.USE_LLM_MONITOR = 'true'; 
    
    // Run the monitor agent
    const result = await runMonitorAgent(userId);
    
    // Log basic results
    console.log('\n--- Basic Monitoring Results ---');
    console.log(`User ID: ${result.userId}`);
    console.log(`Plan ID: ${result.planId}`);
    console.log(`Total Tasks: ${result.stats.totalTasks}`);
    console.log(`Completed Tasks: ${result.stats.completedTasks}`);
    console.log(`Missed Tasks: ${result.stats.missedTasks}`);
    console.log(`Average Performance: ${result.stats.averagePerformance?.toFixed(2) || 'N/A'}%`);
    console.log(`Readiness Score: ${result.stats.readinessScore}`);
    
    // Log rule-based alerts
    console.log('\n--- Rule-Based Alerts ---');
    if (!result.alerts || result.alerts.length === 0) {
      console.log('No rule-based alerts generated');
    } else {
      result.alerts.forEach((alert: any, index: number) => {
        console.log(`Alert ${index + 1}:`);
        console.log(`  Type: ${alert.type}`);
        console.log(`  Severity: ${alert.severity}`);
        console.log(`  Message: ${alert.message}`);
        if (alert.relatedTopicId) console.log(`  Related Topic ID: ${alert.relatedTopicId}`);
        if (alert.relatedTaskId) console.log(`  Related Task ID: ${alert.relatedTaskId}`);
        console.log('');
      });
    }
    
    // Log LLM insights if available
    if (result.llmInsights) {
      console.log('\n--- LLM Insights ---');
      console.log(`Summary: ${result.llmInsights.naturalLanguageSummary}`);
      console.log(`Confidence: ${result.llmInsights.confidence?.toFixed(2) || 'N/A'}`);
      console.log(`Generated At: ${result.llmInsights.generatedAt}`);
      
      console.log('\n--- LLM-Generated Insights ---');
      if (!result.llmInsights.insights || result.llmInsights.insights.length === 0) {
        console.log('No LLM insights generated');
      } else {
        result.llmInsights.insights.forEach((insight: any, index: number) => {
          console.log(`Insight ${index + 1}:`);
          console.log(`  Type: ${insight.type}`);
          console.log(`  Priority: ${insight.priority}`);
          console.log(`  Confidence: ${insight.confidence?.toFixed(2) || 'N/A'}`);
          console.log(`  Description: ${insight.description}`);
          if (insight.relatedTopicId) {
            console.log(`  Related Topic ID: ${insight.relatedTopicId}`);
          }
          console.log('');
        });
      }
    } else {
      console.log('\n--- LLM Insights ---');
      console.log('No LLM insights available. Make sure USE_LLM_MONITOR is set to true in .env or similar.');
    }
    
    return result;
  } catch (error) {
    console.error('Error testing monitor agent:', error);
    throw error;
  }
}

// Main function
async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('Please provide a user ID as a command line argument');
    console.log('Usage: node --loader ts-node/esm ../scripts/test-llm-monitor.mts <userId> (when CWD is dynamic-calendar)');
    process.exit(1);
  }
  
  try {
    await connectToDatabase();
    await testMonitorAgent(userId);
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
