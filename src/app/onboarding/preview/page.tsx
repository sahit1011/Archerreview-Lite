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
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export default function PreviewPage() {
  const router = useRouter();
  const {
    examType,
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

  // Preview-only sample weeks, matched to the chosen exam's subjects.
  // The real schedule is generated server-side after onboarding completes.
  const getTopicsForWeek = (weekNumber: number) => {
    const weeksByExam: Record<'NEET' | 'JEE', string[]> = {
      NEET: [
        'Physics: Kinematics & Laws of Motion, Biology: Cell Structure',
        'Chemistry: Atomic Structure, Biology: Human Physiology',
        'Biology: Genetics & Evolution, Physics: Current Electricity',
      ],
      JEE: [
        'Physics: Kinematics & Laws of Motion, Mathematics: Quadratics',
        'Chemistry: Atomic Structure, Physics: Work, Energy & Power',
        'Mathematics: Calculus, Chemistry: Equilibrium & Kinetics',
      ],
    };
    const weeks = weeksByExam[examType === 'JEE' ? 'JEE' : 'NEET'];
    return weeks[weekNumber - 1] || `General ${examType || 'NEET/JEE'} Review`;
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
          Step 5 of 5 · Your plan
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
          Review your study plan
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Built from your inputs — a personalized plan to get you ready for your{' '}
          {examType || 'NEET / JEE'} exam. Take a look, then start studying.
        </p>

        <OnboardingProgressBar currentStep="preview" />
      </motion.div>

      <motion.div
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Framed plan summary — hairline-divided sections */}
        <div className="divide-y divide-border">
          {/* Plan Overview */}
          {examDate && (
            <div className="p-6 sm:p-8">
              <PlanOverview
                examDate={examDate}
                studyHoursPerDay={studyHoursPerDay}
                availableDays={availableDays}
              />
            </div>
          )}

          {/* Weekly Schedule */}
          <div className="p-6 sm:p-8">
            <WeeklySchedulePreview
              availableDays={availableDays}
              studyHoursPerDay={studyHoursPerDay}
              preferredStudyTime={preferredStudyTime}
            />
          </div>

          {/* Focus Areas */}
          <div className="p-6 sm:p-8">
            <FocusAreas
              diagnosticCompleted={diagnosticCompleted}
              diagnosticSkipped={diagnosticSkipped}
              categoryScores={categoryScores}
              onUpdatePriorities={setCustomizedTopics}
            />
          </div>

          {/* Weekly Breakdown — hairline ledger, only once plan data exists */}
          {getWeeklyBreakdown().length > 0 && (
            <div className="p-6 sm:p-8">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Weekly breakdown
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">The first weeks</h2>
              <ol className="mt-5 overflow-hidden rounded-xl border border-border bg-secondary/40 divide-y divide-border">
                {getWeeklyBreakdown().map((week, index) => (
                  <motion.li
                    key={week.weekNumber}
                    className="grid grid-cols-1 gap-1.5 px-5 py-4 sm:grid-cols-12 sm:items-baseline sm:gap-4"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.08, duration: 0.35 }}
                  >
                    <div className="flex items-baseline gap-2 sm:col-span-3">
                      <span className="font-mono text-[0.7rem] text-muted-foreground">
                        {String(week.weekNumber).padStart(2, '0')}
                      </span>
                      <span className="font-display text-sm font-semibold text-foreground">
                        Week {week.weekNumber}
                      </span>
                    </div>
                    <span className="font-mono text-[0.7rem] text-muted-foreground sm:col-span-3">
                      {week.dateRange}
                    </span>
                    <span className="text-sm text-foreground sm:col-span-6">{week.topics}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
          )}

          {/* Adaptive note — quiet framed callout, single accent */}
          <div className="p-6 sm:p-8">
            <motion.div
              className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-display text-sm font-semibold text-foreground">
                  This plan adapts to your progress
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  As you complete tasks and quizzes, the AI adjusts your plan to focus on the topics
                  where you need more practice.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          className="max-w-4xl mx-auto flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 my-6 text-sm text-destructive"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <h3 className="font-semibold">Something went wrong</h3>
            <p className="mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 max-w-4xl mx-auto">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={goToPreviousStep}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          variant="brand"
          size="lg"
          onClick={handleStartPlan}
          disabled={isLoading}
          className="shine"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating plan…
            </>
          ) : (
            <>
              Complete onboarding &amp; start my plan
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
