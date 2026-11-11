import {
  BorderPassEntity,
  BorderPassGraph,
  BorderPassPack,
  BorderPassPathResult,
  BorderPassStepResult,
  BorderPassSessionInit,
  BorderPassMode,
} from "./types";
import worldBordersData from "./data/world_borders.json";
import franceBordersData from "./data/france_borders.json";

const worldGraph = worldBordersData as BorderPassGraph;
const franceGraph = franceBordersData as BorderPassGraph;

/**
 * Normalizes text for search (lowercased, accents removed, trimmed)
 */
export function normalizeSearchText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * 32-bit FNV-1a string hash for deterministic seeded PRNG
 */
export function hashSeed(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Seeded pseudo-random generator (Mulberry32)
 */
export function createRng(seedInt: number) {
  let a = seedInt;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns the relevant subgraph for the requested pack
 */
export function getPackGraph(pack: BorderPassPack): BorderPassGraph {
  if (pack === "france_departements") {
    return franceGraph;
  }

  if (pack === "europe") {
    const filtered: BorderPassGraph = {};
    for (const [id, entity] of Object.entries(worldGraph)) {
      if (entity.continentOrRegion === "Europe") {
        // Keep neighbors that are also in Europe
        filtered[id] = {
          ...entity,
          neighbors: entity.neighbors.filter(
            (nbr) => worldGraph[nbr]?.continentOrRegion === "Europe"
          ),
        };
      }
    }
    return filtered;
  }

  if (pack === "ameriques") {
    const filtered: BorderPassGraph = {};
    for (const [id, entity] of Object.entries(worldGraph)) {
      if (entity.continentOrRegion === "Americas") {
        filtered[id] = {
          ...entity,
          neighbors: entity.neighbors.filter(
            (nbr) => worldGraph[nbr]?.continentOrRegion === "Americas"
          ),
        };
      }
    }
    return filtered;
  }

  if (pack === "afrique") {
    const filtered: BorderPassGraph = {};
    for (const [id, entity] of Object.entries(worldGraph)) {
      if (entity.continentOrRegion === "Africa") {
        filtered[id] = {
          ...entity,
          neighbors: entity.neighbors.filter(
            (nbr) => worldGraph[nbr]?.continentOrRegion === "Africa"
          ),
        };
      }
    }
    return filtered;
  }

  // Default: world continental graph
  return worldGraph;
}

/**
 * Computes all shortest optimal paths and distance using BFS
 */
export function findShortestPath(
  startId: string,
  targetId: string,
  graph: BorderPassGraph,
  forbiddenIds: Set<string> = new Set()
): BorderPassPathResult {
  if (!graph[startId] || !graph[targetId]) {
    return { found: false, distance: -1, paths: [] };
  }

  if (startId === targetId) {
    return { found: true, distance: 0, paths: [[startId]] };
  }

  const queue: string[][] = [[startId]];
  const minDistanceToNode = new Map<string, number>();
  minDistanceToNode.set(startId, 0);

  const optimalPaths: string[][] = [];
  let foundMinDistance = -1;

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const lastNode = currentPath[currentPath.length - 1];
    const currentDist = currentPath.length - 1;

    if (foundMinDistance !== -1 && currentDist >= foundMinDistance) {
      if (lastNode === targetId) {
        optimalPaths.push(currentPath);
      }
      continue;
    }

    if (lastNode === targetId) {
      foundMinDistance = currentDist;
      optimalPaths.push(currentPath);
      continue;
    }

    const neighbors = graph[lastNode]?.neighbors || [];
    for (const neighbor of neighbors) {
      if (forbiddenIds.has(neighbor) && neighbor !== targetId) continue;

      const nextDist = currentDist + 1;
      const recordedDist = minDistanceToNode.get(neighbor);

      if (recordedDist === undefined || nextDist <= recordedDist) {
        minDistanceToNode.set(neighbor, nextDist);
        queue.push([...currentPath, neighbor]);
      }
    }
  }

  return {
    found: optimalPaths.length > 0,
    distance: foundMinDistance,
    paths: optimalPaths,
  };
}

/**
 * Validates a candidate step made by the player
 */
export function validateStep(
  currentId: string,
  candidateId: string,
  targetId: string,
  visitedIds: string[],
  graph: BorderPassGraph
): BorderPassStepResult {
  const current = graph[currentId];
  const candidate = graph[candidateId];

  if (!current || !candidate) {
    return {
      valid: false,
      isAdjacent: false,
      alreadyVisited: false,
      currentEntityId: currentId,
      targetEntityId: targetId,
      pathLength: visitedIds.length,
      minRemainingDistance: -1,
      isComplete: false,
      message: "Entité inconnue",
    };
  }

  const alreadyVisited = visitedIds.includes(candidateId);
  const isAdjacent = current.neighbors.includes(candidateId);

  if (!isAdjacent) {
    return {
      valid: false,
      isAdjacent: false,
      alreadyVisited,
      currentEntityId: currentId,
      targetEntityId: targetId,
      pathLength: visitedIds.length,
      minRemainingDistance: -1,
      isComplete: false,
      message: `${candidate.name} ne partage aucune frontière terrestre avec ${current.name}.`,
    };
  }

  if (alreadyVisited) {
    return {
      valid: false,
      isAdjacent: true,
      alreadyVisited: true,
      currentEntityId: currentId,
      targetEntityId: targetId,
      pathLength: visitedIds.length,
      minRemainingDistance: -1,
      isComplete: false,
      message: `Vous êtes déjà passé par ${candidate.name} !`,
    };
  }

  const updatedVisited = [...visitedIds, candidateId];
  const isComplete = candidateId === targetId;

  const shortest = findShortestPath(candidateId, targetId, graph);

  return {
    valid: true,
    isAdjacent: true,
    alreadyVisited: false,
    currentEntityId: candidateId,
    targetEntityId: targetId,
    pathLength: updatedVisited.length,
    minRemainingDistance: shortest.found ? shortest.distance : -1,
    isComplete,
    message: isComplete
      ? "🎯 Destination atteinte !"
      : `Frontière franchie : bienvenue en ${candidate.name} !`,
  };
}

/**
 * Computes shortest distances to all reachable nodes from a start entity using single-source BFS (O(V+E), <0.2ms)
 */
export function computeDistancesFrom(
  startId: string,
  graph: BorderPassGraph
): Map<string, number> {
  const dist = new Map<string, number>([[startId, 0]]);
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const d = dist.get(curr)!;
    const neighbors = graph[curr]?.neighbors || [];

    for (const nbr of neighbors) {
      if (!dist.has(nbr) && graph[nbr]) {
        dist.set(nbr, d + 1);
        queue.push(nbr);
      }
    }
  }

  return dist;
}

/**
 * Autocomplete / fuzzy search for typing input
 */
export function searchEntities(
  query: string,
  graph: BorderPassGraph,
  limit: number = 6
): BorderPassEntity[] {
  const clean = normalizeSearchText(query);
  if (!clean || clean.length < 1) return [];

  const matches: { entity: BorderPassEntity; score: number }[] = [];

  for (const entity of Object.values(graph)) {
    const normName = entity.normalizedName;

    // Exact start match on name (Highest priority)
    if (normName.startsWith(clean)) {
      matches.push({ entity, score: 100 - (normName.length - clean.length) });
      continue;
    }

    // Exact start on ID (e.g. "29" for Finistère or "FRA" for France)
    if (entity.id.toLowerCase().startsWith(clean)) {
      matches.push({ entity, score: 95 });
      continue;
    }

    // Name contains query
    if (normName.includes(clean)) {
      matches.push({ entity, score: 80 });
      continue;
    }

    // Alias matches (e.g. chef-lieu or alternate names)
    if (
      entity.aliases?.some((a) => normalizeSearchText(a).startsWith(clean))
    ) {
      matches.push({ entity, score: 75 });
      continue;
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit).map((m) => m.entity);
}

/**
 * Generates a challenge (Daily, Free, or Custom)
 */
export function generateChallenge(options: {
  pack?: BorderPassPack;
  mode?: BorderPassMode;
  seed?: string;
  minSteps?: number;
  maxSteps?: number;
  startId?: string;
  targetId?: string;
}): BorderPassSessionInit {
  const pack = options.pack || "monde";
  const mode = options.mode || "daily";
  const minSteps = options.minSteps || 4;
  const maxSteps = options.maxSteps || 7;

  const graph = getPackGraph(pack);
  const entities = Object.values(graph);

  // Filter playable entities (at least 2 neighbors for interesting graph paths)
  const playable = entities.filter((e) => e.neighbors.length >= 2);
  const pool = playable.length >= 5 ? playable : entities;

  const seedString =
    options.seed ||
    (mode === "daily"
      ? `borderpass-${new Date().toISOString().slice(0, 10)}-${pack}`
      : `bp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);

  const rng = createRng(hashSeed(seedString));

  let startEntity: BorderPassEntity | undefined;
  let targetEntity: BorderPassEntity | undefined;
  let optimalSteps = 0;

  // Custom start and target requested
  if (options.startId && options.targetId && graph[options.startId] && graph[options.targetId]) {
    startEntity = graph[options.startId];
    targetEntity = graph[options.targetId];
    const path = findShortestPath(options.startId, options.targetId, graph);
    optimalSteps = path.distance;
  } else {
    // Attempt up to 40 random starting points to find a balanced challenge in [minSteps, maxSteps]
    const shuffled = [...pool].sort(() => rng() - 0.5);

    for (const candidateStart of shuffled) {
      const distances = computeDistancesFrom(candidateStart.id, graph);
      const targetsInRange: { entity: BorderPassEntity; dist: number }[] = [];

      for (const [id, d] of distances.entries()) {
        if (d >= minSteps && d <= maxSteps && graph[id]) {
          targetsInRange.push({ entity: graph[id], dist: d });
        }
      }

      if (targetsInRange.length > 0) {
        const picked = targetsInRange[Math.floor(rng() * targetsInRange.length)];
        startEntity = candidateStart;
        targetEntity = picked.entity;
        optimalSteps = picked.dist;
        break;
      }
    }

    // Fallback if no target within [minSteps, maxSteps] (e.g. small graph)
    if (!startEntity || !targetEntity) {
      for (const candidateStart of shuffled) {
        const distances = computeDistancesFrom(candidateStart.id, graph);
        const reachable = [...distances.entries()]
          .filter(([id, d]) => d >= 2 && graph[id])
          .sort((a, b) => b[1] - a[1]);

        if (reachable.length > 0) {
          const picked = reachable[0];
          startEntity = candidateStart;
          targetEntity = graph[picked[0]];
          optimalSteps = picked[1];
          break;
        }
      }
    }
  }

  // Absolute fallback
  if (!startEntity || !targetEntity) {
    startEntity = pool[0];
    targetEntity = pool[pool.length - 1];
    optimalSteps = 3;
  }

  return {
    sessionId: `bp_${mode}_${pack}_${hashSeed(seedString)}`,
    pack,
    mode,
    seed: seedString,
    startEntity,
    targetEntity,
    minOptimalSteps: optimalSteps,
    allowedEntityIds: Object.keys(graph),
  };
}

/**
 * Generates the daily challenge for a given pack and date
 */
export function generateDailyChallenge(
  pack: BorderPassPack = "monde",
  dateStr: string = new Date().toISOString().slice(0, 10)
): BorderPassSessionInit {
  return generateChallenge({
    pack,
    mode: "daily",
    seed: `borderpass-${dateStr}-${pack}`,
    minSteps: 4,
    maxSteps: 7,
  });
}
