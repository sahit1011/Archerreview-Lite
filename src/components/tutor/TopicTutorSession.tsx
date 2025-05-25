"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

interface TopicTutorSessionProps {
  userId: string;
  topicId: string;
  initialPrompt?: string;
  onBack?: () => void;
  onComplete?: (sessionData: any) => void;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

interface TopicData {
  _id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
}

interface PerformanceData {
  averageScore: number;
  confidenceLevel: number;
  completedTasks: number;
  lastActivity: Date | null;
  weakAreas: string[];
}

const TopicTutorSession: React.FC<TopicTutorSessionProps> = ({
  userId,
  topicId,
  initialPrompt,
  onBack,
  onComplete
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [relatedContent, setRelatedContent] = useState<any[]>([]);
  const [sessionStartTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch topic data and performance data
  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setIsLoading(true);

        // Fetch topic data
        const topicResponse = await fetch(`/api/topics/${topicId}`);
        if (!topicResponse.ok) {
          throw new Error('Failed to fetch topic data');
        }
        const topicData = await topicResponse.json();
        setTopic(topicData.topic);
        setRelatedContent(topicData.content || []);

        // Fetch performance data for this topic
        const performanceResponse = await fetch(`/api/performance/topic/${topicId}?userId=${userId}`);
        if (!performanceResponse.ok) {
          // This might be the first time the user is studying this topic
          setPerformance({
            averageScore: 0,
            confidenceLevel: 0,
            completedTasks: 0,
            lastActivity: null,
            weakAreas: []
          });
        } else {
          const performanceData = await performanceResponse.json();
          setPerformance(performanceData.performance);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching topic data:', err);
        setError('Failed to load topic data. Please try again.');
        setIsLoading(false);
      }
    };

    fetchTopicData();
  }, [topicId, userId]);

  // Add system message when topic data is loaded
  useEffect(() => {
    if (topic && !messages.length) {
      // Add a system message with topic information
      const systemMessage: Message = {
        id: uuidv4(),
        content: `Welcome to your focused study session on ${topic.name}. I'll help you understand this topic better. What specific aspect would you like to explore?`,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages([systemMessage]);

      // If there's an initial prompt, send it after a short delay
      if (initialPrompt) {
        const timer = setTimeout(() => {
          handleSendMessage(initialPrompt);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [topic, initialPrompt, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !topic) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Prepare the history in the format expected by the API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call the API with topic context
      const response = await fetch('/api/tutor/topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
          topicId,
          history,
          performance: performance || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI Tutor');
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        id: uuidv4(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle completing the session
  const handleCompleteSession = async () => {
    // Calculate session duration in minutes
    const sessionEndTime = new Date();
    const durationMinutes = Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60));

    // Create session data
    const sessionData = {
      userId,
      topicId,
      duration: durationMinutes,
      messageCount: messages.filter(m => m.role === 'user').length,
      completed: true,
      timestamp: sessionEndTime
    };

    try {
      // Save session data
      const response = await fetch('/api/tutor/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to save session data');
      }

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(sessionData);
      }

      // Navigate back or to dashboard
      if (onBack) {
        onBack();
      } else {
        router.push(userId ? `/dashboard?userId=${userId}` : '/dashboard');
      }
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  };

  // Handle scheduling a review session
  const handleScheduleReview = async () => {
    try {
      // Call the API to schedule a review session
      const response = await fetch('/api/tasks/schedule-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          topicId,
          source: 'AI_TUTOR'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule review session');
      }

      const data = await response.json();

      // Add system message about scheduled review
      const systemMessage: Message = {
        id: uuidv4(),
        content: `I've scheduled a review session for you on ${new Date(data.task.startTime).toLocaleDateString()} at ${new Date(data.task.startTime).toLocaleTimeString()}. You'll receive a reminder when it's time.`,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('Error scheduling review session:', error);

      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'Sorry, I encountered an error scheduling your review session. Please try again later.',
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-500 mb-4">
          {error || 'Topic not found'}
        </div>
        <button
          onClick={() => router.push(userId ? `/dashboard?userId=${userId}` : '/dashboard')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack || (() => router.push(userId ? `/dashboard?userId=${userId}` : '/dashboard'))}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{topic.name}</h1>
            <p className="text-sm text-gray-500">{topic.category}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleScheduleReview}
            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200"
          >
            Schedule Review
          </button>
          <button
            onClick={handleCompleteSession}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Complete Session
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto">
              {messages.map((message) => (
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

          {/* Input area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-3xl mx-auto">
              <ChatInput onSendMessage={handleSendMessage} isLoading={isTyping} />
            </div>
          </div>
        </div>

        {/* Sidebar with topic info and resources */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto hidden md:block">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Topic Information</h2>

            {/* Performance stats */}
            {performance && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Your Performance</h3>
                <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="font-medium">{performance.averageScore ? `${performance.averageScore}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <span className="font-medium">{performance.confidenceLevel ? `${performance.confidenceLevel}/5` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed Tasks</span>
                    <span className="font-medium">{performance.completedTasks}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Related content */}
            {relatedContent.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Related Resources</h3>
                <div className="space-y-2">
                  {relatedContent.map((content) => (
                    <div key={content._id} className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {content.type === 'READING' && <BookOpenIcon className="h-4 w-4 text-blue-500" />}
                          {content.type === 'QUIZ' && <AcademicCapIcon className="h-4 w-4 text-green-500" />}
                          {content.type === 'VIDEO' && <ClockIcon className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="ml-2">
                          <h4 className="text-sm font-medium">{content.title}</h4>
                          <p className="text-xs text-gray-500">{content.duration} min • {content.difficulty}</p>
                          <button
                            onClick={() => router.push(`/content/${content._id}`)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                          >
                            View Resource
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicTutorSession;
