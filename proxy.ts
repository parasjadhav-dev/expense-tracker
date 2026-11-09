import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/redirect";

const AUTH_PAGES = ["/login", "/sign-up"];

// Optimistic checks, run before a route renders:
// - logged-out visitors to protected routes go to the login page
// - logged-in users who open the login or sign-up page are sent on to the app
// Every protected page also checks the session itself, because proxy alone is
// not a complete authorization check.
export default auth((request) => {
  const { pathname, origin, searchParams } = request.nextUrl;

  if (AUTH_PAGES.includes(pathname)) {
    if (!request.auth) return NextResponse.next();
    const target = safeCallbackUrl(searchParams.get("callbackUrl"));
    return NextResponse.redirect(
      new URL(target === "/" ? "/dashboard" : target, origin),
    );
  }

  if (request.auth) return NextResponse.next();

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set(
    "callbackUrl",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/dashboard/:path*", "/expenses/:path*", "/login", "/sign-up"],
};
