"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { BookOpen, ExternalLink, FileText, GraduationCap, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { TreatmentPagePickerCommand } from "@/components/TreatmentPagePicker";
import { useTreatmentPages } from "@/components/treatment-pages-context";
import { vivaciLogoForDarkBgAdminUrl } from "@/lib/site-image-url";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const PREVIEW_SITE_URL = "/";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const onTreatments = pathname.startsWith("/treatment-pages");
  const {
    filteredPages,
    pages,
    query,
    setQuery,
    activePageId,
    requestPageSelect,
  } = useTreatmentPages();

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-14"
              render={<Link href="/treatment-pages" aria-label="Vivaci innehållsadmin" />}
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
          <SidebarGroupLabel>Arbetsyta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={onTreatments}
                  className="hover:bg-sidebar-accent/80 data-active:bg-sidebar-accent"
                  render={<Link href="/treatment-pages" />}
                >
                  <FileText aria-hidden />
                  <span>Behandlingssidor</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="tabular-nums">
                  {pages.length}
                </SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith("/utbildning")}
                  className="hover:bg-sidebar-accent/80 data-active:bg-sidebar-accent"
                  render={<Link href="/utbildning" />}
                >
                  <GraduationCap aria-hidden />
                  <span>Utbildning</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith("/blogg")}
                  className="hover:bg-sidebar-accent/80 data-active:bg-sidebar-accent"
                  render={<Link href="/blogg" />}
                >
                  <BookOpen aria-hidden />
                  <span>Blogg</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {onTreatments ? (
          <SidebarGroup className="flex min-h-0 flex-1 flex-col pt-0">
            <SidebarGroupLabel>Sidbibliotek</SidebarGroupLabel>
            <SidebarGroupContent className="flex min-h-0 flex-1 flex-col">
              <TreatmentPagePickerCommand
                pages={filteredPages}
                query={query}
                onQueryChange={setQuery}
                activePageId={activePageId}
                onSelect={requestPageSelect}
                className="min-h-0 flex-1 bg-transparent"
              />
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup className="flex min-h-0 flex-1 flex-col pt-0">
            <SidebarGroupLabel>Sidbibliotek</SidebarGroupLabel>
            <SidebarGroupContent className="px-2 text-xs leading-relaxed text-sidebar-foreground/60">
              Välj en sida i listan till höger (på desktop) eller öppna en artikel
              från menyn ovan.
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <a href={PREVIEW_SITE_URL} />
              }
            >
              <ExternalLink className="size-4" aria-hidden />
              <span>Webbplats</span>
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
