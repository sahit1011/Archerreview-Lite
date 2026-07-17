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

  // Get adaptation type color
  const getAdaptationTypeColor = (type: string) => {
    switch (type) {
      case 'RESCHEDULE':
        return 'bg-primary/15 text-primary border border-primary/30';
      case 'DIFFICULTY_ADJUSTMENT':
        return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
      case 'CONTENT_ADDITION':
        return 'bg-success/15 text-success border border-success/30';
      case 'PLAN_REBALANCE':
        return 'bg-warning/15 text-warning border border-warning/30';
      case 'REMEDIAL_CONTENT':
        return 'bg-destructive/15 text-destructive border border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  // Get adaptation icon
  const getAdaptationIcon = (type: string) => {
    switch (type) {
      case 'RESCHEDULE':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'DIFFICULTY_ADJUSTMENT':
        return <Sliders className="h-5 w-5 text-sky-400" />;
      case 'CONTENT_ADDITION':
        return <Plus className="h-5 w-5 text-success" />;
      case 'PLAN_REBALANCE':
        return <RefreshCw className="h-5 w-5 text-warning" />;
      case 'REMEDIAL_CONTENT':
        return <BookOpen className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Get filtered adaptations
  const filteredAdaptations = filter
    ? adaptations.filter(adaptation => adaptation.type === filter)
    : adaptations;

  // Get unique adaptation types
  const adaptationTypes = Array.from(new Set(adaptations.map(a => a.type)));

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Plan Adaptations</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${!filter ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border text-muted-foreground hover:bg-accent hover:text-foreground'}`}
            onClick={() => setFilter(null)}
          >
            All
          </button>

          {adaptationTypes.map(type => (
            <button
              key={type}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${filter === type ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border text-muted-foreground hover:bg-accent hover:text-foreground'}`}
              onClick={() => setFilter(type)}
            >
              {getAdaptationTypeName(type)}
            </button>
          ))}
        </div>
      </div>

      {filteredAdaptations.length > 0 ? (
        <div className="space-y-4">
          {filteredAdaptations.map(adaptation => (
            <div key={adaptation._id} className="rounded-2xl border border-border bg-secondary/30 p-5 transition-all hover:bg-accent">
              <div className="flex items-start">
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted">
                  {getAdaptationIcon(adaptation.type)}
                </div>

                <div className="ml-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-lg px-3 py-1 text-xs font-medium ${getAdaptationTypeColor(adaptation.type)}`}>
                      {getAdaptationTypeName(adaptation.type)}
                    </span>
                    <span className="rounded-lg bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {new Date(adaptation.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-foreground">{adaptation.description}</p>

                  <div className="mt-3 rounded-xl border border-border bg-card/60 p-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">Reason:</span> {adaptation.reason}

                    {adaptation.topicName && (
                      <div className="mt-2">
                        <span className="font-semibold text-primary">Topic:</span> {adaptation.topicName}
                      </div>
                    )}

                    {adaptation.taskTitle && (
                      <div className="mt-2">
                        <span className="font-semibold text-primary">Task:</span> {adaptation.taskTitle}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-secondary/30 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No adaptations yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Your study plan will adapt automatically as you progress through your studies.
          </p>
        </div>
      )}
    </div>
  );
}
