"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type SubcategoryCarouselProps = {
  images: string[];
  title: string;
};

export default function SubcategoryCarousel({ images, title }: SubcategoryCarouselProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = window.setInterval(() => {
      setIdx((v) => (v + 1) % images.length);
    }, 3200);
    return () => window.clearInterval(t);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
      <div className="relative h-52 w-full md:h-64">
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={[
              "absolute inset-0 transition-opacity duration-500",
              i === idx ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <Image
              src={src}
              alt={`${title} image ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}

        <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-1 text-xs font-semibold text-white">
          {title}
        </div>

        <div className="absolute bottom-3 right-3 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to ${title} image ${i + 1}`}
              onClick={() => setIdx(i)}
              className={[
                "h-2.5 w-2.5 rounded-full border",
                i === idx ? "border-white bg-white" : "border-white/80 bg-white/40",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
