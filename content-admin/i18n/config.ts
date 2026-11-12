export const locales = ["en", "sv"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
/** Hosted public forms (/f/*) and embeds default to Swedish for Tandfokus. */
export const publicFormDefaultLocale: Locale = "sv";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "sv";
}

export function localeToIntlTag(locale: Locale): string {
  return locale === "sv" ? "sv-SE" : "en-GB";
}
