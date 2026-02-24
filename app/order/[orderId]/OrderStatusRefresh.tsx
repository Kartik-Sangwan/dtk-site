"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderStatusRefresh({
  enabled,
  intervalMs = 2000,
  maxSeconds = 60,
}: {
  enabled: boolean;
  intervalMs?: number;
  maxSeconds?: number;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(maxSeconds);

  useEffect(() => {
    if (!enabled) return;
    setSecondsLeft(maxSeconds);

    const tick = window.setInterval(() => {
      router.refresh();
      setSecondsLeft((s) => Math.max(0, s - Math.round(intervalMs / 1000)));
    }, intervalMs);

    const stop = window.setTimeout(() => window.clearInterval(tick), maxSeconds * 1000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(stop);
    };
  }, [enabled, intervalMs, maxSeconds, router]);

  if (!enabled) return null;

  return (
    <div className="mt-2 text-xs text-gray-600">
      Waiting for payment confirmation… (auto-refreshing{secondsLeft > 0 ? `, ~${secondsLeft}s` : ""})
    </div>
  );
}
