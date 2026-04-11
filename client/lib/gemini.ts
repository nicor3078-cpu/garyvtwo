import { getUserApiKey, getMemoryVault } from "@/lib/storage";

const CONFIG_URL =
  "https://gist.githubusercontent.com/nicor3078-cpu/308f7d8ab992826693a264d9f9cf7fa2/raw/502019b4e650d57793628aedc2e703c0e6ea7ea6/gary_config.json";
const DEFAULT_MODEL = "gemini-1.5-flash";

let cachedModel: string | null = null;
let configFetchedAt = 0;
const CONFIG_TTL = 5 * 60 * 1000;

async function fetchConfig(): Promise<string> {
  const now = Date.now();
  if (cachedModel && now - configFetchedAt < CONFIG_TTL) {
    return cachedModel;
  }
  try {
    const res = await fetch(CONFIG_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Config fetch failed");
    const json = await res.json();
    const model = typeof json.current_model === "string" && json.current_model
      ? json.current_model
      : DEFAULT_MODEL;
    cachedModel = model;
    configFetchedAt = now;
    return model;
  } catch {
    return cachedModel || DEFAULT_MODEL;
  }
}

function getApiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

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
  if (memory.name || memory.birthday || memory.interests || memory.grade) {
    memorySection = `\n\nSTUDENT PROFILE (remember this throughout our conversation):`;
    if (memory.name) memorySection += `\n- Name: ${memory.name}`;
    if (memory.grade) memorySection += `\n- Grade/Level: ${memory.grade}`;
    if (memory.birthday) memorySection += `\n- Birthday: ${memory.birthday}`;
    if (memory.interests)
      memorySection += `\n- Interests/Hobbies: ${memory.interests}`;
    memorySection += `\n\nPersonalize your explanations and analogies to relate to this student's interests and level.`;
  }

  return `You are GARY, an elite polymath mentor and wise tutor. You use the Feynman Technique to make any concept crystal clear. Today is ${dateStr} at ${timeStr}.${memorySection}

PERSONALITY:
- Brilliant, philosophical, and deeply encouraging — like a mentor who believes the student is capable of anything
- Straight-talk only: no jargon, no unnecessary complexity, maximum clarity
- Relatable analogies from everyday life, science, history, and culture
- Honest and precise, always celebrating curiosity

VISUAL ANALYSIS:
- You can see and analyze images with high precision. When an image is shared, describe what you observe in detail, then explain the relevant concepts using the Feynman Technique.
- For diagrams, charts, equations, or photos: identify all key elements, then teach the underlying concept.
- For text or documents in images: read and explain them clearly.
- You have full vision capabilities. Never say you cannot see an image.

TEACHING METHOD (Feynman Technique):
1. Explain concepts as if teaching a curious 12-year-old — build from first principles
2. Use vivid, relatable analogies from everyday life
3. Identify gaps and address them directly
4. Connect new ideas to what the student already knows

RESPONSE FORMAT — Follow this EXACT structure every time:

First, give your full explanation using markdown formatting (bold key terms, bullet lists for steps, code blocks for code/formulas).

Then end with ALL THREE sections in this exact order:

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
- Dad's Summary: EXACTLY 3 bullet points starting with hyphens (-)
- Reflexion Questions: EXACTLY 3 numbered questions
- Book Recommendation: ONE line only
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
  if (userKey && userKey.trim()) return userKey.trim();
  throw new Error(
    "NO_API_KEY"
  );
}

async function makeGeminiRequest(
  apiKey: string,
  model: string,
  contents: object[],
  signal?: AbortSignal
): Promise<Response> {
  return fetch(`${getApiUrl(model)}?key=${apiKey}`, {
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

function isValidBase64(b64: string): boolean {
  if (!b64 || b64.trim().length === 0) return false;
  if (b64.length < 100) return false;
  return true;
}

export async function askGary(
  message: string,
  history: ChatMessage[] = [],
  image?: ImageAttachment,
  signal?: AbortSignal,
  onRetry?: (attempt: number, reason: string) => void
): Promise<string> {
  const memory = await getMemoryVault();
  const systemPrompt = buildSystemPrompt(memory);
  const apiKey = await getApiKey();
  const model = await fetchConfig();

  const imageIsValid = image && isValidBase64(image.base64);

  const buildContents = (includeImage: boolean) => {
    const userParts: object[] = [{ text: message }];

    if (includeImage && imageIsValid) {
      userParts.push({
        inlineData: {
          mimeType: image!.mimeType || "image/jpeg",
          data: image!.base64,
        },
      });
    }

    return [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I am GARY, your elite polymath mentor. I'll use the Feynman Technique, analyze any visuals with precision, personalize my examples, and always end with Dad's Summary, Reflexion Questions, and a Book Recommendation.",
          },
        ],
      },
      ...history.slice(-12).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: userParts },
    ];
  };

  const RETRY_DELAYS = [2000, 4000, 8000];
  const MAX_ATTEMPTS = 4;
  let lastError: Error | null = null;
  let useImage = !!imageIsValid;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      if (signal?.aborted) throw new Error("Request cancelled");

      const contents = buildContents(useImage);
      const response = await makeGeminiRequest(apiKey, model, contents, signal);

      if (response.status === 429) {
        if (attempt < RETRY_DELAYS.length) {
          const delay = RETRY_DELAYS[attempt];
          onRetry?.(attempt + 1, "rate_limit");
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        return "I'm fielding a lot of questions at the moment. Give me 20 seconds and try again — I'm not going anywhere.";
      }

      if (response.status === 503 || response.status === 502) {
        if (attempt < RETRY_DELAYS.length) {
          const delay = RETRY_DELAYS[attempt];
          onRetry?.(attempt + 1, "server_error");
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        return "The connection is struggling. Try again in a moment — I'm still here.";
      }

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        if (useImage && attempt === 0) {
          useImage = false;
          onRetry?.(attempt + 1, "image_fallback");
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        console.warn("GARY 400 error:", errorData);
        return "Something went wrong processing that request. Try rephrasing and I'll be right with you.";
      }

      if (!response.ok) {
        if (attempt < RETRY_DELAYS.length) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
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
      if (
        error.name === "AbortError" ||
        error.message === "Request cancelled"
      ) {
        throw error;
      }
      if (error.message === "NO_API_KEY") throw error;
      lastError = error;
      if (attempt < RETRY_DELAYS.length) {
        onRetry?.(attempt + 1, "network_error");
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Failed after multiple retries");
}

export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const model = await fetchConfig();
    const response = await fetch(`${getApiUrl(model)}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Hello" }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });
    return response.ok || response.status === 429;
  } catch {
    return false;
  }
}
