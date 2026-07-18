'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUser } from '@/context/UserContext';
import PerformanceCharts from '@/components/progress/PerformanceCharts';
import TopicBreakdown from '@/components/progress/TopicBreakdown';
import ReadinessDetails from '@/components/progress/ReadinessDetails';
import PlanAdaptations from '@/components/progress/PlanAdaptations';
import MonitorInsights from '@/components/dashboard/MonitorInsights';
import { Reveal } from '@/components/ui/reveal';
import { AnimateNumber } from '@/components/ui/animated-blur-number';
import { motion, useReducedMotion } from 'framer-motion';
import {
  LineChart,
  ShieldCheck,
  CheckCircle2,
  Zap,
  TrendingUp,
  GitBranch,
  Target,
  AlertTriangle,
} from 'lucide-react';

// One accent at stepped opacity — never a rainbow. Used across the telemetry bars.
const SUBJECT_BAR = ['bg-primary', 'bg-primary/60', 'bg-primary/30'] as const;

export default function ProgressPage() {
  const { user: authUser, isLoading: authLoading } = useUser();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion() === true;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'performance' | 'readiness' | 'adaptations' | 'evolution'>('overview');
  const [activeSubTab, setActiveSubTab] = useState('overall'); // Default for performance tab

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

  // Performance history data — PerformanceCharts fetches the real series itself;
  // this is only the empty fallback (never fabricate a fake trend).
  const [performanceHistory, setPerformanceHistory] = useState<{ date: string; score: number }[]>([]);

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

        // Resolve the user the same resilient way the dashboard does: prefer the
        // ?userId= the dashboard link passes, then the authenticated user from
        // context, then localStorage. This avoids a hard "must be logged in" failure
        // when UserContext hasn't hydrated yet but we clearly have a user id.
        const urlUserId = searchParams.get('userId');
        const localUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        const userId = urlUserId || authUser?.id || localUserId;

        // Only wait on auth if we have no id from any source yet.
        if (!userId && authLoading) {
          return; // Wait for auth to complete
        }

        if (!userId) {
          throw new Error('You must be logged in to view this page.');
        }

        // Fetch actual readiness score data from API
        const readinessResponse = await fetch(`/api/readiness-score?userId=${userId}`);
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
        const planResponse = await fetch(`/api/study-plans?userId=${userId}`);
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

        // Real topic performance: the exam's topic catalog from /api/topics, with
        // per-topic scores computed by averaging the student's real Performance
        // records for each topic. Topics not yet attempted show as "not attempted".
        try {
          const [topicsRes, perfRes] = await Promise.all([
            fetch('/api/topics'),
            fetch('/api/performance'),
          ]);
          const topicsData = await topicsRes.json();
          const perfData = await perfRes.json();

          // Average real scores per topic id
          const scoreAgg: Record<string, { sum: number; n: number }> = {};
          for (const p of (perfData?.performances || [])) {
            const tid = p.topic?._id || p.topic;
            if (!tid || typeof p.score !== 'number') continue;
            const key = String(tid);
            if (!scoreAgg[key]) scoreAgg[key] = { sum: 0, n: 0 };
            scoreAgg[key].sum += p.score;
            scoreAgg[key].n += 1;
          }

          // Only show subjects that belong to this student's exam
          const examSubjects = authUser?.examType === 'JEE'
            ? ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS']
            : ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'];

          if (topicsData.success && Array.isArray(topicsData.topics)) {
            setTopics(
              topicsData.topics
                .filter((t: any) => examSubjects.includes(t.category))
                .map((t: any) => {
                  const agg = scoreAgg[String(t._id)];
                  return {
                    _id: t._id,
                    name: t.name,
                    category: t.category,
                    score: agg ? Math.round(agg.sum / agg.n) : undefined,
                  };
                })
            );
          }
        } catch (topicsErr) {
          console.error('Error loading topic performance:', topicsErr);
        }

        // Real adaptation log written by the adaptation agent.
        try {
          const adaptationsRes = await fetch('/api/plan-adaptations');
          const adaptationsData = await adaptationsRes.json();
          if (adaptationsData.success && Array.isArray(adaptationsData.adaptations)) {
            setAdaptations(adaptationsData.adaptations);
          }
        } catch (adaptErr) {
          console.error('Error loading plan adaptations:', adaptErr);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading progress data');
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [authUser, authLoading, searchParams]);

  // Calculate days until exam
  const daysUntilExam = authUser?.examDate
    ? Math.ceil((new Date(authUser.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 30;

  // Same resolution order as the data fetch: URL param → auth context → localStorage
  const resolvedUserId =
    searchParams.get('userId') ||
    authUser?.id ||
    (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) ||
    '';

  const taskCompletionPct = completedTasks.total > 0
    ? Math.round((completedTasks.completed / completedTasks.total) * 100)
    : 0;

  // Per-subject mastery for the readiness hero telemetry strip. Prefer the real
  // category scores the readiness engine returns; fall back to averaging the
  // attempted topics per subject. Only subjects with real data get a bar.
  const subjectMastery = (() => {
    const byCategory: Record<string, number> = {};
    for (const c of readinessScore.categoryScores) {
      if (typeof c.score === 'number') byCategory[c.category?.toUpperCase?.() ?? ''] = c.score;
    }
    if (Object.keys(byCategory).length === 0) {
      const agg: Record<string, { sum: number; n: number }> = {};
      for (const t of topics) {
        if (typeof t.score !== 'number') continue;
        const key = t.category?.toUpperCase?.() ?? '';
        if (!agg[key]) agg[key] = { sum: 0, n: 0 };
        agg[key].sum += t.score;
        agg[key].n += 1;
      }
      for (const [key, { sum, n }] of Object.entries(agg)) byCategory[key] = Math.round(sum / n);
    }
    const order = authUser?.examType === 'JEE'
      ? ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS']
      : ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'];
    return order
      .filter((subject) => subject in byCategory)
      .map((subject) => ({
        name: subject.charAt(0) + subject.slice(1).toLowerCase(),
        pct: byCategory[subject],
      }));
  })();

  // Top-level readouts for the AnimateNumber stat band.
  const overviewStats = [
    { value: readinessScore.overallScore, suffix: '%', label: 'Readiness' },
    { value: readinessScore.projectedScore, suffix: '%', label: 'Projected' },
    { value: taskCompletionPct, suffix: '%', label: 'Tasks done' },
    { value: daysUntilExam, suffix: 'd', label: 'To exam' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LineChart },
    { id: 'performance', label: 'Performance by Topic', icon: TrendingUp },
    { id: 'readiness', label: 'Readiness Details', icon: ShieldCheck },
    { id: 'adaptations', label: 'Plan Adaptations', icon: Zap },
    { id: 'evolution', label: 'Long-Term Evolution', icon: GitBranch },
  ] as const;

  return (
    <ProtectedRoute>
      <AppLayout>
        {/* Header */}
        <Reveal className="mb-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {authUser?.examType || 'NEET/JEE'} Analytics
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <LineChart className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="gradient-text">Progress Tracking</span>
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Monitor your {authUser?.examType || 'NEET/JEE'} preparation progress and readiness with detailed analytics and insights.
          </p>
        </Reveal>

        {/* Main Tabs */}
        <Reveal delay={0.05} className="mb-8">
          <div className="rounded-2xl border border-border bg-card p-1.5 shadow-sm">
            <nav className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const active = activeMainTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMainTab(tab.id)}
                    className={`press flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </Reveal>

        {/* Tab Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="mt-4 text-muted-foreground">Loading your progress data...</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Error Loading Progress</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <button
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeMainTab === 'overview' && (
              <div>
                {/* Stat band — <AnimateNumber> readouts, divider-separated (marketing-grade) */}
                <Reveal className="mb-6">
                  <div className="rounded-2xl border border-border bg-card px-2 py-6 shadow-sm">
                    <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-border/60">
                      {overviewStats.map((s) => (
                        <div key={s.label} className="flex flex-col items-center px-4 text-center sm:px-6">
                          <dt className="font-display text-4xl font-bold leading-none tracking-tight text-foreground">
                            <AnimateNumber value={s.value} suffix={s.suffix} duration={420} blur={14} />
                          </dt>
                          <dd className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {s.label}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </Reveal>

                {/* Readiness HERO — the instrument: ring + subject-mastery telemetry */}
                <Reveal className="mb-6">
                  <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-5">
                    {/* Ring */}
                    <div className="flex flex-col bg-card p-6 sm:p-7 lg:col-span-2">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Exam readiness
                      </p>
                      <div className="mt-6 flex justify-center">
                        <div className="relative h-44 w-44">
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="font-display text-5xl font-bold tracking-tight text-foreground">
                              <AnimateNumber value={readinessScore.overallScore} suffix="%" duration={500} blur={16} />
                            </div>
                            <div className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Ready
                            </div>
                          </div>
                          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="var(--border)"
                              strokeWidth="3"
                              strokeDasharray="100, 100"
                            />
                            <motion.path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="var(--primary)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${readinessScore.overallScore}, 100`}
                              initial={reduceMotion ? false : { pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </svg>
                        </div>
                      </div>
                      <dl className="mt-6 grid grid-cols-2 divide-x divide-border border-t border-border pt-5 text-center">
                        <div className="px-2">
                          <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Projected</dt>
                          <dd className="mt-1.5 font-mono text-lg font-semibold text-foreground">{readinessScore.projectedScore}%</dd>
                        </div>
                        <div className="px-2">
                          <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Days to exam</dt>
                          <dd className="mt-1.5 font-mono text-lg font-semibold text-foreground">{daysUntilExam}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Subject-mastery telemetry */}
                    <div className="flex flex-col bg-card p-6 sm:p-7 lg:col-span-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          Subject mastery
                        </p>
                        <span className="font-mono text-[0.7rem] text-muted-foreground">
                          {authUser?.examType || 'NEET/JEE'} · live
                        </span>
                      </div>

                      {subjectMastery.length > 0 ? (
                        <div className="mt-5 space-y-4">
                          {subjectMastery.map((row, i) => (
                            <div
                              key={row.name}
                              className="flex items-center gap-3"
                              role="img"
                              aria-label={`${row.name} mastery ${row.pct} percent`}
                            >
                              <span className="w-24 shrink-0 text-sm text-foreground">{row.name}</span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                <motion.div
                                  className={`h-full origin-left rounded-full ${SUBJECT_BAR[i % SUBJECT_BAR.length]}`}
                                  style={{ width: `${row.pct}%` }}
                                  initial={reduceMotion ? false : { scaleX: 0 }}
                                  whileInView={{ scaleX: 1 }}
                                  viewport={{ once: true, margin: '-60px' }}
                                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20, delay: 0.1 * i }}
                                />
                              </div>
                              <span className="w-10 shrink-0 text-right font-mono text-[0.75rem] text-muted-foreground">{row.pct}%</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-5 flex flex-1 items-center rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                          Complete a few tasks to map your per-subject mastery — no fabricated scores before then.
                        </p>
                      )}

                      {/* Task-type completion — hairline telemetry rows */}
                      <div className="mt-6 border-t border-border pt-5">
                        <div className="flex items-center justify-between">
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            Task completion
                          </p>
                          <span className="font-mono text-[0.7rem] text-muted-foreground">
                            {completedTasks.completed}/{completedTasks.total} · {taskCompletionPct}%
                          </span>
                        </div>
                        <div className="mt-4 space-y-3">
                          {completedTasks.byType.map((type, i) => {
                            const pct = type.total > 0 ? Math.round((type.completed / type.total) * 100) : 0;
                            return (
                              <div key={type.type} className="flex items-center gap-3">
                                <span className="w-24 shrink-0 text-sm text-foreground">
                                  {type.type.charAt(0) + type.type.slice(1).toLowerCase()}
                                </span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                  <motion.div
                                    className={`h-full origin-left rounded-full ${SUBJECT_BAR[i % SUBJECT_BAR.length]}`}
                                    style={{ width: `${pct}%` }}
                                    initial={reduceMotion ? false : { scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20, delay: 0.06 * i }}
                                  />
                                </div>
                                <span className="w-16 shrink-0 text-right font-mono text-[0.7rem] text-muted-foreground">
                                  {type.completed}/{type.total}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Performance Charts */}
                <PerformanceCharts
                  performanceHistory={performanceHistory}
                  categoryScores={readinessScore.categoryScores}
                  overallScore={readinessScore.overallScore}
                />

                {/* Strengths & Weaknesses — framed telemetry rows, single accent nodes */}
                <Reveal>
                  <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                        <Zap className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-semibold text-foreground">Strengths &amp; Weaknesses</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <p className="mb-4 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          <Target className="h-3.5 w-3.5 text-destructive" /> Areas to improve
                        </p>
                        {readinessScore.weakAreas.length > 0 ? (
                          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                            {readinessScore.weakAreas.map((area, index) => (
                              <li key={index} className="flex items-center justify-between gap-3 bg-secondary/30 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                                  <span className="truncate text-sm text-foreground">{area.name || area}</span>
                                </div>
                                {typeof area.score === 'number' && (
                                  <span className="shrink-0 font-mono text-[0.75rem] font-semibold text-destructive">{area.score}%</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                            No specific weak areas identified yet. Keep completing tasks to sharpen the read.
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="mb-4 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Strong areas
                        </p>
                        {readinessScore.strongAreas.length > 0 ? (
                          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                            {readinessScore.strongAreas.map((area, index) => (
                              <li key={index} className="flex items-center justify-between gap-3 bg-secondary/30 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                                  <span className="truncate text-sm text-foreground">{area.name || area}</span>
                                </div>
                                {typeof area.score === 'number' && (
                                  <span className="shrink-0 font-mono text-[0.75rem] font-semibold text-success">{area.score}%</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                            No specific strengths identified yet. Keep completing tasks to sharpen the read.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Monitor Agent Insights */}
                {resolvedUserId && <MonitorInsights userId={resolvedUserId} />}
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

            {/* Long-Term Evolution Tab — honestly gated: these analytics need weeks of
                real study history to be meaningful, so we show progress toward unlocking
                rather than fabricating trends/predictions for a brand-new account. */}
            {activeMainTab === 'evolution' && (
              <Reveal>
                {(() => {
                  const EVOLUTION_MIN_TASKS = 20;
                  const done = completedTasks.completed;
                  const pct = Math.min(100, Math.round((done / EVOLUTION_MIN_TASKS) * 100));
                  const unlocked = done >= EVOLUTION_MIN_TASKS;
                  return (
                    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <GitBranch className="h-7 w-7" />
                      </div>
                      <h2 className="font-display text-xl font-bold">Long-Term Evolution</h2>
                      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                        {unlocked
                          ? 'You have enough study history — long-term trend analysis and predictive readiness are being generated from your real activity.'
                          : 'Trend analysis, plan-version history and predictive readiness build from your real study data. Keep completing tasks and this unlocks automatically — no made-up numbers before then.'}
                      </p>
                      <div className="mx-auto mt-6 max-w-sm">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Completed tasks</span>
                          <span className="font-mono text-[0.75rem] text-muted-foreground">{done} / {EVOLUTION_MIN_TASKS}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <motion.div
                            className="h-full origin-left rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                            initial={reduceMotion ? false : { scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                        {['Performance trends', 'Plan versions', 'Predictive readiness', 'Plan reviews'].map((f) => (
                          <span key={f} className="rounded-lg border border-border px-2.5 py-1">{f}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </Reveal>
            )}
          </>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
