"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, AlertCircle, Stethoscope, Cog, Check, Clock } from 'lucide-react';

const EXAM_OPTIONS = [
  { type: 'NEET' as const, icon: Stethoscope, tag: 'Medical', subjects: 'Physics · Chemistry · Biology' },
  { type: 'JEE' as const, icon: Cog, tag: 'Engineering', subjects: 'Physics · Chemistry · Maths' },
];

// NEET/JEE dates are effectively fixed each year, so we ask how far away the exam
// is (a window) rather than a specific date. `months` is the planning horizon we
// pace the full syllabus into — the lower bound of each window, so students peak in
// time (with revision room if their exam falls at the later end).
const TIMELINE_OPTIONS = [
  { months: 3, label: '3–6 months away', sub: 'Intensive sprint — high-focus daily plan', weeks: 13 },
  { months: 6, label: '6–9 months away', sub: 'Focused build — steady daily pace', weeks: 26 },
  { months: 9, label: '9–15 months away', sub: 'Strong foundations first, then depth', weeks: 39 },
  { months: 15, label: '15+ months away', sub: 'Long game — master everything with room to spare', weeks: 65 },
];

function dateFromMonths(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function WelcomePage() {
  const { examType, setExamType, examDate, setExamDate, goToNextStep } = useOnboarding();

  const [selectedMonths, setSelectedMonths] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  // Returning to this step: infer which window was chosen from the stored date.
  useEffect(() => {
    if (examDate && selectedMonths === null) {
      const monthsUntil = (examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
      const closest = TIMELINE_OPTIONS.reduce((a, b) =>
        Math.abs(b.months - monthsUntil) < Math.abs(a.months - monthsUntil) ? b : a
      );
      setSelectedMonths(closest.months);
    }
  }, [examDate, selectedMonths]);

  const handleSelectTimeline = (months: number) => {
    setSelectedMonths(months);
    setError('');
    setExamDate(dateFromMonths(months));
  };

  const handleContinue = () => {
    if (!examType) {
      setError('Please choose your exam (NEET or JEE)');
      return;
    }
    if (selectedMonths === null || !examDate) {
      setError('Please choose how far away your exam is');
      return;
    }
    goToNextStep();
  };

  return (
    <OnboardingLayout>
      {/* Hero — uppercase eyebrow, big font-display headline, clear subcopy */}
      <motion.div
        className="mx-auto mb-10 max-w-2xl text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Step 2 of 5 · Set up your prep
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
          Let&apos;s set up your prep
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Pick your exam and how far away it is. We&apos;ll pace your full syllabus into a personalized
          plan so every day of prep counts toward being ready in time.
        </p>

        <OnboardingProgressBar currentStep="examDate" />
      </motion.div>

      <motion.div
        className="mx-auto max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Exam track selector — hairline framed panel, single accent, no rainbow tiles */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 text-left shadow-sm sm:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Your exam
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
            Which exam are you preparing for?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We&apos;ll tailor your subjects and plan to your exam.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {EXAM_OPTIONS.map((opt) => {
              const selected = examType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => { setExamType(opt.type); setError(''); }}
                  className={cn(
                    'relative rounded-xl border p-4 text-left transition-colors',
                    selected
                      ? 'border-primary/40 bg-primary/[0.04]'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]'
                  )}
                >
                  {selected && (
                    <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-secondary">
                      <opt.icon className="h-[18px] w-[18px] text-primary" />
                    </div>
                    <span className="font-display text-lg font-bold leading-none">{opt.type}</span>
                  </div>
                  <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {opt.tag}
                  </p>
                  <p className="mt-1.5 font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
                    {opt.subjects}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline — pick the window the exam falls in (no fixed date needed) */}
        <div className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm sm:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Timeline
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
            How far away is your exam?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pick the window your attempt falls in — we&apos;ll pace the full syllabus to fit and
            rebalance as you go.
          </p>

          <div className="mt-5 space-y-3">
            {TIMELINE_OPTIONS.map((opt) => {
              const selected = selectedMonths === opt.months;
              return (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => handleSelectTimeline(opt.months)}
                  className={cn(
                    'relative flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-colors',
                    selected
                      ? 'border-primary/40 bg-primary/[0.04]'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]'
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-secondary">
                    <Clock className="h-[18px] w-[18px] text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-semibold text-foreground">{opt.label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{opt.sub}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">≈ {opt.weeks} wks</span>
                  {selected && (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button asChild variant="ghost" className="group">
            <Link href="/onboarding/account-creation">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back
            </Link>
          </Button>
          <Button
            onClick={handleContinue}
            variant="brand"
            size="lg"
            disabled={!!error}
            className="group"
          >
            Continue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}
