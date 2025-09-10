"use client";

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage, { ChatMessageProps } from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import ChatSidebar from './ChatSidebar';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: ChatMessageProps[];
}

export default function ChatInterface({
  userId,
  initialPrompt,
  conversationTitle
}: {
  userId?: string;
  initialPrompt?: string;
  conversationTitle?: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from localStorage or API
  useEffect(() => {
    const loadConversations = async () => {
      try {
        // Don't load if we already have conversations with messages (from initial prompt processing)
        if (conversations.length > 0 && conversations.some(conv => conv.messages.length > 0)) {
          console.log("Skipping conversation load - already have conversations with messages");
          return;
        }

        // First, try to load from localStorage
        const savedConversations = localStorage.getItem('tutorConversations');

        if (savedConversations) {
          // Parse the saved conversations
          const parsedConversations: Conversation[] = JSON.parse(savedConversations);

          // Convert string timestamps back to Date objects
          const formattedConversations = parsedConversations.map(conv => ({
            ...conv,
            timestamp: new Date(conv.timestamp),
            messages: conv.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));

          setConversations(formattedConversations);

          // Set active conversation to the most recent one
          if (formattedConversations.length > 0) {
            setActiveConversationId(formattedConversations[0].id);
          }

          return;
        }

        // If no conversations in localStorage, try to load from API
        if (userId) {
          const response = await fetch(`/api/conversations?userId=${userId}`);

          if (response.ok) {
            const data = await response.json();

            if (data.success && data.conversations.length > 0) {
              // Format conversations from API
              const apiConversations = data.conversations.map((conv: any) => ({
                id: conv.id,
                title: conv.title,
                lastMessage: conv.lastMessage,
                timestamp: new Date(conv.timestamp),
                messages: conv.messages.map((msg: any) => ({
                  id: msg.id,
                  content: msg.content,
                  role: msg.role,
                  timestamp: new Date(msg.timestamp)
                }))
              }));

              setConversations(apiConversations);

              // Set active conversation to the most recent one
              if (apiConversations.length > 0) {
                setActiveConversationId(apiConversations[0].id);
              }

              return;
            }
          }
        } else {
          // For guest users, try to load from API without userId
          const response = await fetch('/api/conversations');

          if (response.ok) {
            const data = await response.json();

            if (data.success && data.conversations.length > 0) {
              // Format conversations from API
              const apiConversations = data.conversations.map((conv: any) => ({
                id: conv.id,
                title: conv.title,
                lastMessage: conv.lastMessage,
                timestamp: new Date(conv.timestamp),
                messages: conv.messages.map((msg: any) => ({
                  id: msg.id,
                  content: msg.content,
                  role: msg.role,
                  timestamp: new Date(msg.timestamp)
                }))
              }));

              setConversations(apiConversations);

              // Set active conversation to the most recent one
              if (apiConversations.length > 0) {
                setActiveConversationId(apiConversations[0].id);
              }

              return;
            }
          }
        }

        // If no conversations found, create default empty array
        setConversations([]);
      } catch (error) {
        console.error('Error loading conversations:', error);
        setConversations([]);
      }
    };

    loadConversations();
  }, [userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConversationId, isTyping]);

  // Debug conversation state changes
  useEffect(() => {
    if (activeConversationId) {
      const activeConv = conversations.find(conv => conv.id === activeConversationId);
      if (activeConv) {
        console.log("Active conversation state:", {
          id: activeConv.id,
          messageCount: activeConv.messages.length,
          lastMessage: activeConv.lastMessage,
          messages: activeConv.messages.map(msg => ({
            role: msg.role,
            contentLength: msg.content.length,
            timestamp: msg.timestamp
          }))
        });
      }
    }
  }, [conversations, activeConversationId]);

  // Handle initial prompt if provided - only once when component mounts
  useEffect(() => {
    // Only process if we have an initial prompt and conversations have been loaded
    if (!initialPrompt || initialPromptProcessed || conversations.length === 0) {
      return;
    }

    // Set a flag in sessionStorage to track if this prompt has been processed
    const promptKey = `processed_prompt_${initialPrompt.substring(0, 20)}_${conversationTitle || 'default'}`;
    const hasProcessedPrompt = sessionStorage.getItem(promptKey);

    if (hasProcessedPrompt) {
      console.log("Initial prompt already processed, skipping");
      setInitialPromptProcessed(true);
      return;
    }

    console.log("Processing initial prompt:", initialPrompt);
    console.log("With title:", conversationTitle || "New Topic Conversation");
    console.log("Current conversations length:", conversations.length);
    console.log("Active conversation ID:", activeConversationId);

    // Mark as processed immediately
    setInitialPromptProcessed(true);
    sessionStorage.setItem(promptKey, 'true');

    // Create a new conversation with the topic title
    const newConversationId = uuidv4();
    const timestamp = new Date();
    const newConversation: Conversation = {
      id: newConversationId,
      title: conversationTitle || "New Topic Conversation",
      lastMessage: '',
      timestamp,
      messages: []
    };

    // Update state with the new conversation
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setActiveConversationId(newConversationId);

    // Save the conversation to localStorage
    localStorage.setItem('tutorConversations', JSON.stringify(updatedConversations));

    // Save to API if user is logged in
    if (userId) {
      fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newConversationId,
          userId,
          title: newConversation.title,
          lastMessage: newConversation.lastMessage,
          timestamp: newConversation.timestamp,
          messages: newConversation.messages
        }),
      }).catch(error => {
        console.error('Error saving conversation to API:', error);
      });
    }

    // Create user message
    const newMessageId = uuidv4();
    const userMessage: ChatMessageProps = {
      id: newMessageId,
      content: initialPrompt,
      role: 'user',
      timestamp: new Date()
    };

    // Add the message to the conversation
    const convsWithUserMessage = updatedConversations.map(conv => {
      if (conv.id === newConversationId) {
        return {
          ...conv,
          lastMessage: initialPrompt,
          messages: [...conv.messages, userMessage]
        };
      }
      return conv;
    });

    // Update state and save
    setConversations(convsWithUserMessage);
    localStorage.setItem('tutorConversations', JSON.stringify(convsWithUserMessage));

    // Trigger the API call with a small delay to ensure state is updated
    setTimeout(() => {
      handleSendMessage(initialPrompt, true);
    }, 100);
  }, [initialPrompt, conversationTitle, conversations, initialPromptProcessed, userId]);

  // Save conversations to localStorage and API
  const saveConversations = async (updatedConversations: Conversation[]) => {
    try {
      // Save to localStorage
      localStorage.setItem('tutorConversations', JSON.stringify(updatedConversations));

      // If user is logged in, save to API
      if (userId && updatedConversations.length > 0) {
        // Find the active conversation
        const activeConv = updatedConversations.find(conv => conv.id === activeConversationId);

        if (activeConv) {
          // Check if conversation exists in API
          const checkResponse = await fetch(`/api/conversations/${activeConv.id}`);

          if (checkResponse.ok) {
            // Conversation exists, update it
            await fetch(`/api/conversations/${activeConv.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: activeConv.title,
                lastMessage: activeConv.lastMessage,
                timestamp: activeConv.timestamp,
                messages: activeConv.messages
              }),
            });
          } else {
            // Conversation doesn't exist, create it
            await fetch('/api/conversations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: activeConv.id,
                userId,
                title: activeConv.title,
                lastMessage: activeConv.lastMessage,
                timestamp: activeConv.timestamp,
                messages: activeConv.messages
              }),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  };

  const handleSendMessage = async (message: string, isInitialPrompt = false) => {
    // Skip duplicate check for initial prompts
    if (!isInitialPrompt) {
      // Check if this is a duplicate message (sent within the last 2 seconds)
      const currentConv = conversations.find(conv => conv.id === activeConversationId);
      const lastMessage = currentConv?.messages[currentConv.messages.length - 1];
      const isDuplicate = lastMessage &&
                          lastMessage.role === 'user' &&
                          lastMessage.content === message &&
                          (new Date().getTime() - new Date(lastMessage.timestamp).getTime()) < 2000;

      // If it's a duplicate message, don't process it again
      if (isDuplicate) {
        console.log("Preventing duplicate message:", message);
        return;
      }
    }

    console.log("Sending message:", message);
    console.log("Current conversations before sending:", conversations.length);
    console.log("Active conversation ID:", activeConversationId);

    const newMessageId = uuidv4();
    const timestamp = new Date();

    // Create a new message
    const newMessage: ChatMessageProps = {
      id: newMessageId,
      content: message,
      role: 'user',
      timestamp
    };

    console.log("Created user message:", newMessage);

    // If no active conversation, create a new one
    let currentConversationId = activeConversationId;
    let updatedConversations: Conversation[] = [];

    if (!currentConversationId) {
      const newConversationId = uuidv4();
      const newConversation: Conversation = {
        id: newConversationId,
        title: message.length > 30 ? `${message.substring(0, 30)}...` : message,
        lastMessage: message,
        timestamp,
        messages: [newMessage]
      };

      updatedConversations = [newConversation, ...conversations];
      setConversations(updatedConversations);
      setActiveConversationId(newConversationId);
      currentConversationId = newConversationId;
    } else {
      // Add message to existing conversation
      updatedConversations = conversations.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            lastMessage: message,
            timestamp,
            messages: [...conv.messages, newMessage]
          };
        }
        return conv;
      });

      setConversations(updatedConversations);
    }

    // Save updated conversations
    await saveConversations(updatedConversations);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Get the current conversation to extract history
      const currentConversation = updatedConversations.find(conv => conv.id === currentConversationId);
      const conversationHistory = currentConversation?.messages || [];

      // Prepare the history in the format expected by the API
      const history = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call the API
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
          history
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI Tutor');
      }

      const data = await response.json();

      // Add AI response to the conversation
      const aiMessageId = uuidv4();
      const aiTimestamp = new Date();

      console.log("Adding AI response to conversation:", currentConversationId);
      console.log("Updated conversations before AI response:", updatedConversations.length);
      console.log("AI response content length:", data.response.length);

      const conversationsWithAiResponse = updatedConversations.map(conv => {
        if (conv.id === currentConversationId) {
          console.log("Found target conversation, messages before:", conv.messages.length);
          const aiResponseMessage: ChatMessageProps = { // Explicitly type the new message
            id: aiMessageId,
            content: data.response,
            role: 'assistant',
            timestamp: aiTimestamp
          };
          const updatedConv = {
            ...conv,
            lastMessage: data.response.substring(0, 50) + (data.response.length > 50 ? '...' : ''),
            timestamp: aiTimestamp,
            messages: [...conv.messages, aiResponseMessage]
          };
          console.log("Updated conversation messages after AI response:", updatedConv.messages.length);
          return updatedConv;
        }
        return conv;
      });

      console.log("Final conversations with AI response:", conversationsWithAiResponse.length);

      // Update state immediately
      setConversations(conversationsWithAiResponse);

      // Save updated conversations with AI response
      await saveConversations(conversationsWithAiResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Add error message to conversation
      const errorMessageId = uuidv4();
      const errorTimestamp = new Date();

      // Check if the error is related to API quota
      const isQuotaError = error instanceof Error &&
        (error.message.includes('quota') || error.message.includes('429') || error.message.includes('Too Many Requests'));

      let errorContent = isQuotaError
        ? "I'm sorry, the AI service is currently experiencing high demand and has reached its quota limit. Your conversation is still saved, and you can continue when the service is available again. In the meantime, you can try asking a different question or reviewing previous conversations."
        : "I'm sorry, I encountered an error while processing your request. Please try again later.";

      const conversationsWithError = updatedConversations.map(conv => {
        if (conv.id === currentConversationId) {
          const errorMessageObject: ChatMessageProps = { // Explicitly type the new message
            id: errorMessageId,
            content: errorContent,
            role: 'assistant',
            timestamp: errorTimestamp
          };
          const updatedConv = {
            ...conv,
            lastMessage: errorContent.substring(0, 50) + '...',
            timestamp: errorTimestamp,
            messages: [...conv.messages, errorMessageObject]
          };
          return updatedConv;
        }
        return conv;
      });

      setConversations(conversationsWithError);

      // Save updated conversations with error message
      await saveConversations(conversationsWithError);
    } finally {
      // Hide typing indicator
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    const newConversationId = uuidv4();
    const timestamp = new Date();
    const newConversation: Conversation = {
      id: newConversationId,
      title: 'New Conversation', // Always use 'New Conversation' for new chats
      lastMessage: '',
      timestamp,
      messages: []
    };

    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setActiveConversationId(newConversationId);

    // Save updated conversations
    await saveConversations(updatedConversations);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  // Handle deleting a conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      console.log('Deleting conversation with ID:', id);
      console.log('Current conversations:', conversations);

      // If the active conversation is being deleted, set active to the next available one
      if (activeConversationId === id) {
        console.log('Active conversation is being deleted');
        const remainingConversations = conversations.filter(conv => conv.id !== id);
        if (remainingConversations.length > 0) {
          console.log('Setting new active conversation:', remainingConversations[0].id);
          setActiveConversationId(remainingConversations[0].id);
        } else {
          console.log('No remaining conversations, setting active to null');
          setActiveConversationId(null);
        }
      }

      // Remove from state
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      console.log('Updated conversations after deletion:', updatedConversations);
      setConversations(updatedConversations);

      // Save to localStorage
      localStorage.setItem('tutorConversations', JSON.stringify(updatedConversations));
      console.log('Saved to localStorage');

      // If user is logged in, delete from API
      if (userId) {
        console.log('Deleting from API for user:', userId);
        const response = await fetch(`/api/conversations/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        console.log('API delete response:', result);
      }

      console.log('Deletion completed successfully');
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Get active conversation
  const activeConversation = conversations.find(conv => conv.id === activeConversationId);



  return (
    <div className="flex h-full overflow-hidden relative">

      {/* Sidebar */}
      <ChatSidebar
        key="chat-sidebar"
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        isCollapsed={isSidebarCollapsed}
        toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Chat Area - Fixed height and layout */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Chat Messages Container - Fixed height with proper scrolling */}
        <div className="flex-1 min-h-0 relative">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div className="min-h-full">
              {activeConversation && activeConversation.messages.length > 0 ? (
                <div className="max-w-4xl mx-auto py-6 px-4 pb-24">
                  <div className="space-y-4">
                    {activeConversation.messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        id={message.id}
                        content={message.content}
                        role={message.role}
                        timestamp={message.timestamp}
                      />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 pb-24">
                  <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-8">
                      Hello, {userId ? 'User' : 'Guest'}
                    </h1>
                    <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                      I'm your AI NCLEX Tutor. Ask me anything about nursing concepts, practice questions, or study strategies!
                    </p>

                    <div className="max-w-3xl mx-auto mb-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {[
                          {
                            title: "Explain fluid and electrolyte balance",
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                            )
                          },
                          {
                            title: "What are priority nursing interventions?",
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )
                          },
                          {
                            title: "Help me understand medication calculations",
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            )
                          }
                        ].map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSendMessage(suggestion.title)}
                            className="glassmorphic-card rounded-xl p-6 text-center transition-all transform hover:-translate-y-2 hover:scale-105 hover:bg-white/15 group"
                          >
                            <div className="p-4 rounded-full mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto w-fit group-hover:from-purple-500 group-hover:to-pink-500 transition-all">
                              <div className="text-white">{suggestion.icon}</div>
                            </div>
                            <span className="text-sm font-medium text-white leading-tight">{suggestion.title}</span>
                          </button>
                        ))}
                      </div>

                      <div className="glassmorphic-card rounded-xl p-8 transform hover:-translate-y-2 transition-all hover:bg-white/15">
                        <div className="flex items-center mb-6">
                          <div className="mr-4 p-4 rounded-full bg-gradient-to-r from-teal-500 to-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white">NCLEX Study Assistant</h3>
                            <p className="text-gray-300 text-sm">Your AI-powered study companion</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            "Explain the nursing process",
                            "What are the priority nursing interventions for a patient with heart failure?",
                            "Help me understand delegation principles",
                            "What's the difference between type 1 and type 2 diabetes?",
                            "How do I calculate medication dosages?",
                            "What are the signs and symptoms of electrolyte imbalances?"
                          ].map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSendMessage(suggestion)}
                              className="glassmorphic rounded-lg p-4 text-left transition-all text-sm text-white hover:-translate-y-1 hover:bg-white/15 hover:scale-105"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Input Area at Bottom */}
        <div className="flex-shrink-0 border-t border-white/10 bg-gray-900/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto py-4 px-6">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isTyping} />
          </div>
        </div>
      </div>
    </div>
  );
}
