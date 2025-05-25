/**
 * Agent Registry - Maintains a registry of all available agents
 *
 * This service:
 * 1. Stores metadata about all agents in the system
 * 2. Provides methods to register and retrieve agents
 * 3. Maintains information about agent dependencies
 * 4. Tracks agent capabilities and requirements
 */

// Types of agents in the system
export type AgentType =
  | 'monitor'
  | 'adaptation'
  | 'remediation'
  | 'feedback'
  | 'scheduler'
  | 'evolution';

// Agent dependency types
export type DependencyType =
  | 'required'    // Agent cannot run without this dependency
  | 'optional'    // Agent can run without this dependency, but with reduced functionality
  | 'enhancing';  // Agent can run without this dependency, but may provide enhanced results with it

// Agent dependency
export interface AgentDependency {
  agentType: AgentType;
  dependencyType: DependencyType;
  description: string;
}

// Agent capability
export interface AgentCapability {
  name: string;
  description: string;
  requiresLLM?: boolean;
}

// Agent metadata
export interface AgentMetadata {
  type: AgentType;
  name: string;
  description: string;
  dependencies: AgentDependency[];
  capabilities: AgentCapability[];
  requiresAuth: boolean;
  averageRuntime?: number; // in milliseconds
  lastRunTime?: Date;
  successRate?: number; // 0-1
  enabled: boolean;
  llmEnhanced: boolean;
}

// Registry of all agents
const agentRegistry: Record<AgentType, AgentMetadata> = {
  monitor: {
    type: 'monitor',
    name: 'Monitor Agent',
    description: 'Tracks progress and performance, detects deviations from the study plan, and generates alerts',
    dependencies: [],
    capabilities: [
      {
        name: 'performance-tracking',
        description: 'Tracks task completion and performance metrics'
      },
      {
        name: 'pattern-detection',
        description: 'Identifies patterns in study behavior'
      },
      {
        name: 'alert-generation',
        description: 'Generates alerts for the Adaptation Agent'
      },
      {
        name: 'llm-insights',
        description: 'Generates deeper insights from performance data using LLM',
        requiresLLM: true
      }
    ],
    requiresAuth: true,
    enabled: true,
    llmEnhanced: true
  },

  adaptation: {
    type: 'adaptation',
    name: 'Adaptation Agent',
    description: 'Adjusts study plans based on performance and alerts from the Monitor Agent',
    dependencies: [
      {
        agentType: 'monitor',
        dependencyType: 'optional',
        description: 'Uses alerts and insights from the Monitor Agent to make better adaptations'
      }
    ],
    capabilities: [
      {
        name: 'task-rescheduling',
        description: 'Reschedules missed tasks'
      },
      {
        name: 'difficulty-adjustment',
        description: 'Adjusts task difficulty based on performance'
      },
      {
        name: 'workload-rebalancing',
        description: 'Rebalances workload across days'
      },
      {
        name: 'remedial-content',
        description: 'Injects remedial content for struggling topics'
      },
      {
        name: 'llm-adaptations',
        description: 'Generates personalized adaptation recommendations using LLM',
        requiresLLM: true
      }
    ],
    requiresAuth: true,
    enabled: true,
    llmEnhanced: true
  },

  remediation: {
    type: 'remediation',
    name: 'Remediation Agent',
    description: 'Coordinates remediation activities based on performance issues',
    dependencies: [
      {
        agentType: 'monitor',
        dependencyType: 'required',
        description: 'Requires performance data from the Monitor Agent to identify remediation needs'
      },
      {
        agentType: 'adaptation',
        dependencyType: 'enhancing',
        description: 'Can use adaptation results to better coordinate remediation activities'
      }
    ],
    capabilities: [
      {
        name: 'suggestion-generation',
        description: 'Generates remediation suggestions'
      },
      {
        name: 'review-scheduling',
        description: 'Schedules review sessions for struggling topics'
      },
      {
        name: 'tutor-integration',
        description: 'Integrates with AI Tutor for immediate assistance'
      },
      {
        name: 'llm-remediation',
        description: 'Generates personalized remediation strategies using LLM',
        requiresLLM: true
      }
    ],
    requiresAuth: true,
    enabled: true,
    llmEnhanced: false
  },

  feedback: {
    type: 'feedback',
    name: 'Feedback Agent',
    description: 'Processes user feedback and generates personalized responses',
    dependencies: [],
    capabilities: [
      {
        name: 'sentiment-analysis',
        description: 'Analyzes feedback sentiment'
      },
      {
        name: 'response-generation',
        description: 'Generates personalized responses to feedback'
      },
      {
        name: 'pattern-identification',
        description: 'Identifies patterns across multiple feedback items'
      },
      {
        name: 'llm-feedback',
        description: 'Enhances feedback analysis and responses using LLM',
        requiresLLM: true
      }
    ],
    requiresAuth: true,
    enabled: true,
    llmEnhanced: true
  },

  scheduler: {
    type: 'scheduler',
    name: 'Scheduler Agent',
    description: 'Generates initial study plans based on user preferences and diagnostic results',
    dependencies: [],
    capabilities: [
      {
        name: 'plan-generation',
        description: 'Generates personalized study plans'
      },
      {
        name: 'constraint-scheduling',
        description: 'Implements constraint-based scheduling'
      },
      {
        name: 'topic-sequencing',
        description: 'Builds topic sequencing based on prerequisites'
      },
      {
        name: 'workload-balancing',
        description: 'Balances workload across available days'
      }
    ],
    requiresAuth: true,
    enabled: true,
    llmEnhanced: false
  },

  evolution: {
    type: 'evolution',
    name: 'Evolution Agent',
    description: 'Handles long-term plan evolution, trend analysis, and predictive modeling',
    dependencies: [
      {
        agentType: 'monitor',
        dependencyType: 'enhancing',
        description: 'Uses performance data from the Monitor Agent for trend analysis'
      },
      {
        agentType: 'adaptation',
        dependencyType: 'enhancing',
        description: 'Coordinates with Adaptation Agent for implementing plan changes'
      }
    ],
    capabilities: [
      {
        name: 'trend-analysis',
        description: 'Analyzes long-term performance trends'
      },
      {
        name: 'plan-versioning',
        description: 'Manages study plan versions over time'
      },
      {
        name: 'adaptive-difficulty',
        description: 'Implements gradual difficulty progression based on mastery'
      },
      {
        name: 'predictive-modeling',
        description: 'Predicts future performance and readiness'
      },
      {
        name: 'plan-optimization',
        description: 'Periodically reviews and optimizes study plans'
      },
      {
        name: 'llm-evolution',
        description: 'Enhances plan evolution with LLM-powered insights',
        requiresLLM: true
      }
    ],
    requiresAuth: true,
    enabled: true,
    llmEnhanced: true
  }
};

/**
 * Get all registered agents
 * @returns All registered agents
 */
export function getAllAgents(): AgentMetadata[] {
  return Object.values(agentRegistry);
}

/**
 * Get a specific agent by type
 * @param type Agent type
 * @returns Agent metadata or undefined if not found
 */
export function getAgent(type: AgentType): AgentMetadata | undefined {
  return agentRegistry[type];
}

/**
 * Get all enabled agents
 * @returns All enabled agents
 */
export function getEnabledAgents(): AgentMetadata[] {
  return Object.values(agentRegistry).filter(agent => agent.enabled);
}

/**
 * Get all LLM-enhanced agents
 * @returns All LLM-enhanced agents
 */
export function getLLMEnhancedAgents(): AgentMetadata[] {
  return Object.values(agentRegistry).filter(agent => agent.llmEnhanced);
}

/**
 * Update agent metadata
 * @param type Agent type
 * @param metadata Updated metadata
 * @returns Updated agent metadata
 */
export function updateAgentMetadata(type: AgentType, metadata: Partial<AgentMetadata>): AgentMetadata {
  agentRegistry[type] = {
    ...agentRegistry[type],
    ...metadata
  };

  return agentRegistry[type];
}

/**
 * Enable or disable an agent
 * @param type Agent type
 * @param enabled Whether the agent should be enabled
 * @returns Updated agent metadata
 */
export function setAgentEnabled(type: AgentType, enabled: boolean): AgentMetadata {
  agentRegistry[type].enabled = enabled;
  return agentRegistry[type];
}

/**
 * Update agent runtime statistics
 * @param type Agent type
 * @param runtime Runtime in milliseconds
 * @param success Whether the agent run was successful
 * @returns Updated agent metadata
 */
export function updateAgentStats(type: AgentType, runtime: number, success: boolean): AgentMetadata {
  const agent = agentRegistry[type];

  // Update average runtime
  if (agent.averageRuntime) {
    agent.averageRuntime = (agent.averageRuntime + runtime) / 2;
  } else {
    agent.averageRuntime = runtime;
  }

  // Update success rate
  if (agent.successRate !== undefined) {
    const previousRuns = agent.successRate * 10; // Assume based on 10 runs
    const newSuccessCount = previousRuns + (success ? 1 : 0);
    agent.successRate = newSuccessCount / 11;
  } else {
    agent.successRate = success ? 1 : 0;
  }

  // Update last run time
  agent.lastRunTime = new Date();

  return agent;
}

/**
 * Get dependencies for an agent
 * @param type Agent type
 * @returns Dependencies for the agent
 */
export function getAgentDependencies(type: AgentType): AgentDependency[] {
  return agentRegistry[type]?.dependencies || [];
}

/**
 * Check if an agent has a specific capability
 * @param type Agent type
 * @param capabilityName Capability name
 * @returns Whether the agent has the capability
 */
export function hasCapability(type: AgentType, capabilityName: string): boolean {
  return agentRegistry[type]?.capabilities.some(cap => cap.name === capabilityName) || false;
}

/**
 * Get all capabilities that require LLM
 * @param type Agent type
 * @returns Capabilities that require LLM
 */
export function getLLMCapabilities(type: AgentType): AgentCapability[] {
  return agentRegistry[type]?.capabilities.filter(cap => cap.requiresLLM) || [];
}
