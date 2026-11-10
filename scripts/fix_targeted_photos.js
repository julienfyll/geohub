const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TARGETS = [
  {
    id: 'paris_centre_pompidou',
    name: 'Centre Georges Pompidou',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Centre_Georges_Pompidou_en_2016.jpg'
  },
  {
    id: 'paris_cite_sciences',
    name: 'Cité des sciences et de l\'industrie',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/La_cite_des_sciences_1.jpg'
  },
  {
    id: 'paris_philharmonie',
    name: 'Philharmonie de Paris',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/La_Philharmonie_de_Paris_%2820192922398%29.jpg'
  },
  {
    id: 'paris_palais_porte_doree',
    name: 'Palais de la Porte Dorée',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Palais_Porte_Doree_Facade_gauche.jpg'
  },
  {
    id: 'paris_palais_royal',
    name: 'Domaine National du Palais-Royal',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Palais_Royal%2C_Paris_8_September_2019.jpg'
  },
  {
    id: 'paris_olympiades_chinatown',
    name: 'Quartier Asiatique (Dalle des Olympiades)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Dalle_des_Olympiades%2C_Paris_19_March_2017.jpg'
  },
  {
    id: 'paris_vignes_montmartre',
    name: 'Clos Montmartre & Cabaret du Lapin Agile',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Clos_Montmartre_%40_Montmartre_%40_Paris_%2833385166874%29.jpg'
  },
  {
    id: 'paris_musee_picasso',
    name: 'Musée National Picasso (Hôtel Salé)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Mus%C3%A9e_Picasso_Paris_-_H%C3%B4tel_Sal%C3%A9_-_Mai_2015_03.JPG'
  },
  {
    id: 'paris_musee_grevin',
    name: 'Musée Grévin',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Grevin_2.jpg'
  },
  {
    id: 'paris_institut_monde_arabe',
    name: 'Institut du Monde Arabe',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Paris_Pont_de_Sully_IMA_dsc04039.jpg'
  },
  {
    id: 'paris_buttes_chaumont_sibylle',
    name: 'Temple de la Sibylle (Buttes-Chaumont)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Temple_de_la_Sybille_%40_Parc_des_Buttes_Chaumont_%40_Paris_%2825674109042%29.jpg'
  },
  {
    id: 'paris_invalides',
    name: 'Hôtel National des Invalides (Dôme)',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/South_facade_of_D%C3%B4me_des_Invalides.jpg'
  }
];

const OUTPUT_DIR = path.join(__dirname, '../public/images/paris');
const USER_AGENT = 'GeoHubGameBot/1.0 (contact: julien.fayolle@centrale.centralelille.fr)';

async function run() {
  console.log(`🔍 Upgrading ${TARGETS.length} specific landmark photos to verified high-res building photography...`);

  for (const item of TARGETS) {
    const outPath = path.join(OUTPUT_DIR, `${item.id}.webp`);
    console.log(`Fetching photo for ${item.name} (${item.id})...`);

    const res = await fetch(item.url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} for ${item.url}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const webpBuf = await sharp(buf)
      .resize({
        width: 800,
        height: 533,
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    fs.writeFileSync(outPath, webpBuf);
    console.log(`  ✅ Successfully updated ${item.id}.webp (${Math.round(webpBuf.length / 1024)} KB)`);
  }

  console.log('\n✨ Regenerating review-paris.html with updated images and metadata...');
  require('./generate_contact_sheet.js');
}

run().catch(console.error);
