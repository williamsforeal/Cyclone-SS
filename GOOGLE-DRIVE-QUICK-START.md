# Google Drive Integration - Quick Start ⚡

Your credentials are now configured! Follow these steps to complete the setup.

## ✅ What's Already Done

- ✅ Google OAuth client created in Cloud Console
- ✅ Client ID and Secret extracted from JSON
- ✅ Credentials added to `.env` file
- ✅ Project ID saved

## 🔴 CRITICAL: Add Redirect URI to Google Cloud Console

**Before you can authorize n8n, you MUST add the redirect URI:**

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your project: `gen-lang-client-0234791928`
3. Click on your OAuth 2.0 Client ID: `231888702387-kft4apfrq7ut50ac9h73kb7ina9ljodk.apps.googleusercontent.com`
4. Under **Authorized redirect URIs**, click **+ ADD URI**
5. Add this exact URI:
   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```
6. Click **SAVE**

**Why this matters:** Your JSON file shows JavaScript origins for production domains (bombecom.com, abundria.store), but localhost redirect is missing. Without it, n8n authorization will fail with "Invalid redirect_uri" error.

## 📋 Current Configuration

Your `.env` file now contains:

```bash
GOOGLE_CLIENT_ID=231888702387-kft4apfrq7ut50ac9h73kb7ina9ljodk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:5678/rest/oauth2-credential/callback
GOOGLE_PROJECT_ID=gen-lang-client-0234791928
```

## 🚀 Next Steps

### Step 1: Restart n8n (to load new env vars)

```bash
docker-compose down
docker-compose up -d
```

### Step 2: Configure n8n Credentials

1. Open n8n: http://localhost:5678
2. Go to **Settings** → **Credentials**
3. Click **Add Credential**
4. Search for and select: **Google Drive OAuth2 API**
5. Fill in:
   - **Name**: `Google Drive - Product Research`
   - **Client ID**: `231888702387-kft4apfrq7ut50ac9h73kb7ina9ljodk.apps.googleusercontent.com`
   - **Client Secret**: `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`
6. Click **Connect my account**
7. Sign in with Google
8. Grant permissions
9. Verify "✅ Connected" appears
10. Click **Save**

### Step 3: Enable Google Drive API

Make sure the Google Drive API is enabled for your project:

1. Go to [Google Cloud Console API Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Drive API"
3. Click **Enable** (if not already enabled)

### Step 4: Test the Connection

Create a simple test workflow:

1. In n8n, create **New Workflow**
2. Add **Google Drive Trigger** node
3. Select credential: `Google Drive - Product Research`
4. Configure:
   - **Trigger On**: File Created
   - **Watch Folder**: Select your "Product Research Calls" folder
5. Click **Listen for Test Event**
6. Upload a test file to the folder
7. Verify the file data appears in n8n

## 🎯 What This Enables

Once configured, you can build the automation pipeline:

```
Google Drive (new file uploaded)
  ↓
Download file
  ↓
Gemini AI (transcribe + extract products)
  ↓
Claude AI (generate search queries)
  ↓
Airtable (store for validation)
```

## 📚 Full Documentation

For detailed workflow examples and troubleshooting, see:
- [GOOGLE-DRIVE-SETUP.md](GOOGLE-DRIVE-SETUP.md) - Complete setup guide
- Full workflow code examples
- Troubleshooting common issues

## ⚠️ Important Notes

1. **Missing Gemini API Key**: You'll need to add your Gemini API key to `.env`:
   ```bash
   GEMINI_API_KEY=your-actual-gemini-key
   ```
   Get it from: https://aistudio.google.com/app/apikey

2. **Security**: Never commit `.env` file (it's already in `.gitignore`)

3. **Production vs Development**:
   - Local development: Uses `localhost:5678` redirect
   - Production: Add production redirect URIs when deploying

## ✅ Checklist

Before starting the automation workflow, verify:

- [ ] Redirect URI added to Google Cloud Console
- [ ] Google Drive API enabled in Cloud Console
- [ ] n8n restarted with new environment variables
- [ ] n8n credentials configured and authorized
- [ ] Test workflow successfully triggers on file upload
- [ ] Gemini API key added to `.env` (for product extraction)

Once all items are checked, you're ready to build the full automation workflow!
