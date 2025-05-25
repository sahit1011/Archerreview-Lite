'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUser } from '@/context/UserContext';
import AlertButton from '@/components/common/AlertButton';
import MonitorSummary from '@/components/dashboard/MonitorSummary';
import CombinedFocusRemediationCard from '@/components/dashboard/CombinedFocusRemediationCard';
import { useRemediationAgent } from '@/hooks/useRemediationAgent';

// Exam Countdown Component
const ExamCountdown = ({ examDate }: { examDate: Date | string }) => {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    // Format the exam date
    const examDateObj = new Date(examDate);
    setFormattedDate(format(examDateObj, 'MMMM d, yyyy'));

    // Calculate initial days remaining
    const calculateDaysRemaining = () => {
      const now = new Date();
      const examDateObj = new Date(examDate);
      const timeDiff = examDateObj.getTime() - now.getTime();
      return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    };

    setDaysRemaining(calculateDaysRemaining());

    // Update days remaining every minute
    const intervalId = setInterval(() => {
      setDaysRemaining(calculateDaysRemaining());
    }, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [examDate]);

  return (
    <>
      <div className="text-4xl font-bold text-archer-bright-teal mb-2">
        {daysRemaining}
      </div>
      <div className="text-archer-light-text">Days Remaining</div>
      <div className="mt-4 text-sm text-archer-light-text/70">
        Exam Date: {formattedDate}
      </div>
    </>
  );
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user: authUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [readinessScore, setReadinessScore] = useState({
    overallScore: 0,
    categoryScores: [] as { category: string; score: number }[],
    weakAreas: [] as any[],
    strongAreas: [] as any[]
  });
  const {
    remediationSuggestions = [],
    resolveSuggestion,
    scheduleReviewSession,
    startTutorSession,
    runRemediationAgent
  } = useRemediationAgent();
  const [user, setUser] = useState<any>(null);
  const [focusAreas, setFocusAreas] = useState<any[]>([]);

  // Gamification functionality completely removed

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Check if we're coming from onboarding
        const fromOnboarding = searchParams.get('fromOnboarding');
        const userId = searchParams.get('userId') || (authUser && authUser.id);

        console.log('Dashboard load - fromOnboarding:', fromOnboarding, 'userId:', userId);

        if (!userId) {
          // Check if we have a userId in localStorage
          const localStorageUserId = localStorage.getItem('userId');

          if (localStorageUserId) {
            console.log('Using userId from localStorage:', localStorageUserId);
            // Use the userId from localStorage
            const userResponse = await fetch(`/api/users/${localStorageUserId}`);
            const userData = await userResponse.json();
            console.log('User API response:', userData);

            if (userData.success) {
              const user = userData.user;
              console.log('User from localStorage:', user);
              setUser(user);
            } else {
              throw new Error('Failed to fetch user from localStorage userId');
            }
          } else {
            throw new Error('User not authenticated');
          }
        } else {
          // Use the userId from the URL or authUser
          console.log('Using userId from URL or authUser:', userId);
          const userResponse = await fetch(`/api/users/${userId}`);
          const userData = await userResponse.json();
          console.log('User API response:', userData);

          if (!userData.success) {
            console.error('Failed to fetch user:', userData);
            throw new Error('Failed to fetch the authenticated user.');
          }

          const user = userData.user;
          console.log('Authenticated user:', user);

          setUser(user);
        }

        // If we're coming from onboarding, we should have a userId in the URL
        const isFromOnboarding = searchParams.get('fromOnboarding');
        const urlUserId = searchParams.get('userId');

        // If we don't have a user yet but we have a userId in the URL, fetch the user
        if ((!user || !user._id) && urlUserId) {
          console.log('No user found yet, but we have a userId in the URL:', urlUserId);
          try {
            const userResponse = await fetch(`/api/users/${urlUserId}`);
            const userData = await userResponse.json();

            if (userData.success) {
              console.log('Fetched user from URL userId:', userData.user);
              setUser(userData.user);

              // Create a new variable to use for the rest of the function
              const fetchedUser = userData.user;

              // Get the user's study plan using the fetched user
              console.log('Fetching study plan for user:', fetchedUser._id);
              const planResponse = await fetch(`/api/study-plans?userId=${fetchedUser._id}`);
              const planData = await planResponse.json();

              // If no study plan is found, check if we're coming from onboarding
              if (!planData.success || !planData.studyPlan) {
                // Check if we're coming from onboarding (check for fromOnboarding query param)
                if (!isFromOnboarding) {
                  console.log('No study plan found, redirecting to onboarding');

                  // Clear any existing user data before redirecting to onboarding
                  // This ensures a fresh start for the onboarding process
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('userId');

                  router.push('/onboarding/account-creation');
                  return;
                } else {
                  console.log('Coming from onboarding, not redirecting despite missing study plan');
                  // Continue without redirecting, the plan might be in the process of being created
                }
              }

              // Get today's tasks
              const today = new Date();
              const formattedDate = format(today, 'yyyy-MM-dd');
              console.log(`Fetching tasks for plan: ${planData.studyPlan?._id} and date: ${formattedDate}`);

              if (planData.studyPlan && planData.studyPlan._id) {
                const tasksResponse = await fetch(`/api/tasks?planId=${planData.studyPlan._id}&date=${formattedDate}`);
                const tasksData = await tasksResponse.json();
                console.log('Tasks API response:', tasksData);

                if (tasksData.success) {
                  setTodaysTasks(tasksData.tasks || []);
                  console.log(`Set ${tasksData.tasks?.length || 0} tasks for today`);
                }
              }

              // Get readiness score
              console.log(`Fetching readiness score for user: ${fetchedUser._id}`);
              const readinessResponse = await fetch(`/api/readiness-score?userId=${fetchedUser._id}`);
              const readinessData = await readinessResponse.json();
              console.log('Readiness score API response:', readinessData);

              if (readinessData.success) {
                const readinessScoreData = readinessData.readinessScore || {
                  overallScore: 0,
                  categoryScores: [],
                  weakAreas: [],
                  strongAreas: []
                };

                setReadinessScore(readinessScoreData);
                console.log(`Set readiness score: ${readinessScoreData.overallScore}%`);

                // Set focus areas based on weak and strong areas
                const areas = [
                  ...(readinessData.readinessScore?.weakAreas || []).map((area: any) => ({
                    ...area,
                    type: 'weak',
                    message: 'This area needs improvement. Focus on strengthening your knowledge here.'
                  })),
                  ...(readinessData.readinessScore?.strongAreas || []).slice(0, 1).map((area: any) => ({
                    ...area,
                    type: 'strong',
                    message: 'You\'re doing well here! Continue practicing to maintain your strong performance.'
                  }))
                ];

                setFocusAreas(areas);
                console.log(`Set ${areas.length} focus areas`);
              }

              setLoading(false);
              return; // Exit the function early since we've handled everything
            } else {
              throw new Error('Failed to fetch user from URL userId');
            }
          } catch (error) {
            console.error('Error fetching user from URL:', error);
            throw new Error('Failed to fetch user from URL userId');
          }
        }

        // If we have a user from the auth context, use it
        if (user && user._id) {
          console.log('Using user from auth context:', user._id);

          try {
            // Get the user's study plan
            console.log('Fetching study plan for user:', user._id);
            const planResponse = await fetch(`/api/study-plans?userId=${user._id}`);
            const planData = await planResponse.json();

            // If no study plan is found, check if we're coming from onboarding
            if (!planData.success || !planData.studyPlan) {
              // Check if we're coming from onboarding (check for fromOnboarding query param)
              if (!isFromOnboarding) {
                console.log('No study plan found, redirecting to onboarding');

                // Clear any existing user data before redirecting to onboarding
                // This ensures a fresh start for the onboarding process
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userId');

                router.push('/onboarding/account-creation');
                return;
              } else {
                console.log('Coming from onboarding, not redirecting despite missing study plan');
                // Continue without redirecting, the plan might be in the process of being created
              }
            }

            // Get today's tasks
            const today = new Date();
            const formattedDate = format(today, 'yyyy-MM-dd');
            console.log(`Fetching tasks for plan: ${planData.studyPlan?._id} and date: ${formattedDate}`);

            if (planData.studyPlan && planData.studyPlan._id) {
              const tasksResponse = await fetch(`/api/tasks?planId=${planData.studyPlan._id}&date=${formattedDate}`);
              const tasksData = await tasksResponse.json();
              console.log('Tasks API response:', tasksData);

              if (tasksData.success) {
                setTodaysTasks(tasksData.tasks || []);
                console.log(`Set ${tasksData.tasks?.length || 0} tasks for today`);
              }
            }

            // Get readiness score
            console.log(`Fetching readiness score for user: ${user._id}`);
            const readinessResponse = await fetch(`/api/readiness-score?userId=${user._id}`);
            const readinessData = await readinessResponse.json();
            console.log('Readiness score API response:', readinessData);

            if (readinessData.success) {
              const readinessScoreData = readinessData.readinessScore || {
                overallScore: 0,
                categoryScores: [],
                weakAreas: [],
                strongAreas: []
              };

              setReadinessScore(readinessScoreData);
              console.log(`Set readiness score: ${readinessScoreData.overallScore}%`);

              // Set focus areas based on weak and strong areas
              const areas = [
                ...(readinessData.readinessScore?.weakAreas || []).map((area: any) => ({
                  ...area,
                  type: 'weak',
                  message: 'This area needs improvement. Focus on strengthening your knowledge here.'
                })),
                ...(readinessData.readinessScore?.strongAreas || []).slice(0, 1).map((area: any) => ({
                  ...area,
                  type: 'strong',
                  message: 'You\'re doing well here! Continue practicing to maintain your strong performance.'
                }))
              ];

              setFocusAreas(areas);
              console.log(`Set ${areas.length} focus areas`);
            }
          } catch (error) {
            console.error('Error fetching dashboard data for authenticated user:', error);
            setError('Failed to load dashboard data. Please try again later.');
          }
        } else {
          // If we don't have a user from either source, show an error
          throw new Error('User not found or missing ID');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);

        // If the error is about no study plan, redirect to onboarding
        if (err instanceof Error && err.message.includes('No study plan found')) {
          console.log('No study plan found, redirecting to onboarding');
          router.push('/onboarding/welcome');
          return;
        }

        setError(err instanceof Error ? err.message : 'An error occurred while loading dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [searchParams, authUser, router]);

  // Get task icon based on type
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            <path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'QUIZ':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        );
      case 'READING':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'PRACTICE':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'REVIEW':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Get task background color based on type - using theme variables for consistency
  const getTaskBgColor = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'bg-archer-light-blue/20 text-archer-light-blue';
      case 'QUIZ':
        return 'bg-archer-bright-teal/20 text-archer-bright-teal';
      case 'READING':
        return 'bg-green-400/20 text-green-400';
      case 'PRACTICE':
        return 'bg-amber-400/20 text-amber-400';
      case 'REVIEW':
        return 'bg-red-400/20 text-red-400';
      default:
        return 'bg-archer-light-text/10 text-archer-light-text';
    }
  };

  // Handle task status change
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update task status');
      }

      // Update the task in the local state
      setTodaysTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId
            ? { ...task, status: newStatus }
            : task
        )
      );

      // Update readiness score if it was returned (for both completed and pending status changes)
      if (data.readinessScore) {
        console.log('Updating readiness score in UI from', readinessScore.overallScore, 'to', data.readinessScore.overallScore);
        setReadinessScore(data.readinessScore);
      }

      return data.task;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  // Get focus area background color based on type
  const getFocusAreaBgColor = (type: string) => {
    // These are status colors, might keep them distinct or map to theme status colors if defined
    switch (type) {
      case 'weak':
        return 'bg-red-900/20 text-red-400';
      case 'strong':
        return 'bg-green-900/20 text-green-400';
      default:
        return 'bg-archer-light-blue/20 text-archer-light-blue';
    }
  };

  // Get category score color based on score - using theme colors
  const getCategoryScoreColor = (score: number) => {
    if (score >= 80) return 'bg-archer-bright-teal'; // Teal for good scores
    if (score >= 60) return 'bg-archer-light-blue'; // Light blue for medium scores
    return 'bg-red-400'; // Keep red for low scores (warning)
  };

  // Handle refreshing focus areas
  const handleRefreshFocusAreas = async () => {
    if (!user) return;

    try {
      // Recalculate readiness score
      const response = await fetch('/api/readiness-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await response.json();

      if (data.success) {
        setReadinessScore(data.readinessScore);

        // Update focus areas
        const areas = [
          ...(data.readinessScore?.weakAreas || []).map((area: any) => ({
            ...area,
            type: 'weak',
            message: 'This area needs improvement. Focus on strengthening your knowledge here.'
          })),
          ...(data.readinessScore?.strongAreas || []).slice(0, 1).map((area: any) => ({
            ...area,
            type: 'strong',
            message: 'You\'re doing well here! Continue practicing to maintain your strong performance.'
          }))
        ];

        setFocusAreas(areas);
      }
    } catch (err) {
      console.error('Error refreshing focus areas:', err);
    }
  };

  // Handle starting a tutor session from remediation suggestion
  const handleStartTutorSession = (prompt: string, topicName?: string) => {
    if (!user || !user._id) {
      console.error('User not found or missing ID');
      return;
    }

    // Create a conversation title based on the topic name
    const conversationTitle = topicName ? `Help with ${topicName}` : 'New Conversation';

    // Redirect to the main tutor page with the prompt and conversation title
    router.push(`/tutor?prompt=${encodeURIComponent(prompt)}&title=${encodeURIComponent(conversationTitle)}&userId=${user._id}`);
  };

  // Generate remediation suggestions
  const handleGenerateRemediationSuggestions = async () => {
    if (!user || !user._id) {
      console.error('User not found or missing ID');
      return;
    }

    try {
      await runRemediationAgent();
    } catch (error) {
      console.error('Error running remediation agent:', error);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-t-4 border-archer-bright-teal border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-archer-light-text">Loading your dashboard...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="bg-red-900/20 border border-red-900/30 text-red-400 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Link href="/" className="text-red-400 hover:text-red-300 font-medium">
                Back to Home →
              </Link>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-archer-white">Dashboard</h1>
            <p className="text-archer-light-text/80">Welcome back, {user?.name}! Here's your study plan for today.</p>
          </div>
          <div className="flex space-x-4">
            {user && <AlertButton userId={user._id} />}
          </div>
        </div>

        {/* Monitor Summary - Shows key insights from the Monitor Agent */}
        {user && <MonitorSummary userId={user._id} />}

      {/* Gamification Section - Completely removed */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-card-background-dark rounded-xl shadow-card p-6 mb-6 hover:shadow-card-hover transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-archer-white">Today's Tasks</h2>
              <span className="text-sm text-archer-light-text/70">{format(new Date(), 'MMMM d, yyyy')}</span>
            </div>

            {todaysTasks.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-archer-light-text/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-archer-light-text">No tasks for today</h3>
                <p className="mt-1 text-sm text-archer-light-text/70">
                  {user?.name === "New User"
                    ? "You don't have any tasks scheduled yet. Your study plan will be generated soon."
                    : "You don't have any tasks scheduled for today."}
                </p>
                <div className="mt-6">
                  <Link
                    href={`/calendar?userId=${user?._id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-archer-dark-teal bg-archer-bright-teal hover:bg-archer-bright-teal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-archer-bright-teal"
                  >
                    View Calendar
                  </Link>
                </div>
              </div>
            ) : (
              <div className="h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-archer-bright-teal scrollbar-track-archer-dark-teal/30 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                <div className="space-y-4">
                  {todaysTasks.map((task) => (
                    <div
                      key={task._id}
                      className={`bg-card-background-lighter rounded-lg p-4 hover:bg-archer-dark-teal/50 shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1 ${task.type === 'QUIZ' && task.content ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        // Only navigate to quiz interface for quiz tasks
                        if (task.type === 'QUIZ' && task.content) {
                          router.push(`/quiz/${task.content._id}?taskId=${task._id}&userId=${user?._id}`);
                        }
                        // No action for other task types when clicking the card
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full ${getTaskBgColor(task.type)} flex items-center justify-center mr-3 shadow-button`}>
                            {getTaskIcon(task.type)}
                          </div>
                          <div>
                            <h3 className="font-medium text-archer-white">{task.title}</h3>
                            <div className="text-sm text-archer-light-text/70">
                              {task.type === 'QUIZ' ? `${task.description} • ${task.duration} minutes` : task.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-green-900/20 text-green-400 text-xs font-medium px-3 py-1 rounded-full shadow-button mr-2">
                            {format(new Date(task.startTime), 'h:mm a')}
                          </div>
                          {task.status !== 'COMPLETED' && (
                            <div className="relative group">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent the parent onClick from firing
                                  handleTaskStatusChange(task._id, 'COMPLETED');
                                }}
                                className="bg-green-900/30 text-green-400 hover:text-green-300 p-1.5 rounded-full hover:bg-green-900/50 transition-all shadow-button hover:shadow-card-hover"
                                aria-label="Mark as completed"
                              >
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <div className="absolute right-0 top-full mt-2 w-40 bg-archer-dark-teal text-archer-light-text text-xs rounded-lg py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                Click to mark as completed
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {task.status !== 'PENDING' && (
                        <div className="mt-2 flex justify-end">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full shadow-button ${
                            task.status === 'COMPLETED'
                              ? 'bg-green-900/20 text-green-400'
                              : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-900/20 text-blue-400'
                                : 'bg-archer-light-text/10 text-archer-light-text/80'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href={`/calendar?userId=${user?._id}`}
                className="inline-flex items-center px-4 py-2 bg-archer-bright-teal text-archer-dark-teal rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1"
              >
                View Full Schedule →
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
            <h2 className="text-xl font-semibold text-archer-white mb-4">NCLEX Readiness</h2>
            <div className="flex justify-center mb-4">
              <div className="relative h-36 w-36">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-archer-bright-teal">{readinessScore.overallScore}%</div>
                    <div className="text-sm text-archer-light-text/70">Ready</div>
                  </div>
                </div>
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--archer-dark-teal)"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--archer-bright-teal)"
                    strokeWidth="3"
                    strokeDasharray={`${readinessScore.overallScore}, 100`}
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-3 text-archer-light-text">
              {readinessScore.categoryScores.slice(0, 3).map((category) => (
                <div key={category.category} className="bg-card-background-dark p-3 rounded-lg shadow-button">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-archer-light-text/80">{category.category.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}</span>
                    <span className="font-medium text-archer-light-text">{category.score}%</span>
                  </div>
                  <div className="w-full bg-archer-dark-teal rounded-full h-2">
                    <div className={`${getCategoryScoreColor(category.score)} h-2 rounded-full`} style={{ width: `${category.score}%` }}></div>
                  </div>
                </div>
              ))}

              {readinessScore.categoryScores.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-archer-light-text/70">
                    {user?.name === "New User"
                      ? "Complete some tasks to see your readiness score."
                      : "No category scores available yet."}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 text-center">
              <Link
                href={`/progress?userId=${user?._id}`}
                className="inline-flex items-center px-4 py-2 bg-archer-bright-teal text-archer-dark-teal rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1"
              >
                View Detailed Progress →
              </Link>
            </div>
          </div>

          <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6">
            <h2 className="text-xl font-semibold text-archer-white mb-4">Exam Countdown</h2>
            <div className="text-center">
              {user?.examDate ? (
                <div className="bg-card-background-dark p-6 rounded-lg shadow-button">
                  <ExamCountdown examDate={user.examDate} />
                </div>
              ) : (
                <div className="text-sm text-archer-light-text/70 py-4">
                  No exam date set.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Combined Focus Areas and Remediation Card */}
      {user && (
        <CombinedFocusRemediationCard
          focusAreas={focusAreas}
          remediationSuggestions={remediationSuggestions}
          onRefreshFocusAreas={handleRefreshFocusAreas}
          onGenerateRemediationSuggestions={handleGenerateRemediationSuggestions}
          onResolve={resolveSuggestion}
          onStartTutorSession={startTutorSession}
          onScheduleReview={scheduleReviewSession}
          userId={user._id}
        />
      )}
    </AppLayout>
    </ProtectedRoute>
  );
}
