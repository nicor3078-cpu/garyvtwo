import { getUserApiKey, getMemoryVault } from "@/lib/storage";

const BUILT_IN_KEYS = [
  "AIzaSyDINRsKFc6aEGPix3O_dFvlzvqNigtPnnA",
  "AIzaSyADvLUHiNryoVzvpOhhKogtdnhmCt1w9SE",
  "AIzaSyBJzO3AFXJqVYe2Lgfln-UBp81WDwpJ7PI",
  "AIzaSyCKpIV9wGD0Lq3T3HFNZ-fSEuKfFiP7HGI",
  "AIzaSyBb1IPNKY89OpDE1QAvx61FTG_RqK_Db3o",
  "AIzaSyBvoREjEKwp52vJ_USh9UcpwWZPTKEwdOM",
  "AIzaSyB5n21vN6EKZ9I9_Fsw3MVP5FdwdLeFb7k",
  "AIzaSyB-d9YDobpxfcNOjKLSZgC103EpjoM_0OU",
  "AIzaSyAM9NM9p34I5OFYs5Sqe0njuuUxHkC2FRo",
  "AIzaSyBJNIJxp4jFQzk9lndu3JPAYx8dTndrt4Y",
  "AIzaSyBqh-F0Je_HsVMfZvePXYRsbmEN9Ts6fe8",
];

let currentKeyIndex = 0;

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function buildSystemPrompt(memory: {
  name: string;
  birthday: string;
  interests: string;
  grade: string;
}): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let memorySection = "";
  if (
    memory.name ||
    memory.birthday ||
    memory.interests ||
    memory.grade
  ) {
    memorySection = `\n\nSTUDENT PROFILE (remember this throughout our conversation):`;
    if (memory.name) memorySection += `\n- Name: ${memory.name}`;
    if (memory.grade) memorySection += `\n- Grade/Level: ${memory.grade}`;
    if (memory.birthday) memorySection += `\n- Birthday: ${memory.birthday}`;
    if (memory.interests)
      memorySection += `\n- Interests/Hobbies: ${memory.interests}`;
    memorySection += `\n\nPersonalize your explanations and analogies to relate to this student's interests and level.`;
  }

  return `You are GARY, a wise and fatherly tutor who uses the Feynman Technique to explain complex subjects. Today is ${dateStr} at ${timeStr}.${memorySection}

PERSONALITY:
- You speak with warmth and patience, like a caring father helping his child understand the world
- You use "straight-talk" - no jargon, no unnecessary complexity
- You relate concepts to everyday experiences and simple analogies
- You're encouraging but honest, celebrating curiosity while gently correcting misconceptions
- Use the student's name and interests when you know them to make examples feel personal

TEACHING METHOD (Feynman Technique):
1. Explain concepts as if teaching a child - use simple words first, then build up
2. Use relatable analogies from everyday life
3. Identify gaps in understanding and address them directly
4. Connect new ideas to things the student already knows

RESPONSE FORMAT - You MUST follow this EXACT structure every time:

First, give your full explanation using markdown formatting (bold key terms, use bullet lists for steps, use code blocks for code/formulas).

Then end with ALL THREE of the following sections in this exact order:

**Dad's Summary:**
- [First key takeaway in one simple sentence]
- [Second key takeaway in one simple sentence]
- [Third key takeaway in one simple sentence]

**Reflexion Questions:**
1. [A question to test basic understanding]
2. [A question to apply the concept to real life]
3. [A deeper question to push their thinking further]

**Book Recommendation:**
[ONE book title in quotes followed by a dash and one sentence on why it's perfect for this topic]

CRITICAL RULES:
- The Dad's Summary must have EXACTLY 3 bullet points starting with hyphens (-)
- The Reflexion Questions must have EXACTLY 3 numbered questions
- The Book Recommendation must be ONE line only
- Never skip any of these three sections`;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ImageAttachment {
  base64: string;
  mimeType: string;
}

async function getApiKey(): Promise<string> {
  const userKey = await getUserApiKey();
  if (userKey) return userKey;

  if (BUILT_IN_KEYS.length === 0) {
    throw new Error(
      "No API keys available. Please add your Gemini API key in Settings."
    );
  }

  const key = BUILT_IN_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % BUILT_IN_KEYS.length;
  return key;
}

async function makeGeminiRequest(
  apiKey: string,
  contents: object[],
  signal?: AbortSignal
): Promise<Response> {
  return fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 3072,
        temperature: 0.7,
      },
    }),
    signal,
  });
}

export async function askGary(
  message: string,
  history: ChatMessage[] = [],
  image?: ImageAttachment,
  signal?: AbortSignal
): Promise<string> {
  const memory = await getMemoryVault();
  const systemPrompt = buildSystemPrompt(memory);
  const apiKey = await getApiKey();

  const userParts: object[] = [{ text: message }];
  if (image) {
    userParts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64,
      },
    });
  }

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    {
      role: "model",
      parts: [
        {
          text: "Understood. I am GARY, your wise and fatherly tutor. I'll use the Feynman Technique, personalize my examples, and always end with Dad's Summary, Reflexion Questions, and a Book Recommendation.",
        },
      ],
    },
    ...history.slice(-12).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
    { role: "user", parts: userParts },
  ];

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (signal?.aborted) {
        throw new Error("Request cancelled");
      }

      const response = await makeGeminiRequest(apiKey, contents, signal);

      if (response.status === 429) {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        return "I'm getting a lot of questions right now. Give me just 20 seconds and ask me again, okay?";
      }

      if (response.status === 503 || response.status === 502) {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        return "The connection is struggling a bit. Try again in a moment - I'm not going anywhere.";
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("GARY Diagnostic:", errorData);
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        return `Something went wrong on my end (${response.status}). Please try again in a moment.`;
      }

      const data = await response.json();

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      throw new Error("Unexpected API response structure");
    } catch (error: any) {
      if (error.name === "AbortError" || error.message === "Request cancelled") {
        throw error;
      }
      lastError = error;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Failed after multiple retries");
}

export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: "Hello" }] },
        ],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });
    return response.ok || response.status === 429;
  } catch {
    return false;
  }
}
