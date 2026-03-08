#!/usr/bin/env node

/**
 * Gemini + BannerBear Image Analyzer
 * Analyzes reference images and generates BannerBear template specs
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const BANNERBEAR_API_KEY = process.env.BANNERBEAR_API_KEY || '';
const BANNERBEAR_PROJECT_ID = process.env.BANNERBEAR_PROJECT_ID || '4njglk1qlwwJMQde92';

/**
 * Analyze image with Gemini
 */
async function analyzeImageWithGemini(imagePath) {
  console.log(`📸 Analyzing image: ${imagePath}`);

  // Read and encode image
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const prompt = `Analyze this product marketing image in extreme detail for the purpose of recreating it as a template. Provide a structured analysis:

## LAYOUT & COMPOSITION
- Overall dimensions and aspect ratio
- Main sections (header, body, footer) with % heights
- Grid system used (if any)

## TEXT ELEMENTS
List every text element with:
- Content
- Position (top/center/bottom, left/center/right)
- Font size category (heading/subheading/body)
- Font weight (bold/regular/light)
- Color (hex if possible, or description)

## VISUAL ELEMENTS
### Icons
- Each icon description
- Style (line/filled/gradient)
- Position relative to text
- Size

### Images
- Product photos or graphics
- Arrangement and layout
- Size and positioning

### Badges/Certifications
- Which certification badges
- Position in layout
- Size

## COLOR PALETTE
- Background color
- Primary text color
- Secondary text color
- Accent colors

## DESIGN STYLE
- Modern/minimalist/bold/professional
- Key design principles used
- White space usage

## BANNERBEAR TEMPLATE STRUCTURE
Suggest layer structure for BannerBear:
1. Background layer
2. Text layers (with positions)
3. Image layers (with positions)
4. Icon layers
5. Badge layers

Format your response as JSON when possible for easy parsing.`;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.candidates && parsed.candidates[0]) {
            const analysis = parsed.candidates[0].content.parts[0].text;
            console.log('\n✅ Gemini Analysis Complete!\n');
            resolve(analysis);
          } else {
            reject(new Error('No analysis returned'));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Generate BannerBear template configuration from analysis
 */
function generateBannerBearTemplate(analysis, templateName) {
  console.log(`\n🎨 Generating BannerBear template: ${templateName}`);

  // This would create a template config based on Gemini's analysis
  // For now, return a structure based on the MUD\WTR reference

  return {
    name: templateName,
    width: 1080,
    height: 1080,
    layers: [
      {
        type: 'rectangle',
        name: 'background',
        color: '#D4C5B0', // Warm beige from reference
        x: 0,
        y: 0,
        width: 1080,
        height: 1080
      },
      {
        type: 'text',
        name: 'brand_logo',
        text: '{{brand_name}}',
        font_size: 48,
        font_weight: 'bold',
        color: '#000000',
        x: 540, // centered
        y: 100,
        alignment: 'center'
      },
      {
        type: 'text',
        name: 'benefit_1_icon',
        text: '⚡',
        font_size: 40,
        x: 200,
        y: 220
      },
      {
        type: 'text',
        name: 'benefit_1_text',
        text: '{{benefit_1}}',
        font_size: 28,
        color: '#000000',
        x: 260,
        y: 230
      },
      {
        type: 'text',
        name: 'benefit_2_icon',
        text: '🛡️',
        font_size: 40,
        x: 620,
        y: 220
      },
      {
        type: 'text',
        name: 'benefit_2_text',
        text: '{{benefit_2}}',
        font_size: 28,
        color: '#000000',
        x: 680,
        y: 230
      },
      {
        type: 'text',
        name: 'benefit_3_icon',
        text: '👁️',
        font_size: 40,
        x: 200,
        y: 320
      },
      {
        type: 'text',
        name: 'benefit_3_text',
        text: '{{benefit_3}}',
        font_size: 28,
        color: '#000000',
        x: 260,
        y: 330
      },
      {
        type: 'text',
        name: 'benefit_4_icon',
        text: '🌙',
        font_size: 40,
        x: 620,
        y: 320
      },
      {
        type: 'text',
        name: 'benefit_4_text',
        text: '{{benefit_4}}',
        font_size: 28,
        color: '#000000',
        x: 680,
        y: 330
      },
      {
        type: 'image',
        name: 'product_image',
        image_url: '{{product_image_url}}',
        x: 340,
        y: 450,
        width: 400,
        height: 400
      },
      {
        type: 'text',
        name: 'social_proof',
        text: '★★★★★\n{{review_count}} 5-star Reviews',
        font_size: 24,
        font_weight: 'bold',
        color: '#000000',
        x: 800,
        y: 550,
        alignment: 'center'
      },
      {
        type: 'text',
        name: 'cta_message',
        text: '{{cta_text}}',
        font_size: 20,
        color: '#FFFFFF',
        background_color: '#000000',
        padding: 20,
        x: 540,
        y: 950,
        alignment: 'center'
      }
    ],
    modifications: [
      'brand_name',
      'benefit_1',
      'benefit_2',
      'benefit_3',
      'benefit_4',
      'product_image_url',
      'review_count',
      'cta_text'
    ]
  };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🎨 Gemini + BannerBear Image Analyzer

Usage:
  node gemini-bannerbear-analyzer.js <image_path> [template_name]

Example:
  node gemini-bannerbear-analyzer.js reference.jpg "Product Showcase"

This will:
1. Analyze the reference image with Gemini AI
2. Generate a BannerBear template specification
3. Save the analysis and template config
    `);
    process.exit(0);
  }

  const imagePath = args[0];
  const templateName = args[1] || 'Generated Template';

  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Image not found: ${imagePath}`);
    process.exit(1);
  }

  try {
    // Step 1: Analyze with Gemini
    const analysis = await analyzeImageWithGemini(imagePath);

    // Save analysis
    const analysisPath = `analysis_${Date.now()}.txt`;
    fs.writeFileSync(analysisPath, analysis);
    console.log(`💾 Analysis saved to: ${analysisPath}`);

    // Step 2: Generate BannerBear template
    const template = generateBannerBearTemplate(analysis, templateName);

    // Save template config
    const templatePath = `template_${Date.now()}.json`;
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    console.log(`💾 Template config saved to: ${templatePath}`);

    console.log(`\n✅ Done! Next steps:
1. Review the analysis in: ${analysisPath}
2. Review the template config in: ${templatePath}
3. Create the template in BannerBear dashboard
4. Use the template in n8n workflows\n`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
