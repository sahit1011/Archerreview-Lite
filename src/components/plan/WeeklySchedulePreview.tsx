"use client";

import { motion, useReducedMotion } from 'framer-motion';

interface WeeklySchedulePreviewProps {
  availableDays: string[];
  studyHoursPerDay: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening';
}

const daysOfWeek = [
  { id: 'Monday', letter: 'M' },
  { id: 'Tuesday', letter: 'T' },
  { id: 'Wednesday', letter: 'W' },
  { id: 'Thursday', letter: 'T' },
  { id: 'Friday', letter: 'F' },
  { id: 'Saturday', letter: 'S' },
  { id: 'Sunday', letter: 'S' },
];

// Single accent at stepped opacity — Watch / Read / Quiz / Review. Same tokens
// and legend grammar as the landing HowItWorks StepWeek schematic.
const TIER_BY_TYPE = [
  'bg-primary',
  'bg-primary/60',
  'bg-primary/30',
  'border border-primary/30 bg-transparent',
] as const;

const LEGEND = [
  { label: 'Watch', sw: 'bg-primary' },
  { label: 'Read', sw: 'bg-primary/60' },
  { label: 'Quiz', sw: 'bg-primary/30' },
  { label: 'Review', sw: 'border border-primary/30 bg-transparent' },
] as const;

// Deterministic block pattern per weekday index — a representative day shape that
// scales with the chosen daily hours. This is a schematic, not the real schedule
// (generated server-side after onboarding).
const DAY_SHAPES = [
  [0, 1],
  [0, 2, 1],
  [1, 2],
  [0, 1, 3],
  [2, 1],
  [0],
  [3],
];

const getTimeRange = (preference: 'morning' | 'afternoon' | 'evening') => {
  switch (preference) {
    case 'morning':
      return '6:00 AM – 12:00 PM';
    case 'afternoon':
      return '12:00 PM – 6:00 PM';
    case 'evening':
      return '6:00 PM – 9:00 PM';
    default:
      return '';
  }
};

export default function WeeklySchedulePreview({
  availableDays,
  studyHoursPerDay,
  preferredStudyTime,
}: WeeklySchedulePreviewProps) {
  const reduce = useReducedMotion() === true;
  const timeRange = getTimeRange(preferredStudyTime);
  const activeCount = availableDays.length;

  // Cap blocks per active day by the daily-hours budget so denser plans read denser.
  const maxBlocks = Math.max(1, Math.min(3, Math.round(studyHoursPerDay)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Weekly schedule
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">A typical week</h2>
        </div>
        <span className="font-mono text-[0.7rem] text-muted-foreground">
          {activeCount} active {activeCount === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Schematic — grid-cols-7 day letters + stepped-opacity task blocks */}
      <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4 sm:p-5">
        <div className="grid grid-cols-7 gap-1.5">
          {daysOfWeek.map((d, i) => (
            <span
              key={i}
              className={`text-center font-mono text-[0.6rem] uppercase ${
                availableDays.includes(d.id) ? 'text-foreground' : 'text-muted-foreground/50'
              }`}
            >
              {d.letter}
            </span>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 items-start gap-1.5">
          {daysOfWeek.map((d, col) => {
            const isActive = availableDays.includes(d.id);
            const blocks = isActive ? DAY_SHAPES[col].slice(0, maxBlocks) : [];
            return (
              <div key={d.id} className="flex flex-col gap-1">
                {isActive ? (
                  blocks.map((type, bi) => (
                    <motion.div
                      key={bi}
                      className={`h-4 origin-bottom rounded-[4px] ${TIER_BY_TYPE[type]}`}
                      initial={reduce ? false : { scaleY: 0, opacity: 0 }}
                      whileInView={{ scaleY: 1, opacity: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { duration: 0.35, delay: 0.04 * col + 0.03 * bi, ease: [0.22, 1, 0.36, 1] }
                      }
                    />
                  ))
                ) : (
                  <div className="h-4 rounded-[4px] border border-dashed border-border" aria-label="rest day" />
                )}
              </div>
            );
          })}
        </div>

        {/* Typed legend — same 4-item grammar as StepWeek */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-[3px] ${l.sw}`} />
              <span className="font-mono text-[0.65rem] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 font-mono text-[0.7rem] text-muted-foreground">
        {studyHoursPerDay}h / day · sessions land in the{' '}
        <span className="text-primary">{preferredStudyTime}</span>
        {timeRange ? ` (${timeRange})` : ''}
      </p>
    </div>
  );
}
