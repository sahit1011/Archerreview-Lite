"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';

// Helper function to get category display name
const getCategoryDisplayName = (category: string) => {
  const words = category.split('_');
  return words.map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
};

// Helper function to get color based on score
const getScoreColor = (score: number) => {
  if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
  if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
  return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
};

export default function AssessmentResultsPage() {
  const { 
    categoryScores, 
    overallScore, 
    diagnosticCompleted,
    diagnosticAnswers,
    saveDiagnosticResults,
    goToStep
  } = useOnboarding();

  // Redirect to diagnostic page if accessed directly without completing assessment
  useEffect(() => {
    if (!diagnosticCompleted || diagnosticAnswers.length === 0) {
      goToStep(OnboardingStep.DIAGNOSTIC);
    } else {
      // Save diagnostic results
      saveDiagnosticResults().catch(error => {
        console.error('Failed to save diagnostic results:', error);
      });
    }
  }, [diagnosticCompleted, diagnosticAnswers.length, saveDiagnosticResults, goToStep]);

  // Handle continue button click
  const handleContinue = () => {
    goToStep(OnboardingStep.SCHEDULE);
  };

  return (
    <OnboardingLayout>
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">
          Assessment Results
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Based on your answers, we've identified your strengths and areas for improvement.
        </p>
      </motion.div>

      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Overall score */}
        <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-indigo-700 mb-2">Overall Readiness</h2>
              <p className="text-indigo-600 mb-4 md:mb-0">
                Your baseline knowledge assessment shows your current readiness level.
              </p>
            </div>
            <div className="flex items-center justify-center bg-white rounded-full h-32 w-32 border-4 border-indigo-200">
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600">{Math.round(overallScore)}%</div>
                <div className="text-sm text-indigo-500">Readiness</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category scores */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance by Category</h2>
        <div className="space-y-4">
          {categoryScores.map((categoryScore, index) => {
            const { bg, text, border } = getScoreColor(categoryScore.score);
            return (
              <motion.div
                key={categoryScore.category}
                className={`p-4 rounded-lg ${bg} ${border} border`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (index * 0.1) }}
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className={`font-medium ${text}`}>
                    {getCategoryDisplayName(categoryScore.category)}
                  </h3>
                  <span className={`font-medium ${text}`}>
                    {Math.round(categoryScore.score)}%
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-indigo-600" 
                    style={{ width: `${categoryScore.score}%` }}
                  ></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-start">
          <svg className="h-6 w-6 text-blue-500 mr-3 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-medium text-blue-800 mb-2">What's Next?</h3>
            <p className="text-blue-700">
              Based on these results, we'll create a personalized study plan that focuses on your areas for improvement while reinforcing your strengths. The plan will adapt as you progress through your studies.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <button
          onClick={() => goToStep(OnboardingStep.ASSESSMENT)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg text-center transition-colors"
        >
          Back to Assessment
        </button>
        <button
          onClick={handleContinue}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-center transition-colors"
        >
          Continue to Schedule
        </button>
      </motion.div>
    </OnboardingLayout>
  );
}
