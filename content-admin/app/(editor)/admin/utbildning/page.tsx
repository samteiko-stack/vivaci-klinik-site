import { Suspense } from "react";
import { UtbildningClient } from "@/components/utbildning-client";

export default function UtbildningPage() {
  return (
    <Suspense fallback={null}>
      <UtbildningClient />
    </Suspense>
  );
}
