import { clearSessionResponse } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST() {
  const headerList = await headers();
  const sessionId = headerList.get("Session-ID") || undefined;
  return clearSessionResponse(sessionId);
}

