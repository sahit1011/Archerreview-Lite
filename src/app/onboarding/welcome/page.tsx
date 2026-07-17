"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CalendarDays, ArrowLeft, ArrowRight, AlertCircle, Target, Stethoscope, Cog, CheckCircle2 } from 'lucide-react';

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
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Step 2 of 5</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-6">
          Let&apos;s set up your prep
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Pick your exam and target date — we&apos;ll build a personalized study plan so every day of prep counts toward being ready in time.
        </p>

        <OnboardingProgressBar currentStep="examDate" />

      </motion.div>

      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Exam track selector */}
        <div className="mb-6 rounded-2xl border border-border bg-card shadow-lg shadow-primary/5 p-8 text-left">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl brand-gradient text-white shadow-button">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground">Which exam are you preparing for?</h2>
          </div>
          <p className="text-muted-foreground mb-6">We&apos;ll tailor your subjects and plan to your exam.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: 'NEET' as const, icon: Stethoscope, tag: 'Medical', subjects: 'Physics · Chemistry · Biology' },
              { type: 'JEE' as const, icon: Cog, tag: 'Engineering', subjects: 'Physics · Chemistry · Maths' },
            ].map((opt) => {
              const selected = examType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => { setExamType(opt.type); setError(''); }}
                  className={cn(
                    'relative rounded-xl border-2 p-4 text-left transition-all',
                    selected ? 'border-primary bg-primary/5 shadow-button' : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  {selected && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />}
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <opt.icon className="h-5 w-5" />
                  </div>
                  <p className="font-display text-lg font-bold">{opt.type}</p>
                  <p className="text-xs text-muted-foreground">{opt.tag}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{opt.subjects}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-lg shadow-primary/5 p-8 text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl brand-gradient text-white shadow-button">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground">When is your exam?</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            We&apos;ll map your Physics, Chemistry, Biology &amp; Mathematics syllabus into a schedule that has you fully prepared by exam day.
          </p>
          <div className="mt-6 space-y-3">
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
              <p className="flex items-center gap-1.5 text-sm text-destructive mt-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
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
