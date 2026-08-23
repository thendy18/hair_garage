"use client";

import Image from "next/image";

export default function HeroSection() {
  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="bg-white px-5 pb-16 pt-8 sm:px-8 sm:pb-24 sm:pt-12"
      data-aos="fade-up"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-50 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
            <Image
              src="/foto/baru.jpg"
              alt="Thendy sedang mengerjakan detail potongan rambut"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 380px"
              className="object-cover object-[58%_38%]"
            />
          </div>
          <span className="absolute bottom-4 left-4 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-neutral-700 shadow-sm backdrop-blur">
            THENDY HAIR GARAGE
          </span>
        </div>

        <div className="max-w-2xl">
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700">
              1-on-1 Session
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700">
              CHILL BASECAMP
            </span>
          </div>
          <h1
            id="hero-title"
            className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-6xl"
          >
            Find your cut, build your confidence.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-neutral-500 sm:text-lg">
            Tailored cuts for your daily confidence.
          </p>
          <button
            type="button"
            onClick={scrollToBooking}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-4"
          >
            Pilih jadwal ngobrol
            <span aria-hidden="true" className="ml-2 text-base">
              -&gt;
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
