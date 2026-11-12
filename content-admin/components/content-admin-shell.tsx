"use client";

import type { CSSProperties, ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink, Save } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { useTreatmentPages } from "@/components/treatment-pages-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Props {
  children: ReactNode;
}

function EditorBreadcrumbs() {
  const { pageTitle, activePageId, doc } = useTreatmentPages();
  const hasPage = Boolean(activePageId && doc);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden xl:block">
          <BreadcrumbLink href="/treatment-pages">Innehåll</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden xl:block" />
        <BreadcrumbItem className="hidden lg:block">
          {hasPage ? (
            <BreadcrumbLink href="/treatment-pages">Behandlingssidor</BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Behandlingssidor</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {hasPage ? (
          <>
            <BreadcrumbSeparator className="hidden lg:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[12rem] truncate sm:max-w-md">
                {pageTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function EditorHeader() {
  const pathname = usePathname();
  const onTreatmentEditor = pathname.startsWith("/treatment-pages");
  const { doc, dirty, saving, loadingPage, save } = useTreatmentPages();

  if (!onTreatmentEditor) {
    return (
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 data-[orientation=vertical]:h-4"
        />
        <span className="text-sm text-muted-foreground">Innehållsadmin</span>
      </header>
    );
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 data-[orientation=vertical]:h-4"
        />
        <EditorBreadcrumbs />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {doc ? (
          <Badge
            variant={dirty ? "secondary" : "outline"}
            className="hidden gap-1.5 font-normal sm:inline-flex"
          >
            <span
              className={`size-1.5 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-600"}`}
              aria-hidden
            />
            {dirty ? "Osparad" : "Sparad"}
          </Badge>
        ) : null}
        {doc?.path ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a
                href={doc.path}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ExternalLink data-icon="inline-start" />
            <span className="hidden lg:inline">Förhandsgranska</span>
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={!doc || !dirty || saving || loadingPage}
          onClick={() => void save()}
        >
          <Save data-icon="inline-start" />
          {saving ? "Sparar…" : "Spara"}
        </Button>
      </div>
    </header>
  );
}

export default function ContentAdminShell({ children }: Props) {
  return (
    <SidebarProvider
      defaultOpen
      className="content-admin-shell h-svh overflow-hidden"
      style={
        {
          "--sidebar-width": "16rem",
        } as CSSProperties
      }
    >
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="min-w-0 overflow-hidden bg-background">
        <EditorHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
