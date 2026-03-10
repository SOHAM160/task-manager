import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSessionResponse, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const email = (body.email || "").toString().trim().toLowerCase();
  const password = (body.password || "").toString();
  const rememberMe = Boolean(body.rememberMe);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
    },
  });

  return createSessionResponse(user.id, rememberMe);
}

