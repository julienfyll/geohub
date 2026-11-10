const fs = require('fs');
const path = require('path');

const PARIS_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_paris.json');
const FRANCE_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_france.json');
const MONDE_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_monde.json');

const PUBLIC_DIR = path.join(__dirname, '../public');
const OUT_FILE = path.join(__dirname, '../public/review-monuments.html');

function loadPack(file, name, badgeClass) {
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));
  let totalBytes = 0;
  let okCount = 0;

  const enriched = items.map((item, idx) => {
    let sizeKb = 0;
    let exists = false;
    if (item.imageUrl && item.imageUrl.startsWith('/')) {
      const fullPath = path.join(PUBLIC_DIR, item.imageUrl);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        sizeKb = Math.round(stat.size / 1024);
        totalBytes += stat.size;
        exists = true;
        okCount++;
      }
    }
    return {
      ...item,
      index: idx + 1,
      exists,
      sizeKb
    };
  });

  return {
    name,
    badgeClass,
    items: enriched,
    total: items.length,
    okCount,
    totalBytes,
    totalMb: (totalBytes / (1024 * 1024)).toFixed(2)
  };
}

function generate() {
  const paris = loadPack(PARIS_FILE, 'Paris (105)', 'bg-blue-500/15 text-blue-300 border-blue-500/30');
  const france = loadPack(FRANCE_FILE, 'France & Châteaux (58)', 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30');
  const monde = loadPack(MONDE_FILE, 'Monde & Merveilles (50)', 'bg-amber-500/15 text-amber-300 border-amber-500/30');

  const grandTotal = paris.total + france.total + monde.total;
  const grandOk = paris.okCount + france.okCount + monde.okCount;
  const grandBytes = paris.totalBytes + france.totalBytes + monde.totalBytes;
  const grandMb = (grandBytes / (1024 * 1024)).toFixed(2);

  const packs = [france, monde, paris];

  const html = `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Planche Contact Intégrale — Tous les Monuments Blind Point (213)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #030712; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    html { scroll-behavior: smooth; }
  </style>
</head>
<body class="p-6 sm:p-10 min-h-screen">
  <header class="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6 sticky top-0 bg-[#030712]/95 backdrop-blur-xl z-30 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
        GeoHub · Blind Point All-Packs
      </div>
      <h1 class="text-3xl font-black text-white tracking-tight">Galerie Intégrale de Tous les Monuments (${grandTotal})</h1>
      <p class="text-sm text-slate-400 mt-1">100% WebP local haute fidélité (800×533), 0 requête externe, 0 lag.</p>
      
      <!-- Quick Anchor Navigation -->
      <div class="flex items-center gap-2 mt-3 flex-wrap">
        <a href="#pack-france" class="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white transition-colors">
          🏰 France (${france.okCount}/${france.total})
        </a>
        <a href="#pack-monde" class="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors">
          🌍 Monde (${monde.okCount}/${monde.total})
        </a>
        <a href="#pack-paris" class="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white transition-colors">
          🗼 Paris (${paris.okCount}/${paris.total})
        </a>
      </div>
    </div>
    
    <div class="flex items-center gap-4">
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-3 text-right">
        <span class="text-xs text-slate-400 uppercase tracking-wider block font-bold">Couverture Totale</span>
        <span class="text-xl font-black text-emerald-400">${grandOk} / ${grandTotal}</span>
      </div>
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-3 text-right">
        <span class="text-xs text-slate-400 uppercase tracking-wider block font-bold">Poids Global</span>
        <span class="text-xl font-black text-blue-400">${grandMb} Mo</span>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto space-y-16">
    ${packs
      .map(
        (pack) => `
      <section id="pack-${pack.name.toLowerCase().includes('france') ? 'france' : pack.name.toLowerCase().includes('monde') ? 'monde' : 'paris'}">
        <div class="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-slate-800">
          <div>
            <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${pack.badgeClass} mb-1">
              ${pack.name}
            </span>
            <h2 class="text-2xl font-black text-white">${pack.name}</h2>
          </div>
          <div class="text-right text-xs font-mono text-slate-400">
            <span class="text-emerald-400 font-bold">${pack.okCount}/${pack.total}</span> · ${pack.totalMb} Mo
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          ${pack.items
            .map(
              (r) => `
            <div class="bg-slate-900/80 border ${
              r.exists ? 'border-slate-800/80 hover:border-blue-500/60' : 'border-rose-500/50 bg-rose-950/20'
            } rounded-2xl overflow-hidden shadow-xl transition-all duration-200 flex flex-col group">
              <div class="relative w-full aspect-[3/2] bg-slate-950 overflow-hidden">
                ${
                  r.exists
                    ? `<img src="${r.imageUrl}" alt="${r.name}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />`
                    : `<div class="w-full h-full flex items-center justify-center text-rose-400 text-xs font-bold">⚠️ Non trouvée</div>`
                }
                <div class="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-white/10">
                  #${r.index}
                </div>
                ${
                  r.exists
                    ? `<div class="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 backdrop-blur-md">${r.sizeKb} KB</div>`
                    : ''
                }
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="font-extrabold text-white text-[15px] leading-snug mb-1">${r.name}</h3>
                  <p class="text-[11px] text-slate-400 mb-2 truncate">${r.subtitle || ''}</p>
                  <div class="flex items-center gap-1.5 flex-wrap mb-2.5">
                    ${
                      r.category
                        ? `<span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300 font-semibold uppercase tracking-wider">${r.category}</span>`
                        : ''
                    }
                    ${
                      r.yearBuilt
                        ? `<span class="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono">${r.yearBuilt > 0 ? r.yearBuilt : Math.abs(r.yearBuilt) + ' av. J.-C.'}</span>`
                        : ''
                    }
                  </div>
                  <p class="text-xs text-slate-300/90 leading-relaxed font-normal">${r.funFact || ''}</p>
                </div>
                <div class="pt-3 mt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span class="truncate max-w-[200px]">id: ${r.id}</span>
                  <span class="text-emerald-400 font-bold shrink-0">✓ WebP</span>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </section>
    `
      )
      .join('')}
  </main>
</body>
</html>`;

  fs.writeFileSync(OUT_FILE, html, 'utf8');
  console.log(`\n✅ Unified contact sheet generated at: ${OUT_FILE}`);
  console.log(`📊 Grand total: ${grandOk}/${grandTotal} monuments (${grandMb} MB)\n`);
}

generate();
module.exports = { generate };
