"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function ProductImageCarousel({ images }: { images: string[] }) {
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
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white">
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
            alt={`Product image ${i + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 520px"
          />
        </div>
      ))}

      <div className="absolute bottom-3 right-3 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to image ${i + 1}`}
            onClick={() => setIdx(i)}
            className={[
              "h-2.5 w-2.5 rounded-full border",
              i === idx ? "border-white bg-white" : "border-white/80 bg-white/40",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
