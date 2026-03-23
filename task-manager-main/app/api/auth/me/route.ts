import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const headerList = await headers();
  const cookieStore = await cookies();
  const sessionId = headerList.get("Session-ID") || cookieStore.get("sessionId")?.value;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    sessionId
  });
}

