"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Upload } from "@/lib/icons";
import { formatDashboardDate, getTimeGreetingKey } from "@/lib/i18n/greeting";
import type { Locale } from "@/i18n/config";
import { Button } from "./Button";
import { Text } from "./Text";

interface Props {
  firstName: string;
  isAdmin?: boolean;
  onNewLead?: () => void;
  onImport?: () => void;
}

export function DashboardHero({ firstName, isAdmin, onNewLead, onImport }: Props) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as Locale;
  const [now] = useState(() => new Date());
  const greeting = t(`greeting.${getTimeGreetingKey(now)}`);
  const dateLabel = formatDashboardDate(now, locale);
  const displayName = firstName.trim();

  return (
    <header className="ds-dashboard-hero">
      <div className="ds-dashboard-hero__intro">
        <Text variant="secondary" className="ds-dashboard-hero__date">
          {dateLabel}
        </Text>
        <Text variant="strong" className="ds-dashboard-hero__greeting">
          {displayName ? `${greeting}, ${displayName}` : greeting}
        </Text>
      </div>

      {isAdmin && (
        <div className="ds-dashboard-hero__actions">
          <Button className="ds-dashboard-hero__import" variant="secondary" size="sm" onClick={onImport}>
            <Upload className="ds-icon-xs" />
            <span className="ds-dashboard-hero__action-label">{t("importCsv")}</span>
          </Button>
          <Button
            className="ds-dashboard-hero__new-lead"
            variant="brand"
            size="sm"
            onClick={onNewLead}
            aria-label={t("newLead")}
          >
            <Plus className="ds-icon-xs" />
            <span className="ds-dashboard-hero__action-label">{t("newLead")}</span>
          </Button>
        </div>
      )}
    </header>
  );
}
