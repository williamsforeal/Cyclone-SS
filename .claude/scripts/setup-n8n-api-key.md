# Setting Up n8n API Key for Local Instance

The import script can work with **basic auth** (default) or an **API key** for better security.

## Option 1: Use Basic Auth (Current Setup - Works Now!)

The script will use your existing credentials:
- Username: `admin`
- Password: `changeme`

No additional setup needed! ✅

## Option 2: Set Up API Key (Optional - More Secure)

### Generate API Key in n8n UI

1. Open http://localhost:5678
2. Login with `admin` / `changeme`
3. Click your **profile icon** (bottom left)
4. Go to **Settings** → **API**
5. Click **Create API Key**
6. Copy the generated key

### Add to .env file

```bash
# Add this line to your .env file
N8N_LOCAL_API_KEY=your_generated_api_key_here
```

### Use in scripts

```bash
# Export before running script
export N8N_API_KEY=your_generated_api_key_here

# Or prefix the command
N8N_API_KEY=your_key node scripts/import-workflow.js workflows/my-workflow.json
```

## Testing the Connection

Run without arguments to test:

```bash
node scripts/import-workflow.js
```

This will list all existing workflows in your local n8n instance.
