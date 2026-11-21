"use client";

// Two scroll scenes for the landing page.
//   1. "Hill": two runners run over a big curved hill, and their route draws in behind them.
//   2. "Trail": the runners carry on along a wavy trail, with the route ahead shown dashed.
// Each scene pins to the screen while you scroll through it, and the runners' position
// follows the scroll. With "reduce motion" switched on, the runners stand still mid-way.

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type MotionValue,
} from "motion/react";

const INK = "#0B0B0B";

// Paths are drawn in a 100 × 100 box that stretches to the screen, so the hill
// always spans the full width, from a phone to a wide monitor.
const HILL = {
  ground: "M -2 100 C 14 60 34 47 50 47 C 70 47 88 62 102 100",
  route: "M 6 104 C 20 76 37 65 52 65 C 70 65 86 77 96 104",
  from: 0.2,
  to: 0.8,
};

const TRAIL = {
  ground:
    "M -2 84 C 8 80 16 86 26 83 S 44 80 56 83 S 76 81 86 83 S 98 82 102 82",
  route:
    "M -2 76 C 8 72 16 78 26 75 S 44 72 56 75 S 76 73 86 75 S 98 74 102 74",
  from: 0.06,
  to: 0.92,
};

export default function RunnersScroll({
  hero,
  outro,
}: {
  hero: ReactNode;
  outro: ReactNode;
}) {
  return (
    <>
      <style>{RUNNER_CSS}</style>
      <Scene
        id="hill"
        paths={HILL}
        routeStyle="solid"
        fill="#C2EF22"
        scrollHint
        content={hero}
      />
      <Scene
        id="trail"
        paths={TRAIL}
        routeStyle="dashed"
        fill="#C2EF22"
        content={outro}
      />
    </>
  );
}

type Paths = { ground: string; route: string; from: number; to: number };

function Scene({
  id,
  paths,
  routeStyle,
  fill,
  content,
  scrollHint = false,
}: {
  id: string;
  paths: Paths;
  routeStyle: "solid" | "dashed";
  fill: string;
  content: ReactNode;
  scrollHint?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<SVGPathElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const still = useMotionValue(0.5);
  const progress = reduceMotion ? still : scrollYProgress;

  const lead = useRunnerOnPath(groundRef, stageRef, progress, paths, 0);
  const second = useRunnerOnPath(groundRef, stageRef, progress, paths, 8);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: reduceMotion ? "100dvh" : "210dvh" }}
    >
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        <div className="relative z-10 h-full">{content}</div>

        {/* The scenery keeps its shape on tall phone screens: at most 85% of the width tall. */}
        <div
          ref={stageRef}
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: "min(100%, 85vw)" }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={`${id}-behind`}>
                <motion.rect
                  x="-5"
                  y="-5"
                  height="115"
                  style={{ width: lead.clipWidth }}
                />
              </clipPath>
              <clipPath id={`${id}-ahead`}>
                <motion.rect
                  y="-5"
                  width="120"
                  height="115"
                  style={{ x: lead.clipWidth }}
                />
              </clipPath>
            </defs>

            <path d={`${paths.ground} L 102 110 L -2 110 Z`} fill={fill} />
            <path
              ref={groundRef}
              d={paths.ground}
              fill="none"
              stroke={INK}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {routeStyle === "dashed" && (
              <path
                d={paths.route}
                fill="none"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="14 18"
                vectorEffect="non-scaling-stroke"
                clipPath={`url(#${id}-ahead)`}
              />
            )}
            <path
              d={paths.route}
              fill="none"
              stroke="#fff"
              strokeWidth="3.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              clipPath={`url(#${id}-behind)`}
            />
          </svg>

          <Runner position={second} tone="light" />
          <Runner position={lead} tone="dark" />
        </div>

        {scrollHint && !reduceMotion && (
          <p className="absolute bottom-6 right-6 z-10 text-xs uppercase tracking-[0.25em] md:bottom-10 md:right-10">
            Scroll ↓
          </p>
        )}
      </div>
    </section>
  );
}

type RunnerPosition = {
  left: MotionValue<string>;
  top: MotionValue<string>;
  rotate: MotionValue<number>;
  clipWidth: MotionValue<number>;
};

/** Places a runner on the ground path for the current scroll progress (0–1). */
function useRunnerOnPath(
  pathRef: RefObject<SVGPathElement | null>,
  stageRef: RefObject<HTMLDivElement | null>,
  progress: MotionValue<number>,
  paths: Paths,
  lag: number,
): RunnerPosition {
  const left = useMotionValue("-20%");
  const top = useMotionValue("0%");
  const rotate = useMotionValue(0);
  const clipWidth = useMotionValue(0);

  const place = useCallback(
    (p: number) => {
      const path = pathRef.current;
      const stage = stageRef.current;
      if (!path || !stage) return;
      const total = path.getTotalLength();
      const along = Math.min(
        1,
        Math.max(0, paths.from + (paths.to - paths.from) * p),
      );
      const at = Math.max(0, along * total - lag);
      const a = path.getPointAtLength(at);
      const b = path.getPointAtLength(Math.min(total, at + 0.6));
      const { width, height } = stage.getBoundingClientRect();
      left.set(`${a.x}%`);
      top.set(`${a.y}%`);
      // Lean with the slope, but only partly, so they look like they're running, not falling.
      const slope =
        (Math.atan2((b.y - a.y) * height, (b.x - a.x) * width) * 180) / Math.PI;
      rotate.set(Math.max(-22, Math.min(22, slope * 0.5)));
      clipWidth.set(a.x + 5);
    },
    [pathRef, stageRef, paths, lag, left, top, rotate, clipWidth],
  );

  useMotionValueEvent(progress, "change", place);

  useEffect(() => {
    place(progress.get());
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => place(progress.get()));
    observer.observe(stage);
    return () => observer.disconnect();
  }, [place, progress, stageRef]);

  return { left, top, rotate, clipWidth };
}

function Runner({
  position,
  tone,
}: {
  position: RunnerPosition;
  tone: "dark" | "light";
}) {
  const color = tone === "dark" ? INK : "#fff";
  return (
    <motion.div
      className="pointer-events-none absolute z-[5]"
      style={{
        left: position.left,
        top: position.top,
        rotate: position.rotate,
        x: "-50%",
        y: "-100%",
        transformOrigin: "50% 100%",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 60"
        className={`runex-runner h-[64px] w-auto md:h-[96px] ${tone === "light" ? "runex-runner-offset" : ""}`}
        fill="none"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="23" cy="8" r="5.5" fill={color} stroke="none" />
        <path d="M 22 15 L 18 34" />
        <g className="runex-runner-a">
          <path d="M 21 19 L 29 25 L 34 19" />
          <path d="M 21 19 L 13 25 L 9 21" />
          <path d="M 18 34 L 27 44 L 34 55" />
          <path d="M 18 34 L 12 46 L 4 49" />
        </g>
        <g className="runex-runner-b">
          <path d="M 21 19 L 27 27 L 24 33" />
          <path d="M 21 19 L 16 27 L 20 32" />
          <path d="M 18 34 L 22 46 L 19 57" />
          <path d="M 18 34 L 11 44 L 10 56" />
        </g>
      </svg>
    </motion.div>
  );
}

// Two running poses that alternate, so the legs and arms swing.
const RUNNER_CSS = `
.runex-runner-a { animation: runex-stride 0.5s steps(1, end) infinite; }
.runex-runner-b { animation: runex-stride 0.5s steps(1, end) infinite reverse; }
.runex-runner-offset .runex-runner-a, .runex-runner-offset .runex-runner-b { animation-delay: -0.25s; }
@keyframes runex-stride { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .runex-runner-a { animation: none; }
  .runex-runner-b { animation: none; opacity: 0; }
}
`;
