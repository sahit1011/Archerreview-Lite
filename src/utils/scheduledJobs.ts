import dbConnect from '@/lib/db';
import { User, StudyPlan } from '@/models';
import { processDueEntries, scheduleStandardMonitoringForAllUsers } from '@/services/agentScheduler';
import { runStandardSequence, runComprehensiveSequence } from '@/services/agentOrchestrator';

/**
 * Scheduled jobs for the application
 *
 * These functions are meant to be called by a scheduler (e.g., cron job)
 * In a production environment, these would be set up as serverless functions
 * or background jobs that run on a schedule.
 */

/**
 * Run the Monitor Agent for all active users
 * This should be scheduled to run daily
 */
export async function runDailyMonitoring(): Promise<void> {
  console.log('Running daily monitoring...');

  try {
    // Process all due entries using the Agent Orchestration System
    console.log('Processing due entries...');
    const results = await processDueEntries();

    console.log(`Processed ${results.length} scheduled entries`);

    // If no entries were processed, schedule standard monitoring for all users
    if (results.length === 0) {
      console.log('No scheduled entries found. Setting up standard monitoring for all users...');
      const scheduleIds = await scheduleStandardMonitoringForAllUsers();
      console.log(`Scheduled monitoring for ${scheduleIds.length} entries`);

      // Process the newly scheduled entries
      console.log('Processing newly scheduled entries...');
      const newResults = await processDueEntries();
      console.log(`Processed ${newResults.length} newly scheduled entries`);
    }

    console.log('Daily monitoring completed successfully');
  } catch (error) {
    console.error('Error running daily monitoring:', error);
    throw error;
  }
}

/**
 * Run the Monitor Agent for users with upcoming exams
 * This should be scheduled to run more frequently (e.g., every 6 hours)
 * for users who are close to their exam date
 */
export async function runPriorityMonitoring(): Promise<void> {
  console.log('Running priority monitoring...');

  try {
    // Connect to the database
    await dbConnect();

    // Get users with exams in the next 14 days
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const studyPlans = await StudyPlan.find({
      examDate: { $lte: twoWeeksFromNow }
    });

    const userIds = studyPlans.map(plan => plan.user);

    console.log(`Found ${userIds.length} users with upcoming exams`);

    // Run comprehensive sequence for each priority user
    const results = [];
    for (const userId of userIds) {
      try {
        console.log(`Running comprehensive monitoring for priority user ${userId}...`);
        const result = await runComprehensiveSequence(userId.toString(), {
          runDependencies: true,
          maxRetries: 2,
          forceRun: true
        });
        results.push({ userId: userId.toString(), success: true, result });
      } catch (error) {
        console.error(`Error running comprehensive monitoring for priority user ${userId}:`, error);
        results.push({ userId: userId.toString(), success: false, error: error.message });
        // Continue with next user
      }
    }

    console.log(`Priority monitoring completed with ${results.filter(r => r.success).length} successes and ${results.filter(r => !r.success).length} failures`);
  } catch (error) {
    console.error('Error running priority monitoring:', error);
    throw error;
  }
}

/**
 * Initialize the Agent Orchestration System
 * This should be called when the application starts
 */
export async function initializeAgentOrchestration(): Promise<void> {
  console.log('Initializing Agent Orchestration System...');

  try {
    // Schedule standard monitoring for all users
    console.log('Setting up standard monitoring for all users...');
    const scheduleIds = await scheduleStandardMonitoringForAllUsers();
    console.log(`Scheduled monitoring for ${scheduleIds.length} entries`);

    console.log('Agent Orchestration System initialized successfully');
  } catch (error) {
    console.error('Error initializing Agent Orchestration System:', error);
    throw error;
  }
}
