#!/usr/bin/env node

/**
 * n8n MCP Server
 * Provides Claude with tools to interact with local n8n instance
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import https from 'https';
import http from 'http';

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Create server instance
const server = new Server(
  {
    name: 'bomb-ecom-n8n',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

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
        'X-N8N-API-KEY': N8N_API_KEY,
      }
    };

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
            reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
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

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_workflows',
        description: 'List all n8n workflows with their status (active/inactive)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_workflow',
        description: 'Get details of a specific workflow by ID',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'The workflow ID',
            },
          },
          required: ['workflowId'],
        },
      },
      {
        name: 'trigger_workflow',
        description: 'Trigger a workflow via webhook (for workflows with webhook triggers)',
        inputSchema: {
          type: 'object',
          properties: {
            webhookPath: {
              type: 'string',
              description: 'The webhook path or ID (e.g., ca26a744-db15-42d4-9986-66154ab84cbb)',
            },
            data: {
              type: 'object',
              description: 'Data to send to the workflow',
            },
          },
          required: ['webhookPath'],
        },
      },
      {
        name: 'activate_workflow',
        description: 'Activate a workflow',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'The workflow ID to activate',
            },
          },
          required: ['workflowId'],
        },
      },
      {
        name: 'deactivate_workflow',
        description: 'Deactivate a workflow',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'The workflow ID to deactivate',
            },
          },
          required: ['workflowId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_workflows': {
        const result = await makeRequest('GET', '/api/v1/workflows');
        const workflows = result.data || [];
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workflows.map(w => ({
                id: w.id,
                name: w.name,
                active: w.active,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt,
              })), null, 2),
            },
          ],
        };
      }

      case 'get_workflow': {
        const workflow = await makeRequest('GET', `/api/v1/workflows/${args.workflowId}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workflow, null, 2),
            },
          ],
        };
      }

      case 'trigger_workflow': {
        const webhookUrl = `${N8N_URL}/webhook/${args.webhookPath}`;
        const lib = webhookUrl.startsWith('https') ? https : http;

        const response = await makeRequest('POST', `/webhook/${args.webhookPath}`, args.data || {});
        return {
          content: [
            {
              type: 'text',
              text: `Workflow triggered successfully:\n${JSON.stringify(response, null, 2)}`,
            },
          ],
        };
      }

      case 'activate_workflow': {
        await makeRequest('POST', `/api/v1/workflows/${args.workflowId}/activate`, {});
        return {
          content: [
            {
              type: 'text',
              text: `Workflow ${args.workflowId} activated successfully`,
            },
          ],
        };
      }

      case 'deactivate_workflow': {
        await makeRequest('POST', `/api/v1/workflows/${args.workflowId}/deactivate`, {});
        return {
          content: [
            {
              type: 'text',
              text: `Workflow ${args.workflowId} deactivated successfully`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('n8n MCP server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
