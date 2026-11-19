import {
  Baby,
  Briefcase,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
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
  type LucideIcon,
} from "lucide-react";

// A colour and an icon for every category, worked out from its name so nothing
// is stored: the nine default categories each have their own, and a custom one
// gets an icon from a keyword in its name (gym, fuel, gift...) and a colour
// picked from its name, the same every time.
//
// The colours are CSS variables (--cat-0 to --cat-11 in globals.css), one set per
// theme. Colour is never the only signal: the name is always written next to it.

export const CATEGORY_COLOR_COUNT = 12;
const OTHER_COLOR = 9; // slate: also used for "Other" and the chart's "All other"

const KNOWN: Record<string, { color: number; icon: LucideIcon }> = {
  food: { color: 0, icon: Utensils },
  travel: { color: 1, icon: Plane },
  rent: { color: 2, icon: House },
  shopping: { color: 3, icon: ShoppingBag },
  subscriptions: { color: 4, icon: Tv },
  bills: { color: 5, icon: Receipt },
  health: { color: 6, icon: HeartPulse },
  entertainment: { color: 7, icon: Clapperboard },
  other: { color: OTHER_COLOR, icon: Tag },
};

// First match wins. Matched against the lowercase words of a custom name.
const ICON_KEYWORDS: { icon: LucideIcon; words: string[] }[] = [
  { icon: ShoppingCart, words: ["grocery", "groceries", "supermarket"] },
  { icon: Coffee, words: ["coffee", "cafe", "tea", "snacks"] },
  { icon: Utensils, words: ["dining", "restaurant", "lunch", "dinner", "meal", "meals"] },
  { icon: Fuel, words: ["fuel", "petrol", "diesel", "gas"] },
  { icon: Car, words: ["car", "bike", "taxi", "cab", "transport", "commute", "vehicle"] },
  { icon: Plane, words: ["flight", "flights", "trip", "holiday", "vacation"] },
  { icon: Dumbbell, words: ["gym", "fitness", "sport", "sports", "yoga"] },
  { icon: GraduationCap, words: ["education", "school", "college", "course", "courses", "books", "tuition", "study"] },
  { icon: Gift, words: ["gift", "gifts", "donation", "charity", "wedding"] },
  { icon: PawPrint, words: ["pet", "pets", "dog", "cat", "vet"] },
  { icon: Smartphone, words: ["phone", "mobile", "recharge"] },
  { icon: Wifi, words: ["internet", "wifi", "broadband"] },
  { icon: Shirt, words: ["clothes", "clothing", "fashion", "apparel"] },
  { icon: ShieldCheck, words: ["insurance", "tax", "taxes", "investment", "investments", "savings"] },
  { icon: Baby, words: ["kids", "baby", "child", "children"] },
  { icon: Wrench, words: ["repair", "repairs", "maintenance", "home", "household"] },
  { icon: Briefcase, words: ["work", "office", "business"] },
  { icon: HeartPulse, words: ["medical", "doctor", "pharmacy", "medicine", "dental"] },
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

export type CategoryStyle = {
  colorIndex: number;
  icon: LucideIcon;
  // A CSS colour value for text, icons and chart fills.
  color: string;
  // A soft tint of the same colour, for the badge background.
  tint: string;
};

export function colorVar(index: number): string {
  return `var(--cat-${index})`;
}

export function getCategoryStyle(name: string): CategoryStyle {
  const key = name.trim().toLowerCase();
  const known = KNOWN[key];
  let colorIndex: number;
  let icon: LucideIcon;

  if (known) {
    ({ color: colorIndex, icon } = known);
  } else {
    const words = key.split(/[^a-z0-9]+/).filter(Boolean);
    icon =
      ICON_KEYWORDS.find((rule) => rule.words.some((word) => words.includes(word)))
        ?.icon ?? Tag;
    colorIndex = CUSTOM_COLORS[hash(key) % CUSTOM_COLORS.length];
  }

  const color = colorVar(colorIndex);
  return {
    colorIndex,
    icon,
    color,
    tint: `color-mix(in srgb, ${color} 14%, transparent)`,
  };
}

// The grey used for the chart's folded "All other" bar.
export const OTHER_CHART_COLOR = colorVar(OTHER_COLOR);
