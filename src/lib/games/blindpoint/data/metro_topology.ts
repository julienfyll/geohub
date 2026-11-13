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
  {
    "id": "chatelet",
    "name": "Châtelet",
    "coords": [
      2.347,
      48.8588
    ],
    "lines": [
      "1",
      "4",
      "7",
      "11",
      "14"
    ],
    "hint": "1er / 4e arr. • Lignes 1, 4, 7, 11, 14",
    "arrondissement": 1,
    "funFact": "Le plus grand nœud de correspondances souterrain d'Europe au cœur névralgique de Paris."
  },
  {
    "id": "abbesses",
    "name": "Abbesses",
    "coords": [
      2.3385,
      48.8845
    ],
    "lines": [
      "12"
    ],
    "hint": "18e arr. • Ligne 12",
    "arrondissement": 18,
    "funFact": "Station la plus profonde du réseau (36 m sous terre), célèbre pour son édicule Guimard au pied de Montmartre."
  },
  {
    "id": "bir_hakeim",
    "name": "Bir-Hakeim (Tour Eiffel)",
    "coords": [
      2.29,
      48.8539
    ],
    "lines": [
      "6"
    ],
    "hint": "15e arr. • Ligne 6",
    "arrondissement": 15,
    "funFact": "Station aérienne surplombant la Seine, passage obligé des millions de touristes vers la Tour Eiffel."
  },
  {
    "id": "bastille",
    "name": "Bastille",
    "coords": [
      2.3691,
      48.8531
    ],
    "lines": [
      "1",
      "5",
      "8"
    ],
    "hint": "4e / 11e / 12e arr. • Lignes 1, 5, 8",
    "arrondissement": 11,
    "funFact": "La ligne 1 y passe à l'air libre en surplombant le port de l'Arsenal et les fondations de la forteresse."
  },
  {
    "id": "place_italie",
    "name": "Place d'Italie",
    "coords": [
      2.3553,
      48.8315
    ],
    "lines": [
      "5",
      "6",
      "7"
    ],
    "hint": "13e arr. • Lignes 5, 6, 7",
    "arrondissement": 13,
    "funFact": "Grand carrefour circulaire du sud parisien, point de convergence des avenues d'Italie et des Gobelins."
  },
  {
    "id": "montparnasse",
    "name": "Montparnasse-Bienvenüe",
    "coords": [
      2.3219,
      48.8421
    ],
    "lines": [
      "4",
      "6",
      "12",
      "13"
    ],
    "hint": "6e / 14e / 15e arr. • Lignes 4, 6, 12, 13",
    "arrondissement": 14,
    "funFact": "Immense station reliant la gare TGV Atlantique et la Tour Montparnasse avec son tapis roulant rapide historique."
  },
  {
    "id": "concorde",
    "name": "Concorde",
    "coords": [
      2.3218,
      48.8653
    ],
    "lines": [
      "1",
      "8",
      "12"
    ],
    "hint": "1er / 8e arr. • Lignes 1, 8, 12",
    "arrondissement": 8,
    "funFact": "Ses faïences de la ligne 12 sont carrelées des lettres de la Déclaration des Droits de l'Homme et du Citoyen."
  },
  {
    "id": "cite",
    "name": "Cité",
    "coords": [
      2.3456,
      48.855
    ],
    "lines": [
      "4"
    ],
    "hint": "4e arr. • Ligne 4",
    "arrondissement": 4,
    "funFact": "Seule station de métro située sur une île de la Seine, directement sous la Préfecture de Police et le Palais de Justice."
  },
  {
    "id": "belleville",
    "name": "Belleville",
    "coords": [
      2.3768,
      48.8719
    ],
    "lines": [
      "2",
      "11"
    ],
    "hint": "10e / 11e / 19e / 20e arr. • Lignes 2, 11",
    "arrondissement": 20,
    "funFact": "Carrefour populaire et multiculturel à la frontière exacte de 4 arrondissements parisiens."
  },
  {
    "id": "nation",
    "name": "Nation",
    "coords": [
      2.396,
      48.8482
    ],
    "lines": [
      "1",
      "2",
      "6",
      "9"
    ],
    "hint": "11e / 12e arr. • Lignes 1, 2, 6, 9",
    "arrondissement": 12,
    "funFact": "Grand rond-point d'entrée de l'est parisien orné de la sculpture monumentale du Triomphe de la République."
  },
  {
    "id": "gare_du_nord",
    "name": "Gare du Nord",
    "coords": [
      2.3553,
      48.8809
    ],
    "lines": [
      "4",
      "5"
    ],
    "hint": "10e arr. • Lignes 4, 5",
    "arrondissement": 10,
    "funFact": "La gare ferroviaire la plus fréquentée d'Europe, hub vers le nord de la France, la Belgique et Londres."
  },
  {
    "id": "saint_germain",
    "name": "Saint-Germain-des-Prés",
    "coords": [
      2.3332,
      48.854
    ],
    "lines": [
      "4"
    ],
    "hint": "6e arr. • Ligne 4",
    "arrondissement": 6,
    "funFact": "Épicentre littéraire de Paris, au pied de l'abbaye romane et des célèbres cafés de Flore et des Deux Magots."
  },
  {
    "id": "arts_et_metiers",
    "name": "Arts et Métiers",
    "coords": [
      2.3562,
      48.8655
    ],
    "lines": [
      "3",
      "11"
    ],
    "hint": "3e arr. • Lignes 3, 11",
    "arrondissement": 3,
    "funFact": "Ambiance steampunk unique au monde sur le quai de la ligne 11, recouverte de plaques de cuivre rivetées façon Nautilus."
  },
  {
    "id": "opera",
    "name": "Opéra",
    "coords": [
      2.3323,
      48.8714
    ],
    "lines": [
      "3",
      "7",
      "8"
    ],
    "hint": "2e / 9e arr. • Lignes 3, 7, 8",
    "arrondissement": 9,
    "funFact": "Sous la place de l'Opéra et la somptueuse façade dorée du Palais Garnier de Charles Garnier."
  },
  {
    "id": "trocadero",
    "name": "Trocadéro",
    "coords": [
      2.2871,
      48.8631
    ],
    "lines": [
      "6",
      "9"
    ],
    "hint": "16e arr. • Lignes 6, 9",
    "arrondissement": 16,
    "funFact": "Esplanade monumentale du Palais de Chaillot offrant le panorama le plus spectaculaire sur la Tour Eiffel."
  },
  {
    "id": "gambetta",
    "name": "Gambetta",
    "coords": [
      2.3986,
      48.865
    ],
    "lines": [
      "3",
      "3bis"
    ],
    "hint": "20e arr. • Lignes 3, 3bis",
    "arrondissement": 20,
    "funFact": "Face à la mairie du 20e arrondissement et à l'entrée haute du cimetière du Père-Lachaise."
  },
  {
    "id": "invalides",
    "name": "Invalides",
    "coords": [
      2.3164,
      48.8596
    ],
    "lines": [
      "8",
      "13"
    ],
    "hint": "7e arr. • Lignes 8, 13",
    "arrondissement": 7,
    "funFact": "Vaste esplanade menant au tombeau de Napoléon Ier sous le Dôme doré et face au pont Alexandre III."
  },
  {
    "id": "pont_neuf",
    "name": "Pont Neuf",
    "coords": [
      2.3414,
      48.8584
    ],
    "lines": [
      "7"
    ],
    "hint": "1er arr. • Ligne 7",
    "arrondissement": 1,
    "funFact": "Face aux grands magasins de la Samaritaine et au plus ancien pont de pierre traversant la Seine."
  },
  {
    "id": "gare_de_lyon",
    "name": "Gare de Lyon",
    "coords": [
      2.3734,
      48.8449
    ],
    "lines": [
      "1",
      "14"
    ],
    "hint": "12e arr. • Lignes 1, 14",
    "arrondissement": 12,
    "funFact": "La porte des départs vers les Alpes et le Sud, dominée par sa tour de l'Horloge de 67 mètres."
  },
  {
    "id": "liege",
    "name": "Liège",
    "coords": [
      2.327,
      48.88
    ],
    "lines": [
      "13"
    ],
    "hint": "8e / 9e arr. • Ligne 13",
    "arrondissement": 8,
    "funFact": "Station atypique à quais décalés (trop étroite sous la rue d'Amsterdam), ornée de fresques en faïence de Liège."
  },
  {
    "id": "denfert",
    "name": "Denfert-Rochereau",
    "coords": [
      2.3323,
      48.8338
    ],
    "lines": [
      "4",
      "6"
    ],
    "hint": "14e arr. • Lignes 4, 6",
    "arrondissement": 14,
    "funFact": "Sous la statue du Lion de Belfort et porte d'accès aux célèbres Catacombes de Paris."
  },
  {
    "id": "etoile",
    "name": "Charles de Gaulle - Étoile",
    "coords": [
      2.295,
      48.8738
    ],
    "lines": [
      "1",
      "2",
      "6"
    ],
    "hint": "8e / 16e / 17e arr. • Lignes 1, 2, 6",
    "arrondissement": 8,
    "funFact": "Située directement sous l'Arc de Triomphe et le rond-point géant aux douze avenues rayonnantes."
  },
  {
    "id": "palais_royal",
    "name": "Palais Royal - Musée du Louvre",
    "coords": [
      2.3364,
      48.8625
    ],
    "lines": [
      "1",
      "7"
    ],
    "hint": "1er arr. • Lignes 1, 7",
    "arrondissement": 1,
    "funFact": "Son entrée place Colette est le Kiosque des Noctambules en perles de verre de Murano de Jean-Michel Othoniel."
  },
  {
    "id": "olympiades",
    "name": "Olympiades",
    "coords": [
      2.3664,
      48.8269
    ],
    "lines": [
      "14"
    ],
    "hint": "13e arr. • Ligne 14",
    "arrondissement": 13,
    "funFact": "Au cœur du quartier chinois de Paris, sous la vaste dalle surélevée des tours des Olympiades."
  },
  {
    "id": "cluny",
    "name": "Cluny - La Sorbonne",
    "coords": [
      2.3444,
      48.8517
    ],
    "lines": [
      "10"
    ],
    "hint": "5e arr. • Ligne 10",
    "arrondissement": 5,
    "funFact": "Plafond en mosaïque reprenant les signatures des grands écrivains, poètes et penseurs du Quartier Latin."
  },
  {
    "id": "republique",
    "name": "République",
    "coords": [
      2.3644,
      48.8675
    ],
    "lines": [
      "3",
      "5",
      "8",
      "9",
      "11"
    ],
    "hint": "3e / 10e / 11e arr. • Lignes 3, 5, 8, 9, 11",
    "arrondissement": 11,
    "funFact": "Seule station du réseau desservie par cinq lignes de métro différentes sans RER."
  },
  {
    "id": "saint_lazare",
    "name": "Saint-Lazare",
    "coords": [
      2.3255,
      48.8756
    ],
    "lines": [
      "3",
      "12",
      "13",
      "14"
    ],
    "hint": "8e / 9e arr. • Lignes 3, 12, 13, 14",
    "arrondissement": 8,
    "funFact": "Deuxième gare de Paris en fréquentation, immortalisée par Claude Monet et ses toiles impressionnistes."
  },
  {
    "id": "porte_maillot",
    "name": "Porte Maillot",
    "coords": [
      2.2825,
      48.8778
    ],
    "lines": [
      "1",
      "14"
    ],
    "hint": "16e / 17e arr. • Lignes 1, 14",
    "arrondissement": 17,
    "funFact": "Porte d'entrée ouest de Paris entre le Palais des Congrès et le Bois de Boulogne."
  },
  {
    "id": "stalingrad",
    "name": "Stalingrad",
    "coords": [
      2.3663,
      48.8841
    ],
    "lines": [
      "2",
      "5",
      "7"
    ],
    "hint": "10e / 19e arr. • Lignes 2, 5, 7",
    "arrondissement": 19,
    "funFact": "Viaduc aérien spectaculaire surplombant le canal Saint-Martin et la Rotonde de la Villette."
  },
  {
    "id": "jaures",
    "name": "Jaurès",
    "coords": [
      2.3704,
      48.8817
    ],
    "lines": [
      "2",
      "5",
      "7bis"
    ],
    "hint": "10e / 19e arr. • Lignes 2, 5, 7bis",
    "arrondissement": 19,
    "funFact": "Station de pont enjambant le canal Saint-Martin au débouché du bassin de la Villette."
  },
  {
    "id": "pere_lachaise",
    "name": "Père Lachaise",
    "coords": [
      2.3879,
      48.8617
    ],
    "lines": [
      "2",
      "3"
    ],
    "hint": "11e / 20e arr. • Lignes 2, 3",
    "arrondissement": 20,
    "funFact": "Entrée principale du cimetière le plus visité au monde (Chopin, Jim Morrison, Édith Piaf, Oscar Wilde)."
  },
  {
    "id": "porte_versailles",
    "name": "Porte de Versailles",
    "coords": [
      2.2872,
      48.8322
    ],
    "lines": [
      "12"
    ],
    "hint": "15e arr. • Ligne 12",
    "arrondissement": 15,
    "funFact": "Plus grand parc des expositions de France (Salon de l'Agriculture, Mondial de l'Auto)."
  },
  {
    "id": "la_defense",
    "name": "La Défense (Grande Arche)",
    "coords": [
      2.2384,
      48.8919
    ],
    "lines": [
      "1"
    ],
    "hint": "Puteaux / Courbevoie • Ligne 1",
    "arrondissement": 92,
    "funFact": "Terminus ouest de la ligne 1 au cœur du premier quartier d'affaires d'Europe."
  },
  {
    "id": "chateau_vincennes",
    "name": "Château de Vincennes",
    "coords": [
      2.4402,
      48.8447
    ],
    "lines": [
      "1"
    ],
    "hint": "Vincennes / 12e arr. • Ligne 1",
    "arrondissement": 94,
    "funFact": "Au pied de la forteresse royale médiévale et du plus haut donjon de plaine d'Europe."
  },
  {
    "id": "strasbourg_saint_denis",
    "name": "Strasbourg - Saint-Denis",
    "coords": [
      2.3538,
      48.8697
    ],
    "lines": [
      "4",
      "8",
      "9"
    ],
    "hint": "2e / 3e / 10e arr. • Lignes 4, 8, 9",
    "arrondissement": 10,
    "funFact": "Située sous les deux arches de triomphe de Louis XIV : la Porte Saint-Denis et la Porte Saint-Martin."
  },
  {
    "id": "pont_de_sevres",
    "name": "Pont de Sèvres",
    "coords": [
      2.2302,
      48.8298
    ],
    "lines": [
      "9"
    ],
    "hint": "Boulogne-Billancourt • Ligne 9",
    "arrondissement": 92,
    "funFact": "Terminus ouest au bord de la Seine, face au Musée National de Céramique de Sèvres."
  },
  {
    "id": "mairie_montreuil",
    "name": "Mairie de Montreuil",
    "coords": [
      2.4418,
      48.8624
    ],
    "lines": [
      "9"
    ],
    "hint": "Montreuil • Ligne 9",
    "arrondissement": 93,
    "funFact": "Terminus est en Seine-Saint-Denis, face à l'hôtel de ville et au théâtre public de Montreuil."
  },
  {
    "id": "kleber",
    "name": "Kléber",
    "coords": [
      2.2934,
      48.8715
    ],
    "lines": [
      "6"
    ],
    "hint": "16e arr. • Ligne 6",
    "arrondissement": 16,
    "funFact": "Station technique à quatre voies servant de véritable terminus de régulation pour les rames de la ligne 6."
  },
  {
    "id": "daumesnil",
    "name": "Daumesnil",
    "coords": [
      2.3957,
      48.8396
    ],
    "lines": [
      "6",
      "8"
    ],
    "hint": "12e arr. • Lignes 6, 8",
    "arrondissement": 12,
    "funFact": "Carrefour commerçant du 12e arrondissement en direction du lac Daumesnil et du bois de Vincennes."
  },
  {
    "id": "porte_clignancourt",
    "name": "Porte de Clignancourt",
    "coords": [
      2.3444,
      48.8978
    ],
    "lines": [
      "4"
    ],
    "hint": "18e arr. • Ligne 4",
    "arrondissement": 18,
    "funFact": "Historique terminus nord de la ligne 4 ouvrant sur le célèbre marché aux puces de Saint-Ouen."
  },
  {
    "id": "porte_orleans",
    "name": "Porte d'Orléans",
    "coords": [
      2.3255,
      48.8236
    ],
    "lines": [
      "4"
    ],
    "hint": "14e arr. • Ligne 4",
    "arrondissement": 14,
    "funFact": "Ancien terminus sud de la 4, grand pôle d'échanges vers la banlieue sud et la cité universitaire."
  },
  {
    "id": "pyrenees",
    "name": "Pyrénées",
    "coords": [
      2.3853,
      48.8739
    ],
    "lines": [
      "11"
    ],
    "hint": "19e / 20e arr. • Ligne 11",
    "arrondissement": 20,
    "funFact": "Au carrefour de la rue des Pyrénées et de la rue de Belleville, l'une des stations les plus escarpées de Paris."
  },
  {
    "id": "bercy",
    "name": "Bercy",
    "coords": [
      2.38,
      48.8403
    ],
    "lines": [
      "6",
      "14"
    ],
    "hint": "12e arr. • Lignes 6, 14",
    "arrondissement": 12,
    "funFact": "Au pied de l'Accor Arena (POPB) et du ministère de l'Économie et des Finances."
  },
  {
    "id": "cour_saint_emilion",
    "name": "Cour Saint-Émilion",
    "coords": [
      2.3867,
      48.8336
    ],
    "lines": [
      "14"
    ],
    "hint": "12e arr. • Ligne 14",
    "arrondissement": 12,
    "funFact": "Entrée directe dans Bercy Village, réhabilitation des anciens chais vinicoles de la capitale."
  },
  {
    "id": "bibliotheque_mitterrand",
    "name": "Bibliothèque François Mitterrand",
    "coords": [
      2.3789,
      48.8297
    ],
    "lines": [
      "14"
    ],
    "hint": "13e arr. • Ligne 14",
    "arrondissement": 13,
    "funFact": "Grande station souterraine desservant les quatre tours en forme de livre ouvert de la BnF."
  },
  {
    "id": "pont_cardinet",
    "name": "Pont Cardinet",
    "coords": [
      2.3142,
      48.8878
    ],
    "lines": [
      "14"
    ],
    "hint": "17e arr. • Ligne 14",
    "arrondissement": 17,
    "funFact": "Station du nouveau quartier éco-responsable des Batignolles et du parc Martin Luther King."
  },
  {
    "id": "porte_clichy",
    "name": "Porte de Clichy",
    "coords": [
      2.3136,
      48.8944
    ],
    "lines": [
      "13",
      "14"
    ],
    "hint": "17e arr. • Lignes 13, 14",
    "arrondissement": 17,
    "funFact": "Au pied du nouveau Tribunal de Paris conçu par Renzo Piano, tour de verre de 160 mètres."
  },
  {
    "id": "balard",
    "name": "Balard",
    "coords": [
      2.2783,
      48.8364
    ],
    "lines": [
      "8"
    ],
    "hint": "15e arr. • Ligne 8",
    "arrondissement": 15,
    "funFact": "Terminus sud-ouest de la 8 face à l'Hexagone Balard, le « Pentagone français » du ministère des Armées."
  },
  {
    "id": "mirabeau",
    "name": "Mirabeau",
    "coords": [
      2.2728,
      48.8471
    ],
    "lines": [
      "10"
    ],
    "hint": "16e arr. • Ligne 10",
    "arrondissement": 16,
    "funFact": "Station atypique à voie unique en forte rampe : les rames la traversent à vive allure sans s'arrêter dans l'autre sens."
  },
  {
    "id": "barbes",
    "name": "Barbès - Rochechouart",
    "coords": [
      2.3499,
      48.8836
    ],
    "lines": [
      "2",
      "4"
    ],
    "hint": "9e / 10e / 18e arr. • Lignes 2, 4",
    "arrondissement": 18,
    "funFact": "Point de rencontre vibrant entre le métro aérien de la ligne 2 et le métro souterrain de la ligne 4, face au Louxor."
  },
  {
    "id": "place_clichy",
    "name": "Place de Clichy",
    "coords": [
      2.3276,
      48.8835
    ],
    "lines": [
      "2",
      "13"
    ],
    "hint": "8e / 9e / 17e / 18e arr. • Lignes 2, 13",
    "arrondissement": 17,
    "funFact": "Sous le monument au maréchal Moncey, carrefour animé reliant les Batignolles et Montmartre."
  },
  {
    "id": "saint_michel",
    "name": "Saint-Michel",
    "coords": [
      2.3442,
      48.8533
    ],
    "lines": [
      "4"
    ],
    "hint": "5e / 6e arr. • Ligne 4",
    "arrondissement": 5,
    "funFact": "Au pied de la monumentale fontaine Saint-Michel terrassant le démon, point de départ du Quartier Latin."
  },
  {
    "id": "odeon",
    "name": "Odéon",
    "coords": [
      2.3386,
      48.8522
    ],
    "lines": [
      "4",
      "10"
    ],
    "hint": "6e arr. • Lignes 4, 10",
    "arrondissement": 6,
    "funFact": "Sous le carrefour de l'Odéon et à quelques pas du théâtre de l'Odéon et du jardin du Luxembourg."
  },
  {
    "id": "jussieu",
    "name": "Jussieu",
    "coords": [
      2.3547,
      48.8461
    ],
    "lines": [
      "7",
      "10"
    ],
    "hint": "5e arr. • Lignes 7, 10",
    "arrondissement": 5,
    "funFact": "Au pied du campus universitaire Pierre et Marie Curie (Sorbonne Université) et des arènes de Lutèce."
  },
  {
    "id": "les_halles",
    "name": "Les Halles",
    "coords": [
      2.3461,
      48.8617
    ],
    "lines": [
      "4"
    ],
    "hint": "1er arr. • Ligne 4",
    "arrondissement": 1,
    "funFact": "Sous la grande Canopée des Halles et l'église Saint-Eustache, au cœur commercial de la capitale."
  },
  {
    "id": "madeleine",
    "name": "Madeleine",
    "coords": [
      2.3247,
      48.8697
    ],
    "lines": [
      "8",
      "12",
      "14"
    ],
    "hint": "8e arr. • Lignes 8, 12, 14",
    "arrondissement": 8,
    "funFact": "Entourant le temple néoclassique de l'église de la Madeleine et ses célèbres épiceries fines."
  },
  {
    "id": "pasteur",
    "name": "Pasteur",
    "coords": [
      2.3128,
      48.8428
    ],
    "lines": [
      "6",
      "12"
    ],
    "hint": "15e arr. • Lignes 6, 12",
    "arrondissement": 15,
    "funFact": "Dédiée à Louis Pasteur et à l'Institut Pasteur tout proche, ornée de citations scientifiques."
  },
  {
    "id": "gare_est",
    "name": "Gare de l'Est",
    "coords": [
      2.3586,
      48.8767
    ],
    "lines": [
      "4",
      "5",
      "7"
    ],
    "hint": "10e arr. • Lignes 4, 5, 7",
    "arrondissement": 10,
    "funFact": "Gare historique des trains vers Strasbourg, l'Alsace, l'Allemagne et l'Orient-Express."
  },
  {
    "id": "buttes_chaumont",
    "name": "Buttes Chaumont",
    "coords": [
      2.3817,
      48.8789
    ],
    "lines": [
      "7bis"
    ],
    "hint": "19e arr. • Ligne 7bis",
    "arrondissement": 19,
    "funFact": "L'une des stations les plus profondes de Paris (29m), débouchant directement dans le parc des Buttes-Chaumont."
  },
  {
    "id": "porte_pantin",
    "name": "Porte de Pantin",
    "coords": [
      2.3932,
      48.8885
    ],
    "lines": [
      "5"
    ],
    "hint": "19e arr. • Ligne 5",
    "arrondissement": 19,
    "funFact": "Sous la Philharmonie de Paris, la Cité de la Musique et le Conservatoire National Supérieur."
  }
];

export const METRO_LINE_TOPOLOGY: Record<string, string[]> = {
  "1": [
    "la_defense",
    "porte_maillot",
    "etoile",
    "concorde",
    "palais_royal",
    "chatelet",
    "bastille",
    "gare_de_lyon",
    "nation",
    "chateau_vincennes"
  ],
  "2": [
    "etoile",
    "place_clichy",
    "barbes",
    "stalingrad",
    "jaures",
    "belleville",
    "pere_lachaise",
    "nation"
  ],
  "3": [
    "saint_lazare",
    "opera",
    "arts_et_metiers",
    "republique",
    "pere_lachaise",
    "gambetta"
  ],
  "4": [
    "porte_orleans",
    "denfert",
    "montparnasse",
    "saint_germain",
    "odeon",
    "saint_michel",
    "cite",
    "chatelet",
    "les_halles",
    "strasbourg_saint_denis",
    "gare_est",
    "gare_du_nord",
    "barbes",
    "porte_clignancourt"
  ],
  "5": [
    "place_italie",
    "bastille",
    "republique",
    "gare_est",
    "gare_du_nord",
    "stalingrad",
    "jaures",
    "porte_pantin"
  ],
  "6": [
    "trocadero",
    "bir_hakeim",
    "kleber",
    "etoile",
    "pasteur",
    "montparnasse",
    "denfert",
    "place_italie",
    "bercy",
    "daumesnil",
    "nation"
  ],
  "7": [
    "place_italie",
    "jussieu",
    "chatelet",
    "pont_neuf",
    "palais_royal",
    "opera",
    "gare_est",
    "stalingrad"
  ],
  "8": [
    "balard",
    "invalides",
    "concorde",
    "madeleine",
    "opera",
    "strasbourg_saint_denis",
    "republique",
    "bastille",
    "daumesnil"
  ],
  "9": [
    "pont_de_sevres",
    "trocadero",
    "strasbourg_saint_denis",
    "republique",
    "nation",
    "mairie_montreuil"
  ],
  "10": [
    "mirabeau",
    "odeon",
    "cluny",
    "jussieu"
  ],
  "11": [
    "chatelet",
    "arts_et_metiers",
    "republique",
    "belleville",
    "pyrenees"
  ],
  "12": [
    "porte_versailles",
    "pasteur",
    "montparnasse",
    "concorde",
    "madeleine",
    "saint_lazare",
    "abbesses"
  ],
  "13": [
    "porte_clichy",
    "place_clichy",
    "liege",
    "saint_lazare",
    "invalides",
    "montparnasse"
  ],
  "14": [
    "porte_maillot",
    "pont_cardinet",
    "porte_clichy",
    "saint_lazare",
    "madeleine",
    "chatelet",
    "gare_de_lyon",
    "bercy",
    "cour_saint_emilion",
    "bibliotheque_mitterrand",
    "olympiades"
  ],
  "3bis": [
    "gambetta"
  ],
  "7bis": [
    "jaures",
    "buttes_chaumont"
  ]
};

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
