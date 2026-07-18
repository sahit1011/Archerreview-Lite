'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Target, Award } from 'lucide-react';

interface Topic {
  _id: string;
  name: string;
  score?: number;
}

interface ReadinessDetailsProps {
  overallScore: number;
  projectedScore: number;
  daysUntilExam: number;
  weakAreas: Topic[];
  strongAreas: Topic[];
}

// A single readiness ring, animated once on scroll. Reused for current + projected.
function ReadinessRing({ score, reduce }: { score: number; reduce: boolean }) {
  return (
    <div className="relative h-28 w-28">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-2xl font-bold text-foreground">{score}%</span>
      </div>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
          strokeDasharray="100, 100"
        />
        <motion.path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${score}, 100`}
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={reduce ? { duration: 0 } : { duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </div>
  );
}

export default function ReadinessDetails({
  overallScore,
  projectedScore,
  daysUntilExam,
  weakAreas,
  strongAreas
}: ReadinessDetailsProps) {
  const reduce = useReducedMotion() === true;
  const weeksUntilExam = Math.max(0, Math.ceil(daysUntilExam / 7));
  const monthsUntilExam = Math.max(1, Math.round(daysUntilExam / 30.44));

  // Get readiness status text and color (genuine status, single semantic accent).
  const getReadinessStatus = (score: number) => {
    if (score >= 85) return { text: 'Excellent', color: 'text-success' };
    if (score >= 75) return { text: 'Good', color: 'text-primary' };
    if (score >= 65) return { text: 'Moderate', color: 'text-warning' };
    if (score >= 55) return { text: 'Needs Improvement', color: 'text-warning' };
    return { text: 'Critical', color: 'text-destructive' };
  };

  const readinessStatus = getReadinessStatus(overallScore);
  const projectedStatus = getReadinessStatus(projectedScore);

  const rings = [
    {
      key: 'current',
      eyebrow: 'Current readiness',
      Icon: ShieldCheck,
      score: overallScore,
      status: readinessStatus,
      note: 'Based on your performance across all completed tasks and assessments.',
    },
    {
      key: 'projected',
      eyebrow: 'Projected readiness',
      Icon: TrendingUp,
      score: projectedScore,
      status: projectedStatus,
      note: `Estimated readiness by exam time — about ${monthsUntilExam} month${monthsUntilExam === 1 ? '' : 's'} (~${weeksUntilExam} weeks) from now.`,
    },
  ];

  const areaColumns = [
    {
      key: 'weak',
      eyebrow: 'Areas to focus on',
      Icon: Target,
      iconColor: 'text-destructive',
      node: 'bg-destructive',
      scoreColor: 'text-destructive',
      areas: weakAreas,
      empty: 'No specific weak areas identified yet. Keep completing tasks to sharpen the read.',
    },
    {
      key: 'strong',
      eyebrow: 'Your strengths',
      Icon: Award,
      iconColor: 'text-success',
      node: 'bg-success',
      scoreColor: 'text-success',
      areas: strongAreas,
      empty: 'No specific strengths identified yet. Keep completing tasks to sharpen the read.',
    },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Instrument</p>
          <h2 className="text-lg font-semibold text-foreground">Readiness Details</h2>
        </div>
      </div>

      {/* Ring readouts — one framed object split by a hairline spine */}
      <div className="mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
        {rings.map((r) => (
          <div key={r.key} className="flex flex-col bg-card p-6">
            <p className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <r.Icon className="h-3.5 w-3.5 text-primary" /> {r.eyebrow}
            </p>

            <div className="mt-5 flex items-center justify-between">
              <div>
                <div className="font-display text-4xl font-bold text-foreground">{r.score}%</div>
                <div className={`mt-1 text-sm font-medium ${r.status.color}`}>{r.status.text}</div>
              </div>
              <ReadinessRing score={r.score} reduce={reduce} />
            </div>

            <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">{r.note}</p>
          </div>
        ))}
      </div>

      {/* Focus / strengths — hairline telemetry rows with single accent nodes */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {areaColumns.map((col) => (
          <div key={col.key} className="rounded-2xl border border-border bg-secondary/30 p-6">
            <p className="mb-4 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <col.Icon className={`h-3.5 w-3.5 ${col.iconColor}`} /> {col.eyebrow}
            </p>

            {col.areas.length > 0 ? (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/60">
                {col.areas.map((area) => (
                  <li key={area._id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${col.node}`} />
                      <span className="truncate text-sm text-foreground">{area.name}</span>
                    </div>
                    {area.score !== undefined && (
                      <span className={`shrink-0 font-mono text-[0.75rem] font-semibold ${col.scoreColor}`}>
                        {area.score}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">{col.empty}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
