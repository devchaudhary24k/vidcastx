import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authRoutes, protectedRoutes } from "@/constants/route";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const path = request.nextUrl.pathname;
  const isAuthRoute = authRoutes.includes(path);
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );

  if (isProtectedRoute) {
    if (!sessionCookie) {
      const callbackUrl = encodeURIComponent(path);
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.nextUrl),
      );
    }

    // If protectedRoute and user is authenticated, give access.
    return NextResponse.next();
  }

  if (isAuthRoute) {
    // If authRoute and user is authenticated, redirect user to dashboard.
    if (sessionCookie) {
      return NextResponse.redirect(
        new URL(DEFAULT_LOGIN_REDIRECT, request.nextUrl),
      );
    }

    // If authRoute and user is not authenticated, allow access.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
