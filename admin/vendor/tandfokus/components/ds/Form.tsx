import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./Checkbox";
import { Label } from "./Text";

type NativePickerInputType = "date" | "datetime-local" | "time" | "month" | "week";

export function Input({
  className,
  fieldSize = "md",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> & {
  fieldSize?: "md" | "lg";
  type?: Exclude<React.HTMLInputTypeAttribute, NativePickerInputType>;
}) {
  return (
    <input
      className={cn("ds-input", fieldSize === "lg" && "ds-input--lg", className)}
      {...props}
    />
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn("ds-textarea", className)} {...props} />;
  }
);

export function Select({
  className,
  fieldSize = "md",
  children,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & { fieldSize?: "md" | "lg" }) {
  return (
    <select className={cn("ds-select", fieldSize === "lg" && "ds-select--lg", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ds-field", className)}>
      {label && (
        htmlFor ? (
          <Label htmlFor={htmlFor}>{label}</Label>
        ) : (
          <div className="ds-field-label">{label}</div>
        )
      )}
      {children}
    </div>
  );
}

/** Helper copy under a field control — 11px, `--color-field-hint`. */
export function FieldHint({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("ds-field-hint", className)}>{children}</p>;
}

/** Checkbox row with title + optional description — same pattern app-wide. */
export function ToggleField({
  checked,
  onChange,
  title,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("ds-toggle-field", disabled && "ds-toggle-field--disabled", className)}>
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="ds-toggle-field__copy">
        <span className="ds-toggle-field__title">{title}</span>
        {description ? <span className="ds-toggle-field__desc">{description}</span> : null}
      </span>
    </label>
  );
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: {
  label?: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label} className={className}>
      <Select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
