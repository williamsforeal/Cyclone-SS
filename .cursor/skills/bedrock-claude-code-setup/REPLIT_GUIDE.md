# Replit-Specific Setup Guide

This guide provides detailed steps for configuring AWS Bedrock with Claude Code specifically in Replit environments.

## Why Bedrock API Keys Work Best in Replit

Replit's environment makes Bedrock API keys the optimal choice:

1. **No AWS CLI required** - Replit may not have AWS CLI installed
2. **Simple secret management** - Works perfectly with Replit Secrets
3. **No file system complexity** - Doesn't require `.aws` directory configuration
4. **Easier to share** - Team members can use their own keys

## Step-by-Step Replit Setup

### Phase 1: Get Your Bedrock API Key

1. **Log into AWS Console**
   - Navigate to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)

2. **Enable Bedrock (First-time only)**
   - Go to "Chat/Text playground"
   - Select any Anthropic model
   - Complete the use case form when prompted
   - This enables Bedrock for your AWS account

3. **Create API Key**
   - In Bedrock console, find "API keys" section
   - Click "Create API key"
   - Copy the generated key immediately (you won't see it again)

### Phase 2: Configure Replit Secrets

1. **Open Secrets Panel**
   - Click the lock icon 🔒 in Replit sidebar
   - Or go to Tools → Secrets

2. **Add These Secrets**

   Click "Add secret" for each:

   | Key | Value |
   |-----|-------|
   | `AWS_BEARER_TOKEN_BEDROCK` | Your Bedrock API key |
   | `CLAUDE_CODE_USE_BEDROCK` | `1` |
   | `AWS_REGION` | `us-east-1` |

3. **Verify Secrets Are Set**

   In Replit shell:
   ```bash
   echo $AWS_BEARER_TOKEN_BEDROCK
   echo $CLAUDE_CODE_USE_BEDROCK
   echo $AWS_REGION
   ```

   You should see your values printed (key will be partially masked).

### Phase 3: Install and Configure Claude Code

1. **Install Claude Code** (if not already installed)

   Follow installation instructions for your environment.

2. **Create Settings File** (optional but recommended)

   In your Replit project root, create `.claude-code-settings.json`:

   ```json
   {
     "env": {
       "CLAUDE_CODE_USE_BEDROCK": "1",
       "AWS_REGION": "us-east-1"
     }
   }
   ```

   Note: Secrets from Replit automatically load, so this file is optional.

3. **Restart Claude Code**

   - Close and reopen Claude Code
   - Or restart the Replit environment

### Phase 4: Test Your Setup

Run a simple test:

```bash
# Check that environment variables are accessible
env | grep -E 'AWS|CLAUDE'
```

You should see:
```
CLAUDE_CODE_USE_BEDROCK=1
AWS_REGION=us-east-1
AWS_BEARER_TOKEN_BEDROCK=(your key, possibly masked)
```

Try using Claude Code - it should now authenticate through Bedrock.

## Alternative: Using AWS Access Keys

If you can't use Bedrock API keys, use AWS access keys:

### Get AWS Access Keys

1. Go to AWS IAM Console
2. Select your user
3. Security credentials tab
4. Create access key
5. Choose "Application running outside AWS"
6. Copy both Access Key ID and Secret Access Key

### Add to Replit Secrets

| Key | Value |
|-----|-------|
| `AWS_ACCESS_KEY_ID` | Your access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your secret access key |
| `CLAUDE_CODE_USE_BEDROCK` | `1` |
| `AWS_REGION` | `us-east-1` |

## Common Replit-Specific Issues

### Issue: Environment variables not loading

**Symptom:** `echo $AWS_BEARER_TOKEN_BEDROCK` returns empty

**Solutions:**
1. Verify secret is added in Replit Secrets panel
2. Restart your Replit environment (stop/start)
3. Check secret name matches exactly (case-sensitive)

### Issue: Claude Code can't find credentials

**Symptom:** Authentication errors in Claude Code

**Solutions:**
1. Ensure `CLAUDE_CODE_USE_BEDROCK=1` is set
2. Verify `AWS_REGION` is set
3. Restart Claude Code after adding secrets
4. Check that Bedrock API key is valid (regenerate if needed)

### Issue: Region not supported

**Symptom:** "Model not available in region" error

**Solutions:**
```bash
# Try different regions
AWS_REGION=us-west-2  # Add as Replit secret
# or
AWS_REGION=us-east-1
```

Check available regions:
```bash
aws bedrock list-inference-profiles --region us-east-1
```

### Issue: Replit doesn't persist changes

**Symptom:** Configuration works but resets on Replit restart

**Solutions:**
1. Use Replit Secrets (they persist automatically)
2. Don't use shell `export` commands (they're temporary)
3. Add configuration to `.claude-code-settings.json` in project

## Security Best Practices for Replit

### DO:
✅ Use Replit Secrets for all sensitive values
✅ Limit IAM permissions to minimum required
✅ Use Bedrock API keys over full AWS credentials
✅ Rotate keys regularly
✅ Create separate AWS account for development

### DON'T:
❌ Commit credentials to version control
❌ Share Replit projects with secrets exposed
❌ Use root AWS credentials
❌ Store credentials in code or `.env` files
❌ Share your Bedrock API key with others

## Team Collaboration in Replit

Each team member should:

1. **Use their own AWS credentials**
   - Create individual IAM users
   - Generate separate Bedrock API keys
   - Add keys to their own Replit Secrets

2. **Share configuration files**
   - Commit `.claude-code-settings.json` (without credentials)
   - Share IAM policy requirements
   - Document setup process (link to this skill)

3. **Never share secrets**
   - Each person manages their own Replit Secrets
   - Don't share secret values through Replit sharing
   - Use AWS IAM for access management

## Example Settings for Team Project

**Commit this file:** `.claude-code-settings.json`

```json
{
  "env": {
    "CLAUDE_CODE_USE_BEDROCK": "1",
    "AWS_REGION": "us-east-1"
  }
}
```

**Each team member adds their own secrets:**
- `AWS_BEARER_TOKEN_BEDROCK` (their personal key)

## Quick Troubleshooting Checklist

When Claude Code won't connect:

- [ ] Replit Secrets contains `AWS_BEARER_TOKEN_BEDROCK`
- [ ] Replit Secrets contains `CLAUDE_CODE_USE_BEDROCK=1`
- [ ] Replit Secrets contains `AWS_REGION=us-east-1`
- [ ] Environment variables are accessible (`echo $VAR_NAME`)
- [ ] Bedrock API key is valid (test in AWS console)
- [ ] IAM permissions are correct
- [ ] Claude Code has been restarted
- [ ] No typos in secret names (case-sensitive)

## Testing Your Configuration

### Quick Test Script

Create `test-bedrock.sh`:

```bash
#!/bin/bash

echo "=== Bedrock Configuration Test ==="
echo ""

# Check environment variables
echo "Checking environment variables..."
if [ -z "$CLAUDE_CODE_USE_BEDROCK" ]; then
    echo "❌ CLAUDE_CODE_USE_BEDROCK not set"
else
    echo "✅ CLAUDE_CODE_USE_BEDROCK=$CLAUDE_CODE_USE_BEDROCK"
fi

if [ -z "$AWS_REGION" ]; then
    echo "❌ AWS_REGION not set"
else
    echo "✅ AWS_REGION=$AWS_REGION"
fi

if [ -z "$AWS_BEARER_TOKEN_BEDROCK" ]; then
    echo "❌ AWS_BEARER_TOKEN_BEDROCK not set"
else
    echo "✅ AWS_BEARER_TOKEN_BEDROCK is set (hidden)"
fi

echo ""
echo "If all checks pass, restart Claude Code to apply configuration."
```

Run it:
```bash
chmod +x test-bedrock.sh
./test-bedrock.sh
```

## Getting Help

If you're still having issues:

1. **Check AWS Bedrock status:**
   - Verify your account has Bedrock enabled
   - Check model availability in your region
   - Confirm IAM permissions are correct

2. **Check Replit environment:**
   - Restart the Replit environment
   - Verify secrets are not corrupted
   - Check for typos in secret names

3. **Check Claude Code:**
   - Verify Claude Code version is compatible
   - Check Claude Code logs for specific errors
   - Try disabling and re-enabling Bedrock

4. **Consult documentation:**
   - [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
   - [Claude Code Docs](https://code.claude.com/docs)
   - [Replit Docs](https://docs.replit.com/)
