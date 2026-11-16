"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Revalidates server data every minute so charts and tables pick up new
// telemetry without a manual reload. Only the RSC payload refetches —
// client state (open modals, typed inputs, URL filters) is untouched.
const REFRESH_MS = 60_000;

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  return null;
}
