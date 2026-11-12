"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { dicebearUrl, pickBgClass } from "@/lib/avatar-utils";
import { phoneDigitsKey } from "@/lib/utils";
import { User } from "@/lib/icons";
import type { AgentGender } from "@/types";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * - xs: note / thread meta
 * - sm: table & list identity (contacts/leads)
 * - md: app chrome (nav, sidebar)
 * - lg: record hero
 * - xl: profile page
 */
export const AVATAR_SIZE = {
  inline: "xs",
  table: "sm",
  chrome: "md",
  hero: "lg",
  profile: "xl",
} as const satisfies Record<string, AvatarSize>;

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "ds-avatar--xs",
  sm: "ds-avatar--sm",
  md: "ds-avatar--md",
  lg: "ds-avatar--lg",
  xl: "ds-avatar--xl",
};

export type AvatarProps = {
  name: string;
  size?: AvatarSize;
  className?: string;
  /** Staff: DiceBear clay. Contacts/leads: person icon or photo. */
  variant?: "staff" | "contact";
  imageUrl?: string | null;
  phone?: string | null;
  gender?: AgentGender | null;
};

function contactColorSeed(name: string, phone?: string | null): string {
  if (phone?.trim()) return phoneDigitsKey(phone);
  return name.trim() || "contact";
}

export function Avatar({
  name,
  size = AVATAR_SIZE.chrome,
  className,
  variant = "staff",
  imageUrl,
  phone,
  gender,
}: AvatarProps) {
  const pathname = usePathname();
  const sizeClass = SIZE_CLASS[size];

  const contactSeed = useMemo(
    () => contactColorSeed(name, phone),
    [name, phone]
  );

  const staffUrl = useMemo(
    () => dicebearUrl(name, pathname, gender),
    [name, pathname, gender]
  );

  if (variant === "contact") {
    const bgClass = pickBgClass(contactSeed);

    if (!imageUrl) {
      return (
        <div
          className={cn(
            "ds-avatar ds-avatar--contact-fallback",
            sizeClass,
            bgClass,
            className
          )}
          aria-hidden
        >
          <User className="ds-avatar__person-icon" strokeWidth={1.75} aria-hidden />
        </div>
      );
    }

    return (
      <div className={cn("ds-avatar", sizeClass, bgClass, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="ds-avatar__img" />
      </div>
    );
  }

  const bgClass = pickBgClass(`${name}|${pathname}`);

  return (
    <div className={cn("ds-avatar", sizeClass, bgClass, className)}>
      <object
        key={staffUrl}
        data={staffUrl}
        type="image/svg+xml"
        aria-label={name}
        className="ds-avatar__img"
      />
    </div>
  );
}
