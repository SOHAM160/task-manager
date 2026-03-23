import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { logDebug } from "@/lib/debug";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API Key not configured in .env" }, { status: 500 });
    }

    // Groq is OpenAI-compatible
    const groq = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    logDebug(`AI Breakdown requested via Groq (Llama 3.3 70B) for: "${title}"`);

    try {
      const prompt = `You are a professional task manager assistant. 
      Break down the specific topic: "${title}" into 4 to 6 highly detailed and actionable subtasks.
      IMPORTANT: Provide specific, topic-related subtasks, NOT generic ones. 
      For example:
      - If the topic is "Hydrogen", give subtasks like "Chemical properties", "Atomic structure", "Common reactions", "Industrial preparation".
      - If the topic is "Trigonometry", give subtasks like "Heights and distances", "Trigonometric identities", "Sine and Cosine rules".
      - If the topic is "Computer Networks", give subtasks like "Subnetting", "IP Addressing", "TCP/UDP protocols", "OSI Model layers".
      - If the topic is "Neural Networks", give subtasks like "Backpropagation", "Activation functions", "Gradient descent", "Layer architectures".

      Return ONLY a JSON object with a 'subtasks' key containing an array of strings.
      Example: { "subtasks": ["Specific Task 1", "Specific Task 2"] }`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const content = completion.choices[0].message.content;
      if (content) {
        const data = JSON.parse(content);
        if (data.subtasks && Array.isArray(data.subtasks)) {
          logDebug(`AI Breakdown success via Groq`);
          return NextResponse.json({ subtasks: data.subtasks });
        }
      }
      
      throw new Error("Invalid response format from Groq");

    } catch (apiError: any) {
      logDebug(`Groq API Error: ${apiError.message}`);
      
      let errorMessage = apiError.message || "Unknown Groq Error";
      
      if (errorMessage.includes("429") || errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
        errorMessage = "Groq Rate Limit Exceeded. Please wait a few seconds and try again.";
      } else if (errorMessage.includes("API key")) {
        errorMessage = "Invalid Groq API Key. Please verify the key in your .env file.";
      }

      return NextResponse.json({ 
        error: errorMessage
      }, { status: apiError.status || 500 });
    }

  } catch (error: any) {
    console.error("[AI_BREAKDOWN_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to process task" }, { status: 500 });
  }
}
