import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { getAgentPrompt } from '../utils/agentPrompts'; // Changed to relative
import { setCacheItem, getCacheItem } from '../utils/serverCacheUtils'; // Changed to relative

// Initialize the Google Generative AI client
const geminiApiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_KEY || '';
const geminiModelName = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_MODEL || 'gemini-1.5-pro';

// Initialize OpenRouter configuration
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
const openRouterModel = process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder:free';

console.log('AgentAI - Gemini API Key:', geminiApiKey ? 'API key is set' : 'API key is not set');
console.log('AgentAI - OpenRouter API Key:', openRouterApiKey ? 'API key is set' : 'API key is not set');

// Create Gemini client (only if API key is available)
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Safety settings to prevent harmful content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Default generation config
const defaultGenerationConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 2048,
};

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 10,
  MAX_REQUESTS_PER_HOUR: 100,
  RETRY_AFTER_MS: 2000,
  MAX_RETRIES: 3,
};

// In-memory rate limiting
let requestsThisMinute = 0;
let requestsThisHour = 0;
let lastMinuteReset = Date.now();
let lastHourReset = Date.now();

// Agent types
export type AgentType = 'monitor' | 'adaptation' | 'feedback' | 'remediation' | 'scheduler';

/**
 * Call OpenRouter API as fallback
 */
async function callOpenRouter(prompt: string): Promise<string> {
  try {
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        'X-Title': 'ArcherReview AI Agent'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenRouter API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}

/**
 * Reset rate limiting counters if needed
 */
function checkAndResetRateLimits() {
  const now = Date.now();

  // Reset minute counter if a minute has passed
  if (now - lastMinuteReset > 60 * 1000) {
    requestsThisMinute = 0;
    lastMinuteReset = now;
  }

  // Reset hour counter if an hour has passed
  if (now - lastHourReset > 60 * 60 * 1000) {
    requestsThisHour = 0;
    lastHourReset = now;
  }
}

/**
 * Check if we're rate limited
 * @returns Whether we're currently rate limited
 */
function isRateLimited(): boolean {
  checkAndResetRateLimits();
  return (
    requestsThisMinute >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE ||
    requestsThisHour >= RATE_LIMIT.MAX_REQUESTS_PER_HOUR
  );
}

/**
 * Record an API request for rate limiting
 */
function recordApiRequest() {
  checkAndResetRateLimits();
  requestsThisMinute++;
  requestsThisHour++;
}

/**
 * Generate a response from an AI agent
 * @param agentType Type of agent (monitor, adaptation, etc.)
 * @param prompt The prompt to send to the AI
 * @param context Additional context for the agent
 * @param cacheKey Optional cache key for caching responses
 * @param cacheDuration Optional cache duration in milliseconds
 * @returns AI-generated response
 */
export async function generateAgentResponse(
  agentType: AgentType,
  prompt: string,
  context: Record<string, any> = {},
  cacheKey?: string,
  cacheDuration: number = 30 * 60 * 1000 // 30 minutes default
): Promise<{ text: string; cached: boolean; confidence?: number }> {
  // Check cache first if a cache key is provided
  if (cacheKey) {
    const cachedResponse = getCacheItem<{ text: string; confidence?: number }>(cacheKey);
    if (cachedResponse) {
      console.log(`[AgentAI] Cache hit for ${agentType} agent with key ${cacheKey}`);
      return { ...cachedResponse, cached: true };
    }
  }

  // Log the request
  console.log(`[AgentAI] Generating response for ${agentType} agent`);
  console.time(`[AgentAI] ${agentType} response time`);

  try {
    // Try Google Gemini first
    if (genAI && geminiApiKey) {
      try {
        // Check rate limits
        if (isRateLimited()) {
          console.warn('[AgentAI] Rate limit exceeded, falling back to OpenRouter');
          // Fall through to OpenRouter
        } else {
          // Get the model
          const model = genAI.getGenerativeModel({ model: geminiModelName });

          // Get the agent-specific prompt
          const systemPrompt = getAgentPrompt(agentType, context);

          // Generate content with retries
          const result = await generateWithRetries(model, systemPrompt, prompt);

          // Record the API request for rate limiting
          recordApiRequest();

          // Extract the response text
          const text = result.response.text();

          // Calculate a simple confidence score based on response length and coherence
          const confidence = calculateConfidence(text);

          // Cache the response if a cache key is provided
          if (cacheKey) {
            setCacheItem(cacheKey, { text, confidence }, cacheDuration);
          }

          console.timeEnd(`[AgentAI] ${agentType} response time`);
          return { text, cached: false, confidence };
        }
      } catch (geminiError) {
        console.warn('[AgentAI] Gemini API failed, falling back to OpenRouter:', geminiError);
        // Fall through to OpenRouter
      }
    }

    // Fallback to OpenRouter
    console.log('[AgentAI] Using OpenRouter fallback for agent response');
    const systemPrompt = getAgentPrompt(agentType, context);
    const fullPrompt = `${systemPrompt}\n\nUser Input: ${prompt}`;
    const text = await callOpenRouter(fullPrompt);
    const confidence = calculateConfidence(text);

    // Cache the response if a cache key is provided
    if (cacheKey) {
      setCacheItem(cacheKey, { text, confidence }, cacheDuration);
    }

    console.timeEnd(`[AgentAI] ${agentType} response time`);
    return { text, cached: false, confidence };

  } catch (error) {
    console.error(`[AgentAI] Error generating ${agentType} agent response:`, error);
    console.timeEnd(`[AgentAI] ${agentType} response time`);
    return { text: getFallbackResponse(agentType, prompt), cached: false };
  }
}

/**
 * Generate content with retries
 * @param model The Gemini model
 * @param systemPrompt System prompt for the agent
 * @param userPrompt User prompt
 * @returns Generated content
 */
async function generateWithRetries(
  model: GenerativeModel,
  systemPrompt: string,
  userPrompt: string
) {
  let retries = 0;
  let lastError: any = null;

  while (retries <= RATE_LIMIT.MAX_RETRIES) {
    try {
      // Combine system prompt and user prompt
      const fullPrompt = `${systemPrompt}\n\nUser Input: ${userPrompt}`;

      // Generate content
      return await model.generateContent(fullPrompt);
    } catch (error) {
      lastError = error;
      retries++;

      if (retries <= RATE_LIMIT.MAX_RETRIES) {
        console.warn(`[AgentAI] Retry ${retries}/${RATE_LIMIT.MAX_RETRIES} after error:`, error);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.RETRY_AFTER_MS));
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError;
}

/**
 * Calculate a simple confidence score for the response
 * @param text The generated text
 * @returns Confidence score between 0 and 1
 */
function calculateConfidence(text: string): number {
  // Simple heuristics for confidence:
  // 1. Length of response (longer responses might indicate more confidence)
  // 2. Presence of uncertainty markers like "I'm not sure", "might be", etc.

  const length = text.length;
  const uncertaintyMarkers = [
    "i'm not sure", "i am not sure", "might be", "could be", "possibly",
    "perhaps", "uncertain", "unclear", "don't know", "do not know"
  ];

  // Base confidence on length (0.5 - 0.9 range)
  let confidence = 0.5 + Math.min(0.4, length / 1000 * 0.4);

  // Reduce confidence for each uncertainty marker (up to 0.3 reduction)
  const uncertaintyCount = uncertaintyMarkers.reduce((count, marker) => {
    return count + (text.toLowerCase().includes(marker) ? 1 : 0);
  }, 0);

  confidence -= Math.min(0.3, uncertaintyCount * 0.1);

  return Math.max(0.1, Math.min(0.95, confidence));
}

/**
 * Get a fallback response when the AI generation fails
 * @param agentType Type of agent
 * @param prompt The original prompt
 * @returns Fallback response
 */
function getFallbackResponse(agentType: AgentType, prompt: string): string {
  switch (agentType) {
    case 'monitor':
      return "Based on the available data, I've detected some patterns in your study behavior. It appears you might benefit from more consistent study sessions and focusing on challenging topics earlier in the day when your concentration is likely higher.";
    case 'adaptation':
      return "I recommend adjusting your study schedule to better accommodate your learning patterns. Consider spacing out difficult topics and adding more review sessions for areas where you've shown lower performance.";
    case 'feedback':
      return "Thank you for your feedback. I'll use this information to improve your study plan and recommendations.";
    case 'remediation':
      return "Based on your recent performance, I recommend reviewing the fundamental concepts and practicing with more questions to strengthen your understanding.";
    case 'scheduler':
      return "I've analyzed your availability and learning patterns to create an optimized schedule. This balances topic difficulty with your peak performance times.";
    default:
      return "I'm here to help with your NCLEX preparation. Please let me know if you have any specific questions or need assistance with your study plan.";
  }
}
