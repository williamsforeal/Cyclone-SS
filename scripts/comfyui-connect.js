#!/usr/bin/env node
/**
 * ComfyUI API connectivity test and workflow runner
 * Usage: node scripts/comfyui-connect.js [workflow.json]
 */

const COMFYUI_URL = process.env.COMFYUI_URL || 'http://localhost:8188';

async function checkConnection() {
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`);
    if (res.ok) {
      const stats = await res.json();
      console.log('✓ ComfyUI is reachable');
      console.log('  Python:', stats.python_version);
      return true;
    }
  } catch (err) {
    console.error('✗ Cannot reach ComfyUI at', COMFYUI_URL);
    console.error('  Error:', err.message);
    return false;
  }
  return false;
}

async function submitWorkflow(workflow) {
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error + (data.node_errors ? '\n' + JSON.stringify(data.node_errors, null, 2) : ''));
  }
  return data;
}

async function getHistory(promptId) {
  const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
  return res.json();
}

async function main() {
  console.log('ComfyUI URL:', COMFYUI_URL);
  if (!(await checkConnection())) process.exit(1);

  const workflowPath = process.argv[2] || 'comfyui/workflows/txt2img_api.json';
  const fs = await import('fs');
  const path = await import('path');
  const fullPath = path.resolve(process.cwd(), workflowPath);

  if (!fs.existsSync(fullPath)) {
    console.log('No workflow file specified or file not found.');
    console.log('Usage: node scripts/comfyui-connect.js [workflow.json]');
    process.exit(0);
  }

  const workflow = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  console.log('\nSubmitting workflow:', workflowPath);
  const result = await submitWorkflow(workflow);
  console.log('  prompt_id:', result.prompt_id);
  console.log('  queue position:', result.number);

  console.log('\nPolling for completion (every 2s)...');
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const history = await getHistory(result.prompt_id);
    const entry = history[result.prompt_id];
    if (entry) {
      console.log('  Completed.');
      if (entry.outputs) {
        for (const [nodeId, out] of Object.entries(entry.outputs)) {
          if (out.images) {
            out.images.forEach((img) => {
              console.log('  Image:', `${COMFYUI_URL}/view?filename=${img.filename}&subfolder=${img.subfolder || ''}`);
            });
          }
        }
      }
      process.exit(0);
    }
  }
  console.log('  Timeout waiting for result.');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
