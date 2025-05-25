"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/context/OnboardingContext';

export default function PreviewPage() {
  const router = useRouter();
  const {
    examDate,
    goToPreviousStep
  } = useOnboarding();

  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle start plan button click
  const handleStartPlan = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate plan generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving plan:', error);
      setError(error instanceof Error ? error.message : 'There was an error saving your plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <div className="max-w-4xl w-full bg-card-background-dark rounded-xl shadow-md border border-border-color-dark p-8 my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-archer-bright-teal mb-4">
            Final Step: Review Your Study Plan
          </h1>
          <p className="text-archer-light-text max-w-2xl mx-auto">
            Based on your inputs, we've created a personalized study plan to help you prepare for your NCLEX exam.
          </p>
        </div>

        <div className="mb-8 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-archer-white mb-4">Plan Overview</h2>
            <p className="text-archer-light-text">
              Your exam is scheduled for {examDate ? examDate.toLocaleDateString() : 'the future'}.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 p-4 rounded-lg border border-red-900/30 mb-6 shadow-card">
            <div className="flex items-start">
              <div>
                <h3 className="font-medium text-red-400">Error</h3>
                <p className="text-sm text-archer-light-text mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={goToPreviousStep}
            className="bg-archer-dark-teal hover:bg-archer-dark-teal/80 text-archer-light-text font-medium py-2 px-4 rounded-lg text-center transition-colors shadow-button"
            disabled={isLoading}
          >
            Back
          </button>
          <button
            onClick={handleStartPlan}
            className={`${
              isLoading
                ? 'bg-archer-bright-teal/50 cursor-not-allowed'
                : 'bg-archer-bright-teal hover:bg-archer-bright-teal/90'
            } text-archer-dark-bg font-medium py-2 px-4 rounded-lg text-center transition-colors flex items-center shadow-button`}
            disabled={isLoading}
          >
            {isLoading ? 'Generating Plan...' : 'Complete Onboarding & Start My Plan'}
          </button>
        </div>
      </div>
      <footer className="text-center text-archer-light-text/70 text-sm mb-8">
        <p>© 2024 ArcherReview. This is a prototype for demonstration purposes.</p>
      </footer>
    </div>
  );
}
