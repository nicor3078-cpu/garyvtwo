 const GEMINI_API_KEY = ["AIzaSyDINRsKFc6aEGPix3O_dFvlzvqNigtPnnA",
  "AIzaSyADvLUHiNryoVzvpOhhKogtdnhmCt1w9SE",
  "AIzaSyBJzO3AFXJqVYe2Lgfln-UBp81WDwpJ7PI",
  "AIzaSyCKpIV9wGD0Lq3T3HFNZ-fSEuKfFiP7HGI",
  "AIzaSyBb1IPNKY89OpDE1QAvx61FTG_RqK_Db3o",
  "AIzaSyBvoREjEKwp52vJ_USh9UcpwWZPTKEwdOM",
  "AIzaSyB5n21vN6EKZ9I9_Fsw3MVP5FdwdLeFb7k",
  "AIzaSyB-d9YDobpxfcNOjKLSZgC103EpjoM_0OU",
  "AIzaSyAM9NM9p34I5OFYs5Sqe0njuuUxHkC2FRo",
  "AIzaSyBJNIJxp4jFQzk9lndu3JPAYx8dTndrt4Y",
  "AIzaSyBqh-F0Je_HsVMfZvePXYRsbmEN9Ts6fe8"
].filter(key => key !== undefined);

let currentKeyIndex = 0;

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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
  if (GEMINI_API_KEY.length === 0) {
    throw new Error("GARY MISSION CRITICAL: No API keys found in Replit Secrets.");
  }

  const currentKey = GEMINI_API_KEY[currentKeyIndex];

  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEY.length;

  const contents = [
    { role: "user", parts: [{ text: GARY_SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "I understand. I am GARY, a wise and fatherly tutor. I'll use the Feynman Technique to explain concepts simply and always end with a Dad's Summary." }] },
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];
  
  const response = await fetch(`${GEMINI_API_URL}?key=${currentKey}`, {
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
    const errorData = await 
      response.json();
    console.log("GARY Diagnostic:", errorData); 
    return `GARY SYSTEM NOTICE: ${response.status}. Please try again in a moment.`;
  }

  if (response.status === 429) {
      return "I'm thinking quite hard right now for the club! Give me just 20 seconds to gather my thoughts and ask me again.";
    }

  const data = await response.json();
  
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error("Invalid response from Gemini API");
}
