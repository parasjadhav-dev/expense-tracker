"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  CATEGORY_COLOR_NAMES,
  CATEGORY_ICONS,
  CATEGORY_ICON_KEYS,
  colorVar,
  tintOf,
} from "@/lib/category-style";

// Colour and icon choosers for a category. They post as two hidden fields,
// "color" (a palette index) and "icon" (an icon key); an empty value means
// "not chosen". With `optional` a second tap on the chosen one clears it, which
// leaves the choice to the app (a colour nobody uses, an icon from the name).
export function CategoryLookPicker({
  idPrefix,
  initialColor,
  initialIcon,
  optional = false,
}: {
  idPrefix: string;
  initialColor: number | null;
  initialIcon: string | null;
  optional?: boolean;
}) {
  const [color, setColor] = useState<number | null>(initialColor);
  const [icon, setIcon] = useState<string | null>(initialIcon);

  const pickColor = (index: number) =>
    setColor(optional && color === index ? null : index);
  const pickIcon = (key: string) => setIcon(optional && icon === key ? null : key);

  const tile =
    "grid size-11 place-items-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/60 lg:size-9";

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="color" value={color ?? ""} />
      <input type="hidden" name="icon" value={icon ?? ""} />

      <fieldset>
        <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Colour
          {optional && color === null ? (
            <span className="font-normal text-zinc-500 dark:text-zinc-400"> (automatic)</span>
          ) : null}
        </legend>
        <div className="mt-1.5 flex flex-wrap gap-2" data-testid={`${idPrefix}-colors`}>
          {CATEGORY_COLOR_NAMES.map((colorName, index) => {
            const selected = color === index;
            return (
              <button
                key={colorName}
                type="button"
                aria-pressed={selected}
                aria-label={colorName}
                title={colorName}
                onClick={() => pickColor(index)}
                className={`${tile} ${
                  selected
                    ? "border-transparent ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
                    : "border-transparent hover:scale-105"
                }`}
                style={{
                  background: colorVar(index),
                  // The ring takes the swatch's own colour.
                  ...(selected ? ({ "--tw-ring-color": colorVar(index) } as React.CSSProperties) : {}),
                }}
              >
                {selected ? <Check className="size-4 text-white dark:text-zinc-950" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Icon
          {optional && icon === null ? (
            <span className="font-normal text-zinc-500 dark:text-zinc-400"> (automatic)</span>
          ) : null}
        </legend>
        <div className="mt-1.5 flex flex-wrap gap-2" data-testid={`${idPrefix}-icons`}>
          {CATEGORY_ICON_KEYS.map((key) => {
            const Icon = CATEGORY_ICONS[key];
            const selected = icon === key;
            const accent = color === null ? "var(--cat-9)" : colorVar(color);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                aria-label={key.replace(/-\d$/, "").replace(/-/g, " ")}
                title={key.replace(/-\d$/, "").replace(/-/g, " ")}
                onClick={() => pickIcon(key)}
                className={`${tile} ${
                  selected
                    ? "border-current"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
                style={selected ? { color: accent, background: tintOf(accent) } : undefined}
              >
                <Icon className="size-[18px]" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
