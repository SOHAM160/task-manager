const OpenAI = require("openai");
const Task = require("../models/Task");

// POST /api/ai/breakdown
exports.breakdown = async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Groq API Key not configured in .env" });
    }

    const groq = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    console.log(`[AI] Breakdown requested via Groq for: "${title}"`);

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
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const content = completion.choices[0].message.content;
      if (content) {
        const data = JSON.parse(content);
        if (data.subtasks && Array.isArray(data.subtasks)) {
          return res.json({ subtasks: data.subtasks });
        }
      }

      throw new Error("Invalid response format from Groq");
    } catch (apiError) {
      console.error("[GROQ_API_ERROR]", apiError.message);

      let errorMessage = apiError.message || "Unknown Groq Error";

      if (
        errorMessage.includes("429") ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("quota")
      ) {
        errorMessage =
          "Groq Rate Limit Exceeded. Please wait a few seconds and try again.";
      } else if (errorMessage.includes("API key")) {
        errorMessage =
          "Invalid Groq API Key. Please verify the key in your .env file.";
      }

      return res.status(apiError.status || 500).json({ error: errorMessage });
    }
  } catch (error) {
    console.error("[AI_BREAKDOWN_ERROR]", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to process task" });
  }
};

// GET /api/ai/schedule
exports.aiSchedule = async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Groq API Key not configured" });
    }

    const groq = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const user = req.user;

    const { workspaceId } = req.query;

    const filter = {
      status: { $ne: "DONE" },
      completed: false,
      parentTaskId: null,
    };

    if (workspaceId && workspaceId !== "null" && workspaceId !== "undefined") {
      filter.workspaceId = workspaceId;
    } else {
      filter.userId = user._id;
      filter.workspaceId = null;
    }

    // Fetch incomplete tasks
    const tasks = await Task.find(filter)
      .select("title description priority deadline")
      .sort({ priority: 1, deadline: 1 });

    if (tasks.length === 0) {
      return res.json({
        schedule: [],
        message: "No active tasks to schedule.",
      });
    }

    const now = new Date();
    const currentTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    console.log(
      `[AI] Smart Schedule requested for user ${user.email} with ${tasks.length} tasks.`
    );

    const prompt = `You are an expert time management assistant. 
    Current Time: ${currentTime}
    Tasks to schedule:
    ${tasks
      .map(
        (t) =>
          `- [ID: ${t._id}] ${t.title} (Priority: ${t.priority}, Deadline: ${
            t.deadline
              ? new Date(t.deadline).toLocaleDateString()
              : "None"
          })`
      )
      .join("\n")}

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
          return res.json({ schedule: data.schedule });
        }
      }

      throw new Error("Invalid response from AI");
    } catch (apiError) {
      console.error("[GROQ_API_ERROR]", apiError);
      return res
        .status(500)
        .json({ error: "Failed to generate schedule with AI" });
    }
  } catch (error) {
    console.error("[AI_SCHEDULE_ERROR]", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to process schedule" });
  }
};
