import fs from "fs";
import path from "path";

const idfmRaw = JSON.parse(
  fs.readFileSync(new URL("./idfm_metro_raw.json", import.meta.url), "utf8")
);

function norm(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function toId(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Coordinate & Metadata lookup by normalized name from IDFM
const idfmLookup = new Map();
idfmRaw.records.forEach((r) => {
  const f = r.fields;
  const k = norm(f.nom_gares);
  if (!idfmLookup.has(k)) {
    idfmLookup.set(k, {
      rawName: f.nom_gares,
      lng: Number(f.geo_point_2d[1].toFixed(6)),
      lat: Number(f.geo_point_2d[0].toFixed(6)),
      lines: new Set(),
      arrondissement: f.nom_commune === "Paris" ? undefined : f.nom_commune,
    });
  }
  idfmLookup.get(k).lines.add(f.indice_lig);
});

// Official 16 Metro Lines sequence definitions
const LINES_METADATA = [
  {
    id: "1",
    num: "1",
    name: "Ligne 1",
    bg: "#FFCD00",
    text: "#111827",
    terminus: ["La Défense", "Château de Vincennes"],
    stations: [
      "La Défense", "Esplanade de la Défense", "Pont de Neuilly", "Les Sablons", "Porte Maillot",
      "Argentine", "Charles De Gaulle-Étoile", "George V", "Franklin D. Roosevelt", "Champs-Élysées – Clemenceau",
      "Concorde", "Tuileries", "Palais Royal - Musée du Louvre", "Louvre-Rivoli", "Châtelet",
      "Hôtel de Ville", "Saint-Paul", "Bastille", "Gare de Lyon", "Reuilly-Diderot",
      "Nation", "Porte de Vincennes", "Saint-Mandé", "Bérault", "Château de Vincennes"
    ],
  },
  {
    id: "2",
    num: "2",
    name: "Ligne 2",
    bg: "#0064B0",
    text: "#FFFFFF",
    terminus: ["Porte Dauphine", "Nation"],
    stations: [
      "Porte Dauphine", "Victor Hugo", "Charles De Gaulle-Étoile", "Ternes", "Courcelles",
      "Monceau", "Villiers", "Rome", "Place de Clichy", "Blanche",
      "Pigalle", "Anvers", "Barbès-Rochechouart", "La Chapelle", "Stalingrad",
      "Jaurès", "Colonel Fabien", "Belleville", "Couronnes", "Ménilmontant",
      "Père Lachaise", "Philippe Auguste", "Alexandre Dumas", "Avron", "Nation"
    ],
  },
  {
    id: "3",
    num: "3",
    name: "Ligne 3",
    bg: "#9F9825",
    text: "#FFFFFF",
    terminus: ["Pont de Levallois", "Gallieni"],
    stations: [
      "Pont de Levallois", "Anatole France", "Louise Michel", "Porte de Champerret", "Pereire-Levallois",
      "Wagram", "Malesherbes", "Villiers", "Europe", "Saint-Lazare",
      "Havre-Caumartin", "Opéra", "Quatre Septembre", "Bourse", "Sentier",
      "Réaumur Sébastopol", "Arts et Métiers", "Temple", "République", "Parmentier",
      "Rue Saint-Maur", "Père Lachaise", "Gambetta", "Porte de Bagnolet", "Gallieni"
    ],
  },
  {
    id: "3bis",
    num: "3b",
    name: "Ligne 3bis",
    bg: "#98D4E2",
    text: "#111827",
    terminus: ["Gambetta", "Porte des Lilas"],
    stations: ["Gambetta", "Pelleport", "Saint-Fargeau", "Porte des Lilas"],
  },
  {
    id: "4",
    num: "4",
    name: "Ligne 4",
    bg: "#CF009E",
    text: "#FFFFFF",
    terminus: ["Porte de Clignancourt", "Bagneux - Lucie Aubrac"],
    stations: [
      "Porte de Clignancourt", "Simplon", "Marcadet-Poissonniers", "Château Rouge", "Barbès-Rochechouart",
      "Gare du Nord", "Gare de l'Est", "Château d'Eau", "Strasbourg-Saint-Denis", "Réaumur Sébastopol",
      "Étienne Marcel", "Les Halles", "Châtelet", "Cité", "Saint-Michel",
      "Odéon", "Saint-Germain-des-Prés", "Saint-Sulpice", "Saint-Placide", "Montparnasse-Bienvenüe",
      "Vavin", "Raspail", "Denfert-Rochereau", "Mouton-Duvernet", "Alésia",
      "Porte d'Orléans", "Mairie de Montrouge", "Barbara", "Bagneux - Lucie Aubrac"
    ],
  },
  {
    id: "5",
    num: "5",
    name: "Ligne 5",
    bg: "#FF7E2E",
    text: "#FFFFFF",
    terminus: ["Bobigny Pablo Picasso", "Place d'Italie"],
    stations: [
      "Bobigny Pablo Picasso", "Bobigny-Pantin - Raymond Queneau", "Église de Pantin", "Hoche", "Porte de Pantin",
      "Ourcq", "Laumière", "Jaurès", "Stalingrad", "Gare du Nord",
      "Gare de l'Est", "Jacques Bonsergent", "République", "Oberkampf", "Richard Lenoir",
      "Bréguet-Sabin", "Bastille", "Quai de la Rapée", "Gare d'Austerlitz", "Saint-Marcel",
      "Campo Formio", "Place d'Italie"
    ],
  },
  {
    id: "6",
    num: "6",
    name: "Ligne 6",
    bg: "#169B62",
    text: "#FFFFFF",
    terminus: ["Charles De Gaulle-Étoile", "Nation"],
    stations: [
      "Charles De Gaulle-Étoile", "Kléber", "Boissière", "Trocadéro", "Passy",
      "Bir-Hakeim", "Dupleix", "La Motte Picquet-Grenelle", "Cambronne", "Sèvres-Lecourbe",
      "Pasteur", "Montparnasse-Bienvenüe", "Edgar Quinet", "Raspail", "Denfert-Rochereau",
      "Saint-Jacques", "Glacière", "Corvisart", "Place d'Italie", "Nationale",
      "Chevaleret", "Quai de la Gare", "Bercy", "Dugommier", "Daumesnil",
      "Bel-Air", "Picpus", "Nation"
    ],
  },
  {
    id: "7",
    num: "7",
    name: "Ligne 7",
    bg: "#FA9ABA",
    text: "#111827",
    terminus: ["La Courneuve 8 Mai 1945", "Mairie d'Ivry / Villejuif"],
    stations: [
      "La Courneuve 8 Mai 1945", "Fort d'Aubervilliers", "Aubervilliers Pantin - Quatre Chemins", "Porte de la Villette", "Corentin Cariou",
      "Crimée", "Riquet", "Stalingrad", "Louis Blanc", "Château-Landon",
      "Gare de l'Est", "Poissonnière", "Cadet", "Le Peletier", "Chaussée d'Antin - La Fayette",
      "Opéra", "Pyramides", "Palais Royal - Musée du Louvre", "Pont Neuf", "Châtelet",
      "Pont Marie", "Sully-Morland", "Jussieu", "Place Monge", "Censier-Daubenton",
      "Les Gobelins", "Place d'Italie", "Tolbiac", "Maison Blanche",
      "Porte d'Italie", "Porte de Choisy", "Porte d'Ivry", "Pierre et Marie Curie", "Mairie d'Ivry",
      "Le Kremlin-Bicêtre", "Villejuif - Léo Lagrange", "Villejuif Paul Vaillant-Couturier", "Villejuif - Louis Aragon"
    ],
    branches: {
      trunk: [
        "La Courneuve 8 Mai 1945", "Fort d'Aubervilliers", "Aubervilliers Pantin - Quatre Chemins", "Porte de la Villette", "Corentin Cariou",
        "Crimée", "Riquet", "Stalingrad", "Louis Blanc", "Château-Landon",
        "Gare de l'Est", "Poissonnière", "Cadet", "Le Peletier", "Chaussée d'Antin - La Fayette",
        "Opéra", "Pyramides", "Palais Royal - Musée du Louvre", "Pont Neuf", "Châtelet",
        "Pont Marie", "Sully-Morland", "Jussieu", "Place Monge", "Censier-Daubenton",
        "Les Gobelins", "Place d'Italie", "Tolbiac", "Maison Blanche"
      ],
      ivry: ["Maison Blanche", "Porte d'Italie", "Porte de Choisy", "Porte d'Ivry", "Pierre et Marie Curie", "Mairie d'Ivry"],
      villejuif: ["Maison Blanche", "Le Kremlin-Bicêtre", "Villejuif - Léo Lagrange", "Villejuif Paul Vaillant-Couturier", "Villejuif - Louis Aragon"]
    }
  },
  {
    id: "7bis",
    num: "7b",
    name: "Ligne 7bis",
    bg: "#6ECA97",
    text: "#111827",
    terminus: ["Louis Blanc", "Pré Saint-Gervais"],
    stations: [
      "Louis Blanc", "Jaurès", "Bolivar", "Buttes-Chaumont", "Botzaris",
      "Place des Fêtes", "Pré Saint-Gervais", "Danube"
    ],
  },
  {
    id: "8",
    num: "8",
    name: "Ligne 8",
    bg: "#CEADD2",
    text: "#111827",
    terminus: ["Balard", "Créteil - Pointe du Lac"],
    stations: [
      "Balard", "Lourmel", "Boucicaut", "Félix Faure", "Commerce",
      "La Motte Picquet-Grenelle", "École Militaire", "La Tour Maubourg", "Invalides", "Concorde",
      "Madeleine", "Opéra", "Richelieu-Drouot", "Grands Boulevards", "Bonne Nouvelle",
      "Strasbourg-Saint-Denis", "République", "Filles du Calvaire", "Saint-Sébastien-Froissart", "Chemin Vert",
      "Bastille", "Ledru Rollin", "Faidherbe Chaligny", "Reuilly-Diderot", "Montgallet",
      "Daumesnil", "Michel Bizot", "Porte Dorée", "Porte de Charenton", "Liberté",
      "Charenton-Écoles", "École Vétérinaire de Maisons-Alfort", "Maisons-Alfort-Stade", "Maisons-Alfort-Les Juilliottes",
      "Créteil–L’Échat", "Créteil-Université", "Créteil–Préfecture", "Créteil - Pointe du Lac"
    ],
  },
  {
    id: "9",
    num: "9",
    name: "Ligne 9",
    bg: "#B6BD00",
    text: "#111827",
    terminus: ["Pont de Sèvres", "Mairie de Montreuil"],
    stations: [
      "Pont de Sèvres", "Billancourt", "Marcel Sembat", "Porte de Saint-Cloud", "Exelmans",
      "Michel Ange-Molitor", "Michel Ange-Auteuil", "Jasmin", "Ranelagh", "La Muette",
      "Rue de la Pompe", "Trocadéro", "Iéna", "Alma-Marceau", "Franklin D. Roosevelt",
      "Saint-Philippe du Roule", "Miromesnil", "Saint-Augustin", "Havre-Caumartin", "Chaussée d'Antin - La Fayette",
      "Richelieu-Drouot", "Grands Boulevards", "Bonne Nouvelle", "Strasbourg-Saint-Denis", "République",
      "Oberkampf", "Saint-Ambroise", "Voltaire", "Charonne", "Rue des Boulets",
      "Nation", "Buzenval", "Maraîchers", "Porte de Montreuil", "Robespierre",
      "Croix de Chavaux", "Mairie de Montreuil"
    ],
  },
  {
    id: "10",
    num: "10",
    name: "Ligne 10",
    bg: "#C9910D",
    text: "#FFFFFF",
    terminus: ["Boulogne - Pont de Saint-Cloud", "Gare d'Austerlitz"],
    stations: [
      "Boulogne - Pont de Saint-Cloud", "Boulogne - Jean Jaurès", "Porte d'Auteuil", "Michel Ange-Auteuil",
      "Michel Ange-Molitor", "Chardon Lagache", "Mirabeau", "Église d'Auteuil", "Javel - André Citroën",
      "Charles Michels", "Avenue Émile Zola", "La Motte Picquet-Grenelle", "Ségur", "Duroc",
      "Vaneau", "Sèvres-Babylone", "Mabillon", "Odéon", "Cluny-La Sorbonne",
      "Maubert-Mutualité", "Cardinal Lemoine", "Jussieu", "Gare d'Austerlitz"
    ],
  },
  {
    id: "11",
    num: "11",
    name: "Ligne 11",
    bg: "#704B1C",
    text: "#FFFFFF",
    terminus: ["Châtelet", "Rosny-Bois-Perrier"],
    stations: [
      "Châtelet", "Hôtel de Ville", "Rambuteau", "Arts et Métiers", "République",
      "Goncourt", "Belleville", "Pyrénées", "Jourdain", "Place des Fêtes",
      "Télégraphe", "Porte des Lilas", "Mairie des Lilas", "Serge Gainsbourg", "Romainville - Carnot",
      "Montreuil - Hôpital", "La Dhuys", "Coteaux Beauclair", "Rosny-Bois-Perrier"
    ],
  },
  {
    id: "12",
    num: "12",
    name: "Ligne 12",
    bg: "#007852",
    text: "#FFFFFF",
    terminus: ["Mairie d'Aubervilliers", "Mairie d'Issy"],
    stations: [
      "Mairie d'Aubervilliers", "Aimé Césaire", "Front Populaire", "Porte de la Chapelle", "Marx Dormoy",
      "Marcadet-Poissonniers", "Jules Joffrin", "Lamarck-Caulaincourt", "Abbesses", "Pigalle",
      "Saint-Georges", "Notre-Dame-de-Lorette", "Trinité d'Estienne d'Orves", "Saint-Lazare", "Madeleine",
      "Concorde", "Assemblée Nationale", "Solférino", "Rue du Bac", "Sèvres-Babylone",
      "Rennes", "Notre-Dame-des-Champs", "Montparnasse Bienvenüe", "Falguière", "Pasteur",
      "Volontaires", "Vaugirard", "Convention", "Porte de Versailles", "Corentin Celton", "Mairie d'Issy"
    ],
  },
  {
    id: "13",
    num: "13",
    name: "Ligne 13",
    bg: "#6EC4E8",
    text: "#111827",
    terminus: ["Les Courtilles / St-Denis", "Châtillon-Montrouge"],
    stations: [
      "Les Courtilles", "Les Agnettes", "Gabriel Péri", "Mairie de Clichy", "Porte de Clichy", "Brochant",
      "Saint-Denis - Université", "Basilique de Saint-Denis", "Saint-Denis - Porte de Paris", "Carrefour Pleyel",
      "Mairie de Saint-Ouen", "Garibaldi", "Porte de Saint-Ouen", "Guy Môquet",
      "La Fourche", "Place de Clichy", "Liège", "Saint-Lazare", "Miromesnil",
      "Champs-Élysées – Clemenceau", "Invalides", "Varenne", "Saint-François-Xavier", "Duroc",
      "Montparnasse-Bienvenüe", "Gaîté", "Pernety", "Plaisance", "Porte de Vanves",
      "Malakoff - Plateau de Vanves", "Malakoff - Rue Étienne Dolet", "Châtillon-Montrouge"
    ],
    branches: {
      asnieres: ["Les Courtilles", "Les Agnettes", "Gabriel Péri", "Mairie de Clichy", "Porte de Clichy", "Brochant", "La Fourche"],
      stdenis: ["Saint-Denis - Université", "Basilique de Saint-Denis", "Saint-Denis - Porte de Paris", "Carrefour Pleyel", "Mairie de Saint-Ouen", "Garibaldi", "Porte de Saint-Ouen", "Guy Môquet", "La Fourche"],
      trunk: [
        "La Fourche", "Place de Clichy", "Liège", "Saint-Lazare", "Miromesnil",
        "Champs-Élysées – Clemenceau", "Invalides", "Varenne", "Saint-François-Xavier", "Duroc",
        "Montparnasse-Bienvenüe", "Gaîté", "Pernety", "Plaisance", "Porte de Vanves",
        "Malakoff - Plateau de Vanves", "Malakoff - Rue Étienne Dolet", "Châtillon-Montrouge"
      ]
    }
  },
  {
    id: "14",
    num: "14",
    name: "Ligne 14",
    bg: "#62259D",
    text: "#FFFFFF",
    terminus: ["Saint-Denis Pleyel", "Aéroport d’Orly"],
    stations: [
      "Saint-Denis Pleyel", "Mairie de Saint-Ouen", "Saint-Ouen", "Porte de Clichy", "Pont Cardinet",
      "Saint-Lazare", "Madeleine", "Pyramides", "Châtelet", "Gare de Lyon",
      "Bercy", "Cour Saint-Émilion", "Bibliothèque François Mitterrand", "Olympiades", "Maison Blanche",
      "Hôpital Bicêtre", "Villejuif - Gustave Roussy", "L’Haÿ-les-Roses", "Chevilly-Larue", "Thiais - Orly", "Aéroport d’Orly"
    ],
  },
];

// Clean canonical map of stations
const stationsMap = new Map();

LINES_METADATA.forEach((line) => {
  line.stations.forEach((stName) => {
    const k = norm(stName);
    const idfm = idfmLookup.get(k);
    if (!idfm) {
      throw new Error(`Station not found in IDFM: ${stName}`);
    }
    const id = toId(idfm.rawName);

    if (!stationsMap.has(id)) {
      stationsMap.set(id, {
        id,
        name: idfm.rawName,
        normalizedName: norm(idfm.rawName),
        latitude: idfm.lat,
        longitude: idfm.lng,
        coords: [idfm.lng, idfm.lat],
        lines: new Set(),
        neighbors: new Set(),
      });
    }
    stationsMap.get(id).lines.add(line.id);
  });
});

// Compute physical adjacency neighbors along each line
function addNeighbor(stA, stB) {
  const idA = toId(stA);
  const idB = toId(stB);
  if (stationsMap.has(idA) && stationsMap.has(idB) && idA !== idB) {
    stationsMap.get(idA).neighbors.add(idB);
    stationsMap.get(idB).neighbors.add(idA);
  }
}

LINES_METADATA.forEach((line) => {
  if (line.branches) {
    if (line.id === "7") {
      const b = line.branches;
      for (let i = 0; i < b.trunk.length - 1; i++) addNeighbor(b.trunk[i], b.trunk[i + 1]);
      for (let i = 0; i < b.ivry.length - 1; i++) addNeighbor(b.ivry[i], b.ivry[i + 1]);
      for (let i = 0; i < b.villejuif.length - 1; i++) addNeighbor(b.villejuif[i], b.villejuif[i + 1]);
    } else if (line.id === "13") {
      const b = line.branches;
      for (let i = 0; i < b.asnieres.length - 1; i++) addNeighbor(b.asnieres[i], b.asnieres[i + 1]);
      for (let i = 0; i < b.stdenis.length - 1; i++) addNeighbor(b.stdenis[i], b.stdenis[i + 1]);
      for (let i = 0; i < b.trunk.length - 1; i++) addNeighbor(b.trunk[i], b.trunk[i + 1]);
    }
  } else {
    for (let i = 0; i < line.stations.length - 1; i++) {
      addNeighbor(line.stations[i], line.stations[i + 1]);
    }
  }
});

// Build BorderPathGraph format
const borderPathGraph = {};
const topologyStations = [];

stationsMap.forEach((s) => {
  const stationObj = {
    id: s.id,
    name: s.name,
    normalizedName: s.normalizedName,
    latitude: s.latitude,
    longitude: s.longitude,
    coords: s.coords,
    continentOrRegion: "Île-de-France",
    capitalOrChefLieu: "Paris",
    lines: Array.from(s.lines).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    }),
    neighbors: Array.from(s.neighbors).sort(),
  };

  borderPathGraph[s.id] = stationObj;
  topologyStations.push(stationObj);
});

// Compute line-specific edges
const lineEdgesMap = {};
LINES_METADATA.forEach((line) => {
  lineEdgesMap[line.id] = [];
  const addEdge = (nameA, nameB) => {
    const idA = toId(idfmLookup.get(norm(nameA)).rawName);
    const idB = toId(idfmLookup.get(norm(nameB)).rawName);
    if (idA !== idB) {
      lineEdgesMap[line.id].push([idA, idB]);
    }
  };

  if (line.branches) {
    if (line.id === "7") {
      const b = line.branches;
      for (let i = 0; i < b.trunk.length - 1; i++) addEdge(b.trunk[i], b.trunk[i + 1]);
      for (let i = 0; i < b.ivry.length - 1; i++) addEdge(b.ivry[i], b.ivry[i + 1]);
      for (let i = 0; i < b.villejuif.length - 1; i++) addEdge(b.villejuif[i], b.villejuif[i + 1]);
    } else if (line.id === "13") {
      const b = line.branches;
      for (let i = 0; i < b.asnieres.length - 1; i++) addEdge(b.asnieres[i], b.asnieres[i + 1]);
      for (let i = 0; i < b.stdenis.length - 1; i++) addEdge(b.stdenis[i], b.stdenis[i + 1]);
      for (let i = 0; i < b.trunk.length - 1; i++) addEdge(b.trunk[i], b.trunk[i + 1]);
    }
  } else {
    for (let i = 0; i < line.stations.length - 1; i++) {
      addEdge(line.stations[i], line.stations[i + 1]);
    }
  }
});

// Format lines with station IDs and edges
const topologyLines = LINES_METADATA.map((l) => ({
  id: l.id,
  num: l.num,
  name: l.name,
  bg: l.bg,
  text: l.text,
  terminus: l.terminus,
  stations: l.stations.map((name) => {
    const k = norm(name);
    const idfm = idfmLookup.get(k);
    return toId(idfm.rawName);
  }),
  edges: lineEdgesMap[l.id],
}));

const fullTopology = {
  stations: topologyStations,
  lines: topologyLines,
};

// Write files
const targetBorderPathData = path.resolve(
  "/Users/julien_fyll/Jeu/src/lib/games/borderpath/data/metro_paris.json"
);
const targetGeoTopology = path.resolve(
  "/Users/julien_fyll/Jeu/public/data/geo/metro_paris_topology.json"
);

fs.writeFileSync(targetBorderPathData, JSON.stringify(borderPathGraph, null, 2), "utf8");
fs.writeFileSync(targetGeoTopology, JSON.stringify(fullTopology, null, 2), "utf8");

console.log("SUCCESS!");
console.log(`Generated ${topologyStations.length} stations across 16 lines.`);
console.log(`Saved to ${targetBorderPathData} and ${targetGeoTopology}`);
