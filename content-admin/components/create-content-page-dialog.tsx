"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TREATMENT_CATEGORY_LABEL,
  TREATMENT_PAGE_CATEGORIES,
} from "@/lib/treatment-page-categories";
import { isValidContentSlug, slugifyTitle } from "@/lib/slugify";

export type CreateContentMode = "utbildning" | "nyheter" | "treatment";

type CreateContentPageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CreateContentMode;
  hubCategories?: string[];
  onCreated: (result: {
    slug: string;
    category?: string;
    path: string;
  }) => void;
};

export function CreateContentPageDialog({
  open,
  onOpenChange,
  mode,
  hubCategories = [],
  onCreated,
}: CreateContentPageDialogProps) {
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [category, setCategory] = React.useState<string>(
    mode === "treatment" ? TREATMENT_PAGE_CATEGORIES[0] : ""
  );
  const [hubCategory, setHubCategory] = React.useState("");
  const [addToHub, setAddToHub] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const hubOptions = hubCategories.length
    ? hubCategories
    : mode === "utbildning"
      ? ["Övrigt"]
      : ["Nyhet"];

  React.useEffect(() => {
    if (!open) return;
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setCategory(mode === "treatment" ? TREATMENT_PAGE_CATEGORIES[0] : "");
    setHubCategory(hubOptions[0] ?? "");
    setAddToHub(true);
  }, [open, mode, hubOptions]);

  React.useEffect(() => {
    if (slugTouched) return;
    setSlug(slugifyTitle(title));
  }, [title, slugTouched]);

  React.useEffect(() => {
    if (!hubCategory && hubOptions[0]) {
      setHubCategory(hubOptions[0]);
    }
  }, [hubCategory, hubOptions]);

  const slugValid = isValidContentSlug(slug);
  const canSubmit = Boolean(title.trim() && slugValid && (mode !== "treatment" || category));

  const modeTitle =
    mode === "treatment"
      ? "Ny behandlingssida"
      : mode === "utbildning"
        ? "Ny utbildningssida"
        : "Ny bloggartikel";

  const modeDescription =
    mode === "treatment"
      ? "Välj kategori som på webbplatsen (behandlingar, problem eller plastikkirurgi). Sidan skapas med alla sektioner redo att fyllas i."
      : mode === "utbildning"
        ? "Skapar en kurs under /utbildning/… och kan läggas till på utbildningsöversikten."
        : "Skapar en artikel under /nyheter/… och kan läggas till på bloggöversikten.";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (mode === "treatment") {
        const res = await fetch("/api/treatment-pages", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            slug,
            title: title.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Kunde inte skapa sidan");
        toast.success("Behandlingssida skapad");
        onCreated({
          slug: data.slug,
          category: data.category,
          path: data.path,
        });
      } else {
        const api = mode === "utbildning" ? "/api/utbildning" : "/api/nyheter";
        const res = await fetch(api, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            title: title.trim(),
            addToHub,
            hubCategory: hubCategory || hubOptions[0],
            listingCategory: hubCategory || hubOptions[0],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Kunde inte skapa sidan");
        toast.success(mode === "utbildning" ? "Utbildning skapad" : "Artikel skapad");
        onCreated({ slug: data.slug, path: data.path });
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte skapa sidan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{modeTitle}</DialogTitle>
            <DialogDescription>{modeDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-title">Titel</Label>
              <Input
                id="create-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. HydraFacial"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-slug">Slug (URL)</Label>
              <Input
                id="create-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="hydrafacial"
                aria-invalid={slug.length > 0 && !slugValid}
              />
              <p className="text-xs text-muted-foreground">
                {mode === "treatment" && category
                  ? `Publik URL: /${category}/${slug || "…"}`
                  : mode === "utbildning"
                    ? `Publik URL: /utbildning/${slug || "…"}`
                    : `Publik URL: /nyheter/${slug || "…"}`}
              </p>
            </div>
            {mode === "treatment" ? (
              <div className="grid gap-2">
                <Label>Kategori på webbplatsen</Label>
                <Select
                  value={category}
                  onValueChange={(v) => v && setCategory(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Välj kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_PAGE_CATEGORIES.map((key) => (
                      <SelectItem key={key} value={key}>
                        {TREATMENT_CATEGORY_LABEL[key as keyof typeof TREATMENT_CATEGORY_LABEL] ?? key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {mode !== "treatment" ? (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="create-add-hub"
                    checked={addToHub}
                    onCheckedChange={(v) => setAddToHub(v === true)}
                  />
                  <Label htmlFor="create-add-hub" className="cursor-pointer font-normal">
                    {mode === "utbildning"
                      ? "Lägg till kort på utbildningssidan"
                      : "Lägg till kort på bloggöversikten"}
                  </Label>
                </div>
                {addToHub ? (
                  <div className="grid gap-2">
                    <Label>
                      {mode === "utbildning"
                        ? "Sektion på utbildningsöversikten"
                        : "Sektion på bloggöversikten"}
                    </Label>
                    <Select
                      value={hubCategory}
                      onValueChange={(v) => v && setHubCategory(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Välj sektion" />
                      </SelectTrigger>
                      <SelectContent>
                        {hubOptions.map((label) => (
                          <SelectItem key={label} value={label}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
              Skapa och redigera
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateContentPageTrigger({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 shrink-0 gap-1 px-2 text-xs"
      onClick={onClick}
      disabled={disabled}
    >
      <Plus className="size-3.5" aria-hidden />
      Ny sida
    </Button>
  );
}
