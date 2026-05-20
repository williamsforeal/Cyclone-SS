const { Actor } = require('apify');
const { PlaywrightCrawler } = require('crawlee');

/**
 * SimilarWeb Scraper — Apify Actor
 *
 * Scrapes public SimilarWeb analytics pages for given domains.
 * Requires residential proxies (SimilarWeb blocks datacenter IPs).
 */

// Random delay between min and max milliseconds
function randomDelay(minMs, maxMs) {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Safely extract text from a selector, returning null if not found
async function safeText(page, selector, timeout = 8000) {
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

// Safely extract text from multiple matching elements
async function safeTextAll(page, selector, timeout = 8000) {
    try {
        await page.waitForSelector(selector, { timeout });
        const elements = await page.$$(selector);
        const results = [];
        for (const el of elements) {
            const text = await el.textContent();
            if (text && text.trim()) results.push(text.trim());
        }
        return results;
    } catch {
        return [];
    }
}

// Parse a rank string like "#1,234" or "1,234" into a number
function parseRank(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
}

// Extract percentage from text like "45.23%" or "45.23 %"
function parsePercentage(text) {
    if (!text) return null;
    const match = text.match(/([\d.]+)\s*%/);
    return match ? `${match[1]}%` : null;
}

// Extract a number from text like "3.45"
function parseNumber(text) {
    if (!text) return null;
    const match = text.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
}

/**
 * Extract global rank from the page.
 * SimilarWeb uses various selectors across redesigns.
 */
async function extractGlobalRank(page) {
    const selectors = [
        '[data-test="global-rank"] .wa-rank-list__value',
        '.wa-rank-list--global .wa-rank-list__value',
        '.rank-list .rank-list__item--global .rank-list__value',
        '.engagement-list__item--global-rank .engagement-list__item-value',
    ];
    for (const sel of selectors) {
        const text = await safeText(page, sel, 3000);
        if (text) return parseRank(text);
    }
    // Fallback: look for text content containing "Global Rank"
    try {
        const rank = await page.evaluate(() => {
            const els = [...document.querySelectorAll('*')];
            for (const el of els) {
                if (el.textContent.includes('Global Rank') && el.children.length < 5) {
                    const sibling = el.nextElementSibling || el.parentElement;
                    const match = sibling?.textContent?.match(/#?([\d,]+)/);
                    if (match) return parseInt(match[1].replace(/,/g, ''), 10);
                }
            }
            return null;
        });
        return rank;
    } catch {
        return null;
    }
}

/**
 * Extract country rank from the page.
 */
async function extractCountryRank(page) {
    const selectors = [
        '[data-test="country-rank"] .wa-rank-list__value',
        '.wa-rank-list--country .wa-rank-list__value',
        '.rank-list .rank-list__item--country .rank-list__value',
        '.engagement-list__item--country-rank .engagement-list__item-value',
    ];
    for (const sel of selectors) {
        const text = await safeText(page, sel, 3000);
        if (text) return parseRank(text);
    }
    try {
        const rank = await page.evaluate(() => {
            const els = [...document.querySelectorAll('*')];
            for (const el of els) {
                if (el.textContent.includes('Country Rank') && el.children.length < 5) {
                    const sibling = el.nextElementSibling || el.parentElement;
                    const match = sibling?.textContent?.match(/#?([\d,]+)/);
                    if (match) return parseInt(match[1].replace(/,/g, ''), 10);
                }
            }
            return null;
        });
        return rank;
    } catch {
        return null;
    }
}

/**
 * Extract category rank from the page.
 */
async function extractCategoryRank(page) {
    const selectors = [
        '[data-test="category-rank"] .wa-rank-list__value',
        '.wa-rank-list--category .wa-rank-list__value',
        '.rank-list .rank-list__item--category .rank-list__value',
        '.engagement-list__item--category-rank .engagement-list__item-value',
    ];
    for (const sel of selectors) {
        const text = await safeText(page, sel, 3000);
        if (text) return parseRank(text);
    }
    try {
        const rank = await page.evaluate(() => {
            const els = [...document.querySelectorAll('*')];
            for (const el of els) {
                if (el.textContent.includes('Category Rank') && el.children.length < 5) {
                    const sibling = el.nextElementSibling || el.parentElement;
                    const match = sibling?.textContent?.match(/#?([\d,]+)/);
                    if (match) return parseInt(match[1].replace(/,/g, ''), 10);
                }
            }
            return null;
        });
        return rank;
    } catch {
        return null;
    }
}

/**
 * Extract engagement metrics: total visits, bounce rate, pages per visit, avg visit duration.
 */
async function extractEngagementMetrics(page) {
    const metrics = {
        totalVisits: null,
        bounceRate: null,
        pagesPerVisit: null,
        avgVisitDuration: null,
    };

    // Total Visits
    const visitSelectors = [
        '[data-test="total-visits"] .engagement-list__item-value',
        '.engagement-list__item--total-visits .engagement-list__item-value',
        '.wa-overview__column--visits .wa-overview__value',
    ];
    for (const sel of visitSelectors) {
        const text = await safeText(page, sel, 3000);
        if (text) { metrics.totalVisits = text; break; }
    }

    // Bounce Rate
    const bounceSelectors = [
        '[data-test="bounce-rate"] .engagement-list__item-value',
        '.engagement-list__item--bounce-rate .engagement-list__item-value',
        '.wa-overview__column--bounce .wa-overview__value',
    ];
    for (const sel of bounceSelectors) {
        const text = await safeText(page, sel, 3000);
        if (text) { metrics.bounceRate = parsePercentage(text) || text; break; }
    }

    // Pages Per Visit
    const pagesSelectors = [
        '[data-test="pages-per-visit"] .engagement-list__item-value',
        '.engagement-list__item--pages-per-visit .engagement-list__item-value',
        '.wa-overview__column--ppv .wa-overview__value',
    ];
    for (const sel of pagesSelectors) {
        const text = await safeText(page, sel, 3000);
        if (text) { metrics.pagesPerVisit = parseNumber(text); break; }
    }

    // Avg Visit Duration
    const durationSelectors = [
        '[data-test="avg-visit-duration"] .engagement-list__item-value',
        '.engagement-list__item--avg-visit-duration .engagement-list__item-value',
        '.wa-overview__column--time .wa-overview__value',
    ];
    for (const sel of durationSelectors) {
        const text = await safeText(page, sel, 3000);
        if (text) { metrics.avgVisitDuration = text; break; }
    }

    // Fallback: try to extract from page via text matching
    if (!metrics.totalVisits || !metrics.bounceRate || !metrics.pagesPerVisit || !metrics.avgVisitDuration) {
        try {
            const fallback = await page.evaluate(() => {
                const result = {};
                const body = document.body.textContent;

                // Total visits patterns like "15.2M" or "1.5B"
                const visitsMatch = body.match(/Total Visits[\s\S]{0,100}?([\d.]+[KMBkmb])/i);
                if (visitsMatch) result.totalVisits = visitsMatch[1].toUpperCase();

                // Bounce rate
                const bounceMatch = body.match(/Bounce Rate[\s\S]{0,100}?([\d.]+\s*%)/i);
                if (bounceMatch) result.bounceRate = bounceMatch[1].replace(/\s/g, '');

                // Pages per visit
                const pagesMatch = body.match(/Pages per Visit[\s\S]{0,100}?([\d.]+)/i);
                if (pagesMatch) result.pagesPerVisit = parseFloat(pagesMatch[1]);

                // Avg visit duration
                const durationMatch = body.match(/Avg(?:\.|erage)?\s*Visit Duration[\s\S]{0,100}?(\d{2}:\d{2}:\d{2})/i);
                if (durationMatch) result.avgVisitDuration = durationMatch[1];

                return result;
            });

            if (!metrics.totalVisits && fallback.totalVisits) metrics.totalVisits = fallback.totalVisits;
            if (!metrics.bounceRate && fallback.bounceRate) metrics.bounceRate = fallback.bounceRate;
            if (!metrics.pagesPerVisit && fallback.pagesPerVisit) metrics.pagesPerVisit = fallback.pagesPerVisit;
            if (!metrics.avgVisitDuration && fallback.avgVisitDuration) metrics.avgVisitDuration = fallback.avgVisitDuration;
        } catch {
            // Fallback extraction failed, continue with nulls
        }
    }

    return metrics;
}

/**
 * Extract top countries with traffic share percentages.
 */
async function extractTopCountries(page) {
    const selectors = [
        '.wa-geography__chart-legend .wa-geography__legend-item',
        '.wa-geography__country-list .wa-geography__country-item',
        '[data-test="geography"] .wa-geography__legend-item',
        '.countries-list .countries-list__item',
    ];

    for (const sel of selectors) {
        try {
            await page.waitForSelector(sel, { timeout: 5000 });
            const countries = await page.$$eval(sel, (items) => {
                return items.slice(0, 5).map((item) => {
                    const countryEl = item.querySelector('.wa-geography__legend-name, .country-name, span');
                    const percentEl = item.querySelector('.wa-geography__legend-value, .country-value, .wa-geography__legend-share');
                    return {
                        country: countryEl?.textContent?.trim() || null,
                        percentage: percentEl?.textContent?.trim() || null,
                    };
                }).filter((c) => c.country);
            });
            if (countries.length > 0) return countries;
        } catch {
            continue;
        }
    }

    // Fallback: evaluate page for country-percentage patterns
    try {
        const countries = await page.evaluate(() => {
            const results = [];
            // Look for elements near "Top Countries" heading
            const headings = [...document.querySelectorAll('h2, h3, h4, [class*="title"]')];
            for (const h of headings) {
                if (h.textContent.toLowerCase().includes('top countr') || h.textContent.toLowerCase().includes('geography')) {
                    const section = h.closest('section, div[class*="geography"], div[class*="country"]');
                    if (section) {
                        const items = section.querySelectorAll('li, tr, [class*="item"], [class*="row"]');
                        items.forEach((item) => {
                            const text = item.textContent.trim();
                            const match = text.match(/([A-Za-z\s]+?)\s+([\d.]+%)/);
                            if (match) {
                                results.push({ country: match[1].trim(), percentage: match[2] });
                            }
                        });
                    }
                    break;
                }
            }
            return results.slice(0, 5);
        });
        if (countries.length > 0) return countries;
    } catch {
        // ignore
    }

    return [];
}

/**
 * Extract traffic sources breakdown (direct, referral, search, social, mail, display).
 */
async function extractTrafficSources(page) {
    const sources = {
        direct: null,
        referral: null,
        search: null,
        social: null,
        mail: null,
        display: null,
    };

    // Try structured selectors
    const sourceSelectors = [
        '.wa-traffic-sources__channel',
        '[data-test="traffic-sources"] .wa-traffic-sources__item',
        '.traffic-sources-list .traffic-sources-list__item',
    ];

    for (const sel of sourceSelectors) {
        try {
            await page.waitForSelector(sel, { timeout: 5000 });
            const data = await page.$$eval(sel, (items) => {
                const result = {};
                items.forEach((item) => {
                    const label = (item.querySelector('.wa-traffic-sources__channel-name, .traffic-sources-list__item-name, [class*="name"]')?.textContent || '').trim().toLowerCase();
                    const value = (item.querySelector('.wa-traffic-sources__channel-value, .traffic-sources-list__item-value, [class*="value"]')?.textContent || '').trim();
                    if (label.includes('direct')) result.direct = value;
                    else if (label.includes('referral')) result.referral = value;
                    else if (label.includes('search')) result.search = value;
                    else if (label.includes('social')) result.social = value;
                    else if (label.includes('mail') || label.includes('email')) result.mail = value;
                    else if (label.includes('display')) result.display = value;
                });
                return result;
            });

            const hasData = Object.values(data).some((v) => v);
            if (hasData) {
                Object.assign(sources, data);
                return sources;
            }
        } catch {
            continue;
        }
    }

    // Fallback: text-based extraction
    try {
        const fallback = await page.evaluate(() => {
            const result = {};
            const body = document.body.textContent;
            const channels = ['Direct', 'Referral', 'Search', 'Social', 'Mail', 'Display'];
            for (const ch of channels) {
                const regex = new RegExp(ch + '[\\s\\S]{0,50}?([\\d.]+\\s*%)', 'i');
                const match = body.match(regex);
                if (match) result[ch.toLowerCase()] = match[1].replace(/\s/g, '');
            }
            return result;
        });
        Object.assign(sources, fallback);
    } catch {
        // ignore
    }

    return sources;
}

/**
 * Extract top organic keywords.
 */
async function extractTopKeywords(page) {
    const keywordSelectors = [
        '.wa-keyword__list-item .wa-keyword__word',
        '[data-test="keywords"] .wa-keyword__word',
        '.keywords-list .keyword-item__text',
        '.wa-search-overview__keyword',
    ];

    for (const sel of keywordSelectors) {
        const keywords = await safeTextAll(page, sel, 5000);
        if (keywords.length > 0) return keywords.slice(0, 10);
    }

    // Fallback: look for keyword section in page
    try {
        const keywords = await page.evaluate(() => {
            const results = [];
            const headings = [...document.querySelectorAll('h2, h3, h4, [class*="title"]')];
            for (const h of headings) {
                if (h.textContent.toLowerCase().includes('keyword') || h.textContent.toLowerCase().includes('search')) {
                    const section = h.closest('section, div[class*="keyword"], div[class*="search"]');
                    if (section) {
                        const items = section.querySelectorAll('td:first-child, li, [class*="keyword"], [class*="word"]');
                        items.forEach((item) => {
                            const text = item.textContent.trim();
                            // Filter out labels and headers, keep actual keywords
                            if (text && text.length < 60 && !text.includes('%') && !/^(keyword|search|organic|paid)/i.test(text)) {
                                results.push(text);
                            }
                        });
                    }
                    break;
                }
            }
            return results.slice(0, 10);
        });
        if (keywords.length > 0) return keywords;
    } catch {
        // ignore
    }

    return [];
}

/**
 * Extract top referral sites.
 */
async function extractTopReferrals(page) {
    const referralSelectors = [
        '.wa-referrals__list-item .wa-referrals__domain',
        '[data-test="referrals"] .wa-referrals__domain',
        '.referrals-list .referral-item__domain',
    ];

    for (const sel of referralSelectors) {
        const referrals = await safeTextAll(page, sel, 5000);
        if (referrals.length > 0) return referrals.slice(0, 10);
    }

    // Fallback: look for referral section
    try {
        const referrals = await page.evaluate(() => {
            const results = [];
            const headings = [...document.querySelectorAll('h2, h3, h4, [class*="title"]')];
            for (const h of headings) {
                if (h.textContent.toLowerCase().includes('referral')) {
                    const section = h.closest('section, div[class*="referral"]');
                    if (section) {
                        const items = section.querySelectorAll('a, [class*="domain"], td:first-child');
                        items.forEach((item) => {
                            const text = item.textContent.trim();
                            // Looks like a domain
                            if (text && /^[a-z0-9][\w.-]+\.[a-z]{2,}$/i.test(text)) {
                                results.push(text);
                            }
                        });
                    }
                    break;
                }
            }
            return results.slice(0, 10);
        });
        if (referrals.length > 0) return referrals;
    } catch {
        // ignore
    }

    return [];
}

Actor.main(async () => {
    const input = await Actor.getInput();
    if (!input || !input.domains || input.domains.length === 0) {
        throw new Error('Input must contain a non-empty "domains" array, e.g. ["gymshark.com", "allbirds.com"]');
    }

    const { domains, proxyConfiguration: proxyConfig } = input;

    // Set up Apify proxy (residential required for SimilarWeb)
    const proxyConfiguration = await Actor.createProxyConfiguration(
        proxyConfig || {
            useApifyProxy: true,
            apifyProxyGroups: ['RESIDENTIAL'],
        },
    );

    console.log(`Starting SimilarWeb scraper for ${domains.length} domain(s): ${domains.join(', ')}`);

    // Build request list
    const requests = domains.map((domain) => {
        // Strip protocol and www if user included them
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
        return {
            url: `https://www.similarweb.com/website/${cleanDomain}/`,
            userData: { domain: cleanDomain },
        };
    });

    const crawler = new PlaywrightCrawler({
        proxyConfiguration,
        maxConcurrency: 1, // One at a time to reduce detection risk
        navigationTimeoutSecs: 60,
        requestHandlerTimeoutSecs: 120,
        headless: true,
        launchContext: {
            launchOptions: {
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                ],
            },
        },
        preNavigationHooks: [
            async ({ page }) => {
                // Set a realistic user agent and viewport
                await page.setViewportSize({ width: 1366, height: 768 });

                // Override navigator.webdriver to avoid detection
                await page.addInitScript(() => {
                    Object.defineProperty(navigator, 'webdriver', { get: () => false });
                    // Fake plugins
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5],
                    });
                    // Fake languages
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['en-US', 'en'],
                    });
                });
            },
        ],
        async requestHandler({ request, page, log }) {
            const { domain } = request.userData;
            log.info(`Scraping SimilarWeb data for: ${domain}`);

            // Wait for the main content to load
            // SimilarWeb renders content dynamically; wait for common wrappers
            const mainSelectors = [
                '.wa-overview',
                '.website-analysis',
                '[class*="engagement"]',
                '.app-section',
                'main',
            ];

            let pageLoaded = false;
            for (const sel of mainSelectors) {
                try {
                    await page.waitForSelector(sel, { timeout: 15000 });
                    pageLoaded = true;
                    break;
                } catch {
                    continue;
                }
            }

            if (!pageLoaded) {
                log.warning(`Main content selectors not found for ${domain}. Page may not have loaded fully or data may be unavailable.`);
            }

            // Additional wait for dynamic rendering
            await page.waitForTimeout(3000);

            // Check for "not enough data" or error pages
            const pageText = await page.evaluate(() => document.body.textContent.toLowerCase());
            const noData = pageText.includes('not enough data') ||
                           pageText.includes('no data available') ||
                           pageText.includes('we don\'t have enough data');

            if (noData) {
                log.warning(`SimilarWeb has no data for domain: ${domain}`);
                await Actor.pushData({
                    domain,
                    error: 'Not enough data available on SimilarWeb for this domain',
                    globalRank: null,
                    countryRank: null,
                    categoryRank: null,
                    totalVisits: null,
                    bounceRate: null,
                    pagesPerVisit: null,
                    avgVisitDuration: null,
                    topCountries: [],
                    trafficSources: null,
                    topKeywords: [],
                    topReferrals: [],
                    scrapedAt: new Date().toISOString(),
                });
                return;
            }

            // Extract all metrics
            log.info(`Extracting metrics for ${domain}...`);

            const [
                globalRank,
                countryRank,
                categoryRank,
                engagement,
                topCountries,
                trafficSources,
                topKeywords,
                topReferrals,
            ] = await Promise.all([
                extractGlobalRank(page),
                extractCountryRank(page),
                extractCategoryRank(page),
                extractEngagementMetrics(page),
                extractTopCountries(page),
                extractTrafficSources(page),
                extractTopKeywords(page),
                extractTopReferrals(page),
            ]);

            const result = {
                domain,
                globalRank,
                countryRank,
                categoryRank,
                totalVisits: engagement.totalVisits,
                bounceRate: engagement.bounceRate,
                pagesPerVisit: engagement.pagesPerVisit,
                avgVisitDuration: engagement.avgVisitDuration,
                topCountries,
                trafficSources,
                topKeywords,
                topReferrals,
                scrapedAt: new Date().toISOString(),
            };

            log.info(`Successfully scraped data for ${domain}`, {
                globalRank: result.globalRank,
                totalVisits: result.totalVisits,
            });

            await Actor.pushData(result);

            // Random delay between domains to appear more human (3-8 seconds)
            await randomDelay(3000, 8000);
        },

        async failedRequestHandler({ request, log }) {
            const { domain } = request.userData;
            log.error(`Failed to scrape ${domain} after retries.`);

            await Actor.pushData({
                domain,
                error: `Scraping failed after ${request.retryCount} retries. The page may be blocked or unavailable.`,
                globalRank: null,
                countryRank: null,
                categoryRank: null,
                totalVisits: null,
                bounceRate: null,
                pagesPerVisit: null,
                avgVisitDuration: null,
                topCountries: [],
                trafficSources: null,
                topKeywords: [],
                topReferrals: [],
                scrapedAt: new Date().toISOString(),
            });
        },
    });

    await crawler.run(requests);

    console.log('SimilarWeb scraper finished.');
});
