import { redirect } from "next/navigation";
import { Suspense } from "react";
import ContentAdminShell from "@/components/content-admin-shell";
import { SimpleContentProvider } from "@/components/simple-content-context";
import { TreatmentPagesProvider } from "@/components/treatment-pages-context";
import { hasAdminSession } from "@/lib/admin-auth";

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminSession())) redirect("/login");

  return (
    <TreatmentPagesProvider>
      <Suspense fallback={null}>
        <SimpleContentProvider>
          <ContentAdminShell>{children}</ContentAdminShell>
        </SimpleContentProvider>
      </Suspense>
    </TreatmentPagesProvider>
  );
}
