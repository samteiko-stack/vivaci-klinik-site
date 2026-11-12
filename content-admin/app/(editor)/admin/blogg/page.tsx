import { Suspense } from "react";
import { BloggClient } from "@/components/blogg-client";

export default function BloggPage() {
  return (
    <Suspense fallback={null}>
      <BloggClient />
    </Suspense>
  );
}
