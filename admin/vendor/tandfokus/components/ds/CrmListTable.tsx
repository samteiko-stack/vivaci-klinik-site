"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Archive, ChevronDown, Search, X } from "@/lib/icons";
import { Avatar, AVATAR_SIZE } from "./Avatar";
import { useSettingsSectionList } from "./settings-section-list-context";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import {
  DataTableBody,
  DataTableCard,
  DataTableEmpty,
  DataTableGrid,
  DataTableHead,
  DataTableRow,
  DataTableScroll,
  DataTableSearch,
  DataTableTd,
  DataTableTh,
  DataTableToolbar,
  DataTableToolbarGroup,
} from "./DataTable";
import { ListTableCount } from "./ListTableCount";
import { ListToolbarEnd } from "./ListToolbarEnd";
import { EmptyState, Skeleton } from "./Feedback";
import { FilterToggle } from "./Menu";
import { Input } from "./Form";
import { RowActionsMenu, type RowAction } from "./RowActionsMenu";

export function DataTableNameCell({
  name,
  subtitle,
  imageUrl,
  icon,
  hideLeading = false,
}: {
  name: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  /** Replaces avatar/initials — for forms, clinics, etc. */
  icon?: ReactNode;
  /** Name + subtitle only — no avatar or icon. */
  hideLeading?: boolean;
}) {
  return (
    <div className="ds-whatsapp-convo-row">
      {!hideLeading &&
        (icon ? (
          <span className="ds-table-name-cell__icon" aria-hidden>
            {icon}
          </span>
        ) : (
          <Avatar
            variant="contact"
            name={name}
            imageUrl={imageUrl}
            size={AVATAR_SIZE.table}
            className="ds-whatsapp-convo__avatar"
          />
        ))}
      <div className="ds-whatsapp-convo">
        <div className="ds-whatsapp-convo__head">
          <span className="ds-whatsapp-convo__name">{name}</span>
        </div>
        {subtitle ? (
          <div className="ds-whatsapp-convo__foot">
            <span className="ds-whatsapp-convo__preview" title={subtitle}>
              {subtitle}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export type CrmListColumn<T> = {
  id: string;
  header: string;
  className?: string;
  render: (item: T) => ReactNode;
};

const LIST_ROW_CONTROL_SELECTOR =
  "a, button, select, input, textarea, [role='combobox'], [role='listbox'], [role='menu']";

function isListRowControlTarget(target: HTMLElement) {
  return Boolean(target.closest(LIST_ROW_CONTROL_SELECTOR));
}

function listTableColClass(className?: string) {
  if (!className) return "ds-table-col--standard";
  const roles = className.split(/\s+/).filter((token) => token.startsWith("ds-table-col--"));
  return roles.length > 0 ? roles.join(" ") : "ds-table-col--standard";
}

export type CrmListGroup<T> = {
  id: string;
  label: string;
  items: T[];
};

export function CrmListTable<T extends { id: string; active?: boolean }>({
  search,
  onSearchChange,
  searchPlaceholder,
  showInactive,
  onToggleInactive,
  inactiveToggleLabel,
  countLabel,
  items,
  loading,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  nameHeader,
  dataColumns,
  renderNameCell,
  getRowActions,
  toolbarActions,
  bulkBar,
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyIcon,
  isRowSelectable,
  className,
  toolbarFilters,
  hideInactiveToggle,
  onRowClick,
  groups,
  collapsibleGroups,
  collapsedGroupIds,
  onToggleGroupCollapse,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  showInactive: boolean;
  onToggleInactive: () => void;
  inactiveToggleLabel?: { show: string; hide: string };
  countLabel: string;
  items: T[];
  loading: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  nameHeader?: string;
  dataColumns: CrmListColumn<T>[];
  renderNameCell: (item: T) => ReactNode;
  getRowActions: (item: T) => RowAction[];
  toolbarActions?: ReactNode;
  bulkBar?: ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  emptyIcon?: ReactNode;
  isRowSelectable?: (item: T) => boolean;
  className?: string;
  toolbarFilters?: ReactNode;
  hideInactiveToggle?: boolean;
  onRowClick?: (item: T) => void;
  groups?: CrmListGroup<T>[];
  collapsibleGroups?: boolean;
  collapsedGroupIds?: Set<string>;
  onToggleGroupCollapse?: (groupId: string) => void;
}) {
  const t = useTranslations("common");
  const settingsSectionList = useSettingsSectionList();
  const resolvedInactiveToggleLabel = inactiveToggleLabel ?? {
    show: t("showInactive"),
    hide: t("hideInactive"),
  };
  const resolvedNameHeader = nameHeader ?? t("name");
  const colSpan = dataColumns.length + 3;

  const selectableItems = useMemo(
    () => (isRowSelectable ? items.filter(isRowSelectable) : items),
    [items, isRowSelectable]
  );

  const allSelected =
    selectableItems.length > 0 && selectableItems.every((item) => selected.has(item.id));
  const someSelected =
    selectableItems.some((item) => selected.has(item.id)) && !allSelected;

  const emptyState = useMemo(
    () => (
      <EmptyState
        size="panel"
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    ),
    [emptyAction, emptyDescription, emptyIcon, emptyTitle]
  );

  const renderDesktopRow = (item: T) => {
    const isSelected = selected.has(item.id);
    const canSelect = isRowSelectable ? isRowSelectable(item) : true;
    return (
      <DataTableRow
        key={item.id}
        className={cn(
          isSelected && "ds-table-row--selected",
          item.active === false && "ds-table-row--inactive",
          onRowClick && "ds-table-row-clickable"
        )}
        onClick={
          onRowClick
            ? (e) => {
                if (isListRowControlTarget(e.target as HTMLElement)) return;
                onRowClick(item);
              }
            : undefined
        }
      >
        <DataTableTd className="ds-table-col--utility" onClick={(e) => e.stopPropagation()}>
          <div className="ds-table-checkbox-wrap">
            {canSelect ? (
              <Checkbox checked={isSelected} onChange={() => onToggleSelect(item.id)} />
            ) : null}
          </div>
        </DataTableTd>
        <DataTableTd className="ds-whatsapp-convo-td ds-table-col--contact ds-table-col--flex">
          {renderNameCell(item)}
        </DataTableTd>
        {dataColumns.map((col) => (
          <DataTableTd key={col.id} className={cn(listTableColClass(col.className), col.className)}>
            {col.render(item)}
          </DataTableTd>
        ))}
        <DataTableTd
          className="ds-row-actions-td ds-table-col--menu"
          onClick={(e) => e.stopPropagation()}
        >
          <RowActionsMenu items={getRowActions(item)} ariaLabel={t("rowActions")} />
        </DataTableTd>
      </DataTableRow>
    );
  };

  const renderMobileCard = (item: T) => {
    const isSelected = selected.has(item.id);
    const canSelect = isRowSelectable ? isRowSelectable(item) : true;
    return (
      <div
        key={item.id}
        className={cn(
          "ds-leads-card",
          onRowClick ? undefined : "ds-leads-card--static",
          isSelected && "ds-leads-card--selected",
          item.active === false && "ds-leads-card--inactive"
        )}
        onClick={
          onRowClick
            ? (e) => {
                if (isListRowControlTarget(e.target as HTMLElement)) return;
                onRowClick(item);
              }
            : undefined
        }
        onKeyDown={
          onRowClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(item);
                }
              }
            : undefined
        }
        role={onRowClick ? "button" : undefined}
        tabIndex={onRowClick ? 0 : undefined}
      >
        <div className="ds-leads-card__top">
          <div
            className="ds-leads-card__row ds-min-w-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {canSelect ? (
              <Checkbox checked={isSelected} onChange={() => onToggleSelect(item.id)} />
            ) : null}
            <div className="ds-min-w-0">{renderNameCell(item)}</div>
          </div>
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <RowActionsMenu items={getRowActions(item)} ariaLabel={t("rowActions")} />
          </div>
        </div>
        <div className="ds-leads-card__bottom ds-crm-list-card__meta">
          {dataColumns.map((col) => (
            <div key={col.id} className="ds-crm-list-card__field">
              <span className="ds-crm-list-card__label">{col.header}</span>
              <div className="ds-crm-list-card__value">{col.render(item)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGroupHeader = (group: CrmListGroup<T>, variant: "desktop" | "mobile") => {
    const collapsed = collapsibleGroups && collapsedGroupIds?.has(group.id);
    const label = (
      <>
        <span className="ds-crm-list-group-header__label">{group.label}</span>
        <span className="ds-crm-list-group-header__count">{group.items.length}</span>
      </>
    );

    if (collapsibleGroups && onToggleGroupCollapse) {
      const toggle = (
        <button
          type="button"
          className="ds-crm-list-group-header__toggle"
          onClick={() => onToggleGroupCollapse(group.id)}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            className={cn(
              "ds-crm-list-group-header__chevron ds-icon-sm",
              !collapsed && "ds-crm-list-group-header__chevron--open"
            )}
            aria-hidden
          />
          {label}
        </button>
      );

      if (variant === "desktop") {
        return (
          <DataTableRow
            key={`group-${group.id}`}
            className={cn("ds-crm-list-group-header", "ds-crm-list-group-header--collapsible")}
          >
            <DataTableTd colSpan={colSpan}>{toggle}</DataTableTd>
          </DataTableRow>
        );
      }

      return (
        <div
          key={`group-${group.id}`}
          className="ds-crm-list-group-header ds-crm-list-group-header--mobile ds-crm-list-group-header--collapsible"
        >
          {toggle}
        </div>
      );
    }

    if (variant === "desktop") {
      return (
        <DataTableRow key={`group-${group.id}`} className="ds-crm-list-group-header">
          <DataTableTd colSpan={colSpan}>{label}</DataTableTd>
        </DataTableRow>
      );
    }

    return (
      <div key={`group-${group.id}`} className="ds-crm-list-group-header ds-crm-list-group-header--mobile">
        {label}
      </div>
    );
  };

  return (
    <div className={cn("ds-leads-table-root", className)}>
      <DataTableCard className="ds-list-shell">
        <DataTableToolbar>
          <DataTableSearch>
            <Search className="ds-data-table-search__icon" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={search ? "ds-input--has-clear" : undefined}
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="ds-data-table-search__clear"
                onClick={() => onSearchChange("")}
                aria-label={t("clearSearch")}
              >
                <X className="ds-icon-2xs" />
              </Button>
            )}
          </DataTableSearch>

          {toolbarFilters}

          {!hideInactiveToggle && (
            <FilterToggle compact active={showInactive} onClick={onToggleInactive}>
              <Archive className="ds-icon-xs" />
              <span className="ds-filter-trigger__label">
                {showInactive ? resolvedInactiveToggleLabel.hide : resolvedInactiveToggleLabel.show}
              </span>
            </FilterToggle>
          )}

          {search && (
            <Button variant="secondary" size="sm" className="ds-toolbar-btn" onClick={() => onSearchChange("")}>
              <X className="ds-icon-2xs" /> {t("clear")}
            </Button>
          )}

          <ListToolbarEnd>
            <ListTableCount
              shown={items.length}
              total={items.length}
              totalLabel={`${items.length} ${countLabel}`}
            />
            {toolbarActions}
          </ListToolbarEnd>
        </DataTableToolbar>

        <div className="ds-leads-table-desktop">
          <DataTableScroll
            className={
              !loading && items.length === 0
                ? "ds-data-table-scroll--list ds-data-table-scroll--empty"
                : cn(
                    "ds-data-table-scroll--list",
                    settingsSectionList && "ds-data-table-scroll--content-sized"
                  )
            }
          >
            <DataTableGrid className="ds-data-table-grid--fixed">
              <colgroup>
                <col className="ds-table-col--utility" />
                <col className="ds-table-col--contact ds-table-col--flex" />
                {dataColumns.map((col) => (
                  <col key={col.id} className={listTableColClass(col.className)} />
                ))}
                <col className="ds-table-col--menu" />
              </colgroup>
              <DataTableHead>
                <DataTableRow>
                  <DataTableTh className="ds-table-col--utility">
                    <div className="ds-table-checkbox-wrap">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={onToggleSelectAll}
                      />
                    </div>
                  </DataTableTh>
                  <DataTableTh className="ds-table-col--contact ds-table-col--flex">
                    {resolvedNameHeader}
                  </DataTableTh>
                  {dataColumns.map((col) => (
                    <DataTableTh key={col.id} className={cn(listTableColClass(col.className), col.className)}>
                      {col.header}
                    </DataTableTh>
                  ))}
                  <DataTableTh className="ds-row-actions-th ds-table-col--menu">
                    <span className="ds-row-actions-th__label">{t("actions")}</span>
                  </DataTableTh>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {loading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <DataTableRow key={`sk-${i}`} className="ds-table-row--skeleton">
                      <DataTableTd colSpan={colSpan} className="ds-table-skeleton-cell">
                        <Skeleton className="ds-table-skeleton-line" />
                      </DataTableTd>
                    </DataTableRow>
                  ))}
                {!loading && items.length === 0 && (
                  <DataTableRow className="ds-table-row--empty">
                    <DataTableTd colSpan={colSpan}>{emptyState}</DataTableTd>
                  </DataTableRow>
                )}
                {!loading &&
                  (groups && groups.length > 0
                    ? groups.map((group) => {
                        const collapsed =
                          collapsibleGroups && collapsedGroupIds?.has(group.id);
                        return (
                          <Fragment key={group.id}>
                            {renderGroupHeader(group, "desktop")}
                            {!collapsed && group.items.map((item) => renderDesktopRow(item))}
                          </Fragment>
                        );
                      })
                    : items.map((item) => renderDesktopRow(item)))}
              </DataTableBody>
            </DataTableGrid>
          </DataTableScroll>
        </div>

        <div className="ds-leads-cards-mobile">
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`sk-card-${i}`} className="ds-leads-card-skeleton" />
            ))}
          {!loading && items.length === 0 && <DataTableEmpty>{emptyState}</DataTableEmpty>}
          {!loading &&
            (groups && groups.length > 0
              ? groups.map((group) => {
                  const collapsed = collapsibleGroups && collapsedGroupIds?.has(group.id);
                  return (
                    <Fragment key={group.id}>
                      {renderGroupHeader(group, "mobile")}
                      {!collapsed && group.items.map((item) => renderMobileCard(item))}
                    </Fragment>
                  );
                })
              : items.map((item) => renderMobileCard(item)))}
        </div>
      </DataTableCard>

      {bulkBar}
    </div>
  );
}
