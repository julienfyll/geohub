import {
  MetroStation,
  MetroLine,
  MetroTopologyData,
  MetroOptimalPathResult,
  MetroValidationResult,
} from "./metroTypes";
import { hashSeed, createRng } from "./engine";
import metroParisRaw from "./data/metro_paris.json";

// Typed stations lookup map
export const METRO_STATIONS_MAP: Record<string, MetroStation> = metroParisRaw as unknown as Record<
  string,
  MetroStation
>;

export const ALL_METRO_STATION_IDS = Object.keys(METRO_STATIONS_MAP);

// Static Metro Lines metadata with terminus and official RATP colors
export const METRO_LINES: MetroLine[] = [
  {
    id: "1",
    num: "1",
    name: "Ligne 1",
    bg: "#FFCD00",
    text: "#111827",
    terminus: ["La Défense", "Château de Vincennes"],
    stations: [
      "la_defense", "esplanade_de_la_defense", "pont_de_neuilly", "les_sablons", "porte_maillot",
      "argentine", "charles_de_gaulle_etoile", "george_v", "franklin_d_roosevelt", "champs_elysees_clemenceau",
      "concorde", "tuileries", "palais_royal_musee_du_louvre", "louvre_rivoli", "chatelet",
      "hotel_de_ville", "saint_paul", "bastille", "gare_de_lyon", "reuilly_diderot",
      "nation", "porte_de_vincennes", "saint_mande", "berault", "chateau_de_vincennes"
    ],
    edges: [],
  },
  {
    id: "2",
    num: "2",
    name: "Ligne 2",
    bg: "#0064B0",
    text: "#FFFFFF",
    terminus: ["Porte Dauphine", "Nation"],
    stations: [
      "porte_dauphine", "victor_hugo", "charles_de_gaulle_etoile", "ternes", "courcelles",
      "monceau", "villiers", "rome", "place_de_clichy", "blanche",
      "pigalle", "anvers", "barbes_rochechouart", "la_chapelle", "stalingrad",
      "jaures", "colonel_fabien", "belleville", "couronnes", "menilmontant",
      "pere_lachaise", "philippe_auguste", "alexandre_dumas", "avron", "nation"
    ],
    edges: [],
  },
  {
    id: "3",
    num: "3",
    name: "Ligne 3",
    bg: "#9F9825",
    text: "#FFFFFF",
    terminus: ["Pont de Levallois", "Gallieni"],
    stations: [
      "pont_de_levallois", "anatole_france", "louise_michel", "porte_de_champerret", "pereire_levallois",
      "wagram", "malesherbes", "villiers", "europe", "saint_lazare",
      "havre_caumartin", "opera", "quatre_septembre", "bourse", "sentier",
      "reaumur_sebastopol", "arts_et_metiers", "temple", "republique", "parmentier",
      "rue_saint_maur", "pere_lachaise", "gambetta", "porte_de_bagnolet", "gallieni"
    ],
    edges: [],
  },
  {
    id: "3bis",
    num: "3b",
    name: "Ligne 3bis",
    bg: "#98D4E2",
    text: "#111827",
    terminus: ["Gambetta", "Porte des Lilas"],
    stations: ["gambetta", "pelleport", "saint_fargeau", "porte_des_lilas"],
    edges: [],
  },
  {
    id: "4",
    num: "4",
    name: "Ligne 4",
    bg: "#CF009E",
    text: "#FFFFFF",
    terminus: ["Porte de Clignancourt", "Bagneux - Lucie Aubrac"],
    stations: [
      "porte_de_clignancourt", "simplon", "marcadet_poissonniers", "chateau_rouge", "barbes_rochechouart",
      "gare_du_nord", "gare_de_l_est", "chateau_d_eau", "strasbourg_saint_denis", "reaumur_sebastopol",
      "etienne_marcel", "les_halles", "chatelet", "cite", "saint_michel",
      "odeon", "saint_germain_des_pres", "saint_sulpice", "saint_placide", "montparnasse_bienvenue",
      "vavin", "raspail", "denfert_rochereau", "mouton_duvernet", "alesia",
      "porte_d_orleans", "mairie_de_montrouge", "barbara", "bagneux_lucie_aubrac"
    ],
    edges: [],
  },
  {
    id: "5",
    num: "5",
    name: "Ligne 5",
    bg: "#FF7E2E",
    text: "#FFFFFF",
    terminus: ["Bobigny Pablo Picasso", "Place d'Italie"],
    stations: [
      "bobigny_pablo_picasso", "bobigny_pantin_raymond_queneau", "eglise_de_pantin", "hoche", "porte_de_pantin",
      "ourcq", "laumiere", "jaures", "stalingrad", "gare_du_nord",
      "gare_de_l_est", "jacques_bonsergent", "republique", "oberkampf", "richard_lenoir",
      "breguet_sabin", "bastille", "quai_de_la_rapee", "gare_d_austerlitz", "saint_marcel",
      "campo_formio", "place_d_italie"
    ],
    edges: [],
  },
  {
    id: "6",
    num: "6",
    name: "Ligne 6",
    bg: "#169B62",
    text: "#FFFFFF",
    terminus: ["Charles De Gaulle-Étoile", "Nation"],
    stations: [
      "charles_de_gaulle_etoile", "kleber", "boissiere", "trocadero", "passy",
      "bir_hakeim", "dupleix", "la_motte_picquet_grenelle", "cambronne", "sevres_lecourbe",
      "pasteur", "montparnasse_bienvenue", "edgar_quinet", "raspail", "denfert_rochereau",
      "saint_jacques", "glaciere", "corvisart", "place_d_italie", "nationale",
      "chevaleret", "quai_de_la_gare", "bercy", "dugommier", "daumesnil",
      "bel_air", "picpus", "nation"
    ],
    edges: [],
  },
  {
    id: "7",
    num: "7",
    name: "Ligne 7",
    bg: "#FA9ABA",
    text: "#111827",
    terminus: ["La Courneuve 8 Mai 1945", "Mairie d'Ivry / Villejuif"],
    stations: [
      "la_courneuve_8_mai_1945", "fort_d_aubervilliers", "aubervilliers_pantin_quatre_chemins", "porte_de_la_villette", "corentin_cariou",
      "crimee", "riquet", "stalingrad", "louis_blanc", "chateau_landon",
      "gare_de_l_est", "poissonniere", "cadet", "le_peletier", "chaussee_d_antin_la_fayette",
      "opera", "pyramides", "palais_royal_musee_du_louvre", "pont_neuf", "chatelet",
      "pont_marie", "sully_morland", "jussieu", "place_monge", "censier_daubenton",
      "les_gobelins", "place_d_italie", "tolbiac", "maison_blanche",
      "porte_d_italie", "porte_de_choisy", "porte_d_ivry", "pierre_et_marie_curie", "mairie_d_ivry",
      "le_kremlin_bicetre", "villejuif_leo_lagrange", "villejuif_paul_vaillant_couturier", "villejuif_louis_aragon"
    ],
    edges: [],
  },
  {
    id: "7bis",
    num: "7b",
    name: "Ligne 7bis",
    bg: "#6ECA97",
    text: "#111827",
    terminus: ["Louis Blanc", "Pré Saint-Gervais"],
    stations: [
      "louis_blanc", "jaures", "bolivar", "buttes_chaumont", "botzaris",
      "place_des_fetes", "pre_saint_gervais", "danube"
    ],
    edges: [],
  },
  {
    id: "8",
    num: "8",
    name: "Ligne 8",
    bg: "#CEADD2",
    text: "#111827",
    terminus: ["Balard", "Créteil - Pointe du Lac"],
    stations: [
      "balard", "lourmel", "boucicaut", "felix_faure", "commerce",
      "la_motte_picquet_grenelle", "ecole_militaire", "la_tour_maubourg", "invalides", "concorde",
      "madeleine", "opera", "richelieu_drouot", "grands_boulevards", "bonne_nouvelle",
      "strasbourg_saint_denis", "republique", "filles_du_calvaire", "saint_sebastien_froissart", "chemin_vert",
      "bastille", "ledru_rollin", "faidherbe_chaligny", "reuilly_diderot", "montgallet",
      "daumesnil", "michel_bizot", "porte_doree", "porte_de_charenton", "liberte",
      "charenton_ecoles", "ecole_veterinaire_de_maisons_alfort", "maisons_alfort_stade", "maisons_alfort_les_juilliottes",
      "creteil_l_echat", "creteil_universite", "creteil_prefecture", "creteil_pointe_du_lac"
    ],
    edges: [],
  },
  {
    id: "9",
    num: "9",
    name: "Ligne 9",
    bg: "#B6BD00",
    text: "#111827",
    terminus: ["Pont de Sèvres", "Mairie de Montreuil"],
    stations: [
      "pont_de_sevres", "billancourt", "marcel_sembat", "porte_de_saint_cloud", "exelmans",
      "michel_ange_molitor", "michel_ange_auteuil", "jasmin", "ranelagh", "la_muette",
      "rue_de_la_pompe", "trocadero", "iena", "alma_marceau", "franklin_d_roosevelt",
      "saint_philippe_du_roule", "miromesnil", "saint_augustin", "havre_caumartin", "chaussee_d_antin_la_fayette",
      "richelieu_drouot", "grands_boulevards", "bonne_nouvelle", "strasbourg_saint_denis", "republique",
      "oberkampf", "saint_ambroise", "voltaire", "charonne", "rue_des_boulets",
      "nation", "buzenval", "maraichers", "porte_de_montreuil", "robespierre",
      "croix_de_chavaux", "mairie_de_montreuil"
    ],
    edges: [],
  },
  {
    id: "10",
    num: "10",
    name: "Ligne 10",
    bg: "#C9910D",
    text: "#FFFFFF",
    terminus: ["Boulogne - Pont de Saint-Cloud", "Gare d'Austerlitz"],
    stations: [
      "boulogne_pont_de_saint_cloud", "boulogne_jean_jaures", "porte_d_auteuil", "michel_ange_auteuil",
      "michel_ange_molitor", "chardon_lagache", "mirabeau", "eglise_d_auteuil", "javel_andre_citroen",
      "charles_michels", "avenue_emile_zola", "la_motte_picquet_grenelle", "segur", "duroc",
      "vaneau", "sevres_babylone", "mabillon", "odeon", "cluny_la_sorbonne",
      "maubert_mutualite", "cardinal_lemoine", "jussieu", "gare_d_austerlitz"
    ],
    edges: [],
  },
  {
    id: "11",
    num: "11",
    name: "Ligne 11",
    bg: "#704B1C",
    text: "#FFFFFF",
    terminus: ["Châtelet", "Rosny-Bois-Perrier"],
    stations: [
      "chatelet", "hotel_de_ville", "rambuteau", "arts_et_metiers", "republique",
      "goncourt", "belleville", "pyrenees", "jourdain", "place_des_fetes",
      "telegraphe", "porte_des_lilas", "mairie_des_lilas", "serge_gainsbourg", "romainville_carnot",
      "montreuil_hopital", "la_dhuys", "coteaux_beauclair", "rosny_bois_perrier"
    ],
    edges: [],
  },
  {
    id: "12",
    num: "12",
    name: "Ligne 12",
    bg: "#007852",
    text: "#FFFFFF",
    terminus: ["Mairie d'Aubervilliers", "Mairie d'Issy"],
    stations: [
      "mairie_d_aubervilliers", "aime_cesaire", "front_populaire", "porte_de_la_chapelle", "marx_dormoy",
      "marcadet_poissonniers", "jules_joffrin", "lamarck_caulaincourt", "abbesses", "pigalle",
      "saint_georges", "notre_dame_de_lorette", "trinite_d_estienne_d_orves", "saint_lazare", "madeleine",
      "concorde", "assemblee_nationale", "solferino", "rue_du_bac", "sevres_babylone",
      "rennes", "notre_dame_des_champs", "montparnasse_bienvenue", "falguiere", "pasteur",
      "volontaires", "vaugirard", "convention", "porte_de_versailles", "corentin_celton", "mairie_d_issy"
    ],
    edges: [],
  },
  {
    id: "13",
    num: "13",
    name: "Ligne 13",
    bg: "#6EC4E8",
    text: "#111827",
    terminus: ["Les Courtilles / St-Denis", "Châtillon-Montrouge"],
    stations: [
      "les_courtilles", "les_agnettes", "gabriel_peri", "mairie_de_clichy", "porte_de_clichy", "brochant",
      "saint_denis_universite", "basilique_de_saint_denis", "saint_denis_porte_de_paris", "carrefour_pleyel",
      "mairie_de_saint_ouen", "garibaldi", "porte_de_saint_ouen", "guy_moquet",
      "la_fourche", "place_de_clichy", "liege", "saint_lazare", "miromesnil",
      "champs_elysees_clemenceau", "invalides", "varenne", "saint_francois_xavier", "duroc",
      "montparnasse_bienvenue", "gaite", "pernety", "plaisance", "porte_de_vanves",
      "malakoff_plateau_de_vanves", "malakoff_rue_etienne_dolet", "chatillon_montrouge"
    ],
    edges: [],
  },
  {
    id: "14",
    num: "14",
    name: "Ligne 14",
    bg: "#62259D",
    text: "#FFFFFF",
    terminus: ["Saint-Denis Pleyel", "Aéroport d’Orly"],
    stations: [
      "saint_denis_pleyel", "mairie_de_saint_ouen", "saint_ouen", "porte_de_clichy", "pont_cardinet",
      "saint_lazare", "madeleine", "pyramides", "chatelet", "gare_de_lyon",
      "bercy", "cour_saint_emilion", "bibliotheque_francois_mitterrand", "olympiades", "maison_blanche",
      "hopital_bicetre", "villejuif_gustave_roussy", "l_hay_les_roses", "chevilly_larue", "thiais_orly", "aeroport_d_orly"
    ],
    edges: [],
  },
];

export const METRO_LINES_MAP: Record<string, MetroLine> = Object.fromEntries(
  METRO_LINES.map((l) => [l.id, l])
);

// Map of line adjacency
const LINE_ADJACENCY: Record<string, Record<string, string[]>> = {};

function initLineAdjacency() {
  METRO_LINES.forEach((line) => {
    LINE_ADJACENCY[line.id] = {};
    const addEdge = (u: string, v: string) => {
      if (!LINE_ADJACENCY[line.id][u]) LINE_ADJACENCY[line.id][u] = [];
      if (!LINE_ADJACENCY[line.id][v]) LINE_ADJACENCY[line.id][v] = [];
      LINE_ADJACENCY[line.id][u].push(v);
      LINE_ADJACENCY[line.id][v].push(u);
    };

    if (line.id === "7") {
      const trunk = [
        "la_courneuve_8_mai_1945", "fort_d_aubervilliers", "aubervilliers_pantin_quatre_chemins", "porte_de_la_villette", "corentin_cariou",
        "crimee", "riquet", "stalingrad", "louis_blanc", "chateau_landon",
        "gare_de_l_est", "poissonniere", "cadet", "le_peletier", "chaussee_d_antin_la_fayette",
        "opera", "pyramides", "palais_royal_musee_du_louvre", "pont_neuf", "chatelet",
        "pont_marie", "sully_morland", "jussieu", "place_monge", "censier_daubenton",
        "les_gobelins", "place_d_italie", "tolbiac", "maison_blanche"
      ];
      const ivry = ["maison_blanche", "porte_d_italie", "porte_de_choisy", "porte_d_ivry", "pierre_et_marie_curie", "mairie_d_ivry"];
      const villejuif = ["maison_blanche", "le_kremlin_bicetre", "villejuif_leo_lagrange", "villejuif_paul_vaillant_couturier", "villejuif_louis_aragon"];
      for (let i = 0; i < trunk.length - 1; i++) addEdge(trunk[i], trunk[i + 1]);
      for (let i = 0; i < ivry.length - 1; i++) addEdge(ivry[i], ivry[i + 1]);
      for (let i = 0; i < villejuif.length - 1; i++) addEdge(villejuif[i], villejuif[i + 1]);
    } else if (line.id === "13") {
      const asnieres = ["les_courtilles", "les_agnettes", "gabriel_peri", "mairie_de_clichy", "porte_de_clichy", "brochant", "la_fourche"];
      const stdenis = ["saint_denis_universite", "basilique_de_saint_denis", "saint_denis_porte_de_paris", "carrefour_pleyel", "mairie_de_saint_ouen", "garibaldi", "porte_de_saint_ouen", "guy_moquet", "la_fourche"];
      const trunk = [
        "la_fourche", "place_de_clichy", "liege", "saint_lazare", "miromesnil",
        "champs_elysees_clemenceau", "invalides", "varenne", "saint_francois_xavier", "duroc",
        "montparnasse_bienvenue", "gaite", "pernety", "plaisance", "porte_de_vanves",
        "malakoff_plateau_de_vanves", "malakoff_rue_etienne_dolet", "chatillon_montrouge"
      ];
      for (let i = 0; i < asnieres.length - 1; i++) addEdge(asnieres[i], asnieres[i + 1]);
      for (let i = 0; i < stdenis.length - 1; i++) addEdge(stdenis[i], stdenis[i + 1]);
      for (let i = 0; i < trunk.length - 1; i++) addEdge(trunk[i], trunk[i + 1]);
    } else {
      for (let i = 0; i < line.stations.length - 1; i++) {
        addEdge(line.stations[i], line.stations[i + 1]);
      }
    }
  });
}
initLineAdjacency();

/**
 * Returns the exact intermediate station path along a line between fromId and toId
 */
export function getLineSegment(lineId: string, fromId: string, toId: string): string[] | null {
  if (fromId === toId) return [fromId];
  const adj = LINE_ADJACENCY[lineId];
  if (!adj) return null;

  const queue: string[][] = [[fromId]];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const curr = path[path.length - 1];
    if (curr === toId) return path;

    for (const nbr of adj[curr] || []) {
      if (!visited.has(nbr)) {
        visited.add(nbr);
        queue.push([...path, nbr]);
      }
    }
  }
  return null;
}

/**
 * Computes optimal line hops and optimal physical stations between start and target
 */
export function findOptimalMetroPath(startId: string, targetId: string): MetroOptimalPathResult {
  if (startId === targetId) {
    return {
      minLines: 0,
      linesUsed: [],
      stationHops: [startId],
      minPhysicalStations: 0,
      physicalStationPath: [startId],
    };
  }

  // 1. Min Lines BFS
  let minLines = Infinity;
  let optimalLinesUsed: string[] = [];
  let optimalStationHops: string[] = [];

  const lineQueue: { stationId: string; linesUsed: string[]; stationPath: string[] }[] = [
    { stationId: startId, linesUsed: [], stationPath: [startId] },
  ];
  const visitedLineStations = new Set<string>([startId]);

  while (lineQueue.length > 0) {
    const { stationId, linesUsed, stationPath } = lineQueue.shift()!;
    const station = METRO_STATIONS_MAP[stationId];
    if (!station) continue;

    let foundTargetOnThisLine = false;

    for (const lId of station.lines) {
      const line = METRO_LINES_MAP[lId];
      if (!line) continue;

      for (const nextStId of line.stations) {
        if (nextStId === targetId) {
          minLines = linesUsed.length + 1;
          optimalLinesUsed = [...linesUsed, lId];
          optimalStationHops = [...stationPath, nextStId];
          foundTargetOnThisLine = true;
          break;
        }

        if (!visitedLineStations.has(nextStId)) {
          visitedLineStations.add(nextStId);
          lineQueue.push({
            stationId: nextStId,
            linesUsed: [...linesUsed, lId],
            stationPath: [...stationPath, nextStId],
          });
        }
      }
      if (foundTargetOnThisLine) break;
    }
    if (foundTargetOnThisLine) break;
  }

  // 2. Physical Stations BFS
  const physQueue: string[][] = [[startId]];
  const visitedPhys = new Set<string>([startId]);
  let physicalStationPath: string[] = [];

  while (physQueue.length > 0) {
    const path = physQueue.shift()!;
    const curr = path[path.length - 1];

    if (curr === targetId) {
      physicalStationPath = path;
      break;
    }

    const station = METRO_STATIONS_MAP[curr];
    if (!station) continue;

    for (const nbr of station.neighbors) {
      if (!visitedPhys.has(nbr)) {
        visitedPhys.add(nbr);
        physQueue.push([...path, nbr]);
      }
    }
  }

  return {
    minLines: minLines === Infinity ? 1 : minLines,
    linesUsed: optimalLinesUsed,
    stationHops: optimalStationHops,
    minPhysicalStations: Math.max(0, physicalStationPath.length - 1),
    physicalStationPath,
  };
}

/**
 * Helper to partition a line's stations centered on currentStationId:
 * - before: stations from terminus A up to current (in upstream order)
 * - current: current station
 * - after: stations from current down to terminus B (in downstream order)
 */
export function getLineStationsCentered(
  lineId: string,
  currentStationId: string
): {
  before: MetroStation[];
  current: MetroStation | null;
  after: MetroStation[];
} {
  const line = METRO_LINES_MAP[lineId];
  if (!line) {
    return { before: [], current: null, after: [] };
  }

  const currentSt = METRO_STATIONS_MAP[currentStationId] || null;
  const idx = line.stations.indexOf(currentStationId);

  if (idx === -1) {
    return {
      before: [],
      current: currentSt,
      after: line.stations.map((id) => METRO_STATIONS_MAP[id]).filter(Boolean),
    };
  }

  const before = line.stations
    .slice(0, idx)
    .map((id) => METRO_STATIONS_MAP[id])
    .filter(Boolean);

  const after = line.stations
    .slice(idx + 1)
    .map((id) => METRO_STATIONS_MAP[id])
    .filter(Boolean);

  return {
    before,
    current: currentSt,
    after,
  };
}

/**
 * Validates and executes a metro hop
 */
export function validateMetroHop(
  currentStationId: string,
  lineId: string,
  destinationStationId: string,
  targetStationId: string
): MetroValidationResult {
  const current = METRO_STATIONS_MAP[currentStationId];
  const dest = METRO_STATIONS_MAP[destinationStationId];

  if (!current) return { valid: false, error: "Station actuelle inconnue" };
  if (!dest) return { valid: false, error: "Station de destination inconnue" };

  if (!current.lines.includes(lineId)) {
    return { valid: false, error: `La station ${current.name} n'est pas desservie par la Ligne ${lineId}` };
  }

  if (!dest.lines.includes(lineId)) {
    return { valid: false, error: `La station ${dest.name} n'est pas desservie par la Ligne ${lineId}` };
  }

  const segment = getLineSegment(lineId, currentStationId, destinationStationId);
  if (!segment || segment.length < 2) {
    return { valid: false, error: "Aucun tracé continu trouvé sur cette ligne" };
  }

  const intermediateStations = segment.slice(1); // Excludes origin, includes destination
  const isTargetReached = destinationStationId === targetStationId;

  return {
    valid: true,
    lineId,
    fromId: currentStationId,
    toId: destinationStationId,
    intermediateStations,
    stationsCount: intermediateStations.length,
    isTargetReached,
  };
}

/**
 * Curated list of recognizable anchor stations for daily/free challenges
 */
const NOTABLE_ANCHORS = [
  "chatelet",
  "bastille",
  "nation",
  "gare_de_lyon",
  "montparnasse_bienvenue",
  "charles_de_gaulle_etoile",
  "trocadero",
  "bir_hakeim",
  "saint_lazare",
  "opera",
  "republique",
  "concorde",
  "palais_royal_musee_du_louvre",
  "place_d_italie",
  "barbes_rochechouart",
  "gare_du_nord",
  "gare_de_l_est",
  "invalides",
  "odeon",
  "jussieu",
  "gambetta",
  "porte_maillot",
  "belleville",
  "pigalle",
  "chateau_de_vincennes",
  "la_defense",
  "pont_de_sevres",
  "porte_de_clignancourt",
  "bagneux_lucie_aubrac",
  "olympiades",
  "aeroport_d_orly",
  "saint_denis_pleyel",
  "mairie_d_ivry",
  "boulogne_pont_de_saint_cloud",
  "porte_des_lilas"
];

/**
 * Generates a metro challenge with optimal path computation
 */
export function generateMetroChallenge(
  seedStr?: string
): {
  startStation: MetroStation;
  targetStation: MetroStation;
  optimal: MetroOptimalPathResult;
} {
  const seedNum = seedStr ? hashSeed(seedStr) : Math.floor(Math.random() * 1000000);
  const rng = createRng(seedNum);

  // Filter valid anchors that exist in the map
  const anchors = NOTABLE_ANCHORS.filter((id) => METRO_STATIONS_MAP[id]);

  let bestCandidate = {
    startId: "chatelet",
    targetId: "nation",
    optimal: findOptimalMetroPath("chatelet", "nation"),
  };

  // Try up to 40 pairs to find a well-balanced challenge (minLines >= 2, 7 <= minPhysical <= 22)
  for (let attempt = 0; attempt < 40; attempt++) {
    const idxA = Math.floor(rng() * anchors.length);
    let idxB = Math.floor(rng() * anchors.length);
    if (idxA === idxB) idxB = (idxB + 1) % anchors.length;

    const startId = anchors[idxA];
    const targetId = anchors[idxB];

    const opt = findOptimalMetroPath(startId, targetId);
    if (opt.minLines >= 2 && opt.minPhysicalStations >= 7 && opt.minPhysicalStations <= 22) {
      bestCandidate = { startId, targetId, optimal: opt };
      break;
    }
  }

  return {
    startStation: METRO_STATIONS_MAP[bestCandidate.startId],
    targetStation: METRO_STATIONS_MAP[bestCandidate.targetId],
    optimal: bestCandidate.optimal,
  };
}
