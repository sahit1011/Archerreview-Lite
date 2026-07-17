"use client";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated hero beams (adapted from Aceternity's Background Beams via 21st.dev),
 * recolored to the StudyArc brand ramp (indigo → violet → cyan) and wired to
 * design tokens + prefers-reduced-motion (static faint paths when reduced).
 */
export const BackgroundBeams = React.memo(({ className }: { className?: string }) => {
  const reduceMotion = useReducedMotion();
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-352 -221C-352 -221 -284 184 180 311C644 438 712 843 712 843",
    "M-324 -253C-324 -253 -256 152 208 279C672 406 740 811 740 811",
    "M-296 -285C-296 -285 -228 120 236 247C700 374 768 779 768 779",
    "M-268 -317C-268 -317 -200 88 264 215C728 342 796 747 796 747",
    "M-240 -349C-240 -349 -172 56 292 183C756 310 824 715 824 715",
    "M-212 -381C-212 -381 -144 24 320 151C784 278 852 683 852 683",
    "M-184 -413C-184 -413 -116 -8 348 119C812 246 880 651 880 651",
    "M-156 -445C-156 -445 -88 -40 376 87C840 214 908 619 908 619",
    "M-128 -477C-128 -477 -60 -72 404 55C868 182 936 587 936 587",
    "M-100 -509C-100 -509 -32 -104 432 23C896 150 964 555 964 555",
    "M-72 -541C-72 -541 -4 -136 460 -9C924 118 992 523 992 523",
    "M-44 -573C-44 -573 24 -168 488 -41C952 86 1020 491 1020 491",
    "M-16 -605C-16 -605 52 -200 516 -73C980 54 1048 459 1048 459",
    "M12 -637C12 -637 80 -232 544 -105C1008 22 1076 427 1076 427",
  ];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center",
        className
      )}
      aria-hidden="true"
    >
      <svg
        className="pointer-events-none absolute z-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* faint static rails so the layout reads even before/without animation */}
        {paths.map((path, index) => (
          <path
            key={`rail-${index}`}
            d={path}
            stroke="var(--border)"
            strokeOpacity="0.35"
            strokeWidth="0.5"
          />
        ))}

        {!reduceMotion &&
          paths.map((path, index) => (
            <motion.path
              key={`beam-${index}`}
              d={path}
              stroke={`url(#ar-beam-${index})`}
              strokeOpacity="0.5"
              strokeWidth="0.6"
            />
          ))}
        <defs>
          {!reduceMotion &&
            paths.map((_, index) => (
              <motion.linearGradient
                id={`ar-beam-${index}`}
                key={`ar-beam-grad-${index}`}
                initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
                animate={{
                  x1: ["0%", "100%"],
                  x2: ["0%", "95%"],
                  y1: ["0%", "100%"],
                  y2: ["0%", `${93 + (index % 4) * 2}%`],
                }}
                transition={{
                  duration: 10 + ((index * 7) % 10),
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: (index * 1.3) % 10,
                }}
              >
                <stop stopColor="var(--brand-to)" stopOpacity="0" />
                <stop stopColor="var(--brand-to)" />
                <stop offset="32.5%" stopColor="var(--brand-from)" />
                <stop offset="100%" stopColor="var(--brand-via)" stopOpacity="0" />
              </motion.linearGradient>
            ))}
        </defs>
      </svg>
    </div>
  );
});

BackgroundBeams.displayName = "BackgroundBeams";
