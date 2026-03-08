#!/usr/bin/env node

/**
 * Airtable MCP Server
 * Provides Claude with tools to interact with Airtable base
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import https from 'https';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appvPrfjiuXIhdNuW';

// Create server instance
const server = new Server(
  {
    name: 'bomb-ecom-airtable',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Make HTTP request to Airtable API
 */
function makeAirtableRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.airtable.com',
      port: 443,
      path: `/v0/${AIRTABLE_BASE_ID}/${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
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
            reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}`));
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
        name: 'list_records',
        description: 'List records from a table in Static Scaler 1000 base',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name (e.g., "Ad Copy", "Products", "Concepts")',
            },
            maxRecords: {
              type: 'number',
              description: 'Maximum number of records to return (default: 10)',
            },
            view: {
              type: 'string',
              description: 'View name to filter by (optional)',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'get_record',
        description: 'Get a specific record by ID',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name',
            },
            recordId: {
              type: 'string',
              description: 'Record ID',
            },
          },
          required: ['table', 'recordId'],
        },
      },
      {
        name: 'create_record',
        description: 'Create a new record in a table',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name',
            },
            fields: {
              type: 'object',
              description: 'Record fields as key-value pairs',
            },
          },
          required: ['table', 'fields'],
        },
      },
      {
        name: 'update_record',
        description: 'Update an existing record',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name',
            },
            recordId: {
              type: 'string',
              description: 'Record ID',
            },
            fields: {
              type: 'object',
              description: 'Fields to update',
            },
          },
          required: ['table', 'recordId', 'fields'],
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
      case 'list_records': {
        const params = new URLSearchParams();
        if (args.maxRecords) params.append('maxRecords', args.maxRecords);
        if (args.view) params.append('view', args.view);

        const queryString = params.toString();
        const endpoint = `${encodeURIComponent(args.table)}${queryString ? '?' + queryString : ''}`;

        const result = await makeAirtableRequest('GET', endpoint);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.records, null, 2),
            },
          ],
        };
      }

      case 'get_record': {
        const endpoint = `${encodeURIComponent(args.table)}/${args.recordId}`;
        const result = await makeAirtableRequest('GET', endpoint);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_record': {
        const endpoint = encodeURIComponent(args.table);
        const body = {
          fields: args.fields,
        };
        const result = await makeAirtableRequest('POST', endpoint, body);
        return {
          content: [
            {
              type: 'text',
              text: `Record created successfully:\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case 'update_record': {
        const endpoint = `${encodeURIComponent(args.table)}/${args.recordId}`;
        const body = {
          fields: args.fields,
        };
        const result = await makeAirtableRequest('PATCH', endpoint, body);
        return {
          content: [
            {
              type: 'text',
              text: `Record updated successfully:\n${JSON.stringify(result, null, 2)}`,
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
  console.error('Airtable MCP server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
