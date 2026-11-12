import { Suspense } from "react";
import { JuridikClient } from "@/components/juridik-client";

export default function JuridikPage() {
  return (
    <Suspense fallback={null}>
      <JuridikClient />
    </Suspense>
  );
}
