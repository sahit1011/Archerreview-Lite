"use client";

import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';

export default function DiagnosticPage() {
  const { goToPreviousStep, goToNextStep, setDiagnosticSkipped, goToStep } = useOnboarding();

  // Handle skip button click
  const handleSkip = () => {
    setDiagnosticSkipped(true);
    goToStep(OnboardingStep.SCHEDULE);
  };

  // Handle start assessment button click
  const handleStartAssessment = () => {
    setDiagnosticSkipped(false);
    goToStep(OnboardingStep.ASSESSMENT);
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
          Step 3: Diagnostic Assessment
        </h1>
        <p className="text-archer-light-text max-w-2xl mx-auto">
          This optional assessment helps us personalize your study plan. It will take about 15-20 minutes to complete.
        </p>
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-archer-dark-teal text-archer-light-text flex items-center justify-center font-bold">✓</div>
            <div className="w-16 h-1 bg-archer-bright-teal"></div>
            <div className="w-8 h-8 rounded-full bg-archer-dark-teal text-archer-light-text flex items-center justify-center font-bold">✓</div>
            <div className="w-16 h-1 bg-archer-bright-teal"></div>
            <div className="w-8 h-8 rounded-full bg-archer-bright-teal text-archer-dark-bg flex items-center justify-center font-bold">3</div>
            <div className="w-16 h-1 bg-archer-dark-teal/30"></div>
            <div className="w-8 h-8 rounded-full bg-archer-dark-teal text-archer-light-text flex items-center justify-center font-bold">4</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-archer-dark-teal/30 p-6 rounded-lg border border-archer-dark-teal/50 mb-8 shadow-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-archer-bright-teal mb-4">Why take the assessment?</h2>
        <ul className="space-y-2 text-archer-light-text">
          <li className="flex items-start">
            <svg className="h-5 w-5 text-archer-bright-teal mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Identify your strengths and weaknesses</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-archer-bright-teal mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Get a more personalized study plan</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-archer-bright-teal mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Focus your study time more efficiently</span>
          </li>
        </ul>
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
        <div className="space-x-4">
          <button
            onClick={handleSkip}
            className="bg-archer-dark-teal hover:bg-archer-dark-teal/80 text-archer-light-text font-medium py-2 px-4 rounded-lg text-center transition-colors shadow-button"
          >
            Skip for Now
          </button>
          <button
            onClick={handleStartAssessment}
            className="bg-archer-bright-teal hover:bg-archer-bright-teal/90 text-archer-dark-bg font-medium py-2 px-4 rounded-lg text-center transition-colors shadow-button"
          >
            Start Assessment
          </button>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}
