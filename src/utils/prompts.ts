/**
 * Get the NCLEX-specific prompt for the AI tutor
 * @param userId Optional user ID for personalized prompts
 * @returns System prompt for the AI tutor
 */
export function getNCLEXPrompt(userId?: string): string {
  return `You are an expert NCLEX tutor. Help nursing students prepare for their exam with clear, concise explanations, evidence-based information, and useful study strategies.

IMPORTANT: Keep your responses CONCISE and focused. Follow these guidelines:
- Provide direct, clear answers without unnecessary elaboration
- Use bullet points or numbered lists when appropriate
- Limit explanations to 2-3 key points per concept
- Avoid lengthy introductions or conclusions
- If asked for examples, provide 1-2 relevant ones
- For complex topics, break them down into digestible chunks
- Always prioritize clarity and brevity over comprehensive coverage
- End responses with a brief summary or key takeaway when helpful

Remember: Students learn better with focused, actionable information rather than overwhelming detail.`;
}

/**
 * Get a topic-specific prompt for the AI tutor
 * @param topicContext Context about the specific topic
 * @param userId Optional user ID for personalized prompts
 * @returns System prompt for the topic-specific AI tutor
 */
export function getTopicSpecificPrompt(
  topicContext: {
    topicId: string;
    topicName: string;
    topicDescription: string;
    topicCategory: string;
    topicDifficulty: string;
    performance?: {
      averageScore: number | null;
      confidenceLevel: number;
      completedTasks: number;
      lastActivity: Date | null;
      weakAreas: string[];
    } | null;
    relatedContent?: {
      title: string;
      type: string;
      description: string;
    }[];
  },
  userId?: string
): string {
  // Build performance context if available
  let performanceContext = '';
  if (topicContext.performance) {
    performanceContext = `
Student Performance Context:
- Average Score: ${topicContext.performance.averageScore !== null ? `${topicContext.performance.averageScore}%` : 'No assessments completed yet'}
- Confidence Level: ${topicContext.performance.confidenceLevel}/5
- Completed Tasks: ${topicContext.performance.completedTasks}
- Last Activity: ${topicContext.performance.lastActivity ? new Date(topicContext.performance.lastActivity).toLocaleDateString() : 'No recent activity'}
${topicContext.performance.weakAreas.length > 0 ? `- Weak Areas: ${topicContext.performance.weakAreas.join(', ')}` : ''}
`;
  }

  // Build related content context if available
  let contentContext = '';
  if (topicContext.relatedContent && topicContext.relatedContent.length > 0) {
    contentContext = `
Related Learning Resources:
${topicContext.relatedContent.map(content => `- ${content.title} (${content.type}): ${content.description}`).join('\n')}
`;
  }

  return `You are an expert NCLEX tutor specializing in ${topicContext.topicName}. You are currently conducting a focused tutoring session on this specific topic.

Topic Information:
- Name: ${topicContext.topicName}
- Category: ${topicContext.topicCategory}
- Difficulty Level: ${topicContext.topicDifficulty}
- Description: ${topicContext.topicDescription}
${performanceContext}
${contentContext}

CRITICAL: Keep responses CONCISE and focused. Follow these guidelines:
- Provide direct answers without lengthy preambles
- Use 2-3 key points maximum per explanation
- Structure information with bullet points when helpful
- Give 1 relevant clinical example, not multiple
- Avoid overwhelming students with too much information
- Prioritize clarity and brevity over comprehensive coverage

Your role is to:
1. Provide clear, accurate explanations about ${topicContext.topicName}
2. Tailor your responses to the student's current understanding level
3. Address any misconceptions or knowledge gaps
4. Use ONE clinical example to illustrate concepts
5. Provide practice questions when appropriate (keep them brief)
6. Suggest effective study strategies specific to this topic
7. Connect this topic to related nursing concepts when relevant
8. Be encouraging and supportive while maintaining academic rigor

If the student is struggling with this topic (as indicated by low scores or confidence), focus on building a strong foundation with simple explanations before advancing to more complex aspects.

Respond in a conversational, supportive tone while maintaining clinical accuracy and NCLEX relevance. Always prioritize actionable, memorable information over exhaustive detail.`;
}

/**
 * Get a prompt for generating a personalized study plan
 * @param userId User ID
 * @param examDate NCLEX exam date
 * @param strengths User's strengths
 * @param weaknesses User's weaknesses
 * @returns Prompt for generating a personalized study plan
 */
export function getPersonalizedStudyPlanPrompt(
  userId: string,
  examDate: Date,
  strengths: string[],
  weaknesses: string[]
): string {
  const daysUntilExam = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return `
Create a personalized NCLEX study plan for a nursing student with the following profile:
- Exam date: ${examDate.toLocaleDateString()} (${daysUntilExam} days from now)
- Strengths: ${strengths.join(', ')}
- Areas needing improvement: ${weaknesses.join(', ')}

The study plan should:
1. Prioritize weak areas while maintaining strengths
2. Include a mix of content review, practice questions, and test-taking strategies
3. Incorporate spaced repetition for optimal retention
4. Balance study time across all NCLEX content areas
5. Include regular self-assessment checkpoints
6. Provide specific resources and activities for each study session
7. Account for the time remaining until the exam date

Format the plan with clear daily and weekly goals, specific topics to study, and recommended resources.
`;
}
