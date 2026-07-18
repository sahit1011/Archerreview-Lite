"use client";

import { useRef, useState, useEffect } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { AnimateNumber } from '@/components/ui/animated-blur-number';

interface PlanOverviewProps {
  examDate: Date;
  studyHoursPerDay: number;
  availableDays: string[];
}

const COUNT_UP_STEPS = 26;
const COUNT_UP_DURATION_MS = 1100;

// Eases a value from 0 to `target` once it scrolls into view, in discrete steps so
// each tick drives the digit-blur transition — an odometer roll. Respects
// reduced-motion by settling instantly. (Same instrument as the landing stat strip.)
function StatNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      const progress = step / COUNT_UP_STEPS;
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      if (step >= COUNT_UP_STEPS) {
        setDisplay(value);
        clearInterval(id);
      } else {
        setDisplay(Math.round(value * eased));
      }
    }, COUNT_UP_DURATION_MS / COUNT_UP_STEPS);
    return () => clearInterval(id);
  }, [inView, value, reduceMotion]);

  return (
    <span ref={ref}>
      <AnimateNumber value={display} duration={420} blur={14} />
    </span>
  );
}

export default function PlanOverview({ examDate, studyHoursPerDay, availableDays }: PlanOverviewProps) {
  // Calculate days until exam
  const today = new Date();
  const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate weeks until exam
  const weeksUntilExam = Math.ceil(daysUntilExam / 7);
  const monthsUntilExam = Math.max(1, Math.round(daysUntilExam / 30.44));

  // Calculate total study days
  const totalStudyDays = Math.floor(daysUntilExam * (availableDays.length / 7));

  // Calculate total study hours
  const totalStudyHours = totalStudyDays * studyHoursPerDay;

  const stats = [
    { value: weeksUntilExam, unit: 'weeks', label: 'Study window', sub: `~${monthsUntilExam} month${monthsUntilExam === 1 ? '' : 's'} to exam` },
    { value: studyHoursPerDay, unit: 'hrs / day', label: 'Daily cadence', sub: `${availableDays.length} days per week` },
    { value: totalStudyHours, unit: 'hours', label: 'Total study hours', sub: `across ${totalStudyDays} study days` },
  ];

  return (
    <div>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Plan overview</p>
      <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Your prep at a glance</h2>

      {/* Stat band — borderless, divider-separated readouts (landing hero grammar) */}
      <dl className="mt-5 grid grid-cols-1 overflow-hidden rounded-xl border border-border bg-secondary/40 sm:grid-cols-3 sm:divide-x sm:divide-border">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col px-5 py-4">
            <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {s.label}
            </dt>
            <dd className="mt-2 flex items-baseline gap-1.5 font-display text-3xl font-bold leading-none tracking-tight text-foreground">
              <StatNumber value={s.value} />
              <span className="font-mono text-[0.7rem] font-medium tracking-normal text-muted-foreground">{s.unit}</span>
            </dd>
            <span className="mt-2 font-mono text-[0.7rem] text-muted-foreground">{s.sub}</span>
          </div>
        ))}
      </dl>
    </div>
  );
}
