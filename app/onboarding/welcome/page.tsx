"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';

export default function WelcomePage() {
  const router = useRouter();
  const { examDate, setExamDate, goToNextStep } = useOnboarding();

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
        <h1 className="text-3xl font-bold text-archer-bright-teal mb-4">
          Step 2: Set Your Exam Date
        </h1>
        <p className="text-archer-light-text max-w-2xl mx-auto">
          Now that you've created your account, let's set up your personalized NCLEX study plan. We'll need a few details to get started.
        </p>
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-archer-dark-teal text-archer-light-text flex items-center justify-center font-bold">✓</div>
            <div className="w-16 h-1 bg-archer-bright-teal"></div>
            <div className="w-8 h-8 rounded-full bg-archer-bright-teal text-archer-dark-teal flex items-center justify-center font-bold">2</div>
            <div className="w-16 h-1 bg-archer-dark-teal/30"></div>
            <div className="w-8 h-8 rounded-full bg-archer-dark-teal text-archer-light-text flex items-center justify-center font-bold">3</div>
            <div className="w-16 h-1 bg-archer-dark-teal/30"></div>
            <div className="w-8 h-8 rounded-full bg-archer-dark-teal text-archer-light-text flex items-center justify-center font-bold">4</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-archer-white mb-4">When is your NCLEX exam?</h2>
          <p className="text-archer-light-text mb-4">
            This helps us create a study plan that ensures you're fully prepared by your exam date.
          </p>
          <div className="mt-4">
            <label htmlFor="exam-date" className="block text-sm font-medium text-archer-light-text">
              Exam Date
            </label>
            <input
              type="date"
              id="exam-date"
              name="exam-date"
              className="mt-1 block w-full rounded-md border-archer-dark-teal/50 bg-archer-dark-teal/30 text-archer-white shadow-sm focus:border-archer-bright-teal focus:ring-archer-bright-teal"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={handleDateChange}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
        </div>

        <motion.div
          className="flex justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/"
            className="bg-archer-dark-teal hover:bg-archer-dark-teal/80 text-archer-light-text font-medium py-2 px-4 rounded-lg text-center transition-colors shadow-button"
          >
            Back
          </Link>
          <button
            onClick={handleContinue}
            className="bg-archer-bright-teal hover:bg-archer-bright-teal/90 text-archer-dark-bg font-medium py-2 px-4 rounded-lg text-center transition-colors shadow-button"
            disabled={!!error}
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </OnboardingLayout>
  );
}
