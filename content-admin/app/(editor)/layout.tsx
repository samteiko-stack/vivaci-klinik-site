import { redirect } from "next/navigation";
import { CreateContentUiProvider } from "@/components/create-content-ui";
import ContentAdminShell from "@/components/content-admin-shell";
import { SimpleContentProvider } from "@/components/simple-content-context";
import { TreatmentPagesProvider } from "@/components/treatment-pages-context";
import { hasAdminSession } from "@/lib/admin-auth";

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminSession())) redirect("/login");

  return (
    <TreatmentPagesProvider>
      <SimpleContentProvider>
        <CreateContentUiProvider>
          <ContentAdminShell>{children}</ContentAdminShell>
        </CreateContentUiProvider>
      </SimpleContentProvider>
    </TreatmentPagesProvider>
  );
}
