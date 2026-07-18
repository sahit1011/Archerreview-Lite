"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CalendarDays, ArrowLeft, ArrowRight, AlertCircle, Stethoscope, Cog, Check } from 'lucide-react';

const EXAM_OPTIONS = [
  { type: 'NEET' as const, icon: Stethoscope, tag: 'Medical', subjects: 'Physics · Chemistry · Biology' },
  { type: 'JEE' as const, icon: Cog, tag: 'Engineering', subjects: 'Physics · Chemistry · Maths' },
];

export default function WelcomePage() {
  const router = useRouter();
  const { examType, setExamType, examDate, setExamDate, goToNextStep } = useOnboarding();

  // Local state for the date input
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Set default date to 60 days from now
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 60);

    // Format the date as YYYY-MM-DD for the input
    const formattedDate = defaultDate.toISOString().split('T')[0];
    setSelectedDate(formattedDate);

    // If no exam date is set in the context, set it to the default
    if (!examDate) {
      setExamDate(defaultDate);
    } else {
      // If there is an exam date in the context, use it
      setSelectedDate(examDate.toISOString().split('T')[0]);
    }
  }, [examDate, setExamDate]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setError('');

    // Validate the date
    const selectedDateObj = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      setError('Please select a future date');
    } else {
      setExamDate(selectedDateObj);
    }
  };

  // Handle continue button click
  const handleContinue = () => {
    if (!examType) {
      setError('Please choose your exam (NEET or JEE)');
      return;
    }
    if (!examDate) {
      setError('Please select a valid exam date');
      return;
    }

    // Go to the next step
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
          Pick your exam and target date. We&apos;ll build a personalized study plan so every day of prep
          counts toward being ready in time.
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

        {/* Exam date — matching hairline panel */}
        <div className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm sm:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Target date
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">When is your exam?</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We&apos;ll map your full syllabus into a schedule that has you fully prepared by exam day.
          </p>
          <div className="mt-5 space-y-3">
            <Label htmlFor="exam-date">Select your exam date</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                id="exam-date"
                name="exam-date"
                className="h-12 pl-9"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={handleDateChange}
              />
            </div>
            {error && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
          </div>
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
