"use client";

import type { InputHTMLAttributes } from "react";

// A month field that applies itself on a phone. There the "Show" button is
// hidden to leave the field room to read, so choosing a month in the picker goes
// straight to that month. Where "Show" is visible nothing changes: typing a month
// by keyboard must not jump pages half-way through.
export function MonthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      onChange={(event) => {
        const field = event.currentTarget;
        const show = field.form?.querySelector<HTMLElement>("[data-show-month]");
        const showHidden = show !== null && show !== undefined && show.offsetParent === null;
        if (field.form && showHidden && field.value && field.validity.valid) {
          field.form.requestSubmit();
        }
      }}
    />
  );
}
