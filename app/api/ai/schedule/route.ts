import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logDebug } from "@/lib/debug";

export async function GET(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API Key not configured" }, { status: 500 });
    }

    const groq = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch incomplete tasks for the user
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { not: "DONE" },
        completed: false,
        parentTaskId: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        deadline: true,
      },
      orderBy: [
        { priority: 'asc' },
        { deadline: 'asc' }
      ]
    });

    if (tasks.length === 0) {
      return NextResponse.json({ schedule: [], message: "No active tasks to schedule." });
    }

    const now = new Date();
    const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    logDebug(`AI Smart Schedule requested for user ${user.email} with ${tasks.length} tasks.`);

    const prompt = `You are an expert time management assistant. 
    Current Time: ${currentTime}
    Tasks to schedule:
    ${tasks.map(t => `- [ID: ${t.id}] ${t.title} (Priority: ${t.priority}, Deadline: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : 'None'})`).join('\n')}

    Generate a realistic daily schedule for today starting from ${currentTime}.
    Guidelines:
    - Allocate time slots (30-90 mins) based on task importance and deadlines.
    - Include short breaks if appropriate.
    - Format each item as: "HH:MM - HH:MM → Task Name".
    - Return a JSON object with a 'schedule' key containing an array of these strings.
    - Example: { "schedule": ["09:00 - 10:00 → Study OS", "10:00 - 10:15 → Break"] }

    Return ONLY the JSON object.`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = completion.choices[0].message.content;
      if (content) {
        const data = JSON.parse(content);
        if (data.schedule && Array.isArray(data.schedule)) {
          logDebug(`AI Smart Schedule generated successfully.`);
          return NextResponse.json({ schedule: data.schedule });
        }
      }
      
      throw new Error("Invalid response from AI");

    } catch (apiError: any) {
      console.error("Groq API Error:", apiError);
      return NextResponse.json({ error: "Failed to generate schedule with AI" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[AI_SCHEDULE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to process schedule" }, { status: 500 });
  }
}
