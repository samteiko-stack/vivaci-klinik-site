import { cn } from "@/lib/utils";

export type ActionGroupAlign = "start" | "end" | "split";
export type ActionGroupSize = "inline" | "footer";

export interface ActionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: ActionGroupAlign;
  size?: ActionGroupSize;
}

/** Side-by-side actions (buttons, button-styled links). Use DialogFooter / ModalFooterActions for modal footers. */
export function ActionGroup({
  align = "end",
  size = "inline",
  className,
  ...props
}: ActionGroupProps) {
  return (
    <div
      className={cn(
        "ds-action-group",
        align === "start" && "ds-action-group--start",
        align === "split" && "ds-action-group--split",
        size === "footer" && "ds-action-group--footer",
        className,
      )}
      {...props}
    />
  );
}
