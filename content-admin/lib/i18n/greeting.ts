import { localeToIntlTag, type Locale } from "@/i18n/config";

export function getTimeGreetingKey(date = new Date()): "morning" | "afternoon" | "evening" {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function formatDashboardDate(date = new Date(), locale: Locale): string {
  return date.toLocaleDateString(localeToIntlTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
