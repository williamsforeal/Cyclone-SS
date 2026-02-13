---
name: bedrock-claude-code-setup
description: Configure AWS Bedrock authentication for Claude Code in Replit environments. Use when setting up Claude Code with AWS Bedrock, troubleshooting authentication issues, or when the user mentions Bedrock, AWS credentials, Replit, or Claude Code setup.
---

# AWS Bedrock Configuration for Claude Code in Replit

## Quick Start

Configure Claude Code to use AWS Bedrock authentication in Replit with one of these methods:

### Method 1: Bedrock API Keys (Recommended for Replit)

Simplest method without full AWS credentials:

```bash
export AWS_BEARER_TOKEN_BEDROCK=your-bedrock-api-key
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
```

### Method 2: AWS Access Keys

For full AWS SDK access:

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_SESSION_TOKEN=your-session-token  # Optional
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
```

### Method 3: AWS Profile (Not recommended for Replit)

Requires AWS CLI configuration:

```bash
export AWS_PROFILE=your-profile-name
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
```

## Prerequisites Checklist

Before configuring Claude Code, verify:

- [ ] AWS account with Bedrock access enabled
- [ ] Access to Claude models in Bedrock (e.g., Claude Sonnet 4.5)
- [ ] Use case details submitted in Bedrock console (one-time requirement)
- [ ] Appropriate IAM permissions configured
- [ ] For Bedrock API keys: Key generated in AWS console
- [ ] For access keys: Credentials available from AWS IAM

## Environment Variables Reference

### Required Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `CLAUDE_CODE_USE_BEDROCK` | Enable Bedrock integration | `1` |
| `AWS_REGION` | AWS region for Bedrock | `us-east-1` or `us-west-2` |

### Authentication Variables (Choose One Method)

**Bedrock API Key:**
- `AWS_BEARER_TOKEN_BEDROCK`: Your Bedrock API key

**AWS Access Keys:**
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
- `AWS_SESSION_TOKEN`: Optional session token for temporary credentials

**AWS Profile:**
- `AWS_PROFILE`: Name of AWS profile in `~/.aws/config`

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `ANTHROPIC_MODEL` | Override primary model | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` |
| `ANTHROPIC_SMALL_FAST_MODEL` | Override fast model | `us.anthropic.claude-haiku-4-5-20251001-v1:0` |
| `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION` | Region for Haiku model | Value of `AWS_REGION` |
| `DISABLE_PROMPT_CACHING` | Disable prompt caching | Not set (caching enabled) |

## Setting Up in Replit

### Step 1: Add Environment Variables

In your Replit project:

1. Open the "Secrets" tab (lock icon in sidebar)
2. Add each required environment variable as a secret
3. Replit automatically loads these as environment variables

**Example secrets to add:**

```
AWS_BEARER_TOKEN_BEDROCK=your-key-here
CLAUDE_CODE_USE_BEDROCK=1
AWS_REGION=us-east-1
```

### Step 2: Configure Claude Code

Create or update `~/.claude-code-settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_USE_BEDROCK": "1",
    "AWS_REGION": "us-east-1"
  }
}
```

### Step 3: Verify Configuration

Test your setup:

```bash
# Check environment variables are set
echo $CLAUDE_CODE_USE_BEDROCK
echo $AWS_REGION
echo $AWS_BEARER_TOKEN_BEDROCK  # Should show your key

# Restart Claude Code to apply changes
```

## Model Configuration

### Using Default Models

Claude Code uses these defaults with Bedrock:

- **Primary:** `global.anthropic.claude-sonnet-4-5-20250929-v1:0`
- **Small/fast:** `us.anthropic.claude-haiku-4-5-20251001-v1:0`

### Customizing Models

Use inference profile IDs:

```bash
export ANTHROPIC_MODEL='global.anthropic.claude-sonnet-4-5-20250929-v1:0'
export ANTHROPIC_SMALL_FAST_MODEL='us.anthropic.claude-haiku-4-5-20251001-v1:0'
```

Or use application inference profile ARNs:

```bash
export ANTHROPIC_MODEL='arn:aws:bedrock:us-east-2:123456789:application-inference-profile/your-model-id'
```

### Region-Specific Considerations

Some regions don't support all features. If you encounter issues:

```bash
# Override Haiku region if primary region has issues
export ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION=us-west-2
```

## Troubleshooting

### Issue: "Invalid OAuth Request - Missing scope parameter"

**Cause:** Not related to Bedrock. This is a Claude Code authentication error.

**Solution:**
1. Clear browser cookies for Anthropic/Claude sites
2. Try a different browser or incognito/private window
3. If using SSO, check with your Anthropic administrator
4. Note: `/login` and `/logout` are disabled when using Bedrock

### Issue: "On-demand throughput isn't supported"

**Cause:** Model specified directly instead of as inference profile.

**Solution:** Use inference profile ID format:

```bash
# Wrong
export ANTHROPIC_MODEL='claude-sonnet-4-5'

# Correct
export ANTHROPIC_MODEL='global.anthropic.claude-sonnet-4-5-20250929-v1:0'
```

### Issue: Region errors or model not available

**Check model availability:**

```bash
aws bedrock list-inference-profiles --region your-region
```

**Switch to supported region:**

```bash
export AWS_REGION=us-east-1  # or us-west-2
```

### Issue: Credentials expired or invalid

**For API keys:** Regenerate in AWS console and update environment variable

**For access keys:** Check IAM permissions and credential validity

**For profiles:** Run authentication refresh:

```bash
aws sso login --profile your-profile-name
```

### Issue: Prompt caching errors

Prompt caching may not be available in all regions.

**Solution:** Disable prompt caching:

```bash
export DISABLE_PROMPT_CACHING=1
```

## IAM Permissions Required

Your AWS credentials need these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListInferenceProfiles"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:inference-profile/*",
        "arn:aws:bedrock:*:*:application-inference-profile/*",
        "arn:aws:bedrock:*:*:foundation-model/*"
      ]
    }
  ]
}
```

For restrictive permissions, limit Resource to specific inference profile ARNs.

## Getting Bedrock API Keys

Bedrock API keys are the simplest authentication method for Replit:

1. Navigate to AWS Bedrock console
2. Go to API keys section
3. Create new API key
4. Copy the key value
5. Add to Replit secrets as `AWS_BEARER_TOKEN_BEDROCK`

**Security note:** Never commit API keys to version control. Always use Replit Secrets.

## Advanced Configuration

### Settings File Location

Claude Code reads settings from:
- `~/.claude-code-settings.json` (user settings)
- `.claude-code-settings.json` (project settings)

### Example Settings File

```json
{
  "env": {
    "CLAUDE_CODE_USE_BEDROCK": "1",
    "AWS_REGION": "us-east-1",
    "AWS_PROFILE": "myprofile"
  },
  "awsAuthRefresh": "aws sso login --profile myprofile"
}
```

### Auto-Refresh Credentials (Not typical for Replit)

For SSO or corporate identity providers, configure automatic refresh:

```json
{
  "awsAuthRefresh": "aws sso login --profile myprofile",
  "env": {
    "AWS_PROFILE": "myprofile"
  }
}
```

**Notes:**
- `awsAuthRefresh`: Commands that modify `.aws` directory (SSO, config updates)
- `awsCredentialExport`: Commands that output credentials in JSON format
- Interactive input not supported; works with browser-based SSO flows

## First-Time Setup Workflow

For new Bedrock users:

1. **Submit use case details** (one-time per AWS account):
   - Go to Amazon Bedrock console
   - Select "Chat/Text playground"
   - Choose any Anthropic model
   - Fill out the use case form when prompted

2. **Configure IAM permissions:**
   - Create IAM policy with required permissions
   - Attach to your user/role
   - Or generate Bedrock API key (simpler)

3. **Set environment variables:**
   - Add to Replit Secrets
   - Or configure in Claude Code settings file

4. **Test configuration:**
   - Verify variables are accessible
   - Restart Claude Code
   - Test with a simple request

## Quick Reference

### Minimum Configuration (Bedrock API Key)

```bash
export AWS_BEARER_TOKEN_BEDROCK=your-key
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
```

### Minimum Configuration (Access Keys)

```bash
export AWS_ACCESS_KEY_ID=your-key-id
export AWS_SECRET_ACCESS_KEY=your-secret
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
```

### Checking Configuration

```bash
# Verify environment variables
env | grep -E 'AWS|CLAUDE|ANTHROPIC'

# List available inference profiles
aws bedrock list-inference-profiles --region us-east-1
```

## Additional Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Bedrock Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html)
- [Bedrock API Keys Documentation](https://aws.amazon.com/blogs/machine-learning/accelerate-ai-development-with-amazon-bedrock-api-keys/)
- [Claude Code Settings Reference](https://code.claude.com/docs/en/settings)

## Notes

- `AWS_REGION` is required (Claude Code doesn't read from `.aws/config`)
- `/login` and `/logout` commands are disabled when using Bedrock
- Bedrock uses the Invoke API, not the Converse API
- Prompt caching may not be available in all regions
- Consider using dedicated AWS account for cost tracking
