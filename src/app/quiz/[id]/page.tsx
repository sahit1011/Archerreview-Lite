"use client";

/**
 * Learner Task View + Quiz Runner — the core study action.
 *
 * Reached as /quiz/[contentId]?taskId=...  (previously a 404 from 5 call sites).
 * Handles every Content type:
 *   - QUIZ / PRACTICE: interactive questions, immediate rationale, per-question scoring
 *   - VIDEO: embedded/launchable video
 *   - READING: rendered article
 * On completion it records real per-question Performance and marks the Task COMPLETED, so the
 * dashboard analytics and the adaptivity agents finally receive genuine signal.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  BookOpen,
  Brain,
  Loader2,
  Lightbulb,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/ui/spotlight-card";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
interface Content {
  _id: string;
  title: string;
  description: string;
  type: "VIDEO" | "QUIZ" | "READING" | "PRACTICE";
  topic: { _id: string; name?: string } | string;
  duration: number;
  url?: string;
  content?: string;
  questions?: QuizQuestion[];
}
interface AnswerRecord {
  questionIndex: number;
  selectedOption: number;
  isCorrect: boolean;
  timeSpent: number; // seconds
}

const topicId = (c: Content) => (typeof c.topic === "string" ? c.topic : c.topic?._id);

const TYPE_LABEL: Record<Content["type"], string> = {
  VIDEO: "Video lesson",
  QUIZ: "Quiz",
  READING: "Reading",
  PRACTICE: "Practice set",
};

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (url.includes("youtube.com/embed/")) return url;
  return null;
}

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const contentId = params?.id as string;
  const taskId = searchParams.get("taskId");

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // quiz state
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);

  // completion state
  const [confidence, setConfidence] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const questionStartedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!contentId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/content/${contentId}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Could not load this study item.");
        const json = await res.json();
        const c: Content = json.content ?? json.data ?? json;
        setContent(c);
        startedAt.current = Date.now();
        questionStartedAt.current = Date.now();
      } catch (e: any) {
        setError(e?.message || "Something went wrong loading this content.");
      } finally {
        setLoading(false);
      }
    })();
  }, [contentId, router]);

  const questions = useMemo(() => content?.questions ?? [], [content]);
  const isQuiz =
    (content?.type === "QUIZ" || content?.type === "PRACTICE") && questions.length > 0;
  const score = useMemo(() => {
    if (!answers.length) return 0;
    return Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100);
  }, [answers]);

  const submitAnswer = () => {
    if (selected === null || !content) return;
    const q = questions[index];
    setAnswers((prev) => [
      ...prev,
      {
        questionIndex: index,
        selectedOption: selected,
        isCorrect: selected === q.correctAnswer,
        timeSpent: Math.max(1, Math.round((Date.now() - questionStartedAt.current) / 1000)),
      },
    ]);
    setRevealed(true);
  };

  const nextQuestion = () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      questionStartedAt.current = Date.now();
    } else {
      setFinished(true);
    }
  };

  const complete = async () => {
    if (!content || !taskId) {
      // No task context (e.g., opened a content item directly) — just go back.
      router.push("/dashboard");
      return;
    }
    setSubmitting(true);
    try {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
      await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          contentId: content._id,
          topicId: topicId(content),
          score: isQuiz ? score : undefined,
          timeSpent: minutes,
          completed: true,
          confidence,
          answers: isQuiz ? answers : [],
        }),
      });
      // Mark the task complete (triggers downstream adaptivity)
      await fetch(`/api/tasks/${taskId}/complete`, { method: "PATCH" });
      router.push("/dashboard?completed=1");
    } catch {
      setError("Saved your answers locally, but couldn't sync to the server. Please retry.");
      setSubmitting(false);
    }
  };

  // ---------- render states ----------
  if (loading) {
    return (
      <Centered>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
        <p className="mt-4 text-muted-foreground">Loading your study item…</p>
      </Centered>
    );
  }
  if (error && !content) {
    return (
      <Centered>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <XCircle className="h-7 w-7 text-destructive" />
        </div>
        <p className="mt-4 max-w-sm text-foreground">{error}</p>
        <Button onClick={() => router.push("/dashboard")} variant="brand" className="mt-6">
          Back to dashboard
        </Button>
      </Centered>
    );
  }
  if (!content) return null;

  const TypeIcon = content.type === "VIDEO" ? PlayCircle : content.type === "READING" ? BookOpen : Brain;

  return (
    <div className="min-h-screen bg-background">
      {/* Slim focus-mode topbar: keep brand context + a clear exit */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="font-display text-sm font-bold tracking-tight text-foreground">
            Study<span className="text-primary">Arc</span>
          </span>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Exit
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <TypeIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <Badge variant="brand" className="mb-1.5 uppercase tracking-wide">
            {TYPE_LABEL[content.type]}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {content.title}
          </h1>
          {content.description && (
            <p className="mt-1.5 text-muted-foreground">{content.description}</p>
          )}
        </div>
      </div>

      {/* QUIZ / PRACTICE */}
      {isQuiz && !finished && (
        <QuizRunner
          q={questions[index]}
          index={index}
          total={questions.length}
          selected={selected}
          revealed={revealed}
          onSelect={setSelected}
          onSubmit={submitAnswer}
          onNext={nextQuestion}
        />
      )}

      {/* QUIZ results + confidence + finish */}
      {isQuiz && finished && (
        <ResultsCard
          score={score}
          correct={answers.filter((a) => a.isCorrect).length}
          total={questions.length}
          confidence={confidence}
          setConfidence={setConfidence}
          submitting={submitting}
          onComplete={complete}
          error={error}
        />
      )}

      {/* VIDEO */}
      {content.type === "VIDEO" && (
        <ConsumeCard
          confidence={confidence}
          setConfidence={setConfidence}
          submitting={submitting}
          onComplete={complete}
          error={error}
        >
          {content.url && toEmbedUrl(content.url) ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-border">
              <iframe src={toEmbedUrl(content.url)!} className="h-full w-full" allowFullScreen title={content.title} />
            </div>
          ) : content.url ? (
            <Button asChild variant="brand">
              <a href={content.url} target="_blank" rel="noopener noreferrer">
                <PlayCircle className="mr-2 h-4 w-4" /> Open video
              </a>
            </Button>
          ) : (
            <p className="text-muted-foreground">No video URL is attached to this item yet.</p>
          )}
        </ConsumeCard>
      )}

      {/* READING */}
      {content.type === "READING" && (
        <ConsumeCard
          confidence={confidence}
          setConfidence={setConfidence}
          submitting={submitting}
          onComplete={complete}
          error={error}
        >
          {content.content ? (
            <article
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          ) : content.url ? (
            <Button asChild variant="brand">
              <a href={content.url} target="_blank" rel="noopener noreferrer">
                Open reading
              </a>
            </Button>
          ) : (
            <p className="text-muted-foreground">No reading content is attached to this item yet.</p>
          )}
        </ConsumeCard>
      )}

      {/* QUIZ type but no questions seeded */}
      {(content.type === "QUIZ" || content.type === "PRACTICE") && questions.length === 0 && (
        <ConsumeCard
          confidence={confidence}
          setConfidence={setConfidence}
          submitting={submitting}
          onComplete={complete}
          error={error}
        >
          <p className="text-muted-foreground">No questions are attached to this quiz yet.</p>
        </ConsumeCard>
      )}
      </div>
    </div>
  );
}

function QuizRunner({
  q, index, total, selected, revealed, onSelect, onSubmit, onNext,
}: {
  q: QuizQuestion; index: number; total: number; selected: number | null; revealed: boolean;
  onSelect: (i: number) => void; onSubmit: () => void; onNext: () => void;
}) {
  const progress = (index / total) * 100;
  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Question <span className="text-primary">{index + 1}</span>
            <span className="text-muted-foreground"> of {total}</span>
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full brand-gradient"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <SpotlightCard className="rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">{q.question}</h2>
        <div className="mt-6 space-y-3">
          {q.options.map((opt, i) => {
            const isSel = selected === i;
            const isCorrect = i === q.correctAnswer;
            let cls =
              "border-border bg-secondary/40 hover:border-primary/60 hover:bg-secondary/70";
            let badgeCls = "border-border bg-muted text-muted-foreground";
            if (revealed) {
              if (isCorrect) {
                cls = "border-success/60 bg-success/10";
                badgeCls = "border-success/60 bg-success/15 text-success";
              } else if (isSel) {
                cls = "border-destructive/60 bg-destructive/10";
                badgeCls = "border-destructive/60 bg-destructive/15 text-destructive";
              } else {
                cls = "border-border bg-secondary/30 opacity-60";
              }
            } else if (isSel) {
              cls = "border-primary bg-primary/10";
              badgeCls = "border-primary bg-primary/15 text-primary";
            }
            return (
              <button
                key={i}
                disabled={revealed}
                onClick={() => onSelect(i)}
                className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${cls}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${badgeCls}`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-foreground">{opt}</span>
                {revealed && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />}
                {revealed && isSel && !isCorrect && (
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden"
            >
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Lightbulb className="h-4 w-4" /> Rationale
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-7 flex justify-end">
          {!revealed ? (
            <Button onClick={onSubmit} disabled={selected === null} variant="brand" size="lg">
              Check answer
            </Button>
          ) : (
            <Button onClick={onNext} variant="brand" size="lg">
              {index + 1 < total ? "Next question" : "See results"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </SpotlightCard>
    </div>
  );
}

function ResultsCard({
  score, correct, total, confidence, setConfidence, submitting, onComplete, error,
}: {
  score: number; correct: number; total: number; confidence: number;
  setConfidence: (n: number) => void; submitting: boolean; onComplete: () => void; error: string | null;
}) {
  const tone =
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  const ringTone =
    score >= 80 ? "ring-success/30 bg-success/10" : score >= 60 ? "ring-warning/30 bg-warning/10" : "ring-destructive/30 bg-destructive/10";
  const headline =
    score >= 80 ? "Excellent work!" : score >= 60 ? "Good effort — keep going" : "Room to grow — review this topic";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <SpotlightCard className="rounded-2xl p-8 text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${ringTone}`}
        >
          <Trophy className={`h-8 w-8 ${tone}`} />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Quiz complete
        </p>
        <div className={`mt-2 text-6xl font-bold tracking-tight ${tone}`}>{score}%</div>
        <p className="mt-2 text-foreground">{headline}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {correct} of {total} correct
        </p>

        <div className="mx-auto mt-6 max-w-sm">
          <ConfidencePicker confidence={confidence} setConfidence={setConfidence} />
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <Button onClick={onComplete} disabled={submitting} variant="brand" size="lg" className="mt-7">
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Complete &amp; save
        </Button>
      </SpotlightCard>
    </motion.div>
  );
}

function ConsumeCard({
  children, confidence, setConfidence, submitting, onComplete, error,
}: {
  children: React.ReactNode; confidence: number; setConfidence: (n: number) => void;
  submitting: boolean; onComplete: () => void; error: string | null;
}) {
  return (
    <SpotlightCard className="rounded-2xl p-6 sm:p-8">
      {children}
      <div className="mt-7 border-t border-border pt-7">
        <div className="max-w-sm">
          <ConfidencePicker confidence={confidence} setConfidence={setConfidence} />
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <Button onClick={onComplete} disabled={submitting} variant="brand" size="lg" className="mt-6">
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Mark complete
        </Button>
      </div>
    </SpotlightCard>
  );
}

function ConfidencePicker({ confidence, setConfidence }: { confidence: number; setConfidence: (n: number) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">How confident do you feel about this topic?</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setConfidence(n)}
            className={`h-11 w-11 rounded-xl border text-sm font-semibold transition-all ${
              confidence === n
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/60 hover:text-foreground"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between px-1 text-xs text-muted-foreground">
        <span>Not confident</span>
        <span>Very confident</span>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">{children}</div>
  );
}
