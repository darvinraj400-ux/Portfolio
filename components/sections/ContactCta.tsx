"use client";

import { ShimmerButton } from "@/components/ui/shimmer-button";
import { SITE } from "@/lib/constants";

const SUBJECT = encodeURIComponent("Project inquiry");

/**
 * Contact CTA island. ShimmerButton follows the palette via tokens
 * (accent surface, background text); the shimmer highlight stays
 * subtle. Opens a prefilled email in the user's mail client.
 */
export default function ContactCta() {
  const mailto = `mailto:${SITE.email}?subject=${SUBJECT}`;

  return (
    <ShimmerButton
      type="button"
      aria-label={`Email ${SITE.email}`}
      background="var(--accent)"
      shimmerColor="rgba(255, 255, 255, 0.4)"
      shimmerDuration="3s"
      borderRadius="0.75rem"
      className="text-base font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
      onClick={() => {
        window.location.href = mailto;
      }}
    >
      Email me
    </ShimmerButton>
  );
}
