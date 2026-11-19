import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FieldError, errorId, fieldA11y } from "@/components/ui/field-error";

describe("fieldA11y", () => {
  it("marks nothing when there is no error", () => {
    expect(fieldA11y("amount", undefined)).toEqual({
      "aria-invalid": undefined,
      "aria-describedby": undefined,
    });
    expect(fieldA11y("amount", [])["aria-invalid"]).toBeUndefined();
    expect(fieldA11y("amount", "")["aria-invalid"]).toBeUndefined();
  });

  it("marks the field invalid and points it at its message", () => {
    expect(fieldA11y("amount", ["Enter an amount."])).toEqual({
      "aria-invalid": true,
      "aria-describedby": "amount-error",
    });
    // A single string works too (the per-category budget rows use one).
    expect(fieldA11y("row-1", "Too big")["aria-describedby"]).toBe("row-1-error");
  });

  it("keeps an existing hint in the description, before the error", () => {
    expect(fieldA11y("day", ["Pick 1 to 31."], "day-hint")["aria-describedby"]).toBe(
      "day-hint day-error",
    );
    expect(fieldA11y("day", undefined, "day-hint")["aria-describedby"]).toBe("day-hint");
  });
});

describe("FieldError", () => {
  it("renders the first message with the id the field points at", () => {
    const html = renderToStaticMarkup(
      createElement(FieldError, { id: "amount", errors: ["Enter an amount.", "Second"] }),
    );
    expect(html).toContain(`id="${errorId("amount")}"`);
    expect(html).toContain("Enter an amount.");
    expect(html).not.toContain("Second");
  });

  it("renders nothing without an error", () => {
    expect(renderToStaticMarkup(createElement(FieldError, { id: "x", errors: undefined }))).toBe("");
    expect(renderToStaticMarkup(createElement(FieldError, { id: "x", errors: [] }))).toBe("");
  });
});
