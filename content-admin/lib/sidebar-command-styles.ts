import { cn } from "@/lib/utils";

/** Shared Command palette styles for sidebar page pickers (dark inset sidebar). */
export function sidebarCommandClassName(className?: string) {
  return cn(
    "relative gap-1 rounded-none bg-transparent p-0 text-sidebar-foreground shadow-none [&_[data-slot=input-group]]:border-sidebar-border [&_[data-slot=input-group]]:bg-sidebar-accent [&_[data-slot=input-group-addon]]:text-sidebar-foreground/50",
    className
  );
}

export const sidebarCommandInputClassName =
  "text-sidebar-foreground placeholder:text-sidebar-foreground/45";

export const sidebarCommandListClassName =
  "max-h-none flex-1 overflow-y-auto pb-8 pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent";

export const sidebarCommandItemClassName =
  "cursor-pointer rounded-md px-2.5 py-2.5 text-sidebar-foreground/70 transition-colors data-selected:bg-sidebar-accent/70 data-selected:text-sidebar-accent-foreground [&>svg:last-child]:hidden";

export function sidebarCommandItemActiveClassName(active: boolean) {
  return cn(
    sidebarCommandItemClassName,
    active && "bg-sidebar-accent text-sidebar-accent-foreground data-selected:bg-sidebar-accent"
  );
}
