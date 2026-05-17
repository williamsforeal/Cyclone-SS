/**
 * Bedrock Test Script
 * Run: npx tsx test-bedrock.ts
 */

import { generateText, generateAdCopy, generateImagePrompt } from "./server/lib/bedrock";

async function testBedrockConnection() {
  console.log("🧪 Testing AWS Bedrock Connection...\n");

  try {
    // Test 1: Simple text generation
    console.log("Test 1: Simple Text Generation");
    console.log("================================");
    const simpleResponse = await generateText(
      "Say hello and confirm you're Claude running on AWS Bedrock."
    );
    console.log("✅ Response:", simpleResponse);
    console.log("");

    // Test 2: Ad copy generation
    console.log("Test 2: Ad Copy Generation");
    console.log("===========================");
    const adCopy = await generateAdCopy({
      productName: "Palm Aura Hand Massager",
      avatar: "Women 45+ with hand pain",
      angle: "Pain Relief + Daily Comfort",
      hooks: ["Your hands deserve relief", "Finally, pain-free hands"],
    });
    console.log("✅ Ad Copy Generated:");
    console.log(adCopy);
    console.log("");

    // Test 3: Image prompt generation
    console.log("Test 3: Image Prompt Generation");
    console.log("================================");
    const imagePrompt = await generateImagePrompt({
      concept: "Woman using hand massager with relief on her face",
      style: "UGC authentic iPhone photo",
    });
    console.log("✅ Image Prompt:");
    console.log(imagePrompt);
    console.log("");

    console.log("✅ All Bedrock tests passed!");
    console.log("\nYour AWS Bedrock setup is working correctly.");
    console.log("You can now use it in your n8n workflows and API routes.");

  } catch (error: any) {
    console.error("❌ Bedrock test failed!");
    console.error("\nError:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check AWS credentials in .env:");
    console.error("   - AWS_ACCESS_KEY_ID");
    console.error("   - AWS_SECRET_ACCESS_KEY");
    console.error("   - AWS_REGION (default: us-east-1)");
    console.error("2. Verify Bedrock is enabled in AWS Console");
    console.error("3. Check IAM permissions for Bedrock access");
    console.error("4. Confirm model availability in your region");
    process.exit(1);
  }
}

// Run tests
testBedrockConnection();
