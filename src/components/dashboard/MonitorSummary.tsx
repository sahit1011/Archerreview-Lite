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
      <div className="bg-card-background-light rounded-xl shadow-card p-6 mb-6 border border-border-color-light">
        <SkeletonCard headerHeight={24} contentLines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-background-light rounded-xl shadow-card p-6 mb-6 border border-border-color-light">
        <div className="p-4 bg-red-100 text-red-600 rounded-lg shadow-button">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-archer-bright-teal';
    if (score >= 65) return 'text-archer-light-blue';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <AnimatedCard className="p-8 mb-8 bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all border border-border-color-light">
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
          <h2 className="text-2xl font-bold text-archer-dark-text">Study Progress</h2>
          <Link
            href={`/progress?userId=${userId}`}
            className="inline-flex items-center px-5 py-2.5 bg-archer-bright-teal text-white rounded-lg font-semibold shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1"
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
            className="bg-white rounded-xl p-5 flex flex-col items-center justify-center shadow-card border border-gray-200"
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          >
            <div className="text-sm font-medium text-gray-600 mb-2">Current Readiness</div>
            <div className={`text-4xl font-bold ${getReadinessColor(stats.readinessScore)}`}>
              {Math.round(stats.readinessScore)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.readinessScore >= 65 ? 'On track' : 'Needs improvement'}
            </div>
          </motion.div>

          {/* @ts-ignore - Framer Motion type issue with className */}
          <motion.div
            className="bg-white rounded-xl p-5 flex flex-col items-center justify-center shadow-card border border-gray-200"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          >
            <div className="text-sm font-medium text-gray-600 mb-2">Projected Score</div>
            <div className={`text-4xl font-bold ${getReadinessColor(stats.projectedScore)}`}>
              {Math.round(stats.projectedScore)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">
              By exam date
            </div>
          </motion.div>

          {/* @ts-ignore - Framer Motion type issue with className */}
          <motion.div
            className="bg-white rounded-xl p-5 flex flex-col items-center justify-center shadow-card border border-gray-200"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          >
            <div className="text-sm font-medium text-gray-600 mb-2">Task Completion</div>
            <div className="text-4xl font-bold text-archer-bright-teal">
              {Math.round(stats.completionRate)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.completedTasks}/{stats.totalTasks} tasks completed
            </div>
          </motion.div>

          {/* @ts-ignore - Framer Motion type issue with className */}
          <motion.div
            className="bg-white rounded-xl p-5 flex flex-col items-center justify-center shadow-card border border-gray-200"
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          >
            <div className="text-sm font-medium text-gray-600 mb-2">Exam Countdown</div>
            <div className="text-4xl font-bold text-archer-light-blue">
              {stats.daysUntilExam}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              days remaining
            </div>
          </motion.div>
        </motion.div>

        {/* @ts-ignore - Framer Motion type issue with className */}
        <motion.div
          className="bg-white rounded-xl p-6 flex items-start shadow-card border border-gray-200"
          variants={fadeInUp}
          transition={{ delay: 0.5 }}
        >
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mr-4 shadow-button">
            <ArrowTrendingUpIcon className="h-6 w-6 text-archer-bright-teal" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-archer-bright-teal">Monitor Agent Insight</p>
            <p className="text-sm text-gray-600 mt-3 bg-light-bg-secondary p-4 rounded-xl">
              {stats.readinessScore < 65
                ? `Your current readiness score is ${Math.round(stats.readinessScore)}%, which is below the target of 65%. With continued study, you're projected to reach ${Math.round(stats.projectedScore)}% by your exam date. Focus on completing more tasks to improve your score.`
                : `You're on track with a readiness score of ${Math.round(stats.readinessScore)}% and are projected to reach ${Math.round(stats.projectedScore)}% by your exam date. Keep up the good work!`}
            </p>
          </div>
        </motion.div>

        {stats.missedTasks > 0 && (
          // @ts-ignore - Framer Motion type issue with className
          <motion.div
            className="mt-6 bg-white rounded-xl p-6 shadow-card border border-gray-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4 shadow-button">
                <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-grow">
                <p className="text-base font-semibold text-archer-dark-text">Attention Needed</p>
                <p className="text-sm text-gray-600 mt-3 bg-light-bg-secondary p-4 rounded-xl">
                  You have {stats.missedTasks} missed {stats.missedTasks === 1 ? 'task' : 'tasks'}. Consider rescheduling or completing them soon.
                </p>

                {rescheduleMessage && (
                  <div className={`mt-4 p-4 rounded-xl text-sm ${rescheduleMessage.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {rescheduleMessage.text}
                  </div>
                )}

                <div className="mt-5">
                  <button
                    className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 disabled:opacity-50"
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
