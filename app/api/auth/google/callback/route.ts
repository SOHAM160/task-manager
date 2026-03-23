import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionResponse, hashPassword } from "@/lib/auth";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", req.url));
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      console.error("[GOOGLE_AUTH] Token Exchange Failed:", tokens);
      return NextResponse.redirect(new URL("/?error=auth_failed", req.url));
    }

    // 2. Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userRes.json();
    
    const email = profile.email?.toLowerCase();
    if (!email) {
      return NextResponse.redirect(new URL("/?error=no_email", req.url));
    }

    // 3. RESTRICTION: Only @gmail.com
    if (!email.endsWith("@gmail.com")) {
      return NextResponse.redirect(new URL("/?error=gmail_only", req.url));
    }

    // 4. Find or Create User
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Generate a random high-entropy ghost password since it's OAuth
      const dummyPassword = await hashPassword(Math.random().toString(36).slice(-10));
      user = await prisma.user.create({
        data: {
          email,
          password: dummyPassword,
        },
      });
    }

    // 5. Create Session (manually to handle redirect)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days for OAuth

    const session = await prisma.session.create({
      data: { userId: user.id, expiresAt },
    });

    const res = NextResponse.redirect(new URL(`/?sessionId=${session.id}`, req.url));

    res.cookies.set("sessionId", session.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return res;

  } catch (error) {
    console.error("[GOOGLE_CALLBACK_ERROR]", error);
    return NextResponse.redirect(new URL("/?error=server_error", req.url));
  }
}
