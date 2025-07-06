import { auth } from "@/lib/auth";

export default auth

// export default auth((req) => {
//   const isLoggedIn = !!req.auth;
//   const { nextUrl } = req;
  
//   // Protect all routes except auth routes
//   if (!isLoggedIn && !nextUrl.pathname.startsWith("/api/auth")) {
//     return Response.redirect(new URL("/api/auth/signin", nextUrl));
//   }
// });

// export const config = {
//   matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
// };
