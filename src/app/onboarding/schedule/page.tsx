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
import { CalendarDays, Clock, Sunrise, ArrowLeft, ArrowRight } from 'lucide-react';

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
        className="text-center mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight gradient-text mb-4">
          Set Your Study Schedule
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Tell us when you&apos;re available to study so we can craft a personalized NEET &amp; JEE plan that fits your routine.
        </p>

        <OnboardingProgressBar currentStep="schedule" />
      </motion.div>

      <motion.div
        className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg shadow-primary/5"
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
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-button">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Available Days</h2>
            </div>
            <p className="text-muted-foreground mb-4 ml-[52px]">
              Select the days of the week when you can dedicate time to studying.
            </p>
            <div className="rounded-2xl border border-border bg-secondary p-6">
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
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-button">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Study Hours</h2>
            </div>
            <p className="text-muted-foreground mb-4 ml-[52px]">
              How many hours can you dedicate to studying each day?
            </p>
            <div className="rounded-2xl border border-border bg-secondary p-6">
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
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-button">
                <Sunrise className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Preferred Study Time</h2>
            </div>
            <p className="text-muted-foreground mb-4 ml-[52px]">
              When do you prefer to study? We&apos;ll prioritize scheduling your study sessions during this time.
            </p>
            <div className="rounded-2xl border border-border bg-secondary p-6">
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
