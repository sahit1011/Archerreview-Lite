/**
 * Format the AI response for display in the chat interface
 * @param response Raw response from the AI
 * @returns Formatted response
 */
export function formatAIResponse(response: string): string {
  // Replace multiple newlines with a maximum of two
  let formatted = response.replace(/\n{3,}/g, '\n\n');
  
  // Ensure code blocks are properly formatted
  formatted = formatCodeBlocks(formatted);
  
  // Format lists
  formatted = formatLists(formatted);
  
  // Format headings
  formatted = formatHeadings(formatted);
  
  return formatted;
}

/**
 * Format code blocks in the response
 * @param text Response text
 * @returns Formatted text with proper code blocks
 */
function formatCodeBlocks(text: string): string {
  // Ensure code blocks have the proper syntax
  return text.replace(/```([\w]*)\s*\n([\s\S]*?)```/g, (_, language, code) => {
    return `\`\`\`${language || ''}\n${code.trim()}\n\`\`\``;
  });
}

/**
 * Format lists in the response
 * @param text Response text
 * @returns Formatted text with proper lists
 */
function formatLists(text: string): string {
  // Ensure lists have proper spacing
  return text
    // Format numbered lists
    .replace(/^(\d+\.\s.*?)(?=\n\d+\.|$)/gm, '$1\n')
    // Format bullet lists
    .replace(/^(\*\s.*?)(?=\n\*\s|$)/gm, '$1\n');
}

/**
 * Format headings in the response
 * @param text Response text
 * @returns Formatted text with proper headings
 */
function formatHeadings(text: string): string {
  // Ensure headings have proper spacing
  return text
    .replace(/^(#{1,6}\s.*?)(?=\n)/gm, '$1\n');
}

/**
 * Extract a title from the user's message for the conversation
 * @param message User's message
 * @returns A title for the conversation
 */
export function extractConversationTitle(message: string): string {
  // Truncate long messages
  if (message.length > 50) {
    return message.substring(0, 47) + '...';
  }
  
  return message;
}
