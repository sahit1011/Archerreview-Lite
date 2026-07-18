"use client";

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import TopicPriorityEditor from './TopicPriorityEditor';
import { useOnboarding } from '@/context/OnboardingContext';

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

// Priority → single-accent bar fill (stepped opacity) + mono label. Focus is a
// relative emphasis, not a status, so it stays on the one accent rather than
// borrowing destructive/warning hues.
const PRIORITY_META: Record<TopicPriority['importance'], { fill: string; pct: number; label: string }> = {
  High: { fill: 'bg-primary', pct: 100, label: 'High priority' },
  Medium: { fill: 'bg-primary/60', pct: 66, label: 'Medium priority' },
  Low: { fill: 'bg-primary/30', pct: 33, label: 'Low priority' },
};

// Default focus areas when the diagnostic was skipped — the user's exam subjects,
// weighted by how much of the paper they carry (NEET: Biology is half the marks).
const defaultFocusAreasByExam: Record<'NEET' | 'JEE', TopicPriority[]> = {
  NEET: [
    { category: 'BIOLOGY', importance: 'High' },
    { category: 'PHYSICS', importance: 'Medium' },
    { category: 'CHEMISTRY', importance: 'Medium' },
  ],
  JEE: [
    { category: 'MATHEMATICS', importance: 'High' },
    { category: 'PHYSICS', importance: 'High' },
    { category: 'CHEMISTRY', importance: 'Medium' },
  ],
};

export default function FocusAreas({
  diagnosticCompleted,
  diagnosticSkipped,
  categoryScores = [],
  onUpdatePriorities
}: FocusAreasProps) {
  const reduce = useReducedMotion() === true;
  const [showEditor, setShowEditor] = useState(false);
  const [customizedTopics, setCustomizedTopics] = useState<TopicPriority[]>([]);
  const { examType } = useOnboarding();

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

    return defaultFocusAreasByExam[examType === 'JEE' ? 'JEE' : 'NEET'];
  };

  const focusAreas = getTopicsToDisplay();
  const sourceLabel = customizedTopics.length > 0
    ? 'customized'
    : diagnosticCompleted && categoryScores.length > 0
      ? 'from diagnostic'
      : `${examType || 'NEET/JEE'} weightings`;

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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Focus areas
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Where your time goes</h2>
        </div>
        {diagnosticSkipped && (
          <button
            onClick={handleEditClick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
          >
            <Pencil className="h-3.5 w-3.5" />
            Customize
          </button>
        )}
      </div>

      {/* Focus ledger — hairline rows with a stepped-opacity emphasis bar */}
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-secondary/40">
        <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
          <span className="font-mono text-[0.7rem] text-muted-foreground">Priority map</span>
          <span className="font-mono text-[0.7rem] text-muted-foreground">{sourceLabel}</span>
        </div>
        <ul className="divide-y divide-border">
          {focusAreas.map((area, index) => {
            const meta = PRIORITY_META[area.importance];
            const score = diagnosticCompleted
              ? Math.round(categoryScores.find(s => s.category === area.category)?.score ?? 0)
              : null;
            return (
              <motion.li
                key={area.category}
                className="flex items-center gap-4 px-5 py-3.5"
                role="img"
                aria-label={`${getCategoryDisplayName(area.category)} — ${meta.label}`}
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={reduce ? { duration: 0 } : { delay: 0.05 * index, duration: 0.35 }}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">
                    {getCategoryDisplayName(area.category)}
                  </span>
                  {score !== null && (
                    <span className="ml-2 font-mono text-[0.7rem] text-muted-foreground">{score}%</span>
                  )}
                </div>
                <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-secondary sm:w-32">
                  <motion.div
                    className={`h-full origin-left rounded-full ${meta.fill}`}
                    style={{ width: `${meta.pct}%` }}
                    initial={reduce ? false : { scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20, delay: 0.06 * index }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-mono text-[0.7rem] uppercase tracking-[0.06em] text-muted-foreground">
                  {area.importance}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      {diagnosticSkipped && (
        <p className="mt-3 font-mono text-[0.7rem] leading-relaxed text-muted-foreground">
          {customizedTopics.length > 0
            ? 'Priorities customized — edit again anytime with Customize.'
            : `Balanced from ${examType || 'NEET/JEE'} exam weightings · adjust with Customize.`}
        </p>
      )}

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
