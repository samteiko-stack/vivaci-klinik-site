import type { LucideIcon } from "lucide-react";
import { FileText, ExternalLink } from "lucide-react";

export type VivaciNavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

export type VivaciNavSection = {
  key: string;
  label?: string;
  items: VivaciNavItem[];
};

export function getVivaciNavSections(): VivaciNavSection[] {
  return [
    {
      key: "content",
      label: "Innehåll",
      items: [
        { key: "treatment-pages", href: "/treatment-pages", icon: FileText },
        {
          key: "preview",
          href: "http://127.0.0.1:8765/",
          icon: ExternalLink,
          external: true,
        },
      ],
    },
  ];
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href.startsWith("http")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
