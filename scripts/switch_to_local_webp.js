const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_paris.json');
const IMAGES_DIR = path.join(__dirname, '../public/images/paris');

function switchUrls() {
  const places = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  let updated = 0;

  places.forEach((p) => {
    const webpFilename = `${p.id}.webp`;
    const fullPath = path.join(IMAGES_DIR, webpFilename);
    if (fs.existsSync(fullPath)) {
      p.imageUrl = `/images/paris/${webpFilename}`;
      updated++;
    } else {
      console.warn(`⚠️ Missing WebP image for ${p.id}`);
    }
  });

  fs.writeFileSync(DATA_FILE, JSON.stringify(places, null, 2), 'utf8');
  console.log(`✅ Updated ${updated}/${places.length} locations to local WebP URLs in lieux_paris.json`);
}

switchUrls();
