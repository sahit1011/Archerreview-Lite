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
import { fadeIn, fadeInUp, staggerContainer, hoverScale } from '@/utils/animationUtils';
import AnimatedCard from '@/components/common/AnimatedCard';

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
      case 'MEDIUM': return 'bg-blue-100 text-blue-600';
      case 'LOW': return 'bg-teal-100 text-teal-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getFocusAreaBgColor = (type: string) => {
    switch (type) {
      case 'weak': return 'bg-red-100 text-red-600';
      case 'strong': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
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
    <AnimatedCard className="p-8 mb-6" gradient>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div
          className="flex justify-between items-center mb-6"
          variants={fadeIn}
        >
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Learning Focus & Remediation
          </h2>
          <motion.button
            onClick={activeTab === 'focus' ? onRefreshFocusAreas : onGenerateRemediationSuggestions}
            disabled={activeTab === 'focus' ? isRefreshingFocusAreas : isGeneratingSuggestions}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={hoverScale}
            whileTap={{ scale: 0.95 }}
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
          </motion.button>
        </motion.div>

        <motion.div
          className="flex border-b border-gray-200/50 mb-6"
          variants={fadeIn}
        >
          <motion.button
            onClick={() => setActiveTab('focus')}
            className={`py-3 px-6 text-sm font-semibold transition-all ${
              activeTab === 'focus'
                ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            } rounded-t-lg`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Focus Areas
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('remediation')}
            className={`py-3 px-6 text-sm font-semibold transition-all ${
              activeTab === 'remediation'
                ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            } rounded-t-lg`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Remediation Suggestions {remediationSuggestions.length > 0 && (
              <motion.span
                className="ml-2 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {remediationSuggestions.length}
              </motion.span>
            )}
          </motion.button>
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
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </motion.div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No focus areas yet</h3>
                <p className="text-gray-600 mb-6">
                  Complete some tasks to get personalized focus area recommendations.
                </p>
                <motion.button
                  onClick={onRefreshFocusAreas}
                  disabled={isRefreshingFocusAreas}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={hoverScale}
                  whileTap={{ scale: 0.95 }}
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
                </motion.button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {focusAreas.map((area, index) => (
                  <motion.div
                    key={index}
                    className={`
                      bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg
                      hover:shadow-xl transition-all transform hover:-translate-y-2
                      ${area.type === 'weak' ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}
                    `}
                    variants={fadeInUp}
                    transition={{ delay: index * 0.1 }}
                    whileHover={hoverScale}
                  >
                    <div className="flex items-center mb-4">
                      <motion.div
                        className={`h-12 w-12 rounded-xl ${getFocusAreaBgColor(area.type)} flex items-center justify-center mr-4 shadow-sm`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          {area.type === 'weak' ? (
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          )}
                        </svg>
                      </motion.div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        {area.name || (area.category && area.category.replace(/_/g, ' ').toLowerCase())}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-6 bg-white/50 p-4 rounded-lg border border-white/20">
                      {area.message}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {area._id && (
                        <>
                          {scheduledFocusAreas[area._id] ? (
                            <motion.div
                              className="inline-flex items-center px-4 py-2 bg-green-100 text-green-600 text-sm rounded-lg font-medium"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <CheckCircleIcon className="mr-2 h-5 w-5" />
                              Review Scheduled: {formatScheduledTime(scheduledFocusAreas[area._id]!.startTime, scheduledFocusAreas[area._id]!.endTime)}
                            </motion.div>
                          ) : (
                            <motion.button
                              onClick={() => {
                                if (area._id) {
                                  handleScheduleReview(area._id, 'focus-' + index);
                                }
                              }}
                              disabled={isScheduling['focus-' + index] || !area._id}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white text-sm rounded-lg font-medium shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50"
                              whileHover={hoverScale}
                              whileTap={{ scale: 0.95 }}
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
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => onStartTutorSession(
                              `I need help understanding ${area.name || area.category}. Can you explain the key concepts and provide some practice questions?`,
                              area.name || area.category
                            )}
                            className="inline-flex items-center px-4 py-2 bg-white/70 text-gray-800 text-sm rounded-lg font-medium shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 border border-white/20"
                            whileHover={hoverScale}
                            whileTap={{ scale: 0.95 }}
                          >
                            Chat with AI Tutor <ChatBubbleLeftRightIcon className="ml-2 h-5 w-5" />
                          </motion.button>
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
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <LightBulbIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No active remediation suggestions</h3>
                <p className="text-gray-600">
                  Click "Get Suggestions" to get personalized recommendations.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {remediationSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion._id}
                    className={`
                      bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg
                      hover:shadow-xl transition-all transform hover:-translate-y-2
                      ${suggestion.severity === 'HIGH' ? 'border-l-4 border-red-500' :
                        suggestion.severity === 'MEDIUM' ? 'border-l-4 border-blue-500' :
                        'border-l-4 border-teal-500'}
                    `}
                    variants={fadeInUp}
                    transition={{ delay: index * 0.1 }}
                    whileHover={hoverScale}
                  >
                    <div className="flex items-start">
                      <motion.div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm ${getSeverityIconColor(suggestion.severity)}`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {getRemediationIcon(suggestion.metadata.remediationType)}
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-gray-800 text-lg">{suggestion.metadata.title}</h3>
                          <motion.button
                            onClick={() => onResolve(suggestion._id)}
                            className="text-gray-400 hover:text-gray-600 bg-white/50 p-2 rounded-full hover:bg-white/70 transition-all"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </motion.button>
                        </div>
                        <p className="text-sm text-gray-700 mb-4 bg-white/50 p-4 rounded-lg border border-white/20">
                          {suggestion.message}
                        </p>
                        <div className="mb-6 p-4 rounded-lg bg-indigo-50/50 border border-indigo-200/50">
                          <p className="text-sm font-semibold text-indigo-600 mb-2">Suggested Action:</p>
                          <p className="text-sm text-gray-700">{suggestion.metadata.suggestedAction}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {suggestion.metadata.remediationType === 'AI_TUTOR_SESSION' && (
                            <motion.button
                              onClick={() => onStartTutorSession(
                                suggestion.metadata.aiPrompt,
                                suggestion.relatedTopic?.name || suggestion.metadata.title
                              )}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white text-sm rounded-lg font-medium shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1"
                              whileHover={hoverScale}
                              whileTap={{ scale: 0.95 }}
                            >
                              Chat with AI Tutor <ChatBubbleLeftRightIcon className="ml-2 h-5 w-5" />
                            </motion.button>
                          )}
                          {suggestion.metadata.remediationType === 'CONCEPT_REVIEW' && (
                            <>
                              <motion.button
                                onClick={() => onStartTutorSession(
                                  `I need help reviewing the topic ${suggestion.relatedTopic?.name || suggestion.metadata.title}. Can you explain the key concepts and provide some practice questions?`,
                                  suggestion.relatedTopic?.name || suggestion.metadata.title
                                )}
                                className="inline-flex items-center px-4 py-2 bg-white/70 text-gray-800 text-sm rounded-lg font-medium shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 border border-white/20"
                                whileHover={hoverScale}
                                whileTap={{ scale: 0.95 }}
                              >
                                Review Topic <ArrowRightIcon className="ml-2 h-5 w-5" />
                              </motion.button>
                              {!suggestion.metadata.scheduledTaskId && suggestion.relatedTopic && suggestion.relatedTopic._id && (
                                <motion.button
                                  onClick={() => {
                                    if (suggestion.relatedTopic && suggestion.relatedTopic._id) {
                                      handleScheduleReview(suggestion.relatedTopic._id, suggestion._id);
                                    }
                                  }}
                                  disabled={isScheduling[suggestion._id]}
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white text-sm rounded-lg font-medium shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50"
                                  whileHover={hoverScale}
                                  whileTap={{ scale: 0.95 }}
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
                                </motion.button>
                              )}
                              {suggestion.metadata.scheduledTaskId && (
                                <motion.div
                                  className="inline-flex items-center px-4 py-2 bg-green-100 text-green-600 text-sm rounded-lg font-medium"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500 }}
                                >
                                  <CheckCircleIcon className="mr-2 h-5 w-5" />
                                  Review Scheduled
                                </motion.div>
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
    </AnimatedCard>
  );
};

export default CombinedFocusRemediationCard;