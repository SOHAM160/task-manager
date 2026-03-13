import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSessionResponse, verifyPassword } from "@/lib/auth";

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

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.password);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  return createSessionResponse(user.id, rememberMe);
}

