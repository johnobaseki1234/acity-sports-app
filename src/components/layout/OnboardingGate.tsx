"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLeagueOfInterest } from "@/hooks/useLeagueOfInterest";

const EXCLUDED_PREFIXES = ["/admin", "/scorer", "/stealth", "/login", "/onboarding"];

/** Intercepts first-time visitors to the public app and sends them to /onboarding. */
export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { onboarded, loaded } = useLeagueOfInterest();

  useEffect(() => {
    if (!loaded) return;
    if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return;
    if (!onboarded) router.push("/onboarding");
  }, [loaded, onboarded, pathname, router]);

  return null;
}
