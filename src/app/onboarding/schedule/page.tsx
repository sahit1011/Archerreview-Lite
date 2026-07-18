"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import WeeklyCalendar from '@/components/schedule/WeeklyCalendar';
import StudyHoursSlider from '@/components/schedule/StudyHoursSlider';
import StudyTimePreference from '@/components/schedule/StudyTimePreference';
import { useOnboarding } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function SchedulePage() {
  const router = useRouter();
  const {
    availableDays,
    studyHoursPerDay,
    preferredStudyTime,
    setAvailableDays,
    setStudyHoursPerDay,
    setPreferredStudyTime,
    goToNextStep,
    goToPreviousStep,
  } = useOnboarding();

  // Handle continue button click
  const handleContinue = () => {
    // Validate that at least one day is selected
    if (availableDays.length === 0) {
      alert('Please select at least one day when you are available to study.');
      return;
    }

    goToNextStep();
  };

  return (
    <OnboardingLayout>
      <motion.div
        className="mx-auto mb-10 max-w-2xl text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Step 4 of 5 · Schedule
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
          Set your study schedule
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Tell us when you&apos;re available to study so we can craft a personalized NEET &amp; JEE plan
          that fits your routine.
        </p>

        <OnboardingProgressBar currentStep="schedule" />
      </motion.div>

      <motion.div
        className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Availability
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold text-foreground">Available days</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Select the days of the week when you can dedicate time to studying.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-6">
              <WeeklyCalendar
                selectedDays={availableDays}
                onChange={setAvailableDays}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Daily load
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold text-foreground">Study hours</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              How many hours can you dedicate to studying each day?
            </p>
            <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-6">
              <StudyHoursSlider
                value={studyHoursPerDay}
                onChange={setStudyHoursPerDay}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Timing
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold text-foreground">Preferred study time</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              When do you prefer to study? We&apos;ll prioritize scheduling your sessions during this time.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-6">
              <StudyTimePreference
                value={preferredStudyTime}
                onChange={setPreferredStudyTime}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center mt-8 max-w-2xl mx-auto">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={goToPreviousStep}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          variant="brand"
          size="lg"
          onClick={handleContinue}
          className="shine"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}
