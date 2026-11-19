import { cookies } from "next/headers";

// A one-line message to show on the next page, for server actions that redirect
// (the page that started them is gone, so it cannot show a toast itself). The
// cookie is short-lived and read by <FlashToast> (components/ui/toast.tsx), which
// clears it. Keep the text short and free of anything private.
export async function setFlash(message: string): Promise<void> {
  (await cookies()).set("flash", message, {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    httpOnly: false, // the browser reads it
  });
}
