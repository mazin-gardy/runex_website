"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SocialMotionPage() {
  const sectionRef = useRef<HTMLElement>(null);
  const tileRefs = useRef<HTMLDivElement[]>([]);
  const fullImageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const columns = 7;
  const rows = 5;
  const totalTiles = columns * rows;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tiles = tileRefs.current;

      gsap.set(fullImageRef.current, {
        opacity: 0,
        scale: 1.04,
      });

      gsap.set(titleRef.current, {
        opacity: 0,
        y: 60,
      });

      gsap.set(copyRef.current, {
        opacity: 0,
        y: 40,
      });

      gsap.set(tiles, {
        opacity: 0,
        scale: 0.35,
        x: () => gsap.utils.random(-260, 260),
        y: () => gsap.utils.random(-180, 180),
        rotate: () => gsap.utils.random(-70, 70),
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2200",
          scrub: 1,
          pin: true,
        },
      });

      // 1. Hexagon photo fragments appear
      tl.to(tiles, {
        opacity: 1,
        duration: 0.5,
        stagger: {
          amount: 0.6,
          from: "random",
        },
      });

      // 2. Fragments assemble
      tl.to(
        tiles,
        {
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          duration: 1.4,
          ease: "power3.out",
          stagger: {
            amount: 0.8,
            from: "random",
          },
        },
        "<0.1"
      );

      // 3. Left-side copy appears
      tl.to(
        copyRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.5"
      );

      // 4. Full image fades in
      tl.to(
        fullImageRef.current,
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
        },
        ">-0.1"
      );

      // 5. Hexagons fade away
      tl.to(
        tiles,
        {
          opacity: 0,
          scale: 1.05,
          duration: 0.7,
          stagger: {
            amount: 0.25,
            from: "center",
          },
        },
        "<0.1"
      );

      // 6. Main title appears
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className="bg-black text-white">
      <section
        ref={sectionRef}
        className="relative h-screen overflow-hidden bg-black"
      >
        {/* HEADER */}
        <div className="absolute top-8 left-8 right-8 z-30 flex items-center justify-between border-b border-white/20 pb-5">
          <a
            href="/"
            className="text-xs uppercase tracking-[0.25em] hover:opacity-50 transition"
          >
            ← Runex
          </a>

          <span className="text-xs uppercase tracking-[0.25em] text-white/50">
            Scroll to move
          </span>
        </div>

        {/* MAIN CONTENT */}
        <div className="absolute inset-0 pt-28 pb-10 px-8 lg:px-12">
          <div className="grid h-full grid-cols-1 lg:grid-cols-[0.8fr_1.4fr] gap-10 lg:gap-16">
            {/* LEFT SIDE */}
            <div className="flex flex-col justify-center">
              <div ref={copyRef}>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-6">
                  Our motive
                </p>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.05em] leading-[0.95] max-w-xl">
                  Movement is better when it is shared.
                </h2>

                <p className="mt-8 max-w-md text-lg md:text-xl leading-relaxed text-white/70">
                  Runex exists to make movement more social, spontaneous and
                  connected.
                </p>

                <p className="mt-5 max-w-md text-base leading-relaxed text-white/45">
                  Discover running and cycling sessions, meet people nearby,
                  explore your city and turn individual movement into something
                  collective.
                </p>

                <div className="mt-10 flex items-center gap-4">
                  <div className="h-px w-12 bg-[#d7ff2f]" />

                  <span className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Move together
                  </span>
                </div>
              </div>

              <h1
                ref={titleRef}
                className="mt-14 text-6xl md:text-7xl lg:text-[5.5vw] leading-[0.82] font-semibold tracking-[-0.075em]"
              >
                SOCIAL
                <br />
                MOTION.
              </h1>
            </div>

            {/* RIGHT SIDE */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full h-[68vh] max-h-[760px] overflow-hidden rounded-[2rem]">
                {/* FULL IMAGE */}
                <div
                  ref={fullImageRef}
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/social-motion.jpg')",
                  }}
                />

                {/* DARK OVERLAY */}
                <div className="absolute inset-0 bg-black/10 z-[1]" />

                {/* PHOTO TILES */}
                <div className="absolute inset-0 z-10 grid grid-cols-7 grid-rows-5">
                  {Array.from({ length: totalTiles }).map((_, index) => {
                    const col = index % columns;
                    const row = Math.floor(index / columns);

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-center"
                      >
                        <div
                          ref={(element) => {
                            if (element) {
                              tileRefs.current[index] = element;
                            }
                          }}
                          className="w-[92%] h-[92%]"
                          style={{
                            clipPath:
                              "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)",

                            backgroundImage: "url('/social-motion.jpg')",

                            backgroundSize: `${columns * 100}% ${
                              rows * 100
                            }%`,

                            backgroundPosition: `${
                              (col / (columns - 1)) * 100
                            }% ${(row / (rows - 1)) * 100}%`,

                            backgroundRepeat: "no-repeat",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT */}
        <div className="absolute right-8 bottom-8 z-30 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            Move alone.
          </p>

          <p className="mt-2 text-xs uppercase tracking-[0.2em]">
            Become part of something.
          </p>
        </div>
      </section>
    </main>
  );
}