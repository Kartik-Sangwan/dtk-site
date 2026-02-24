"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Slide = {
  src: string;
  alt: string;
  caption?: string;
};

export default function HeroCarousel() {
  const slides: Slide[] = useMemo(
    () => [
      { src: "/hero/part1-removebg-preview.png", alt: "Rod Clevis", caption: "Rod Clevis" },
      { src: "/hero/part5-removebg-preview.png", alt: "Alignment Coupler", caption: "Alignment Coupler" },
      { src: "/hero/part3-removebg-preview.png", alt: "Clevis Bracket", caption: "Clevis Bracket" },
      { src: "/hero/part4-removebg-preview.png", alt: "Eye Bracket", caption: "Eye Bracket" },
    ],
    []
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((v) => (v + 1) % slides.length);
    }, 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-300/60 p-6 shadow-sm">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50/60">
        {slides.map((s, i) => (
          <div
            key={s.src}
            className={[
              "absolute inset-0 transition-opacity duration-700",
              i === idx ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              className="object-contain"
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 520px"
            />
          </div>
        ))}

        <div className="absolute bottom-3 left-3 rounded-md bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 backdrop-blur">
          {slides[idx].caption ?? "DTK Industrial"}
        </div>

        <div className="absolute bottom-3 right-3 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={[
                "h-2.5 w-2.5 rounded-full border",
                i === idx ? "bg-gray-900 border-gray-900" : "bg-white/80 border-gray-300",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700">
        Quality accessories, fast turnaround, and custom equivalents.
      </div>
    </div>
  );
}
