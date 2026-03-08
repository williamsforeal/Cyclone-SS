#!/usr/bin/env node

/**
 * n8n Workflow Import Script
 * Imports workflow JSON files into local n8n instance
 *
 * Usage:
 *   node scripts/import-workflow.js <workflow-file.json>
 *   node scripts/import-workflow.js workflows/static-scaler-v3-fixed.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load .env file
require('dotenv').config();

// Configuration
const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_LOCAL_API_KEY || process.env.N8N_API_KEY || '';
const N8N_USER = process.env.N8N_BASIC_AUTH_USER || 'admin';
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD || 'changeme';

/**
 * Import workflow into n8n
 */
async function importWorkflow(workflowPath) {
  try {
    // Read workflow file
    const absolutePath = path.resolve(workflowPath);
    console.log(`📂 Reading workflow: ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const workflowData = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    console.log(`✅ Loaded workflow: ${workflowData.name}`);

    // Prepare payload - only essential fields accepted by n8n API
    const payload = {
      name: workflowData.name,
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: {}, // Required but must be empty object
    };

    // Add optional fields if present
    if (workflowData.staticData !== undefined) {
      payload.staticData = workflowData.staticData;
    }

    // Store if we should activate after creation
    const shouldActivate = workflowData.active === true;

    // Remove undefined/null fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });

    // Import via API
    console.log(`🚀 Importing to n8n at ${N8N_URL}...`);
    let result = await makeRequest('POST', '/api/v1/workflows', payload);

    console.log(`✅ Successfully imported workflow!`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Name: ${result.name}`);

    // Activate workflow if it was active in the source
    if (shouldActivate && !result.active) {
      console.log(`🔄 Activating workflow...`);
      try {
        await makeRequest('POST', `/api/v1/workflows/${result.id}/activate`, {});
        console.log(`   ✓ Workflow is now ACTIVE`);
      } catch (activateError) {
        console.log(`   ⚠ Could not auto-activate. Activate manually in n8n UI at http://localhost:5678`);
      }
    } else if (result.active) {
      console.log(`   ✓ Workflow is ACTIVE`);
    } else {
      console.log(`   ○ Workflow is INACTIVE - activate it in n8n UI`);
    }

    // Find webhook nodes
    const webhookNodes = result.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
    if (webhookNodes.length > 0) {
      console.log(`\n🌐 Webhook URLs:`);
      webhookNodes.forEach(node => {
        const webhookId = node.webhookId;
        const webhookPath = node.parameters?.path || webhookId;
        console.log(`   ${N8N_URL}/webhook/${webhookPath}`);
      });
    }

    return result;
  } catch (error) {
    console.error(`❌ Error importing workflow:`, error.message);
    if (error.response) {
      console.error(`   Response:`, error.response);
    }
    process.exit(1);
  }
}

/**
 * Make HTTP request to n8n API
 */
function makeRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, N8N_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Add authentication
    if (N8N_API_KEY) {
      options.headers['X-N8N-API-KEY'] = N8N_API_KEY;
    } else {
      // Use basic auth as fallback
      const auth = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');
      options.headers['Authorization'] = `Basic ${auth}`;
    }

    const req = lib.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const error = new Error(parsed.message || `HTTP ${res.statusCode}`);
            error.response = parsed;
            reject(error);
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * List all workflows in n8n
 */
async function listWorkflows() {
  try {
    const workflows = await makeRequest('GET', '/api/v1/workflows');
    console.log(`\n📋 Existing workflows in n8n:`);

    if (workflows.data && workflows.data.length > 0) {
      workflows.data.forEach(wf => {
        const status = wf.active ? '✓ Active' : '○ Inactive';
        console.log(`   ${status} - ${wf.name} (ID: ${wf.id})`);
      });
    } else {
      console.log(`   No workflows found`);
    }

    return workflows;
  } catch (error) {
    console.error(`❌ Error listing workflows:`, error.message);
    throw error;
  }
}

// Main execution
async function main() {
  console.log(`\n🔧 n8n Workflow Import Tool\n`);

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`Usage: node scripts/import-workflow.js <workflow-file.json>`);
    console.log(`Example: node scripts/import-workflow.js workflows/static-scaler-v3-fixed.json\n`);

    // List existing workflows
    try {
      await listWorkflows();
    } catch (error) {
      console.error(`\n⚠️  Could not connect to n8n. Make sure it's running at ${N8N_URL}`);
      console.error(`   Run: docker-compose up -d n8n`);
    }

    process.exit(0);
  }

  const workflowPath = args[0];
  await importWorkflow(workflowPath);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { importWorkflow, listWorkflows };
