import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get("role")?.value;

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/dashboard") && role !== "client") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
