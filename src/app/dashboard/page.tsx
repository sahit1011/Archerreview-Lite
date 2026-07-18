'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUser } from '@/context/UserContext';
import { useRemediationAgent } from '@/hooks/useRemediationAgent';
import PlanUpdatesCard from '@/components/dashboard/PlanUpdatesCard';
import { toast } from 'sonner';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  ListTodo,
  CheckCircle2,
  Timer,
  TrendingUp,
  ArrowRight,
  ClipboardList,
  ChevronRight,
  Target,
  Video,
  BookOpen,
  RefreshCw,
  PenLine,
  FileQuestion,
  Sparkles,
  NotebookPen,
} from 'lucide-react';


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
  // Flips one frame after data load so the readiness ring draws in via CSS transition
  const [ringReady, setRingReady] = useState(false);
  useEffect(() => {
    if (!loading) {
      const raf = requestAnimationFrame(() => setRingReady(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [loading]);

  // Gamification functionality completely removed

  useEffect(() => {
    // One linear data path: resolve the user id (URL param -> auth context ->
    // localStorage), then fetch user, plan, tasks and readiness in parallel.
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId =
          searchParams.get('userId') ||
          (authUser && authUser.id) ||
          (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);

        if (!userId) {
          throw new Error('You need to sign in to view your dashboard.');
        }

        // 1. The user
        const userRes = await fetch(`/api/users/${userId}`);
        const userData = await userRes.json();
        if (!userData.success) throw new Error('Failed to load your profile.');
        const fetchedUser = userData.user;
        setUser(fetchedUser);
        if (typeof window !== 'undefined') localStorage.setItem('userId', userId);

        // 2. The study plan — no plan means onboarding isn't finished
        const planRes = await fetch(`/api/study-plans?userId=${fetchedUser._id}`);
        const planData = await planRes.json();
        if (!planData.success || !planData.studyPlan) {
          if (!searchParams.get('fromOnboarding')) {
            router.push('/onboarding/account-creation');
            return;
          }
          // Coming straight from onboarding: the plan may still be generating.
          setLoading(false);
          return;
        }

        // 3. Today's tasks + readiness, in parallel
        const today = format(new Date(), 'yyyy-MM-dd');
        const [tasksRes, readinessRes] = await Promise.all([
          fetch(`/api/tasks?planId=${planData.studyPlan._id}&date=${today}`),
          fetch(`/api/readiness-score?userId=${fetchedUser._id}`),
        ]);
        const tasksData = await tasksRes.json();
        if (tasksData.success) setTodaysTasks(tasksData.tasks || []);

        const readinessData = await readinessRes.json();
        if (readinessData.success && readinessData.readinessScore) {
          const rs = readinessData.readinessScore;
          setReadinessScore({
            overallScore: rs.overallScore || 0,
            categoryScores: rs.categoryScores || [],
            weakAreas: rs.weakAreas || [],
            strongAreas: rs.strongAreas || [],
          });
          setFocusAreas([
            ...(rs.weakAreas || []).map((area: any) => ({
              ...(typeof area === 'string' ? { name: area } : area),
              type: 'weak',
              message: 'This area needs improvement. Focus on strengthening your knowledge here.',
            })),
            ...(rs.strongAreas || []).slice(0, 1).map((area: any) => ({
              ...(typeof area === 'string' ? { name: area } : area),
              type: 'strong',
              message: "You're doing well here! Continue practicing to maintain your strong performance.",
            })),
          ]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [searchParams, authUser, router]);

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
        setReadinessScore(data.readinessScore);
      }

      // Surface what the adaptive agents changed (reschedules, reviews, remedial content)
      if (newStatus === 'COMPLETED' && data.adaptation?.triggered && data.adaptation.changes?.length) {
        toast.success('Your plan adapted to your progress', {
          description: data.adaptation.changes.join(' · '),
          duration: 6000,
        });
      }

      return data.task;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
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

  // Derived KPI values
  const completedToday = todaysTasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingToday = todaysTasks.length - completedToday;
  const daysToExam = user?.examDate
    ? Math.max(0, Math.ceil((new Date(user.examDate).getTime() - Date.now()) / 86400000))
    : null;
  const firstName = (user?.name || 'there').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Clean task-type styling. Primary accent is reserved for QUIZ (the actionable
  // type); every other type uses a neutral chip so the list reads calm, not rainbow.
  const getTaskMeta = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return { icon: Video, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Video' };
      case 'QUIZ':
        return { icon: FileQuestion, color: 'text-primary', bg: 'bg-primary/10', label: 'Quiz' };
      case 'READING':
        return { icon: BookOpen, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Reading' };
      case 'PRACTICE':
        return { icon: PenLine, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Practice' };
      case 'REVIEW':
        return { icon: RefreshCw, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Review' };
      default:
        return { icon: ClipboardList, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Task' };
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="mt-4 text-muted-foreground">Loading your dashboard…</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
              <Timer className="h-6 w-6 text-destructive" />
            </div>
            <p className="font-medium text-foreground">{error}</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Back to home <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Greeting */}
          <Reveal>
            <p className="text-sm font-medium text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {greeting}, <span className="gradient-text">{firstName}</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              {todaysTasks.length === 0
                ? "You're all caught up — nothing scheduled for today."
                : pendingToday === 0
                  ? `All ${todaysTasks.length} of today's tasks are done. Great work!`
                  : `You have ${pendingToday} task${pendingToday > 1 ? 's' : ''} left today. Let's get to it.`}
            </p>
          </Reveal>

          {/* KPIs */}
          <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Exam readiness', value: readinessScore.overallScore, suffix: '%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', dash: false },
              { label: "Today's tasks", value: todaysTasks.length, suffix: '', icon: ListTodo, color: 'text-muted-foreground', bg: 'bg-secondary', dash: false },
              { label: 'Completed', value: completedToday, suffix: '', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', dash: false },
              { label: 'Days to exam', value: daysToExam ?? 0, suffix: '', icon: CalendarDays, color: 'text-muted-foreground', bg: 'bg-secondary', dash: daysToExam === null },
            ].map((kpi) => (
              <RevealItem key={kpi.label}>
                <div className="card-hover rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg} ${kpi.color}`}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  <div className="font-display text-3xl font-bold">
                    {kpi.dash ? '—' : <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />}
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{kpi.label}</div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Today's plan */}
            <Reveal className="lg:col-span-2">
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ListTodo className="h-5 w-5" />
                    </div>
                    <h2 className="font-display text-lg font-semibold">Today's plan</h2>
                  </div>
                  {todaysTasks.length > 0 && (
                    <Badge variant="secondary">{completedToday}/{todaysTasks.length} done</Badge>
                  )}
                </div>

                {todaysTasks.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <h3 className="font-display text-lg font-semibold">You're all caught up</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      {user?.name === 'New User'
                        ? 'Your study plan is being generated — check back shortly.'
                        : 'No tasks scheduled today. Plan ahead from your calendar.'}
                    </p>
                    <Link href={`/calendar?userId=${user?._id}`} className="mt-5">
                      <Button variant="outline">Open calendar <ArrowRight className="h-4 w-4" /></Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {todaysTasks.map((task, ti) => {
                      const meta = getTaskMeta(task.type);
                      const done = task.status === 'COMPLETED';
                      // Any task with attached content is startable (quiz, practice,
                      // reading, video, review) — the /quiz/[id] runner handles every type.
                      const contentId = task.content?._id || task.content;
                      const clickable = !!contentId;
                      return (
                        <div
                          key={task._id}
                          className="rise-in group flex items-center gap-3 px-6 py-4 transition-colors hover:bg-secondary/50"
                          style={{ ['--i' as string]: ti }}
                        >
                          <button
                            onClick={() => handleTaskStatusChange(task._id, done ? 'PENDING' : 'COMPLETED')}
                            className={cn(
                              'press flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors',
                              done ? 'check-pop border-success bg-success text-white' : 'border-input hover:border-primary'
                            )}
                            aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {done && <CheckCircle2 className="h-4 w-4" />}
                          </button>
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}
                          >
                            <meta.icon className="h-[18px] w-[18px]" />
                          </div>
                          <div className="min-w-0 flex-1 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">
                            <p className={cn('truncate text-sm font-medium', done && 'text-muted-foreground line-through')}>
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {meta.label}
                              {task.duration ? ` · ${task.duration} min` : ''}
                            </p>
                          </div>
                          {clickable && !done && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-70 transition-opacity group-hover:opacity-100"
                              onClick={() => router.push(`/quiz/${contentId}?taskId=${task._id}&userId=${user?._id}`)}
                            >
                              Start <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {todaysTasks.length > 0 && (
                  <div className="border-t border-border px-6 py-4">
                    <Link
                      href={`/calendar?userId=${user?._id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      View full schedule <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Right column */}
            <div className="space-y-6">
              {/* Readiness */}
              <Reveal delay={0.05}>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <h2 className="font-display text-lg font-semibold">Exam readiness</h2>
                  </div>
                  <div className="flex justify-center">
                    <div className="relative h-32 w-32">
                      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--secondary)" strokeWidth="10" />
                        {/* ring draws in on mount (ringReady flips post-mount → CSS transition) */}
                        <circle
                          cx="60" cy="60" r="52" fill="none" stroke="url(#rg)" strokeWidth="10" strokeLinecap="round"
                          className="ring-draw ring-glow"
                          strokeDasharray={2 * Math.PI * 52}
                          strokeDashoffset={
                            ringReady
                              ? 2 * Math.PI * 52 * (1 - (readinessScore.overallScore || 0) / 100)
                              : 2 * Math.PI * 52
                          }
                        />
                        <defs>
                          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--brand-from)" />
                            <stop offset="100%" stopColor="var(--brand-to)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-display text-3xl font-bold">
                          <AnimatedCounter value={readinessScore.overallScore || 0} />
                          <span className="text-lg">%</span>
                        </span>
                        <span className="text-xs text-muted-foreground">ready</span>
                      </div>
                    </div>
                  </div>
                  {readinessScore.categoryScores.length > 0 ? (
                    <div className="mt-6 space-y-3">
                      {readinessScore.categoryScores.slice(0, 3).map((c, ci) => (
                        <div key={c.category}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="font-medium text-muted-foreground">
                              {c.category.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                            </span>
                            <span className="font-semibold">{c.score}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="bar-grow h-full rounded-full brand-gradient"
                              style={{ width: `${c.score}%`, ['--i' as string]: ci }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 text-center text-sm text-muted-foreground">
                      Complete tasks to build your readiness score.
                    </p>
                  )}
                  <Link href={`/progress?userId=${user?._id}`} className="mt-5 block">
                    <Button variant="outline" className="w-full">
                      View detailed progress <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Reveal>

              {/* Countdown */}
              <Reveal delay={0.1}>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Timer className="h-5 w-5" />
                    </div>
                    <h2 className="font-display text-lg font-semibold">Exam countdown</h2>
                  </div>
                  {daysToExam !== null ? (
                    <div className="text-center">
                      <div className="font-display text-5xl font-bold gradient-text">{daysToExam}</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        days to go · {format(new Date(user.examDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">No exam date set yet.</p>
                      <Link href={`/profile?userId=${user?._id}`}>
                        <Button variant="ghost" size="sm" className="mt-2">Set exam date</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Reveal>

              {/* Adaptive agent activity — what the AI changed recently */}
              <PlanUpdatesCard userId={user?._id} />
            </div>
          </div>

          {/* Where to focus */}
          {focusAreas.length > 0 && (
            <Reveal>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-lg font-semibold">Where to focus</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {focusAreas.slice(0, 4).map((area, i) => {
                    const topicName = area.name || area.topic || area.category || 'Topic';
                    return (
                      <div
                        key={i}
                        className={cn(
                          'lift rise-in flex flex-col rounded-xl border p-4',
                          area.type === 'weak' ? 'border-destructive/20 bg-destructive/5' : 'border-success/20 bg-success/5'
                        )}
                        style={{ ['--i' as string]: i }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-lg',
                              area.type === 'weak' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                            )}
                          >
                            {area.type === 'weak' ? <Target className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </span>
                          <p className="text-sm font-semibold">{topicName}</p>
                        </div>
                        <p className="mt-2 flex-1 text-xs text-muted-foreground">{area.message}</p>
                        {/* Close the loop: a weak area is one click from a tutoring session on it */}
                        {area._id && (
                          <div className="mt-3 flex items-center gap-3">
                            <Link
                              href={`/tutor/topic/${area._id}?prompt=${encodeURIComponent(
                                `I keep struggling with ${topicName}. Can you review the core concepts with me and quiz me on the tricky parts?`
                              )}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                            >
                              <Sparkles className="h-3.5 w-3.5" /> Ask AI Tutor
                            </Link>
                            <Link
                              href={`/notes?q=${encodeURIComponent(topicName)}`}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                              <NotebookPen className="h-3.5 w-3.5" /> My notes
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}