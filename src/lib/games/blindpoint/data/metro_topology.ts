/**
 * Topologie et Données Réseau pour le Mode "Retrace le Réseau" (Métro Paris)
 */

export interface MetroStationTopology {
  id: string;
  name: string;
  coords: [number, number]; // [longitude, latitude]
  lines: string[];
  hint: string;
  arrondissement?: number;
  funFact?: string;
}

export interface MetroLineInfo {
  bg: string;
  text: string;
  name: string;
  route?: string;
  num?: string;
}

export interface MetroLineDefinition {
  id: string;
  num: string;
  bg: string;
  text: string;
  name: string;
  route: string;
}

export const ALL_METRO_LINES: MetroLineDefinition[] = [
  { id: "1", num: "1", bg: "#FFCD00", text: "#111827", name: "Ligne 1", route: "La Défense ↔ Vincennes" },
  { id: "2", num: "2", bg: "#0064B0", text: "#FFFFFF", name: "Ligne 2", route: "Porte Dauphine ↔ Nation" },
  { id: "3", num: "3", bg: "#9F9825", text: "#FFFFFF", name: "Ligne 3", route: "Pont de Levallois ↔ Gallieni" },
  { id: "3bis", num: "3b", bg: "#98D4E2", text: "#111827", name: "Ligne 3bis", route: "Porte des Lilas ↔ Gambetta" },
  { id: "4", num: "4", bg: "#CF009E", text: "#FFFFFF", name: "Ligne 4", route: "Clignancourt ↔ Bagneux" },
  { id: "5", num: "5", bg: "#FF7E2E", text: "#FFFFFF", name: "Ligne 5", route: "Bobigny ↔ Place d'Italie" },
  { id: "6", num: "6", bg: "#169B62", text: "#FFFFFF", name: "Ligne 6", route: "Étoile ↔ Nation" },
  { id: "7", num: "7", bg: "#FA9ABA", text: "#111827", name: "Ligne 7", route: "La Courneuve ↔ Villejuif / Ivry" },
  { id: "7bis", num: "7b", bg: "#6ECA97", text: "#111827", name: "Ligne 7bis", route: "Louis Blanc ↔ Pré-St-Gervais" },
  { id: "8", num: "8", bg: "#CEADD2", text: "#111827", name: "Ligne 8", route: "Balard ↔ Créteil" },
  { id: "9", num: "9", bg: "#B6BD00", text: "#111827", name: "Ligne 9", route: "Pont de Sèvres ↔ Montreuil" },
  { id: "10", num: "10", bg: "#C9910D", text: "#FFFFFF", name: "Ligne 10", route: "Boulogne ↔ Austerlitz" },
  { id: "11", num: "11", bg: "#704B1C", text: "#FFFFFF", name: "Ligne 11", route: "Châtelet ↔ Rosny" },
  { id: "12", num: "12", bg: "#007852", text: "#FFFFFF", name: "Ligne 12", route: "Aubervilliers ↔ Mairie d'Issy" },
  { id: "13", num: "13", bg: "#6EC4E8", text: "#111827", name: "Ligne 13", route: "Asnières / St-Denis ↔ Châtillon" },
  { id: "14", num: "14", bg: "#62259D", text: "#FFFFFF", name: "Ligne 14", route: "St-Denis Pleyel ↔ Orly" },
];

export const METRO_LINE_COLORS: Record<string, MetroLineInfo> = Object.fromEntries(
  ALL_METRO_LINES.map((l) => [l.id, { bg: l.bg, text: l.text, name: l.name, route: l.route, num: l.num }])
);

export const METRO_TOPOLOGY_STATIONS: MetroStationTopology[] = [
  // LIGNE 1
  {
    id: "la_defense",
    name: "La Défense",
    coords: [2.2384, 48.8919],
    lines: ["1"],
    hint: "Terminus ouest au pied de la Grande Arche.",
    funFact: "Plus grand quartier d'affaires d'Europe.",
  },
  {
    id: "porte_maillot",
    name: "Porte Maillot",
    coords: [2.2825, 48.8778],
    lines: ["1"],
    hint: "Palais des Congrès et lisière du Bois de Boulogne.",
  },
  {
    id: "etoile",
    name: "Charles de Gaulle - Étoile",
    coords: [2.295, 48.8738],
    lines: ["1", "6"],
    hint: "Sous l'Arc de Triomphe (Connexion Lignes 1 et 6).",
    funFact: "Point de départ des 12 avenues rayonnantes.",
  },
  {
    id: "concorde",
    name: "Concorde",
    coords: [2.3218, 48.8653],
    lines: ["1"],
    hint: "Place de la Concorde et Obélisque de Louxor.",
  },
  {
    id: "chatelet",
    name: "Châtelet",
    coords: [2.347, 48.8588],
    lines: ["1", "4"],
    hint: "Hub central névralgique (Connexion Lignes 1 et 4).",
    funFact: "Le plus grand nœud souterrain d'Europe.",
  },
  {
    id: "hotel_de_ville",
    name: "Hôtel de Ville",
    coords: [2.3524, 48.8573],
    lines: ["1"],
    hint: "Face à la Mairie de Paris et au BHV Marais.",
  },
  {
    id: "bastille",
    name: "Bastille",
    coords: [2.3691, 48.8531],
    lines: ["1"],
    hint: "Colonne de Juillet et port de l'Arsenal.",
    funFact: "La ligne 1 y passe à l'air libre au-dessus du bassin.",
  },
  {
    id: "gare_de_lyon",
    name: "Gare de Lyon",
    coords: [2.3734, 48.8449],
    lines: ["1"],
    hint: "Tour de l'Horloge et départs TGV Méditerranée.",
  },
  {
    id: "nation",
    name: "Nation",
    coords: [2.396, 48.8482],
    lines: ["1", "6"],
    hint: "Grand carrefour de l'est (Connexion Lignes 1 et 6).",
    funFact: "Terminus commun des lignes 2 et 6.",
  },
  {
    id: "chateau_vincennes",
    name: "Château de Vincennes",
    coords: [2.4402, 48.8447],
    lines: ["1"],
    hint: "Terminus est, donjon médiéval et bois de Vincennes.",
  },

  // LIGNE 4
  {
    id: "porte_clignancourt",
    name: "Porte de Clignancourt",
    coords: [2.3444, 48.8978],
    lines: ["4"],
    hint: "Terminus nord au niveau des marchés aux puces.",
  },
  {
    id: "barbes",
    name: "Barbès - Rochechouart",
    coords: [2.3499, 48.8836],
    lines: ["4"],
    hint: "Carrefour populaire sous le viaduc aérien de la 2.",
  },
  {
    id: "gare_du_nord",
    name: "Gare du Nord",
    coords: [2.3553, 48.8809],
    lines: ["4"],
    hint: "Première gare d'Europe en trafic ferroviaire.",
  },
  {
    id: "les_halles",
    name: "Les Halles",
    coords: [2.3461, 48.8617],
    lines: ["4"],
    hint: "Sous la Canopée des Halles, voisin de Châtelet.",
  },
  {
    id: "cite",
    name: "Cité",
    coords: [2.3456, 48.855],
    lines: ["4"],
    hint: "Unique station sous l'Île de la Cité et Notre-Dame.",
    funFact: "Éclairée par des globes en fonte d'inspiration art déco.",
  },
  {
    id: "saint_michel",
    name: "Saint-Michel",
    coords: [2.3442, 48.8533],
    lines: ["4"],
    hint: "Fontaine Saint-Michel et entrée du Quartier Latin.",
  },
  {
    id: "saint_germain",
    name: "Saint-Germain-des-Prés",
    coords: [2.3332, 48.854],
    lines: ["4"],
    hint: "Café de Flore, Les Deux Magots et église médiévale.",
  },
  {
    id: "montparnasse",
    name: "Montparnasse-Bienvenüe",
    coords: [2.3219, 48.8421],
    lines: ["4", "6"],
    hint: "Au pied de la Tour Montparnasse (Connexion L4 et L6).",
  },
  {
    id: "denfert",
    name: "Denfert-Rochereau",
    coords: [2.3323, 48.8338],
    lines: ["4", "6"],
    hint: "Le Lion de Belfort et les Catacombes (Connexion L4 et L6).",
  },
  {
    id: "porte_orleans",
    name: "Porte d'Orléans",
    coords: [2.3255, 48.8236],
    lines: ["4"],
    hint: "Historique terminus sud de la 4 dans le 14e arr.",
  },

  // LIGNE 6
  {
    id: "trocadero",
    name: "Trocadéro",
    coords: [2.2871, 48.8631],
    lines: ["6"],
    hint: "Esplanade face à la Tour Eiffel et Palais de Chaillot.",
  },
  {
    id: "bir_hakeim",
    name: "Bir-Hakeim",
    coords: [2.29, 48.8539],
    lines: ["6"],
    hint: "Station aérienne surplombant la Seine et le pont Bir-Hakeim.",
  },
  {
    id: "pasteur",
    name: "Pasteur",
    coords: [2.3128, 48.8428],
    lines: ["6"],
    hint: "Institut Pasteur et lycée Buffon, voisine de Montparnasse.",
  },
  {
    id: "place_italie",
    name: "Place d'Italie",
    coords: [2.3553, 48.8315],
    lines: ["6"],
    hint: "Grand carrefour rond-point du 13e arrondissement.",
  },
  {
    id: "bercy",
    name: "Bercy",
    coords: [2.38, 48.8403],
    lines: ["6"],
    hint: "Accor Arena, parc de Bercy et ministère des Finances.",
  },
];

export const METRO_LINE_TOPOLOGY: Record<string, string[]> = {
  "1": [
    "la_defense",
    "porte_maillot",
    "etoile",
    "concorde",
    "chatelet",
    "hotel_de_ville",
    "bastille",
    "gare_de_lyon",
    "nation",
    "chateau_vincennes",
  ],
  "4": [
    "porte_clignancourt",
    "barbes",
    "gare_du_nord",
    "les_halles",
    "chatelet",
    "cite",
    "saint_michel",
    "saint_germain",
    "montparnasse",
    "denfert",
    "porte_orleans",
  ],
  "6": [
    "etoile",
    "trocadero",
    "bir_hakeim",
    "pasteur",
    "montparnasse",
    "denfert",
    "place_italie",
    "bercy",
    "nation",
  ],
};

// Total distinct segment count across the topology
export const TOTAL_METRO_SEGMENTS = 9 + 10 + 8; // 27 segments

/**
 * Calcule la distance orthodromique en mètres entre deux points GPS
 */
export function getDistanceMeters(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371e3;
  const lat1 = (coord1[1] * Math.PI) / 180;
  const lat2 = (coord2[1] * Math.PI) / 180;
  const deltaLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const deltaLng = ((coord2[0] - coord1[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Clé canonique ordonnée pour identifier un segment indépendamment du sens
 */
export function getCanonicalPairKey(id1: string, id2: string): string {
  return [id1, id2].sort().join("--");
}

/**
 * Calcule le décalage latéral en pixels pour afficher les lignes en parallèle
 * (Mini Metro / double rail propre sans superposition)
 */
export function getLineSegmentOffset(
  line: string,
  allLinesInSegment: string[],
  spacing: number = 5
): number {
  if (allLinesInSegment.length <= 1) return 0;
  const sorted = [...allLinesInSegment].sort();
  const idx = sorted.indexOf(line);
  if (idx === -1) return 0;

  if (allLinesInSegment.length === 2) {
    return idx === 0 ? -spacing * 0.65 : spacing * 0.65;
  }
  return (idx - (allLinesInSegment.length - 1) / 2) * spacing;
}
