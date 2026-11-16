import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

const publicDir = path.join(process.cwd(), "public");
const m = manifest();

// PNG files start with an 8-byte signature, then the width and height as two
// 4-byte big-endian numbers inside the first chunk.
function pngSize(file: string): { width: number; height: number } {
  const data = readFileSync(file);
  expect(data.subarray(0, 8).toString("hex"), `${file} is a PNG`).toBe("89504e470d0a1a0a");
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

describe("web app manifest", () => {
  it("names the app and opens it full screen", () => {
    expect(m.name).toBe("Expense Tracker");
    expect(m.short_name).toBeTruthy();
    expect(m.short_name!.length).toBeLessThanOrEqual(12); // what fits under a home-screen icon
    expect(m.display).toBe("standalone");
  });

  it("starts inside its own scope", () => {
    expect(m.scope).toBe("/");
    expect(m.start_url).toBe("/dashboard");
    expect(m.start_url!.startsWith(m.scope!)).toBe(true);
    expect(m.id).toBeTruthy();
  });

  it("uses real colours", () => {
    expect(m.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(m.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("has icons that exist and are exactly the size they claim", () => {
    expect(m.icons!.length).toBeGreaterThanOrEqual(3);
    for (const icon of m.icons!) {
      const file = path.join(publicDir, icon.src);
      expect(existsSync(file), icon.src).toBe(true);
      const { width, height } = pngSize(file);
      expect(`${width}x${height}`, icon.src).toBe(icon.sizes);
      expect(icon.type).toBe("image/png");
    }
  });

  it("offers the sizes installs need: 192, 512 and a maskable 512", () => {
    const has = (sizes: string, purpose: string) =>
      m.icons!.some((icon) => icon.sizes === sizes && icon.purpose === purpose);
    expect(has("192x192", "any")).toBe(true);
    expect(has("512x512", "any")).toBe(true);
    expect(has("512x512", "maskable")).toBe(true);
  });

  it("has shortcuts that point inside the app and use real icons", () => {
    expect(m.shortcuts!.length).toBeGreaterThan(0);
    for (const shortcut of m.shortcuts!) {
      expect(shortcut.url.startsWith("/"), shortcut.name).toBe(true);
      for (const icon of shortcut.icons ?? []) {
        expect(existsSync(path.join(publicDir, icon.src)), icon.src).toBe(true);
      }
    }
  });
});

describe("home-screen and browser icons", () => {
  it("has a 180x180 icon for iPhones", () => {
    expect(pngSize(path.join(publicDir, "icons/apple-touch-icon.png"))).toEqual({ width: 180, height: 180 });
  });

  it("has a favicon with 16, 32 and 48 pixel images", () => {
    const ico = readFileSync(path.join(process.cwd(), "app/favicon.ico"));
    expect(ico.readUInt16LE(0)).toBe(0); // reserved
    expect(ico.readUInt16LE(2)).toBe(1); // type: icon
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico.readUInt8(6 + i * 16)).sort((a, b) => a - b);
    expect(sizes).toEqual([16, 32, 48]);
  });
});

describe("service worker", () => {
  const sw = readFileSync(path.join(publicDir, "sw.js"), "utf8");

  it("only ever stores the offline page, never anything a user sees", () => {
    // Pages show a person's own money. If someone adds caching to the worker,
    // this test makes them stop and think about it.
    expect(sw).not.toMatch(/cache\.put|\.addAll|cache\.add\((?!OFFLINE_URL)/);
    expect(sw).toContain("cache.add(OFFLINE_URL)");
  });

  it("only handles page loads, and only GET", () => {
    expect(sw).toMatch(/request\.mode !== "navigate"/);
    expect(sw).toMatch(/request\.method !== "GET"/);
  });

  it("falls back to a page that exists", () => {
    expect(sw).toContain('"/offline.html"');
    expect(existsSync(path.join(publicDir, "offline.html"))).toBe(true);
  });
});

describe("offline page", () => {
  const html = readFileSync(path.join(publicDir, "offline.html"), "utf8");

  it("is self-contained, because it is shown when there is no network", () => {
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toMatch(/<script[^>]+\bsrc=/i);
    expect(html).not.toMatch(/<img\b/i);
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toMatch(/url\(/i);
  });

  it("says it is offline and offers a retry", () => {
    expect(html).toMatch(/You are offline/);
    expect(html).toMatch(/location\.reload\(\)/);
  });
});
