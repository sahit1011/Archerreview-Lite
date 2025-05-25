import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, LightBulbIcon, ArrowRightIcon, BookOpenIcon, AcademicCapIcon, VideoCameraIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface RemediationPromptProps {
  suggestion: RemediationSuggestion;
  onClose: () => void;
  onResolve: (suggestionId: string) => void;
  onStartTutorSession?: (prompt: string) => void;
}

const RemediationPrompt: React.FC<RemediationPromptProps> = ({
  suggestion,
  onClose,
  onResolve,
  onStartTutorSession
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  // Auto-hide after 10 seconds if not interacted with
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isExpanded) {
        setIsVisible(false);
        setTimeout(() => {
          onClose();
        }, 500); // Wait for animation to complete
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isExpanded, onClose]);

  const handleStartTutorSession = () => {
    if (onStartTutorSession && suggestion.metadata.aiPrompt) {
      onStartTutorSession(suggestion.metadata.aiPrompt);
      onResolve(suggestion._id);
    } else {
      // Get userId from localStorage as fallback
      const userId = localStorage.getItem('userId');

      // Navigate to tutor page with the prompt and userId
      router.push(`/tutor?prompt=${encodeURIComponent(suggestion.metadata.aiPrompt)}${userId ? `&userId=${userId}` : ''}`);
      onResolve(suggestion._id);
    }
  };

  const handleResourceClick = () => {
    if (suggestion.metadata.resourceId) {
      // Navigate to the resource
      const resourceType = suggestion.metadata.resourceType?.toLowerCase();
      if (resourceType === 'quiz') {
        router.push(`/quiz/${suggestion.metadata.resourceId}`);
      } else {
        // For other resource types, navigate to a generic content view
        router.push(`/content/${suggestion.metadata.resourceId}`);
      }
      onResolve(suggestion._id);
    }
  };

  const getRemediationIcon = () => {
    switch (suggestion.metadata.remediationType) {
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

  const getSeverityColor = () => {
    switch (suggestion.severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  const getActionButton = () => {
    switch (suggestion.metadata.remediationType) {
      case 'AI_TUTOR_SESSION':
        return (
          <button
            onClick={handleStartTutorSession}
            className="mt-2 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Chat with AI Tutor <ArrowRightIcon className="ml-1 h-4 w-4" />
          </button>
        );
      case 'CONCEPT_REVIEW':
      case 'PRACTICE_QUESTIONS':
      case 'VIDEO_TUTORIAL':
        if (suggestion.metadata.resourceId) {
          return (
            <button
              onClick={handleResourceClick}
              className="mt-2 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              View Resource <ArrowRightIcon className="ml-1 h-4 w-4" />
            </button>
          );
        }
        return null;
      case 'STUDY_TECHNIQUE':
        return (
          <button
            onClick={handleStartTutorSession}
            className="mt-2 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Learn More <ArrowRightIcon className="ml-1 h-4 w-4" />
          </button>
        );
      default:
        return null;
    }
  };

  console.log('Rendering RemediationPrompt with suggestion:', suggestion);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed bottom-4 right-4 max-w-sm rounded-lg shadow-lg border ${getSeverityColor()} overflow-hidden z-50`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)' }}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getRemediationIcon()}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium">{suggestion.metadata.title}</p>
                <p className="mt-1 text-sm">{suggestion.message}</p>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <p className="text-sm font-medium">Suggested Action:</p>
                    <p className="text-sm">{suggestion.metadata.suggestedAction}</p>
                    {getActionButton()}
                  </motion.div>
                )}

                <div className="mt-2 flex">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-medium mr-3"
                  >
                    {isExpanded ? 'Show Less' : 'Show More'}
                  </button>
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      setTimeout(() => onResolve(suggestion._id), 300);
                    }}
                    className="text-xs font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => onClose(), 300);
                  }}
                  className="inline-flex text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RemediationPrompt;
