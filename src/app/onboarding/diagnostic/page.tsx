"use client";

import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';

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
        <h1 className="text-5xl font-bold gradient-text mb-6">
          Step 3: Diagnostic Assessment
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 glassmorphic p-4 rounded-xl backdrop-blur-xl">
          This optional assessment helps us personalize your study plan. It will take about 15-20 minutes to complete.
        </p>
        
        <OnboardingProgressBar currentStep="assessment" />

      </motion.div>

      <motion.div
        className="max-w-2xl mx-auto glassmorphic p-8 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-white/90 mb-6">Why take the assessment?</h2>
        <ul className="space-y-6">
          <li className="flex items-start group">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00A99D]/10 to-[#42B0E8]/10 flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 mr-4 backdrop-blur-sm">
              <svg className="h-6 w-6 text-[#00A99D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white/90 font-medium mb-1">Identify your strengths and weaknesses</h3>
              <p className="text-white/70">Get a clear picture of which topics need more focus during your preparation.</p>
            </div>
          </li>
          <li className="flex items-start group">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00A99D]/10 to-[#42B0E8]/10 flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 mr-4 backdrop-blur-sm">
              <svg className="h-6 w-6 text-[#00A99D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-white/90 font-medium mb-1">Get a personalized study plan</h3>
              <p className="text-white/70">We'll create a custom schedule that adapts to your knowledge level and exam date.</p>
            </div>
          </li>
          <li className="flex items-start group">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00A99D]/10 to-[#42B0E8]/10 flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 mr-4 backdrop-blur-sm">
              <svg className="h-6 w-6 text-[#00A99D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white/90 font-medium mb-1">Study more efficiently</h3>
              <p className="text-white/70">Focus your time on the topics that will have the biggest impact on your success.</p>
            </div>
          </li>
        </ul>
      </motion.div>

      <div className="flex justify-between items-center mt-8 max-w-2xl mx-auto">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-all duration-200 flex items-center gap-2 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSkip}
            className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-all duration-200"
          >
            Skip for Now
          </button>
          <button
            onClick={handleStartAssessment}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00A99D] to-[#42B0E8] text-white font-medium transform hover:translate-y-[-1px] hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            Start Assessment
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
