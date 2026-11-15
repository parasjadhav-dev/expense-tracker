import { cache } from "react";
import { db } from "@/lib/db";
import { toCurrencyCode, type CurrencyCode } from "@/lib/currency";

// The signed-in user's display currency. Cached for the length of one request,
// so a page and its components can all ask without extra queries.
export const getUserCurrency = cache(async (userId: string): Promise<CurrencyCode> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { currency: true },
  });
  return toCurrencyCode(user?.currency);
});
