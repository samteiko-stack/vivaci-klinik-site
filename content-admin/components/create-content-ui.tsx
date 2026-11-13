"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  CreateContentPageDialog,
  type CreateContentMode,
} from "@/components/create-content-page-dialog";
import { useTreatmentPages } from "@/components/treatment-pages-context";
import {
  ADMIN_BLOGG,
  ADMIN_TREATMENTS,
  ADMIN_UTBILDNING,
} from "@/lib/admin-routes";
type CreateContentUiValue = {
  canCreate: boolean;
  openCreate: () => void;
  createLabel: string;
};

const CreateContentUiContext = React.createContext<CreateContentUiValue | null>(
  null
);

export function useCreateContentUi() {
  const ctx = React.useContext(CreateContentUiContext);
  if (!ctx) {
    return {
      canCreate: false,
      openCreate: () => {},
      createLabel: "Ny sida",
    };
  }
  return ctx;
}

export function CreateContentUiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { createAndSelectPage } = useTreatmentPages();

  const onTreatments = pathname.startsWith(ADMIN_TREATMENTS);
  const onUtbildning = pathname.startsWith(ADMIN_UTBILDNING);
  const onBlogg = pathname.startsWith(ADMIN_BLOGG);

  const createMode: CreateContentMode | null = onTreatments
    ? "treatment"
    : onUtbildning
      ? "utbildning"
      : onBlogg
        ? "nyheter"
        : null;

  const simpleListApi = onUtbildning
    ? "/api/utbildning"
    : onBlogg
      ? "/api/nyheter"
      : null;
  const simpleRoute = onUtbildning
    ? ADMIN_UTBILDNING
    : onBlogg
      ? ADMIN_BLOGG
      : null;

  const [open, setOpen] = React.useState(false);
  const [hubCategories, setHubCategories] = React.useState<string[]>([]);

  const refreshHubCategories = React.useCallback(() => {
    if (!simpleListApi) return;
    fetch(simpleListApi, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { hubCategories?: string[] }) => {
        setHubCategories(data.hubCategories ?? []);
      })
      .catch(() => setHubCategories([]));
  }, [simpleListApi]);

  React.useEffect(() => {
    refreshHubCategories();
  }, [refreshHubCategories]);

  const createLabel = onTreatments
    ? "Ny behandlingssida"
    : onUtbildning
      ? "Ny utbildning"
      : onBlogg
        ? "Ny artikel"
        : "Ny sida";

  const value = React.useMemo(
    () => ({
      canCreate: Boolean(createMode),
      openCreate: () => setOpen(true),
      createLabel,
    }),
    [createMode, createLabel]
  );

  return (
    <CreateContentUiContext.Provider value={value}>
      {children}
      {createMode ? (
        <CreateContentPageDialog
          open={open}
          onOpenChange={setOpen}
          mode={createMode}
          hubCategories={hubCategories}
          onCreated={(result) => {
            if (createMode === "treatment" && result.category) {
              createAndSelectPage(result.category, result.slug);
              return;
            }
            if (simpleRoute) {
              refreshHubCategories();
              window.dispatchEvent(new CustomEvent("vivaci:admin-pages-changed"));
              router.push(
                `${simpleRoute}?slug=${encodeURIComponent(result.slug)}`
              );
            }
          }}
        />
      ) : null}
    </CreateContentUiContext.Provider>
  );
}

/** Full-width control for the dark sidebar — uses sidebar tokens, not page `Button outline`. */
export function CreateContentSidebarButton() {
  const { canCreate, openCreate, createLabel } = useCreateContentUi();
  if (!canCreate) return null;

  return (
    <SidebarMenu className="mb-2 px-0">
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          variant="outline"
          className="h-9 w-full border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground shadow-none hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
          onClick={openCreate}
        >
          <Plus aria-hidden />
          <span>{createLabel}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** Primary action in the editor top bar (light surface). */
export function CreateContentHeaderButton() {
  const { canCreate, openCreate, createLabel } = useCreateContentUi();
  if (!canCreate) return null;

  return (
    <Button type="button" variant="secondary" size="sm" onClick={openCreate}>
      <Plus data-icon="inline-start" className="size-4" aria-hidden />
      <span className="hidden sm:inline">{createLabel}</span>
      <span className="sm:hidden">Ny</span>
    </Button>
  );
}
