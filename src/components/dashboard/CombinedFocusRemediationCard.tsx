'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { fadeIn, fadeInUp, staggerContainer } from '@/utils/animationUtils';

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
  const [scheduledFocusAreas, setScheduledFocusAreas] = useState<Record<string, {startTime: Date, endTime: Date} | null>>({});

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

  // Severity conveyed with tokens + a text label (no rainbow):
  // HIGH → destructive, LOW → muted/neutral, MEDIUM → primary accent.
  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'border-l-2 border-l-destructive';
      case 'MEDIUM': return 'border-l-2 border-l-primary';
      case 'LOW': return 'border-l-2 border-l-border';
      default: return '';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'High priority';
      case 'MEDIUM': return 'Medium priority';
      case 'LOW': return 'Low priority';
      default: return '';
    }
  };

  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-destructive/10 text-destructive';
      case 'MEDIUM': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getFocusAreaBgColor = (type: string) => {
    switch (type) {
      case 'weak': return 'bg-destructive/10 text-destructive';
      case 'strong': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatScheduledTime = (startTime: Date, endTime: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Calcutta'
    };

    const start = startTime.toLocaleString('en-US', options);
    const end = endTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Calcutta'
    });

    return `${start} - ${end}`;
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
            const scheduledMap: Record<string, {startTime: Date, endTime: Date} | null> = {};
            data.tasks.forEach((task: any) => {
              if (task.topic && task.topic._id) {
                scheduledMap[task.topic._id] = {
                  startTime: new Date(task.startTime),
                  endTime: new Date(task.endTime)
                };
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
      // The useEffect will update the scheduledFocusAreas after fetching
      // Consider removing reload or making it conditional for better UX
      // setTimeout(() => { window.location.reload(); }, 1000);
    } catch (error) {
      console.error('Error scheduling review:', error);
    } finally {
      setIsScheduling(prev => ({ ...prev, [suggestionId]: false }));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-8 mb-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div
          className="flex justify-between items-center mb-6"
          variants={fadeIn}
        >
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <svg className="w-6 h-6 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Learning Focus & Remediation
          </h2>
          <button
            onClick={activeTab === 'focus' ? onRefreshFocusAreas : onGenerateRemediationSuggestions}
            disabled={activeTab === 'focus' ? isRefreshingFocusAreas : isGeneratingSuggestions}
            className="press px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeTab === 'focus' ? (
              isRefreshingFocusAreas ? (
                <>
                  <motion.span
                    className="inline-block mr-2 h-4 w-4 border-t-2 border-white border-r-2 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Refreshing...
                </>
              ) : (
                'Refresh Focus Areas'
              )
            ) : (
              isGeneratingSuggestions ? (
                <>
                  <motion.span
                    className="inline-block mr-2 h-4 w-4 border-t-2 border-white border-r-2 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Generating...
                </>
              ) : (
                'Get Suggestions'
              )
            )}
          </button>
        </motion.div>

        <motion.div
          className="flex border-b border-border mb-6"
          variants={fadeIn}
        >
          <button
            onClick={() => setActiveTab('focus')}
            className={`py-3 px-6 text-sm font-semibold transition-colors ${
              activeTab === 'focus'
                ? 'text-primary border-b-2 border-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            } rounded-t-lg`}
          >
            Focus Areas
          </button>
          <button
            onClick={() => setActiveTab('remediation')}
            className={`py-3 px-6 text-sm font-semibold transition-colors ${
              activeTab === 'remediation'
                ? 'text-primary border-b-2 border-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            } rounded-t-lg`}
          >
            Remediation Suggestions {remediationSuggestions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                {remediationSuggestions.length}
              </span>
            )}
          </button>
        </motion.div>

        {activeTab === 'focus' && (
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {!focusAreas || focusAreas.length === 0 ? (
              <motion.div
                className="text-center py-12"
                variants={fadeIn}
              >
                <svg className="mx-auto h-16 w-16 text-muted-foreground mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-xl font-bold text-foreground mb-2">No focus areas yet</h3>
                <p className="text-muted-foreground mb-6">
                  Complete some tasks to get personalized focus area recommendations.
                </p>
                <button
                  onClick={onRefreshFocusAreas}
                  disabled={isRefreshingFocusAreas}
                  className="press px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRefreshingFocusAreas ? (
                    <>
                      <motion.span
                        className="inline-block mr-2 h-4 w-4 border-t-2 border-white border-r-2 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Refreshing...
                    </>
                  ) : 'Refresh Focus Areas'}
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {focusAreas.map((area, index) => (
                  <motion.div
                    key={index}
                    className={`
                      bg-secondary rounded-xl p-6 border border-border
                      transition-colors hover:bg-muted hover:border-primary/30 hover:-translate-y-0.5
                      ${area.type === 'weak' ? 'border-l-2 border-l-destructive' : 'border-l-2 border-l-success'}
                    `}
                    variants={fadeInUp}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center mb-4">
                      <div
                        className={`h-12 w-12 rounded-xl ${getFocusAreaBgColor(area.type)} flex items-center justify-center mr-4`}
                      >
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          {area.type === 'weak' ? (
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          )}
                        </svg>
                      </div>
                      <h3 className="font-bold text-foreground text-lg">
                        {area.name || (area.category && area.category.replace(/_/g, ' ').toLowerCase())}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6 bg-card p-4 rounded-lg border border-border">
                      {area.message}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {area._id && (
                        <>
                          {scheduledFocusAreas[area._id] ? (
                            <div className="inline-flex items-center px-4 py-2 bg-success/10 text-success border border-success/30 text-sm rounded-lg font-medium">
                              <CheckCircleIcon className="mr-2 h-5 w-5" />
                              Review Scheduled: {formatScheduledTime(scheduledFocusAreas[area._id]!.startTime, scheduledFocusAreas[area._id]!.endTime)}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (area._id) {
                                  handleScheduleReview(area._id, 'focus-' + index);
                                }
                              }}
                              disabled={isScheduling['focus-' + index] || !area._id}
                              className="press inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg font-semibold hover:brightness-110 transition-colors disabled:opacity-50"
                            >
                              {isScheduling['focus-' + index] ? (
                                <>
                                  <motion.span
                                    className="mr-2 h-4 w-4 border-t-2 border-white border-r-2 rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  />
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
                            className="press inline-flex items-center px-4 py-2 border border-border text-foreground text-sm rounded-lg font-medium hover:bg-muted transition-colors"
                          >
                            Chat with AI Tutor <ChatBubbleLeftRightIcon className="ml-2 h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'remediation' && (
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {remediationSuggestions.length === 0 ? (
              <motion.div
                className="text-center py-12"
                variants={fadeIn}
              >
                <LightBulbIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No active remediation suggestions</h3>
                <p className="text-muted-foreground">
                  Click "Get Suggestions" to get personalized recommendations.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {remediationSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion._id}
                    className={`
                      bg-secondary rounded-xl p-6 border border-border
                      transition-colors hover:bg-muted hover:border-primary/30 hover:-translate-y-0.5
                      ${getSeverityBorder(suggestion.severity)}
                    `}
                    variants={fadeInUp}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${getSeverityIconColor(suggestion.severity)}`}
                      >
                        {getRemediationIcon(suggestion.metadata.remediationType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="font-bold text-foreground text-lg">{suggestion.metadata.title}</h3>
                            {getSeverityLabel(suggestion.severity) && (
                              <span className="text-xs font-medium text-muted-foreground">{getSeverityLabel(suggestion.severity)}</span>
                            )}
                          </div>
                          <button
                            onClick={() => onResolve(suggestion._id)}
                            className="press text-muted-foreground hover:text-foreground bg-muted p-2 rounded-full hover:bg-secondary transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 bg-card p-4 rounded-lg border border-border">
                          {suggestion.message}
                        </p>
                        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
                          <p className="text-sm font-semibold text-primary mb-2">Suggested Action:</p>
                          <p className="text-sm text-muted-foreground">{suggestion.metadata.suggestedAction}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {suggestion.metadata.remediationType === 'AI_TUTOR_SESSION' && (
                            <button
                              onClick={() => onStartTutorSession(
                                suggestion.metadata.aiPrompt,
                                suggestion.relatedTopic?.name || suggestion.metadata.title
                              )}
                              className="press inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg font-semibold hover:brightness-110 transition-colors"
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
                                className="press inline-flex items-center px-4 py-2 border border-border text-foreground text-sm rounded-lg font-medium hover:bg-muted transition-colors"
                              >
                                Review Topic <ArrowRightIcon className="ml-2 h-5 w-5" />
                              </button>
                              {!suggestion.metadata.scheduledTaskId && suggestion.relatedTopic && suggestion.relatedTopic._id && (
                                <button
                                  onClick={() => {
                                    if (suggestion.relatedTopic && suggestion.relatedTopic._id) {
                                      handleScheduleReview(suggestion.relatedTopic._id, suggestion._id);
                                    }
                                  }}
                                  disabled={isScheduling[suggestion._id]}
                                  className="press inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg font-semibold hover:brightness-110 transition-colors disabled:opacity-50"
                                >
                                  {isScheduling[suggestion._id] ? (
                                    <>
                                      <motion.span
                                        className="mr-2 h-4 w-4 border-t-2 border-white border-r-2 rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      />
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
                                <div className="inline-flex items-center px-4 py-2 bg-success/10 text-success border border-success/30 text-sm rounded-lg font-medium">
                                  <CheckCircleIcon className="mr-2 h-5 w-5" />
                                  Review Scheduled
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CombinedFocusRemediationCard;