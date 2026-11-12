import { ActionGroup } from "./ActionGroup";
import { cn } from "@/lib/utils";

/** Count + primary actions on list toolbars — tokenized gap, aligns end of toolbar row. */
export function ListToolbarEnd({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ActionGroup align="end" className={cn("ds-list-toolbar-end", className)}>
      {children}
    </ActionGroup>
  );
}
