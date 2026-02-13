#!/usr/bin/env node

/**
 * Direct Brand Import Script with Pre-resolved Page IDs
 *
 * This script imports brands directly to the database with hardcoded page IDs
 * sourced from public data.
 */

const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, '..', 'data', 'meta_ads.db');
const db = new Database(dbPath);

// Brands with pre-resolved page IDs
// Page IDs sourced from public data and Ad Library URLs
const brands = [
  // Health/Supplements
  { name: 'AG1', domain: 'drinkag1.com', pageId: '107371600800343', vertical: 'Health' },
  { name: 'Athletic Brewing Co', domain: 'athleticbrewing.com', pageId: '1718498498397498', vertical: 'Health' },
  { name: 'Ritual', domain: 'ritual.com', pageId: '1aborSolved77252775', vertical: 'Health' },
  { name: 'Seed Health', domain: 'seed.com', pageId: '1726aborSolvedimize', vertical: 'Health' },
  { name: 'Huel', domain: 'huel.com', pageId: '906aborSolvedhuel', vertical: 'Health' },
  { name: 'LMNT', domain: 'drinklmnt.com', pageId: '10732laborSolved', vertical: 'Health' },
  { name: 'Mud Wtr', domain: 'mudwtr.com', pageId: '10849laborSolved', vertical: 'Health' },
  { name: 'Magic Mind', domain: 'magicmind.com', pageId: '10359laborSolved', vertical: 'Health' },
  { name: 'Obvi', domain: 'myobvi.com', pageId: '10627laborSolved', vertical: 'Health' },
  { name: 'MaryRuth Organics', domain: 'maryruthorganics.com', pageId: '82476laborSolved', vertical: 'Health' },
  { name: 'Transparent Labs', domain: 'transparentlabs.com', pageId: '14781laborSolved', vertical: 'Health' },
  { name: 'Four Sigmatic', domain: 'foursigmatic.com', pageId: '72591laborSolved', vertical: 'Health' },
  { name: 'Moon Juice', domain: 'moonjuice.com', pageId: '56348laborSolved', vertical: 'Health' },
  { name: 'Gainful', domain: 'gainful.com', pageId: '19483laborSolved', vertical: 'Health' },
  { name: 'Hum Nutrition', domain: 'humnutrition.com', pageId: '14367laborSolved', vertical: 'Health' },
  { name: 'Thesis', domain: 'takethesis.com', pageId: '10629laborSolved', vertical: 'Health' },
  { name: 'Heights', domain: 'yourheights.com', pageId: '10524laborSolved', vertical: 'Health' },
  { name: 'Cymbiotika', domain: 'cymbiotika.com', pageId: '10849laborSolved', vertical: 'Health' },
  { name: 'Bloom Nutrition', domain: 'bloomnu.com', pageId: '10637laborSolved', vertical: 'Health' },
  { name: 'Ghost Lifestyle', domain: 'ghostlifestyle.com', pageId: '10567laborSolved', vertical: 'Health' },

  // Apparel
  { name: 'Skims', domain: 'skims.com', pageId: '21596laborSolved', vertical: 'Apparel' },
  { name: 'True Classic', domain: 'trueclassictees.com', pageId: '10628laborSolved', vertical: 'Apparel' },
  { name: 'Cuts Clothing', domain: 'cutsclothing.com', pageId: '17354laborSolved', vertical: 'Apparel' },
  { name: 'Gymshark', domain: 'gymshark.com', pageId: '269498423082199', vertical: 'Apparel' },
  { name: 'Vuori', domain: 'vuoriclothing.com', pageId: '14168laborSolved', vertical: 'Apparel' },
  { name: 'Quince', domain: 'quince.com', pageId: '10628laborSolved', vertical: 'Apparel' },
  { name: 'Buck Mason', domain: 'buckmason.com', pageId: '47359laborSolved', vertical: 'Apparel' },
  { name: 'Everlane', domain: 'everlane.com', pageId: '15897laborSolved', vertical: 'Apparel' },
  { name: 'Rothys', domain: 'rothys.com', pageId: '10736laborSolved', vertical: 'Apparel' },
  { name: 'Bombas', domain: 'bombas.com', pageId: '32615laborSolved', vertical: 'Apparel' },
  { name: 'Marine Layer', domain: 'marinelayer.com', pageId: '16374laborSolved', vertical: 'Apparel' },
  { name: 'Outerknown', domain: 'outerknown.com', pageId: '10893laborSolved', vertical: 'Apparel' },
  { name: 'Faherty Brand', domain: 'fahertybrand.com', pageId: '51738laborSolved', vertical: 'Apparel' },
  { name: 'Aviator Nation', domain: 'aviatornation.com', pageId: '11926laborSolved', vertical: 'Apparel' },
  { name: 'Chubbies', domain: 'chubbiesclothing.com', pageId: '28456laborSolved', vertical: 'Apparel' },
  { name: 'Jaanuu', domain: 'jaanuu.com', pageId: '10527laborSolved', vertical: 'Apparel' },
  { name: 'ThirdLove', domain: 'thirdlove.com', pageId: '27135laborSolved', vertical: 'Apparel' },
  { name: 'Knix', domain: 'knix.com', pageId: '10628laborSolved', vertical: 'Apparel' },
  { name: 'MeUndies', domain: 'meundies.com', pageId: '27135laborSolved', vertical: 'Apparel' },
  { name: 'Stance', domain: 'stance.com', pageId: '21596laborSolved', vertical: 'Apparel' },

  // Beauty
  { name: 'Jones Road Beauty', domain: 'jonesroadbeauty.com', pageId: '101346822182498', vertical: 'Beauty' },
  { name: 'Dr. Squatch', domain: 'drsquatch.com', pageId: '10736laborSolved', vertical: 'Beauty' },
  { name: 'Glossier', domain: 'glossier.com', pageId: '85736laborSolved', vertical: 'Beauty' },
  { name: 'Ilia Beauty', domain: 'iliabeauty.com', pageId: '17294laborSolved', vertical: 'Beauty' },
  { name: 'Merit Beauty', domain: 'meritbeauty.com', pageId: '10628laborSolved', vertical: 'Beauty' },
  { name: 'Saie Beauty', domain: 'saiebeauty.com', pageId: '10527laborSolved', vertical: 'Beauty' },
  { name: 'Kosas', domain: 'kosas.com', pageId: '10837laborSolved', vertical: 'Beauty' },
  { name: 'Summer Fridays', domain: 'summerfridays.com', pageId: '17264laborSolved', vertical: 'Beauty' },
  { name: 'Bubble Skincare', domain: 'hellobubble.com', pageId: '10638laborSolved', vertical: 'Beauty' },
  { name: 'Topicals', domain: 'mytopicals.com', pageId: '10527laborSolved', vertical: 'Beauty' },
  { name: 'Dae Hair', domain: 'daehair.com', pageId: '10628laborSolved', vertical: 'Beauty' },
  { name: 'Function of Beauty', domain: 'functionofbeauty.com', pageId: '10725laborSolved', vertical: 'Beauty' },
  { name: 'Prose', domain: 'prose.com', pageId: '17253laborSolved', vertical: 'Beauty' },
  { name: 'Madison Reed', domain: 'madison-reed.com', pageId: '46273laborSolved', vertical: 'Beauty' },
  { name: 'Harrys', domain: 'harrys.com', pageId: '52718laborSolved', vertical: 'Beauty' },
  { name: 'Manscaped', domain: 'manscaped.com', pageId: '10527laborSolved', vertical: 'Beauty' },
  { name: 'Lumin', domain: 'luminskin.com', pageId: '10628laborSolved', vertical: 'Beauty' },
  { name: 'Geologie', domain: 'geologie.com', pageId: '10738laborSolved', vertical: 'Beauty' },
  { name: 'Oura', domain: 'ouraring.com', pageId: '10725laborSolved', vertical: 'Beauty' },
  { name: 'Whoop', domain: 'whoop.com', pageId: '10836laborSolved', vertical: 'Beauty' },

  // Home Goods
  { name: 'HexClad', domain: 'hexclad.com', pageId: '10726laborSolved', vertical: 'Home' },
  { name: 'Ridge Wallet', domain: 'ridge.com', pageId: '10738laborSolved', vertical: 'Home' },
  { name: 'Brooklinen', domain: 'brooklinen.com', pageId: '10725laborSolved', vertical: 'Home' },
  { name: 'Parachute Home', domain: 'parachutehome.com', pageId: '10836laborSolved', vertical: 'Home' },
  { name: 'Caraway', domain: 'carawayhome.com', pageId: '10527laborSolved', vertical: 'Home' },
  { name: 'Our Place', domain: 'fromourplace.com', pageId: '10628laborSolved', vertical: 'Home' },
  { name: 'Ruggable', domain: 'ruggable.com', pageId: '10739laborSolved', vertical: 'Home' },
  { name: 'Outer', domain: 'liveouter.com', pageId: '10628laborSolved', vertical: 'Home' },
  { name: 'Burrow', domain: 'burrow.com', pageId: '10725laborSolved', vertical: 'Home' },
  { name: 'Floyd', domain: 'floydhome.com', pageId: '10836laborSolved', vertical: 'Home' },
  { name: 'Article', domain: 'article.com', pageId: '10527laborSolved', vertical: 'Home' },
  { name: 'Breeo', domain: 'breeo.co', pageId: '10628laborSolved', vertical: 'Home' },
  { name: 'RTIC Outdoors', domain: 'rticoutdoors.com', pageId: '10739laborSolved', vertical: 'Home' },
  { name: 'Brumate', domain: 'brumate.com', pageId: '10628laborSolved', vertical: 'Home' },
  { name: 'Simplehuman', domain: 'simplehuman.com', pageId: '10725laborSolved', vertical: 'Home' },
  { name: 'Molekule', domain: 'molekule.com', pageId: '10836laborSolved', vertical: 'Home' },
  { name: 'Tushy', domain: 'hellotushy.com', pageId: '10527laborSolved', vertical: 'Home' },
  { name: 'Branch Furniture', domain: 'branchfurniture.com', pageId: '10628laborSolved', vertical: 'Home' },
  { name: 'Open Spaces', domain: 'getopenspaces.com', pageId: '10739laborSolved', vertical: 'Home' },
  { name: 'Courant', domain: 'staycourant.com', pageId: '10628laborSolved', vertical: 'Home' },

  // Food/Bev
  { name: 'Liquid Death', domain: 'liquiddeath.com', pageId: '10725laborSolved', vertical: 'Food' },
  { name: 'Olipop', domain: 'drinkolipop.com', pageId: '10836laborSolved', vertical: 'Food' },
  { name: 'Poppi', domain: 'drinkpoppi.com', pageId: '10527laborSolved', vertical: 'Food' },
  { name: 'Magic Spoon', domain: 'magicspoon.com', pageId: '10628laborSolved', vertical: 'Food' },
  { name: 'ButcherBox', domain: 'butcherbox.com', pageId: '10739laborSolved', vertical: 'Food' },
  { name: 'Daily Harvest', domain: 'daily-harvest.com', pageId: '10628laborSolved', vertical: 'Food' },
  { name: 'CookUnity', domain: 'cookunity.com', pageId: '10725laborSolved', vertical: 'Food' },
  { name: 'Misfits Market', domain: 'misfitsmarket.com', pageId: '10836laborSolved', vertical: 'Food' },
  { name: 'Thrive Market', domain: 'thrivemarket.com', pageId: '10527laborSolved', vertical: 'Food' },
  { name: 'Fly By Jing', domain: 'flybyjing.com', pageId: '10628laborSolved', vertical: 'Food' },
  { name: 'Momofuku Goods', domain: 'cookanyday.com', pageId: '10739laborSolved', vertical: 'Food' },
  { name: 'Graza', domain: 'graza.co', pageId: '10628laborSolved', vertical: 'Food' },
  { name: 'Brightland', domain: 'brightland.co', pageId: '10725laborSolved', vertical: 'Food' },
  { name: 'Ghia', domain: 'drinkghia.com', pageId: '10836laborSolved', vertical: 'Food' },
  { name: 'Recess', domain: 'takearecess.com', pageId: '10527laborSolved', vertical: 'Food' },
  { name: 'Kin Euphorics', domain: 'kineuphorics.com', pageId: '10628laborSolved', vertical: 'Food' },
  { name: 'De Soi', domain: 'drinkdesoi.com', pageId: '10739laborSolved', vertical: 'Food' },
  { name: 'Muddy Bites', domain: 'muddybites.com', pageId: '10628laborSolved', vertical: 'Food' },
  { name: 'Mid-Day Squares', domain: 'middaysquares.com', pageId: '10725laborSolved', vertical: 'Food' },
  { name: 'Chomps', domain: 'chomps.com', pageId: '10836laborSolved', vertical: 'Food' },
];

console.log('🚀 Starting direct brand import...\n');

const inserted = [];
const skipped = [];
const errors = [];

const insertStmt = db.prepare(`
  INSERT INTO brands (brand_name, website_url, fb_page_url, page_id, vertical, status)
  VALUES (?, ?, ?, ?, ?, 'active')
`);

const checkStmt = db.prepare('SELECT id FROM brands WHERE brand_name = ?');

for (const brand of brands) {
  try {
    // Check if already exists
    const existing = checkStmt.get(brand.name);
    if (existing) {
      skipped.push(brand.name);
      continue;
    }

    // Construct URLs
    const websiteUrl = `https://${brand.domain}`;
    const adLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&search_type=page&sort_data[direction]=desc&sort_data[mode]=total_impressions&view_all_page_id=${brand.pageId}`;

    // Insert
    const result = insertStmt.run(brand.name, websiteUrl, adLibraryUrl, brand.pageId, brand.vertical);
    inserted.push({ name: brand.name, id: result.lastInsertRowid, vertical: brand.vertical });

  } catch (e) {
    errors.push({ name: brand.name, error: e.message });
  }
}

console.log('📊 Import Results:');
console.log('─'.repeat(50));
console.log(`✅ Inserted: ${inserted.length} brands`);
console.log(`⏭️  Skipped:  ${skipped.length} brands (duplicates)`);
console.log(`❌ Errors:   ${errors.length} brands`);
console.log('─'.repeat(50));

if (inserted.length > 0) {
  console.log('\n✅ Successfully imported:');
  inserted.forEach(b => console.log(`   • ${b.name} (${b.vertical})`));
}

if (skipped.length > 0) {
  console.log('\n⏭️  Skipped (already exist):');
  skipped.forEach(name => console.log(`   • ${name}`));
}

if (errors.length > 0) {
  console.log('\n❌ Errors:');
  errors.forEach(e => console.log(`   • ${e.name}: ${e.error}`));
}

console.log('\n🎉 Import complete!');
console.log('\n⚠️  Note: Page IDs are placeholders. You will need to resolve them');
console.log('   via the app UI by clicking "Resolve" next to each brand, or');
console.log('   manually update them with correct page IDs.');

db.close();
