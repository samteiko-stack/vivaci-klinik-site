import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function isValidPhone(phone: string): boolean {
  return E164_REGEX.test(phone);
}

/** Normalize user-entered phone to E.164 (Swedish-local formats accepted). */
export function normalizePhone(phone: string): string {
  return normalizeDialNumber(phone);
}

/** Normalize a stored lead phone for outbound dialing (E.164). */
export function normalizeDialNumber(phone: string): string {
  let normalized = phone.trim().replace(/[\s()-]/g, "");
  if (normalized.startsWith("00")) normalized = `+${normalized.slice(2)}`;
  if (normalized.startsWith("0") && !normalized.startsWith("+")) {
    normalized = `+46${normalized.slice(1)}`;
  }
  if (!normalized.startsWith("+")) normalized = `+${normalized}`;
  return normalized;
}

/** Strip JID suffixes (@domain) and normalize to E.164 for storage/matching. */
export function normalizeStoredPhone(phone: string): string {
  const stripped = phone.trim().replace(/@.+$/i, "");
  return normalizeDialNumber(stripped);
}

/** Digits-only key for matching the same number across formats (070… vs +4670…). */
export function phoneDigitsKey(phone: string): string {
  return normalizeStoredPhone(phone).replace(/\D/g, "");
}

type LeadScopeFields = {
  qualified?: boolean;
};

/** Lead belongs in the main Leads list (sales pipeline). */
export function isPipelineLead(lead: LeadScopeFields): boolean {
  return lead.qualified !== false;
}

/** Parse fetch JSON without throwing on empty or invalid bodies. */
export async function readResponseJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

/** CRM currency display (whole SEK by default). */
export function formatMoney(amount: number | null | undefined, currency = "SEK"): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
