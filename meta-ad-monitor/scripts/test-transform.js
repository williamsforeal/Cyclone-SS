require('dotenv').config();
const APIFY_TOKEN = process.env.APIFY_TOKEN;

const extractBodyText = (body) => {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && body.text) return body.text;
  return '';
};

async function test() {
  const response = await fetch('https://api.apify.com/v2/actor-runs/yfnFxuRHhDMyDrkGE/dataset/items?token=' + APIFY_TOKEN);
  const results = await response.json();

  const contentGrouped = new Map();

  for (const item of results) {
    const snapshot = item.snapshot || {};
    const cards = snapshot.cards || [];
    const firstCard = cards[0] || {};

    const headline = (firstCard.title || snapshot.title || snapshot.link_description || '').trim().toLowerCase();
    const cardBody = extractBodyText(firstCard.body);
    const snapshotBody = extractBodyText(snapshot.body);
    const body = (cardBody || snapshotBody || '').trim().toLowerCase().substring(0, 100);

    const firstVideo = snapshot.videos ? snapshot.videos[0] : null;
    const videoUrl = firstVideo ? (firstVideo.video_hd_url || firstVideo.video_sd_url || '') : '';
    const imageUrl = snapshot.images ? snapshot.images[0] : '';
    const mediaFingerprint = (videoUrl || imageUrl || '').substring(0, 100);

    const contentFingerprint = headline + '||' + body + '||' + mediaFingerprint;

    console.log('Fingerprint:', contentFingerprint.substring(0, 80));

    if (headline || body || mediaFingerprint) {
      if (!contentGrouped.has(contentFingerprint)) {
        contentGrouped.set(contentFingerprint, item);
      }
    } else {
      contentGrouped.set('unique_' + item.adArchiveID, item);
    }
  }

  console.log('\nInput:', results.length, '-> Deduped:', contentGrouped.size);
}

test().catch(e => console.error('Error:', e.message));
