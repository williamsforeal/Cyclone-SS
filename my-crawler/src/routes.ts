import { createPuppeteerRouter, EnqueueStrategy } from 'crawlee';

export const router = createPuppeteerRouter();

router.addDefaultHandler(async ({ enqueueLinks, log, request }) => {
    log.info(`enqueueing new URLs from ${request.loadedUrl}`);
    await enqueueLinks({
        strategy: EnqueueStrategy.SameHostname,
        label: 'detail',
    });
});

router.addHandler('detail', async ({ request, page, pushData, log }) => {
    const title = await page.title();
    log.info(`${title}`, { url: request.loadedUrl });

    await pushData({
        url: request.loadedUrl,
        title,
    });
});
