"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type AdSlotProps = {
  enabled: boolean;
  client: string;
  slot: string;
  compact?: boolean;
  label?: string;
};

export function AdSlot({
  enabled,
  client,
  slot,
  compact = false,
  label = "विज्ञापन",
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const validClient = /^ca-pub-\\d+$/.test(client.trim());
  const validSlot = /^\\d+$/.test(slot.trim());

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
    <div
      className={compact ? "adsense-slot adsense-slot-compact" : "adsense-slot"}
      aria-label={label}
    >
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
