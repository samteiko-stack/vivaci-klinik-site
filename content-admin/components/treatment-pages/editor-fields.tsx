"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { RichTextField } from "@/components/ui/rich-text-field";
import { Textarea } from "@/components/ui/textarea";
import { ImagePathField } from "@/components/treatment-pages/image-path-field";
import { cn } from "@/lib/utils";

export function SectionFormBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}

export function SectionSubheading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-sm font-medium leading-none tracking-tight", className)}>
      {children}
    </h3>
  );
}

export function SectionHint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}

export function SubsectionCard({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className={cn("gap-0 py-0 shadow-sm", className)}>
      {title ? (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-4 py-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {action}
        </CardHeader>
      ) : null}
      <CardContent className="flex flex-col gap-4 p-4">{children}</CardContent>
    </Card>
  );
}

export function FieldGroup({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label className="text-xs font-medium leading-none text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SectionEnabled({
  checked,
  onCheckedChange,
  title = "Visa sektion på sidan",
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  title?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3">
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
        {title}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function CtaFields({
  cta,
  onChange,
}: {
  cta: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldGroup label="Knapptext">
        <Input
          value={String(cta.label ?? "")}
          onChange={(e) => onChange({ ...cta, label: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Länk">
        <Input
          value={String(cta.href ?? "")}
          placeholder="/kontakt"
          onChange={(e) => onChange({ ...cta, href: e.target.value })}
        />
      </FieldGroup>
    </div>
  );
}

type StringListProps = {
  items: string[];
  onChange: (items: string[]) => void;
  itemLabel?: string;
};

export function StringListEditor({ items, onChange, itemLabel = "Punkt" }: StringListProps) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="flex flex-col gap-3">
      {list.map((val, idx) => (
        <SubsectionCard key={idx} title={`${itemLabel} ${idx + 1}`}>
          <FieldGroup label="Text">
            <Textarea
              rows={2}
              value={val}
              onChange={(e) => {
                const next = [...list];
                next[idx] = e.target.value;
                onChange(next);
              }}
            />
          </FieldGroup>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(list.filter((_, i) => i !== idx))}
            >
              Ta bort
            </Button>
          </div>
        </SubsectionCard>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...list, ""])}
      >
        + Lägg till
      </Button>
    </div>
  );
}

type FieldDef = {
  key: string;
  label: string;
  kind?: "textarea" | "image" | "richtext";
  rows?: number;
  placeholder?: string;
};

export function CardListEditor({
  items,
  fields,
  emptyItem,
  onChange,
}: {
  items: Record<string, unknown>[];
  fields: FieldDef[];
  emptyItem: Record<string, unknown>;
  onChange: (items: Record<string, unknown>[]) => void;
}) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="flex flex-col gap-3">
      {list.map((item, idx) => (
        <SubsectionCard key={idx} title={`Rad ${idx + 1}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <FieldGroup
                key={f.key}
                label={f.label}
                className={
                  f.kind === "textarea" || f.kind === "image" || f.kind === "richtext"
                    ? "sm:col-span-2"
                    : undefined
                }
              >
                {f.kind === "richtext" ? (
                  <RichTextField
                    value={String(item[f.key] ?? "")}
                    onChange={(val) => {
                      const next = list.map((row, i) =>
                        i === idx ? { ...row, [f.key]: val } : row
                      );
                      onChange(next);
                    }}
                  />
                ) : f.kind === "textarea" ? (
                  <Textarea
                    rows={f.rows ?? 3}
                    value={String(item[f.key] ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => {
                      const next = list.map((row, i) =>
                        i === idx ? { ...row, [f.key]: e.target.value } : row
                      );
                      onChange(next);
                    }}
                  />
                ) : f.kind === "image" ? (
                  <ImagePathField
                    value={String(item[f.key] ?? "")}
                    placeholder={f.placeholder ?? "/images/…"}
                    onChange={(val) => {
                      const next = list.map((row, i) =>
                        i === idx ? { ...row, [f.key]: val } : row
                      );
                      onChange(next);
                    }}
                  />
                ) : (
                  <Input
                    value={String(item[f.key] ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => {
                      const next = list.map((row, i) =>
                        i === idx ? { ...row, [f.key]: e.target.value } : row
                      );
                      onChange(next);
                    }}
                  />
                )}
              </FieldGroup>
            ))}
          </div>
          <div className="flex justify-end border-t pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(list.filter((_, i) => i !== idx))}
            >
              Ta bort
            </Button>
          </div>
        </SubsectionCard>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...list, { ...emptyItem }])}
      >
        + Lägg till
      </Button>
    </div>
  );
}

export function FactIconSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string | undefined) => void;
}) {
  const selectValue = value || "__auto__";
  return (
    <Select
      value={selectValue}
      onValueChange={(v) => onChange(!v || v === "__auto__" ? undefined : v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="(automatisk ikon)" />
      </SelectTrigger>
      <SelectContent>
        {options.map((ic) => (
          <SelectItem key={ic || "__auto__"} value={ic || "__auto__"}>
            {ic || "(automatisk ikon)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FormSectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <SectionSubheading className="shrink-0 text-muted-foreground">{label}</SectionSubheading>
      <Separator className="flex-1" />
    </div>
  );
}
