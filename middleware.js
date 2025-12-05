// import { NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";

// const ADMIN_ONLY = "/admin";
// const CHECKER_ONLY = "/checker";

// export async function middleware(req) {
//   const { pathname } = req.nextUrl;

//   const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

//   // ADMIN AREA
//   if (pathname.startsWith(ADMIN_ONLY)) {
//     if (!token || token.role !== "admin") {
//       const url = req.nextUrl.clone();
//       url.pathname = "/admin/signin";
//       url.search = `?from=${pathname}`;
//       return NextResponse.redirect(url);
//     }
//   }

//   // CHECKER AREA
//   if (pathname.startsWith(CHECKER_ONLY)) {
//     if (!token || token.role !== "checker") {
//       const url = req.nextUrl.clone();
//       url.pathname = "/checker/signin";
//       url.search = `?from=${pathname}`;
//       return NextResponse.redirect(url);
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/admin/:path*", "/checker/:path*"],
// };

// middleware.js (project root)
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PREFIX = "/admin";
const CHECKER_PREFIX = "/checker";

// Public pages that should be reachable without auth
const PUBLIC_ADMIN = ["/admin/signin", "/admin/signout"];
const PUBLIC_CHECKER = ["/checker/signin", "/checker/request"];

export default async function middleware(req) {
  try {
    const url = req.nextUrl.clone();
    const { pathname } = req.nextUrl;

    // allow next internals and auth endpoints
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname === "/favicon.ico" ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/public")
    ) {
      return NextResponse.next();
    }

    // ADMIN area
    if (pathname.startsWith(ADMIN_PREFIX)) {
      // allow public admin pages
      if (PUBLIC_ADMIN.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next();
      }

      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      // debug: remove these logs after fixing
      console.log("[middleware] admin path:", pathname, " token:", token && { role: token.role, sub: token.sub });

      if (!token || token.role !== "admin") {
        const dest = req.nextUrl.clone();
        dest.pathname = "/admin/signin";
        dest.search = `?from=${encodeURIComponent(req.nextUrl.pathname)}`;
        return NextResponse.redirect(dest);
      }
      return NextResponse.next();
    }

    // CHECKER area
    if (pathname.startsWith(CHECKER_PREFIX)) {
      if (PUBLIC_CHECKER.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next();
      }
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      console.log("[middleware] checker path:", pathname, " token:", token && { role: token.role, sub: token.sub });

      if (!token || token.role !== "checker" || !token.sub) {
        const dest = req.nextUrl.clone();
        dest.pathname = "/checker/signin";
        dest.search = `?from=${encodeURIComponent(req.nextUrl.pathname)}`;
        return NextResponse.redirect(dest);
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware unexpected error:", err);
    // fail closed -> redirect to signin
    const fallback = req.nextUrl.clone();
    fallback.pathname = "/admin/signin";
    return NextResponse.redirect(fallback);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/checker/:path*", "/api/checker/:path*"],
};
