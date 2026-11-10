const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const FRANCE_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_france.json');
const MONDE_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_monde.json');
const CASTLES_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/castles.json');
const MONUMENTS_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/monuments.json');

const FRANCE_IMG_DIR = path.join(__dirname, '../public/images/france');
const MONDE_IMG_DIR = path.join(__dirname, '../public/images/monde');

const USER_AGENT = 'GeoHubGameBot/1.0 (contact: julien.fayolle@centrale.centralelille.fr)';

// Explicit Wikipedia article overrides for 100% accurate hits
const WIKI_FRANCE_OVERRIDES = {
  castle_chambord: 'Château de Chambord',
  castle_chenonceau: 'Château de Chenonceau',
  castle_carcassonne: 'Cité de Carcassonne',
  castle_mont_saint_michel: 'Mont-Saint-Michel',
  castle_versailles: 'Château de Versailles',
  castle_haut_koenigsbourg: 'Château du Haut-Kœnigsbourg',
  castle_fontainebleau: 'Château de Fontainebleau',
  castle_chantilly: 'Château de Chantilly',
  castle_vaux_le_vicomte: 'Château de Vaux-le-Vicomte',
  castle_pierrefonds: 'Château de Pierrefonds',
  castle_amboise: "Château d'Amboise",
  castle_blois: 'Château de Blois',
  castle_cheverny: 'Château de Cheverny',
  castle_villandry: 'Château de Villandry',
  castle_azay_le_rideau: "Château d'Azay-le-Rideau",
  castle_chateau_gaillard: 'Château-Gaillard',
  castle_angers: "Château d'Angers",
  castle_saumur: 'Château de Saumur',
  castle_peyrepertuse: 'Château de Peyrepertuse',
  castle_queribus: 'Château de Quéribus',
  castle_montsegur: 'Château de Montségur',
  castle_foix: 'Château de Foix',
  castle_castelnaud: 'Château de Castelnaud',
  castle_beynac: 'Château de Beynac',
  castle_bonaguil: 'Château de Bonaguil',
  castle_murol: 'Château de Murol',
  castle_baux_de_provence: 'Château des Baux-de-Provence',
  castle_tarascon: 'Château de Tarascon',
  castle_chateau_d_if: "Château d'If",
  castle_palais_des_papes: 'Palais des papes d\'Avignon',
  castle_citadelle_besancon: 'Citadelle de Besançon',
  castle_citadelle_belfort: 'Lion de Belfort',
  castle_citadelle_blaye: 'Citadelle de Blaye',
  castle_fort_boyard: 'Fort Boyard (monument)',
  castle_chateau_vincennes: 'Château de Vincennes',
  castle_compiegne: 'Château de Compiègne',
  castle_rambouillet: 'Château de Rambouillet',
  castle_chateaubriant: 'Château de Châteaubriant',
  castle_fougeres: 'Château de Fougères',
  castle_josselin: 'Château de Josselin',
  castle_suscinio: 'Château de Suscinio',
  castle_chinon: 'Forteresse royale de Chinon',
  castle_valencay: 'Château de Valençay',
  castle_usse: "Château d'Ussé",
  castle_langeais: 'Château de Langeais',
  castle_fort_la_latte: 'Fort-la-Latte',
  castle_vitre: 'Château de Vitré',
  castle_sedan: 'Château-fort de Sedan',
  castle_chateaudun: 'Château de Châteaudun',
  castle_sullysurlatour: 'Château de Sully-sur-Loire',
  landmark_tour_eiffel: 'Tour Eiffel',
  landmark_pont_du_gard: 'Pont du Gard',
  landmark_arenes_nimes: 'Arènes de Nîmes',
  landmark_cathedrale_strasbourg: 'Cathédrale Notre-Dame de Strasbourg',
  landmark_viaduc_millau: 'Viaduc de Millau',
  landmark_carnac_alignements: 'Alignements de Carnac',
  landmark_phare_cordouan: 'Phare de Cordouan',
  landmark_grotte_lascaux: 'Grotte de Lascaux'
};

const WIKI_MONDE_OVERRIDES = {
  monument_taj_mahal: 'Taj Mahal',
  monument_machu_picchu: 'Machu Picchu',
  monument_colisee: 'Colisée',
  monument_pyramides_gizeh: 'Complexe pyramidal de Gizeh',
  monument_statue_liberte: 'Statue de la Liberté',
  monument_opera_sydney: 'Opéra de Sydney',
  monument_sagrada_familia: 'Sagrada Família',
  monument_petra: 'Pétra',
  monument_grande_muraille: 'Grande Muraille',
  monument_angkor_wat: 'Angkor Vat',
  monument_christ_redempteur: 'Christ Rédempteur',
  monument_acropole_athenes: 'Acropole d\'Athènes',
  monument_tour_eiffel: 'Tour Eiffel',
  monument_big_ben: 'Big Ben',
  monument_sainte_sophie: 'Sainte-Sophie (Constantinople)',
  monument_chichen_itza: 'Chichén Itzá',
  monument_stonehenge: 'Stonehenge',
  monument_alhambra: 'Alhambra (Grenade)',
  monument_neuschwanstein: 'Château de Neuschwanstein',
  monument_ile_de_paques: 'Moaï',
  monument_mont_fuji: 'Mont Fuji',
  monument_burj_khalifa: 'Burj Khalifa',
  monument_kremlin_moscou: 'Kremlin de Moscou',
  monument_pont_golden_gate: 'Pont du Golden Gate',
  monument_chutes_victoria: 'Chutes Victoria',
  monument_chutes_iguazu: 'Chutes d\'Iguazú',
  monument_chutes_niagara: 'Chutes du Niagara',
  monument_mont_saint_michel: 'Mont-Saint-Michel',
  monument_cite_interdite: 'Cité interdite',
  monument_kinkaku_ji: 'Kinkaku-ji',
  monument_lalibela: 'Églises rupestres de Lalibela',
  monument_djenn_mosquee: 'Grande Mosquée de Djenné',
  monument_table_mountain: 'Montagne de la Table',
  monument_tombouctou: 'Mosquée Sankoré',
  monument_teotihuacan: 'Pyramide du Soleil',
  monument_tikal: 'Tikal',
  monument_lignes_nazca: 'Géoglyphes de Nazca',
  monument_salar_uyuni: 'Salar d\'Uyuni',
  monument_tours_petronas: 'Tours Petronas',
  monument_borobudur: 'Borobudur',
  monument_baalbek: 'Temple de Bacchus (Baalbek)',
  monument_persepolis: 'Persépolis',
  monument_saint_pierre_rome: 'Basilique Saint-Pierre',
  monument_chateau_versailles: 'Château de Versailles',
  monument_tour_de_pise: 'Tour de Pise',
  monument_porte_brandebourg: 'Porte de Brandebourg',
  monument_uluru: 'Uluru',
  monument_mont_rushmore: 'Mont Rushmore',
  monument_grand_canyon: 'Grand Canyon',
  monument_mile_met_york: 'Empire State Building'
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanTitle(name) {
  return name.replace(/\s*\(.*?\)\s*/g, '').trim();
}

async function queryWikipediaImage(wikiTitle) {
  const url = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    wikiTitle
  )}&redirects=1&prop=pageimages|extracts&piprop=original|thumbnail&pithumbsize=1200&exintro=1&explaintext=1&format=json`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    for (const key of Object.keys(pages)) {
      const page = pages[key];
      const src = page.thumbnail?.source || page.original?.source;
      if (src && !isUnwanted(src)) {
        return {
          source: src,
          title: page.title,
          extract: page.extract ? page.extract.slice(0, 160) + '...' : ''
        };
      }
    }
  } catch (err) {
    console.error(`Fetch error for ${wikiTitle}:`, err.message);
  }
  return null;
}

function isUnwanted(url) {
  const lower = url.toLowerCase();
  return (
    lower.includes('logo') ||
    lower.includes('blason') ||
    lower.includes('flag') ||
    lower.includes('carte') ||
    lower.includes('map') ||
    lower.includes('shema') ||
    lower.includes('plan') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.svg.png')
  );
}

async function searchWikipediaImage(query) {
  const url = `https://fr.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrlimit=3&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&format=json`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    for (const key of Object.keys(pages)) {
      const page = pages[key];
      const src = page.thumbnail?.source || page.original?.source;
      if (src && !isUnwanted(src)) {
        return {
          source: src,
          title: page.title
        };
      }
    }
  } catch (err) {
    console.error(`Search error for ${query}:`, err.message);
  }
  return null;
}

async function downloadAndProcessWebp(imageUrl, outputPath) {
  const res = await fetch(imageUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${imageUrl}`);
  }
  const arrayBuf = await res.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuf);

  const webpBuffer = await sharp(inputBuffer)
    .resize({
      width: 800,
      height: 533,
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  fs.writeFileSync(outputPath, webpBuffer);
  return webpBuffer.length;
}

async function processPack(packName, dataFile, outDir, relativePrefix, overrides) {
  console.log(`\n======================================================`);
  console.log(`🏰 Processing ${packName}...`);
  console.log(`======================================================`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const items = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  let success = 0;
  let totalBytes = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const outFilename = `${item.id}.webp`;
    const outPath = path.join(outDir, outFilename);
    const localUrl = `${relativePrefix}/${outFilename}`;

    console.log(`[${i + 1}/${items.length}] ${item.name} (${item.id})...`);

    let downloaded = false;

    // First attempt: If item already had a working imageUrl, try it
    if (item.imageUrl && item.imageUrl.startsWith('http') && !isUnwanted(item.imageUrl)) {
      try {
        const bytes = await downloadAndProcessWebp(item.imageUrl, outPath);
        totalBytes += bytes;
        downloaded = true;
        success++;
        console.log(`  ✅ Cached from existing URL (${Math.round(bytes / 1024)} KB)`);
      } catch (err) {
        // Will fallback to wiki query
      }
    }

    // Second attempt: Wikipedia API with exact title
    if (!downloaded) {
      const wikiTitle = overrides[item.id] || cleanTitle(item.name);
      let imgInfo = await queryWikipediaImage(wikiTitle);
      if (!imgInfo) {
        imgInfo = await searchWikipediaImage(item.name);
      }

      if (imgInfo && imgInfo.source) {
        try {
          const bytes = await downloadAndProcessWebp(imgInfo.source, outPath);
          totalBytes += bytes;
          downloaded = true;
          success++;
          console.log(`  ✅ Harvested from Wiki (${Math.round(bytes / 1024)} KB) [${imgInfo.title}]`);
        } catch (err) {
          console.error(`  ❌ Failed download: ${err.message}`);
        }
      } else {
        console.warn(`  ⚠️ No valid image found for ${item.name}`);
      }
    }

    if (downloaded) {
      item.imageUrl = localUrl;
    }

    await sleep(80);
  }

  fs.writeFileSync(dataFile, JSON.stringify(items, null, 2), 'utf8');
  console.log(`\n🎉 Pack ${packName} complete: ${success}/${items.length} images saved (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  return { success, total: items.length, bytes: totalBytes };
}

async function main() {
  const franceStats = await processPack(
    'France (58 sites)',
    FRANCE_FILE,
    FRANCE_IMG_DIR,
    '/images/france',
    WIKI_FRANCE_OVERRIDES
  );

  const mondeStats = await processPack(
    'Monde (50 merveilles)',
    MONDE_FILE,
    MONDE_IMG_DIR,
    '/images/monde',
    WIKI_MONDE_OVERRIDES
  );

  // Sync castles.json and monuments.json if needed
  syncAuxiliaryFiles();

  console.log('\n======================================================');
  console.log('🏁 ALL MONUMENT PACKS COMPLETED!');
  console.log(`France: ${franceStats.success}/${franceStats.total} images (${(franceStats.bytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Monde:  ${mondeStats.success}/${mondeStats.total} images (${(mondeStats.bytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log('======================================================\n');
}

function syncAuxiliaryFiles() {
  if (fs.existsSync(CASTLES_FILE)) {
    const lf = JSON.parse(fs.readFileSync(FRANCE_FILE, 'utf8'));
    const castles = JSON.parse(fs.readFileSync(CASTLES_FILE, 'utf8'));
    castles.forEach((c) => {
      const match = lf.find((x) => x.id === c.id);
      if (match && match.imageUrl) {
        c.imageUrl = match.imageUrl;
      }
    });
    fs.writeFileSync(CASTLES_FILE, JSON.stringify(castles, null, 2), 'utf8');
    console.log('✅ Synced castles.json');
  }

  if (fs.existsSync(MONUMENTS_FILE)) {
    const lm = JSON.parse(fs.readFileSync(MONDE_FILE, 'utf8'));
    const monuments = JSON.parse(fs.readFileSync(MONUMENTS_FILE, 'utf8'));
    monuments.forEach((m) => {
      const match = lm.find((x) => x.id === m.id);
      if (match && match.imageUrl) {
        m.imageUrl = match.imageUrl;
      }
    });
    fs.writeFileSync(MONUMENTS_FILE, JSON.stringify(monuments, null, 2), 'utf8');
    console.log('✅ Synced monuments.json');
  }
}

main().catch(console.error);
