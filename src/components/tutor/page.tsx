"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';
import ClientOnly from '@/components/common/ClientOnly';
import ParticleBackground from '@/components/common/ParticleBackground';
import AnimatedProgressCircle from '@/components/common/AnimatedProgressCircle';
import { fadeIn, fadeInUp, staggerContainer, fadeInLeft, fadeInRight } from '@/utils/animationUtils';

const ProgressPage = () => {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<any>(null);

  useEffect(() => {
    const id = searchParams.get('userId') || localStorage.getItem('userId');
    if (id) {
      setUserId(id);
    } else {
      setError('User not found. Please log in.');
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!userId) return;

    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/readiness-score?userId=${userId}`);
        const data = await res.json();

        if (data.success) {
          setProgressData(data.readinessScore);
        } else {
          throw new Error(data.message || 'Failed to fetch progress data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [userId]);

  const getCategoryScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <AppLayout>
      <div className="relative z-0 text-white min-h-[calc(100vh-200px)] -my-6 -mx-4 sm:-mx-6 lg:-mx-8">
        <ClientOnly>
          <ParticleBackground
            particleCount={80}
            colors={['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#0EA5E9']}
            className="opacity-50"
          />
        </ClientOnly>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="mb-12"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight mb-3 flex items-center">
                <motion.svg
                  className="w-10 h-10 mr-4 text-indigo-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  animate={{
                    scale: [1, 1.1, 1],
                    color: ["rgba(99, 102, 241, 1)", "rgba(168, 85, 247, 1)", "rgba(99, 102, 241, 1)"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </motion.svg>
                Your Progress
              </h1>
              <p className="text-lg text-gray-300 max-w-3xl">
                Track your journey to NCLEX success. Here's a detailed breakdown of your performance and readiness.
              </p>
            </motion.div>

            {loading && (
              <motion.div
                className="flex flex-col items-center justify-center h-64 glassmorphic-card rounded-xl p-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="w-16 h-16 border-t-4 border-indigo-400 border-solid rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                ></motion.div>
                <motion.p
                  className="mt-4 text-gray-300 text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Loading your progress data...
                </motion.p>
              </motion.div>
            )}

            {error && (
              <motion.div
                variants={fadeInUp}
                className="glassmorphic-card p-8 text-center text-red-400 rounded-xl"
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
                <p className="text-gray-300 mb-4">{error}</p>
                <motion.button
                  className="px-6 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-medium transition-all shadow-button"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </motion.button>
              </motion.div>
            )}

            {progressData && (
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {/* Readiness Score */}
                <motion.div
                  variants={fadeInUp}
                  className="lg:col-span-1 glassmorphic-card p-8 flex flex-col items-center justify-center text-center rounded-xl"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2), 0 0 10px rgba(99, 102, 241, 0.2)",
                    transition: { duration: 0.4 }
                  }}
                >
                  <motion.div
                    className="flex items-center mb-6"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.svg
                      className="w-8 h-8 mr-3 text-indigo-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      animate={{
                        scale: [1, 1.1, 1],
                        color: ["rgba(99, 102, 241, 1)", "rgba(168, 85, 247, 1)", "rgba(99, 102, 241, 1)"]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </motion.svg>
                    <h2 className="text-2xl font-bold text-white">Overall Readiness</h2>
                  </motion.div>
                  <AnimatedProgressCircle
                    percentage={progressData.readinessScore.overallScore}
                    size={200}
                    strokeWidth={12}
                    label="Ready"
                  />
                  <motion.p
                    className="mt-6 text-gray-300 text-sm"
                    initial={{ opacity: 0.8 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    Your projected score is <span className="font-bold text-indigo-300">{Math.round(progressData.readinessScore.projectedScore)}%</span>. Keep up the great work!
                  </motion.p>
                </motion.div>

                {/* Category Performance */}
                <motion.div
                  variants={fadeInUp}
                  className="lg:col-span-2 glassmorphic-card p-8 rounded-xl"
                  whileHover={{
                    scale: 1.01,
                    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2), 0 0 10px rgba(20, 184, 166, 0.2)",
                    transition: { duration: 0.4 }
                  }}
                >
                  <motion.div
                    className="flex items-center mb-8"
                    whileHover={{ scale: 1.02 }}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </motion.svg>
                    <h2 className="text-2xl font-bold text-white">Performance by Category</h2>
                  </motion.div>
                  <div className="space-y-6">
                    {progressData.readinessScore.categoryScores.map((cat: any, index: number) => (
                      <motion.div
                        key={index}
                        variants={fadeInUp}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.1 }}
                        whileHover={{
                          scale: 1.02,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-gray-200 text-lg">{cat.category.replace(/_/g, ' ')}</span>
                          <motion.span
                            className="font-semibold text-indigo-300 text-lg px-3 py-1 bg-indigo-500/20 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            {Math.round(cat.score)}%
                          </motion.span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden shadow-inner">
                          <motion.div
                            className={`h-full rounded-full ${getCategoryScoreColor(cat.score)} shadow-lg`}
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.score}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 + index * 0.1 }}
                            whileHover={{
                              boxShadow: `0 0 10px ${getCategoryScoreColor(cat.score).includes('green') ? 'rgba(34, 197, 94, 0.5)' : getCategoryScoreColor(cat.score).includes('yellow') ? 'rgba(234, 179, 8, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                              transition: { duration: 0.3 }
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Focus Areas */}
                <motion.div
                  variants={fadeInUp}
                  className="lg:col-span-3 glassmorphic-card p-8 rounded-xl"
                  whileHover={{
                    scale: 1.01,
                    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2), 0 0 10px rgba(34, 197, 94, 0.2)",
                    transition: { duration: 0.4 }
                  }}
                >
                  <motion.div
                    className="flex items-center mb-8"
                    whileHover={{ scale: 1.02 }}
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
                    <h2 className="text-2xl font-bold text-white">Focus Areas</h2>
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <motion.div
                        className="flex items-center mb-6"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.svg
                          className="w-6 h-6 mr-3 text-green-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          animate={{
                            scale: [1, 1.2, 1],
                            color: ["rgba(34, 197, 94, 1)", "rgba(74, 222, 128, 1)", "rgba(34, 197, 94, 1)"]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </motion.svg>
                        <h3 className="text-xl font-semibold text-green-400">Strengths</h3>
                      </motion.div>
                      <ul className="space-y-4">
                        {progressData.readinessScore.strongAreas.map((area: any, index: number) => (
                          <motion.li
                            key={index}
                            className="glassmorphic p-5 rounded-lg border-l-4 border-green-400 shadow-lg"
                            variants={fadeInLeft}
                            transition={{ delay: index * 0.15 }}
                            whileHover={{
                              scale: 1.02,
                              boxShadow: "0 8px 20px rgba(34, 197, 94, 0.2), 0 0 5px rgba(34, 197, 94, 0.3)",
                              borderLeftColor: "rgba(74, 222, 128, 1)",
                              transition: { duration: 0.3 }
                            }}
                          >
                            <motion.p
                              className="font-medium text-white text-lg mb-2"
                              whileHover={{ scale: 1.01 }}
                            >
                              {area.name || area.category.replace(/_/g, ' ')}
                            </motion.p>
                            <motion.p
                              className="text-sm text-gray-400"
                              initial={{ opacity: 0.8 }}
                              whileHover={{ opacity: 1 }}
                            >
                              {area.message}
                            </motion.p>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <motion.div
                        className="flex items-center mb-6"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.svg
                          className="w-6 h-6 mr-3 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          animate={{
                            scale: [1, 1.2, 1],
                            color: ["rgba(239, 68, 68, 1)", "rgba(248, 113, 113, 1)", "rgba(239, 68, 68, 1)"]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </motion.svg>
                        <h3 className="text-xl font-semibold text-red-400">Areas for Improvement</h3>
                      </motion.div>
                      <ul className="space-y-4">
                        {progressData.readinessScore.weakAreas.map((area: any, index: number) => (
                          <motion.li
                            key={index}
                            className="glassmorphic p-5 rounded-lg border-l-4 border-red-400 shadow-lg"
                            variants={fadeInRight}
                            transition={{ delay: index * 0.15 }}
                            whileHover={{
                              scale: 1.02,
                              boxShadow: "0 8px 20px rgba(239, 68, 68, 0.2), 0 0 5px rgba(239, 68, 68, 0.3)",
                              borderLeftColor: "rgba(248, 113, 113, 1)",
                              transition: { duration: 0.3 }
                            }}
                          >
                            <motion.p
                              className="font-medium text-white text-lg mb-2"
                              whileHover={{ scale: 1.01 }}
                            >
                              {area.name || area.category.replace(/_/g, ' ')}
                            </motion.p>
                            <motion.p
                              className="text-sm text-gray-400"
                              initial={{ opacity: 0.8 }}
                              whileHover={{ opacity: 1 }}
                            >
                              {area.message}
                            </motion.p>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProgressPage;