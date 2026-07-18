"use client";

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SparklesIcon } from '@heroicons/react/24/outline';
import ChatMessage, { ChatMessageProps } from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import ChatSidebar from './ChatSidebar';
import { useUser } from '@/context/UserContext';
import { NotebookPen, ArrowUpRight, BookOpen, ListChecks, Target, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

// Quick study-action chips shown on the empty state — each prefills + sends the composer.
const STUDY_ACTIONS = [
  { label: 'Explain a concept', prompt: "Explain Newton's laws of motion with examples", Icon: BookOpen },
  { label: 'Quiz me', prompt: 'Quiz me on Organic Chemistry — 5 questions, one at a time', Icon: ListChecks },
  { label: 'My weak areas', prompt: 'What are my likely weak areas and how do I fix them?', Icon: Target },
  { label: 'Plan my week', prompt: 'Help me plan my study week around my target exam date', Icon: CalendarDays },
] as const;

// Exam-specific empty-state content so a JEE student never sees Biology chips (and vice versa).
const EXAM_TUTOR_COPY = {
  NEET: {
    intro:
      "I'm your AI NEET tutor. Ask me anything about Physics, Chemistry, or Biology — concepts, practice problems, or study strategies.",
    suggestions: [
      "Explain Newton's laws of motion",
      'How do I balance chemical equations?',
      "What's the difference between mitosis and meiosis?",
      'What are the key concepts of human physiology for NEET?',
      'Explain the mechanism of photosynthesis',
      'How do I remember inorganic chemistry reactions?',
    ],
  },
  JEE: {
    intro:
      "I'm your AI JEE tutor. Ask me anything about Physics, Chemistry, or Mathematics — concepts, practice problems, or study strategies.",
    suggestions: [
      "Explain Newton's laws of motion",
      'How do I balance chemical equations?',
      'Help me solve integration problems',
      'How do I solve projectile motion problems?',
      'What are common mistakes in coordinate geometry?',
      'Explain rotational dynamics with an example',
    ],
  },
  DEFAULT: {
    intro:
      "I'm your AI NEET/JEE tutor. Ask me anything about Physics, Chemistry, Biology, or Mathematics — concepts, practice problems, or study strategies.",
    suggestions: [
      "Explain Newton's laws of motion",
      'How do I balance chemical equations?',
      'Help me solve integration problems',
      "What's the difference between mitosis and meiosis?",
      'How do I solve projectile motion problems?',
      'What are common mistakes in coordinate geometry?',
    ],
  },
} as const;

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
  const { user: authUser } = useUser();
  const examCopy =
    authUser?.examType === 'JEE'
      ? EXAM_TUTOR_COPY.JEE
      : authUser?.examType === 'NEET'
        ? EXAM_TUTOR_COPY.NEET
        : EXAM_TUTOR_COPY.DEFAULT;
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

  // "Save key points to My Notes": distill this conversation into revision bullets.
  const [isSavingNote, setIsSavingNote] = useState(false);
  const handleSaveToNotes = async () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;
    setIsSavingNote(true);
    try {
      const res = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          title: activeConversation.title !== 'New Conversation' ? `${activeConversation.title} — notes` : undefined,
          messages: activeConversation.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Saved to My Notes', {
          description: 'Key points from this session are in your notebook.',
          action: { label: 'Open notes', onClick: () => (window.location.href = '/notes') },
        });
      } else {
        toast.error(data.message || 'Could not save notes.');
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Could not save notes right now.');
    } finally {
      setIsSavingNote(false);
    }
  };



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
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <div className="min-h-full">
              {activeConversation && activeConversation.messages.length > 0 ? (
                <div className="max-w-3xl mx-auto py-8 px-4 pb-24">
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
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6">
                  <div className="mx-auto w-full max-w-2xl text-center">
                    <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-primary/30 bg-primary/12">
                      <SparklesIcon className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {authUser?.examType ? `${authUser.examType} AI Tutor` : 'AI Tutor'}
                    </p>
                    <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                      Hello,{' '}
                      <span className="gradient-text">
                        {authUser?.name?.split(' ')[0] || (userId ? 'Aspirant' : 'Guest')}
                      </span>
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{examCopy.intro}</p>

                    {/* Study-action chips — quick starts that prefill + send the composer */}
                    <div className="mt-7 flex flex-wrap justify-center gap-2">
                      {STUDY_ACTIONS.map(({ label, prompt, Icon }) => (
                        <button
                          key={label}
                          onClick={() => handleSendMessage(prompt)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                        >
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Exam-specific starters — a hairline-framed suggestion ledger */}
                    <div className="mx-auto mt-6 max-w-xl overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm">
                      <div className="border-b border-border px-4 py-2">
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Try asking
                        </span>
                      </div>
                      <div className="divide-y divide-border/60">
                        {examCopy.suggestions.slice(0, 4).map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => handleSendMessage(suggestion)}
                            className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-accent"
                          >
                            <span>{suggestion}</span>
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Input Area at Bottom */}
        <div className="flex-shrink-0 border-t border-border bg-background/80 backdrop-blur-md">
          <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6">
            {activeConversation && activeConversation.messages.length >= 2 && (
              <div className="mb-2.5 flex justify-end">
                <button
                  onClick={handleSaveToNotes}
                  disabled={isSavingNote}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  <NotebookPen className="h-3.5 w-3.5" />
                  {isSavingNote ? 'Saving…' : 'Save key points to My Notes'}
                </button>
              </div>
            )}
            <ChatInput onSendMessage={handleSendMessage} isLoading={isTyping} />
          </div>
        </div>
      </div>
    </div>
  );
}
