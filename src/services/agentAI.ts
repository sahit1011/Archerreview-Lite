import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { getAgentPrompt } from '../utils/agentPrompts'; // Changed to relative
import { setCacheItem, getCacheItem } from '../utils/serverCacheUtils'; // Changed to relative

/**
 * Options for an agent response request.
 */
export interface AgentResponseOptions {
  /**
   * When true, the LLM is instructed to return raw JSON and (where the
   * provider supports it) the Gemini call is run in JSON response mode
   * (responseMimeType: 'application/json'). This makes downstream parsing
   * deterministic instead of relying on markdown-fence regex extraction.
   */
  expectJson?: boolean;
}

/**
 * Strip leading/trailing markdown code fences (```json ... ``` or ``` ... ```)
 * from an LLM response so the inner payload can be JSON.parse'd.
 * Returns the best-effort inner string; never throws.
 */
export function stripCodeFences(text: string): string {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();

  // Prefer an explicitly fenced block if one exists anywhere in the text.
  const fenced =
    trimmed.match(/```json\s*([\s\S]*?)\s*```/i) ||
    trimmed.match(/```\s*([\s\S]*?)\s*```/);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }

  // No fenced block: drop any stray leading/trailing fences and return.
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

/**
 * Safely parse an LLM response as JSON.
 *
 * Strips markdown code fences, runs JSON.parse inside a try/catch, then runs
 * an optional caller-supplied validator. On ANY failure this returns the
 * provided fallback rather than throwing, so callers never have to guard
 * against malformed model output crashing the request path.
 *
 * @param text       Raw LLM text.
 * @param fallback   Value to return when parsing or validation fails.
 * @param validate   Optional shape/enum validator. Return a sanitized value
 *                   to accept, or null/undefined to reject (-> fallback).
 */
export function parseLLMJson<T>(
  text: string,
  fallback: T,
  validate?: (parsed: any) => T | null | undefined
): { value: T; ok: boolean } {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { value: fallback, ok: false };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(stripCodeFences(text));
  } catch (err) {
    console.warn('[AgentAI] Failed to parse LLM response as JSON, using fallback:', err);
    return { value: fallback, ok: false };
  }

  if (parsed === null || typeof parsed !== 'object') {
    console.warn('[AgentAI] Parsed LLM JSON was not an object, using fallback');
    return { value: fallback, ok: false };
  }

  if (validate) {
    try {
      const validated = validate(parsed);
      if (validated === null || validated === undefined) {
        console.warn('[AgentAI] LLM JSON failed shape validation, using fallback');
        return { value: fallback, ok: false };
      }
      return { value: validated, ok: true };
    } catch (err) {
      console.warn('[AgentAI] LLM JSON validation threw, using fallback:', err);
      return { value: fallback, ok: false };
    }
  }

  return { value: parsed as T, ok: true };
}

/**
 * Coerce an arbitrary value to one of an allowed enum set, falling back to a
 * default. Useful inside validators passed to parseLLMJson.
 */
export function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

// Initialize the Google Generative AI client
const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_KEY || '';
const geminiModelName = process.env.GOOGLE_GENERATIVE_AI_MODEL || 'gemini-1.5-pro';

// Initialize OpenRouter configuration
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
// A usable OpenRouter key looks like `sk-or-...`. Anything else (empty, or a
// placeholder like REPLACE_WITH_REAL_OPENROUTER_KEY) is treated as "not configured"
// so agents skip the network round-trip and use their rule-based fallback — and
// flip to live LLM automatically the instant a real key is set. This lets the
// USE_LLM_* flags stay ON without wasteful failing calls before the key exists.
const hasRealOpenRouterKey = /^sk-or-/.test(openRouterApiKey);
// DeepSeek V3 — strong STEM reasoning for tutor + agent JSON tasks; free tier on
// OpenRouter. Override via OPENROUTER_MODEL.
const openRouterModel = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324:free';

console.log('AgentAI - Gemini API Key:', geminiApiKey ? 'API key is set' : 'API key is not set');
console.log('AgentAI - OpenRouter API Key:', hasRealOpenRouterKey ? 'API key is set' : 'API key is not set (rule-based fallback)');

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
    if (!hasRealOpenRouterKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        'X-Title': 'StudyArc AI Agent'
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
  cacheDuration: number = 30 * 60 * 1000, // 30 minutes default
  options: AgentResponseOptions = {}
): Promise<{ text: string; cached: boolean; confidence?: number }> {
  const expectJson = options.expectJson === true;
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
          // Build the generation config. When the caller expects JSON, ask
          // Gemini to respond in JSON mode so we get a parseable payload
          // instead of fenced/prose-wrapped output.
          const generationConfig: GenerationConfig = expectJson
            ? { ...defaultGenerationConfig, responseMimeType: 'application/json' }
            : { ...defaultGenerationConfig };

          // Get the model
          const model = genAI.getGenerativeModel({
            model: geminiModelName,
            safetySettings,
            generationConfig,
          });

          // Get the agent-specific prompt
          const systemPrompt = getAgentPrompt(agentType, context);

          // Generate content with retries
          const result = await generateWithRetries(model, systemPrompt, prompt);

          // Record the API request for rate limiting
          recordApiRequest();

          // Extract the response text
          const text = result.response.text();

          // Honest groundedness signal (NOT a calibrated confidence number).
          const confidence = deriveGroundednessSignal(text, { fromLLM: true });

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
    // OpenRouter has no JSON response-mode parity here, so when JSON is
    // expected we instruct the model to emit raw JSON only. Downstream
    // parsing still strips fences defensively via parseLLMJson().
    const jsonInstruction = expectJson
      ? '\n\nIMPORTANT: Respond with raw, valid JSON only. Do not wrap it in markdown code fences or add any prose before or after the JSON.'
      : '';
    const fullPrompt = `${systemPrompt}\n\nUser Input: ${prompt}${jsonInstruction}`;
    const text = await callOpenRouter(fullPrompt);
    const confidence = deriveGroundednessSignal(text, { fromLLM: true });

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
 * Derive an HONEST groundedness signal for a response.
 *
 * This intentionally replaces the previous calculateConfidence() heuristic,
 * which derived a "confidence" number from response length and uncertainty
 * keywords and persisted it as if it were calibrated. That number was
 * fabricated and misleading, so it has been removed.
 *
 * We do NOT have a calibrated probability that an answer is correct, so we
 * never invent one. The only honest thing we can say at this layer is whether
 * we actually received a non-empty answer from a live model versus nothing.
 *
 * Returns `undefined` when we have no honest basis for a number. Callers that
 * read `.confidence` already coalesce with their own explicit default
 * (e.g. `llmResponse.confidence || 0.7`), so returning `undefined` keeps them
 * working while making the absence of a real confidence value explicit.
 *
 * @param text     The generated text.
 * @param meta     Provenance flags (e.g. whether it came from the LLM).
 * @returns        `undefined` (no fabricated confidence).
 */
function deriveGroundednessSignal(
  text: string,
  _meta: { fromLLM?: boolean } = {}
): number | undefined {
  // No honest, calibrated confidence is available here. If the model returned
  // nothing usable, surface that as "no signal"; otherwise still return
  // undefined rather than a length-derived guess. Callers supply their own
  // default. An empty answer is the only thing we can flag negatively.
  if (typeof text !== 'string' || text.trim().length === 0) {
    return undefined;
  }
  return undefined;
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
      return "I'm here to help with your NEET/JEE preparation. Please let me know if you have any specific questions or need assistance with your study plan.";
  }
}
