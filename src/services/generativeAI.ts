import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getNCLEXPrompt, getTopicSpecificPrompt } from '../utils/prompts'; // Changed to relative

// Initialize the Google Generative AI client
const geminiApiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_KEY || '';
const geminiModelName = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_MODEL || 'gemini-1.5-pro';

// Initialize OpenRouter configuration
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
const openRouterModel = process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder:free';

console.log('Gemini API Key:', geminiApiKey ? 'API key is set' : 'API key is not set');
console.log('Gemini Model Name:', geminiModelName);
console.log('OpenRouter API Key:', openRouterApiKey ? 'API key is set' : 'API key is not set');
console.log('OpenRouter Model:', openRouterModel);

// Create Gemini client (only if API key is available)
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Configure safety settings
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

/**
 * Generate a response from the AI tutor
 * @param message User's message
 * @param userId Optional user ID for personalized responses
 * @param conversationHistory Previous messages in the conversation
 * @returns AI-generated response
 */
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
        'X-Title': 'ArcherReview AI Tutor'
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
        max_tokens: 1024
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

export async function generateTutorResponse(
  message: string,
  userId?: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  try {
    // Try Google Gemini first
    if (genAI && geminiApiKey) {
      try {
        // Get the model with concise generation config
        const model = genAI.getGenerativeModel({
          model: geminiModelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024, // Limit response length for conciseness
          }
        });

        // Enhanced prompt with concise instructions
        const conciseInstructions = `
IMPORTANT: Keep your response CONCISE and focused. Guidelines:
- Limit to 2-3 key points maximum per explanation
- Use bullet points or numbered lists when appropriate
- Provide direct answers without lengthy introductions
- If giving examples, limit to 1-2 relevant ones
- Prioritize clarity and brevity over comprehensive coverage
- End with a brief summary or key takeaway

User Question: ${message}`;

        const prompt = getNCLEXPrompt(userId) + "\n\n" + conciseInstructions;

        // Generate content directly without chat history for simplicity
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return text;
      } catch (geminiError) {
        console.warn('Gemini API failed, falling back to OpenRouter:', geminiError);
        // Fall through to OpenRouter
      }
    }

    // Fallback to OpenRouter
    console.log('Using OpenRouter fallback for tutor response');

    // Enhanced prompt with concise instructions for OpenRouter
    const conciseInstructions = `
IMPORTANT: Keep your response CONCISE and focused. Guidelines:
- Limit to 2-3 key points maximum per explanation
- Use bullet points or numbered lists when appropriate
- Provide direct answers without lengthy introductions
- If giving examples, limit to 1-2 relevant ones
- Prioritize clarity and brevity over comprehensive coverage
- End with a brief summary or key takeaway

User Question: ${message}`;

    const prompt = getNCLEXPrompt(userId) + "\n\n" + conciseInstructions;
    return await callOpenRouter(prompt);

  } catch (error) {
    console.error('Error generating AI tutor response:', error);
    return getFallbackResponse(message);
  }
}

/**
 * Interface for topic context
 */
interface TopicContext {
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
}

/**
 * Generate a topic-specific response from the AI tutor
 * @param message User's message
 * @param topicContext Context about the specific topic
 * @param userId Optional user ID for personalized responses
 * @param conversationHistory Previous messages in the conversation
 * @returns AI-generated response
 */
export async function generateTopicTutorResponse(
  message: string,
  topicContext: TopicContext,
  userId?: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  try {
    // Try Google Gemini first
    if (genAI && geminiApiKey) {
      try {
        // Get the model
        const model = genAI.getGenerativeModel({ model: geminiModelName });

        // Prepare the chat history
        const history = conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

        // Get the topic-specific prompt
        const systemPrompt = getTopicSpecificPrompt(topicContext, userId);

        // Start a chat session
        const chat = model.startChat({
          history,
          safetySettings,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          },
          systemInstruction: systemPrompt,
        });

        // Generate a response
        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        return text;
      } catch (geminiError) {
        console.warn('Gemini API failed for topic response, falling back to OpenRouter:', geminiError);
        // Fall through to OpenRouter
      }
    }

    // Fallback to OpenRouter
    console.log('Using OpenRouter fallback for topic-specific tutor response');
    const systemPrompt = getTopicSpecificPrompt(topicContext, userId);

    // Enhanced prompt with concise instructions for topic-specific responses
    const conciseInstructions = `
IMPORTANT: Keep your response CONCISE and focused. Guidelines:
- Limit to 2-3 key points maximum per explanation
- Use bullet points or numbered lists when appropriate
- Provide direct answers without lengthy introductions
- If giving examples, limit to 1 relevant clinical example
- Prioritize clarity and brevity over comprehensive coverage
- End with a brief summary or key takeaway

User Question: ${message}`;

    const prompt = `${systemPrompt}\n\n${conciseInstructions}`;
    return await callOpenRouter(prompt);

  } catch (error) {
    console.error('Error generating topic-specific AI tutor response:', error);

    // Try OpenRouter fallback for simpler generation
    try {
      const prompt = `
        Topic: ${topicContext.topicName}
        Category: ${topicContext.topicCategory}

        User question: ${message}

        Provide a helpful response about this nursing topic.
      `;

      return await callOpenRouter(prompt);
    } catch (fallbackError) {
      console.error('Error in OpenRouter fallback generation:', fallbackError);
      return getFallbackResponse(message, topicContext.topicName);
    }
  }
}

/**
 * Get a fallback response when the AI service fails
 * @param message User's message
 * @param topicName Optional topic name for more specific fallbacks
 * @returns Fallback response
 */
function getFallbackResponse(message: string, topicName?: string): string {
  // If we have a topic name, provide a topic-specific fallback
  if (topicName) {
    return `I'm having trouble connecting to my knowledge base for ${topicName}. Please try again.

Quick study tips:
• Focus on core concepts over memorization
• Apply knowledge to clinical scenarios
• Practice with application questions
• Create concept maps for relationships
• Teach concepts to reinforce understanding`;
  }

  // Simple keyword-based responses for fallback - kept concise
  if (message.toLowerCase().includes('nclex')) {
    return `NCLEX tests nursing knowledge for entry-level practice. Two types: NCLEX-RN and NCLEX-PN. Uses CAT (Computerized Adaptive Testing) with 75-145 questions for RN.

Key areas: Fundamentals, Pharmacology, Medical-Surgical, Pediatrics, Maternal-Newborn, Psychiatric, and Management.

Need help with specific content or study strategies?`;
  } else if (message.toLowerCase().includes('pharmacology') || message.toLowerCase().includes('medication')) {
    return `Pharmacology (12-18% of NCLEX) focuses on:

• Drug classifications and mechanisms
• Side effects and adverse reactions
• Nursing considerations and monitoring
• Dosage calculations
• High-alert medications (anticoagulants, insulins, opioids)

Which aspect would you like to explore?`;
  } else if (message.toLowerCase().includes('priority') || message.toLowerCase().includes('prioritize')) {
    return `NCLEX prioritization uses these frameworks:

• **ABCs**: Airway, Breathing, Circulation first
• **Maslow's**: Physiological needs before safety/psychosocial
• **Acute vs Chronic**: Acute takes priority
• **Stable vs Unstable**: Unstable patients first

Example: Chest pain patient before medication question or anxiety.`;
  } else {
    return `I'm your NCLEX AI Tutor! I can help with:

• Nursing concepts and fundamentals
• Pharmacology and medications
• Medical-surgical scenarios
• Pediatric and maternal care
• Psychiatric nursing
• Test-taking strategies

What specific topic would you like to explore?`;
  }
}
