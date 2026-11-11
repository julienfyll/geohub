const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../src/lib/games/borderpass/data');
const WORLD_FILE = path.join(DATA_DIR, 'world_borders.json');
const FRANCE_FILE = path.join(DATA_DIR, 'france_borders.json');

function stripAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

async function buildWorldData() {
  console.log('🌍 Fetching and building World Borders Graph...');
  const res = await fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json');
  const countries = await res.json();

  const map = new Map();
  countries.forEach((c) => map.set(c.cca3, c));

  // Fix known discrepancies (e.g. Sri Lanka LKA is an island with no land bridge)
  const ind = map.get('IND');
  if (ind?.borders) ind.borders = ind.borders.filter((b) => b !== 'LKA');

  // Fixed Links (bridges & tunnels)
  const FIXED_LINKS = [
    { from: 'DNK', to: 'SWE', label: "Pont de l'Øresund", type: 'bridge' },
    { from: 'FRA', to: 'GBR', label: 'Eurotunnel', type: 'tunnel' },
    { from: 'SAU', to: 'BHR', label: 'Chaussée du Roi Fahd', type: 'causeway' },
    { from: 'MYS', to: 'SGP', label: 'Chaussée Johor-Singapour', type: 'causeway' }
  ];

  // Helper flag emoji from cca2
  function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  const worldEntities = {};

  countries.forEach((c) => {
    const rawBorders = c.borders || [];
    // Only include countries that have borders OR fixed links
    const relevantLinks = FIXED_LINKS.filter((l) => l.from === c.cca3 || l.to === c.cca3);
    if (rawBorders.length === 0 && relevantLinks.length === 0) return;

    const frenchName = c.translations?.fra?.common || c.name?.common;
    const norm = stripAccents(frenchName);

    const neighborsSet = new Set(rawBorders.filter((b) => map.has(b) && b !== 'LKA'));

    const fixedLinkObjects = [];
    relevantLinks.forEach((l) => {
      const targetId = l.from === c.cca3 ? l.to : l.from;
      neighborsSet.add(targetId);
      fixedLinkObjects.push({
        targetId,
        label: l.label,
        type: l.type
      });
    });

    worldEntities[c.cca3] = {
      id: c.cca3,
      name: frenchName,
      normalizedName: norm,
      aliases: [
        c.name?.common,
        c.cca2,
        c.cca3,
        c.translations?.fra?.official
      ].filter(Boolean),
      capitalOrChefLieu: c.capital?.[0] || '',
      continentOrRegion: c.region || '',
      latitude: c.latlng?.[0] || 0,
      longitude: c.latlng?.[1] || 0,
      neighbors: Array.from(neighborsSet),
      fixedLinks: fixedLinkObjects.length > 0 ? fixedLinkObjects : undefined,
      flagEmoji: getFlagEmoji(c.cca2),
      population: c.population || 0,
      areaKm2: c.area || 0
    };
  });

  // Ensure bidirectional symmetry
  Object.values(worldEntities).forEach((entity) => {
    entity.neighbors.forEach((nbrId) => {
      if (worldEntities[nbrId]) {
        if (!worldEntities[nbrId].neighbors.includes(entity.id)) {
          worldEntities[nbrId].neighbors.push(entity.id);
        }
      }
    });
  });

  fs.writeFileSync(WORLD_FILE, JSON.stringify(worldEntities, null, 2), 'utf8');
  console.log(`✅ Saved ${Object.keys(worldEntities).length} countries in ${WORLD_FILE}`);
}

async function buildFranceData() {
  console.log('\n🇫🇷 Fetching and building France Departments Graph...');
  const res = await fetch(
    'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson'
  );
  const geojson = await res.json();

  function getCoords(geom) {
    if (geom.type === 'Polygon') return geom.coordinates.flat();
    if (geom.type === 'MultiPolygon') return geom.coordinates.flat(2);
    return [];
  }

  // Pre-calculate centers and coordinate vertex sets
  const deptData = geojson.features.map((f) => {
    const coords = getCoords(f.geometry);
    let sumLon = 0, sumLat = 0;
    coords.forEach(([lon, lat]) => {
      sumLon += lon;
      sumLat += lat;
    });
    const avgLon = coords.length ? sumLon / coords.length : 0;
    const avgLat = coords.length ? sumLat / coords.length : 0;

    const points = new Set(
      coords.map(([lon, lat]) => `${lon.toFixed(3)},${lat.toFixed(3)}`)
    );

    return {
      code: f.properties.code,
      nom: f.properties.nom,
      lat: Number(avgLat.toFixed(4)),
      lon: Number(avgLon.toFixed(4)),
      points
    };
  });

  // Prefectures / Chef-lieu dictionary for French departments
  const CHEFS_LIEUX = {
    '01': 'Bourg-en-Bresse', '02': 'Laon', '03': 'Moulins', '04': 'Digne-les-Bains', '05': 'Gap',
    '06': 'Nice', '07': 'Privas', '08': 'Charleville-Mézières', '09': 'Foix', '10': 'Troyes',
    '11': 'Carcassonne', '12': 'Rodez', '13': 'Marseille', '14': 'Caen', '15': 'Aurillac',
    '16': 'Angoulême', '17': 'La Rochelle', '18': 'Bourges', '19': 'Tulle', '2A': 'Ajaccio',
    '2B': 'Bastia', '21': 'Dijon', '22': 'Saint-Brieuc', '23': 'Guéret', '24': 'Périgueux',
    '25': 'Besançon', '26': 'Valence', '27': 'Évreux', '28': 'Chartres', '29': 'Quimper',
    '30': 'Nîmes', '31': 'Toulouse', '32': 'Auch', '33': 'Bordeaux', '34': 'Montpellier',
    '35': 'Rennes', '36': 'Châteauroux', '37': 'Tours', '38': 'Grenoble', '39': 'Lons-le-Saunier',
    '40': 'Mont-de-Marsan', '41': 'Blois', '42': 'Saint-Étienne', '43': 'Le Puy-en-Velay', '44': 'Nantes',
    '45': 'Orléans', '46': 'Cahors', '47': 'Agen', '48': 'Mende', '49': 'Angers',
    '50': 'Saint-Lô', '51': 'Châlons-en-Champagne', '52': 'Chaumont', '53': 'Laval', '54': 'Nancy',
    '55': 'Bar-le-Duc', '56': 'Vannes', '57': 'Metz', '58': 'Nevers', '59': 'Lille',
    '60': 'Beauvais', '61': 'Alençon', '62': 'Arras', '63': 'Clermont-Ferrand', '64': 'Pau',
    '65': 'Tarbes', '66': 'Perpignan', '67': 'Strasbourg', '68': 'Colmar', '69': 'Lyon',
    '70': 'Vesoul', '71': 'Mâcon', '72': 'Le Mans', '73': 'Chambéry', '74': 'Annecy',
    '75': 'Paris', '76': 'Rouen', '77': 'Melun', '78': 'Versailles', '79': 'Niort',
    '80': 'Amiens', '81': 'Albi', '82': 'Montauban', '83': 'Toulon', '84': 'Avignon',
    '85': 'La Roche-sur-Yon', '86': 'Poitiers', '87': 'Limoges', '88': 'Épinal', '89': 'Auxerre',
    '90': 'Belfort', '91': 'Évry-Courcouronnes', '92': 'Nanterre', '93': 'Bobigny', '94': 'Créteil',
    '95': 'Cergy'
  };

  const franceEntities = {};

  deptData.forEach((d1) => {
    const neighbors = [];
    deptData.forEach((d2) => {
      if (d1.code === d2.code) return;
      let shared = 0;
      for (const pt of d1.points) {
        if (d2.points.has(pt)) shared++;
        if (shared >= 2) break; // At least 2 points along a boundary line
      }
      if (shared >= 2) {
        neighbors.push(d2.code);
      }
    });

    const chefLieu = CHEFS_LIEUX[d1.code] || '';
    const norm = stripAccents(d1.nom);

    franceEntities[d1.code] = {
      id: d1.code,
      name: d1.nom,
      normalizedName: norm,
      aliases: [
        d1.code,
        chefLieu,
        norm.replace(/-/g, ' ')
      ].filter(Boolean),
      capitalOrChefLieu: chefLieu,
      latitude: d1.lat,
      longitude: d1.lon,
      neighbors: neighbors.sort()
    };
  });

  // Ensure bidirectional symmetry
  Object.values(franceEntities).forEach((dept) => {
    dept.neighbors.forEach((nbrCode) => {
      if (franceEntities[nbrCode]) {
        if (!franceEntities[nbrCode].neighbors.includes(dept.id)) {
          franceEntities[nbrCode].neighbors.push(dept.id);
          franceEntities[nbrCode].neighbors.sort();
        }
      }
    });
  });

  fs.writeFileSync(FRANCE_FILE, JSON.stringify(franceEntities, null, 2), 'utf8');
  console.log(`✅ Saved ${Object.keys(franceEntities).length} departments in ${FRANCE_FILE}`);
}

async function run() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  await buildWorldData();
  await buildFranceData();
  console.log('\n🏁 Phase 1 datasets built successfully!');
}

run().catch(console.error);
