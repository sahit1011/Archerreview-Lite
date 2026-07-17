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
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  // Get icon color for severity
  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-500/15 text-red-400';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400';
      default:
        return 'bg-blue-500/15 text-blue-400';
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
    <div className="rounded-xl border border-border bg-card backdrop-blur-sm transition-all p-6 mb-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold text-foreground">Remediation Suggestions</h2>
        <button
          onClick={() => router.push('/remediation')}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:brightness-110 transition-all text-sm"
        >
          View All
        </button>
      </div>
      <div className="space-y-4">
        {suggestions.slice(0, 2).map((suggestion) => (
          <div
            key={suggestion._id}
            className={`p-5 rounded-lg transition-all bg-secondary border border-border ${suggestion.severity === 'HIGH' ? 'border-l-4 border-l-red-400' : suggestion.severity === 'MEDIUM' ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-blue-400'}`}
          >
            <div className="flex items-start">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${getSeverityIconColor(suggestion.severity)}`}>
                {getRemediationIcon(suggestion.metadata.remediationType)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium text-foreground text-lg">{suggestion.metadata.title}</h3>
                  <button
                    onClick={() => onResolve(suggestion._id)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-secondary transition-all"
                  >
                    <XMarkIcon className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground bg-card p-3 rounded-lg">{suggestion.message}</p>
                <p className="mt-3 text-sm font-medium text-primary">Suggested Action:</p>
                <p className="mt-1 text-sm text-muted-foreground">{suggestion.metadata.suggestedAction}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {suggestion.metadata.remediationType === 'AI_TUTOR_SESSION' && (
                    <button
                      onClick={() => onStartTutorSession(
                        suggestion.metadata.aiPrompt,
                        suggestion.relatedTopic?._id
                      )}
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:brightness-110 transition-all text-sm"
                    >
                      Chat with AI Tutor <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </button>
                  )}
                  {suggestion.metadata.remediationType === 'CONCEPT_REVIEW' && (
                    <>
                      <button
                        onClick={() => router.push(`/topics/${suggestion.relatedTopic?._id}`)}
                        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:brightness-110 transition-all text-sm"
                      >
                        Review Topic <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </button>
                      {!suggestion.metadata.scheduledTaskId && (
                        <button
                          onClick={() => handleScheduleReview(suggestion.relatedTopic?._id || '', suggestion._id)}
                          disabled={isScheduling[suggestion._id]}
                          className="inline-flex items-center px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-all text-sm disabled:opacity-50"
                        >
                          {isScheduling[suggestion._id] ? (
                            <>
                              <span className="animate-spin mr-2 h-5 w-5 border-t-2 border-current border-r-2 rounded-full"></span>
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
                        <div className="inline-flex items-center px-4 py-2 bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg font-medium text-sm">
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
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:brightness-110 transition-all text-sm"
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
