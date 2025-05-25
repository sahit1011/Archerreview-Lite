'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  CalendarIcon,
  XMarkIcon,
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

interface FocusArea {
  _id?: string;
  name?: string;
  category?: string;
  type: 'weak' | 'strong';
  message: string;
}

interface CombinedFocusRemediationCardProps {
  focusAreas: FocusArea[];
  remediationSuggestions: RemediationSuggestion[];
  onRefreshFocusAreas: () => Promise<void>;
  onGenerateRemediationSuggestions: () => Promise<void>;
  onResolve: (suggestionId: string) => void;
  onStartTutorSession: (prompt: string, topicName?: string) => void;
  onScheduleReview: (topicId: string) => Promise<void>;
  userId: string;
  isRefreshingFocusAreas?: boolean;
  isGeneratingSuggestions?: boolean;
}

const CombinedFocusRemediationCard: React.FC<CombinedFocusRemediationCardProps> = ({
  focusAreas,
  remediationSuggestions,
  onRefreshFocusAreas,
  onGenerateRemediationSuggestions,
  onResolve,
  onStartTutorSession,
  onScheduleReview,
  userId,
  isRefreshingFocusAreas = false,
  isGeneratingSuggestions = false
}) => {
  const router = useRouter();
  const [isScheduling, setIsScheduling] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'focus' | 'remediation'>('focus');
  const [scheduledFocusAreas, setScheduledFocusAreas] = useState<Record<string, boolean>>({});

  const getRemediationIcon = (type: string) => {
    switch (type) {
      case 'CONCEPT_REVIEW': return <BookOpenIcon className="h-5 w-5" />;
      case 'PRACTICE_QUESTIONS': return <AcademicCapIcon className="h-5 w-5" />;
      case 'VIDEO_TUTORIAL': return <VideoCameraIcon className="h-5 w-5" />;
      case 'STUDY_TECHNIQUE': return <LightBulbIcon className="h-5 w-5" />;
      case 'AI_TUTOR_SESSION': return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
      default: return <LightBulbIcon className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'border-red-300 bg-red-50';
      case 'MEDIUM': return 'border-blue-300 bg-blue-50';
      case 'LOW': return 'border-teal-300 bg-teal-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-600';
      case 'MEDIUM': return 'bg-blue-100 text-archer-light-blue';
      case 'LOW': return 'bg-teal-100 text-archer-bright-teal';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getFocusAreaBgColor = (type: string) => {
    switch (type) {
      case 'weak': return 'bg-red-100 text-red-600';
      case 'strong': return 'bg-teal-100 text-archer-bright-teal';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  useEffect(() => {
    console.log('CombinedFocusRemediationCard received focusAreas:', focusAreas);

    const checkExistingScheduledReviews = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`/api/tasks?userId=${userId}&type=REVIEW&isRemediation=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.tasks) {
            const scheduledMap: Record<string, boolean> = {};
            data.tasks.forEach((task: any) => {
              if (task.topic && task.topic._id) {
                scheduledMap[task.topic._id] = true;
              }
            });
            setScheduledFocusAreas(scheduledMap);
          }
        }
      } catch (error) {
        console.error('Error checking existing scheduled reviews:', error);
      }
    };
    checkExistingScheduledReviews();
  }, [userId, focusAreas]);

  const handleScheduleReview = async (topicId: string, suggestionId: string) => {
    if (!topicId) return;
    try {
      setIsScheduling(prev => ({ ...prev, [suggestionId]: true }));
      await onScheduleReview(topicId);
      if (suggestionId.startsWith('focus-')) {
        setScheduledFocusAreas(prev => ({ ...prev, [topicId]: true }));
      }
      // Consider removing reload or making it conditional for better UX
      // setTimeout(() => { window.location.reload(); }, 1000);
    } catch (error) {
      console.error('Error scheduling review:', error);
    } finally {
      setIsScheduling(prev => ({ ...prev, [suggestionId]: false }));
    }
  };

  return (
    <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-archer-dark-text">Learning Focus & Remediation</h2>
        <div className="flex space-x-4">
          <button
            onClick={activeTab === 'focus' ? onRefreshFocusAreas : onGenerateRemediationSuggestions}
            disabled={activeTab === 'focus' ? isRefreshingFocusAreas : isGeneratingSuggestions}
            className="px-4 py-2 bg-archer-bright-teal text-white rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeTab === 'focus' ? (
              isRefreshingFocusAreas ? (
                <>
                  <span className="inline-block animate-spin mr-2 h-4 w-4 border-t-2 border-archer-dark-teal border-r-2 rounded-full"></span>
                  Refreshing...
                </>
              ) : (
                'Refresh Focus Areas'
              )
            ) : (
              isGeneratingSuggestions ? (
                <>
                  <span className="inline-block animate-spin mr-2 h-4 w-4 border-t-2 border-archer-dark-teal border-r-2 rounded-full"></span>
                  Generating...
                </>
              ) : (
                'Get Suggestions'
              )
            )}
          </button>
        </div>
      </div>

      <div className="flex border-b border-border-color-medium mb-4">
        <button
          onClick={() => setActiveTab('focus')}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'focus'
              ? 'text-archer-bright-teal border-b-2 border-archer-bright-teal'
              : 'text-archer-dark-text/70 hover:text-archer-dark-text'
          }`}
        >
          Focus Areas
        </button>
        <button
          onClick={() => setActiveTab('remediation')}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'remediation'
              ? 'text-archer-bright-teal border-b-2 border-archer-bright-teal'
              : 'text-archer-dark-text/70 hover:text-archer-dark-text'
          }`}
        >
          Remediation Suggestions {remediationSuggestions.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-archer-bright-teal text-white rounded-full text-xs">
              {remediationSuggestions.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'focus' && (
        <div className="space-y-4">
          {console.log('Rendering focus areas tab, focusAreas:', focusAreas)}
          {!focusAreas || focusAreas.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-archer-dark-text/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-archer-dark-text">No focus areas yet</h3>
              <p className="mt-1 text-sm text-archer-dark-text/70">
                Complete some tasks to get personalized focus area recommendations.
              </p>
              <button
                onClick={onRefreshFocusAreas}
                disabled={isRefreshingFocusAreas}
                className="mt-4 px-4 py-2 bg-archer-bright-teal text-white rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 text-sm disabled:opacity-70"
              >
                {isRefreshingFocusAreas ? (
                  <>
                    <span className="animate-spin mr-2 inline-block h-4 w-4 border-t-2 border-archer-dark-teal border-r-2 rounded-full"></span>
                    Refreshing...
                  </>
                ) : 'Refresh Focus Areas'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {focusAreas.map((area, index) => (
                <div key={index} className={`bg-card-background-light rounded-lg p-4 hover:bg-light-bg-secondary shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1 border border-border-color-light ${area.type === 'weak' ? 'border-l-4 border-red-400' : 'border-l-4 border-archer-bright-teal'}`}>
                  <div className="flex items-center mb-2">
                    <div className={`h-10 w-10 rounded-full ${getFocusAreaBgColor(area.type)} flex items-center justify-center mr-3 shadow-button`}>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        {area.type === 'weak' ? (
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        )}
                      </svg>
                    </div>
                    <h3 className="font-medium text-archer-dark-text text-lg">{area.name || (area.category && area.category.replace(/_/g, ' ').toLowerCase())}</h3>
                  </div>
                  <p className="text-sm text-archer-dark-text/80 mb-4 bg-light-bg-secondary p-3 rounded-lg">{area.message}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {area._id && (
                      <>
                        {scheduledFocusAreas[area._id] ? (
                          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-600 text-sm rounded-lg shadow-button">
                            <CheckCircleIcon className="mr-2 h-5 w-5" />
                            Review Scheduled
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (area._id) { // Ensure area._id is defined before calling
                                handleScheduleReview(area._id, 'focus-' + index);
                              }
                            }}
                            disabled={isScheduling['focus-' + index] || !area._id}
                            className="inline-flex items-center px-4 py-2 bg-archer-bright-teal text-white text-sm rounded-lg shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 disabled:opacity-50"
                          >
                            {isScheduling['focus-' + index] ? (
                              <>
                                <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-archer-dark-teal border-r-2 rounded-full"></span>
                                Scheduling...
                              </>
                            ) : (
                              <>
                                Schedule Review <CalendarIcon className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => onStartTutorSession(
                            `I need help understanding ${area.name || area.category}. Can you explain the key concepts and provide some practice questions?`,
                            area.name || area.category
                          )}
                          className="inline-flex items-center px-4 py-2 bg-archer-light-blue text-white text-sm rounded-lg shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1"
                        >
                          Chat with AI Tutor <ChatBubbleLeftRightIcon className="ml-2 h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'remediation' && (
        <div className="space-y-4">
          {remediationSuggestions.length === 0 ? (
            <div className="text-center py-8 text-archer-dark-text/70">
              <LightBulbIcon className="h-12 w-12 mx-auto text-archer-dark-text/40 mb-3" />
              <p>No active remediation suggestions.</p>
              <p className="mt-2 text-sm">
                Click "Get Suggestions" to get personalized recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {remediationSuggestions.map((suggestion) => (
                <div
                  key={suggestion._id}
                  className={`p-5 rounded-lg shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1 bg-card-background-light border border-border-color-light ${suggestion.severity === 'HIGH' ? 'border-l-4 border-red-400' : suggestion.severity === 'MEDIUM' ? 'border-l-4 border-archer-light-blue' : 'border-l-4 border-archer-bright-teal'}`}
                >
                  <div className="flex items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${getSeverityIconColor(suggestion.severity)} shadow-button`}>
                      {getRemediationIcon(suggestion.metadata.remediationType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-archer-dark-text text-lg">{suggestion.metadata.title}</h3>
                        <button
                          onClick={() => onResolve(suggestion._id)}
                          className="text-archer-dark-text/50 hover:text-archer-dark-text/70 bg-light-bg-secondary p-1.5 rounded-full hover:bg-light-bg-gradient-end shadow-button"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-archer-dark-text/80 bg-light-bg-secondary p-3 rounded-lg">{suggestion.message}</p>
                      <div className="mt-3 p-3 rounded-lg bg-light-bg-secondary">
                        <p className="text-sm font-medium text-archer-bright-teal">Suggested Action:</p>
                        <p className="text-sm text-archer-dark-text/80 mt-1">{suggestion.metadata.suggestedAction}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {suggestion.metadata.remediationType === 'AI_TUTOR_SESSION' && (
                          <button
                            onClick={() => onStartTutorSession(
                              suggestion.metadata.aiPrompt,
                              suggestion.relatedTopic?.name || suggestion.metadata.title
                            )}
                            className="inline-flex items-center px-4 py-2 bg-archer-bright-teal text-archer-dark-teal text-sm rounded-lg shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1"
                          >
                            Chat with AI Tutor <ChatBubbleLeftRightIcon className="ml-2 h-5 w-5" />
                          </button>
                        )}
                        {suggestion.metadata.remediationType === 'CONCEPT_REVIEW' && (
                          <>
                            <button
                              onClick={() => onStartTutorSession(
                                `I need help reviewing the topic ${suggestion.relatedTopic?.name || suggestion.metadata.title}. Can you explain the key concepts and provide some practice questions?`,
                                suggestion.relatedTopic?.name || suggestion.metadata.title
                              )}
                              className="inline-flex items-center px-4 py-2 bg-archer-light-blue text-white text-sm rounded-lg shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1"
                            >
                              Review Topic <ArrowRightIcon className="ml-2 h-5 w-5" />
                            </button>
                            {!suggestion.metadata.scheduledTaskId && suggestion.relatedTopic && suggestion.relatedTopic._id && (
                              <button
                                onClick={() => {
                                  // This check is redundant due to the JSX conditional but satisfies stricter linting/TS views
                                  if (suggestion.relatedTopic && suggestion.relatedTopic._id) {
                                    handleScheduleReview(suggestion.relatedTopic._id, suggestion._id);
                                  }
                                }}
                                disabled={isScheduling[suggestion._id]}
                                className="inline-flex items-center px-4 py-2 bg-archer-bright-teal text-archer-dark-teal text-sm rounded-lg shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 disabled:opacity-50"
                              >
                                {isScheduling[suggestion._id] ? (
                                  <>
                                    <span className={`animate-spin mr-2 h-4 w-4 border-t-2 border-archer-dark-teal border-r-2 rounded-full`}></span>
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
                              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-600 text-sm rounded-lg shadow-button">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CombinedFocusRemediationCard;
