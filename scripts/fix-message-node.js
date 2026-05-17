/**
 * Fix Message a model1 node in Static Scaler v3 Upgraded workflow
 *
 * Problem: The node has BOTH old "responses" section (Responses API format)
 * and new "messages" section (Chat format). The "responses" section takes
 * precedence and contains $('Extract Product Image URL').item references
 * that break after the Merge node (item pairing unavailable).
 *
 * Fix: Remove the Responses API parameters (modelId, responses, simplify,
 * builtInTools) so the node uses the Chat Messages format instead, which
 * has correct $json.xxx references that don't depend on item pairing.
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'workflows', 'static-scaler-v3-upgraded.json');

console.log('Reading workflow from:', workflowPath);
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Find the "Message a model1" node
const messageNode = workflow.nodes.find(n => n.name === 'Message a model1');
if (!messageNode) {
  console.error('ERROR: Could not find "Message a model1" node');
  process.exit(1);
}

console.log('\n=== BEFORE FIX ===');
console.log('Node type:', messageNode.type);
console.log('TypeVersion:', messageNode.typeVersion);
console.log('Has responses:', !!messageNode.parameters.responses);
console.log('Has messages:', !!messageNode.parameters.messages);
console.log('Has modelId:', !!messageNode.parameters.modelId);
console.log('Has model:', !!messageNode.parameters.model);
console.log('Has simplify:', messageNode.parameters.simplify !== undefined);
console.log('Has builtInTools:', !!messageNode.parameters.builtInTools);

// Remove old Responses API parameters
delete messageNode.parameters.modelId;
delete messageNode.parameters.responses;
delete messageNode.parameters.simplify;
delete messageNode.parameters.builtInTools;

// Ensure messages section exists and is correct
if (!messageNode.parameters.messages || !messageNode.parameters.messages.values) {
  console.error('ERROR: messages section is missing!');
  process.exit(1);
}

// Add simplifyOutput to match Chat format (like Image Prompt Engineer node)
messageNode.parameters.simplifyOutput = false;

// Verify the messages have correct content
const msgs = messageNode.parameters.messages.values;
const systemMsg = msgs.find(m => m.role === 'system');
const userMsg = msgs.find(m => m.role === 'user');

if (!systemMsg) {
  console.error('ERROR: No system message found!');
  process.exit(1);
}

if (!userMsg) {
  console.error('ERROR: No user message found!');
  process.exit(1);
}

// Verify system message has Creative Director prompt (not old prompt)
if (systemMsg.content.includes('Eugene Schwartz')) {
  console.log('\nSystem prompt: Creative Director (correct)');
} else {
  console.warn('\nWARNING: System prompt does not contain Creative Director content!');
}

// Verify user message uses $json references (not $() node references)
if (userMsg.content.includes('$json.')) {
  console.log('User message: Uses $json.xxx references (correct)');
} else {
  console.warn('WARNING: User message does not use $json references!');
}

// Check for any remaining $('...').item references that could break
const paramsStr = JSON.stringify(messageNode.parameters);
const itemRefs = paramsStr.match(/\$\('[^']+'\)\.item/g);
if (itemRefs && itemRefs.length > 0) {
  console.warn('\nWARNING: Found remaining .item references:', itemRefs);
} else {
  console.log('No problematic .item references found (good)');
}

console.log('\n=== AFTER FIX ===');
console.log('Has responses:', !!messageNode.parameters.responses);
console.log('Has messages:', !!messageNode.parameters.messages);
console.log('Has modelId:', !!messageNode.parameters.modelId);
console.log('Has model:', !!messageNode.parameters.model);
console.log('Has simplifyOutput:', messageNode.parameters.simplifyOutput !== undefined);

// Write the fixed workflow
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log('\nWorkflow saved to:', workflowPath);
console.log('\nDone! Re-import the workflow in n8n to apply the fix.');
