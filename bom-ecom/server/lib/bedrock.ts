import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export async function callClaude(
  messages: ClaudeMessage[],
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    model = "anthropic.claude-3-5-sonnet-20241022-v2:0",
    maxTokens = 4096,
    temperature = 1.0,
    systemPrompt,
  } = options;

  const body: any = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    messages,
    temperature,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const command = new InvokeModelCommand({
    modelId: model,
    body: JSON.stringify(body),
  });

  try {
    const response = await client.send(command);
    const data = JSON.parse(new TextDecoder().decode(response.body));
    return data.content[0].text;
  } catch (error: any) {
    throw new Error(`Bedrock API error: ${error.message}`);
  }
}

// Helper for single-turn conversations
export async function generateText(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  return callClaude(
    [{ role: "user", content: prompt }],
    options
  );
}

// Helper for ad copy generation
export async function generateAdCopy(params: {
  productName: string;
  avatar: string;
  angle: string;
  hooks: string[];
}): Promise<string> {
  const prompt = `Generate ad copy for:
Product: ${params.productName}
Target Avatar: ${params.avatar}
Angle: ${params.angle}
Hooks to use: ${params.hooks.join(", ")}

Format as JSON with: headline, body, cta`;

  return generateText(prompt, {
    systemPrompt: "You are an expert DTC ad copywriter specializing in high-converting Facebook/Instagram ads.",
    temperature: 0.7,
  });
}

// Helper for image prompt generation
export async function generateImagePrompt(params: {
  concept: string;
  style: string;
}): Promise<string> {
  const prompt = `Generate a detailed image prompt for:
Concept: ${params.concept}
Style: ${params.style}

Create a prompt suitable for fal.ai image generation.`;

  return generateText(prompt, {
    systemPrompt: "You are an AI image prompt engineer. Create detailed, specific prompts for image generation.",
    temperature: 0.8,
  });
}
