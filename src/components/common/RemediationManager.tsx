import React, { useState, useEffect } from 'react';
import RemediationPrompt from './RemediationPrompt';
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

interface RemediationManagerProps {
  suggestions: RemediationSuggestion[];
  onResolve: (suggestionId: string) => Promise<void>;
  onStartTutorSession?: (prompt: string) => void;
}

const RemediationManager: React.FC<RemediationManagerProps> = ({
  suggestions,
  onResolve,
  onStartTutorSession
}) => {
  const [activeSuggestions, setActiveSuggestions] = useState<RemediationSuggestion[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const router = useRouter();

  // Initialize with the first suggestion
  useEffect(() => {
    console.log('RemediationManager received suggestions:', suggestions);

    if (suggestions.length > 0) {
      // Sort suggestions by severity (HIGH first)
      const sortedSuggestions = [...suggestions].sort((a, b) => {
        const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      console.log('Sorted suggestions:', sortedSuggestions);
      setActiveSuggestions(sortedSuggestions);
      setCurrentSuggestionIndex(0);
    } else {
      console.log('No suggestions available');
      setActiveSuggestions([]);
    }
  }, [suggestions]);

  const handleClose = () => {
    // Move to the next suggestion if available
    if (currentSuggestionIndex < activeSuggestions.length - 1) {
      setCurrentSuggestionIndex(currentSuggestionIndex + 1);
    } else {
      // No more suggestions to show
      setCurrentSuggestionIndex(-1);
    }
  };

  const handleResolve = async (suggestionId: string) => {
    // Call the onResolve callback
    await onResolve(suggestionId);

    // Remove the resolved suggestion from active suggestions
    setActiveSuggestions(activeSuggestions.filter(s => s._id !== suggestionId));

    // Adjust the current index if needed
    if (currentSuggestionIndex >= activeSuggestions.length - 1) {
      setCurrentSuggestionIndex(activeSuggestions.length - 2);
    }
  };

  // Don't render anything if there are no suggestions or current index is invalid
  if (activeSuggestions.length === 0 || currentSuggestionIndex < 0 || currentSuggestionIndex >= activeSuggestions.length) {
    return null;
  }

  return (
    <RemediationPrompt
      suggestion={activeSuggestions[currentSuggestionIndex]}
      onClose={handleClose}
      onResolve={handleResolve}
      onStartTutorSession={onStartTutorSession}
    />
  );
};

export default RemediationManager;
