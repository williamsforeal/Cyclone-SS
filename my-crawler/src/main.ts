import { Actor } from 'apify';
import { PuppeteerCrawler } from 'crawlee';

import { router } from './routes.js';

await Actor.init();

interface Input {
    startUrls: { url: string }[];
    maxRequestsPerCrawl?: number;
}

const {
    startUrls = [{ url: 'https://crawlee.dev' }],
    maxRequestsPerCrawl = 20,
} = (await Actor.getInput<Input>()) ?? {};

const crawler = new PuppeteerCrawler({
    requestHandler: router,
    maxRequestsPerCrawl: maxRequestsPerCrawl === 0 ? Infinity : maxRequestsPerCrawl,
});

await crawler.run(startUrls.map((s) => s.url));

await Actor.exit();
