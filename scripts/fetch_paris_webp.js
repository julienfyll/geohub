const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DATA_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_paris.json');
const OUTPUT_DIR = path.join(__dirname, '../public/images/paris');
const REVIEW_HTML_FILE = path.join(__dirname, '../public/review-paris.html');

// Custom Wikipedia article mapping for exact matches on fr.wikipedia.org
const WIKI_TITLE_OVERRIDES = {
  paris_pantheon: 'Panthéon (Paris)',
  paris_invalides: 'Hôtel des Invalides',
  paris_opera_garnier: 'Palais Garnier',
  paris_sainte_chapelle: 'Sainte-Chapelle',
  paris_centre_pompidou: "Centre national d'art et de culture Georges-Pompidou",
  paris_palais_luxembourg: 'Palais du Luxembourg',
  paris_palais_bourbon: 'Palais Bourbon',
  paris_hotel_de_ville: 'Hôtel de ville de Paris',
  paris_petit_palais: 'Petit Palais',
  paris_conciergerie: 'Conciergerie (Paris)',
  paris_place_vendome: 'Place Vendôme',
  paris_place_concorde: 'Place de la Concorde',
  paris_pont_alexandre_iii: 'Pont Alexandre-III',
  paris_palais_royal: 'Domaine national du Palais-Royal',
  paris_musee_orsay: "Musée d'Orsay",
  paris_bourse_commerce: 'Bourse de commerce de Paris',
  paris_madeleine: 'Église de la Madeleine',
  paris_catacombes: 'Catacombes de Paris',
  paris_tour_saint_jacques: 'Tour Saint-Jacques',
  paris_palais_chaillot: 'Palais de Chaillot',
  paris_palais_tokyo: 'Palais de Tokyo',
  paris_college_bernardins: 'Collège des Bernardins',
  paris_st_germain_pres: 'Église de Saint-Germain-des-Prés',
  paris_st_eustache: 'Église Saint-Eustache de Paris',
  paris_colonne_juillet_bastille: 'Colonne de Juillet',
  paris_cirque_hiver: "Cirque d'Hiver (Paris)",
  paris_institut_monde_arabe: 'Institut du monde arabe',
  paris_bnf_mitterrand: 'Site François-Mitterrand',
  paris_bnf_richelieu: 'Site Richelieu',
  paris_cite_sciences: "Cité des sciences et de l'industrie",
  paris_quai_branly: 'Musée du quai Branly - Jacques-Chirac',
  paris_jardin_plantes: 'Grande galerie de l\'Évolution',
  paris_pont_neuf: 'Pont Neuf',
  paris_pont_des_arts: 'Passerelle des Arts',
  paris_elysee: 'Palais de l\'Élysée',
  paris_hotel_matignon: 'Hôtel de Matignon',
  paris_musee_rodin: 'Musée Rodin',
  paris_musee_carnavalet: 'Musée Carnavalet',
  paris_buttes_chaumont_sibylle: 'Parc des Buttes-Chaumont',
  paris_parc_monceau_rotonde: 'Parc Monceau',
  paris_theatre_chatelet: 'Théâtre du Châtelet',
  paris_opera_bastille: 'Opéra Bastille',
  paris_chapelle_expiatoire: 'Chapelle expiatoire',
  paris_observatoire: 'Observatoire de Paris',
  paris_st_augustin: 'Église Saint-Augustin de Paris',
  paris_maison_victor_hugo: 'Maison de Victor Hugo',
  paris_gare_du_nord: 'Gare de Paris-Nord',
  paris_gare_de_l_est: 'Gare de Paris-Est',
  paris_canal_saint_martin: 'Canal Saint-Martin',
  paris_porte_saint_denis: 'Porte Saint-Denis',
  paris_pere_lachaise: 'Cimetière du Père-Lachaise',
  paris_parc_belleville: 'Parc de Belleville',
  paris_eglise_charonne: 'Église Saint-Germain de Charonne',
  paris_carre_baudouin: 'Pavillon Carré de Baudouin',
  paris_parc_martin_luther_king: 'Parc Clichy-Batignolles - Martin-Luther-King',
  paris_place_de_clichy: 'Place de Clichy',
  paris_cite_des_fleurs: 'Cité des fleurs',
  paris_butte_aux_cailles: 'Butte-aux-Cailles',
  paris_station_f: 'Halle Freyssinet',
  paris_manufacture_gobelins: 'Manufacture des Gobelins',
  paris_olympiades_chinatown: 'Les Olympiades (Paris)',
  paris_gare_de_lyon: 'Gare de Paris-Lyon',
  paris_coulee_verte: 'Coulée verte René-Dumont',
  paris_palais_porte_doree: 'Palais de la Porte-Dorée',
  paris_bercy_arena: 'Palais omnisports de Paris-Bercy',
  paris_bassin_arsenal: 'Port de l\'Arsenal',
  paris_parc_andre_citroen: 'Parc André-Citroën',
  paris_statue_liberte_cygnes: 'Île aux Cygnes (Paris)',
  paris_pont_bir_hakeim: 'Pont de Bir-Hakeim',
  paris_parc_georges_brassens: 'Parc Georges-Brassens',
  paris_parc_montsouris: 'Parc Montsouris',
  paris_cite_universitaire: 'Cité internationale universitaire de Paris',
  paris_roland_garros: 'Stade Roland-Garros',
  paris_parc_des_princes: 'Parc des Princes',
  paris_maison_balzac: 'Maison de Balzac',
  paris_place_du_tertre: 'Place du Tertre',
  paris_vignes_montmartre: 'Vignes de Montmartre',
  paris_bassin_villette_rotonde: 'Rotonde de la Villette',
  paris_centquatre: 'Cent Quatre (Paris)',
  paris_palais_brongniart: 'Palais Brongniart',
  paris_passage_panoramas: 'Passage des Panoramas',
  paris_tour_jean_sans_peur: 'Tour Jean-sans-Peur',
  paris_musee_picasso: 'Musée Picasso (Paris)',
  paris_arts_et_metiers: 'Musée des Arts et Métiers',
  paris_musee_grevin: 'Musée Grévin',
  paris_folies_bergere: 'Folies Bergère',
  paris_bataclan: 'Bataclan',
  paris_atelier_lumieres: 'Atelier des Lumières',
  paris_pont_mirabeau: 'Pont Mirabeau',
  paris_passerelle_simone_beauvoir: 'Passerelle Simone-de-Beauvoir',
  paris_cour_carree_louvre: 'Cour carrée'
};

const USER_AGENT = 'GeoHubGameBot/1.0 (contact: julien.fayolle@centrale.centralelille.fr)';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanTitle(name) {
  return name.replace(/\s*\(.*?\)\s*/g, '').trim();
}

async function queryWikipediaImage(wikiTitle) {
  const url = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    wikiTitle
  )}&redirects=1&prop=pageimages|extracts&piprop=original|thumbnail&pithumbsize=1000&exintro=1&explaintext=1&format=json`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    for (const key of Object.keys(pages)) {
      const page = pages[key];
      if (page.thumbnail?.source) {
        return {
          source: page.thumbnail.source,
          original: page.original?.source || page.thumbnail.source,
          title: page.title,
          extract: page.extract ? page.extract.slice(0, 150) + '...' : ''
        };
      }
    }
  } catch (err) {
    console.error(`Fetch error for ${wikiTitle}:`, err.message);
  }
  return null;
}

// Search fallback if exact title did not have pageimage
async function searchWikipediaImage(query) {
  const url = `https://fr.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrlimit=3&prop=pageimages&piprop=original|thumbnail&pithumbsize=1000&format=json`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    for (const key of Object.keys(pages)) {
      const page = pages[key];
      if (page.thumbnail?.source) {
        return {
          source: page.thumbnail.source,
          original: page.original?.source || page.thumbnail.source,
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
      height: 533, // 3:2 ratio standard
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  fs.writeFileSync(outputPath, webpBuffer);
  return webpBuffer.length;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const places = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log(`🚀 Starting high-quality WebP harvest for ${places.length} Paris landmarks...`);

  const results = [];
  let successCount = 0;
  let totalBytes = 0;

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const outFilename = `${place.id}.webp`;
    const outPath = path.join(OUTPUT_DIR, outFilename);
    const relativeUrl = `/images/paris/${outFilename}`;

    console.log(`[${i + 1}/${places.length}] Processing "${place.name}" (${place.id})...`);

    // 1. Determine wiki title
    const wikiTitle = WIKI_TITLE_OVERRIDES[place.id] || cleanTitle(place.name);

    // 2. Query Wikipedia API
    let imgInfo = await queryWikipediaImage(wikiTitle);
    if (!imgInfo) {
      console.log(`  ⚠️ Exact title query failed for "${wikiTitle}", attempting search query...`);
      imgInfo = await searchWikipediaImage(place.name);
    }

    let downloaded = false;
    let fileSizeKb = 0;
    let resolvedUrl = '';

    if (imgInfo && imgInfo.source) {
      resolvedUrl = imgInfo.source;
      try {
        const bytes = await downloadAndProcessWebp(resolvedUrl, outPath);
        fileSizeKb = Math.round(bytes / 1024);
        totalBytes += bytes;
        downloaded = true;
        successCount++;
        console.log(`  ✅ Saved ${outFilename} (${fileSizeKb} KB) [Wiki: ${imgInfo.title}]`);
      } catch (err) {
        console.error(`  ❌ Download error: ${err.message}`);
      }
    } else {
      console.warn(`  ❌ No Wikipedia image found for "${place.name}"`);
    }

    results.push({
      ...place,
      webpPath: relativeUrl,
      fileSizeKb,
      status: downloaded ? 'ok' : 'failed',
      wikiTitle: imgInfo?.title || 'Non trouvé',
      sourceUrl: resolvedUrl
    });

    // Rate limiting to respect Wikimedia guidelines
    await sleep(80);
  }

  console.log(`\n🎉 Finished! ${successCount}/${places.length} images converted successfully.`);
  console.log(`📦 Total package size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);

  // Generate Review HTML contact sheet
  generateContactSheet(results, totalBytes);
}

function generateContactSheet(results, totalBytes) {
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
  const successCount = results.filter((r) => r.status === 'ok').length;

  const html = `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Planche Contact — 105 Lieux de Paris (Blind Point)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b0f19; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body class="p-6 sm:p-10">
  <header class="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
        GeoHub · Blind Point Paris
      </div>
      <h1 class="text-3xl font-black text-white tracking-tight">Planche Contact & Contrôle Qualité Visuel</h1>
      <p class="text-sm text-slate-400 mt-1">105 monuments et hauts lieux parisiens convertis en WebP local haute performance.</p>
    </div>
    <div class="flex items-center gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-right">
        <span class="text-xs text-slate-400 uppercase tracking-wider block font-bold">Couverture</span>
        <span class="text-xl font-black text-emerald-400">${successCount} / ${results.length}</span>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-right">
        <span class="text-xs text-slate-400 uppercase tracking-wider block font-bold">Poids Total</span>
        <span class="text-xl font-black text-blue-400">${totalMb} Mo</span>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    ${results
      .map(
        (r, idx) => `
      <div class="bg-slate-900/90 border ${
        r.status === 'ok' ? 'border-slate-800 hover:border-slate-600' : 'border-rose-500/50 bg-rose-950/20'
      } rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col">
        <div class="relative w-full aspect-[3/2] bg-slate-950 overflow-hidden">
          ${
            r.status === 'ok'
              ? `<img src="${r.webpPath}" alt="${r.name}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />`
              : `<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center text-rose-400 text-xs"><span>⚠️ Image manquante</span></div>`
          }
          <div class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-slate-200">
            #${idx + 1} · ${r.arrondissement}ᵉ arr.
          </div>
          ${
            r.status === 'ok'
              ? `<div class="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300 backdrop-blur-md">${r.fileSizeKb} KB</div>`
              : ''
          }
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-white text-sm line-clamp-1 mb-1">${r.name}</h3>
            <div class="flex items-center gap-1.5 mb-2">
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium capitalize">${r.category}</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 font-medium">${r.bank.replace('_', ' ')}</span>
            </div>
            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">${r.funFact || ''}</p>
          </div>
          <div class="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>Wiki: ${r.wikiTitle}</span>
          </div>
        </div>
      </div>
    `
      )
      .join('')}
  </main>
</body>
</html>`;

  fs.writeFileSync(REVIEW_HTML_FILE, html, 'utf8');
  console.log(`\n📋 Review contact sheet generated at: ${REVIEW_HTML_FILE}`);
}

main().catch(console.error);
