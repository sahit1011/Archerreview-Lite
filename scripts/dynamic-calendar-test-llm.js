/**
 * Test script for the LLM-enhanced Monitor Agent
 * 
 * This script tests the LLM-enhanced Monitor Agent by running it for a specific user
 * and logging the results, including the LLM-generated insights.
 * 
 * Usage: node dynamic-calendar-test-llm.js <userId>
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import required modules
const mongoose = require('mongoose');

// Set the environment variable to enable LLM
process.env.USE_LLM_MONITOR = 'true';

// Import the monitor agent
const { runMonitorAgent } = require('./src/services/monitorAgent');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Run the monitor agent for a user
async function testMonitorAgent(userId) {
  try {
    console.log(`Running monitor agent for user: ${userId}`);
    
    // Run the monitor agent
    const result = await runMonitorAgent(userId);
    
    // Log basic results
    console.log('\n--- Basic Monitoring Results ---');
    console.log(`User ID: ${result.userId}`);
    console.log(`Plan ID: ${result.planId}`);
    console.log(`Total Tasks: ${result.stats.totalTasks}`);
    console.log(`Completed Tasks: ${result.stats.completedTasks}`);
    console.log(`Missed Tasks: ${result.stats.missedTasks}`);
    console.log(`Average Performance: ${result.stats.averagePerformance.toFixed(2)}%`);
    console.log(`Readiness Score: ${result.stats.readinessScore}`);
    
    // Log rule-based alerts
    console.log('\n--- Rule-Based Alerts ---');
    if (result.alerts.length === 0) {
      console.log('No rule-based alerts generated');
    } else {
      result.alerts.forEach((alert, index) => {
        console.log(`Alert ${index + 1}:`);
        console.log(`  Type: ${alert.type}`);
        console.log(`  Severity: ${alert.severity}`);
        console.log(`  Message: ${alert.message}`);
        console.log('');
      });
    }
    
    // Log LLM insights if available
    if (result.llmInsights) {
      console.log('\n--- LLM Insights ---');
      console.log(`Summary: ${result.llmInsights.naturalLanguageSummary}`);
      console.log(`Confidence: ${result.llmInsights.confidence.toFixed(2)}`);
      console.log(`Generated At: ${result.llmInsights.generatedAt}`);
      
      console.log('\n--- LLM-Generated Insights ---');
      if (result.llmInsights.insights.length === 0) {
        console.log('No LLM insights generated');
      } else {
        result.llmInsights.insights.forEach((insight, index) => {
          console.log(`Insight ${index + 1}:`);
          console.log(`  Type: ${insight.type}`);
          console.log(`  Priority: ${insight.priority}`);
          console.log(`  Confidence: ${insight.confidence.toFixed(2)}`);
          console.log(`  Description: ${insight.description}`);
          if (insight.relatedTopicId) {
            console.log(`  Related Topic ID: ${insight.relatedTopicId}`);
          }
          console.log('');
        });
      }
    } else {
      console.log('\n--- LLM Insights ---');
      console.log('No LLM insights available. Make sure USE_LLM_MONITOR is set to true.');
    }
    
    return result;
  } catch (error) {
    console.error('Error testing monitor agent:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Get user ID from command line arguments
    const userId = process.argv[2] || '6818ed80539a47f3e1d5b9ab'; // Default to n1@gmail.com
    
    // Connect to the database
    await connectToDatabase();
    
    // Test the monitor agent
    await testMonitorAgent(userId);
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
