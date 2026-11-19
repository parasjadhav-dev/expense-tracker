import {
  Baby,
  BookOpen,
  Briefcase,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Music,
  PawPrint,
  Plane,
  Receipt,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tag,
  Tv,
  Utensils,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// A colour and an icon for every category. The user can choose both (saved on the
// category). A category with nothing saved falls back to a look worked out from
// its name: the nine default categories each have their own, and a custom one
// gets an icon from a keyword in its name (gym, fuel, gift...) and a colour
// picked from its name, the same every time.
//
// Colours are CSS variables (--cat-0 to --cat-11 in globals.css), one set per
// theme. Colour is never the only signal: the name is always written next to it.

export const CATEGORY_COLOR_COUNT = 12;
const OTHER_COLOR = 9; // slate: also used for "Other" and the chart's "All other"

// What the picker offers, in order. The key is what is saved in the database.
export const CATEGORY_ICONS = {
  utensils: Utensils,
  coffee: Coffee,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  shirt: Shirt,
  car: Car,
  fuel: Fuel,
  plane: Plane,
  house: House,
  receipt: Receipt,
  zap: Zap,
  wifi: Wifi,
  smartphone: Smartphone,
  tv: Tv,
  clapperboard: Clapperboard,
  "gamepad-2": Gamepad2,
  music: Music,
  "heart-pulse": HeartPulse,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  gift: Gift,
  "paw-print": PawPrint,
  baby: Baby,
  wrench: Wrench,
  briefcase: Briefcase,
  "shield-check": ShieldCheck,
  tag: Tag,
} as const satisfies Record<string, LucideIcon>;

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;
export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS) as CategoryIconKey[];

export function isCategoryIconKey(value: string): value is CategoryIconKey {
  return Object.hasOwn(CATEGORY_ICONS, value);
}

// For the picker's labels and screen readers.
export const CATEGORY_COLOR_NAMES = [
  "Orange", "Sky", "Violet", "Pink", "Indigo", "Amber",
  "Rose", "Fuchsia", "Lime", "Slate", "Cyan", "Blue",
] as const;

const KNOWN: Record<string, { color: number; icon: CategoryIconKey }> = {
  food: { color: 0, icon: "utensils" },
  travel: { color: 1, icon: "plane" },
  rent: { color: 2, icon: "house" },
  shopping: { color: 3, icon: "shopping-bag" },
  subscriptions: { color: 4, icon: "tv" },
  bills: { color: 5, icon: "receipt" },
  health: { color: 6, icon: "heart-pulse" },
  entertainment: { color: 7, icon: "clapperboard" },
  other: { color: OTHER_COLOR, icon: "tag" },
};

// First match wins. Matched against the lowercase words of a custom name.
const ICON_KEYWORDS: { icon: CategoryIconKey; words: string[] }[] = [
  { icon: "shopping-cart", words: ["grocery", "groceries", "supermarket"] },
  { icon: "coffee", words: ["coffee", "cafe", "tea", "snacks"] },
  { icon: "utensils", words: ["dining", "restaurant", "lunch", "dinner", "meal", "meals"] },
  { icon: "fuel", words: ["fuel", "petrol", "diesel", "gas"] },
  { icon: "car", words: ["car", "bike", "taxi", "cab", "transport", "commute", "vehicle"] },
  { icon: "plane", words: ["flight", "flights", "trip", "holiday", "vacation"] },
  { icon: "dumbbell", words: ["gym", "fitness", "sport", "sports", "yoga"] },
  { icon: "graduation-cap", words: ["education", "school", "college", "course", "courses", "tuition", "study"] },
  { icon: "book-open", words: ["books", "reading"] },
  { icon: "gift", words: ["gift", "gifts", "donation", "charity", "wedding"] },
  { icon: "paw-print", words: ["pet", "pets", "dog", "cat", "vet"] },
  { icon: "smartphone", words: ["phone", "mobile", "recharge"] },
  { icon: "wifi", words: ["internet", "wifi", "broadband"] },
  { icon: "shirt", words: ["clothes", "clothing", "fashion", "apparel"] },
  { icon: "shield-check", words: ["insurance", "tax", "taxes", "investment", "investments", "savings"] },
  { icon: "baby", words: ["kids", "baby", "child", "children"] },
  { icon: "wrench", words: ["repair", "repairs", "maintenance", "home", "household"] },
  { icon: "briefcase", words: ["work", "office", "business"] },
  { icon: "heart-pulse", words: ["medical", "doctor", "pharmacy", "medicine", "dental"] },
  { icon: "music", words: ["music", "concert"] },
  { icon: "gamepad-2", words: ["games", "gaming"] },
];

// Colours a custom category can take: everything except slate, which is "Other".
const CUSTOM_COLORS = [8, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7];

function hash(text: string): number {
  let value = 5381;
  for (let i = 0; i < text.length; i += 1) {
    value = ((value << 5) + value + text.charCodeAt(i)) >>> 0;
  }
  return value;
}

// What is saved on a category. Null: not chosen, so work it out from the name.
export type CategoryLook = { color: number | null; icon: string | null };

// Each user's saved looks, keyed by lowercase category name (names are unique
// ignoring case). Plain data, so it can go to client components.
export type CategoryLooks = Record<string, CategoryLook>;

export function looksByName(
  categories: readonly { name: string; color: number | null; icon: string | null }[],
): CategoryLooks {
  return Object.fromEntries(
    categories.map(({ name, color, icon }) => [name.trim().toLowerCase(), { color, icon }]),
  );
}

function validColor(value: number | null | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < CATEGORY_COLOR_COUNT
  );
}

// The colour index and icon key a category shows: what was saved, else derived.
export function resolveLook(
  name: string,
  saved?: CategoryLook,
): { color: number; icon: CategoryIconKey } {
  const key = name.trim().toLowerCase();
  const known = KNOWN[key];
  const words = key.split(/[^a-z0-9]+/).filter(Boolean);

  const derivedColor = known
    ? known.color
    : CUSTOM_COLORS[hash(key) % CUSTOM_COLORS.length];
  const derivedIcon: CategoryIconKey = known
    ? known.icon
    : (ICON_KEYWORDS.find((rule) => rule.words.some((word) => words.includes(word)))?.icon ??
      "tag");

  return {
    color: validColor(saved?.color) ? saved.color : derivedColor,
    icon: saved?.icon && isCategoryIconKey(saved.icon) ? saved.icon : derivedIcon,
  };
}

// The colour for a new category: the first of the palette no existing category
// uses, so two do not look alike; once every colour is taken, the least used.
export function pickColorForNew(usedColors: readonly number[]): number {
  const counts = new Map<number, number>();
  for (const color of usedColors) counts.set(color, (counts.get(color) ?? 0) + 1);
  const order = [...CUSTOM_COLORS, OTHER_COLOR];
  return order.reduce((best, color) =>
    (counts.get(color) ?? 0) < (counts.get(best) ?? 0) ? color : best,
  );
}

export type CategoryStyle = {
  colorIndex: number;
  iconKey: CategoryIconKey;
  icon: LucideIcon;
  // A CSS colour value for text, icons and chart fills.
  color: string;
  // A soft tint of the same colour, for the badge background.
  tint: string;
};

export function colorVar(index: number): string {
  return `var(--cat-${index})`;
}

export function tintOf(color: string): string {
  return `color-mix(in srgb, ${color} 14%, transparent)`;
}

export function getCategoryStyle(name: string, looks?: CategoryLooks): CategoryStyle {
  const { color: colorIndex, icon: iconKey } = resolveLook(
    name,
    looks?.[name.trim().toLowerCase()],
  );
  const color = colorVar(colorIndex);
  return {
    colorIndex,
    iconKey,
    icon: CATEGORY_ICONS[iconKey],
    color,
    tint: tintOf(color),
  };
}

// The grey used for the chart's folded "All other" bar.
export const OTHER_CHART_COLOR = colorVar(OTHER_COLOR);
