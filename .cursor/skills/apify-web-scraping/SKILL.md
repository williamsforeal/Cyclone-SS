---
name: apify-web-scraping
description: Build web scrapers using Apify platform with Puppeteer/Playwright. Use when scraping websites, extracting data from web pages, automating browsers, or when the user mentions Apify, web scraping, Puppeteer, Playwright, or data extraction.
---

# Apify Web Scraping

Build production-ready web scrapers using the Apify platform with Puppeteer and Playwright for browser automation.

## Quick Start

### Setup Apify Project

```bash
# Install Apify CLI
npm install -g apify-cli

# Initialize new Actor
apify init

# Login to Apify
apify login
```

### Choose Your Framework

**Playwright (Recommended)** - Newer, better docs, more features:
```javascript
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://example.com');
```

**Puppeteer** - Similar API, slightly older:
```javascript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://example.com');
```

## Core Scraping Patterns

### 1. Extract Data from Elements

```javascript
// Wait for and select elements
await page.waitForSelector('.product-item');
const products = await page.$$('.product-item');

// Extract text content
const title = await page.$eval('.product-title', el => el.textContent);

// Extract multiple items
const prices = await page.$$eval('.price', elements => 
  elements.map(el => el.textContent.trim())
);

// Extract attributes
const imageUrl = await page.$eval('img', el => el.src);
```

### 2. Interact with Pages

```javascript
// Click elements
await page.click('button.load-more');

// Type into inputs
await page.type('input[name="search"]', 'query text');
await page.fill('input[name="email"]', 'user@example.com'); // Playwright only

// Select from dropdown
await page.selectOption('select#category', 'electronics');

// Scroll to load content
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
```

### 3. Wait for Content

```javascript
// Wait for selector
await page.waitForSelector('.dynamic-content');

// Wait for navigation
await page.waitForNavigation({ waitUntil: 'networkidle' });

// Wait for specific condition
await page.waitForFunction(() => document.querySelectorAll('.item').length > 10);

// Simple timeout
await page.waitForTimeout(2000);
```

### 4. Handle Multiple Pages

```javascript
// Get all links
const links = await page.$$eval('a.product-link', elements => 
  elements.map(el => el.href)
);

// Visit each link
for (const link of links) {
  await page.goto(link);
  const data = await extractData(page);
  // Store data
}
```

## Apify Platform Integration

### Actor Structure

```
my-scraper/
├── src/
│   └── main.js          # Entry point
├── .actor/
│   ├── actor.json       # Actor configuration
│   └── input_schema.json # Input parameters
├── package.json
└── README.md
```

### Actor Input Schema

Define user inputs in `.actor/input_schema.json`:

```json
{
  "title": "My Scraper Input",
  "type": "object",
  "schemaVersion": 1,
  "properties": {
    "startUrls": {
      "title": "Start URLs",
      "type": "array",
      "description": "URLs to scrape",
      "editor": "requestListSources"
    },
    "maxItems": {
      "title": "Max items",
      "type": "integer",
      "description": "Maximum items to scrape",
      "default": 100
    }
  }
}
```

### Main Actor Code

```javascript
import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();

const input = await Actor.getInput();
const { startUrls, maxItems } = input;

const browser = await chromium.launch({
  headless: true
});

try {
  for (const url of startUrls) {
    const page = await browser.newPage();
    await page.goto(url.url);
    
    // Extract data
    const data = await page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent,
        price: document.querySelector('.price')?.textContent
      };
    });
    
    // Save to dataset
    await Actor.pushData(data);
  }
} finally {
  await browser.close();
  await Actor.exit();
}
```

## Data Storage

### Push to Dataset

```javascript
// Single item
await Actor.pushData({
  title: 'Product Name',
  price: '$99.99',
  url: 'https://example.com/product'
});

// Multiple items
await Actor.pushData([
  { title: 'Item 1', price: '$10' },
  { title: 'Item 2', price: '$20' }
]);
```

### Key-Value Store

```javascript
// Store arbitrary data
await Actor.setValue('state', { lastProcessedUrl: url });

// Retrieve data
const state = await Actor.getValue('state');
```

## Proxy Configuration

```javascript
// Use Apify proxy
const proxyConfiguration = await Actor.createProxyConfiguration({
  groups: ['RESIDENTIAL'],
  countryCode: 'US'
});

const proxyUrl = await proxyConfiguration.newUrl();

const browser = await chromium.launch({
  proxy: {
    server: proxyUrl
  }
});
```

## Common Scraping Patterns

### E-commerce Product Scraping

```javascript
async function scrapeProduct(page) {
  await page.waitForSelector('.product-detail');
  
  return await page.evaluate(() => {
    const getPrice = (selector) => {
      const text = document.querySelector(selector)?.textContent || '';
      return parseFloat(text.replace(/[^0-9.]/g, ''));
    };
    
    return {
      title: document.querySelector('h1.product-title')?.textContent?.trim(),
      price: getPrice('.price'),
      description: document.querySelector('.description')?.textContent?.trim(),
      images: Array.from(document.querySelectorAll('.product-image img'))
        .map(img => img.src),
      inStock: !document.querySelector('.out-of-stock')
    };
  });
}
```

### Pagination Handling

```javascript
async function scrapeAllPages(page, startUrl) {
  const allData = [];
  let currentPage = 1;
  
  while (true) {
    await page.goto(`${startUrl}?page=${currentPage}`);
    
    const items = await page.$$eval('.item', elements =>
      elements.map(el => ({
        title: el.querySelector('.title')?.textContent,
        link: el.querySelector('a')?.href
      }))
    );
    
    if (items.length === 0) break;
    
    allData.push(...items);
    currentPage++;
  }
  
  return allData;
}
```

### Infinite Scroll

```javascript
async function scrapeInfiniteScroll(page) {
  let previousHeight = 0;
  
  while (true) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) break;
    
    previousHeight = newHeight;
  }
  
  return await page.$$eval('.item', elements =>
    elements.map(el => ({
      title: el.querySelector('.title')?.textContent
    }))
  );
}
```

## Testing Locally

```bash
# Run actor locally
apify run

# Test with input
apify run --input '{"startUrls": [{"url": "https://example.com"}]}'

# Push to Apify platform
apify push
```

## Best Practices

### 1. Error Handling

```javascript
try {
  await page.goto(url, { timeout: 30000 });
} catch (error) {
  console.error(`Failed to load ${url}:`, error.message);
  await Actor.pushData({ url, error: error.message });
}
```

### 2. Rate Limiting

```javascript
// Add delays between requests
await page.waitForTimeout(1000 + Math.random() * 2000);
```

### 3. Headless vs Headful

```javascript
// Development: see what's happening
const browser = await chromium.launch({ headless: false });

// Production: faster, less resources
const browser = await chromium.launch({ headless: true });
```

### 4. Clean Data

```javascript
function cleanPrice(priceText) {
  return parseFloat(priceText.replace(/[^0-9.]/g, ''));
}

function cleanText(text) {
  return text?.trim().replace(/\s+/g, ' ') || '';
}
```

## Troubleshooting

### Element Not Found

```javascript
// Wait for element before interacting
await page.waitForSelector('.target-element', { timeout: 10000 });

// Check if element exists
const exists = await page.$('.target-element') !== null;
```

### Dynamic Content Not Loading

```javascript
// Wait for network to be idle
await page.goto(url, { waitUntil: 'networkidle' });

// Wait for specific condition
await page.waitForFunction(() => 
  document.querySelectorAll('.loaded-item').length > 0
);
```

### Anti-Scraping Detection

```javascript
// Use residential proxies
const proxyConfiguration = await Actor.createProxyConfiguration({
  groups: ['RESIDENTIAL']
});

// Add realistic delays
await page.waitForTimeout(2000 + Math.random() * 3000);

// Set user agent
await page.setExtraHTTPHeaders({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});
```

## Additional Resources

- For Google Cloud deployment, see [apify-google-cloud-deploy](apify-google-cloud-deploy/SKILL.md)
- For advanced scraping patterns, see [advanced-scraping-patterns](advanced-scraping-patterns/SKILL.md)
- Apify Documentation: https://docs.apify.com
- Playwright Docs: https://playwright.dev/docs/intro
- Puppeteer Docs: https://pptr.dev
