import { NextRequest, NextResponse } from "next/server"
import { verifyPortalToken } from "@/lib/verify-portal-token"

const PORTAL_LOGIN_URL = "https://portal.quantifi.tools/login"

export async function middleware(req: NextRequest) {
  // Skip auth for health/status checks
  if (req.nextUrl.pathname === "/api/health") {
    return NextResponse.next()
  }

  const token = req.cookies.get("quantifi-portal-token")?.value
  if (!token) {
    return redirect(req)
  }

  try {
    const user = await verifyPortalToken(token)
    const response = NextResponse.next()
    response.headers.set("x-user-email", user.email)
    response.headers.set("x-user-name", user.name)
    return response
  } catch {
    return redirect(req)
  }
}

function redirect(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith("/api/")
  if (isApi) {
    return NextResponse.json(
      { error: "Unauthorized", redirect: PORTAL_LOGIN_URL },
      { status: 401 },
    )
  }
  return NextResponse.redirect(PORTAL_LOGIN_URL)
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
