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

  // Handle initial prompt if provided - only once when component mounts
  useEffect(() => {
    // Set a flag in sessionStorage to track if this prompt has been processed
    const promptKey = `processed_prompt_${initialPrompt?.substring(0, 20)}`;
    const hasProcessedPrompt = sessionStorage.getItem(promptKey);

    if (initialPrompt && !initialPromptProcessed && !hasProcessedPrompt && conversations !== undefined) {
      // Immediately mark as processed to prevent multiple executions
      setInitialPromptProcessed(true);
      sessionStorage.setItem(promptKey, 'true');

      console.log("Processing initial prompt (once only):", initialPrompt);
      console.log("With title:", conversationTitle || "New Topic Conversation");

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

      // Save the conversation first
      localStorage.setItem('tutorConversations', JSON.stringify(updatedConversations));

      // Then send the message after a short delay
      setTimeout(() => {
        if (initialPrompt) {
          console.log("Now sending initial prompt message");

          // Create a user message
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

          // Now make the API call
          handleSendMessage(initialPrompt);
        }
      }, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, conversationTitle]);

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

  const handleSendMessage = async (message: string) => {
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

    console.log("Sending message:", message);
    const newMessageId = uuidv4();
    const timestamp = new Date();

    // Create a new message
    const newMessage: ChatMessageProps = {
      id: newMessageId,
      content: message,
      role: 'user',
      timestamp
    };

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

      const conversationsWithAiResponse = conversations.map(conv => {
        if (conv.id === currentConversationId) {
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
          return updatedConv;
        }
        return conv;
      });

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

      const conversationsWithError = conversations.map(conv => {
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - darker */}
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

      {/* Main Chat Area - lighter */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pb-20 md:pb-0 bg-gradient-to-r from-archer-darker-teal to-archer-medium-teal">
        {/* Main header with user info and options */}
        <div className="py-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-lg"
             style={{ background: 'linear-gradient(to right, var(--card-background-darker) 0%, var(--archer-medium-teal) 100%)' }}>
          <div className="flex items-center">
            {/* Sidebar toggle buttons - positioned in the main header */}
            <div className="mr-4">
              {/* Desktop toggle */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:block p-2 rounded-full bg-archer-bright-teal/20 hover:bg-archer-bright-teal/30 transition-colors"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-archer-bright-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Mobile toggle */}
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden p-2 rounded-full bg-archer-bright-teal/20 hover:bg-archer-bright-teal/30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-archer-bright-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">
                {activeConversation ? activeConversation.title : 'New Conversation'}
              </h1>
              {activeConversation && (
                <button
                  className="ml-2 p-1 text-archer-bright-teal hover:text-archer-light-blue transition-colors"
                  onClick={() => {
                    // In a real implementation, this would open a modal or inline editor
                    const newTitle = prompt('Edit conversation title:', activeConversation.title);
                    if (newTitle && newTitle.trim() !== '') {
                      const updatedConversations = conversations.map(conv => {
                        if (conv.id === activeConversation.id) {
                          return {
                            ...conv,
                            title: newTitle.trim()
                          };
                        }
                        return conv;
                      });

                      setConversations(updatedConversations);

                      // Save updated conversations
                      saveConversations(updatedConversations);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chat content area with proper scrolling - lighter background */}
        <div className="flex-1 overflow-y-auto pb-4" style={{ background: 'linear-gradient(to right, var(--card-background-lighter) 0%, var(--card-background-dark) 100%)' }}>
          {activeConversation && activeConversation.messages.length > 0 ? (
            <div className="max-w-3xl mx-auto py-8 px-4">
              <div className="space-y-6">
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
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className="min-h-full flex flex-col items-center justify-center text-center p-6 py-10">
              <h1 className="text-4xl font-bold text-white mb-8">
                Hello, {userId ? 'User' : 'Guest'}
              </h1>

              <div className="max-w-2xl mx-auto mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {[
                    {
                      title: "Design an interactive kaleidoscope",
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )
                    },
                    {
                      title: "Write a screenplay for a Chemistry DIY video",
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                      )
                    },
                    {
                      title: "Write a python script to monitor system performance",
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      )
                    }
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion.title)}
                      className="rounded-xl p-5 text-left transition-all shadow-card hover:shadow-card-hover transform hover:-translate-y-1 flex flex-col items-center bg-card-background-dark border-none"
                    >
                      <div className="p-3 rounded-full mb-3 bg-archer-bright-teal">
                        <div className="text-archer-dark-teal">{suggestion.icon}</div>
                      </div>
                      <span className="text-sm font-medium text-white">{suggestion.title}</span>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl p-6 shadow-card hover:shadow-card-hover transform hover:-translate-y-1 transition-all bg-card-background-darker border-none">
                  <div className="flex items-center mb-5">
                    <div className="mr-4 p-3 rounded-full bg-archer-light-blue">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-archer-dark-teal" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white">NCLEX Preparation</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Explain fluid and electrolyte balance",
                      "What are the priority nursing interventions for a patient with heart failure?",
                      "Help me understand delegation principles",
                      "What's the difference between type 1 and type 2 diabetes?"
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(suggestion)}
                        className="rounded-lg p-4 text-left transition-all text-sm text-white shadow-card hover:shadow-card-hover hover:-translate-y-1 bg-card-background-dark"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`py-4 px-6 fixed bottom-0 left-0 right-0 z-50 shadow-lg ${
            isMobileSidebarOpen ? 'w-full' : (
              isSidebarCollapsed ? 'md:w-[calc(100%-4rem)] md:left-16' : 'md:w-[calc(100%-18rem)] md:left-72'
            )
          }`}
          style={{ background: 'linear-gradient(to right, var(--card-background-darker) 0%, var(--archer-medium-teal) 100%)' }}>
          <div className="max-w-3xl mx-auto">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isTyping} />
          </div>
        </div>
      </div>
    </div>
  );
}
