'use client';

import { useState } from 'react';
import { Zap, Calendar, Sliders, Plus, RefreshCw, BookOpen, Info, ClipboardList } from 'lucide-react';

interface Adaptation {
  _id: string;
  type: 'RESCHEDULE' | 'DIFFICULTY_ADJUSTMENT' | 'CONTENT_ADDITION' | 'PLAN_REBALANCE' | 'REMEDIAL_CONTENT';
  description: string;
  reason: string;
  date: string;
  topicId?: string;
  topicName?: string;
  taskId?: string;
  taskTitle?: string;
}

interface PlanAdaptationsProps {
  adaptations: Adaptation[];
}

export default function PlanAdaptations({ adaptations }: PlanAdaptationsProps) {
  const [filter, setFilter] = useState<string | null>(null);

  // Get adaptation type display name
  const getAdaptationTypeName = (type: string) => {
    switch (type) {
      case 'RESCHEDULE':
        return 'Task Rescheduled';
      case 'DIFFICULTY_ADJUSTMENT':
        return 'Difficulty Adjusted';
      case 'CONTENT_ADDITION':
        return 'Content Added';
      case 'PLAN_REBALANCE':
        return 'Plan Rebalanced';
      case 'REMEDIAL_CONTENT':
        return 'Remedial Content Added';
      default:
        return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    }
  };

  // Get adaptation icon — single primary accent, no per-type rainbow.
  const getAdaptationIcon = (type: string) => {
    switch (type) {
      case 'RESCHEDULE':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'DIFFICULTY_ADJUSTMENT':
        return <Sliders className="h-4 w-4 text-primary" />;
      case 'CONTENT_ADDITION':
        return <Plus className="h-4 w-4 text-primary" />;
      case 'PLAN_REBALANCE':
        return <RefreshCw className="h-4 w-4 text-primary" />;
      case 'REMEDIAL_CONTENT':
        return <BookOpen className="h-4 w-4 text-primary" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  // Get filtered adaptations
  const filteredAdaptations = filter
    ? adaptations.filter(adaptation => adaptation.type === filter)
    : adaptations;

  // Get unique adaptation types
  const adaptationTypes = Array.from(new Set(adaptations.map(a => a.type)));

  const chipBtn = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
    }`;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Change log</p>
            <h2 className="text-lg font-semibold text-foreground">Plan Adaptations</h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={chipBtn(!filter)} onClick={() => setFilter(null)}>
            All
          </button>

          {adaptationTypes.map(type => (
            <button key={type} className={chipBtn(filter === type)} onClick={() => setFilter(type)}>
              {getAdaptationTypeName(type)}
            </button>
          ))}
        </div>
      </div>

      {filteredAdaptations.length > 0 ? (
        <ol className="relative ml-1 border-l border-border">
          {filteredAdaptations.map((adaptation) => (
            <li key={adaptation._id} className="relative pb-7 pl-8 last:pb-0">
              {/* accent node on the spine */}
              <span className="absolute -left-[9px] top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border bg-card">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </span>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {getAdaptationIcon(adaptation.type)}
                  {getAdaptationTypeName(adaptation.type)}
                </span>
                <time className="font-mono text-[0.7rem] text-muted-foreground">
                  {new Date(adaptation.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </time>
              </div>

              <p className="mt-2 text-sm text-foreground">{adaptation.description}</p>

              <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Reason</span> · {adaptation.reason}
                </p>
                {adaptation.topicName && (
                  <p className="mt-1.5">
                    <span className="font-semibold text-foreground">Topic</span> · {adaptation.topicName}
                  </p>
                )}
                {adaptation.taskTitle && (
                  <p className="mt-1.5">
                    <span className="font-semibold text-foreground">Task</span> · {adaptation.taskTitle}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-2xl border border-border bg-secondary/30 py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">No adaptations yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Your study plan will adapt automatically as you progress through your studies.
          </p>
        </div>
      )}
    </div>
  );
}
