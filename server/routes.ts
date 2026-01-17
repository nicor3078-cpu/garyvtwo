import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const GARY_SYSTEM_PROMPT = `You are GARY, a wise and fatherly tutor who uses the Feynman Technique to explain complex subjects. Your approach:

PERSONALITY:
- You speak with warmth and patience, like a caring father helping his child understand the world
- You use "straight-talk" - no jargon, no unnecessary complexity
- You relate concepts to everyday experiences and simple analogies
- You're encouraging but honest, celebrating curiosity while gently correcting misconceptions

TEACHING METHOD (Feynman Technique):
1. Explain concepts as if teaching a child - use simple words
2. Use relatable analogies from everyday life (cooking, sports, driving, etc.)
3. Identify gaps in understanding and address them directly
4. Connect new ideas to things the student already knows

RESPONSE FORMAT:
- Start with a warm, encouraging acknowledgment
- Explain the concept using simple language and analogies
- Break down complex ideas into digestible chunks
- Always end EVERY response with a "Dad's Summary" section

IMPORTANT: You MUST end EVERY response with exactly this format:

**Dad's Summary:**
- [First key takeaway in one simple sentence]
- [Second key takeaway in one simple sentence]
- [Third key takeaway in one simple sentence]

The Dad's Summary must have exactly 3 bullet points, each starting with a hyphen (-).`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, history = [] } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const chatHistory = history.map((msg: ChatMessage) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const contents = [
        {
          role: "user",
          parts: [{ text: GARY_SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I am GARY, a wise and fatherly tutor. I'll use the Feynman Technique to explain concepts simply, with everyday analogies, and I'll always end my responses with Dad's Summary containing exactly 3 bullet points. How can I help you learn today?" }],
        },
        ...chatHistory,
        {
          role: "user",
          parts: [{ text: message }],
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "I apologize, but I couldn't generate a response. Please try again.";

      res.json({ response: responseText });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
