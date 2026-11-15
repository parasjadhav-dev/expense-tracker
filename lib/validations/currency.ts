import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/currency";

// Only a currency from our own list is accepted, whatever the browser sends.
export const currencySchema = z.object({
  currency: z.enum(CURRENCY_CODES, { error: "Choose a currency from the list." }),
});
