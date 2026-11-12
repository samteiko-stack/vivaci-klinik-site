"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Spinner } from "./Feedback";

export type NumberStepperFieldSize = "md" | "sm";

export type NumberStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  loading?: boolean;
  /** Matches shared form control heights (`Input`, `SelectField`). */
  fieldSize?: NumberStepperFieldSize;
  /** Full width inside fields / detail controls (default true). */
  block?: boolean;
  className?: string;
  ariaLabel?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  disabled,
  loading,
  fieldSize = "md",
  block = true,
  className,
  ariaLabel,
}: NumberStepperProps) {
  const t = useTranslations("common");
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div
      className={cn(
        "ds-number-stepper",
        fieldSize === "sm" && "ds-number-stepper--sm",
        block && "ds-number-stepper--block",
        disabled && "ds-number-stepper--disabled",
        loading && "ds-number-stepper--loading",
        className
      )}
      role="group"
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        type="button"
        variant="secondary"
        size={fieldSize === "sm" ? "sm" : "icon"}
        className="ds-number-stepper__btn"
        disabled={disabled || atMin}
        aria-label={t("stepDown")}
        onClick={() => onChange(clamp(value - 1, min, max))}
      >
        <Minus className="ds-icon-xs" aria-hidden />
      </Button>
      <span className="ds-number-stepper__value" aria-live="polite">
        <span className="ds-number-stepper__value-text">{value}</span>
        {loading ? (
          <Spinner size="sm" className="ds-number-stepper__value-spinner" aria-hidden />
        ) : null}
      </span>
      <Button
        type="button"
        variant="secondary"
        size={fieldSize === "sm" ? "sm" : "icon"}
        className="ds-number-stepper__btn"
        disabled={disabled || atMax}
        aria-label={t("stepUp")}
        onClick={() => onChange(clamp(value + 1, min, max))}
      >
        <Plus className="ds-icon-xs" aria-hidden />
      </Button>
    </div>
  );
}
