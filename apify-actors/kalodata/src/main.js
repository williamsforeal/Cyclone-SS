/**
 * KaLoData Scraper — Apify Actor
 *
 * Scrapes product analytics from KaLoData.com (a TikTok product analytics
 * platform) using Crawlee + Playwright with session cookie authentication.
 *
 * Flow:
 *   1. Inject session cookie for authentication
 *   2. If keyword provided  -> search results page -> extract product cards
 *   3. If targetUrl provided -> navigate directly to that product page
 *   4. For each product URL found, visit detail page and extract full metrics
 *   5. Push structured results to Apify dataset
 */

const { Actor } = require('apify');
const { PlaywrightCrawler, log } = require('crawlee');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely extract text content from a selector. Returns null if not found.
 */
async function safeText(page, selector, timeout = 5000) {
    try {
        await page.waitForSelector(selector, { timeout });
        const el = await page.$(selector);
        if (!el) return null;
        const text = await el.textContent();
        return text ? text.trim() : null;
    } catch {
        return null;
    }
}

/**
 * Parse a dollar amount string like "$12,345.67" or "$1.2M" into a number.
 */
function parseDollar(raw) {
    if (!raw) return null;
    const cleaned = raw.replace(/[^0-9.KkMm]/g, '');
    if (!cleaned) return null;
    const multiplier = /[Mm]/.test(raw) ? 1_000_000 : /[Kk]/.test(raw) ? 1_000 : 1;
    const num = parseFloat(cleaned.replace(/[KkMm]/g, ''));
    return isNaN(num) ? null : num * multiplier;
}

/**
 * Parse a numeric string like "12,345" or "1.2K" into a number.
 */
function parseNumber(raw) {
    if (!raw) return null;
    const cleaned = raw.replace(/[^0-9.KkMm]/g, '');
    if (!cleaned) return null;
    const multiplier = /[Mm]/.test(raw) ? 1_000_000 : /[Kk]/.test(raw) ? 1_000 : 1;
    const num = parseFloat(cleaned.replace(/[KkMm]/g, ''));
    return isNaN(num) ? null : num * multiplier;
}

/**
 * Parse a percentage string like "+23.4%" or "-5%" into a number.
 */
function parsePercent(raw) {
    if (!raw) return null;
    const match = raw.match(/([+-]?\d+\.?\d*)\s*%/);
    return match ? parseFloat(match[1]) : null;
}

/**
 * Search the page for a metric value by scanning visible text near a label.
 * Uses page.evaluate to walk the DOM looking for label/value pairs.
 */
async function extractMetricByLabel(page, label) {
    try {
        return await page.evaluate((lbl) => {
            // Strategy: find any element whose text includes the label,
            // then look at the next sibling or parent's next child for a value.
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            let node;
            while ((node = walker.nextNode())) {
                if (node.textContent.trim().toLowerCase().includes(lbl.toLowerCase())) {
                    // Check sibling elements for a value
                    const parent = node.parentElement;
                    if (!parent) continue;
                    const container = parent.closest('div, span, td, li') || parent;
                    // Look at the next sibling element or the parent container text
                    const next = container.nextElementSibling;
                    if (next) {
                        const val = next.textContent.trim();
                        if (val && val.length < 50) return val;
                    }
                    // Also check children of the parent container
                    const children = container.parentElement?.children;
                    if (children) {
                        const childArray = Array.from(children);
                        for (let i = 0; i < childArray.length; i++) {
                            const child = childArray[i];
                            if (child.textContent.includes(lbl)) {
                                // Found the label - check the immediate next sibling
                                const nextChild = childArray[i + 1];
                                if (nextChild) {
                                    const val = nextChild.textContent.trim();
                                    if (val && val.length < 50) return val;
                                }
                                break; // Stop after finding the label and checking its next sibling
                            }
                        }
                    }
                }
            }
            return null;
        }, label);
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Product detail page extraction
// ---------------------------------------------------------------------------

async function extractProductDetail(page, url) {
    log.info(`Extracting product detail from: ${url}`);

    // Wait for page content to load — look for common content containers
    try {
        await page.waitForSelector('body', { timeout: 10000 });
        // Give dynamic content a moment to render
        await page.waitForTimeout(3000);
    } catch {
        log.warning('Page body did not load in time');
    }

    const result = {
        url,
        product_name: null,
        category: null,
        revenue_7d: null,
        revenue_30d: null,
        orders_7d: null,
        orders_30d: null,
        growth_7d_pct: null,
        launch_age_days: null,
        aov: null,
        tiktok_shop_url: null,
        scraped_at: new Date().toISOString(),
    };

    // --- Product name ---
    // Try common heading selectors, then fall back to page title
    try {
        const nameSelectors = [
            'h1',
            '[class*="product-name"]',
            '[class*="productName"]',
            '[class*="title"]',
            '[data-testid="product-name"]',
        ];
        for (const sel of nameSelectors) {
            const text = await safeText(page, sel, 2000);
            if (text && text.length > 2 && text.length < 300) {
                result.product_name = text;
                break;
            }
        }
        if (!result.product_name) {
            result.product_name = await page.title();
        }
    } catch (e) {
        log.debug(`Could not extract product_name: ${e.message}`);
    }

    // --- Category ---
    try {
        const catRaw = await extractMetricByLabel(page, 'Category');
        if (catRaw) result.category = catRaw;
    } catch (e) {
        log.debug(`Could not extract category: ${e.message}`);
    }

    // --- Revenue (7d and 30d) ---
    try {
        const rev7dRaw = await extractMetricByLabel(page, '7 Day Revenue')
            || await extractMetricByLabel(page, '7D Revenue')
            || await extractMetricByLabel(page, 'Revenue (7D)');
        result.revenue_7d = parseDollar(rev7dRaw);
    } catch (e) {
        log.debug(`Could not extract revenue_7d: ${e.message}`);
    }

    try {
        const rev30dRaw = await extractMetricByLabel(page, '30 Day Revenue')
            || await extractMetricByLabel(page, '30D Revenue')
            || await extractMetricByLabel(page, 'Revenue (30D)');
        result.revenue_30d = parseDollar(rev30dRaw);
    } catch (e) {
        log.debug(`Could not extract revenue_30d: ${e.message}`);
    }

    // --- Orders (7d and 30d) ---
    try {
        const ord7dRaw = await extractMetricByLabel(page, '7 Day Orders')
            || await extractMetricByLabel(page, '7D Orders')
            || await extractMetricByLabel(page, 'Orders (7D)')
            || await extractMetricByLabel(page, 'Units Sold (7D)');
        result.orders_7d = parseNumber(ord7dRaw);
    } catch (e) {
        log.debug(`Could not extract orders_7d: ${e.message}`);
    }

    try {
        const ord30dRaw = await extractMetricByLabel(page, '30 Day Orders')
            || await extractMetricByLabel(page, '30D Orders')
            || await extractMetricByLabel(page, 'Orders (30D)')
            || await extractMetricByLabel(page, 'Units Sold (30D)');
        result.orders_30d = parseNumber(ord30dRaw);
    } catch (e) {
        log.debug(`Could not extract orders_30d: ${e.message}`);
    }

    // --- Growth (7d percentage) ---
    try {
        const growthRaw = await extractMetricByLabel(page, 'Growth')
            || await extractMetricByLabel(page, '7D Growth')
            || await extractMetricByLabel(page, 'Revenue Growth');
        result.growth_7d_pct = parsePercent(growthRaw);
    } catch (e) {
        log.debug(`Could not extract growth_7d_pct: ${e.message}`);
    }

    // --- Launch age (days) ---
    try {
        const ageRaw = await extractMetricByLabel(page, 'Launch')
            || await extractMetricByLabel(page, 'Days on Market')
            || await extractMetricByLabel(page, 'Age');
        if (ageRaw) {
            const dayMatch = ageRaw.match(/(\d+)/);
            result.launch_age_days = dayMatch ? parseInt(dayMatch[1], 10) : null;
        }
    } catch (e) {
        log.debug(`Could not extract launch_age_days: ${e.message}`);
    }

    // --- AOV (Average Order Value) ---
    try {
        const aovRaw = await extractMetricByLabel(page, 'AOV')
            || await extractMetricByLabel(page, 'Average Order Value')
            || await extractMetricByLabel(page, 'Avg. Price');
        result.aov = parseDollar(aovRaw);
    } catch (e) {
        log.debug(`Could not extract aov: ${e.message}`);
    }

    // --- TikTok Shop URL ---
    try {
        const shopUrl = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            const tikTokLink = links.find(
                (a) =>
                    a.href.includes('tiktok.com') ||
                    a.href.includes('shop.tiktok') ||
                    a.textContent.toLowerCase().includes('tiktok shop')
            );
            return tikTokLink ? tikTokLink.href : null;
        });
        result.tiktok_shop_url = shopUrl;
    } catch (e) {
        log.debug(`Could not extract tiktok_shop_url: ${e.message}`);
    }

    return result;
}

// ---------------------------------------------------------------------------
// Search results page extraction
// ---------------------------------------------------------------------------

async function extractSearchResults(page, maxProducts) {
    log.info('Extracting search results...');

    // Wait for search results to render
    try {
        await page.waitForSelector('table, [class*="product"], [class*="card"], [class*="list"]', {
            timeout: 15000,
        });
        // Extra wait for dynamic rendering
        await page.waitForTimeout(3000);
    } catch {
        log.warning('Search results container did not appear within timeout');
    }

    // Attempt to extract product cards/rows from the search results page.
    // KaLoData typically renders results in a table or card grid.
    const products = await page.evaluate((max) => {
        const results = [];

        // ----- Strategy 1: Table rows -----
        const rows = document.querySelectorAll('table tbody tr, [class*="table"] [class*="row"]');
        if (rows.length > 0) {
            for (const row of rows) {
                if (results.length >= max) break;
                // Find a link to the product detail page
                const link = row.querySelector('a[href*="/product"]');
                const cells = row.querySelectorAll('td, [class*="cell"], [class*="col"]');
                const textContent = row.textContent || '';
                results.push({
                    product_name: link ? link.textContent.trim() : (cells[0]?.textContent?.trim() || null),
                    product_url: link ? link.href : null,
                    raw_text: textContent.substring(0, 500),
                });
            }
        }

        // ----- Strategy 2: Card-based layout -----
        if (results.length === 0) {
            const cards = document.querySelectorAll(
                '[class*="product-card"], [class*="productCard"], [class*="card"], [class*="item"]'
            );
            for (const card of cards) {
                if (results.length >= max) break;
                const link = card.querySelector('a[href*="/product"]');
                if (!link) continue; // Skip cards that are not product cards
                results.push({
                    product_name: link.textContent.trim() || null,
                    product_url: link.href,
                    raw_text: card.textContent.substring(0, 500),
                });
            }
        }

        // ----- Strategy 3: Any links to product pages -----
        if (results.length === 0) {
            const links = document.querySelectorAll('a[href*="/product"]');
            for (const link of links) {
                if (results.length >= max) break;
                const href = link.href;
                // Deduplicate
                if (results.some((r) => r.product_url === href)) continue;
                results.push({
                    product_name: link.textContent.trim() || null,
                    product_url: href,
                    raw_text: link.closest('div, tr, li')?.textContent?.substring(0, 500) || '',
                });
            }
        }

        return results;
    }, maxProducts);

    // Post-process: try to extract inline metrics from raw_text on each card
    for (const product of products) {
        const text = product.raw_text || '';

        // Revenue: look for dollar amounts
        const dollarMatches = text.match(/\$[\d,.]+[KkMm]?/g);
        if (dollarMatches && dollarMatches.length > 0) {
            product.revenue_7d_raw = dollarMatches[0];
        }

        // Orders: look for standalone numbers (skip dollar amounts)
        const orderMatches = text.match(/(?<!\$)(\d[\d,.]*[KkMm]?)\s*(?:orders?|units?|sold)/i);
        if (orderMatches) {
            product.orders_7d_raw = orderMatches[1];
        }

        // Growth: look for percentages
        const growthMatch = text.match(/([+-]?\d+\.?\d*)\s*%/);
        if (growthMatch) {
            product.growth_7d_pct = parseFloat(growthMatch[1]);
        }

        // Clean up — drop raw_text from final output
        delete product.raw_text;
    }

    log.info(`Found ${products.length} products on search results page`);
    return products;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

Actor.main(async () => {
    // ---- Input validation ----
    const input = await Actor.getInput();

    const {
        targetUrl,
        keyword,
        sessionCookie,
        maxProducts = 20,
        proxyConfiguration: proxyInput,
    } = input;

    if (!sessionCookie) {
        throw new Error('sessionCookie is required. Log in to kalodata.com and copy the "sessionid" cookie value.');
    }
    if (!targetUrl && !keyword) {
        throw new Error('Either targetUrl or keyword must be provided.');
    }

    log.info('Starting KaLoData scraper', { keyword, targetUrl, maxProducts });

    // ---- Proxy setup ----
    const proxyConfiguration = await Actor.createProxyConfiguration(
        proxyInput || { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] }
    );

    // ---- Build the request queue ----
    // We start with either a search page or a direct product URL.
    const startUrls = [];
    const startLabels = [];

    if (keyword) {
        const searchUrl = `https://www.kalodata.com/search?keyword=${encodeURIComponent(keyword)}&tab=product`;
        startUrls.push(searchUrl);
        startLabels.push('SEARCH');
        log.info(`Will search: ${searchUrl}`);
    }

    if (targetUrl) {
        startUrls.push(targetUrl);
        startLabels.push('PRODUCT');
        log.info(`Will scrape product page: ${targetUrl}`);
    }

    // ---- Crawler ----
    const crawler = new PlaywrightCrawler({
        proxyConfiguration,
        maxRequestRetries: 3,
        requestHandlerTimeoutSecs: 120,
        navigationTimeoutSecs: 60,

        // Use headed browser in development, headless in production
        launchContext: {
            launchOptions: {
                headless: true,
            },
        },

        // Inject session cookie BEFORE every navigation
        preNavigationHooks: [
            async ({ page }) => {
                await page.context().addCookies([
                    {
                        name: 'sessionid',
                        value: sessionCookie,
                        domain: '.kalodata.com',
                        path: '/',
                    },
                ]);
                log.debug('Session cookie injected');
            },
        ],

        // Main request handler — routes based on label
        requestHandler: async ({ request, page, enqueueLinks }) => {
            const label = request.label || request.userData?.label || 'UNKNOWN';
            log.info(`Processing [${label}]: ${request.url}`);

            // ----- SEARCH results page -----
            if (label === 'SEARCH') {
                const products = await extractSearchResults(page, maxProducts);

                if (products.length === 0) {
                    log.warning('No products found on search page. The page may require a different cookie or the layout changed.');
                    // Take a screenshot for debugging
                    try {
                        const screenshot = await page.screenshot({ fullPage: true });
                        await Actor.setValue('search-page-debug', screenshot, { contentType: 'image/png' });
                        log.info('Debug screenshot saved as "search-page-debug"');
                    } catch { /* ignore */ }
                    return;
                }

                // Enqueue each product detail page for deeper extraction
                for (const product of products) {
                    if (product.product_url) {
                        // Ensure absolute URL
                        const absoluteUrl = product.product_url.startsWith('http')
                            ? product.product_url
                            : `https://www.kalodata.com${product.product_url}`;

                        await crawler.addRequests([
                            {
                                url: absoluteUrl,
                                label: 'PRODUCT',
                                userData: {
                                    searchData: product, // Carry forward search-level data
                                },
                            },
                        ]);
                    } else {
                        // No URL — push what we have from the search card
                        await Actor.pushData({
                            ...product,
                            source: 'search_card_only',
                            scraped_at: new Date().toISOString(),
                        });
                    }
                }

                log.info(`Enqueued ${products.filter((p) => p.product_url).length} product detail pages`);
            }

            // ----- PRODUCT detail page -----
            else if (label === 'PRODUCT') {
                const detail = await extractProductDetail(page, request.url);

                // Merge with any data carried from the search results card
                const searchData = request.userData?.searchData || {};
                const merged = {
                    ...searchData,
                    ...detail,
                    // Prefer detail-level data but keep search-level as fallback
                    product_name: detail.product_name || searchData.product_name,
                    growth_7d_pct: detail.growth_7d_pct ?? searchData.growth_7d_pct ?? null,
                    source: 'product_detail',
                };

                // Clean up intermediate fields
                delete merged.product_url;
                delete merged.revenue_7d_raw;
                delete merged.orders_7d_raw;

                await Actor.pushData(merged);
                log.info(`Pushed data for: ${merged.product_name || request.url}`);
            }

            // ----- Unknown label -----
            else {
                log.warning(`Unknown request label: ${label}, URL: ${request.url}`);
            }
        },

        // Handle failures
        failedRequestHandler: async ({ request }, error) => {
            log.error(`Request failed after retries: ${request.url}`, { error: error.message });
            await Actor.pushData({
                url: request.url,
                error: error.message,
                scraped_at: new Date().toISOString(),
                source: 'error',
            });
        },
    });

    // Build initial request list with labels
    const requests = startUrls.map((url, i) => ({
        url,
        label: startLabels[i],
    }));

    await crawler.run(requests);

    log.info('KaLoData scraper finished');
});
