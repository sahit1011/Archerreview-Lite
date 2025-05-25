/**
 * Utilities for testing LLM responses
 *
 * This file contains functions for testing and validating LLM responses
 * to ensure they meet quality standards before being shown to users.
 */

/**
 * Test types for LLM response validation
 */
export enum LLMTestType {
  COHERENCE = 'coherence',
  RELEVANCE = 'relevance',
  SAFETY = 'safety',
  COMPLETENESS = 'completeness',
  FORMAT = 'format'
}

/**
 * Result of an LLM response test
 */
export interface LLMTestResult {
  passed: boolean;
  score: number;
  type: LLMTestType;
  details?: string;
}

/**
 * Test an LLM response for quality
 * @param response The LLM response text
 * @param prompt The original prompt
 * @param testTypes Types of tests to run
 * @returns Test results
 */
export function testLLMResponse(
  response: string,
  prompt: string,
  testTypes: LLMTestType[] = Object.values(LLMTestType)
): LLMTestResult[] {
  const results: LLMTestResult[] = [];

  // Run each requested test
  for (const testType of testTypes) {
    switch (testType) {
      case LLMTestType.COHERENCE:
        results.push(testCoherence(response));
        break;
      case LLMTestType.RELEVANCE:
        results.push(testRelevance(response, prompt));
        break;
      case LLMTestType.SAFETY:
        results.push(testSafety(response));
        break;
      case LLMTestType.COMPLETENESS:
        results.push(testCompleteness(response));
        break;
      case LLMTestType.FORMAT:
        results.push(testFormat(response));
        break;
    }
  }

  return results;
}

/**
 * Test if the response is coherent
 * @param response The LLM response text
 * @returns Test result
 */
function testCoherence(response: string): LLMTestResult {
  // Check for very short responses
  if (response.length < 20) {
    return {
      passed: false,
      score: 0.2,
      type: LLMTestType.COHERENCE,
      details: 'Response is too short to be meaningful'
    };
  }

  // Check for repetition
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  const repetitionRatio = uniqueSentences.size / sentences.length;

  // Check for coherence markers
  const coherenceMarkers = [
    'therefore', 'however', 'additionally', 'furthermore', 'consequently',
    'in addition', 'as a result', 'for example', 'specifically', 'in conclusion'
  ];

  const hasCoherenceMarkers = coherenceMarkers.some(marker =>
    response.toLowerCase().includes(marker)
  );

  // Calculate score based on repetition and coherence markers
  let score = 0.5;
  if (repetitionRatio > 0.8) score += 0.3;
  if (hasCoherenceMarkers) score += 0.2;

  return {
    passed: score >= 0.7,
    score,
    type: LLMTestType.COHERENCE,
    details: score < 0.7 ? 'Response lacks coherence or contains excessive repetition' : undefined
  };
}

/**
 * Test if the response is relevant to the prompt
 * @param response The LLM response text
 * @param prompt The original prompt
 * @returns Test result
 */
function testRelevance(response: string, prompt: string): LLMTestResult {
  // Extract key terms from the prompt
  const promptTerms = extractKeyTerms(prompt);

  // Check if key terms from the prompt appear in the response
  const responseLower = response.toLowerCase();
  const matchedTerms = promptTerms.filter(term => responseLower.includes(term.toLowerCase()));

  // Calculate relevance score based on term matches
  const relevanceScore = promptTerms.length > 0
    ? matchedTerms.length / promptTerms.length
    : 0.5;

  return {
    passed: relevanceScore >= 0.5,
    score: relevanceScore,
    type: LLMTestType.RELEVANCE,
    details: relevanceScore < 0.5 ? 'Response does not appear to address the prompt' : undefined
  };
}

/**
 * Test if the response contains potentially unsafe content
 * @param response The LLM response text
 * @returns Test result
 */
function testSafety(response: string): LLMTestResult {
  // List of terms that might indicate unsafe content
  const unsafeTerms = [
    'kill', 'suicide', 'harm yourself', 'illegal', 'dangerous', 'weapon',
    'bomb', 'terrorist', 'hack', 'steal', 'fraud', 'pornography', 'explicit'
  ];

  // Check if any unsafe terms appear in the response
  const responseLower = response.toLowerCase();
  const matchedUnsafeTerms = unsafeTerms.filter(term => responseLower.includes(term));

  // Calculate safety score
  const safetyScore = matchedUnsafeTerms.length === 0 ? 1.0 : Math.max(0, 1 - matchedUnsafeTerms.length * 0.2);

  return {
    passed: safetyScore >= 0.8,
    score: safetyScore,
    type: LLMTestType.SAFETY,
    details: safetyScore < 0.8 ? 'Response may contain unsafe content' : undefined
  };
}

/**
 * Test if the response is complete
 * @param response The LLM response text
 * @returns Test result
 */
function testCompleteness(response: string): LLMTestResult {
  // Check for incomplete sentences at the end
  const endsWithPunctuation = /[.!?]$/.test(response.trim());

  // Check for minimum length
  const isLongEnough = response.length >= 50;

  // Check for cut-off indicators
  const hasCutoffIndicators = response.endsWith('...') ||
                              response.includes("I'll continue") ||
                              response.includes('to be continued');

  // Calculate completeness score
  let completenessScore = 0.5;
  if (endsWithPunctuation) completenessScore += 0.2;
  if (isLongEnough) completenessScore += 0.2;
  if (!hasCutoffIndicators) completenessScore += 0.1;

  return {
    passed: completenessScore >= 0.7,
    score: completenessScore,
    type: LLMTestType.COMPLETENESS,
    details: completenessScore < 0.7 ? 'Response appears to be incomplete' : undefined
  };
}

/**
 * Test if the response has proper formatting
 * @param response The LLM response text
 * @returns Test result
 */
function testFormat(response: string): LLMTestResult {
  // Check for paragraphs
  const hasParagraphs = response.includes('\n\n');

  // Check for lists
  const hasLists = response.includes('\n- ') ||
                   /\n\d+\./.test(response);

  // Check for proper capitalization
  const hasProperCapitalization = /[A-Z]/.test(response.charAt(0));

  // Calculate format score
  let formatScore = 0.5;
  if (hasParagraphs) formatScore += 0.2;
  if (hasLists) formatScore += 0.2;
  if (hasProperCapitalization) formatScore += 0.1;

  return {
    passed: formatScore >= 0.7,
    score: formatScore,
    type: LLMTestType.FORMAT,
    details: formatScore < 0.7 ? 'Response lacks proper formatting' : undefined
  };
}

/**
 * Extract key terms from a prompt
 * @param prompt The prompt text
 * @returns Array of key terms
 */
function extractKeyTerms(prompt: string): string[] {
  // Simple extraction of potential key terms
  // In a real implementation, this would be more sophisticated
  const words = prompt.split(/\s+/);

  // Filter for words that might be key terms (longer words, capitalized words)
  return words.filter(word => {
    const cleaned = word.replace(/[.,?!;:()"']/g, '');
    return cleaned.length > 5 ||
           (cleaned.length > 0 && cleaned[0] === cleaned[0].toUpperCase());
  });
}

/**
 * Generate a mock LLM response for testing
 * @param prompt The prompt to generate a response for
 * @param quality Quality of the response (0-1)
 * @returns Mock response
 */
export function generateMockLLMResponse(prompt: string, quality: number = 0.8): string {
  // Extract key terms for relevance
  const keyTerms = extractKeyTerms(prompt);

  // Base responses of varying quality
  const highQualityResponses = [
    `Based on the data provided, I've identified several important patterns in your study behavior. First, your performance in pharmacology topics is consistently lower than other areas, with an average score of 65% compared to 78% in other topics. Additionally, I notice you tend to study more effectively in the afternoon, with 45% of your successful study sessions occurring between 2-5pm.\n\nI recommend focusing more attention on pharmacology concepts, particularly medication classifications and interactions. Consider scheduling these more challenging topics during your peak performance time in the afternoons. Also, your missed task rate of 15% suggests you might benefit from more consistent daily study sessions rather than longer, less frequent sessions.\n\nGiven you have 45 days until your exam, I suggest allocating at least 3 focused study sessions per week specifically to pharmacology, while maintaining your strong performance in medical-surgical nursing concepts.`,

    `I've analyzed your recent performance data and noticed some important trends. Your readiness score of 68% indicates you're making good progress, but there are specific areas that need attention.\n\nStrengths:\n- Consistent performance in fundamentals (85% average)\n- Good retention of previously studied material\n- Regular study sessions (4-5 times per week)\n\nAreas for improvement:\n- Pediatric nursing concepts (58% average)\n- Consistency in morning study sessions\n- Completion of practice questions (only 65% completion rate)\n\nRecommendations:\n1. Increase focus on pediatric nursing with daily review\n2. Schedule more challenging topics during your peak performance time (afternoons)\n3. Set a goal to complete at least 20 practice questions daily\n4. Consider adding 2-3 review sessions for previously covered material`
  ];

  const mediumQualityResponses = [
    `Looking at your study data, I can see some patterns. Your performance in some topics is lower than others. You seem to study better at certain times of day.\n\nI think you should focus more on the topics where you're scoring lower. Try to study during the times when you're most productive. Also, try to be more consistent with your study schedule.\n\nWith your exam coming up, you should make sure to review all the important topics and do plenty of practice questions.`,

    `Based on your data, here are some insights:\n- You're doing okay in most topics\n- Some areas need improvement\n- You have missed some tasks\n- Your study schedule could be more consistent\n\nRecommendations:\n1. Study more\n2. Focus on weak areas\n3. Complete all assigned tasks\n4. Review regularly`
  ];

  const lowQualityResponses = [
    `You need to study more. Your scores are not good enough. Try harder and do more practice questions.`,

    `I looked at your data. Study more. Focus on the hard topics. Don't miss assignments. Good luck on your exam.`
  ];

  // Select response based on quality parameter
  let baseResponse: string; // Add string type
  if (quality >= 0.8) {
    baseResponse = highQualityResponses[Math.floor(Math.random() * highQualityResponses.length)];
  } else if (quality >= 0.5) {
    baseResponse = mediumQualityResponses[Math.floor(Math.random() * mediumQualityResponses.length)];
  } else {
    baseResponse = lowQualityResponses[Math.floor(Math.random() * lowQualityResponses.length)];
  }

  // Inject some key terms from the prompt to increase relevance
  if (keyTerms.length > 0 && quality > 0.3) {
    const termsToUse = Math.min(keyTerms.length, Math.floor(quality * 5));
    const selectedTerms = keyTerms
      .sort(() => 0.5 - Math.random())
      .slice(0, termsToUse);

    selectedTerms.forEach(term => {
      if (!baseResponse.toLowerCase().includes(term.toLowerCase())) {
        const sentences = baseResponse.split('.');
        const insertIndex = Math.floor(Math.random() * sentences.length);
        sentences[insertIndex] += ` This is particularly important for ${term}`;
        baseResponse = sentences.join('.');
      }
    });
  }

  return baseResponse;
}
