"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import WeeklyCalendar from '@/components/schedule/WeeklyCalendar';
import StudyHoursSlider from '@/components/schedule/StudyHoursSlider';
import StudyTimePreference from '@/components/schedule/StudyTimePreference';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';

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
    diagnosticSkipped
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
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-archer-bright-teal mb-4">
          Step 4: Set Your Study Schedule
        </h1>
        <p className="text-archer-light-text max-w-2xl mx-auto">
          Tell us when you're available to study so we can create a personalized plan that fits your schedule.
        </p>
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-archer-dark-teal text-archer-light-text flex items-center justify-center font-bold">✓</div>
            <div className="w-16 h-1 bg-archer-bright-teal"></div>
            <div className="w-8 h-8 rounded-full bg-archer-dark-teal text-archer-light-text flex items-center justify-center font-bold">✓</div>
            <div className="w-16 h-1 bg-archer-bright-teal"></div>
            <div className="w-8 h-8 rounded-full bg-archer-dark-teal text-archer-light-text flex items-center justify-center font-bold">✓</div>
            <div className="w-16 h-1 bg-archer-bright-teal"></div>
            <div className="w-8 h-8 rounded-full bg-archer-bright-teal text-archer-dark-bg flex items-center justify-center font-bold">4</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="mb-8 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div>
          <h2 className="text-xl font-semibold text-archer-white mb-4">Available Days</h2>
          <p className="text-archer-light-text mb-4">
            Select the days of the week when you can dedicate time to studying.
          </p>
          <WeeklyCalendar
            selectedDays={availableDays}
            onChange={setAvailableDays}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-archer-white mb-4">Study Hours</h2>
          <p className="text-archer-light-text mb-4">
            How many hours can you dedicate to studying each day?
          </p>
          <StudyHoursSlider
            value={studyHoursPerDay}
            onChange={setStudyHoursPerDay}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-archer-white mb-4">Preferred Study Time</h2>
          <p className="text-archer-light-text mb-4">
            When do you prefer to study? We'll prioritize scheduling your study sessions during this time.
          </p>
          <StudyTimePreference
            value={preferredStudyTime}
            onChange={setPreferredStudyTime}
          />
        </div>
      </motion.div>

      <motion.div
        className="flex justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={goToPreviousStep}
          className="bg-archer-dark-teal hover:bg-archer-dark-teal/80 text-archer-light-text font-medium py-2 px-4 rounded-lg text-center transition-colors shadow-button"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="bg-archer-bright-teal hover:bg-archer-bright-teal/90 text-archer-dark-bg font-medium py-2 px-4 rounded-lg text-center transition-colors shadow-button"
        >
          Continue
        </button>
      </motion.div>
    </OnboardingLayout>
  );
}
