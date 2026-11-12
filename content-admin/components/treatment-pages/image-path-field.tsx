"use client";

import { useId, useState } from "react";
import { ChevronDown, FolderOpen, ImageOff, Upload } from "lucide-react";
import { ImagePickerDialog } from "@/components/treatment-pages/image-picker-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  isPreviewableLocalImage,
  normalizeImageWebPath,
  siteAssetAdminUrl,
} from "@/lib/site-image-url";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ImagePathFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowUpload?: boolean;
};

export function ImagePathField({
  value,
  onChange,
  placeholder = "/images/…",
  className,
  allowUpload = true,
}: ImagePathFieldProps) {
  const inputId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const normalized = normalizeImageWebPath(value);
  const previewSrc = isPreviewableLocalImage(normalized) ? siteAssetAdminUrl(normalized) : normalized;
  const showPreview = Boolean(previewSrc);
  const hasImage = Boolean(normalized.trim());

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/site-assets/upload", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error ?? "Uppladdning misslyckades");
      const path = (json as { path?: string }).path;
      if (path) onChange(path);
      toast.success("Bild uppladdad");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Uppladdning misslyckades");
    } finally {
      setUploading(false);
    }
  }

  function openFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void onUpload(file);
    };
    input.click();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-3">
        <div
          className={cn(
            "relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted",
            !showPreview && "text-muted-foreground"
          )}
        >
          {showPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt=""
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <ImageOff className="size-6" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {allowUpload ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={openFilePicker}
              >
                <Upload aria-hidden />
                {uploading ? "Laddar upp…" : hasImage ? "Byt bild" : "Ladda upp"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
            >
              <FolderOpen aria-hidden />
              Välj från bibliotek
            </Button>
            {hasImage ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                Ta bort
              </Button>
            ) : null}
          </div>
          <Collapsible>
            <CollapsibleTrigger className="group flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown
                className="size-3.5 transition-transform group-data-panel-open:rotate-180"
                aria-hidden
              />
              Avancerat
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Input
                id={inputId}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                className="font-mono text-xs"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Endast för teknisk felsökning — använd uppladdning eller biblioteket i vanliga fall.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      <ImagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(path) => onChange(path)}
      />
    </div>
  );
}
