import { Suspense } from "react";
import { StealthGate } from "./StealthGate";

export default function StealthPage() {
  return (
    <Suspense>
      <StealthGate />
    </Suspense>
  );
}
