---
name: advanced-scraping-patterns
description: Advanced web scraping techniques including anti-scraping bypass, dynamic content handling, and data extraction patterns. Use when dealing with complex scraping challenges, anti-bot protection, JavaScript-heavy sites, or when basic scraping fails.
---

# Advanced Scraping Patterns

Advanced techniques for handling complex web scraping scenarios, anti-scraping measures, and dynamic content.

## Anti-Scraping Bypass Techniques

### 1. Browser Fingerprinting Evasion

```javascript
// Playwright - Use stealth mode
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage'
  ]
});

const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  viewport: { width: 1920, height: 1080 },
  locale: 'en-US',
  timezoneId: 'America/New_York'
});
```

### 2. Rotating Proxies

```javascript
// With Apify proxy
const proxyConfiguration = await Actor.createProxyConfiguration({
  groups: ['RESIDENTIAL'],
  countryCode: 'US'
});

const browser = await chromium.launch({
  proxy: {
    server: await proxyConfiguration.newUrl()
  }
});

// Rotate proxy for each request
for (const url of urls) {
  const page = await browser.newPage({
    proxy: {
      server: await proxyConfiguration.newUrl()
    }
  });
  await page.goto(url);
}
```

### 3. Human-Like Behavior

```javascript
async function humanLikeClick(page, selector) {
  const element = await page.$(selector);
  const box = await element.boundingBox();
  
  // Move mouse gradually
  await page.mouse.move(
    box.x + box.width / 2,
    box.y + box.height / 2,
    { steps: 10 }
  );
  
  // Random delay before click
  await page.waitForTimeout(100 + Math.random() * 200);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function humanLikeTyping(page, selector, text) {
  await page.click(selector);
  
  for (const char of text) {
    await page.keyboard.type(char);
    // Random typing speed
    await page.waitForTimeout(50 + Math.random() * 150);
  }
}
```

### 4. Handling CAPTCHA

```javascript
// Option 1: Use CAPTCHA solving service
import { Actor } from 'apify';

async function solveCaptcha(page) {
  const siteKey = await page.$eval('[data-sitekey]', el => el.dataset.sitekey);
  
  // Use Apify's CAPTCHA solver
  const solution = await Actor.call('captcha-solver', {
    siteKey,
    pageUrl: page.url()
  });
  
  await page.evaluate((token) => {
    document.querySelector('[name="g-recaptcha-response"]').value = token;
  }, solution.token);
}

// Option 2: Wait for manual solving (development)
async function waitForManualCaptcha(page) {
  console.log('Waiting for manual CAPTCHA solving...');
  await page.waitForFunction(() => 
    !document.querySelector('.g-recaptcha')
  , { timeout: 120000 });
}
```

## Dynamic Content Handling

### 1. Infinite Scroll with Detection

```javascript
async function scrapeInfiniteScroll(page, itemSelector) {
  const items = new Set();
  let noNewItemsCount = 0;
  
  while (noNewItemsCount < 3) {
    // Get current items
    const currentItems = await page.$$eval(itemSelector, elements =>
      elements.map(el => el.getAttribute('data-id'))
    );
    
    const previousSize = items.size;
    currentItems.forEach(id => items.add(id));
    
    // Check if new items were loaded
    if (items.size === previousSize) {
      noNewItemsCount++;
    } else {
      noNewItemsCount = 0;
    }
    
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for potential new content
    await page.waitForTimeout(2000);
  }
  
  return Array.from(items);
}
```

### 2. Lazy Loading Images

```javascript
async function loadAllImages(page) {
  await page.evaluate(async () => {
    const images = document.querySelectorAll('img[data-src]');
    
    for (const img of images) {
      // Scroll image into view
      img.scrollIntoView();
      
      // Wait for lazy load
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });
  
  // Wait for all images to load
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.every(img => img.complete);
  });
}
```

### 3. AJAX Request Interception

```javascript
async function interceptAPIRequests(page) {
  const apiData = [];
  
  // Intercept network requests
  await page.route('**/api/**', async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    
    apiData.push({
      url: route.request().url(),
      data: data
    });
    
    await route.continue();
  });
  
  await page.goto('https://example.com');
  
  return apiData;
}
```

### 4. WebSocket Data Capture

```javascript
async function captureWebSocketData(page) {
  const wsMessages = [];
  
  // Inject WebSocket interceptor
  await page.evaluateOnNewDocument(() => {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
      const ws = new originalWebSocket(...args);
      
      ws.addEventListener('message', (event) => {
        window.__wsMessages = window.__wsMessages || [];
        window.__wsMessages.push(event.data);
      });
      
      return ws;
    };
  });
  
  await page.goto('https://example.com');
  await page.waitForTimeout(5000);
  
  // Retrieve captured messages
  const messages = await page.evaluate(() => window.__wsMessages || []);
  return messages;
}
```

## Advanced Data Extraction

### 1. Shadow DOM Extraction

```javascript
async function extractFromShadowDOM(page) {
  return await page.evaluate(() => {
    const host = document.querySelector('#shadow-host');
    const shadowRoot = host.shadowRoot;
    
    return {
      title: shadowRoot.querySelector('.title')?.textContent,
      content: shadowRoot.querySelector('.content')?.textContent
    };
  });
}
```

### 2. Table Data Extraction

```javascript
async function extractTableData(page, tableSelector) {
  return await page.$$eval(tableSelector, tables => {
    return tables.map(table => {
      const headers = Array.from(table.querySelectorAll('th'))
        .map(th => th.textContent.trim());
      
      const rows = Array.from(table.querySelectorAll('tbody tr'))
        .map(row => {
          const cells = Array.from(row.querySelectorAll('td'))
            .map(td => td.textContent.trim());
          
          return headers.reduce((obj, header, index) => {
            obj[header] = cells[index];
            return obj;
          }, {});
        });
      
      return rows;
    });
  });
}
```

### 3. PDF Data Extraction

```javascript
import { Actor } from 'apify';
import pdf from 'pdf-parse';

async function extractPDFData(pdfUrl) {
  // Download PDF
  const response = await fetch(pdfUrl);
  const buffer = await response.arrayBuffer();
  
  // Parse PDF
  const data = await pdf(Buffer.from(buffer));
  
  return {
    text: data.text,
    pages: data.numpages,
    info: data.info
  };
}
```

### 4. Structured Data (JSON-LD, Microdata)

```javascript
async function extractStructuredData(page) {
  return await page.evaluate(() => {
    const data = {};
    
    // Extract JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    data.jsonLd = Array.from(jsonLdScripts).map(script => {
      try {
        return JSON.parse(script.textContent);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    // Extract Open Graph
    data.openGraph = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
      const property = meta.getAttribute('property').replace('og:', '');
      data.openGraph[property] = meta.getAttribute('content');
    });
    
    // Extract Microdata
    data.microdata = Array.from(document.querySelectorAll('[itemscope]')).map(item => {
      const type = item.getAttribute('itemtype');
      const properties = {};
      
      item.querySelectorAll('[itemprop]').forEach(prop => {
        const name = prop.getAttribute('itemprop');
        properties[name] = prop.textContent.trim();
      });
      
      return { type, properties };
    });
    
    return data;
  });
}
```

## Performance Optimization

### 1. Block Unnecessary Resources

```javascript
await page.route('**/*', (route) => {
  const resourceType = route.request().resourceType();
  
  // Block images, fonts, stylesheets
  if (['image', 'font', 'stylesheet'].includes(resourceType)) {
    route.abort();
  } else {
    route.continue();
  }
});
```

### 2. Parallel Processing

```javascript
import pLimit from 'p-limit';

async function scrapeUrlsInParallel(urls, concurrency = 5) {
  const limit = pLimit(concurrency);
  const browser = await chromium.launch();
  
  const results = await Promise.all(
    urls.map(url => limit(async () => {
      const page = await browser.newPage();
      try {
        await page.goto(url);
        return await extractData(page);
      } finally {
        await page.close();
      }
    }))
  );
  
  await browser.close();
  return results;
}
```

### 3. Browser Context Reuse

```javascript
async function efficientScraping(urls) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  const results = [];
  
  for (const url of urls) {
    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      results.push(await extractData(page));
    } finally {
      await page.close(); // Close page, not context
    }
  }
  
  await browser.close();
  return results;
}
```

## Error Handling & Resilience

### 1. Retry with Exponential Backoff

```javascript
async function scrapeWithRetry(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const page = await browser.newPage();
      await page.goto(url, { timeout: 30000 });
      const data = await extractData(page);
      await page.close();
      return data;
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed: ${error.message}`);
      
      if (attempt === maxRetries - 1) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 2. Graceful Degradation

```javascript
async function extractWithFallback(page) {
  // Try primary selector
  let title = await page.$eval('.primary-title', el => el.textContent)
    .catch(() => null);
  
  // Fallback to secondary selector
  if (!title) {
    title = await page.$eval('h1', el => el.textContent)
      .catch(() => null);
  }
  
  // Final fallback to title tag
  if (!title) {
    title = await page.title();
  }
  
  return title;
}
```

### 3. Session Management

```javascript
class ScraperSession {
  constructor() {
    this.browser = null;
    this.context = null;
  }
  
  async init() {
    this.browser = await chromium.launch();
    this.context = await this.browser.newContext();
  }
  
  async scrape(url) {
    if (!this.context) await this.init();
    
    const page = await this.context.newPage();
    
    try {
      await page.goto(url);
      return await extractData(page);
    } catch (error) {
      // Reset session on critical errors
      if (error.message.includes('Target closed')) {
        await this.reset();
        return await this.scrape(url); // Retry
      }
      throw error;
    } finally {
      await page.close();
    }
  }
  
  async reset() {
    if (this.browser) await this.browser.close();
    await this.init();
  }
  
  async close() {
    if (this.browser) await this.browser.close();
  }
}
```

## Authentication Handling

### 1. Cookie-Based Auth

```javascript
async function scrapeWithAuth(page, credentials) {
  // Load saved cookies
  const cookies = await Actor.getValue('cookies');
  if (cookies) {
    await page.context().addCookies(cookies);
  }
  
  // Try accessing protected page
  await page.goto('https://example.com/dashboard');
  
  // Check if logged in
  const isLoggedIn = await page.$('.user-profile') !== null;
  
  if (!isLoggedIn) {
    // Perform login
    await page.goto('https://example.com/login');
    await page.fill('#username', credentials.username);
    await page.fill('#password', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Save cookies
    const newCookies = await page.context().cookies();
    await Actor.setValue('cookies', newCookies);
  }
  
  return await extractData(page);
}
```

### 2. Token-Based Auth

```javascript
async function scrapeWithToken(page, token) {
  // Set authorization header
  await page.setExtraHTTPHeaders({
    'Authorization': `Bearer ${token}`
  });
  
  await page.goto('https://api.example.com/data');
  
  // Extract data from API response
  const data = await page.evaluate(() => {
    return JSON.parse(document.body.textContent);
  });
  
  return data;
}
```

## Data Quality & Validation

### 1. Data Cleaning

```javascript
function cleanData(rawData) {
  return {
    title: rawData.title?.trim().replace(/\s+/g, ' ') || null,
    price: parseFloat(rawData.price?.replace(/[^0-9.]/g, '')) || null,
    date: new Date(rawData.date).toISOString(),
    url: new URL(rawData.url).href,
    description: rawData.description?.trim() || null
  };
}
```

### 2. Data Validation

```javascript
function validateProduct(product) {
  const errors = [];
  
  if (!product.title) errors.push('Missing title');
  if (!product.price || product.price <= 0) errors.push('Invalid price');
  if (!product.url) errors.push('Missing URL');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### 3. Deduplication

```javascript
class DataDeduplicator {
  constructor() {
    this.seen = new Set();
  }
  
  isDuplicate(item, key = 'url') {
    const identifier = item[key];
    if (this.seen.has(identifier)) {
      return true;
    }
    this.seen.add(identifier);
    return false;
  }
  
  async saveState() {
    await Actor.setValue('seen_items', Array.from(this.seen));
  }
  
  async loadState() {
    const saved = await Actor.getValue('seen_items') || [];
    this.seen = new Set(saved);
  }
}
```

## Best Practices Summary

1. **Always use headless mode in production** - Faster and uses less resources
2. **Implement proper error handling** - Retry logic, fallbacks, graceful degradation
3. **Respect robots.txt** - Check before scraping
4. **Add delays between requests** - Avoid overwhelming servers
5. **Use appropriate selectors** - Prefer data attributes over CSS classes
6. **Clean and validate data** - Ensure data quality
7. **Monitor and log** - Track success rates and errors
8. **Handle authentication properly** - Store tokens/cookies securely
9. **Optimize resource usage** - Block unnecessary resources, reuse contexts
10. **Test thoroughly** - Handle edge cases and failures

## Additional Resources

- For basic scraping, see [apify-web-scraping](../apify-web-scraping/SKILL.md)
- For deployment, see [apify-google-cloud-deploy](../apify-google-cloud-deploy/SKILL.md)
