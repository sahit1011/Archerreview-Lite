"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Stethoscope, Cog, ArrowRight, Repeat2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";

type PreviewProps = { reduce: boolean };

/* Step 1 — Pick your exam: two mini exam-track chips (one selected), reusing the
   same icons + language as the NEET/JEE tracks section for instant cohesion. */
function StepExamTracks() {
  const tracks = [
    { name: "NEET", tag: "Medical", Icon: Stethoscope, subjects: "Physics · Chemistry · Biology", selected: true },
    { name: "JEE", tag: "Engineering", Icon: Cog, subjects: "Physics · Chemistry · Maths", selected: false },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {tracks.map((t) => (
        <div
          key={t.name}
          className={
            t.selected
              ? "rounded-xl border border-primary/40 bg-primary/[0.04] p-3.5"
              : "rounded-xl border border-border bg-card p-3.5"
          }
        >
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-card">
              <t.Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display text-lg font-bold leading-none">{t.name}</span>
          </div>
          <div className="mt-2.5">
            <Badge variant="secondary">{t.tag}</Badge>
          </div>
          <p className="mt-2.5 font-mono text-[0.65rem] leading-relaxed text-muted-foreground">{t.subjects}</p>
        </div>
      ))}
    </div>
  );
}

/* Step 2 — Take the diagnostic: a per-subject mastery readout. Same track / fill
   tokens + spring as the tracks telemetry strip, but a distinct instrument. */
function StepDiagnostic({ reduce }: PreviewProps) {
  const rows = [
    { subject: "Physics", pct: 72, tier: "bg-primary" },
    { subject: "Chemistry", pct: 48, tier: "bg-primary/60" },
    { subject: "Biology", pct: 34, tier: "bg-primary/30" },
  ];
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Mastery map</p>
        <span className="font-mono text-[0.7rem] text-muted-foreground">18 chapters scanned</span>
      </div>
      <div className="mt-3 space-y-3">
        {rows.map((r, i) => (
          <div
            key={r.subject}
            className="flex items-center gap-3"
            role="img"
            aria-label={`${r.subject} mastery ${r.pct} percent`}
          >
            <span className="w-20 shrink-0 text-xs text-foreground">{r.subject}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className={`h-full origin-left rounded-full ${r.tier}`}
                style={{ width: `${r.pct}%` }}
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20, delay: 0.1 * i }}
              />
            </div>
            <span className="w-9 shrink-0 text-right font-mono text-[0.7rem] text-muted-foreground">{r.pct}%</span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <span className="font-mono text-[0.7rem] text-muted-foreground">1 strong · 1 on-track · 1 to focus</span>
      </div>
    </div>
  );
}

/* Step 3 — Get your plan: a schematic mini week-calendar with a typed legend. */
function StepWeek({ reduce }: PreviewProps) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const plan = [[0, 1], [0, 2, 1], [1, 2], [0, 1, 3], [2, 1], [0], [3]];
  const tierByType = ["bg-primary", "bg-primary/60", "bg-primary/30", "border border-primary/30 bg-transparent"];
  const legend = [
    { label: "Watch", sw: "bg-primary" },
    { label: "Read", sw: "bg-primary/60" },
    { label: "Quiz", sw: "bg-primary/30" },
    { label: "Review", sw: "border border-primary/30 bg-transparent" },
  ];
  const todayCol = 2;
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <span key={i} className="text-center font-mono text-[0.6rem] uppercase text-muted-foreground">
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {plan.map((blocks, col) => (
          <div key={col} className="flex flex-col gap-1">
            {blocks.map((type, bi) => (
              <motion.div
                key={bi}
                className={`h-4 origin-bottom rounded-[4px] ${tierByType[type]} ${
                  col === todayCol && bi === 0 ? "ring-1 ring-primary/40 ring-offset-1 ring-offset-card" : ""
                }`}
                initial={reduce ? false : { scaleY: 0, opacity: 0 }}
                whileInView={{ scaleY: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, delay: 0.04 * col + 0.03 * bi, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-[3px] ${l.sw}`} />
            <span className="font-mono text-[0.65rem] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Step 4 — Learn & adapt: a concrete before/after reshuffle diff (once, on scroll). */
function StepAdapt({ reduce }: PreviewProps) {
  return (
    <div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 opacity-60">
        <span className="font-mono text-[0.7rem] text-foreground">Organic Chem · quiz</span>
        <Badge variant="secondary">Missed Tue</Badge>
      </div>
      <div className="flex items-center gap-2 py-1 pl-1">
        <Repeat2 className="h-4 w-4 text-primary" />
        <span className="h-px flex-1 bg-border" />
      </div>
      <motion.div
        className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2.5"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-primary">
          <ArrowRight className="h-3.5 w-3.5" /> moved to Thu
        </span>
        <span className="font-mono text-[0.65rem] text-primary">+ recap added</span>
      </motion.div>
      <p className="mt-3 border-t border-border pt-3 font-mono text-[0.7rem] text-muted-foreground">
        plan rebalanced · 3 tasks reflowed
      </p>
    </div>
  );
}

const STEPS: {
  num: string;
  title: string;
  desc: string;
  Preview: React.ComponentType<PreviewProps>;
}[] = [
  {
    num: "01",
    title: "Pick your exam",
    desc: "Choose NEET or JEE and set your target date. The whole platform reshapes around your syllabus.",
    Preview: StepExamTracks,
  },
  {
    num: "02",
    title: "Take the diagnostic",
    desc: "A short adaptive test maps what you already know — chapter by chapter, subject by subject.",
    Preview: StepDiagnostic,
  },
  {
    num: "03",
    title: "Get your plan",
    desc: "An adaptive calendar is generated for your dates, your hours, your weak spots.",
    Preview: StepWeek,
  },
  {
    num: "04",
    title: "Learn & adapt",
    desc: "Every task you finish reshapes tomorrow. Miss a day? The plan absorbs it and rebalances.",
    Preview: StepAdapt,
  },
];

/**
 * "Get started in 4 steps" — a product-preview journey ledger. One framed object
 * with a mono 01–04 index; each row pairs tight copy with an honest schematic of
 * that exact product moment. (Replaced a 300vh pinned scroll whose only payload
 * was a 96px gradient icon swap — a gimmick the redesign removed.)
 */
export default function HowItWorksCinematic() {
  const reduce = useReducedMotion() === true;
  return (
    <section className="relative py-20 sm:py-24">
      <div className="relative mx-auto max-w-5xl px-5">
        <Reveal className="mb-12 text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Get started in 4 steps</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            From first pick to daily coaching — the whole journey, and exactly what you&apos;ll see at each step.
          </p>
        </Reveal>

        <Reveal>
          <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {STEPS.map((s, i) => {
              const reversed = i % 2 === 1;
              const Preview = s.Preview;
              return (
                <li key={s.num}>
                  <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center lg:gap-10">
                    <div className={`lg:col-span-5 ${reversed ? "lg:order-2" : ""}`}>
                      <span className="inline-grid h-8 w-8 place-items-center rounded-lg border border-border bg-secondary font-mono text-xs text-muted-foreground">
                        {s.num}
                      </span>
                      <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                    <div className={`lg:col-span-7 ${reversed ? "lg:order-1" : ""}`}>
                      <div className="flex min-h-[9.5rem] flex-col justify-center rounded-xl border border-border bg-secondary/40 p-4 sm:p-5">
                        <Preview reduce={reduce} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
