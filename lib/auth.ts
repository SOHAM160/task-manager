import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "sessionId";
const SESSION_TTL_HOURS = 24;
const REMEMBER_ME_TTL_DAYS = 30;

export async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionResponse(userId: number, rememberMe: boolean) {
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

  const res = NextResponse.json({ success: true });

  res.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return res;
}

export async function clearSessionResponse() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await prisma.session.deleteMany({
      where: { id: sessionId },
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
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: { id: session.id },
    });
    return null;
  }

  return session.user;
}

