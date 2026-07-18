"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useReducedMotion, useInView } from "framer-motion";
import {
  Sparkles,
  CalendarDays,
  Brain,
  LineChart,
  GraduationCap,
  Repeat2,
  ArrowRight,
  Stethoscope,
  Cog,
  BookOpen,
  Target,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { AnimateNumber } from "@/components/ui/animated-blur-number";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { VelocityMarquee } from "@/components/ui/velocity-marquee";
import HowItWorksCinematic from "@/components/landing/HowItWorksCinematic";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  { icon: Brain, color: "text-primary", bg: "bg-primary/10", title: "Adaptive AI Study Plan", desc: "A day-by-day plan that rebalances automatically as your performance changes." },
  { icon: GraduationCap, color: "text-primary", bg: "bg-primary/10", title: "Smart Diagnostic", desc: "A quick diagnostic maps your strengths and weak chapters across every subject." },
  { icon: CalendarDays, color: "text-primary", bg: "bg-primary/10", title: "Interactive Calendar", desc: "Drag-and-drop scheduling that fits your availability, mocks, and revision cycles." },
  { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", title: "24/7 AI Tutor", desc: "Contextual explanations and doubt-solving for any topic, the moment you're stuck." },
  { icon: LineChart, color: "text-primary", bg: "bg-primary/10", title: "Readiness Analytics", desc: "A live readiness score and trend lines so you always know where you stand." },
  { icon: Repeat2, color: "text-primary", bg: "bg-primary/10", title: "Spaced Repetition", desc: "An SM-2 engine resurfaces weak concepts at the perfect time to lock them in." },
];

const marqueeTopics = [
  "Mechanics", "Organic Chemistry", "Human Physiology", "Calculus", "Electrostatics",
  "Genetics", "Thermodynamics", "Coordinate Geometry", "Optics", "Cell Biology",
  "Algebra", "Modern Physics", "Chemical Bonding", "Ecology",
];

const COUNT_UP_STEPS = 26;
const COUNT_UP_DURATION_MS = 1100;

// Eases a value from 0 to `target` once the element scrolls into view, in
// discrete steps so each tick drives the digit-blur transition — an odometer
// roll rather than a raw count. Respects reduced-motion by settling instantly.
function StatNumber({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      const progress = step / COUNT_UP_STEPS;
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      if (step >= COUNT_UP_STEPS) {
        setDisplay(value);
        clearInterval(id);
      } else {
        setDisplay(Math.round(value * eased));
      }
    }, COUNT_UP_DURATION_MS / COUNT_UP_STEPS);
    return () => clearInterval(id);
  }, [inView, value, reduceMotion]);

  return (
    <span ref={ref}>
      <AnimateNumber value={display} suffix={suffix} duration={420} blur={14} />
    </span>
  );
}

const heroStats: { node: React.ReactNode; label: string }[] = [
  { node: <StatNumber value={2} />, label: "Exam tracks" },
  { node: <StatNumber value={500} suffix="+" />, label: "Chapters covered" },
  { node: "24/7", label: "AI tutor" },
  { node: <StatNumber value={100} suffix="%" />, label: "Personalized" },
];

// Exam-track data. Weightage is a single accent (primary) at stepped opacity —
// one hue, never a rainbow. Splits are the real, defensible board patterns
// (NEET: Physics/Chemistry 45q each, Biology 90q → 25/25/50; JEE Main: equal).
const SUBJECT_BAR = ["bg-primary", "bg-primary/60", "bg-primary/30"] as const;

const examTracks = [
  {
    id: "neet",
    title: "NEET",
    tag: "Medical",
    fullName: "National Eligibility cum Entrance Test",
    pattern: "NEET pattern",
    Icon: Stethoscope,
    subjects: [
      { name: "Physics", pct: 25 },
      { name: "Chemistry", pct: 25 },
      { name: "Biology", pct: 50 },
    ],
  },
  {
    id: "jee",
    title: "JEE",
    tag: "Engineering",
    fullName: "Joint Entrance Examination · Main + Advanced",
    pattern: "JEE Main pattern",
    Icon: Cog,
    subjects: [
      { name: "Physics", pct: 33 },
      { name: "Chemistry", pct: 33 },
      { name: "Maths", pct: 34 },
    ],
  },
] as const;

const trackFeatures = [
  { icon: BookOpen, label: "Full syllabus" },
  { icon: Target, label: "Chapter-wise mocks" },
  { icon: Brain, label: "AI doubt-solving" },
] as const;

export default function Home() {
  const router = useRouter();
  const { logout } = useUser();
  const reduceMotion = useReducedMotion();

  // Hero parallax planes: background beams drift slower than the receding
  // headline, the orb faster — three depth layers driven by scroll position.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const headlineY = useTransform(heroProgress, [0, 1], [0, -70]);
  const headlineOpacity = useTransform(heroProgress, [0, 0.75], [1, 0.15]);

  const handleStartOnboarding = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    logout();
    router.push("/onboarding/account-creation");
  };

  return (
    <div className="min-h-screen">
      <ScrollProgress />
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-button">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">StudyArc</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Button variant="brand" size="sm" className="shine" onClick={handleStartOnboarding}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — static aurora tint + faint line-art rails; headline recedes on scroll */}
      <section ref={heroRef} className="aurora-bg relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <BackgroundBeams />
        </div>

        <motion.div
          className="relative mx-auto max-w-6xl px-5 pt-16 pb-14 text-center sm:pt-24"
          style={reduceMotion ? undefined : { y: headlineY, opacity: headlineOpacity }}
        >
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center">
            <Badge variant="default" className="mb-6 gap-1.5 px-3 py-1 text-sm shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered prep for NEET &amp; JEE
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mx-auto max-w-4xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl"
          >
            Your personal AI coach for <br className="hidden sm:block" />
            <span className="shimmer-text">cracking NEET &amp; JEE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            An adaptive study planner that builds your schedule, finds your weak chapters, and
            coaches you every day — so you study smarter, not just harder.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button variant="brand" size="lg" className="shine w-full sm:w-auto" onClick={handleStartOnboarding}>
              Start free <ArrowRight className="h-4 w-4" />
            </Button>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full">I already have an account</Button>
            </Link>
          </motion.div>

          <p className="mt-4 text-sm text-muted-foreground">No credit card • Personalized in under 5 minutes</p>

          {/* Stat strip — borderless, divider-separated (premium marketing pattern) */}
          <Reveal className="mx-auto mt-16 w-full max-w-3xl">
            <dl className="grid grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-border/50">
              {heroStats.map((s) => (
                <div key={s.label} className="flex flex-col items-center px-4 text-center sm:px-6">
                  <dt className="font-display text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl">
                    {s.node}
                  </dt>
                  <dd className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </motion.div>

        {/* Subjects marquee — cruises on its own, accelerates and reverses with your scroll */}
        <div className="relative overflow-hidden border-y border-border/60 bg-card/40 py-4 backdrop-blur">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
          <VelocityMarquee>
            {marqueeTopics.map((t) => (
              <span key={t} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                {t}
              </span>
            ))}
          </VelocityMarquee>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to top the exam
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            One platform that plans, teaches, tests, and adapts — built around how you actually learn.
          </p>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <RevealItem key={f.title}>
              <SpotlightCard className="h-full">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${f.bg} ${f.color} transition-colors duration-300 group-hover:bg-primary/15`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                <div className="mt-4 h-0.5 w-0 rounded-full brand-gradient transition-all duration-300 group-hover:w-12" />
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Tracks — one framed comparison object, split by a single hairline spine */}
      <section className="relative py-20 sm:py-24">
        <div className="relative mx-auto max-w-5xl px-5">
          <Reveal className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built for both <span className="gradient-text">NEET &amp; JEE</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Pick your track at onboarding — the whole platform adapts to your syllabus.
            </p>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
              {examTracks.map((t, ti) => {
                const srWeightage = `${t.title} weightage — ${t.subjects
                  .map((s) => `${s.name} ${s.pct} percent`)
                  .join(", ")}`;
                return (
                  <article
                    key={t.id}
                    aria-labelledby={`track-${t.id}`}
                    className="group relative flex h-full flex-col bg-card p-7 transition-colors duration-300 hover:bg-primary/[0.04] sm:p-8"
                  >
                    {/* accent seam — draws in on hover (transform + opacity only) */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-all duration-500 group-hover:scale-x-100 group-hover:opacity-100"
                    />

                    {/* header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-secondary">
                          <t.Icon className="h-[18px] w-[18px] text-primary" />
                        </div>
                        <div>
                          <h3 id={`track-${t.id}`} className="font-display text-2xl font-bold leading-none">
                            {t.title}
                          </h3>
                          <p className="mt-1.5 min-h-[2rem] text-xs leading-snug text-muted-foreground">
                            {t.fullName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{t.tag}</Badge>
                    </div>

                    <div className="my-5 h-px bg-border" />

                    {/* subject-weightage telemetry strip — the signature */}
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          Subject weightage
                        </p>
                        <span className="font-mono text-[0.7rem] text-muted-foreground">{t.pattern}</span>
                      </div>
                      <div
                        role="img"
                        aria-label={srWeightage}
                        className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-secondary"
                      >
                        {t.subjects.map((s, si) => (
                          <div key={s.name} style={{ flexBasis: `${s.pct}%` }} className="h-full">
                            <motion.div
                              className={`h-full w-full origin-left rounded-full ${SUBJECT_BAR[si]}`}
                              initial={reduceMotion ? false : { scaleX: 0 }}
                              whileInView={{ scaleX: 1 }}
                              viewport={{ once: true, margin: "-60px" }}
                              transition={
                                reduceMotion
                                  ? { duration: 0 }
                                  : { type: "spring", stiffness: 120, damping: 20, delay: 0.12 * ti + 0.1 * si }
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {t.subjects.map((s, si) => (
                          <div key={s.name} className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SUBJECT_BAR[si]}`} />
                            <span className="text-xs text-foreground">{s.name}</span>
                            <span className="ml-auto font-mono text-[0.7rem] text-muted-foreground">{s.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* feature ledger — hairline-divided spec rows, not pills */}
                    <ul className="mt-7 divide-y divide-border border-y border-border">
                      {trackFeatures.map((f) => (
                        <li key={f.label} className="flex items-center gap-3 py-3 text-sm">
                          <f.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>{f.label}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA — bottom-aligned across both halves */}
                    <div className="mt-auto pt-8">
                      <Button variant="brand" className="w-full" onClick={handleStartOnboarding}>
                        Start {t.title} prep <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works — product-preview journey ledger (4 steps, each shows the real thing) */}
      <HowItWorksCinematic />

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl brand-gradient px-8 py-16 text-center text-white shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_45%)]" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Ready to start your rank journey?</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85">
                Join thousands of aspirants studying smarter with an AI coach in their corner.
              </p>
              <Button size="lg" onClick={handleStartOnboarding} className="shine mt-8 bg-white text-primary hover:bg-white/90">
                Create your free plan <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg brand-gradient text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-foreground">StudyArc</span>
          </div>
          <p>© 2026 StudyArc — AI-adaptive NEET &amp; JEE preparation.</p>
        </div>
      </footer>
    </div>
  );
}
