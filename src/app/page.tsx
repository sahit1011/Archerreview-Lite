"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
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
  Atom,
  FlaskConical,
  Dna,
  Sigma,
  BookOpen,
  Target,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { VelocityMarquee } from "@/components/ui/velocity-marquee";
import { TiltCard } from "@/components/ui/tilt-card";
import HowItWorksCinematic from "@/components/landing/HowItWorksCinematic";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  { icon: Brain, color: "text-indigo-500", bg: "bg-indigo-500/12", title: "Adaptive AI Study Plan", desc: "A day-by-day plan that rebalances automatically as your performance changes." },
  { icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/12", title: "Smart Diagnostic", desc: "A quick diagnostic maps your strengths and weak chapters across every subject." },
  { icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-500/12", title: "Interactive Calendar", desc: "Drag-and-drop scheduling that fits your availability, mocks, and revision cycles." },
  { icon: Sparkles, color: "text-sky-500", bg: "bg-sky-500/12", title: "24/7 AI Tutor", desc: "Contextual explanations and doubt-solving for any topic, the moment you're stuck." },
  { icon: LineChart, color: "text-amber-500", bg: "bg-amber-500/12", title: "Readiness Analytics", desc: "A live readiness score and trend lines so you always know where you stand." },
  { icon: Repeat2, color: "text-rose-500", bg: "bg-rose-500/12", title: "Spaced Repetition", desc: "An SM-2 engine resurfaces weak concepts at the perfect time to lock them in." },
];

const marqueeTopics = [
  "Mechanics", "Organic Chemistry", "Human Physiology", "Calculus", "Electrostatics",
  "Genetics", "Thermodynamics", "Coordinate Geometry", "Optics", "Cell Biology",
  "Algebra", "Modern Physics", "Chemical Bonding", "Ecology",
];

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
  const beamsY = useTransform(heroProgress, [0, 1], [0, 90]);
  const headlineY = useTransform(heroProgress, [0, 1], [0, -70]);
  const headlineOpacity = useTransform(heroProgress, [0, 0.75], [1, 0.15]);
  const orbY = useTransform(heroProgress, [0, 1], [0, 190]);

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

      {/* Hero — parallax depth planes: beams (slow) < headline (recedes) < orb (fast) */}
      <section ref={heroRef} className="aurora-bg relative overflow-hidden">
        <motion.div className="absolute inset-0" style={reduceMotion ? undefined : { y: beamsY }}>
          <BackgroundBeams />
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[8%] top-32 h-24 w-24 rounded-2xl brand-gradient opacity-20 blur-xl float-y"
          animate={{ rotate: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={reduceMotion ? undefined : { y: orbY }}
        />

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

          {/* Stat strip with count-up */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { node: <AnimatedCounter value={2} />, label: "Exam tracks" },
              { node: <AnimatedCounter value={500} suffix="+" />, label: "Chapters covered" },
              { node: "24/7", label: "AI tutor" },
              { node: <AnimatedCounter value={100} suffix="%" />, label: "Personalized" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06}>
                <div className="gradient-border card-hover rounded-2xl bg-card/70 p-4 backdrop-blur">
                  <div className="font-display text-3xl font-bold gradient-text">{s.node}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
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
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${f.bg} ${f.color} transition-all duration-300 group-hover:brand-gradient group-hover:text-white group-hover:shadow-button`}>
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

      {/* Tracks — glassmorphic cards over slow drifting boxes */}
      <section className="relative overflow-hidden py-20">
        <div aria-hidden className="moving-boxes pointer-events-none absolute inset-0 opacity-80" />
        <div aria-hidden className="drift-box drift-1 left-0 top-12 h-16 w-16" />
        <div aria-hidden className="drift-box drift-2 left-0 top-44 h-10 w-10" />
        <div aria-hidden className="drift-box drift-3 bottom-12 left-0 h-24 w-24" />

        <div className="relative mx-auto max-w-6xl px-5">
          <Reveal className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built for both <span className="gradient-text">NEET &amp; JEE</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Pick your track at onboarding — the whole platform adapts to your syllabus.
            </p>
          </Reveal>
          <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                icon: Stethoscope,
                tag: "Medical",
                title: "NEET",
                fullName: "National Eligibility cum Entrance Test",
                subjects: [
                  { name: "Physics", icon: Atom, color: "text-indigo-500", bg: "bg-indigo-500/12" },
                  { name: "Chemistry", icon: FlaskConical, color: "text-violet-500", bg: "bg-violet-500/12" },
                  { name: "Biology", icon: Dna, color: "text-emerald-500", bg: "bg-emerald-500/12" },
                ],
              },
              {
                icon: Cog,
                tag: "Engineering",
                title: "JEE",
                fullName: "Joint Entrance Examination · Main + Advanced",
                subjects: [
                  { name: "Physics", icon: Atom, color: "text-indigo-500", bg: "bg-indigo-500/12" },
                  { name: "Chemistry", icon: FlaskConical, color: "text-violet-500", bg: "bg-violet-500/12" },
                  { name: "Maths", icon: Sigma, color: "text-sky-500", bg: "bg-sky-500/12" },
                ],
              },
            ].map((t) => (
              <RevealItem key={t.title}>
                <TiltCard className="h-full">
                <div className="beam glassmorphic group relative h-full overflow-hidden rounded-2xl p-7">
                  {/* layered glow */}
                  <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-primary/25 to-violet-400/10 blur-2xl" />

                  {/* header */}
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient text-white shadow-button transition-transform duration-300 group-hover:scale-110">
                        <t.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display text-2xl font-bold leading-none">{t.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{t.fullName}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{t.tag}</Badge>
                  </div>

                  {/* subject tiles */}
                  <div className="relative mt-6 grid grid-cols-3 gap-2.5">
                    {t.subjects.map((s) => (
                      <div
                        key={s.name}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border/70 bg-card/50 p-3 text-center backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/30"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg} ${s.color}`}>
                          <s.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold">{s.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* feature pills */}
                  <div className="relative mt-5 flex flex-wrap gap-2">
                    {[
                      { icon: BookOpen, label: "Full syllabus" },
                      { icon: Target, label: "Chapter-wise mocks" },
                      { icon: Sparkles, label: "AI doubt-solving" },
                    ].map((f) => (
                      <span
                        key={f.label}
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        <f.icon className="h-3 w-3 text-primary" />
                        {f.label}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    variant="brand"
                    className="shine relative mt-6 w-full"
                    onClick={handleStartOnboarding}
                  >
                    Start {t.title} prep <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* How it works — pinned scroll sequence: your scroll drives the story */}
      <HowItWorksCinematic />

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl brand-gradient px-8 py-16 text-center text-white shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_45%)]" />
            <motion.div
              aria-hidden
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
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
