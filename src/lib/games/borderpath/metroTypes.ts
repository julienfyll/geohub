export interface MetroStation {
  id: string;
  name: string;
  normalizedName: string;
  latitude: number;
  longitude: number;
  coords: [number, number];
  continentOrRegion?: string;
  capitalOrChefLieu?: string;
  lines: string[];
  neighbors: string[];
}

export interface MetroLine {
  id: string;
  num: string;
  name: string;
  bg: string;
  text: string;
  terminus: [string, string];
  stations: string[];
  edges: [string, string][];
}

export interface MetroTopologyData {
  stations: MetroStation[];
  lines: MetroLine[];
}

export interface MetroHop {
  lineId: string;
  fromId: string;
  toId: string;
  intermediateStations: string[];
  stationsCount: number;
  timestamp: number;
}

export interface MetroOptimalPathResult {
  minLines: number;
  linesUsed: string[];
  stationHops: string[];
  minPhysicalStations: number;
  physicalStationPath: string[];
}

export interface MetroValidationResult {
  valid: boolean;
  lineId?: string;
  fromId?: string;
  toId?: string;
  intermediateStations?: string[];
  stationsCount?: number;
  isTargetReached?: boolean;
  error?: string;
}
