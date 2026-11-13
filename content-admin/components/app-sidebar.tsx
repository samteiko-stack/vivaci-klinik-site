"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  LogOut,
  Scale,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { CreateContentSidebarButton } from "@/components/create-content-ui";
import { SidebarPagePicker } from "@/components/sidebar-page-picker";
import { TreatmentPagePickerCommand } from "@/components/TreatmentPagePicker";
import { useTreatmentPages } from "@/components/treatment-pages-context";
import {
  ADMIN_BLOGG,
  ADMIN_LEGAL,
  ADMIN_TREATMENTS,
  ADMIN_UTBILDNING,
} from "@/lib/admin-routes";
import type { SimpleContentMeta } from "@/lib/simple-json-store-types";
import { vivaciLogoForDarkBgAdminUrl } from "@/lib/site-image-url";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const PREVIEW_SITE_URL = "/";

const WORKSPACES = [
  {
    key: "treatments",
    href: ADMIN_TREATMENTS,
    label: "Behandlingssidor",
    icon: FileText,
  },
  {
    key: "utbildning",
    href: ADMIN_UTBILDNING,
    label: "Utbildning",
    icon: GraduationCap,
  },
  {
    key: "blogg",
    href: ADMIN_BLOGG,
    label: "Blogg",
    icon: BookOpen,
  },
  {
    key: "juridik",
    href: ADMIN_LEGAL,
    label: "Juridik",
    icon: Scale,
  },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const onTreatments = pathname.startsWith(ADMIN_TREATMENTS);
  const onUtbildning = pathname.startsWith(ADMIN_UTBILDNING);
  const onBlogg = pathname.startsWith(ADMIN_BLOGG);
  const onLegal = pathname.startsWith(ADMIN_LEGAL);
  const {
    filteredPages,
    pages,
    query,
    setQuery,
    activePageId,
    requestPageSelect,
  } = useTreatmentPages();

  const [simplePages, setSimplePages] = React.useState<SimpleContentMeta[]>([]);
  const [simpleQuery, setSimpleQuery] = React.useState("");
  const simpleListApi = onUtbildning
    ? "/api/utbildning"
    : onBlogg
      ? "/api/nyheter"
      : onLegal
        ? "/api/legal"
        : null;
  const simpleRoute = onUtbildning
    ? ADMIN_UTBILDNING
    : onBlogg
      ? ADMIN_BLOGG
      : onLegal
        ? ADMIN_LEGAL
        : null;
  const activeSlug = searchParams.get("slug") ?? "";

  const workspaceLabel = onUtbildning
    ? "Utbildning"
    : onBlogg
      ? "Blogg"
      : onLegal
        ? "Juridik"
        : onTreatments
          ? "Behandlingssidor"
          : "Innehåll";

  const refreshSimpleList = React.useCallback(() => {
    if (!simpleListApi) return;
    fetch(simpleListApi, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { pages: SimpleContentMeta[] }) => {
        setSimplePages(data.pages ?? []);
      })
      .catch(() => {
        setSimplePages([]);
      });
  }, [simpleListApi]);

  React.useEffect(() => {
    if (!simpleListApi) {
      setSimplePages([]);
      return;
    }
    refreshSimpleList();
  }, [simpleListApi, refreshSimpleList]);

  React.useEffect(() => {
    const onPagesChanged = () => refreshSimpleList();
    window.addEventListener("vivaci:admin-pages-changed", onPagesChanged);
    return () =>
      window.removeEventListener("vivaci:admin-pages-changed", onPagesChanged);
  }, [refreshSimpleList]);

  const simplePickerPages = React.useMemo(
    () =>
      simplePages.map((p) => ({
        id: p.slug,
        title: p.title,
        group: p.group,
      })),
    [simplePages]
  );

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-14"
              render={<Link href={ADMIN_TREATMENTS} aria-label="Vivaci innehållsadmin" />}
            >
              <Image
                src={vivaciLogoForDarkBgAdminUrl()}
                alt="Vivaci Klinik"
                width={384}
                height={145}
                className="h-9 w-auto object-contain object-left"
                priority
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Vad vill du redigera?</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton className="hover:bg-sidebar-accent/80" />
                    }
                  >
                    <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    <span>Innehåll på webbplatsen</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {WORKSPACES.map((ws) => {
                        const active = pathname.startsWith(ws.href);
                        const Icon = ws.icon;
                        return (
                          <SidebarMenuSubItem key={ws.key}>
                            <SidebarMenuSubButton
                              isActive={active}
                              render={<Link href={ws.href} />}
                            >
                              <Icon aria-hidden className="size-4" />
                              <span>{ws.label}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="flex min-h-0 flex-1 flex-col pt-0">
          <SidebarGroupLabel>Sidor — {workspaceLabel}</SidebarGroupLabel>
          <SidebarGroupContent className="flex min-h-0 flex-1 flex-col">
            <CreateContentSidebarButton />
            {onTreatments ? (
              <TreatmentPagePickerCommand
                pages={filteredPages}
                query={query}
                onQueryChange={setQuery}
                activePageId={activePageId}
                onSelect={requestPageSelect}
                className="min-h-0 flex-1 bg-transparent"
              />
            ) : simpleRoute ? (
              <SidebarPagePicker
                pages={simplePickerPages}
                query={simpleQuery}
                onQueryChange={setSimpleQuery}
                activeId={activeSlug}
                onSelect={(slug) =>
                  router.push(`${simpleRoute}?slug=${encodeURIComponent(slug)}`)
                }
                searchPlaceholder="Sök utbildning eller artikel…"
                emptyLabel="Ingen sida matchar."
                className="min-h-0 flex-1"
              />
            ) : (
              <p className="px-2 text-xs text-sidebar-foreground/60">
                Välj Behandlingssidor, Utbildning eller Blogg ovan.
              </p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <a href={PREVIEW_SITE_URL} target="_blank" rel="noreferrer" />
              }
            >
              <ExternalLink className="size-4" aria-hidden />
              <span>Visa webbplats</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="mx-0" />
        <div className="flex min-w-0 items-center gap-2 px-2 py-1">
          <Avatar size="sm">
            <AvatarFallback className="bg-sidebar-primary text-[0.65rem] font-semibold text-sidebar-primary-foreground">
              VA
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">Vivaci Admin</p>
            <p className="truncate text-xs text-sidebar-foreground/50">Inloggad</p>
          </div>
        </div>
        <form action={logoutAction}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                type="submit"
                className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut aria-hidden />
                <span>Logga ut</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
