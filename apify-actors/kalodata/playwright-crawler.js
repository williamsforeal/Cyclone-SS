import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { Actor } from 'apify';

await Actor.init();
const input = await Actor.getInput(); // Takes targetUrl and sessionCookie from n8n

const crawler = new PlaywrightCrawler({
    // 1. CRITICAL: Use Residential Proxies to bypass Anti-Bot walls
    proxyConfiguration: new ProxyConfiguration({ groups: ['RESIDENTIAL'] }),
    useSessionPool: true,
    browserPoolOptions: { useFingerprints: true }, // Randomizes browser fingerprints
    
    preNavigationHooks: [
        async ({ page }) => {
            // 2. INJECT KALODATA SESSION COOKIE TO BYPASS LOGIN
            if (input.sessionCookie) {
                await page.context().addCookies([
                    { name: 'session_id', value: input.sessionCookie, domain: '.kalodata.com', path: '/' }
                ]);
            }
        },
    ],
    async requestHandler({ page, request, log }) {
        log.info(`Scraping: ${request.url}`);
        await page.goto(request.url, { waitUntil: 'networkidle' });
        
        // 3. EXTRACT TRUE NORTH SIGNALS (Wait for React/Vue to load data)
        await page.waitForTimeout(3000); 
        const revenue = await page.locator('.revenue-metric-class').textContent(); // Update selector

        // 4. PUSH DATA TO APIFY DATASET (n8n pulls this into Replit)
        await Actor.pushData({
            url: request.url,
            estimatedRevenue: revenue,
            timestamp: new Date().toISOString()
        });
    },
});

await crawler.run([input.targetUrl]);
await Actor.exit();