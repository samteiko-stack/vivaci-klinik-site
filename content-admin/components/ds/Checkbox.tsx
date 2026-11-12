"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  size?: "sm" | "md";
  indeterminate?: boolean;
}

export function Checkbox({ className, size = "sm", indeterminate, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn("ds-checkbox", size === "md" && "ds-checkbox--md", className)}
      {...props}
    />
  );
}
