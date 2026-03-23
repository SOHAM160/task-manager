import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendDailyPlanEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { schedule } = await req.json();
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return NextResponse.json({ error: "No schedule to send" }, { status: 400 });
    }

    await sendDailyPlanEmail(user.email, schedule);

    return NextResponse.json({ message: `Daily plan sent to ${user.email}` });
  } catch (error: any) {
    console.error("[NOTIFY_DAILY_PLAN_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
