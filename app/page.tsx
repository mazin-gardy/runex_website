"use client";

import { motion } from "motion/react";

export default function Home() {
  const features = [
    {
      number: "01",
      title: "Discover",
      text: "Find running and cycling sessions around your city.",
    },
    {
      number: "02",
      title: "Create",
      text: "Build your route and host your own social session.",
    },
    {
      number: "03",
      title: "Connect",
      text: "Meet people who want to move, run and ride with you.",
    },
  ];

  return (
    <main className="bg-[#f2f2ed] text-black overflow-x-hidden">
      {/* HERO */}
      <section className="min-h-screen bg-[#d7ff2f]">
        <div className="min-h-screen flex flex-col justify-between p-6 md:p-10 lg:p-12">
          {/* NAV */}
          <nav className="flex items-center justify-between text-xs md:text-sm uppercase tracking-[0.22em]">
            <span className="font-semibold">RUNEX</span>

            <div className="hidden md:flex gap-8">
              <a
                href="#discover"
                className="hover:opacity-50 transition-opacity duration-300"
              >
                Discover
              </a>

              <a
                href="/social-motion"
                className="hover:opacity-50 transition-opacity duration-300"
              >
                Social Motion
              </a>

              <a
                href="#about"
                className="hover:opacity-50 transition-opacity duration-300"
              >
                About
              </a>
            </div>

            <span>Melbourne</span>
          </nav>

          {/* HERO TITLE */}
          <div className="py-20 lg:py-0">
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
              transition={{
                duration: 0.9,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-[20vw] sm:text-[16vw] lg:text-[11vw] leading-[0.76] font-semibold tracking-[-0.075em]"
            >
              MOVE
              <br />
              TOGETHER.
            </motion.h1>
          </div>

          {/* HERO BOTTOM */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="max-w-md text-base md:text-lg leading-relaxed">
                Discover runs, build routes and meet people moving through your
                city.
              </p>

              <div className="flex gap-3 mt-7">
                <button className="bg-black text-white rounded-full px-6 py-3 text-sm transition-transform duration-300 hover:scale-105">
                  Join a run
                </button>

                <a
                  href="#discover"
                  className="border border-black rounded-full px-6 py-3 text-sm transition-all duration-300 hover:bg-black hover:text-white"
                >
                  Explore
                </a>
              </div>
            </div>

            <span className="text-sm">01 / 04</span>
          </div>
        </div>
      </section>

      {/* DISCOVER */}
      <section
        id="discover"
        className="min-h-screen px-6 md:px-10 lg:px-12 py-24 md:py-32"
      >
        <div className="flex justify-between items-start border-b border-black/20 pb-6">
          <span className="text-sm">02</span>

          <p className="uppercase tracking-[0.2em] text-xs">
            Discover
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 mt-14">
          <div>
            <h2 className="text-6xl md:text-8xl lg:text-[8vw] font-semibold tracking-[-0.06em] leading-[0.88]">
              YOUR CITY
              <br />
              IS THE
              <br />
              CLUBHOUSE.
            </h2>
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-xl md:text-2xl leading-relaxed max-w-lg">
              Find running and cycling sessions near you. See routes, distance,
              pace and the people joining before you leave home.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-20">
          {features.map((item) => (
            <motion.div
              key={item.number}
              whileHover={{ y: -10 }}
              transition={{ duration: 0.25 }}
              className="min-h-[360px] bg-white p-7 flex flex-col justify-between"
            >
              <span className="text-sm">
                {item.number}
              </span>

              <div>
                <h3 className="text-4xl font-semibold tracking-tight">
                  {item.title}
                </h3>

                <p className="mt-4 text-black/60 max-w-xs">
                  {item.text}
                </p>
              </div>

              <span className="text-xl">
                ↗
              </span>
            </motion.div>
          ))}
        </div>
      </section>

{/* HUBS OF MOTION */}
<section
  id="hubs"
  className="bg-[#111111] text-white px-6 md:px-10 lg:px-12 py-24 md:py-28"
>
  <div className="flex items-center justify-between border-b border-white/20 pb-6">
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-white/45">
        03 / Hubs of Motion
      </p>

      <h2 className="mt-4 text-4xl md:text-6xl tracking-[-0.05em]">
        Places made to move.
      </h2>
    </div>

    <a
      href="#"
      className="hidden md:block text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white transition"
    >
      Explore all ↗
    </a>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 mt-10 overflow-hidden">
    {/* DOLOMITES */}
    <motion.article
      whileHover={{ flexGrow: 1.08 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-[#505846] p-6 md:p-8 lg:p-10 min-h-[650px] lg:min-h-[760px] overflow-hidden"
    >
      <div className="flex items-start justify-between border-b border-white/30 pb-5">
        <div>
          <p className="text-2xl md:text-3xl tracking-[-0.04em]">
            The Dolomites effect
          </p>

          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/60">
            Italy / Trail running
          </p>
        </div>

        <span className="text-xs uppercase tracking-[0.2em] text-white/70">
          Read more ↗
        </span>
      </div>

      <div className="relative mt-8 h-[430px] md:h-[500px] overflow-hidden">
        <motion.img
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.8 }}
          src="/dolomites.webp"
          alt="Trail runners in the Dolomites"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/5" />

        <div className="absolute left-6 bottom-6">
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">
            Hub 01
          </p>

          <p className="mt-2 text-2xl md:text-3xl font-medium">
            Trail. Climb. Explore.
          </p>
        </div>
      </div>

      <div className="absolute right-7 bottom-5 md:right-9 md:bottom-7">
        <p className="text-5xl md:text-6xl tracking-[-0.06em]">
          01 / 02
        </p>
      </div>
    </motion.article>

    {/* GOLD COAST */}
    <motion.article
      whileHover={{ flexGrow: 1.08 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-[#a7adab] text-black p-6 md:p-8 lg:p-10 min-h-[650px] lg:min-h-[760px] overflow-hidden"
    >
      <div className="flex items-start justify-between border-b border-black/30 pb-5">
        <div>
          <p className="text-2xl md:text-3xl tracking-[-0.04em]">
            Gold Coast
          </p>

          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black/55">
            Australia / Run + Swim
          </p>
        </div>

        <span className="text-xs uppercase tracking-[0.2em] text-black/65">
          Read more ↗
        </span>
      </div>

      <div className="relative mt-8 h-[430px] md:h-[500px] overflow-hidden">
        <motion.img
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.8 }}
          src="/gold-coast.jpg"
          alt="Runners on the Gold Coast"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/5" />

        <div className="absolute left-6 bottom-6 text-white">
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">
            Hub 02
          </p>

          <p className="mt-2 text-2xl md:text-3xl font-medium">
            Coast. Run. Connect.
          </p>
        </div>
      </div>

      <div className="absolute right-7 bottom-5 md:right-9 md:bottom-7">
        <p className="text-5xl md:text-6xl tracking-[-0.06em]">
          02 / 02
        </p>
      </div>
    </motion.article>
  </div>
</section>

      {/* CTA */}
      <section
        id="join"
        className="bg-[#d7ff2f] min-h-[70vh] p-6 md:p-10 lg:p-12 flex flex-col justify-between"
      >
        <div className="flex justify-between uppercase tracking-[0.2em] text-xs">
          <span>RUNEX</span>
          <span>04 / 04</span>
        </div>

        <div>
          <h2 className="text-[18vw] md:text-[12vw] leading-[0.8] tracking-[-0.075em] font-semibold">
            GO
            <br />
            MOVE.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-8">
          <p className="max-w-sm text-lg">
            Find your next session. Meet your next training partner.
          </p>

          <button className="bg-black text-white rounded-full px-7 py-4 text-sm transition-transform duration-300 hover:scale-105">
            Explore Runex ↗
          </button>
        </div>
      </section>
    </main>
  );
}