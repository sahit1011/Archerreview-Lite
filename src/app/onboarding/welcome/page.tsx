"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';

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
        <h1 className="text-5xl font-bold gradient-text mb-6">
          Step 2: Set Your Exam Date
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 glassmorphic p-4 rounded-xl backdrop-blur-xl">
          Let's set up your personalized NCLEX study plan based on your exam date. This helps us create a schedule that works best for you.
        </p>
        
        <OnboardingProgressBar currentStep="examDate" />

      </motion.div>

      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="glassmorphic p-8 rounded-xl">
          <h2 className="text-2xl font-semibold text-white/90 mb-6">When is your NCLEX exam?</h2>
          <p className="text-white/80 mb-6 text-lg">
            This helps us create a study plan that ensures you're fully prepared by your exam date.
          </p>
          <div className="mt-6 space-y-4">
            <label htmlFor="exam-date" className="block text-white/90 text-sm font-medium">
              Select Your Exam Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="exam-date"
                name="exam-date"
                className="appearance-none bg-white/5 border border-white/10 rounded-xl w-full py-3 px-4 text-white placeholder-white/40 leading-tight focus:outline-none focus:ring-2 focus:ring-[#00A99D] focus:border-transparent transition-all duration-200"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={handleDateChange}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#00A99D]/5 to-[#42B0E8]/5 rounded-xl pointer-events-none"></div>
            </div>
            {error && (
              <p className="text-red-400/90 text-sm mt-2">{error}</p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
          <Link
            href="/onboarding/account-creation"
            className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-all duration-200 flex items-center gap-2 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00A99D] to-[#42B0E8] text-white font-medium transform hover:translate-y-[-1px] hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            disabled={!!error}>
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}
