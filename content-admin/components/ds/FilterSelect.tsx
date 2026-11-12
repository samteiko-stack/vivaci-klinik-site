"use client";

import { cn } from "@/lib/utils";
import { Menu, MenuItem, MenuPanel, FilterTrigger } from "./Menu";

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
  className,
  menuPortal = true,
  size = "toolbar",
}: {
  value: string;
  placeholder: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
  /** Render menu in a body portal so it is not clipped by overflow containers. */
  menuPortal?: boolean;
  /** toolbar = compact 36px row; field = 40px to match inputs in inline forms */
  size?: "toolbar" | "field";
}) {
  const active = value !== "";
  const label = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <Menu className={cn("ds-filter-select", className)}>
      <FilterTrigger
        active={active}
        className={size === "field" ? "ds-filter-trigger--field" : undefined}
      >
        <span className="ds-filter-trigger__label">{label}</span>
      </FilterTrigger>
      <MenuPanel portal={menuPortal} mobileSheet className="ds-filter-select-panel">
        {options.map((opt) => (
          <MenuItem
            key={opt.value || "__all__"}
            active={opt.value === value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </MenuItem>
        ))}
      </MenuPanel>
    </Menu>
  );
}
