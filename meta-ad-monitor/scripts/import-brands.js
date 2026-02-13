#!/usr/bin/env node

/**
 * Bulk Brand Import Script
 *
 * Usage: node scripts/import-brands.js
 *
 * Make sure the server is running before executing this script.
 */

const csv = `Brand Name,Category,Website Domain,Facebook Page URL
AG1,Health/Supplements,drinkag1.com,https://www.facebook.com/drinkAG1
Athletic Brewing Co,Health/Supplements,athleticbrewing.com,https://www.facebook.com/AthleticBrewing
Ritual,Health/Supplements,ritual.com,https://www.facebook.com/ritual
Seed Health,Health/Supplements,seed.com,https://www.facebook.com/seed
Huel,Health/Supplements,huel.com,https://www.facebook.com/huel.usa
LMNT,Health/Supplements,drinklmnt.com,https://www.facebook.com/drinkLMNT
Mud\\Wtr,Health/Supplements,mudwtr.com,https://www.facebook.com/mudwtr
Magic Mind,Health/Supplements,magicmind.com,https://www.facebook.com/magicmind
Obvi,Health/Supplements,myobvi.com,https://www.facebook.com/myobvi
MaryRuth Organics,Health/Supplements,maryruthorganics.com,https://www.facebook.com/maryruthorganics
Transparent Labs,Health/Supplements,transparentlabs.com,https://www.facebook.com/TransparentLabs
Four Sigmatic,Health/Supplements,foursigmatic.com,https://www.facebook.com/foursigmatic
Moon Juice,Health/Supplements,moonjuice.com,https://www.facebook.com/MoonJuiceShop
Gainful,Health/Supplements,gainful.com,https://www.facebook.com/gainful
Hum Nutrition,Health/Supplements,humnutrition.com,https://www.facebook.com/humnutrition
Thesis,Health/Supplements,takethesis.com,https://www.facebook.com/takethesis
Heights,Health/Supplements,yourheights.com,https://www.facebook.com/yourheights
Cymbiotika,Health/Supplements,cymbiotika.com,https://www.facebook.com/Cymbiotika
Bloom Nutrition,Health/Supplements,bloomnu.com,https://www.facebook.com/bloomnutrition
Ghost Lifestyle,Health/Supplements,ghostlifestyle.com,https://www.facebook.com/GhostLifestyle
Skims,Apparel,skims.com,https://www.facebook.com/skims
True Classic,Apparel,trueclassictees.com,https://www.facebook.com/trueclassictees
Cuts Clothing,Apparel,cutsclothing.com,https://www.facebook.com/cutsclothing
Gymshark,Apparel,gymshark.com,https://www.facebook.com/Gymshark
Vuori,Apparel,vuoriclothing.com,https://www.facebook.com/Vuoriclothing
Quince,Apparel,quince.com,https://www.facebook.com/onequince
Buck Mason,Apparel,buckmason.com,https://www.facebook.com/buckmasonusa
Everlane,Apparel,everlane.com,https://www.facebook.com/Everlane
Rothy's,Apparel,rothys.com,https://www.facebook.com/rothys
Bombas,Apparel,bombas.com,https://www.facebook.com/bombas
Marine Layer,Apparel,marinelayer.com,https://www.facebook.com/marinelayer
Outerknown,Apparel,outerknown.com,https://www.facebook.com/outerknown
Faherty Brand,Apparel,fahertybrand.com,https://www.facebook.com/fahertybrand
Aviator Nation,Apparel,aviatornation.com,https://www.facebook.com/AviatorNation
Chubbies,Apparel,chubbiesclothing.com,https://www.facebook.com/chubbies
Jaanuu,Apparel,jaanuu.com,https://www.facebook.com/jaanuubyidris
ThirdLove,Apparel,thirdlove.com,https://www.facebook.com/thirdlove
Knix,Apparel,knix.com,https://www.facebook.com/knixwear
MeUndies,Apparel,meundies.com,https://www.facebook.com/meundies
Stance,Apparel,stance.com,https://www.facebook.com/stance
Jones Road Beauty,Beauty,jonesroadbeauty.com,https://www.facebook.com/jonesroadbeauty
Dr. Squatch,Beauty,drsquatch.com,https://www.facebook.com/drsquatch
Glossier,Beauty,glossier.com,https://www.facebook.com/glossier
Ilia Beauty,Beauty,iliabeauty.com,https://www.facebook.com/iliabeauty
Merit Beauty,Beauty,meritbeauty.com,https://www.facebook.com/meritbeauty
Saie Beauty,Beauty,saiebeauty.com,https://www.facebook.com/saiebeauty
Kosas,Beauty,kosas.com,https://www.facebook.com/kosascosmetics
Summer Fridays,Beauty,summerfridays.com,https://www.facebook.com/summerfridays
Bubble Skincare,Beauty,hellobubble.com,https://www.facebook.com/bubbleskincare
Topicals,Beauty,mytopicals.com,https://www.facebook.com/mytopicals
Dae Hair,Beauty,daehair.com,https://www.facebook.com/daehair
Function of Beauty,Beauty,functionofbeauty.com,https://www.facebook.com/functionofbeauty
Prose,Beauty,prose.com,https://www.facebook.com/prosehair
Madison Reed,Beauty,madison-reed.com,https://www.facebook.com/madisonreedllc
Harry's,Beauty,harrys.com,https://www.facebook.com/harrys
Manscaped,Beauty,manscaped.com,https://www.facebook.com/manscaped
Lumin,Beauty,luminskin.com,https://www.facebook.com/lumin.skincare
Geologie,Beauty,geologie.com,https://www.facebook.com/geologie
Oura,Beauty,ouraring.com,https://www.facebook.com/ouraring
Whoop,Beauty,whoop.com,https://www.facebook.com/whoop
HexClad,Home Goods,hexclad.com,https://www.facebook.com/hexclad
Ridge Wallet,Home Goods,ridge.com,https://www.facebook.com/ridgewallet
Brooklinen,Home Goods,brooklinen.com,https://www.facebook.com/brooklinen
Parachute Home,Home Goods,parachutehome.com,https://www.facebook.com/parachutehome
Caraway,Home Goods,carawayhome.com,https://www.facebook.com/carawayhome
Our Place,Home Goods,fromourplace.com,https://www.facebook.com/fromourplace
Ruggable,Home Goods,ruggable.com,https://www.facebook.com/ruggable
Outer,Home Goods,liveouter.com,https://www.facebook.com/liveouter
Burrow,Home Goods,burrow.com,https://www.facebook.com/burrow
Floyd,Home Goods,floydhome.com,https://www.facebook.com/floydhome
Article,Home Goods,article.com,https://www.facebook.com/article
Breeo,Home Goods,breeo.co,https://www.facebook.com/breeo.co
RTIC Outdoors,Home Goods,rticoutdoors.com,https://www.facebook.com/rticoutdoors
Brumate,Home Goods,brumate.com,https://www.facebook.com/brumate
Simplehuman,Home Goods,simplehuman.com,https://www.facebook.com/simplehuman
Molekule,Home Goods,molekule.com,https://www.facebook.com/molekuleair
Tushy,Home Goods,hellotushy.com,https://www.facebook.com/hellotushy
Branch Furniture,Home Goods,branchfurniture.com,https://www.facebook.com/branchfurniture
Open Spaces,Home Goods,getopenspaces.com,https://www.facebook.com/getopenspaces
Courant,Home Goods,staycourant.com,https://www.facebook.com/staycourant
Liquid Death,Food/Bev,liquiddeath.com,https://www.facebook.com/LiquidDeath
Olipop,Food/Bev,drinkolipop.com,https://www.facebook.com/drinkolipop
Poppi,Food/Bev,drinkpoppi.com,https://www.facebook.com/drinkpoppi
Magic Spoon,Food/Bev,magicspoon.com,https://www.facebook.com/magicspooncereal
ButcherBox,Food/Bev,butcherbox.com,https://www.facebook.com/butcherbox
Daily Harvest,Food/Bev,daily-harvest.com,https://www.facebook.com/dailyharvest
CookUnity,Food/Bev,cookunity.com,https://www.facebook.com/cookunity
Misfits Market,Food/Bev,misfitsmarket.com,https://www.facebook.com/misfitsmarket
Thrive Market,Food/Bev,thrivemarket.com,https://www.facebook.com/thrivemarket
Fly By Jing,Food/Bev,flybyjing.com,https://www.facebook.com/flybyjing
Momofuku Goods,Food/Bev,cookanyday.com,https://www.facebook.com/momofukugoods
Graza,Food/Bev,graza.co,https://www.facebook.com/getgraza
Brightland,Food/Bev,brightland.co,https://www.facebook.com/brightland
Ghia,Food/Bev,drinkghia.com,https://www.facebook.com/drinkghia
Recess,Food/Bev,takearecess.com,https://www.facebook.com/takearecess
Kin Euphorics,Food/Bev,kineuphorics.com,https://www.facebook.com/kineuphorics
De Soi,Food/Bev,drinkdesoi.com,https://www.facebook.com/drinkdesoi
Muddy Bites,Food/Bev,muddybites.com,https://www.facebook.com/muddybites
Mid-Day Squares,Food/Bev,middaysquares.com,https://www.facebook.com/middaysquares
Chomps,Food/Bev,chomps.com,https://www.facebook.com/chomps`;

async function importBrands() {
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

  console.log('🚀 Starting bulk brand import...');
  console.log(`📡 Server: ${SERVER_URL}`);
  console.log('');

  try {
    const response = await fetch(`${SERVER_URL}/api/import/brands-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ csv })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Import failed:', result.error);
      process.exit(1);
    }

    console.log('📊 Import Results:');
    console.log('─'.repeat(50));
    console.log(`✅ Inserted: ${result.summary.inserted} brands`);
    console.log(`⏭️  Skipped:  ${result.summary.skipped} brands (duplicates)`);
    console.log(`❌ Errors:   ${result.summary.errors} brands`);
    console.log('─'.repeat(50));

    if (result.inserted.length > 0) {
      console.log('\n✅ Successfully imported:');
      result.inserted.forEach(b => {
        console.log(`   • ${b.brand_name} (${b.vertical}) - page_id: ${b.page_id}`);
      });
    }

    if (result.skipped.length > 0) {
      console.log('\n⏭️  Skipped (already exist):');
      result.skipped.forEach(b => {
        console.log(`   • ${b.brand_name}`);
      });
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(e => {
        console.log(`   • ${e.brand_name}: ${e.error}`);
      });
    }

    console.log('\n🎉 Import complete!');

  } catch (error) {
    console.error('❌ Failed to connect to server:', error.message);
    console.log('\n💡 Make sure the server is running: npm start');
    process.exit(1);
  }
}

importBrands();
