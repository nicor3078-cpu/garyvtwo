import { getApiUrl } from "@/lib/query-client";

export function calculateIQ(responseText: string): number {
  let score = 90;

  const hasSummary = /Dad['']?s Summary/i.test(responseText);
  const hasReflexions = /Reflexion Questions/i.test(responseText);
  const hasBook = /Book Recommendation/i.test(responseText);

  if (hasSummary) score += 8;
  if (hasReflexions) score += 7;
  if (hasBook) score += 5;

  const wordCount = responseText.split(/\s+/).length;
  if (wordCount > 300) score += 5;
  if (wordCount > 600) score += 5;

  const hasCode = /```/.test(responseText);
  const hasBullets = /^[-*]\s/m.test(responseText);
  if (hasCode) score += 3;
  if (hasBullets) score += 2;

  const jitter = Math.floor(Math.random() * 11) - 5;
  score += jitter;

  return Math.max(85, Math.min(145, score));
}

export function extractTopic(userMessage: string): string {
  const cleaned = userMessage.trim().slice(0, 80);
  return cleaned.length < userMessage.trim().length
    ? cleaned + "..."
    : cleaned;
}

export async function logMinistryData(
  logicScore: number,
  topic: string,
  studentName: string
): Promise<void> {
  try {
    const url = new URL("/api/log-metrics", getApiUrl());
    await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logic_score: logicScore,
        topic,
        student_name: studentName || "Anonymous",
      }),
    });
  } catch {
    // Non-critical — fail silently
  }
}
