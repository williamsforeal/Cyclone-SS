# Bomb Ecom OS - MCP Servers

Custom MCP (Model Context Protocol) servers that extend Claude Code with Bomb Ecom OS capabilities.

## Available Servers

### 1. n8n Server (`bomb-ecom-n8n`)
Interact with your local n8n instance.

**Tools:**
- `list_workflows` - List all workflows with status
- `get_workflow` - Get workflow details by ID
- `trigger_workflow` - Trigger a workflow via webhook
- `activate_workflow` - Activate a workflow
- `deactivate_workflow` - Deactivate a workflow

**Example Usage:**
```
"List all n8n workflows"
"Trigger the Static Scaler workflow with this data: ..."
"Activate workflow ID xyz123"
```

### 2. Airtable Server (`bomb-ecom-airtable`)
Interact with the Static Scaler 1000 Airtable base.

**Tools:**
- `list_records` - List records from a table
- `get_record` - Get a specific record
- `create_record` - Create a new record
- `update_record` - Update an existing record

**Example Usage:**
```
"List the latest 5 Ad Copy records from Airtable"
"Get record ID rec123 from the Products table"
"Create a new concept in Airtable with these fields: ..."
```

## Configuration

All servers are configured in `~/.claude/mcp.json` with environment variables from the project's `.env` file.

## Testing

To test if the servers are working, restart Claude Code and try:

```
"List my n8n workflows"
"Show me records from the Ad Copy table in Airtable"
```

## Troubleshooting

If tools don't appear:
1. Restart Claude Code completely
2. Check `~/.claude/mcp.json` configuration
3. Verify `.env` file has all required API keys
4. Check server logs in Claude Code console

## Development

To modify a server:
1. Edit the corresponding `.js` file
2. Restart Claude Code to reload the server
3. Test the updated tools

## Architecture

```
Claude Code
    ↓
MCP Servers (n8n, Airtable)
    ↓
Local APIs & Cloud Services
    ↓
Bomb Ecom OS Platform
```

These servers act as a bridge between Claude's natural language interface and your automation infrastructure.
