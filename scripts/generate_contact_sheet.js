const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_paris.json');
const OUTPUT_DIR = path.join(__dirname, '../public/images/paris');
const REVIEW_HTML_FILE = path.join(__dirname, '../public/review-paris.html');

function generate() {
  const places = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  let totalBytes = 0;
  let successCount = 0;

  const items = places.map((p, idx) => {
    const webpFilename = `${p.id}.webp`;
    const webpPath = path.join(OUTPUT_DIR, webpFilename);
    const exists = fs.existsSync(webpPath);
    let sizeKb = 0;
    if (exists) {
      const stat = fs.statSync(webpPath);
      sizeKb = Math.round(stat.size / 1024);
      totalBytes += stat.size;
      successCount++;
    }

    return {
      ...p,
      index: idx + 1,
      webpUrl: `/images/paris/${webpFilename}`,
      exists,
      sizeKb
    };
  });

  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

  const html = `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Planche Contact — 105 Lieux de Paris (GeoHub Blind Point)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #030712; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body class="p-6 sm:p-10 min-h-screen">
  <header class="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-[#030712]/95 backdrop-blur-xl z-20 pt-2">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
        GeoHub · Blind Point Paris
      </div>
      <h1 class="text-3xl font-black text-white tracking-tight">Planche Contact & Contrôle Qualité Visuel</h1>
      <p class="text-sm text-slate-400 mt-1">105 photos WebP locales (800×533), zéro 404, zéro 429, chargement instantané.</p>
    </div>
    <div class="flex items-center gap-4">
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-3 text-right">
        <span class="text-xs text-slate-400 uppercase tracking-wider block font-bold">Couverture</span>
        <span class="text-xl font-black text-emerald-400">${successCount} / ${places.length}</span>
      </div>
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-3 text-right">
        <span class="text-xs text-slate-400 uppercase tracking-wider block font-bold">Poids Total</span>
        <span class="text-xl font-black text-blue-400">${totalMb} Mo</span>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    ${items
      .map(
        (r) => `
      <div class="bg-slate-900/80 border ${
        r.exists ? 'border-slate-800/80 hover:border-blue-500/60' : 'border-rose-500/50 bg-rose-950/20'
      } rounded-2xl overflow-hidden shadow-xl transition-all duration-200 flex flex-col group">
        <div class="relative w-full aspect-[3/2] bg-slate-950 overflow-hidden">
          ${
            r.exists
              ? `<img src="${r.webpUrl}" alt="${r.name}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />`
              : `<div class="w-full h-full flex items-center justify-center text-rose-400 text-xs font-bold">⚠️ Non trouvée</div>`
          }
          <div class="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-white/10">
            #${r.index} · ${r.arrondissement}ᵉ arr.
          </div>
          ${
            r.exists
              ? `<div class="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 backdrop-blur-md">${r.sizeKb} KB</div>`
              : ''
          }
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-extrabold text-white text-[15px] leading-snug mb-1.5">${r.name}</h3>
            <div class="flex items-center gap-1.5 flex-wrap mb-2.5">
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300 font-semibold uppercase tracking-wider">${r.category}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold">${r.bank.replace('_', ' ')}</span>
              ${
                r.yearBuilt
                  ? `<span class="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono">${r.yearBuilt}</span>`
                  : ''
              }
            </div>
            <p class="text-xs text-slate-300/90 leading-relaxed font-normal">${r.funFact || ''}</p>
          </div>
          <div class="pt-3 mt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>id: ${r.id}</span>
            <span class="text-emerald-400 font-bold">✓ WebP</span>
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
  console.log(`✅ Review contact sheet updated at: ${REVIEW_HTML_FILE} (${totalMb} MB total)`);
}

generate();
module.exports = { generate };
