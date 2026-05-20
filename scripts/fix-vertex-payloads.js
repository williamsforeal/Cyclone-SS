const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('c:/1. Business/williamsforeal LLC/repositories/Cyclone-SS/workflows/static-scaler-v3-vertex.json', 'utf8'));

// ===== 1. Fix Build CD Payload (Creative Director) =====
const buildCD = wf.nodes.find(n => n.name === 'Build CD Payload');
let cdCode = buildCD.parameters.jsCode;

// Extract the systemPrompt and userMessage logic (everything before the return statement)
// Replace the OpenAI return block with Vertex AI Gemini format
const cdReturnBlock = `return [{
  json: {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 3000
    }
  }
}];`;

// Replace from "return [{" to the end of the function
const cdReturnStart = cdCode.lastIndexOf('return [{');
if (cdReturnStart !== -1) {
  cdCode = cdCode.substring(0, cdReturnStart) + cdReturnBlock;
  buildCD.parameters.jsCode = cdCode;
  console.log('✅ Build CD Payload updated');
} else {
  console.log('❌ Could not find return block in Build CD Payload');
}

// ===== 2. Fix Build IPE Payload (Image Prompt Engineer) =====
const buildIPE = wf.nodes.find(n => n.name === 'Build IPE Payload');
let ipeCode = buildIPE.parameters.jsCode;

const ipeReturnBlock = `return [{
  json: {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 500
    }
  }
}];`;

const ipeReturnStart = ipeCode.lastIndexOf('return [{');
if (ipeReturnStart !== -1) {
  ipeCode = ipeCode.substring(0, ipeReturnStart) + ipeReturnBlock;
  buildIPE.parameters.jsCode = ipeCode;
  console.log('✅ Build IPE Payload updated');
} else {
  console.log('❌ Could not find return block in Build IPE Payload');
}

// ===== 3. Fix Parse nodes: add Vertex AI response extraction =====
const vertexFallback = (original) => {
  const toReplace = `// Primary: Standard Chat Completions response`;
  const vertexPrimary = `// Primary: Vertex AI Gemini response
  if (item.json?.candidates?.[0]?.content?.parts?.[0]?.text) {
    text = item.json.candidates[0].content.parts[0].text;
  }
  // Fallback: OpenAI Chat Completions response`;

  return original.replace(toReplace, vertexPrimary);
};

// Parse Prompt node (IPE output)
const parsePP = wf.nodes.find(n => n.name === 'Parse Prompt');
if (parsePP && parsePP.parameters.jsCode) {
  const updated = vertexFallback(parsePP.parameters.jsCode);
  if (updated !== parsePP.parameters.jsCode) {
    parsePP.parameters.jsCode = updated;
    console.log('✅ Parse Prompt node updated');
  } else {
    console.log('ℹ️  Parse Prompt: no match found (may already be updated)');
  }
}

// Creative Director parse node (whichever code node parses CD output)
wf.nodes.forEach(n => {
  if (n.parameters?.jsCode && n.parameters.jsCode.includes('Parse Creative Director JSON output')) {
    const updated = vertexFallback(n.parameters.jsCode);
    if (updated !== n.parameters.jsCode) {
      n.parameters.jsCode = updated;
      console.log('✅ CD parse node updated:', n.name);
    }
  }
});

// ===== 4. Write output =====
fs.writeFileSync(
  'c:/1. Business/williamsforeal LLC/repositories/Cyclone-SS/workflows/static-scaler-v3-vertex.json',
  JSON.stringify(wf, null, 2)
);

// ===== 5. Verify =====
console.log('\n--- Verification ---');
const v = JSON.parse(fs.readFileSync('c:/1. Business/williamsforeal LLC/repositories/Cyclone-SS/workflows/static-scaler-v3-vertex.json','utf8'));

const vBuildCD = v.nodes.find(n => n.name === 'Build CD Payload');
const vBuildIPE = v.nodes.find(n => n.name === 'Build IPE Payload');
const vCallCD = v.nodes.find(n => n.name === 'Call Creative Director');
const vCallIPE = v.nodes.find(n => n.name === 'Call Image Prompt Engineer');
const vParsePrompt = v.nodes.find(n => n.name === 'Parse Prompt');

console.log('Build CD → Vertex format:', vBuildCD.parameters.jsCode.includes('systemInstruction'));
console.log('Build CD → OpenAI removed:', !vBuildCD.parameters.jsCode.includes("model: 'gpt-4o'"));
console.log('Build IPE → Vertex format:', vBuildIPE.parameters.jsCode.includes('systemInstruction'));
console.log('Build IPE → OpenAI removed:', !vBuildIPE.parameters.jsCode.includes("model: 'gpt-4o-mini'"));
console.log('Call CD URL:', vCallCD.parameters.url);
console.log('Call IPE URL:', vCallIPE.parameters.url);
console.log('Call CD Auth:', vCallCD.parameters.authentication);
console.log('Parse Prompt → Vertex fallback:', vParsePrompt?.parameters?.jsCode?.includes('candidates') ?? false);
