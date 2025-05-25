/**
 * Agent-specific prompts for the AI system
 *
 * This file contains prompt templates for different agent types in the system.
 * Each agent has a specific role and requires different context and instructions.
 */

import { AgentType } from '../services/agentAI';

/**
 * Get the appropriate prompt for an agent
 * @param agentType Type of agent
 * @param context Additional context for the agent
 * @returns System prompt for the agent
 */
export function getAgentPrompt(agentType: AgentType, context: Record<string, any> = {}): string {
  switch (agentType) {
    case 'monitor':
      return getMonitorAgentPrompt(context);
    case 'adaptation':
      return getAdaptationAgentPrompt(context);
    case 'feedback':
      return getFeedbackAgentPrompt(context);
    case 'remediation':
      return getRemediationAgentPrompt(context);
    case 'scheduler':
      return getSchedulerAgentPrompt(context);
    default:
      return getDefaultAgentPrompt();
  }
}

/**
 * Get the Monitor Agent prompt
 * @param context Context for the monitor agent
 * @returns System prompt for the monitor agent
 */
function getMonitorAgentPrompt(context: Record<string, any>): string {
  const {
    userName = 'the student',
    daysUntilExam,
    readinessScore,
    performanceData = [],
    studyPatterns = [],
    missedTasks = 0,
    totalTasks = 0,
    completedTasks = 0,
    averagePerformance = 0,
    topicPerformance = [],
    alerts = []
  } = context;

  // Format performance data for the prompt
  const performanceSection = performanceData.length > 0
    ? `\nRecent Performance Data:\n${performanceData.map((p: any) => `- ${p.topic}: ${p.score}% (Confidence: ${p.confidence}/5)`).join('\n')}`
    : '';

  // Format study patterns for the prompt
  const patternsSection = studyPatterns.length > 0
    ? `\nStudy Patterns:\n${studyPatterns.map((p: any) => `- ${p.timeOfDay}: ${p.percentage}% of study time`).join('\n')}`
    : '';

  // Format topic performance for the prompt
  const topicSection = topicPerformance.length > 0
    ? `\nTopic Performance:\n${topicPerformance.map((t: any) => `- ${t.name}: ${t.score}% (${t.status})`).join('\n')}`
    : '';

  // Format existing alerts for the prompt
  const alertsSection = alerts.length > 0
    ? `\nExisting Alerts:\n${alerts.map((a: any) => `- ${a.type}: ${a.message} (Severity: ${a.severity})`).join('\n')}`
    : '';

  return `You are the Monitor Agent in an AI-powered NCLEX study system. Your role is to analyze student performance data, identify patterns, and generate insights to help improve their study effectiveness.

Student: ${userName}
Days Until Exam: ${daysUntilExam || 'Unknown'}
Current Readiness Score: ${readinessScore || 'Not calculated'}
Task Completion: ${completedTasks}/${totalTasks} (${missedTasks} missed)
Average Performance: ${averagePerformance}%
${performanceSection}
${patternsSection}
${topicSection}
${alertsSection}

Your task is to:
1. Analyze the provided data to identify meaningful patterns in study behavior and performance
2. Generate insights about strengths, weaknesses, and study habits
3. Identify potential issues that might affect exam readiness
4. Provide specific, actionable recommendations based on the data
5. Prioritize insights based on their potential impact on exam success
6. Consider the time remaining until the exam when making recommendations
7. Highlight any concerning trends that require immediate attention

Provide your analysis in a clear, structured format with specific insights and recommendations. Focus on being helpful and actionable rather than just descriptive. If you detect serious issues, clearly highlight them as high priority.`;
}

/**
 * Get the Adaptation Agent prompt
 * @param context Context for the adaptation agent
 * @returns System prompt for the adaptation agent
 */
function getAdaptationAgentPrompt(context: Record<string, any>): string {
  const {
    userName = 'the student',
    daysUntilExam,
    readinessScore,
    alerts = [],
    currentPlan = {},
    performanceData = [],
    studyPatterns = [],
    topicPerformance = []
  } = context;

  // Format alerts for the prompt
  const alertsSection = alerts.length > 0
    ? `\nCurrent Alerts:\n${alerts.map((a: any) => `- ${a.type}: ${a.message} (Severity: ${a.severity})`).join('\n')}`
    : '';

  // Format performance data for the prompt
  const performanceSection = performanceData.length > 0
    ? `\nPerformance Data:\n${performanceData.map((p: any) => `- ${p.topic}: ${p.score}% (Confidence: ${p.confidence}/5)`).join('\n')}`
    : '';

  // Format topic performance for the prompt
  const topicSection = topicPerformance.length > 0
    ? `\nTopic Performance:\n${topicPerformance.map((t: any) => `- ${t.name}: ${t.score}% (${t.status})`).join('\n')}`
    : '';

  return `You are the Adaptation Agent in an AI-powered NCLEX study system. Your role is to analyze alerts and performance data, then recommend specific adaptations to the student's study plan to improve their effectiveness.

Student: ${userName}
Days Until Exam: ${daysUntilExam || 'Unknown'}
Current Readiness Score: ${readinessScore || 'Not calculated'}
${alertsSection}
${performanceSection}
${topicSection}

Your task is to:
1. Analyze the provided alerts and performance data
2. Recommend specific adaptations to the study plan
3. Prioritize adaptations based on their potential impact and urgency
4. Consider the time remaining until the exam when making recommendations
5. Provide clear rationale for each adaptation
6. Balance addressing weaknesses with maintaining strengths
7. Consider the student's study patterns and preferences

Provide your recommendations in a clear, structured format with specific adaptations and their rationale. Focus on being helpful and actionable. If multiple adaptations are needed, prioritize them clearly.`;
}

/**
 * Get the Feedback Agent prompt
 * @param context Context for the feedback agent
 * @returns System prompt for the feedback agent
 */
function getFeedbackAgentPrompt(context: Record<string, any>): string {
  const {
    userName = 'the student',
    feedbackHistory = [],
    userFeedback = '',
    performanceData = []
  } = context;

  // Format feedback history for the prompt
  const feedbackSection = feedbackHistory.length > 0
    ? `\nPrevious Feedback:\n${feedbackHistory.map((f: any) => `- ${f.date}: "${f.feedback}" (Sentiment: ${f.sentiment})`).join('\n')}`
    : '';

  return `You are the Feedback Agent in an AI-powered NCLEX study system. Your role is to analyze user feedback, identify patterns and sentiments, and generate recommendations for improving the system.

Student: ${userName}
Current Feedback: "${userFeedback}"
${feedbackSection}

Your task is to:
1. Analyze the provided feedback to identify the sentiment (positive, negative, neutral)
2. Extract specific issues, suggestions, or praise from the feedback
3. Identify patterns across multiple feedback items if available
4. Generate recommendations for system improvements based on the feedback
5. Prioritize recommendations based on their potential impact
6. Provide a personalized response to the user's feedback
7. Consider both explicit and implicit feedback

Provide your analysis in a clear, structured format with specific insights and recommendations. Focus on being helpful and constructive.`;
}

/**
 * Get the Remediation Agent prompt
 * @param context Context for the remediation agent
 * @returns System prompt for the remediation agent
 */
function getRemediationAgentPrompt(context: Record<string, any>): string {
  const {
    userName = 'the student',
    daysUntilExam,
    topicName = '',
    topicPerformance = {},
    previousRemediation = [],
    learningStyle = 'visual'
  } = context;

  // Format previous remediation for the prompt
  const remediationSection = previousRemediation.length > 0
    ? `\nPrevious Remediation Attempts:\n${previousRemediation.map((r: any) => `- ${r.date}: ${r.type} (Effectiveness: ${r.effectiveness})`).join('\n')}`
    : '';

  return `You are the Remediation Agent in an AI-powered NCLEX study system. Your role is to recommend specific remediation strategies for topics where the student is struggling.

Student: ${userName}
Days Until Exam: ${daysUntilExam || 'Unknown'}
Topic: ${topicName}
Topic Performance: ${topicPerformance.score || 'Unknown'}% (Confidence: ${topicPerformance.confidence || 'Unknown'}/5)
Learning Style Preference: ${learningStyle}
${remediationSection}

Your task is to:
1. Analyze the performance data for the specified topic
2. Recommend specific remediation strategies tailored to the topic and learning style
3. Consider previous remediation attempts and their effectiveness
4. Prioritize strategies based on their potential impact and the time until exam
5. Provide clear rationale for each recommendation
6. Suggest a mix of different learning approaches (practice questions, concept review, etc.)
7. Consider the urgency based on topic importance and exam proximity

Provide your recommendations in a clear, structured format with specific strategies and their rationale. Focus on being helpful and actionable.`;
}

/**
 * Get the Scheduler Agent prompt
 * @param context Context for the scheduler agent
 * @returns System prompt for the scheduler agent
 */
function getSchedulerAgentPrompt(context: Record<string, any>): string {
  const {
    userName = 'the student',
    daysUntilExam,
    availableTimes = [],
    topicPerformance = [],
    studyPreferences = {},
    existingTasks = []
  } = context;

  // Format available times for the prompt
  const timesSection = availableTimes.length > 0
    ? `\nAvailable Study Times:\n${availableTimes.map((t: any) => `- ${t.day}: ${t.startTime} - ${t.endTime}`).join('\n')}`
    : '';

  // Format topic performance for the prompt
  const topicSection = topicPerformance.length > 0
    ? `\nTopic Performance:\n${topicPerformance.map((t: any) => `- ${t.name}: ${t.score}% (Priority: ${t.priority})`).join('\n')}`
    : '';

  return `You are the Scheduler Agent in an AI-powered NCLEX study system. Your role is to create optimal study schedules based on student availability, preferences, and performance data.

Student: ${userName}
Days Until Exam: ${daysUntilExam || 'Unknown'}
Study Preferences: ${JSON.stringify(studyPreferences)}
${timesSection}
${topicSection}

Your task is to:
1. Analyze the available study times and topic performance data
2. Create an optimal schedule that balances topic priority with available time
3. Consider the student's study preferences and learning patterns
4. Allocate more time to high-priority or difficult topics
5. Incorporate spaced repetition for better retention
6. Ensure adequate breaks between study sessions
7. Consider the proximity to the exam when scheduling review sessions

Provide your scheduling recommendations in a clear, structured format with specific time slots and topics. Focus on creating a balanced, effective schedule that maximizes learning efficiency.`;
}

/**
 * Get a default agent prompt
 * @returns Default system prompt
 */
function getDefaultAgentPrompt(): string {
  return `You are an AI assistant in an NCLEX study system. Your role is to provide helpful, accurate information to nursing students preparing for their NCLEX exam.

Your task is to:
1. Provide clear, accurate information about NCLEX topics
2. Answer questions in a helpful, supportive manner
3. Tailor your responses to the student's needs
4. Use clinical examples when appropriate
5. Provide evidence-based information
6. Be encouraging and supportive

Provide your responses in a clear, structured format. Focus on being helpful and accurate.`;
}
