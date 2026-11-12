import { redirect } from "next/navigation";
import ContentAdminShell from "@/components/content-admin-shell";
import { TreatmentPagesProvider } from "@/components/treatment-pages-context";
import { hasAdminSession } from "@/lib/admin-auth";

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminSession())) redirect("/login");

  return (
    <TreatmentPagesProvider>
      <ContentAdminShell>{children}</ContentAdminShell>
    </TreatmentPagesProvider>
  );
}
