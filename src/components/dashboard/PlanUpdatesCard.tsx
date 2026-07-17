"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Gauge,
  BookPlus,
  Scale,
  LifeBuoy,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';

interface AdaptationItem {
  _id: string;
  type: 'RESCHEDULE' | 'DIFFICULTY_ADJUSTMENT' | 'CONTENT_ADDITION' | 'PLAN_REBALANCE' | 'REMEDIAL_CONTENT';
  description: string;
  reason: string;
  date: string;
  topicName?: string;
}

const TYPE_META: Record<AdaptationItem['type'], { icon: typeof CalendarClock; label: string; color: string; bg: string }> = {
  RESCHEDULE: { icon: CalendarClock, label: 'Rescheduled', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' },
  DIFFICULTY_ADJUSTMENT: { icon: Gauge, label: 'Difficulty', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  CONTENT_ADDITION: { icon: BookPlus, label: 'Review added', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  PLAN_REBALANCE: { icon: Scale, label: 'Rebalanced', color: 'text-primary', bg: 'bg-primary/10' },
  REMEDIAL_CONTENT: { icon: LifeBuoy, label: 'Remedial', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * "Plan updates" — the visible face of the adaptive agents. Shows the latest
 * Adaptation documents (written every time the monitor→adaptation loop runs)
 * so students can see the plan actually working for them.
 */
export default function PlanUpdatesCard({ userId }: { userId?: string }) {
  const [updates, setUpdates] = useState<AdaptationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/plan-adaptations?limit=5');
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.adaptations)) {
          setUpdates(data.adaptations.slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading plan updates:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to show and nothing loading → stay out of the way entirely.
  if (!loading && updates.length === 0) return null;

  return (
    <Reveal delay={0.15}>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Plan updates</h2>
            <p className="text-xs text-muted-foreground">Your AI coach adjusted your plan</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-secondary/60" />
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {updates.map((u, ui) => {
              const meta = TYPE_META[u.type] ?? TYPE_META.PLAN_REBALANCE;
              return (
                <li key={u._id} className="rise-in flex items-start gap-3" style={{ ['--i' as string]: ui }}>
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}>
                    <meta.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground" title={u.description}>
                      {u.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meta.label} · {timeAgo(u.date)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href={userId ? `/progress?userId=${userId}` : '/progress'}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          See all adaptations <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Reveal>
  );
}
