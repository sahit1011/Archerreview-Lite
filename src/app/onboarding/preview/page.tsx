"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import PlanOverview from '@/components/plan/PlanOverview';
import WeeklySchedulePreview from '@/components/plan/WeeklySchedulePreview';
import FocusAreas, { TopicPriority } from '@/components/plan/FocusAreas';
import { useOnboarding } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';

export default function PreviewPage() {
  const router = useRouter();
  const {
    examDate,
    availableDays,
    studyHoursPerDay,
    preferredStudyTime,
    diagnosticCompleted,
    diagnosticSkipped,
    categoryScores,
    saveOnboardingData,
    registerUser,
    name,
    email,
    password,
    goToPreviousStep
  } = useOnboarding();

  // State for customized topic priorities
  const [customizedTopics, setCustomizedTopics] = useState<TopicPriority[]>([]);

  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle start plan button click
  const handleStartPlan = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we need to register the user first
      let userData;
      const userId = localStorage.getItem('userId');

      if (!userId) {
        // User hasn't been registered yet, register them first
        if (!name || !email || !password) {
          throw new Error('Missing user information. Please go back to the first step and complete the form.');
        }

        console.log('Registering user first...');
        userData = await registerUser();

        if (!userData || !userData.user || !userData.user.id) {
          throw new Error('Failed to register user. Please try again.');
        }
      }

      // Save onboarding data
      try {
        userData = await saveOnboardingData();
        console.log('User data from saveOnboardingData:', userData);

        // Make sure we have a valid user ID
        if (!userData || !userData.user || !userData.user.id) {
          throw new Error('Failed to save user data. Please try again.');
        }
      } catch (error) {
        console.error('Error in saveOnboardingData:', error);
        // If saveOnboardingData fails, try to get userId from localStorage as fallback
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('Failed to save user data and no user ID found. Please try again.');
        }

        // Create a minimal userData object with just the ID
        userData = {
          user: {
            id: userId
          }
        };
        console.log('Using fallback user data:', userData);
      }

      // Generate the study plan using the scheduler agent
      const response = await fetch('/api/plan-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.user.id.toString(), // Ensure it's a string
        }),
      });

      const data = await response.json();
      console.log('Response from plan-generation API:', data);

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to generate study plan';
        throw new Error(errorMessage);
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to generate study plan');
      }

      // Wait for a moment to ensure the plan is generated
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Make sure the user is properly authenticated in the UserContext
      // This ensures the ProtectedRoute component doesn't redirect to login
      try {
        // Store user data in localStorage to maintain authentication
        const token = localStorage.getItem('token') || '';
        localStorage.setItem('token', token);

        // Create a complete user object with all necessary fields
        const userObject = {
          id: userData.user.id,
          _id: userData.user.id, // Add _id as well since some code uses this
          name: name,
          email: email,
          examDate: examDate
        };

        // Store both user object and userId separately
        localStorage.setItem('user', JSON.stringify(userObject));
        localStorage.setItem('userId', userData.user.id);

        console.log('Authentication data stored for dashboard redirect:', {
          userId: userData.user.id,
          token: token ? 'present' : 'missing',
          userObject
        });

        // Wait a moment to ensure localStorage is updated
        await new Promise(resolve => setTimeout(resolve, 500));

        // Navigate to dashboard with the user ID and fromOnboarding flag as query parameters
        router.push(`/dashboard?userId=${userData.user.id}&fromOnboarding=true`);
      } catch (authError) {
        console.error('Error setting authentication data:', authError);
        // Still try to redirect even if there's an error
        router.push(`/dashboard?userId=${userData.user.id}&fromOnboarding=true`);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      setError(error instanceof Error ? error.message : 'There was an error saving your plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate weeks for the weekly breakdown
  const getWeeklyBreakdown = () => {
    if (!examDate) return [];

    const today = new Date();
    const weeksUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7));

    // Limit to 3 weeks for display
    const weeksToShow = Math.min(weeksUntilExam, 3);

    const weeks = [];
    for (let i = 0; i < weeksToShow; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (i * 7));

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekStartStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekEndStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      weeks.push({
        weekNumber: i + 1,
        dateRange: `${weekStartStr} - ${weekEndStr}`,
        topics: getTopicsForWeek(i + 1)
      });
    }

    return weeks;
  };

  // Get topics for a specific week based on focus areas
  const getTopicsForWeek = (weekNumber: number) => {
    // This is a simplified version - in a real app, this would be more sophisticated
    switch (weekNumber) {
      case 1:
        return 'Fundamentals of Nursing, Health Assessment';
      case 2:
        return 'Pharmacology Basics, Medication Administration';
      case 3:
        return 'Medical-Surgical Nursing: Cardiovascular, Respiratory';
      default:
        return 'General NCLEX Review';
    }
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
          Final Step: Review Your Study Plan
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 glassmorphic p-4 rounded-xl backdrop-blur-xl">
          Based on your inputs, we've created a personalized study plan to help you prepare for your NCLEX exam.
        </p>
        
        <OnboardingProgressBar currentStep="preview" />

      </motion.div>

      <motion.div
        className="max-w-4xl mx-auto glassmorphic p-8 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="space-y-12">
          {/* Plan Overview */}
          {examDate && (
            <PlanOverview
              examDate={examDate}
              studyHoursPerDay={studyHoursPerDay}
              availableDays={availableDays}
            />
          )}

          {/* Weekly Schedule */}
          <WeeklySchedulePreview
            availableDays={availableDays}
            studyHoursPerDay={studyHoursPerDay}
            preferredStudyTime={preferredStudyTime}
          />

          {/* Focus Areas */}
          <FocusAreas
            diagnosticCompleted={diagnosticCompleted}
            diagnosticSkipped={diagnosticSkipped}
            categoryScores={categoryScores}
            onUpdatePriorities={setCustomizedTopics}
          />

          {/* Weekly Breakdown */}
          <div>
            <h2 className="text-2xl font-semibold text-white/90 mb-4 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Weekly Breakdown</span>
            </h2>
            <div className="space-y-4">
              {getWeeklyBreakdown().map((week, index) => (
                <motion.div
                  key={week.weekNumber}
                  className="border border-white/10 bg-white/5 rounded-lg p-4 shadow-lg hover:bg-white/10 transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (index * 0.1) }}
                  whileHover={{ y: -3, scale: 1.01 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-[#00A99D]">Week {week.weekNumber}</h3>
                    <span className="text-sm text-white/70">{week.dateRange}</span>
                  </div>
                  <div className="text-white/90">{week.topics}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            className="bg-white/5 p-4 rounded-lg border border-white/10 shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-start">
              <svg className="h-5 w-5 text-[#00A99D] mr-3 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium text-[#00A99D]">This plan will adapt to your progress</h3>
                <p className="text-sm text-white/80 mt-1">
                  As you complete tasks and quizzes, our AI will adjust your plan to focus on areas where you need more practice.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          className="bg-red-900/20 p-4 rounded-lg border border-red-900/30 my-6 shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mr-3 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-medium text-red-400">Error</h3>
              <p className="text-sm text-white/80 mt-1">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between items-center mt-8 max-w-4xl mx-auto">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-all duration-200 flex items-center gap-2 group"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={handleStartPlan}
          className={`px-8 py-3 rounded-xl bg-gradient-to-r from-[#00A99D] to-[#42B0E8] text-white font-medium transform hover:translate-y-[-1px] hover:shadow-lg transition-all duration-200 flex items-center gap-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isLoading ? 'Generating Plan...' : 'Complete Onboarding & Start My Plan'}
        </button>
      </div>
    </OnboardingLayout>
  );
}