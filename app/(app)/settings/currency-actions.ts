"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SAVE_FAILED_MESSAGE, logActionError } from "@/lib/action-errors";
import { CURRENCY_INFO } from "@/lib/currency";
import { formatPaise } from "@/lib/money";
import { currencySchema } from "@/lib/validations/currency";

export type CurrencyState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updateCurrency(
  _prevState: CurrencyState,
  formData: FormData,
): Promise<CurrencyState> {
  // Checked here, not only in proxy.ts: server actions are POST requests that
  // proxy matchers can miss.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { status: "error", message: "Your session has ended. Please log in again." };

  const parsed = currencySchema.safeParse({ currency: formData.get("currency") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const { currency } = parsed.data;

  try {
    await db.user.update({ where: { id: userId }, data: { currency } });
  } catch (error) {
    logActionError("updateCurrency", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE };
  }

  // Every page shows money, so every page has to be drawn again.
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: `Currency set to ${CURRENCY_INFO[currency].name}. Amounts now look like ${formatPaise(123456, currency)}. Existing amounts were not converted.`,
  };
}
