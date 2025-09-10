'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUser } from '@/context/UserContext';
import MonitorSummary from '@/components/dashboard/MonitorSummary';
import CombinedFocusRemediationCard from '@/components/dashboard/CombinedFocusRemediationCard';
import { useRemediationAgent } from '@/hooks/useRemediationAgent';
import AnimatedCard from '@/components/common/AnimatedCard';
import AnimatedProgressCircle from '@/components/common/AnimatedProgressCircle';
import EnhancedTaskCard from '@/components/dashboard/EnhancedTaskCard';
import EnhancedExamCountdown from '@/components/dashboard/EnhancedExamCountdown';
import ParticleBackground from '@/components/common/ParticleBackground';
import { fadeIn, fadeInUp, staggerContainer } from '@/utils/animationUtils';


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
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c-1.255 0-2.443.29-3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
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
        return 'bg-blue-100 text-blue-600';
      case 'QUIZ':
        return 'bg-purple-100 text-purple-600';
      case 'READING':
        return 'bg-green-100 text-green-600';
      case 'PRACTICE':
        return 'bg-amber-100 text-amber-600';
      case 'REVIEW':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
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
        return 'bg-red-50 text-red-800 border-red-500';
      case 'strong':
        return 'bg-green-50 text-green-800 border-green-500';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-500';
    }
  };

  // Get category score color based on score - using theme colors
  const getCategoryScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'; // Green for good scores
    if (score >= 60) return 'bg-amber-500'; // Amber for medium scores
    return 'bg-red-500'; // Red for low scores (warning)
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
            <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="bg-red-100 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Link href="/" className="text-red-600 hover:text-red-800 font-medium">
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
      <AppLayout light>
        <div className="relative min-h-screen">
          {/* Particle Background */}
          <ParticleBackground
            particleCount={25}
            colors={['#6366F1', '#8B5CF6', '#EC4899', '#10B981']}
            className="opacity-20"
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative z-10"
          >
            {/* Header */}
            <motion.div
              className="mb-8 flex justify-between items-start"
              variants={fadeIn}
            >
              <div>
                <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent tracking-tight mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Welcome back, <span className="font-semibold text-gray-800">{user?.name}</span>. Here's your focus for today.
                </p>
              </div>
            </motion.div>

            {/* Monitor Summary - Shows key insights from the Monitor Agent */}
            {user && <MonitorSummary userId={user._id} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Today's Tasks Section */}
              <div className="lg:col-span-2">
                <AnimatedCard className="p-8 mb-6" gradient>
                  <motion.div variants={fadeInUp}>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center">
                        <svg className="w-6 h-6 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Today's Tasks
                      </h2>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {format(new Date(), 'MMMM d, yyyy')}
                      </span>
                    </div>

                    {todaysTasks.length === 0 ? (
                      <motion.div
                        className="text-center py-12"
                        variants={fadeIn}
                      >
                        <motion.div
                          animate={{
                            y: [0, -10, 0],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </motion.div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">You're all caught up! 🎉</h3>
                        <p className="text-gray-600 mb-6">
                          {user?.name === "New User"
                            ? "Your study plan is being generated. Check back shortly."
                            : "No tasks scheduled for today. Explore your calendar or start a review."}
                        </p>
                        <Link
                          href={`/calendar?userId=${user?._id}`}
                          className="group inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                          <span className="mr-2">View Calendar</span>
                          <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 10l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                        </Link>
                      </motion.div>
                    ) : (
                      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-200 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                        {todaysTasks.map((task, index) => (
                          <EnhancedTaskCard
                            key={task._id}
                            task={task}
                            index={index}
                            onStatusChange={handleTaskStatusChange}
                            onTaskClick={(task) => {
                              if (task.type === 'QUIZ' && task.content) {
                                router.push(`/quiz/${task.content._id}?taskId=${task._id}&userId=${user?._id}`);
                              }
                            }}
                            userId={user?._id}
                          />
                        ))}
                      </div>
                    )}

                    <motion.div
                      className="mt-8 text-center"
                      variants={fadeIn}
                    >
                      <Link
                        href={`/calendar?userId=${user?._id}`}
                        className="group inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                      >
                        <span className="mr-2">View Full Schedule</span>
                        <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 10l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                      </Link>
                    </motion.div>
                  </motion.div>
                </AnimatedCard>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* NCLEX Readiness */}
                <AnimatedCard className="p-6" gradient delay={0.2}>
                  <motion.div variants={fadeInUp}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight flex items-center">
                      <svg className="w-6 h-6 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      NCLEX Readiness
                    </h2>
                    
                    <div className="flex justify-center mb-6">
                      <AnimatedProgressCircle
                        percentage={readinessScore.overallScore}
                        size={160}
                        strokeWidth={10}
                        label="Ready"
                        duration={2.5}
                        delay={0.5}
                      />
                    </div>

                    <div className="space-y-4">
                      {readinessScore.categoryScores.slice(0, 3).map((category, index) => (
                        <motion.div
                          key={category.category}
                          className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + index * 0.1 }}
                        >
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-700 font-medium">
                              {category.category.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                            </span>
                            <span className="font-bold text-gray-800">{category.score}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${category.score}%` }}
                              transition={{
                                duration: 1.5,
                                delay: 1.2 + index * 0.1,
                                ease: "easeOut"
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}

                      {readinessScore.categoryScores.length === 0 && (
                        <div className="text-center py-6">
                          <p className="text-gray-500">
                            {user?.name === "New User"
                              ? "Complete some tasks to see your readiness score."
                              : "No category scores available yet."}
                          </p>
                        </div>
                      )}
                    </div>

                    <motion.div
                      className="mt-6 text-center"
                      variants={fadeIn}
                    >
                      <Link
                        href={`/progress?userId=${user?._id}`}
                        className="group inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                      >
                        <span className="mr-2">View Detailed Progress</span>
                        <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 10l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                      </Link>
                    </motion.div>
                  </motion.div>
                </AnimatedCard>

                {/* Exam Countdown */}
                <AnimatedCard className="p-6" delay={0.4}>
                  <motion.div variants={fadeInUp}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight flex items-center">
                      <svg className="w-6 h-6 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Exam Countdown
                    </h2>
                    {user?.examDate ? (
                      <EnhancedExamCountdown examDate={user.examDate} />
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">📅</div>
                        <p className="text-gray-500">No exam date set.</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatedCard>
              </div>
            </div>

            {/* Combined Focus Areas and Remediation Card */}
            {user && (
              <motion.div variants={fadeInUp}>
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
              </motion.div>
            )}
          </motion.div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}