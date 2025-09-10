'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUser } from '@/context/UserContext';
import PerformanceCharts from '@/components/progress/PerformanceCharts';
import TopicBreakdown from '@/components/progress/TopicBreakdown';
import ReadinessDetails from '@/components/progress/ReadinessDetails';
import PlanAdaptations from '@/components/progress/PlanAdaptations';
import MonitorInsights from '@/components/dashboard/MonitorInsights';
import {
  LongTermTrends,
  PlanVersionManagement,
  PredictivePerformance,
  PlanReviewOptimization
} from '@/components/evolution';

export default function ProgressPage() {
  const { user: authUser, isLoading: authLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'performance' | 'readiness' | 'adaptations' | 'evolution'>('overview');
  const [activeSubTab, setActiveSubTab] = useState('overall'); // Default for performance tab
  const [evolutionSubTab, setEvolutionSubTab] = useState('trends'); // Separate state for evolution tab

  // Readiness score data
  const [readinessScore, setReadinessScore] = useState({
    overallScore: 0,
    projectedScore: 0,
    categoryScores: [] as { category: string; score: number }[],
    weakAreas: [] as any[],
    strongAreas: [] as any[]
  });

  // Task completion data
  const [completedTasks, setCompletedTasks] = useState({
    total: 0,
    completed: 0,
    byType: [] as { type: string; total: number; completed: number }[]
  });

  // Performance history data
  const [performanceHistory, setPerformanceHistory] = useState([
    { date: '2023-04-01', score: 55 },
    { date: '2023-04-08', score: 58 },
    { date: '2023-04-15', score: 62 },
    { date: '2023-04-22', score: 65 },
    { date: '2023-04-29', score: 68 },
    { date: '2023-05-06', score: 72 },
    { date: '2023-05-13', score: 75 }
  ]);

  // Topic breakdown data
  const [topics, setTopics] = useState<Array<{
    _id: string;
    name: string;
    category: string;
    score?: number;
    subtopics?: Array<{
      _id: string;
      name: string;
      category: string;
      score?: number;
    }>;
  }>>([]);

  // Plan adaptations data
  const [adaptations, setAdaptations] = useState<Array<{
    _id: string;
    type: 'RESCHEDULE' | 'DIFFICULTY_ADJUSTMENT' | 'CONTENT_ADDITION' | 'PLAN_REBALANCE' | 'REMEDIAL_CONTENT';
    description: string;
    reason: string;
    date: string;
    topicId?: string;
    topicName?: string;
    taskId?: string;
    taskTitle?: string;
    metadata?: Record<string, any>;
  }>>([]);

  // Helper function to process task completion stats
  const processTaskCompletionStats = (tasks: any[]) => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'COMPLETED').length;

    // Group tasks by type
    const tasksByType: Record<string, { total: number; completed: number }> = {};

    tasks.forEach(task => {
      if (!tasksByType[task.type]) {
        tasksByType[task.type] = {
          total: 0,
          completed: 0
        };
      }

      tasksByType[task.type].total += 1;

      if (task.status === 'COMPLETED') {
        tasksByType[task.type].completed += 1;
      }
    });

    // Convert to array format
    const byType = Object.entries(tasksByType).map(([type, data]) => ({
      type,
      total: data.total,
      completed: data.completed
    }));

    return { total, completed, byType };
  };

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);

        // Use the authenticated user
        if (authLoading) {
          return; // Wait for auth to complete
        }

        if (!authUser) {
          throw new Error('You must be logged in to view this page.');
        }

        // Fetch actual readiness score data from API
        const readinessResponse = await fetch(`/api/readiness-score?userId=${authUser.id}`);
        const readinessData = await readinessResponse.json();

        if (readinessData.success && readinessData.readinessScore) {
          console.log('Fetched readiness score:', readinessData.readinessScore);
          setReadinessScore({
            overallScore: readinessData.readinessScore.overallScore || 0,
            projectedScore: readinessData.readinessScore.projectedScore || 0,
            categoryScores: readinessData.readinessScore.categoryScores || [],
            weakAreas: readinessData.readinessScore.weakAreas || [],
            strongAreas: readinessData.readinessScore.strongAreas || []
          });
        } else {
          console.warn('Failed to fetch readiness score or no data available');
        }

        // Get user's study plan
        const planResponse = await fetch(`/api/study-plans?userId=${authUser.id}`);
        const planData = await planResponse.json();

        if (planData.success && planData.studyPlan) {
          // Fetch all tasks for the study plan
          const tasksResponse = await fetch(`/api/tasks?planId=${planData.studyPlan._id}`);
          const tasksData = await tasksResponse.json();

          if (tasksData.success && tasksData.tasks) {
            // Process task completion stats
            const taskStats = processTaskCompletionStats(tasksData.tasks);
            setCompletedTasks(taskStats);
          }
        }

        // Mock performance history data
        setPerformanceHistory([
          { date: '2023-04-01', score: 55 },
          { date: '2023-04-08', score: 58 },
          { date: '2023-04-15', score: 62 },
          { date: '2023-04-22', score: 65 },
          { date: '2023-04-29', score: 68 },
          { date: '2023-05-06', score: 72 },
          { date: '2023-05-13', score: 75 }
        ]);

        // Mock topic data
        setTopics([
          {
            _id: '1',
            name: 'Pharmacology',
            category: 'PHARMACOLOGICAL_THERAPIES',
            score: 65,
            subtopics: [
              { _id: '1-1', name: 'Anticoagulants', category: 'PHARMACOLOGICAL_THERAPIES', score: 60 },
              { _id: '1-2', name: 'Pain Management', category: 'PHARMACOLOGICAL_THERAPIES', score: 70 }
            ]
          },
          {
            _id: '2',
            name: 'Cardiovascular',
            category: 'PHYSIOLOGICAL_ADAPTATION',
            score: 68,
            subtopics: [
              { _id: '2-1', name: 'Heart Failure', category: 'PHYSIOLOGICAL_ADAPTATION', score: 65 },
              { _id: '2-2', name: 'Arrhythmias', category: 'PHYSIOLOGICAL_ADAPTATION', score: 70 }
            ]
          },
          {
            _id: '3',
            name: 'Health Promotion',
            category: 'HEALTH_PROMOTION',
            score: 85,
            subtopics: [
              { _id: '3-1', name: 'Immunizations', category: 'HEALTH_PROMOTION', score: 80 },
              { _id: '3-2', name: 'Nutrition', category: 'HEALTH_PROMOTION', score: 90 }
            ]
          }
        ]);

        // Mock adaptations data
        setAdaptations([
          {
            _id: '1',
            type: 'RESCHEDULE',
            description: 'Rescheduled Pharmacology quiz to allow more study time',
            reason: 'Low performance on practice questions',
            date: '2023-05-01',
            topicId: '1',
            topicName: 'Pharmacology',
            taskId: '101',
            taskTitle: 'Pharmacology Quiz'
          },
          {
            _id: '2',
            type: 'CONTENT_ADDITION',
            description: 'Added additional practice questions on Cardiovascular topics',
            reason: 'Performance below target threshold',
            date: '2023-05-03',
            topicId: '2',
            topicName: 'Cardiovascular'
          },
          {
            _id: '3',
            type: 'DIFFICULTY_ADJUSTMENT',
            description: 'Adjusted difficulty of Anticoagulants content',
            reason: 'Multiple incorrect answers on assessment',
            date: '2023-05-05',
            topicId: '1-1',
            topicName: 'Anticoagulants'
          },
          {
            _id: '4',
            type: 'PLAN_REBALANCE',
            description: 'Rebalanced study plan to focus more on Pharmacology',
            reason: 'Performance gap identified in this area',
            date: '2023-05-10'
          },
          {
            _id: '5',
            type: 'REMEDIAL_CONTENT',
            description: 'Added remedial content for Heart Failure',
            reason: 'Failed assessment on this topic',
            date: '2023-05-12',
            topicId: '2-1',
            topicName: 'Heart Failure'
          }
        ]);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading progress data');
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [authUser, authLoading]);
  // Get category score color based on score
  const getCategoryScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get task type color
  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-500';
      case 'QUIZ':
        return 'bg-orange-500';
      case 'READING':
        return 'bg-green-500';
      case 'PRACTICE':
        return 'bg-purple-500'; // Changed back to standard Tailwind color
      case 'REVIEW':
        return 'bg-red-500'; // Changed to red for better visibility
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate days until exam
  const daysUntilExam = authUser?.examDate
    ? Math.ceil((new Date(authUser.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 30;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center mb-4"
          >
            <motion.svg
              className="w-10 h-10 mr-4 text-archer-bright-teal"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{
                scale: [1, 1.1, 1],
                color: ["rgba(20, 184, 166, 1)", "rgba(34, 197, 94, 1)", "rgba(20, 184, 166, 1)"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </motion.svg>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-archer-bright-teal via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              Progress Tracking
            </h1>
          </motion.div>
          <motion.p
            className="text-lg text-archer-light-text/80 max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Monitor your NCLEX preparation progress and readiness with detailed analytics and insights.
          </motion.p>
        </div>

        {/* Main Tabs */}
        <motion.div
          className="mb-8 glassmorphic-card rounded-xl p-2 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <nav className="flex -mb-px overflow-x-auto">
            <motion.button
              className={`mr-2 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeMainTab === 'overview'
                  ? 'bg-archer-bright-teal text-white shadow-lg transform scale-105'
                  : 'text-archer-light-text/70 hover:text-archer-light-text hover:bg-archer-dark-teal/30 hover:shadow-md'
              }`}
              onClick={() => setActiveMainTab('overview')}
              whileHover={{ scale: activeMainTab === 'overview' ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                animate={{
                  color: activeMainTab === 'overview' ? '#ffffff' : undefined
                }}
                transition={{ duration: 0.3 }}
              >
                Overview
              </motion.span>
            </motion.button>
            <motion.button
              className={`mr-2 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeMainTab === 'performance'
                  ? 'bg-archer-bright-teal text-archer-dark-bg shadow-lg transform scale-105'
                  : 'text-archer-light-text/70 hover:text-archer-light-text hover:bg-archer-dark-teal/30 hover:shadow-md'
              }`}
              onClick={() => setActiveMainTab('performance')}
              whileHover={{ scale: activeMainTab === 'performance' ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                animate={{
                  color: activeMainTab === 'performance' ? '#0f172a' : undefined
                }}
                transition={{ duration: 0.3 }}
              >
                Performance by Topic
              </motion.span>
            </motion.button>
            <motion.button
              className={`mr-2 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeMainTab === 'readiness'
                  ? 'bg-archer-bright-teal text-archer-dark-bg shadow-lg transform scale-105'
                  : 'text-archer-light-text/70 hover:text-archer-light-text hover:bg-archer-dark-teal/30 hover:shadow-md'
              }`}
              onClick={() => setActiveMainTab('readiness')}
              whileHover={{ scale: activeMainTab === 'readiness' ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                animate={{
                  color: activeMainTab === 'readiness' ? '#0f172a' : undefined
                }}
                transition={{ duration: 0.3 }}
              >
                Readiness Details
              </motion.span>
            </motion.button>
            <motion.button
              className={`mr-2 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeMainTab === 'adaptations'
                  ? 'bg-archer-bright-teal text-archer-bright-teal shadow-lg transform scale-105'
                  : 'text-archer-light-text/70 hover:text-archer-light-text hover:bg-archer-dark-teal/30 hover:shadow-md'
              }`}
              onClick={() => setActiveMainTab('adaptations')}
              whileHover={{ scale: activeMainTab === 'adaptations' ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                animate={{
                  color: activeMainTab === 'adaptations' ? '#0f172a' : undefined
                }}
                transition={{ duration: 0.3 }}
              >
                Plan Adaptations
              </motion.span>
            </motion.button>
            <motion.button
              className={`py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeMainTab === 'evolution'
                  ? 'bg-archer-bright-teal text-archer-dark-bg shadow-lg transform scale-105'
                  : 'text-archer-light-text/70 hover:text-archer-light-text hover:bg-archer-dark-teal/30 hover:shadow-md'
              }`}
              onClick={() => setActiveMainTab('evolution')}
              whileHover={{ scale: activeMainTab === 'evolution' ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                animate={{
                  color: activeMainTab === 'evolution' ? '#0f172a' : undefined
                }}
                transition={{ duration: 0.3 }}
              >
                Long-Term Evolution
              </motion.span>
            </motion.button>
          </nav>
        </motion.div>

        {/* Tab Content */}
        {loading ? (
          <motion.div
            className="flex flex-col items-center justify-center h-64 glassmorphic-card rounded-xl p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-16 h-16 border-t-4 border-archer-bright-teal border-solid rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            ></motion.div>
            <motion.p
              className="mt-4 text-archer-light-text text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Loading your progress data...
            </motion.p>
          </motion.div>
        ) : error ? (
          <motion.div
            className="glassmorphic-card p-8 text-center text-red-400 rounded-xl mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15), 0 0 5px rgba(239, 68, 68, 0.3)",
              transition: { duration: 0.3 }
            }}
          >
            <motion.div
              className="flex items-center justify-center mb-4"
              animate={{
                scale: [1, 1.1, 1],
                color: ["rgba(248, 113, 113, 1)", "rgba(239, 68, 68, 1)", "rgba(248, 113, 113, 1)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg className="w-8 h-8 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-xl font-semibold">Error Loading Progress</span>
            </motion.div>
            <p className="text-archer-light-text/80 mb-4">{error}</p>
            <motion.button
              className="px-6 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-medium transition-all shadow-button"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeMainTab === 'overview' && (
              <div>
                <motion.div
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  {/* Readiness Score */}
                  <motion.div
                    className="glassmorphic-card rounded-xl shadow-lg border border-border-color-dark p-6"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2), 0 0 10px rgba(20, 184, 166, 0.2)",
                      transition: { duration: 0.4 }
                    }}
                  >
                    <motion.div
                      className="flex items-center mb-6"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.svg
                        className="w-8 h-8 mr-3 text-archer-bright-teal"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        animate={{
                          scale: [1, 1.1, 1],
                          color: ["rgba(20, 184, 166, 1)", "rgba(34, 197, 94, 1)", "rgba(20, 184, 166, 1)"]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </motion.svg>
                      <h2 className="text-xl font-semibold text-archer-white">NCLEX Readiness Score</h2>
                    </motion.div>
                    <div className="flex justify-center mb-6">
                      <div className="relative h-48 w-48">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-5xl font-bold text-archer-bright-teal">{readinessScore.overallScore}%</div>
                            <div className="text-archer-light-text/70">Ready</div>
                          </div>
                        </div>
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--border-color-dark)"
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
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0.8 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm text-archer-light-text/80 mb-2">
                        Your exam is in <span className="font-medium text-archer-light-text">{daysUntilExam} days</span>
                      </p>
                      <p className="text-sm text-archer-light-text/80">
                        Projected score: <span className="font-medium text-archer-light-text">{readinessScore.projectedScore}%</span>
                      </p>
                    </motion.div>
                  </motion.div>

                  {/* Task Completion */}
                  <motion.div
                    className="glassmorphic-card rounded-xl shadow-lg border border-border-color-dark p-6"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2), 0 0 10px rgba(59, 130, 246, 0.2)",
                      transition: { duration: 0.4 }
                    }}
                  >
                    <motion.div
                      className="flex items-center mb-6"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.svg
                        className="w-8 h-8 mr-3 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        animate={{
                          scale: [1, 1.1, 1],
                          color: ["rgba(96, 165, 250, 1)", "rgba(59, 130, 246, 1)", "rgba(96, 165, 250, 1)"]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </motion.svg>
                      <h2 className="text-xl font-semibold text-archer-white">Task Completion</h2>
                    </motion.div>
                    <div className="flex justify-center mb-6">
                      <div className="relative h-40 w-40">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-archer-bright-teal">{Math.round((completedTasks.completed / completedTasks.total) * 100)}%</div>
                            <div className="text-sm text-archer-light-text/70">Completed</div>
                            <div className="text-xs text-archer-light-text/50 mt-1">{completedTasks.completed} of {completedTasks.total} tasks</div>
                          </div>
                        </div>
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--border-color-dark)"
                            strokeWidth="3"
                            strokeDasharray="100, 100"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--archer-bright-teal)"
                            strokeWidth="3"
                            strokeDasharray={`${Math.round((completedTasks.completed / completedTasks.total) * 100)}, 100`}
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {completedTasks.byType.map((type) => (
                        <div key={type.type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-archer-light-text/80">{type.type.charAt(0) + type.type.slice(1).toLowerCase()}</span>
                            <span className="font-medium text-archer-light-text">{type.completed} of {type.total}</span>
                          </div>
                          <div className="w-full bg-archer-dark-teal rounded-full h-2">
                            <div
                              className={`${getTaskTypeColor(type.type)} h-2 rounded-full`}
                              style={{ width: `${(type.completed / type.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Performance Charts */}
                <PerformanceCharts
                  performanceHistory={performanceHistory}
                  categoryScores={readinessScore.categoryScores}
                  overallScore={readinessScore.overallScore}
                />

                {/* Strengths & Weaknesses */}
                <motion.div
                  className="glassmorphic-card rounded-xl shadow-lg border border-border-color-dark p-6 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  whileHover={{
                    scale: 1.01,
                    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2), 0 0 10px rgba(34, 197, 94, 0.2)",
                    transition: { duration: 0.4 }
                  }}
                >
                  <motion.div
                    className="flex items-center mb-6"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.svg
                      className="w-8 h-8 mr-3 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      animate={{
                        scale: [1, 1.1, 1],
                        color: ["rgba(34, 197, 94, 1)", "rgba(20, 184, 166, 1)", "rgba(34, 197, 94, 1)"]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </motion.svg>
                    <h2 className="text-xl font-semibold text-archer-white">Strengths & Weaknesses</h2>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-medium text-archer-light-text mb-3">Areas to Improve</h3>
                      <div className="space-y-4">
                        {readinessScore.weakAreas.map((area, index) => (
                          <div key={index} className="bg-card-background-lighter rounded-lg p-4 shadow-card">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-card-background-dark flex items-center justify-center mr-3 shadow-sm">
                                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <h4 className="font-medium text-archer-light-text">{area.name}</h4>
                              </div>
                              <span className="text-sm font-medium text-archer-light-text">
                                {area.score}%
                              </span>
                            </div>
                            <p className="text-sm text-archer-light-text/70 ml-13 pl-1">
                              Focus on improving your knowledge in this area. Consider reviewing related content and taking more practice quizzes.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-medium text-archer-light-text mb-3">Strong Areas</h3>
                      <div className="space-y-4">
                        {readinessScore.strongAreas.map((area, index) => (
                          <div key={index} className="bg-card-background-lighter rounded-lg p-4 shadow-card">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-card-background-dark flex items-center justify-center mr-3 shadow-sm">
                                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <h4 className="font-medium text-archer-light-text">{area.name}</h4>
                              </div>
                              <span className="text-sm font-medium text-archer-light-text">
                                {area.score}%
                              </span>
                            </div>
                            <p className="text-sm text-archer-light-text/70 ml-13 pl-1">
                              You're doing well in this area! Continue to maintain your knowledge with periodic review.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Monitor Agent Insights */}
                <MonitorInsights userId="6818ed80539a47f3e1d5b9ab" />
              </div>
            )}

            {/* Performance by Topic Tab */}
            {activeMainTab === 'performance' && (
              <TopicBreakdown topics={topics} />
            )}

            {/* Readiness Details Tab */}
            {activeMainTab === 'readiness' && (
              <ReadinessDetails
                overallScore={readinessScore.overallScore}
                projectedScore={readinessScore.projectedScore}
                daysUntilExam={daysUntilExam}
                weakAreas={readinessScore.weakAreas}
                strongAreas={readinessScore.strongAreas}
              />
            )}

            {/* Plan Adaptations Tab */}
            {activeMainTab === 'adaptations' && (
              <PlanAdaptations adaptations={adaptations} />
            )}

            {/* Evolution Tab */}
            {activeMainTab === 'evolution' && (
              <div>
                {/* Evolution Tab Navigation */}
                <div className="mb-6 bg-card-background-dark rounded-lg p-4 shadow-card">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEvolutionSubTab('trends')}
                      className={`px-4 py-2 rounded-lg text-sm shadow-button ${
                        evolutionSubTab === 'trends'
                          ? 'bg-archer-bright-teal text-archer-dark-bg'
                          : 'bg-archer-dark-teal/50 text-archer-light-text/70 hover:bg-archer-dark-teal/70'
                      }`}
                    >
                      Long-Term Trends
                    </button>
                    <button
                      onClick={() => setEvolutionSubTab('versions')}
                      className={`px-4 py-2 rounded-lg text-sm shadow-button ${
                        evolutionSubTab === 'versions'
                          ? 'bg-archer-bright-teal text-archer-dark-bg'
                          : 'bg-archer-dark-teal/50 text-archer-light-text/70 hover:bg-archer-dark-teal/70'
                      }`}
                    >
                      Plan Versions
                    </button>
                    <button
                      onClick={() => setEvolutionSubTab('predictions')}
                      className={`px-4 py-2 rounded-lg text-sm shadow-button ${
                        evolutionSubTab === 'predictions'
                          ? 'bg-archer-bright-teal text-archer-dark-bg'
                          : 'bg-archer-dark-teal/50 text-archer-light-text/70 hover:bg-archer-dark-teal/70'
                      }`}
                    >
                      Predictive Performance
                    </button>
                    <button
                      onClick={() => setEvolutionSubTab('reviews')}
                      className={`px-4 py-2 rounded-lg text-sm shadow-button ${
                        evolutionSubTab === 'reviews'
                          ? 'bg-archer-bright-teal text-archer-dark-bg'
                          : 'bg-archer-dark-teal/50 text-archer-light-text/70 hover:bg-archer-dark-teal/70'
                      }`}
                    >
                      Plan Reviews
                    </button>
                  </div>
                </div>

                {/* Evolution Tab Content */}
                {evolutionSubTab === 'trends' && (
                  <LongTermTrends userId={authUser?.id || localStorage.getItem('userId') || '6818ed80539a47f3e1d5b9ab'} />
                )}

                {evolutionSubTab === 'versions' && (
                  <PlanVersionManagement userId={authUser?.id || localStorage.getItem('userId') || '6818ed80539a47f3e1d5b9ab'} />
                )}

                {evolutionSubTab === 'predictions' && (
                  <PredictivePerformance userId={authUser?.id || localStorage.getItem('userId') || '6818ed80539a47f3e1d5b9ab'} />
                )}

                {evolutionSubTab === 'reviews' && (
                  <PlanReviewOptimization userId={authUser?.id || localStorage.getItem('userId') || '6818ed80539a47f3e1d5b9ab'} />
                )}
              </div>
            )}
          </>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
