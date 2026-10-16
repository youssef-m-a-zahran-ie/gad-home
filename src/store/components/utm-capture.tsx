"use client";

import { useEffect } from "react";

/** Remembers which ad brought the shopper (utm_source / utm_campaign) until they order. */
export function UtmCapture() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const source = p.get("utm_source") || (p.get("fbclid") ? "facebook" : null);
      if (source) {
        sessionStorage.setItem("gad-utm", JSON.stringify({ source, campaign: p.get("utm_campaign") ?? "" }));
      }
    } catch {
      // ignore
    }
  }, []);
  return null;
}

export function readUtm(): { source: string; campaign: string } | null {
  try {
    const raw = sessionStorage.getItem("gad-utm");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
