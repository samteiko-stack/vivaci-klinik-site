"use client";

import type { CSSProperties, ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink, Save } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  ADMIN_BLOGG,
  ADMIN_TREATMENTS,
  ADMIN_UTBILDNING,
} from "@/lib/admin-routes";
import { useSimpleContent } from "@/components/simple-content-context";
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

function workspaceLabel(pathname: string): string {
  if (pathname.startsWith(ADMIN_UTBILDNING)) return "Utbildning";
  if (pathname.startsWith(ADMIN_BLOGG)) return "Blogg";
  return "Behandlingssidor";
}

function workspaceHref(pathname: string): string {
  if (pathname.startsWith(ADMIN_UTBILDNING)) return ADMIN_UTBILDNING;
  if (pathname.startsWith(ADMIN_BLOGG)) return ADMIN_BLOGG;
  return ADMIN_TREATMENTS;
}

function EditorBreadcrumbs() {
  const pathname = usePathname();
  const treatments = useTreatmentPages();
  const simple = useSimpleContent();
  const onTreatments = pathname.startsWith(ADMIN_TREATMENTS);
  const wsLabel = workspaceLabel(pathname);
  const wsHref = workspaceHref(pathname);

  const pageTitle = onTreatments
    ? treatments.pageTitle
    : simple?.pageTitle ?? "";
  const hasPage = onTreatments
    ? Boolean(treatments.activePageId && treatments.doc)
    : Boolean(simple?.slug && simple?.doc);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden xl:block">
          <BreadcrumbLink href={ADMIN_TREATMENTS}>Innehåll</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden xl:block" />
        <BreadcrumbItem className="hidden lg:block">
          {hasPage ? (
            <BreadcrumbLink href={wsHref}>{wsLabel}</BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{wsLabel}</BreadcrumbPage>
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
  const onTreatments = pathname.startsWith(ADMIN_TREATMENTS);
  const treatments = useTreatmentPages();
  const simple = useSimpleContent();

  const dirty = onTreatments ? treatments.dirty : simple?.dirty ?? false;
  const saving = onTreatments ? treatments.saving : simple?.saving ?? false;
  const loading = onTreatments ? treatments.loadingPage : simple?.loading ?? false;
  const canSave = onTreatments
    ? Boolean(treatments.doc)
  : Boolean(simple?.doc);
  const previewPath = onTreatments
    ? treatments.doc?.path
    : simple?.pagePath;

  const save = onTreatments
    ? () => void treatments.save()
    : () => void simple?.save();

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
        {canSave ? (
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
        {previewPath ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a href={previewPath} target="_blank" rel="noreferrer" />
            }
          >
            <ExternalLink data-icon="inline-start" />
            <span className="hidden lg:inline">Förhandsgranska</span>
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={!canSave || !dirty || saving || loading}
          onClick={save}
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
