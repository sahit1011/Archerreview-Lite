import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getNCLEXPrompt, getTopicSpecificPrompt } from '../utils/prompts'; // Changed to relative

// Initialize the Google Generative AI client
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_KEY || '';
const modelName = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_MODEL || 'gemini-1.5-pro';

console.log('API Key:', apiKey ? 'API key is set' : 'API key is not set');
console.log('Model Name:', modelName);

// Create a client with the API key
const genAI = new GoogleGenerativeAI(apiKey);

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
export async function generateTutorResponse(
  message: string,
  userId?: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  try {
    // Check if API key is available
    if (!apiKey) {
      console.error('Google Generative AI API key is not configured');
      return getFallbackResponse(message);
    }

    // Get the model
    const model = genAI.getGenerativeModel({ model: modelName });

    // Get the model
    const prompt = getNCLEXPrompt(userId) + "\n\n" + message;

    // Generate content directly without chat history for simplicity
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return text;
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
    // Check if API key is available
    if (!apiKey) {
      console.error('Google Generative AI API key is not configured');
      return getFallbackResponse(message);
    }

    // Get the model
    const model = genAI.getGenerativeModel({ model: modelName });

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
  } catch (error) {
    console.error('Error generating topic-specific AI tutor response:', error);

    // Try fallback to simpler generation method
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `
        Topic: ${topicContext.topicName}
        Category: ${topicContext.topicCategory}

        User question: ${message}

        Provide a helpful response about this nursing topic.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (fallbackError) {
      console.error('Error in fallback generation:', fallbackError);
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
    return `Thank you for your question about ${topicName}. As your NCLEX AI Tutor, I'm here to help with this topic.

I'm currently experiencing some technical difficulties connecting to my knowledge base. Please try again in a few moments, or rephrase your question.

In the meantime, here are some general tips for studying ${topicName}:
1. Focus on understanding the core concepts rather than memorizing facts
2. Try to relate the material to real clinical scenarios
3. Practice with questions that test application of knowledge
4. Consider creating concept maps to visualize relationships between ideas
5. Teach the concept to someone else to reinforce your understanding`;
  }

  // Simple keyword-based responses for fallback
  if (message.toLowerCase().includes('nclex')) {
    return `The NCLEX (National Council Licensure Examination) is a standardized test used to determine if a candidate is prepared for entry-level nursing practice. The NCLEX is designed to test the knowledge, skills, and abilities essential for safe and effective nursing practice.

There are two types:
1. NCLEX-RN for registered nurses
2. NCLEX-PN for practical/vocational nurses

The exam uses computerized adaptive testing (CAT), which means the difficulty of questions adjusts based on your performance. The minimum number of questions is 75, and the maximum is 145 for RN (85-205 for PN).

Would you like specific information about study strategies, content areas, or question types?`;
  } else if (message.toLowerCase().includes('pharmacology') || message.toLowerCase().includes('medication')) {
    return `Pharmacology is a critical area for the NCLEX, accounting for approximately 12-18% of the exam. Here are key points to focus on:

1. **Medication Classifications**: Know major drug classes, their mechanisms of action, and prototype drugs for each class.

2. **Side Effects**: Understand common and serious adverse effects, especially those requiring immediate intervention.

3. **Nursing Considerations**: Know specific monitoring requirements, contraindications, and patient education points.

4. **Dosage Calculations**: Be prepared to calculate proper dosages, drip rates, and medication conversions.

5. **High-Alert Medications**: Pay special attention to anticoagulants, insulins, opioids, and other high-risk medications.

Would you like me to elaborate on a specific medication class or concept?`;
  } else if (message.toLowerCase().includes('priority') || message.toLowerCase().includes('prioritize')) {
    return `Prioritization is a key concept on the NCLEX. The exam often asks which patient you should see first or which action to take first. Use these frameworks to help prioritize:

1. **Maslow's Hierarchy**: Physiological needs come first (airway, breathing, circulation), followed by safety, then psychosocial needs.

2. **ABCs**: Airway, Breathing, Circulation - always address these first.

3. **Acute vs. Chronic**: Acute issues generally take priority over chronic conditions.

4. **Unstable vs. Stable**: Unstable patients take priority over stable patients.

5. **Life-Threatening vs. Non-Life-Threatening**: Always address life-threatening situations first.

Example: If you have four patients - one with chest pain, one with a new medication question, one with anxiety, and one needing ambulation assistance - you would see the chest pain patient first (potential ABC issue).`;
  } else {
    return `Thank you for your question. As your NCLEX AI Tutor, I'm here to help with any nursing concepts, practice questions, or study strategies.

Could you provide more details about what specific NCLEX topic you'd like me to explain? I can help with areas like:

- Pharmacology and medications
- Medical-surgical nursing
- Pediatric nursing
- Maternal-newborn nursing
- Psychiatric nursing
- Fundamentals of nursing
- Leadership and management
- Test-taking strategies

The more specific your question, the more tailored my response can be!`;
  }
}
