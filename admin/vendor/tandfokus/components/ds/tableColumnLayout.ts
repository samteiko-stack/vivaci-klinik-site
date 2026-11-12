/** Content minima + shared surplus allocation. Never infer widths from row data. */
const growth: Record<string, number> = {
  name: 3, contact: 3, identifier: 3, narrative: 4, standard: 2, clinic: 2, phone: 1, flex: 3,
};
const aliases: Record<string, string> = {
  checkbox: "utility", fit: "standard", narrow: "compact", grow: "narrative", leftover: "flex",
};

export function tableColumnLayout(classes: string[]) {
  const columns = classes.map((className) => {
    const roles = className.split(/\s+/).filter((name) => name.startsWith("ds-table-col--"))
      .map((name) => name.replace("ds-table-col--", ""))
      .map((role) => aliases[role] ?? role);
    const role = roles.find((value) => value !== "flex") ?? "flex";
    return { minimum: `var(--data-table-column-${role === "flex" ? "flex-min" : role})`, weight: growth[role] ?? 0 };
  });
  const minimum = columns.map((column) => column.minimum).join(" + ");
  const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0);
  return {
    minWidth: `calc(${minimum})`,
    widths: columns.map(({ minimum: base, weight }) => weight && totalWeight
      ? `calc(${base} + (100% - (${minimum})) * ${weight / totalWeight})`
      : base),
  };
}
