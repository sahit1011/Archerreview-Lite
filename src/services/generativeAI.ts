import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getTutorPrompt, getTopicSpecificPrompt } from '../utils/prompts'; // Changed to relative
import dbConnect from '../lib/db';
import { User } from '../models';

/**
 * Resolve the student's exam (NEET | JEE) so the tutor persona matches their track.
 * Any failure degrades to the generic NEET/JEE persona — never blocks a response.
 */
async function getUserExamType(userId?: string): Promise<'NEET' | 'JEE' | null> {
  if (!userId) return null;
  try {
    await dbConnect();
    const user = await User.findById(userId).select('examType').lean();
    const examType = (user as { examType?: string } | null)?.examType;
    return examType === 'JEE' ? 'JEE' : examType === 'NEET' ? 'NEET' : null;
  } catch {
    return null;
  }
}

// Initialize the Google Generative AI client
const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_KEY || '';
const geminiModelName = process.env.GOOGLE_GENERATIVE_AI_MODEL || 'gemini-1.5-pro';

// Initialize OpenRouter configuration
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
// DeepSeek V3 — strong STEM reasoning + step-by-step explanation, ideal for a
// NEET/JEE tutor (physics/chem/bio/maths), with a free OpenRouter tier. Override
// via OPENROUTER_MODEL (e.g. a paid tier if free rate limits bite).
const openRouterModel = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324:free';

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
        'X-Title': 'StudyArc AI Tutor'
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
    // Match the coaching persona to the student's exam (NEET vs JEE).
    const examType = await getUserExamType(userId);

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

        const prompt = getTutorPrompt(examType, userId) + "\n\n" + conciseInstructions;

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

    const prompt = getTutorPrompt(examType, userId) + "\n\n" + conciseInstructions;
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
  examType?: 'NEET' | 'JEE' | null;
  savedNotes?: string;
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
    // Match the coaching persona to the student's exam (NEET vs JEE).
    if (!topicContext.examType) {
      topicContext.examType = await getUserExamType(userId);
    }

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
- If giving examples, limit to 1 relevant worked example
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

        Provide a helpful response about this NEET/JEE topic.
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
• Apply knowledge to numerical and reasoning problems
• Practice with application questions
• Create concept maps for relationships
• Teach concepts to reinforce understanding`;
  }

  // Simple keyword-based responses for fallback - kept concise
  if (message.toLowerCase().includes('neet') || message.toLowerCase().includes('jee')) {
    return `NEET and JEE are India's major entrance exams. NEET is for medical (MBBS/BDS) admissions; JEE is for engineering admissions. Both are highly competitive, syllabus-driven exams based largely on the NCERT curriculum.

Key subjects: NEET covers Physics, Chemistry, and Biology. JEE covers Physics, Chemistry, and Mathematics.

Need help with specific content or study strategies?`;
  } else if (message.toLowerCase().includes('organic') || message.toLowerCase().includes('chemistry')) {
    return `Chemistry is a high-yield subject for both NEET and JEE. Focus on:

• Physical Chemistry: Thermodynamics, Equilibrium, Electrochemistry
• Organic Chemistry: reaction mechanisms, named reactions, isomerism
• Inorganic Chemistry: periodic trends, coordination compounds, p-block
• Numerical problem practice (mole concept, kinetics)
• NCERT thoroughness for direct questions

Which aspect would you like to explore?`;
  } else if (message.toLowerCase().includes('priority') || message.toLowerCase().includes('prioritize')) {
    return `NEET/JEE prioritization uses these frameworks:

• **High-weightage chapters first**: e.g. Mechanics, Organic Chemistry, Calculus
• **Strength-vs-gap**: secure your strong subjects, then attack weak chapters
• **Concept before speed**: master fundamentals before timed practice
• **Accuracy vs attempts**: negative marking rewards careful selection

Example: Revise Electrostatics and Thermodynamics before lower-weightage topics.`;
  } else {
    return `I'm your NEET/JEE AI Tutor! I can help with:

• Physics concepts (Mechanics, Electrostatics, Optics)
• Chemistry (Physical, Organic, Inorganic)
• Biology for NEET (Human Physiology, Genetics)
• Mathematics for JEE (Calculus, Algebra)
• Problem-solving and test-taking strategies

What specific topic would you like to explore?`;
  }
}

/**
 * Distill a tutor conversation into concise revision notes (markdown bullets).
 *
 * Used by "Save key points to My Notes": the student's brainstorm with the AI
 * tutor becomes a permanent, revisable note attached to the topic. Tries Gemini,
 * then OpenRouter; if no LLM is available it falls back to an extractive summary
 * (the student's questions + first lines of each answer) so the feature always works.
 */
export async function distillConversationToNote(
  messages: { role: 'user' | 'assistant'; content: string }[],
  topicName?: string
): Promise<{ content: string; llmGenerated: boolean }> {
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n\n')
    .slice(0, 24000); // keep the prompt bounded

  const prompt = `You are helping an Indian NEET/JEE aspirant build their personal revision notes.
Below is a tutoring conversation${topicName ? ` about "${topicName}"` : ''}. Distill it into concise revision notes the student can use later.

Rules:
- Output ONLY markdown bullet points (use "-"), no preamble, no headings.
- 4-10 bullets. Each bullet is one self-contained fact, formula, method, or misconception fixed during the session.
- Include formulas/values exactly as discussed.
- If the student made a specific mistake that got corrected, capture it as "Watch out: ...".
- Skip greetings, meta-chat, and anything not useful for revision.

Conversation:
${transcript}`;

  // Try Gemini
  if (genAI && geminiApiKey) {
    try {
      const model = genAI.getGenerativeModel({
        model: geminiModelName,
        generationConfig: { temperature: 0.3, maxOutputTokens: 700 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return { content: text, llmGenerated: true };
    } catch (err) {
      console.warn('[notes] Gemini distillation failed, trying OpenRouter:', err);
    }
  }

  // Try OpenRouter
  try {
    const text = (await callOpenRouter(prompt)).trim();
    if (text) return { content: text, llmGenerated: true };
  } catch (err) {
    console.warn('[notes] OpenRouter distillation failed, using extractive fallback:', err);
  }

  // Extractive fallback — no LLM available. Pair each student question with the
  // first meaningful line of the tutor's answer.
  const bullets: string[] = [];
  for (let i = 0; i < messages.length && bullets.length < 10; i++) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    const question = m.content.trim().replace(/\s+/g, ' ').slice(0, 140);
    const answer = messages
      .slice(i + 1)
      .find((x) => x.role === 'assistant')
      ?.content.trim()
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 20)[0]
      ?.slice(0, 220);
    if (question) bullets.push(`- **Q:** ${question}${answer ? `\n  - ${answer}` : ''}`);
  }
  return {
    content: bullets.length > 0 ? bullets.join('\n') : '- (No revision points could be extracted from this conversation.)',
    llmGenerated: false,
  };
}
