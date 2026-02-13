# Google Drive Integration Setup

This guide walks through integrating Google Drive with n8n to automate product research call processing.

## What You Have

You downloaded an OAuth credentials JSON file from Google Cloud Console:
```
client_secret_231888702387-kft4apfrq7ut50ac9h73kb7ina9ljodk.apps.googleusercontent.com.json
```

## Step 1: Extract Credentials from JSON

Open the downloaded JSON file. It should look like this:

```json
{
  "web": {
    "client_id": "231888702387-kft4apfrq7ut50ac9h73kb7ina9ljodk.apps.googleusercontent.com",
    "client_secret": "GOCSPX-XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "redirect_uris": ["http://localhost:5678/rest/oauth2-credential/callback"]
  }
}
```

You need two values:
- **Client ID**: `web.client_id`
- **Client Secret**: `web.client_secret`

## Step 2: Update Your .env File

Copy `.env.example` to `.env` if you haven't already:

```bash
cp .env.example .env
```

Then update these lines in `.env`:

```bash
GOOGLE_CLIENT_ID=231888702387-kft4apfrq7ut50ac9h73kb7ina9ljodk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_REDIRECT_URI=http://localhost:5678/rest/oauth2-credential/callback
```

**IMPORTANT**: Never commit your `.env` file. It's already in `.gitignore`.

## Step 3: Configure n8n Credentials

1. **Start n8n** (if not already running):
   ```bash
   docker-compose up -d
   ```

2. **Open n8n** in your browser:
   ```
   http://localhost:5678
   ```

3. **Navigate to Credentials**:
   - Click your profile icon (top-right)
   - Select **Settings**
   - Click **Credentials** in the left sidebar
   - Click **Add Credential** button

4. **Select Google Drive OAuth2 API**:
   - Search for "Google Drive"
   - Select **Google Drive OAuth2 API**

5. **Fill in the credentials**:
   - **Name**: `Google Drive - Product Research`
   - **Client ID**: Paste from `.env` (the full apps.googleusercontent.com address)
   - **Client Secret**: Paste from `.env` (GOCSPX-XXXXXX)
   - **Redirect URI**: `http://localhost:5678/rest/oauth2-credential/callback`

6. **Authorize**:
   - Click **Connect my account**
   - Sign in with your Google account
   - Grant permissions to access Google Drive
   - You should see "✅ Connected"

7. **Save**:
   - Click **Save** to store the credential

## Step 4: Test the Connection

1. **Create a new workflow** in n8n
2. **Add a Google Drive Trigger node**:
   - Click **+** to add node
   - Search "Google Drive Trigger"
   - Select **Google Drive Trigger**
3. **Configure the trigger**:
   - **Credential to connect with**: Select `Google Drive - Product Research`
   - **Trigger On**: `File Created`
   - **Options** → **Folder to Watch**: Select your "Product Research Calls" folder
   - **Options** → **File Extensions**: `mp3,mp4,m4a,wav` (audio/video formats)
4. **Test**:
   - Click **Listen for Test Event**
   - Upload a test file to your Google Drive folder
   - You should see the file details appear in n8n

## Step 5: Build the Automation Workflow

Now you can build the complete pipeline:

### Workflow: Google Drive → Gemini → Claude → Airtable

**Trigger**: Google Drive Trigger (watches folder)
↓
**Step 1**: Download file (Google Drive node)
↓
**Step 2**: Transcribe audio (Gemini API via HTTP Request)
↓
**Step 3**: Extract products (Gemini API via HTTP Request)
- Prompt: Extract all products mentioned with ranking
↓
**Step 4**: Generate search queries (Claude API via HTTP Request)
- Prompt: Create AliExpress validation queries
↓
**Step 5**: Store in Airtable (Airtable node)
- Table: Product Candidates
- Fields: Product Name, Ranking, Search Queries, Source Call

### Example Nodes Configuration

**Node 1: Google Drive Trigger**
```
Trigger On: File Created
Watch Folder: /Product Research Calls
File Extensions: mp3,mp4,m4a,wav
```

**Node 2: Download File**
```
Resource: File
Operation: Download
File ID: {{ $json.id }}
```

**Node 3: Gemini - Transcribe**
```http
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent
Headers:
  Content-Type: application/json
  x-goog-api-key: {{ $env.GEMINI_API_KEY }}
Body:
{
  "contents": [{
    "parts": [
      { "text": "Transcribe this product research call." },
      { "inline_data": {
          "mime_type": "{{ $json.mimeType }}",
          "data": "{{ $binary.data }}"
        }
      }
    ]
  }]
}
```

**Node 4: Gemini - Extract Products**
```http
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent
Headers:
  Content-Type: application/json
  x-goog-api-key: {{ $env.GEMINI_API_KEY }}
Body:
{
  "contents": [{
    "parts": [{
      "text": "Extract all products mentioned in this transcript. Rank them as: Test, Research, or Avoid. Format as JSON.\n\nTranscript: {{ $json.text }}"
    }]
  }]
}
```

**Node 5: Claude - Generate Queries**
```http
POST https://api.anthropic.com/v1/messages
Headers:
  Content-Type: application/json
  x-api-key: {{ $env.OPENAI_API_KEY }}
  anthropic-version: 2023-06-01
Body:
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 2000,
  "messages": [{
    "role": "user",
    "content": "Generate AliExpress search queries for these products:\n\n{{ $json.products }}"
  }]
}
```

**Node 6: Airtable - Store Results**
```
Base: appvPrfjiuXIhdNuW
Table: Product Candidates
Operation: Create
Fields:
  - Product Name: {{ $json.name }}
  - Ranking: {{ $json.ranking }}
  - Search Queries: {{ $json.queries }}
  - Source File: {{ $node["Google Drive Trigger"].json.name }}
  - Extracted At: {{ $now }}
```

## Troubleshooting

### "Invalid redirect_uri"
- Make sure redirect URI in `.env` matches exactly: `http://localhost:5678/rest/oauth2-credential/callback`
- Check that this URI is added to your Google Cloud Console OAuth client

### "Access denied"
- Re-authorize in n8n credentials
- Make sure you granted all Google Drive permissions during OAuth flow

### "Credential not found"
- Make sure you saved the credential with the exact name you're referencing in nodes
- Check that n8n is reading environment variables correctly (restart Docker if needed)

### File upload not triggering workflow
- Check that the folder ID is correct in the trigger node
- Verify the file extension matches your filter
- Make sure the workflow is **Active** (toggle at top-right of workflow)

## Next Steps

1. ✅ Extract credentials from downloaded JSON
2. ✅ Add to `.env` file
3. ⬜ Configure n8n credentials (follow Step 3)
4. ⬜ Test connection (follow Step 4)
5. ⬜ Build automation workflow (follow Step 5)
6. ⬜ Upload a test product research call to trigger the workflow

## Security Notes

- **Never share** your `client_secret` or `.env` file
- **Never commit** OAuth credentials to Git (`.gitignore` protects this)
- **Use environment variables** for all sensitive data
- **Rotate credentials** if they're ever exposed

## Folder Structure

Store the OAuth credentials file safely:
```
Cyclone-SS/
├── .env                          # Your actual credentials (DO NOT COMMIT)
├── .env.example                   # Template with placeholders (safe to commit)
├── credentials/                   # Optional: store OAuth JSON files here
│   └── google-drive-oauth.json   # Rename your downloaded file
└── GOOGLE-DRIVE-SETUP.md         # This guide
```

**Tip**: Create a `credentials/` folder and move your OAuth JSON there for safekeeping. Add `credentials/` to `.gitignore` if needed.
