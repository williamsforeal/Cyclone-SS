# Gemini + BannerBear Image Generator Guide

## Overview

This system analyzes reference images with Gemini AI and generates BannerBear templates to recreate similar designs automatically.

## How It Works

```
Reference Image → Gemini Analysis → Template Spec → BannerBear Template → Generated Images
```

## Quick Start

### Step 1: Analyze Your Reference Image

```bash
node scripts/gemini-bannerbear-analyzer.js "C:\path\to\reference.jpg" "Product Showcase"
```

This will:
- ✅ Analyze layout, colors, text, and design with Gemini
- ✅ Generate template specification
- ✅ Save both analysis and template config

### Step 2: Create BannerBear Template

Go to: https://app.bannerbear.com/projects/4njglk1qlwwJMQde92

Use the generated template config to create your template in the dashboard.

### Step 3: Use in n8n Workflows

Add BannerBear node to your workflow and use the template!

## Template Structure (Based on MUD\WTR Reference)

### Layout Sections
1. **Header** (0-150px): Brand logo/name
2. **Benefits Grid** (150-400px): 4 icon-text pairs
3. **Hero** (400-850px): Product images
4. **Social Proof** (Right side): Reviews
5. **Footer** (850-1080px): Certification badges

### Variables You Can Customize

```javascript
{
  brand_name: "Your Brand",
  benefit_1: "Energy",
  benefit_2: "Immune Support",
  benefit_3: "Focus",
  benefit_4: "Better Sleep",
  product_image_url: "https://...",
  review_count: "25,000",
  cta_text: "Shop Now"
}
```

### Color Palette

- Background: `#D4C5B0` (warm beige)
- Text: `#000000` (black)
- Accents: `#FFFFFF` (white)

## Environment Variables Required

Already configured in your `.env`:

```bash
GEMINI_API_KEY=your_gemini_api_key        # Get from https://aistudio.google.com/app/api-keys
BANNERBEAR_API_KEY=your_bannerbear_key    # Get from BannerBear dashboard
BANNERBEAR_PROJECT_ID=your_project_id     # Get from BannerBear project URL
```

## Example n8n Workflow

```
Airtable Trigger (New Product)
    ↓
Get Product Data
    ↓
BannerBear: Create Image
    - Template: Product Showcase
    - brand_name: {{product_name}}
    - benefit_1: {{benefit1}}
    - product_image_url: {{product_photo}}
    ↓
Upload to S3
    ↓
Update Airtable with Image URL
```

## Tips

1. **Use high-res reference images** (min 1000px)
2. **Test with real data** before automating
3. **Keep fonts consistent** with your brand
4. **Optimize image URLs** (fast CDN links)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Gemini 404 | Use model `gemini-2.5-flash` |
| BannerBear 401 | Check API key in .env |
| Template not found | Create template in dashboard first |
| Image generation slow | Use smaller images, optimize URLs |

## Resources

- [BannerBear Project](https://app.bannerbear.com/projects/4njglk1qlwwJMQde92)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [BannerBear API Docs](https://developers.bannerbear.com/)

## Next Steps

1. ✅ Save your reference image
2. ✅ Run the analyzer script
3. ✅ Review generated template config
4. ✅ Create template in BannerBear
5. ✅ Build n8n workflow
6. ✅ Generate images at scale!

---

**Ready to automate your product images!** 🎨🚀
