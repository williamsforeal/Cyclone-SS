#!/usr/bin/env node

/**
 * Gumloop MCP Server
 * Provides Claude with tools to interact with Gumloop pipelines
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import https from 'https';

const GUMLOOP_API_KEY = process.env.GUMLOOP_API_KEY || '';
const GUMLOOP_USER_ID = process.env.GUMLOOP_USER_ID || '';
const GUMLOOP_SAVED_ITEM_ID = process.env.GUMLOOP_SAVED_ITEM_ID || '';

// Create server instance
const server = new Server(
  {
    name: 'bomb-ecom-gumloop',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Make HTTP request to Gumloop API
 */
function makeGumloopRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.gumloop.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
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
          reject(new Error(`Parse error: ${e.message}`));
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
        name: 'trigger_pipeline',
        description: 'Trigger a Gumloop pipeline with data',
        inputSchema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              description: 'Data to send to the pipeline (e.g., adType, headline, concept, etc.)',
            },
            savedItemId: {
              type: 'string',
              description: 'Pipeline saved item ID (optional, uses default if not provided)',
            },
          },
          required: ['data'],
        },
      },
      {
        name: 'get_pipeline_status',
        description: 'Get the status of a pipeline run',
        inputSchema: {
          type: 'object',
          properties: {
            runId: {
              type: 'string',
              description: 'The run ID returned from trigger_pipeline',
            },
          },
          required: ['runId'],
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
      case 'trigger_pipeline': {
        const savedItemId = args.savedItemId || GUMLOOP_SAVED_ITEM_ID;
        const endpoint = `/api/v1/start_pipeline?api_key=${GUMLOOP_API_KEY}&user_id=${GUMLOOP_USER_ID}&saved_item_id=${savedItemId}`;

        const result = await makeGumloopRequest('POST', endpoint, args.data);
        return {
          content: [
            {
              type: 'text',
              text: `Pipeline triggered successfully!\n\nRun ID: ${result.run_id}\nWorkbook ID: ${result.workbook_id}\n\nView pipeline: ${result.url}`,
            },
          ],
        };
      }

      case 'get_pipeline_status': {
        // Note: This would require a different Gumloop API endpoint
        // For now, return the run information
        return {
          content: [
            {
              type: 'text',
              text: `To check pipeline status, visit: https://gumloop.com/pipeline?run_id=${args.runId}`,
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
  console.error('Gumloop MCP server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
