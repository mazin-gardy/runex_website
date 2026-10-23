"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SocialMotion() {
  const sectionRef = useRef<HTMLElement>(null);
  const shapesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        shapesRef.current,
        {
          scale: 0.2,
          opacity: 0,
          rotate: -20,
        },
        {
          scale: 1,
          opacity: 1,
          rotate: 0,
          x: (i) => (i % 5) * 15,
          y: (i) => Math.floor(i / 5) * 15,
          stagger: 0.04,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=1200",
            scrub: 1,
            pin: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen bg-black text-white overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                if (el) shapesRef.current[i] = el;
              }}
              className="w-8 h-8 bg-[#d7ff2f] rotate-45"
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-12 left-12">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Runex
        </p>

        <h2 className="text-7xl md:text-9xl font-semibold tracking-[-0.06em]">
          SOCIAL
          <br />
          MOTION.
        </h2>
      </div>
    </section>
  );
}