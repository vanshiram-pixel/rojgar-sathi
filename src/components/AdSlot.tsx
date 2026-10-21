"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

export function AdSlot({ enabled, client, slot }: { enabled: boolean; client: string; slot: string }) {
  const adRef = useRef<HTMLModElement>(null);
  const validClient = /^ca-pub-\d+$/.test(client.trim());
  const validSlot = /^\d+$/.test(slot.trim());

  useEffect(() => {
    if (!enabled || !validClient || !validSlot || !adRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense can reject an ad slot before approval or while the ad blocker is active.
    }
  }, [enabled, validClient, validSlot, client, slot]);

  if (!enabled || !validClient || !validSlot) return null;

  return (
    <div className="adsense-slot" aria-label="विज्ञापन">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={client.trim()}
        data-ad-slot={slot.trim()}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
