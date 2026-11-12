import { cn } from "@/lib/utils";

const GAP_CLASS: Record<string, string> = {
  xs: "ds-gap-xs",
  sm: "ds-gap-sm",
  md: "ds-gap-md",
  lg: "ds-gap-lg",
  xl: "ds-gap-xl",
  "4px": "ds-gap-xs",
  "0.5rem": "ds-gap-half",
  "6px": "ds-gap-6",
  "8px": "ds-gap-sm",
  "10px": "ds-gap-10",
  "12px": "ds-gap-12",
  "16px": "ds-gap-md",
  "20px": "ds-gap-20",
  "24px": "ds-gap-lg",
};

function gapClass(gap?: string | number) {
  if (gap == null) return undefined;
  const key = typeof gap === "number" ? `${gap}px` : gap;
  return GAP_CLASS[key];
}

export function Stack({
  gap,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { gap?: string | number }) {
  return <div className={cn("ds-stack", gapClass(gap), className)} {...props} />;
}

export function Flex({
  gap,
  between,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { gap?: string | number; between?: boolean }) {
  return (
    <div
      className={cn(between ? "ds-flex-between" : "ds-flex", gapClass(gap), className)}
      {...props}
    />
  );
}

export function Divider({ light, className }: { light?: boolean; className?: string }) {
  return <hr className={cn(light ? "ds-divider-light" : "ds-divider", className)} />;
}

export function Card({
  padded,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return <div className={cn("ds-card", padded && "ds-card-padded", className)} {...props} />;
}

export function InsetPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-surface-inset", className)} {...props} />;
}

export function MutedPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-surface-muted", className)} {...props} />;
}

export function CalloutPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-surface-callout", className)} {...props} />;
}

export function PanelDark({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-panel-dark", className)} {...props} />;
}
