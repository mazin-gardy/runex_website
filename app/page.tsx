"use client";

// Coming-soon home page. The full home page is kept in app/_full-home/page.tsx
// (folders starting with "_" aren't pages); move it back here to restore it.
// Session links (/run/…, /r/…) and host links keep working as normal.

import { motion } from "motion/react";
import RunnersScroll from "@/components/RunnersScroll";
import UpdatesForm from "@/components/UpdatesForm";

export default function Home() {
  return (
    <main className="bg-[#d7ff2f] text-black overflow-x-clip">
      <RunnersScroll
        hero={
          <div className="flex h-full flex-col gap-10 p-6 md:p-10 lg:p-12">
            <nav className="flex items-center justify-between text-xs md:text-sm uppercase tracking-[0.22em]">
              <span className="font-semibold">RUNEX</span>
              <span>Melbourne</span>
            </nav>
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="uppercase tracking-[0.25em] text-xs mb-6"
              >
                Social movement platform
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 70 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-[20vw] sm:text-[16vw] lg:text-[11vw] leading-[0.76] font-semibold tracking-[-0.075em]"
              >
                COMING
                <br />
                SOON.
              </motion.h1>
            </div>
          </div>
        }
        outro={
          <div className="flex h-full flex-col gap-8 p-6 pt-16 md:p-10 md:pt-20 lg:p-12 lg:pt-24">
            <h2 className="text-[16vw] sm:text-[12vw] lg:text-[8vw] leading-[0.8] font-semibold tracking-[-0.07em]">
              MOVE
              <br />
              TOGETHER.
            </h2>
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <p className="max-w-md text-base md:text-lg leading-relaxed">
                Discover runs, build routes and meet people moving through your city. The Runex app is on its way.
              </p>
              <UpdatesForm />
            </div>
          </div>
        }
      />
    </main>
  );
}
