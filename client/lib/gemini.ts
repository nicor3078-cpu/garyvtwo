const GEMINI_API_KEY = process.env.EXPO_PUBLIC_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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

export async function askGary(message: string, history: ChatMessage[] = []): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Please add EXPO_PUBLIC_API_KEY to your environment.");
  }

  const contents = [
    {
      role: "user",
      parts: [{ text: GARY_SYSTEM_PROMPT }],
    },
    {
      role: "model",
      parts: [{ text: "I understand. I am GARY, a wise and fatherly tutor. I'll use the Feynman Technique to explain concepts simply, with everyday analogies, and I'll always end my responses with Dad's Summary containing exactly 3 bullet points. How can I help you learn today?" }],
    },
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error("Invalid response from Gemini API");
}
