import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { logDebug } from "@/lib/debug";

const SESSION_COOKIE = "sessionId";
const SESSION_TTL_HOURS = 24;
const REMEMBER_ME_TTL_DAYS = 30;

export function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionResponse(userId: string, rememberMe: boolean) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() +
    (rememberMe
      ? REMEMBER_ME_TTL_DAYS * 24 * 60 * 60 * 1000
      : SESSION_TTL_HOURS * 60 * 60 * 1000));

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  // Return the session ID in the body for sessionStorage support
  const res = NextResponse.json({ success: true, sessionId: session.id });

  res.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return res;
}

export async function clearSessionResponse(sessionId?: string) {
  const cookieStore = await cookies();
  const sid = sessionId || cookieStore.get(SESSION_COOKIE)?.value;

  if (sid) {
    await prisma.session.deleteMany({
      where: { id: sid },
    });
  }

  const res = NextResponse.json({ success: true });

  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const headerList = await headers();
  
  // 1. Try header first (for multi-tab support)
  let sessionId: string | null = headerList.get("Session-ID");
  
  // 2. Fallback to cookie
  if (!sessionId) {
    const cookie = cookieStore.get(SESSION_COOKIE);
    sessionId = cookie ? cookie.value : null;
  }

  if (!sessionId) return null;

  if (!isValidObjectId(sessionId)) {
    console.warn(`[AUTH] Malformed Session ID: ${sessionId}`);
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) {
    console.log(`[AUTH] Session not found: ${sessionId}`);
    return null;
  }

  if (session.expiresAt < new Date()) {
    console.log(`[AUTH] Session expired: ${sessionId}`);
    await prisma.session.delete({
      where: { id: session.id },
    });
    return null;
  }

  logDebug(`[AUTH] Current User Resolved: ID:${session.user.id}, Email:${session.user.email}, SessionID:${sessionId}`);
  return session.user;
}

