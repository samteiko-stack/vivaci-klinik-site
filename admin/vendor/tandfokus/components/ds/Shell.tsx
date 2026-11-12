import { cn } from "@/lib/utils";

export function AppShell({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-app-shell", className)} {...props} />;
}

export function MainContent({
  leadPage,
  flush,
  compact,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { leadPage?: boolean; flush?: boolean; compact?: boolean }) {
  return (
    <main
      className={cn(
        "crm-main",
        "ds-main",
        leadPage && "lead-page-main",
        flush && "ds-main--flush",
        compact && "ds-main--compact",
        className
      )}
      {...props}
    />
  );
}

export function PageHeader({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <header className={cn("ds-page-header", className)} {...props} />;
}

export function PageHeaderTitle({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <>
      {eyebrow && <p className="ds-text-sm ds-page-header-eyebrow">{eyebrow}</p>}
      <h1 className="ds-sr-only">{title}</h1>
    </>
  );
}

/** Intro copy above list toolbars — tokenized type/color via `.ds-page-lead`. */
export function PageLead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("ds-page-lead", className)}>{children}</p>;
}
