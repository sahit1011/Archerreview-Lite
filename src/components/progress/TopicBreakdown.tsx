'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Layers, ChevronRight } from 'lucide-react';

interface Topic {
  _id: string;
  name: string;
  category: string;
  score?: number;
  subtopics?: Topic[];
}

interface TopicBreakdownProps {
  topics: Topic[];
}

// One accent at stepped opacity — never a rainbow.
const SUBJECT_BAR = ['bg-primary', 'bg-primary/60', 'bg-primary/30'] as const;

export default function TopicBreakdown({ topics }: TopicBreakdownProps) {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const reduceMotion = useReducedMotion();

  // Toggle topic expansion
  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // Semantic status colour for the mono readout only (genuine status, not decoration).
  const getScoreStatus = (score?: number) => {
    if (typeof score !== 'number') return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  // Render a topic and its subtopics recursively as a telemetry row.
  const renderTopic = (topic: Topic, depth = 0, index = 0) => {
    const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
    const isExpanded = expandedTopics[topic._id];
    const attempted = typeof topic.score === 'number';

    return (
      <div key={topic._id}>
        <div
          className={`flex items-center gap-3 py-3 ${hasSubtopics ? 'cursor-pointer' : ''}`}
          onClick={() => hasSubtopics && toggleTopic(topic._id)}
          role={hasSubtopics ? 'button' : undefined}
          aria-expanded={hasSubtopics ? isExpanded : undefined}
        >
          {hasSubtopics ? (
            <ChevronRight
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
          )}

          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{topic.name}</span>

          <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-secondary sm:w-32">
            <motion.div
              className={`h-full origin-left rounded-full ${attempted ? SUBJECT_BAR[index % SUBJECT_BAR.length] : 'bg-border'}`}
              style={{ width: `${topic.score ?? 0}%` }}
              initial={reduceMotion ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>

          <span className={`w-16 shrink-0 text-right font-mono text-[0.75rem] ${getScoreStatus(topic.score)}`}>
            {attempted ? `${topic.score}%` : '— · —'}
          </span>
        </div>

        {hasSubtopics && isExpanded && (
          <div className="ml-4 border-l border-border pl-5">
            {topic.subtopics!.map((subtopic, i) => renderTopic(subtopic, depth + 1, i))}
          </div>
        )}
      </div>
    );
  };

  // Group topics by category
  const topicsByCategory: Record<string, Topic[]> = {};
  topics.forEach(topic => {
    if (!topicsByCategory[topic.category]) {
      topicsByCategory[topic.category] = [];
    }
    topicsByCategory[topic.category].push(topic);
  });

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Mastery map</p>
          <h2 className="text-lg font-semibold text-foreground">Topic Breakdown</h2>
        </div>
      </div>

      <div className="space-y-5">
        {Object.entries(topicsByCategory).map(([category, categoryTopics], ci) => {
          const attempted = categoryTopics.filter(t => typeof t.score === 'number');
          const avg = attempted.length > 0
            ? Math.round(attempted.reduce((sum, t) => sum + (t.score ?? 0), 0) / attempted.length)
            : null;
          return (
            <section key={category} className="overflow-hidden rounded-xl border border-border bg-secondary/30">
              <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {formatCategoryName(category)}
                </p>
                <span className="font-mono text-[0.7rem] text-muted-foreground">
                  {attempted.length}/{categoryTopics.length} · {avg !== null ? `${avg}%` : 'not attempted'}
                </span>
              </header>
              <div className="divide-y divide-border/60 px-5">
                {categoryTopics.map((topic, ti) => renderTopic(topic, 0, ti))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
