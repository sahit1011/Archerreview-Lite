"use client";

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowTrendingUpIcon, ExclamationCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { fadeIn, fadeInUp, staggerContainer } from '@/utils/animationUtils';
import { SkeletonCard } from '@/components/common/Skeleton';
import AnimatedCard from '@/components/common/AnimatedCard';

interface MonitorSummaryProps {
  userId: string;
}

const MonitorSummary: React.FC<MonitorSummaryProps> = ({ userId }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleMessage, setRescheduleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Function to handle rescheduling missed tasks
  const handleRescheduleMissedTasks = async () => {
    try {
      setIsRescheduling(true);
      setRescheduleMessage(null);

      const response = await fetch('/api/tasks/reschedule-missed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        // Check if any tasks were actually rescheduled
        if (data.rescheduledTasks.length > 0) {
          setRescheduleMessage({
            type: 'success',
            text: `Successfully rescheduled ${data.rescheduledTasks.length} missed tasks.`
          });

          // Update the stats to reflect the rescheduled tasks
          setStats((prev: any) => ({
            ...prev,
            missedTasks: prev.missedTasks - data.rescheduledTasks.length // Reduce missed tasks by the number rescheduled
          }));

          // Redirect to calendar page to show the rescheduled tasks
          setTimeout(() => {
            window.location.href = `/calendar?userId=${userId}`;
          }, 2000);
        } else {
          // No tasks were rescheduled
          setRescheduleMessage({
            type: 'success',
            text: data.message || 'No tasks needed to be rescheduled.'
          });
        }
      } else {
        // Handle failed rescheduling
        setRescheduleMessage({
          type: 'error',
          text: data.message || 'Failed to reschedule tasks.'
        });
      }
    } catch (error) {
      console.error('Error rescheduling missed tasks:', error);
      setRescheduleMessage({
        type: 'error',
        text: 'An error occurred while rescheduling tasks.'
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        const readinessResponse = await fetch(`/api/readiness-score?userId=${userId}`);
        const readinessData = await readinessResponse.json();
        if (!readinessData.success || !readinessData.readinessScore) {
          throw new Error('Failed to fetch readiness score');
        }

        const planResponse = await fetch(`/api/study-plans?userId=${userId}`);
        const planData = await planResponse.json();
        if (!planData.success || !planData.studyPlan) {
          throw new Error('Failed to fetch study plan');
        }

        const examDate = new Date(planData.studyPlan.examDate);
        const daysUntilExam = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        const tasksResponse = await fetch(`/api/tasks?planId=${planData.studyPlan._id}`);
        const tasksData = await tasksResponse.json();
        if (!tasksData.success) {
          throw new Error('Failed to fetch tasks');
        }

        const totalTasks = tasksData.tasks.length;
        const completedTasks = tasksData.tasks.filter((t: any) => t.status === 'COMPLETED').length;
        const missedTasks = tasksData.tasks.filter((t: any) =>
          t.status === 'PENDING' && new Date(t.endTime) < new Date()
        ).length;

        setStats({
          readinessScore: readinessData.readinessScore.overallScore,
          projectedScore: readinessData.readinessScore.projectedScore,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          daysUntilExam,
          totalTasks,
          completedTasks,
          missedTasks
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching real data:', error);
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };

    if (userId) {
      fetchRealData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <SkeletonCard headerHeight={24} contentLines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="p-4 bg-red-100 text-red-600 rounded-lg">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-amber-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <AnimatedCard className="monitor-card p-8 mb-8">
      {/* @ts-ignore - Framer Motion type issues */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div
          className="flex items-center justify-between mb-6"
          variants={fadeIn}
        >
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Study Progress
          </h2>
          <Link
            href={`/progress?userId=${userId}`}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            View detailed progress →
          </Link>
        </motion.div>

        {/* @ts-ignore - Framer Motion type issue with className */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"
          variants={staggerContainer}
        >
          {/* @ts-ignore - Framer Motion type issue with className */}
          <motion.div
            className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl p-5 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all"
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.2 } }}
          >
            <div className="text-sm font-semibold text-gray-700 mb-2">Current Readiness</div>
            <div className={`text-4xl font-bold ${getReadinessColor(stats.readinessScore)}`}>
              {Math.round(stats.readinessScore)}%
            </div>
            <div className="text-xs font-medium text-gray-600 mt-2">
              {stats.readinessScore >= 65 ? 'On track' : 'Needs improvement'}
            </div>
          </motion.div>

          {/* @ts-ignore - Framer Motion type issue with className */}
          <motion.div
            className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl p-5 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.2 } }}
          >
            <div className="text-sm font-semibold text-gray-700 mb-2">Projected Score</div>
            <div className={`text-4xl font-bold ${getReadinessColor(stats.projectedScore)}`}>
              {Math.round(stats.projectedScore)}%
            </div>
            <div className="text-xs font-medium text-gray-600 mt-2">
              By exam date
            </div>
          </motion.div>

          {/* @ts-ignore - Framer Motion type issue with className */}
          <motion.div
            className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl p-5 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.2 } }}
          >
            <div className="text-sm font-semibold text-gray-700 mb-2">Task Completion</div>
            <div className="text-4xl font-bold text-indigo-600">
              {Math.round(stats.completionRate)}%
            </div>
            <div className="text-xs font-medium text-gray-600 mt-2">
              {stats.completedTasks}/{stats.totalTasks} tasks completed
            </div>
          </motion.div>

          {/* @ts-ignore - Framer Motion type issue with className */}
          <motion.div
            className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl p-5 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all"
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.2 } }}
          >
            <div className="text-sm font-semibold text-gray-700 mb-2">Exam Countdown</div>
            <div className="text-4xl font-bold text-indigo-600">
              {stats.daysUntilExam}
            </div>
            <div className="text-xs font-medium text-gray-600 mt-2">
              days remaining
            </div>
          </motion.div>
        </motion.div>

        {/* @ts-ignore - Framer Motion type issue with className */}
        <motion.div
          className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl p-6 flex items-start shadow-lg"
          variants={fadeInUp}
          transition={{ delay: 0.5 }}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4 shadow-sm">
            <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-indigo-600">Monitor Agent Insight</p>
            <p className="text-sm text-gray-700 mt-3 bg-indigo-50/80 p-4 rounded-xl border border-indigo-100">
              {stats.readinessScore < 65
                ? `Your current readiness score is ${Math.round(stats.readinessScore)}%, which is below the target of 65%. With continued study, you're projected to reach ${Math.round(stats.projectedScore)}% by your exam date. Focus on completing more tasks to improve your score.`
                : `You're on track with a readiness score of ${Math.round(stats.readinessScore)}% and are projected to reach ${Math.round(stats.projectedScore)}% by your exam date. Keep up the good work!`}
            </p>
          </div>
        </motion.div>

        {stats.missedTasks > 0 && (
          // @ts-ignore - Framer Motion type issue with className
          <motion.div
            className="mt-6 bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4 shadow-sm">
                <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-grow">
                <p className="text-base font-bold text-red-600">Attention Needed</p>
                <p className="text-sm text-gray-700 mt-3 bg-red-50/80 p-4 rounded-xl border border-red-100">
                  You have {stats.missedTasks} missed {stats.missedTasks === 1 ? 'task' : 'tasks'}. Consider rescheduling or completing them soon.
                </p>

                {rescheduleMessage && (
                  <div className={`mt-4 p-4 rounded-xl text-sm font-medium ${rescheduleMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {rescheduleMessage.text}
                  </div>
                )}

                <div className="mt-5">
                  <button
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50"
                    onClick={handleRescheduleMissedTasks}
                    disabled={isRescheduling}
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    {isRescheduling ? 'Rescheduling...' : 'Reschedule Missed Tasks'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatedCard>
  );
};

export default MonitorSummary;