/**
 * Vertex AI Narrative Generator
 *
 * Uses Gemini to generate QUALITATIVE outputs only:
 * - primary_angle: 1-sentence emotional hook
 * - reasoning: 2-sentence assessment
 *
 * Numeric scoring is handled by the deterministic scoring-engine.ts.
 */

const VERTEX_PROJECT = process.env.VERTEX_AI_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || "gen-lang-client-0234791928";
const VERTEX_REGION = process.env.VERTEX_AI_REGION || "us-central1";
const VERTEX_MODEL = "gemini-2.0-flash";

interface NarrativeInput {
  productName: string;
  category?: string;
  score: number;
  decision: string;
  painPoints?: Array<{ painPointText: string; emotionalIntensity: number; rawQuote?: string }>;
  competitorWeaknesses?: string[];
  consumerPhrases?: Array<{ phrase: string; phraseType: string }>;
  amazonData?: { monthlyUnits?: number; rating?: number };
  metaAdsData?: { activeAdsTotal?: number; advertisersCount?: number };
}

interface NarrativeOutput {
  primaryAngle: string;
  reasoning: string;
}

/**
 * Generate a qualitative narrative for a scored product candidate.
 * Returns primary_angle (1-sentence hook) and reasoning (2-sentence assessment).
 */
export async function generateNarrative(input: NarrativeInput): Promise<NarrativeOutput> {
  const { google } = await import("googleapis" as string).catch(() => ({ google: null }));

  // Build context string from available data
  const contextParts: string[] = [
    `Product: ${input.productName}`,
    `Category: ${input.category || "unknown"}`,
    `Score: ${input.score}/100 (${input.decision})`,
  ];

  if (input.painPoints?.length) {
    const topPains = input.painPoints
      .sort((a, b) => b.emotionalIntensity - a.emotionalIntensity)
      .slice(0, 5);
    contextParts.push(`Top Pain Points:\n${topPains.map(p =>
      `- ${p.painPointText} (intensity: ${p.emotionalIntensity}/10)${p.rawQuote ? ` "${p.rawQuote}"` : ""}`
    ).join("\n")}`);
  }

  if (input.competitorWeaknesses?.length) {
    contextParts.push(`Competitor Weaknesses:\n${input.competitorWeaknesses.map(w => `- ${w}`).join("\n")}`);
  }

  if (input.consumerPhrases?.length) {
    const topPhrases = input.consumerPhrases.slice(0, 5);
    contextParts.push(`Consumer Language:\n${topPhrases.map(p => `- "${p.phrase}" (${p.phraseType})`).join("\n")}`);
  }

  const prompt = `You are an elite DTC advertising strategist. Based on this product intelligence data, generate two outputs:

${contextParts.join("\n\n")}

OUTPUT (return ONLY valid JSON, no markdown):
{
  "primaryAngle": "One bold sentence — the emotional hook that would make someone stop scrolling. Mirror consumer language if available. Max 15 words.",
  "reasoning": "Two sentences explaining why this product scores ${input.score}/100 and what the strongest signal is."
}`;

  try {
    // Try Vertex AI endpoint
    const accessToken = await getAccessToken();
    const endpoint = `https://${VERTEX_REGION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT}/locations/${VERTEX_REGION}/publishers/google/models/${VERTEX_MODEL}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Vertex AI error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(text);

    return {
      primaryAngle: parsed.primaryAngle || "No angle generated.",
      reasoning: parsed.reasoning || "No reasoning generated.",
    };
  } catch (err) {
    console.error("[vertex-narrative] Error generating narrative:", err);
    return {
      primaryAngle: `${input.decision}: ${input.productName}`,
      reasoning: `Scored ${input.score}/100. Automated narrative generation failed — review manually.`,
    };
  }
}

async function getAccessToken(): Promise<string> {
  try {
    const { GoogleAuth } = await import("google-auth-library" as string);
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token || "";
  } catch {
    // Fallback: try gcloud CLI
    const { execSync } = await import("child_process");
    return execSync("gcloud auth print-access-token", { encoding: "utf-8" }).trim();
  }
}
