# ComfyUI + Vertex AI Integration Guide

## What You Have

I've created **2 ComfyUI workflows** you can import directly:

### 1. **vertex-to-comfyui-basic.json** - Single Image Generation
- Generates 1 image from Vertex AI scene description
- Good for: Testing, quick iterations
- Speed: ~30-60 seconds per image

### 2. **vertex-to-comfyui-batch.json** - Batch 5 Variants
- Generates 5 variants from 1 scene description
- Good for: A/B testing, finding winners
- Speed: ~2-3 minutes for 5 images
- Includes ImageCompare node for side-by-side comparison

---

## How to Import into ComfyUI

### Step 1: Install ComfyUI (if not already)

```bash
# Clone ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install dependencies
pip install -r requirements.txt

# Download Flux Dev model (required)
# Place in: ComfyUI/models/checkpoints/flux/flux1-dev-fp8.safetensors
```

**Or use online ComfyUI:**
- https://www.comfyonline.app/
- https://comfyworkflows.com/run

### Step 2: Import the Workflow

**In ComfyUI interface:**
1. Click **"Load"** button (top right)
2. Navigate to: `c:\1. Business\williamsforeal LLC\repositories\Cyclone-SS\workflows\comfyui\`
3. Select **`vertex-to-comfyui-batch.json`** (recommended to start)
4. Click **Open**

**Or drag & drop:**
- Drag the `.json` file directly onto the ComfyUI canvas

### Step 3: Verify Nodes Loaded

You should see:
- ✅ CheckpointLoaderSimple (loads Flux model)
- ✅ 2x CLIPTextEncode (positive & negative prompts)
- ✅ EmptyLatentImage (defines output size & batch)
- ✅ KSampler (generation settings)
- ✅ VAEDecode (converts latent to image)
- ✅ SaveImage (saves to disk)
- ✅ PreviewImage (shows in UI)
- ✅ ImageCompare (batch workflow only)
- ✅ Multiple Note nodes (instructions)

---

## How to Use with Vertex AI Output

### Workflow: Vertex AI → ComfyUI → Airtable

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Vertex AI (n8n)                                          │
│    Upload static ad → Analyze → Get 3 scene descriptions   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Copy Scene Description                                   │
│    Asset A: "A split-screen composition..."                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ComfyUI (this workflow)                                  │
│    Paste description → Generate 5 variants → Compare        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Output                                                   │
│    ComfyUI/output/vertex_ai_batch_00001.png through 00005  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. n8n (auto-upload to Airtable)                           │
│    Watch folder → Upload images → Link to product record   │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step: Generate Images from Vertex AI Output

**1. Run Vertex AI Analysis in n8n:**
- Upload your static ad
- Vertex AI returns 3 assets (A, B, C) with scene descriptions

**Example Vertex AI Output:**
```markdown
#### **Asset A – The Micro-Dramatization (Visceral)**
- **Visual Directive (Fal.ai Ready):**
  - *Subject:* A split-screen composition. On the left, a man in his 30s...
  - *Lighting:* Left side features harsh, cool-toned fluorescent light...
  - *Composition:* A clean vertical line divides the 1080x1080 frame...
```

**2. Extract the Full Scene Description:**

Combine Subject + Lighting + Composition into one paragraph:

```
A split-screen composition. On the left, a man in his 30s at an office desk, clutching his head, with an anxious expression; a generic coffee cup sits beside him. On the right, the same man, now looking calm and focused, holding a branded mug. Left side features harsh, cool-toned fluorescent light creating deep shadows. Right side is illuminated by warm, natural window light. A clean vertical line divides the frame. The left half is desaturated and cool; the right half is warm and vibrant.
```

**3. Paste into ComfyUI Positive Prompt Node:**
- In ComfyUI, find the green **CLIPTextEncode** node (node #2)
- **Replace the example text** with your Vertex AI scene description
- Keep it as ONE paragraph (ComfyUI handles multi-line fine)

**4. (Optional) Customize Settings:**

| Node | Parameter | Default | What to Adjust |
|------|-----------|---------|----------------|
| **EmptyLatentImage** | batch_size | 5 | Change to 3 (faster) or 10 (more variants) |
| **EmptyLatentImage** | width x height | 1024 x 1280 | Keep as-is (4:5 for IG Feed) |
| **KSampler** | seed | 42 | Change for different results |
| **KSampler** | steps | 25 | Lower = faster (20), Higher = quality (30) |
| **KSampler** | cfg | 7.5 | Lower = creative (6), Higher = strict (9) |

**5. Generate:**
- Click **"Queue Prompt"** button (top right)
- Watch the progress in the UI
- 5 images will appear in PreviewImage node when done

**6. Compare & Select Winners:**
- Use **ImageCompare** node to view all 5 side-by-side
- Pick your 1-2 favorites
- Images are auto-saved to: `ComfyUI/output/vertex_ai_batch_00001.png` etc.

**7. Repeat for Assets B & C:**
- Paste Asset B scene description → Queue Prompt → Get 5 more
- Paste Asset C scene description → Queue Prompt → Get 5 more
- **Total: 15 images** (5 per asset)

---

## Advanced: n8n + ComfyUI API Integration

### Option 1: File Watcher (Simpler)

**n8n Workflow:**
```
File Trigger (watches ComfyUI/output/)
  ↓
When new image appears
  ↓
Read file (binary)
  ↓
Upload to Airtable (Attachments field)
  ↓
Link to Product record
```

**Pros:**
- Simple, no API needed
- Works with manual ComfyUI usage

**Cons:**
- Requires ComfyUI and n8n on same machine
- Manual workflow in ComfyUI

### Option 2: ComfyUI API (Automated)

**n8n calls ComfyUI API directly:**

```javascript
// n8n HTTP Request node
POST http://localhost:8188/prompt

{
  "prompt": {
    "3": { // KSampler node ID
      "inputs": {
        "seed": Math.floor(Math.random() * 1000000),
        "steps": 25,
        "cfg": 7.5,
        "sampler_name": "euler",
        "scheduler": "normal",
        "denoise": 1,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler"
    },
    "6": { // Positive Prompt node ID
      "inputs": {
        "text": VERTEX_AI_SCENE_DESCRIPTION_HERE,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    }
    // ... other nodes
  }
}
```

**Full n8n → ComfyUI API workflow:**
```
Webhook (trigger with scene description)
  ↓
Build ComfyUI API payload (JavaScript)
  ↓
POST to ComfyUI API (HTTP Request)
  ↓
Wait for generation (via websocket or polling)
  ↓
Fetch generated images (HTTP Request)
  ↓
Upload to Airtable
```

**Pros:**
- Fully automated
- No manual ComfyUI interaction
- Scales to 100s of images

**Cons:**
- More complex setup
- Requires ComfyUI server running
- Need to understand ComfyUI API format

---

## Settings Explained

### Image Size (EmptyLatentImage node)

| Platform | Aspect Ratio | Width x Height | Use |
|----------|--------------|----------------|-----|
| IG Feed | 4:5 | 1024 x 1280 | **Default** (most versatile) |
| IG Story | 9:16 | 576 x 1024 | Full-screen mobile |
| IG Square | 1:1 | 1024 x 1024 | Classic feed post |
| TikTok | 9:16 | 576 x 1024 | Vertical video format |
| Facebook | 4:5 | 1024 x 1280 | Same as IG Feed |

**To change:**
- Click **EmptyLatentImage** node
- Edit **width** and **height** values
- Keep both divisible by 64 (Flux requirement)

### Batch Size

**batch_size = 1:** Single image (fast, ~30-60 sec)
**batch_size = 5:** 5 variants (default, ~2-3 min) ← **Recommended**
**batch_size = 10:** 10 variants (slower, ~5-6 min)

**VRAM Requirements:**
- Batch 1-5: Works on 8GB VRAM (RTX 3060, M1 Mac)
- Batch 6-10: Needs 12GB+ VRAM (RTX 3080, M1 Pro)
- Batch 10+: Needs 16GB+ VRAM (RTX 4090, M1 Max)

### Seed Mode

| Mode | Effect | Use Case |
|------|--------|----------|
| **increment** | Seeds: 42, 43, 44, 45, 46 | Consistent variations (default) |
| **randomize** | Seeds: random each time | Maximum variation |
| **fixed** | Seeds: 42, 42, 42, 42, 42 | Testing (generates same image) |

**Recommendation:** Keep **increment** for A/B testing.

### Steps & CFG

**Steps (quality vs speed):**
- 15-20: Fast, good for testing
- 25-30: **Recommended** (balanced)
- 35-50: Maximum quality (diminishing returns)

**CFG (prompt adherence):**
- 5-6: Creative, loose interpretation
- 7-8: **Recommended** (balanced)
- 9-12: Strict adherence (may look artificial)

---

## Troubleshooting

### Issue: "Model not found"
**Solution:**
1. Download Flux Dev model: https://huggingface.co/black-forest-labs/FLUX.1-dev
2. Place in: `ComfyUI/models/checkpoints/flux/`
3. Or change model in CheckpointLoaderSimple node to one you have

### Issue: "Out of memory"
**Solution:**
- Reduce batch_size (try 3 or 1)
- Close other GPU apps
- Use `--lowvram` flag when starting ComfyUI

### Issue: Images don't match Vertex AI description
**Solution:**
- Check that you copied the FULL scene description (Subject + Lighting + Composition)
- Increase CFG (try 8.5 or 9)
- Increase steps (try 30)
- Add more details to negative prompt

### Issue: Images look too polished/fake
**Solution:**
- Add to negative prompt: `professional studio lighting, overly polished, filters, retouching, fake, artificial`
- Lower CFG (try 6.5)
- Add to positive prompt: `iPhone photo, raw, natural lighting, authentic`

### Issue: Can't find output images
**Solution:**
- Images saved to: `ComfyUI/output/`
- Filename pattern: `vertex_ai_batch_00001.png`
- Check SaveImage node widget for custom prefix

---

## Next Steps

### 1. Test the Basic Workflow
- Import **vertex-to-comfyui-batch.json**
- Use the example Vertex AI output from `Vertex-analysis.md`
- Generate 5 variants of Asset A
- Verify quality and speed

### 2. Integrate with n8n
- **Option A (simple):** Use File Trigger to watch ComfyUI/output/
- **Option B (advanced):** Build n8n → ComfyUI API integration

### 3. Add ControlNet (Optional)
- For pose-perfect cloning
- Requires ControlNet models
- See your **COMFYUI-AGENT-FINDINGS.md** for architecture

### 4. Build Workflow Variants
From your findings document, build:
- WF-Clone-Basic: Simple product swap
- WF-Clone-Batch: Multi-variant generator (this one!)
- WF-Clone-Precise: ControlNet edition
- WF-Clone-Multi-Product: Batch across products

---

## Resources

### Your Existing Files
- [COMFYUI-AGENT-FINDINGS.md](../COMFYUI-AGENT-FINDINGS.md) - Full analysis
- [Vertex-analysis.md](../Vertex-analysis.md) - Example output
- [CONVERT-TO-VERTEX-AI.md](../CONVERT-TO-VERTEX-AI.md) - Migration guide

### ComfyUI Resources
- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [ComfyUI Workflows](https://comfyworkflows.com/)
- [Flux Dev Model](https://huggingface.co/black-forest-labs/FLUX.1-dev)

### Integration
- [n8n ComfyUI Integration](https://community.n8n.io/t/comfyui-integration/32478)
- [ComfyUI API Docs](https://github.com/comfyanonymous/ComfyUI/wiki/API)

---

## Quick Reference

### Typical Generation Times

| Workflow | Batch Size | Steps | Time | VRAM |
|----------|------------|-------|------|------|
| Basic | 1 | 25 | ~45 sec | 6GB |
| Batch | 5 | 25 | ~3 min | 8GB |
| Batch | 10 | 30 | ~7 min | 12GB |

### Image Sizes Reference

```
IG Feed (4:5):     1024 x 1280  ← Default
IG Story (9:16):   576 x 1024
IG Square (1:1):   1024 x 1024
TikTok (9:16):     576 x 1024
Facebook (4:5):    1024 x 1280
```

### Recommended Settings

```
Model: flux1-dev-fp8.safetensors
Batch Size: 5
Width: 1024
Height: 1280
Seed Mode: increment
Steps: 25
CFG: 7.5
Sampler: euler
Scheduler: normal
```

### File Paths

```
Workflows:     Cyclone-SS/workflows/comfyui/*.json
Output Images: ComfyUI/output/vertex_ai_batch_*.png
Models:        ComfyUI/models/checkpoints/flux/
```

---

## Summary

You now have:
- ✅ 2 ComfyUI workflows (basic + batch)
- ✅ Integration with Vertex AI scene descriptions
- ✅ Batch generation (5 variants per asset)
- ✅ ImageCompare for picking winners
- ✅ n8n integration options (file watcher or API)
- ✅ Complete settings guide

**Recommended Flow:**
1. Analyze static ad with Vertex AI (n8n) → Get 3 scene descriptions
2. Import ComfyUI batch workflow → Paste each scene description
3. Generate 15 total variants (5 per asset: A, B, C)
4. Use ImageCompare to pick 3 best (one from each asset)
5. Upload to Airtable for Meta Ads testing

Ready to generate your first batch? Import **vertex-to-comfyui-batch.json** and paste your Vertex AI output!
