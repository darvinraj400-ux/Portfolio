import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDocument =
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.includes(".");
  const isChunk =
    pathname.startsWith("/_next/static/chunks/") && pathname.endsWith(".js");

  if (isDocument || isChunk) {
    console.log(
      `[stage93-access] ${JSON.stringify({
        t: new Date().toISOString(),
        path: pathname,
        ua: request.headers.get("user-agent"),
        ref: request.headers.get("referer"),
        host: request.headers.get("host"),
      })}`,
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/image|_next/static/media|favicon.ico).*)"],
};