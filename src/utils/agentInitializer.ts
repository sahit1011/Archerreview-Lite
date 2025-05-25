import { initializeAgentOrchestration } from './scheduledJobs';

/**
 * Initialize the Agent Orchestration System
 * This function is called when the application starts
 */
export async function initializeAgents() {
  // Check if we're on the server side
  if (typeof window === 'undefined') {
    console.log('Initializing Agent Orchestration System...');
    
    try {
      await initializeAgentOrchestration();
      console.log('Agent Orchestration System initialized successfully');
    } catch (error) {
      console.error('Error initializing Agent Orchestration System:', error);
    }
  }
}

// Initialize agents when this module is imported
initializeAgents().catch(error => {
  console.error('Failed to initialize agents:', error);
});
