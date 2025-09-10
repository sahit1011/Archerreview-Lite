"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopicPriorityEditor from './TopicPriorityEditor';

export interface TopicPriority {
  category: string;
  importance: 'High' | 'Medium' | 'Low';
}

interface FocusAreasProps {
  diagnosticCompleted: boolean;
  diagnosticSkipped: boolean;
  categoryScores?: { category: string; score: number }[];
  onUpdatePriorities?: (topics: TopicPriority[]) => void;
}

// Helper function to get category display name
const getCategoryDisplayName = (category: string) => {
  const words = category.replace(/_/g, ' ').toLowerCase().split(' ');
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Default focus areas if diagnostic was skipped
const defaultFocusAreas: TopicPriority[] = [
  { category: 'MANAGEMENT_OF_CARE', importance: 'High' },
  { category: 'SAFETY_AND_INFECTION_CONTROL', importance: 'High' },
  { category: 'PHARMACOLOGICAL_THERAPIES', importance: 'High' },
  { category: 'PHYSIOLOGICAL_ADAPTATION', importance: 'Medium' },
  { category: 'REDUCTION_OF_RISK_POTENTIAL', importance: 'Medium' },
  { category: 'HEALTH_PROMOTION', importance: 'Medium' },
  { category: 'PSYCHOSOCIAL_INTEGRITY', importance: 'Low' },
  { category: 'BASIC_CARE_AND_COMFORT', importance: 'Low' },
];

export default function FocusAreas({
  diagnosticCompleted,
  diagnosticSkipped,
  categoryScores = [],
  onUpdatePriorities
}: FocusAreasProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [customizedTopics, setCustomizedTopics] = useState<TopicPriority[]>([]);

  // Determine which focus areas to use
  const getTopicsToDisplay = () => {
    if (customizedTopics.length > 0) {
      return customizedTopics;
    }

    if (diagnosticCompleted && categoryScores.length > 0) {
      // Convert category scores to topic priorities
      return [...categoryScores]
        .sort((a, b) => a.score - b.score)
        .map(score => ({
          category: score.category,
          importance: score.score < 60
            ? 'High'
            : score.score < 80
              ? 'Medium'
              : 'Low'
        })) as TopicPriority[];
    }

    return defaultFocusAreas;
  };

  const focusAreas = getTopicsToDisplay();

  // Handle opening the editor
  const handleEditClick = () => {
    setShowEditor(true);
  };

  // Handle saving priorities
  const handleSavePriorities = (topics: TopicPriority[]) => {
    setCustomizedTopics(topics);
    setShowEditor(false);

    // Call the callback if provided
    if (onUpdatePriorities) {
      onUpdatePriorities(topics);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white/90 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Focus Areas</span>
        </h2>
        {diagnosticSkipped && (
          <button
            onClick={handleEditClick}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 font-medium text-sm transition-all duration-200 flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 mr-1 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Customize Priorities
          </button>
        )}
      </div>

      {diagnosticSkipped && (
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4 shadow-lg backdrop-blur-md">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-teal-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-medium text-teal-400">
                {customizedTopics.length > 0 ? 'Customized Focus Areas' : 'Default Focus Areas'}
              </h3>
              <p className="text-sm text-white/80 mt-1">
                {customizedTopics.length > 0
                  ? 'You have customized your focus areas. You can edit them again using the "Customize Priorities" button.'
                  : 'Since you skipped the diagnostic assessment, we\'ve created a balanced plan based on NCLEX exam weightings. You can customize these priorities using the "Customize Priorities" button.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {focusAreas.map((area, index) => {
          // Determine color and priority based on importance
          let colorClass, priorityText;

          if (area.importance === 'High') {
            colorClass = 'border-red-400/30 bg-red-400/10 text-red-300';
            priorityText = 'High Priority';
          } else if (area.importance === 'Medium') {
            colorClass = 'border-amber-400/30 bg-amber-400/10 text-amber-300';
            priorityText = 'Medium Priority';
          } else {
            colorClass = 'border-sky-400/30 bg-sky-400/10 text-sky-300';
            priorityText = 'Low Priority';
          }

          return (
            <motion.div
              key={area.category}
              className={`p-3 rounded-lg border flex justify-between items-center shadow-lg backdrop-blur-md ${colorClass}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
            >
              <div>
                <div className="font-medium">{getCategoryDisplayName(area.category)}</div>
                {diagnosticCompleted && categoryScores.length > 0 && (
                  <div className="text-xs mt-1 text-white/70">
                    Score: {Math.round(categoryScores.find(s => s.category === area.category)?.score || 0)}%
                  </div>
                )}
              </div>
              <div className="text-xs font-medium px-2 py-1 rounded-full bg-white/5">
                {priorityText}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Topic Priority Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <TopicPriorityEditor
            topics={focusAreas}
            onSave={handleSavePriorities}
            onCancel={() => setShowEditor(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
