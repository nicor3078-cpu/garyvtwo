import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

async function logToSupabase(payload: {
  logic_score: number;
  topic: string;
  student_name: string;
}): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("SUPABASE_URL or SUPABASE_KEY not set — skipping log");
    return;
  }

  const endpoint = `${supabaseUrl}/rest/v1/student_metrics`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      logic_score: payload.logic_score,
      topic: payload.topic,
      student_name: payload.student_name,
      created_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`Supabase log failed (${response.status}):`, text);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/log-metrics", async (req: Request, res: Response) => {
    try {
      const { logic_score, topic, student_name } = req.body;

      if (
        typeof logic_score !== "number" ||
        typeof topic !== "string" ||
        typeof student_name !== "string"
      ) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      await logToSupabase({ logic_score, topic, student_name });
      res.json({ ok: true });
    } catch (error) {
      console.error("Error in log-metrics:", error);
      res.status(500).json({ error: "Failed to log metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
