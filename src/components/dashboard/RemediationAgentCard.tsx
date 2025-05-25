'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  ClockIcon,
  XMarkIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface RemediationSuggestion {
  _id: string;
  type: 'REMEDIATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  createdAt: string;
  metadata: {
    remediationType: 'CONCEPT_REVIEW' | 'PRACTICE_QUESTIONS' | 'VIDEO_TUTORIAL' | 'STUDY_TECHNIQUE' | 'AI_TUTOR_SESSION';
    title: string;
    suggestedAction: string;
    aiPrompt: string;
    scheduledTaskId?: string;
    topicName?: string;
    resourceId?: string;
    resourceTitle?: string;
    resourceType?: string;
  };
  relatedTopic?: {
    _id: string;
    name: string;
  };
}

interface RemediationAgentCardProps {
  suggestions: RemediationSuggestion[];
  onResolve: (suggestionId: string) => void;
  onStartTutorSession: (prompt: string, topicId?: string) => void;
  onScheduleReview: (topicId: string) => Promise<void>;
  userId: string;
}

const RemediationAgentCard: React.FC<RemediationAgentCardProps> = ({
  suggestions,
  onResolve,
  onStartTutorSession,
  onScheduleReview,
  userId
}) => {
  const router = useRouter();
  const [isScheduling, setIsScheduling] = useState<Record<string, boolean>>({});

  // Get icon for remediation type
  const getRemediationIcon = (type: string) => {
    switch (type) {
      case 'CONCEPT_REVIEW':
        return <BookOpenIcon className="h-5 w-5" />;
      case 'PRACTICE_QUESTIONS':
        return <AcademicCapIcon className="h-5 w-5" />;
      case 'VIDEO_TUTORIAL':
        return <VideoCameraIcon className="h-5 w-5" />;
      case 'STUDY_TECHNIQUE':
        return <LightBulbIcon className="h-5 w-5" />;
      case 'AI_TUTOR_SESSION':
        return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
      default:
        return <LightBulbIcon className="h-5 w-5" />;
    }
  };

  // Get color for severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-600 border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-600 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-600 border-blue-300';
    }
  };

  // Get icon color for severity
  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-600';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  // Handle scheduling a review session
  const handleScheduleReview = async (topicId: string, suggestionId: string) => {
    if (!topicId) return;

    setIsScheduling(prev => ({ ...prev, [suggestionId]: true }));

    try {
      await onScheduleReview(topicId);

      // Force refresh of suggestions to update UI
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error scheduling review:', error);
    } finally {
      setIsScheduling(prev => ({ ...prev, [suggestionId]: false }));
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold text-archer-dark-text">Remediation Suggestions</h2>
        <button
          onClick={() => router.push('/remediation')}
          className="inline-flex items-center px-4 py-2 bg-archer-bright-teal text-white rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 text-sm"
        >
          View All
        </button>
      </div>
      <div className="space-y-4">
        {suggestions.slice(0, 2).map((suggestion) => (
          <div
            key={suggestion._id}
            className={`p-5 rounded-lg shadow-card hover:shadow-card-hover transition-all bg-card-background-light border border-border-color-light ${suggestion.severity === 'HIGH' ? 'border-l-4 border-red-400' : suggestion.severity === 'MEDIUM' ? 'border-l-4 border-yellow-400' : 'border-l-4 border-blue-400'}`}
          >
            <div className="flex items-start">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shadow-button ${getSeverityIconColor(suggestion.severity)}`}>
                {getRemediationIcon(suggestion.metadata.remediationType)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium text-archer-dark-text text-lg">{suggestion.metadata.title}</h3>
                  <button
                    onClick={() => onResolve(suggestion._id)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shadow-button hover:bg-gray-300 transition-all"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-archer-dark-text/80 bg-light-bg-secondary p-3 rounded-lg">{suggestion.message}</p>
                <p className="mt-3 text-sm font-medium text-archer-bright-teal">Suggested Action:</p>
                <p className="mt-1 text-sm text-archer-dark-text/80">{suggestion.metadata.suggestedAction}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {suggestion.metadata.remediationType === 'AI_TUTOR_SESSION' && (
                    <button
                      onClick={() => onStartTutorSession(
                        suggestion.metadata.aiPrompt,
                        suggestion.relatedTopic?._id
                      )}
                      className="inline-flex items-center px-4 py-2 bg-archer-light-blue text-white rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 text-sm"
                    >
                      Chat with AI Tutor <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </button>
                  )}
                  {suggestion.metadata.remediationType === 'CONCEPT_REVIEW' && (
                    <>
                      <button
                        onClick={() => router.push(`/topics/${suggestion.relatedTopic?._id}`)}
                        className="inline-flex items-center px-4 py-2 bg-archer-bright-teal text-white rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 text-sm"
                      >
                        Review Topic <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </button>
                      {!suggestion.metadata.scheduledTaskId && (
                        <button
                          onClick={() => handleScheduleReview(suggestion.relatedTopic?._id || '', suggestion._id)}
                          disabled={isScheduling[suggestion._id]}
                          className="inline-flex items-center px-4 py-2 bg-light-bg-secondary text-archer-dark-text rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 text-sm disabled:opacity-50"
                        >
                          {isScheduling[suggestion._id] ? (
                            <>
                              <span className="animate-spin mr-2 h-5 w-5 border-t-2 border-archer-dark-text border-r-2 rounded-full"></span>
                              Scheduling...
                            </>
                          ) : (
                            <>
                              Schedule Review <CalendarIcon className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </button>
                      )}
                      {suggestion.metadata.scheduledTaskId && (
                        <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-600 rounded-lg font-medium shadow-button text-sm">
                          <CheckCircleIcon className="mr-2 h-5 w-5" />
                          Review Scheduled
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {suggestions.length > 2 && (
          <div className="text-center pt-3">
            <button
              onClick={() => router.push('/remediation')}
              className="inline-flex items-center px-4 py-2 bg-archer-light-blue text-white rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 text-sm"
            >
              View {suggestions.length - 2} more suggestions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemediationAgentCard;
