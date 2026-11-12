import { cn } from "@/lib/utils";

type HeadingLevel = 1 | 2 | 3;
type TextVariant = "body" | "body-sm" | "muted" | "subtle" | "label" | "caption" | "overline" | "strong" | "secondary" | "meta";

const headingClass: Record<HeadingLevel, string> = {
  1: "ds-heading-1",
  2: "ds-heading-2",
  3: "ds-heading-3",
};

const textClass: Record<TextVariant, string> = {
  body: "ds-text",
  "body-sm": "ds-text-sm",
  muted: "ds-text-muted",
  subtle: "ds-text-subtle",
  label: "ds-label",
  caption: "ds-caption",
  overline: "ds-overline",
  strong: "ds-text-strong",
  secondary: "ds-text-secondary",
  meta: "ds-text-meta",
};

export function Heading({
  level = 2,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { level?: HeadingLevel }) {
  const Tag = (`h${level}` as "h1" | "h2" | "h3");
  return <Tag className={cn(headingClass[level], className)} {...props} />;
}

export function Text({
  variant = "body",
  as: Tag = "p",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { variant?: TextVariant; as?: "p" | "span" | "div" }) {
  return <Tag className={cn(textClass[variant], className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("ds-field-label", className)} {...props} />;
}
