export type AgentGender = "male" | "female";

const BG_CLASSES = [
  "ds-avatar-bg-0",
  "ds-avatar-bg-1",
  "ds-avatar-bg-2",
  "ds-avatar-bg-3",
  "ds-avatar-bg-4",
  "ds-avatar-bg-5",
];

const BG_HEX = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "b5ead7"];

export function pickBgClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BG_CLASSES[Math.abs(hash) % BG_CLASSES.length];
}

export function pickBgHex(name: string): string {
  const bgClass = pickBgClass(name);
  const idx = parseInt(bgClass.replace("ds-avatar-bg-", ""), 10);
  return BG_HEX[idx] ?? BG_HEX[0];
}

export function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function avatarSeed(name: string, salt: string): string {
  return `${(name || "user").trim()}|${salt}`;
}

const ANIMATION_VARIANTS = ["slow", "medium", "fast", "slowest", "fastest"] as const;

export function pickAnimationVariant(key: string): (typeof ANIMATION_VARIANTS)[number] {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return ANIMATION_VARIANTS[Math.abs(hash) % ANIMATION_VARIANTS.length];
}

export function dicebearStyle(_gender?: AgentGender | null): string {
  return "clay";
}

export function dicebearUrl(name: string, salt: string, gender?: AgentGender | null): string {
  const seedKey = avatarSeed(name, salt);
  return dicebearUrlWithSeed(seedKey, gender);
}

export function dicebearUrlWithSeed(seedKey: string, gender?: AgentGender | null): string {
  const seed = encodeURIComponent(seedKey);
  const bg = pickBgHex(seedKey);
  const style = dicebearStyle(gender);
  const animation = pickAnimationVariant(seedKey);
  return `https://api.dicebear.com/10.x/${style}/svg?seed=${seed}&backgroundColor=${bg}&animationVariant=${animation}`;
}
