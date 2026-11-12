export type BorderPathPack = "monde" | "europe" | "france_departements" | "ameriques" | "afrique";

export type BorderPathMode = "daily" | "free" | "rush";

export interface FixedLink {
  targetId: string;
  label: string; // e.g. "Pont de l'Øresund", "Eurotunnel"
  type: "bridge" | "tunnel" | "causeway" | "ferry";
}

export interface BorderPathEntity {
  id: string;               // ISO-3 for countries (e.g. "FRA"), Dept code for France (e.g. "29")
  name: string;             // French name (e.g. "France", "Finistère")
  normalizedName: string;   // Clean lower-cased & accent-stripped for fast fuzzy matching
  aliases?: string[];       // Common aliases (e.g. ["Hexagone", "FR"], ["29", "Brest"])
  capitalOrChefLieu?: string; // Capital or Prefecture
  continentOrRegion?: string; // Region or Continent
  latitude: number;         // Center latitude for map auto-panning
  longitude: number;        // Center longitude for map auto-panning
  neighbors: string[];      // Array of direct neighbor entity IDs
  fixedLinks?: FixedLink[]; // Optional bridges, tunnels or causeways
  flagEmoji?: string;       // Flag emoji (for countries)
  population?: number;      // For future ascending/descending criteria
  areaKm2?: number;         // For future area criteria
}

export type BorderPathGraph = Record<string, BorderPathEntity>;

export interface BorderPathPathResult {
  found: boolean;
  distance: number;         // Number of border crossings (edges)
  paths: string[][];        // List of shortest optimal paths (e.g. [["FRA", "DEU", "POL"]])
}

export interface BorderPathStepResult {
  valid: boolean;
  isAdjacent: boolean;
  alreadyVisited: boolean;
  currentEntityId: string;
  targetEntityId: string;
  pathLength: number;
  minRemainingDistance: number;
  isComplete: boolean;
  message?: string;
}

export interface BorderPathSessionInit {
  sessionId: string;
  pack: BorderPathPack;
  mode: BorderPathMode;
  seed: string;
  startEntity: BorderPathEntity;
  targetEntity: BorderPathEntity;
  minOptimalSteps: number; // BFS optimal steps (e.g. 4)
  allowedEntityIds: string[];
}
