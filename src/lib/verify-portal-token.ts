import { jwtVerify } from "jose"

const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET!

export interface PortalUser {
  name: string
  email: string
}

export async function verifyPortalToken(token: string): Promise<PortalUser> {
  const secret = new TextEncoder().encode(PORTAL_JWT_SECRET)
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"], issuer: "quantifi-portal" })
  return { name: (payload.name as string) || "", email: payload.email as string }
}
