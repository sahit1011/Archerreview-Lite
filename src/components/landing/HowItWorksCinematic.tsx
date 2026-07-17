"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { GraduationCap, Brain, CalendarDays, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: GraduationCap,
    title: "Pick your exam",
    desc: "Choose NEET or JEE and set your target date. The whole platform reshapes around your syllabus.",
    visual: "Two tracks. One picks Physics·Chemistry·Biology, the other Physics·Chemistry·Maths.",
  },
  {
    icon: Brain,
    title: "Take the diagnostic",
    desc: "A short adaptive test maps what you already know — chapter by chapter, subject by subject.",
    visual: "Your strengths and weak chapters, found in minutes.",
  },
  {
    icon: CalendarDays,
    title: "Get your plan",
    desc: "An adaptive calendar is generated for your dates, your hours, your weak spots.",
    visual: "Every day scheduled: watch, read, quiz, review.",
  },
  {
    icon: Sparkles,
    title: "Learn & adapt",
    desc: "Every task you finish reshapes tomorrow. Miss a day? The plan absorbs it and rebalances.",
    visual: "The AI coach quietly reshuffles, reschedules, and reinforces.",
  },
];

/**
 * Pinned scroll sequence: the section holds the viewport for ~3 screen-heights
 * while scroll progress drives the active step — the reader's scroll IS the
 * narration. Falls back to a plain stacked list under reduced motion.
 */
export default function HowItWorksCinematic() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length))));
  });

  if (reduce) {
    // Honest static alternative: same content, no pinning.
    return (
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="mb-10 text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Get started in 4 steps
        </h2>
        <ol className="mx-auto max-w-2xl space-y-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl brand-gradient text-white">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display font-semibold">{i + 1}. {s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-5 lg:grid-cols-2">
          {/* Left: the narrated steps with a scroll-fed progress rail */}
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Get started in 4 steps
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Keep scrolling — this is the whole journey.
            </p>

            <div className="relative mt-10">
              {/* rail */}
              <div className="absolute bottom-4 left-5 top-4 w-px bg-border" aria-hidden />
              <motion.div
                aria-hidden
                className="brand-gradient absolute left-5 top-4 w-px origin-top"
                style={{ height: `calc(${(active / (STEPS.length - 1)) * 100}% - 2rem)` }}
                transition={{ duration: 0.4 }}
              />

              <ol className="space-y-8">
                {STEPS.map((s, i) => {
                  const isActive = i === active;
                  const isDone = i < active;
                  return (
                    <li key={s.title} className="relative flex gap-5 pl-0">
                      <span
                        className={cn(
                          "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
                          isActive
                            ? "brand-gradient border-transparent text-white shadow-button scale-110"
                            : isDone
                              ? "border-success/40 bg-success/10 text-success"
                              : "border-border bg-card text-muted-foreground"
                        )}
                      >
                        {isDone ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                      </span>
                      <div
                        className={cn(
                          "transition-all duration-300",
                          isActive ? "opacity-100" : "opacity-45"
                        )}
                      >
                        <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{s.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Right: stage — all steps stay mounted, the active one crossfades in
              (no unmount gaps even under fast scrolling) */}
          <div className="relative hidden h-[420px] lg:block">
            <div className="absolute inset-0 rounded-3xl border border-border bg-card shadow-sm" />
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-3xl" aria-hidden />
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={false}
                animate={
                  i === active
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: i < active ? -18 : 26, scale: 0.97 }
                }
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center"
                style={{ pointerEvents: i === active ? "auto" : "none" }}
                aria-hidden={i !== active}
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl brand-gradient text-white shadow-button">
                  <s.icon className="h-12 w-12" />
                </div>
                <p className="mt-8 font-display text-2xl font-bold">{s.title}</p>
                <p className="mt-3 max-w-sm text-muted-foreground">{s.visual}</p>
              </motion.div>
            ))}
            <div className="absolute inset-x-0 bottom-8 flex justify-center gap-1.5" aria-hidden>
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === active ? "w-8 bg-primary" : "w-1.5 bg-border"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
