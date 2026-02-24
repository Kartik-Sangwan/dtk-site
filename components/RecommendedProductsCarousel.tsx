"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

type RecommendedItem = {
  partNo: string;
  name: string;
  price: number;
  image: string;
  href: string;
};

function money(v: number) {
  return v.toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

export default function RecommendedProductsCarousel({
  items,
}: {
  items: RecommendedItem[];
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scrollByAmount(amount: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el || items.length <= 1) return;

    const t = window.setInterval(() => {
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 3200);

    return () => window.clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Recommended Items</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByAmount(-300)}
            className="h-9 w-9 rounded-md border border-slate-300 bg-white text-lg font-semibold text-gray-900 hover:bg-slate-50"
            aria-label="Scroll recommended items left"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(300)}
            className="h-9 w-9 rounded-md border border-slate-300 bg-white text-lg font-semibold text-gray-900 hover:bg-slate-50"
            aria-label="Scroll recommended items right"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]"
      >
        {items.map((item) => (
          <article
            key={item.partNo}
            className="min-w-[240px] snap-start rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <div className="relative h-36 w-full overflow-hidden rounded-lg bg-white">
              <Image
                src={item.image}
                alt={item.partNo}
                fill
                className="object-contain p-2"
                sizes="240px"
              />
            </div>

            <div className="mt-3">
              <div className="text-sm font-semibold text-gray-900">{item.name}</div>
              <div className="text-xs text-gray-600">{item.partNo}</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{money(item.price)}</div>
            </div>

            <Link
              href={item.href}
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              View Product
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
