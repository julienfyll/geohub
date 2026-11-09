import { BlindPointPack, BlindPointDifficulty, BlindPointTarget, BlindPointClientTarget } from "./types";
import monumentsData from "./data/monuments.json";
import castlesData from "./data/castles.json";
import citiesFranceData from "./data/cities_france.json";
import citiesWorldData from "./data/cities_world.json";
import lieuxFranceData from "./data/lieux_france.json";
import lieuxMondeData from "./data/lieux_monde.json";
import lieuxParisData from "./data/lieux_paris.json";

const monuments = monumentsData as BlindPointTarget[];
const castles = castlesData as BlindPointTarget[];
const citiesFrance = citiesFranceData as BlindPointTarget[];
const citiesWorld = citiesWorldData as BlindPointTarget[];
const lieuxFrance = lieuxFranceData as BlindPointTarget[];
const lieuxMonde = lieuxMondeData as BlindPointTarget[];
const lieuxParis = lieuxParisData as BlindPointTarget[];

export function getTargetsByPack(
  pack: BlindPointPack,
  difficulty?: BlindPointDifficulty
): BlindPointTarget[] {
  let pool: BlindPointTarget[] = [];
  switch (pack) {
    case "villes_france":
      pool = citiesFrance;
      break;
    case "villes_monde":
      pool = citiesWorld;
      break;
    case "lieux_france":
    case "chateaux_france":
      pool = lieuxFrance;
      break;
    case "lieux_monde":
    case "monuments_monde":
      pool = lieuxMonde;
      break;
    case "lieux_paris":
      pool = lieuxParis;
      break;
  }

  if (difficulty) {
    const filtered = pool.filter((t) => t.difficulty === difficulty);
    if (filtered.length >= 5) {
      return filtered;
    }
  }

  return pool;
}

/**
 * 32-bit Murmur/FNV-style string hash
 */
export function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 PRNG generator seeded with integer
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
 * Deterministic Fisher-Yates shuffle using seeded RNG
 */
export function shuffleWithSeed<T>(array: T[], seedStr: string): T[] {
  const rng = createRng(hashString(seedStr));
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Selects 5 distinct targets for a session based on pack, mode, difficulty and seed.
 * For world cities, guarantees continental stratification across the 5 rounds.
 */
export function getSessionTargets(
  pack: BlindPointPack,
  mode: "daily" | "free",
  difficulty: BlindPointDifficulty = "moyen",
  customSeed?: string
): { seed: string; targets: BlindPointTarget[] } {
  let seed = customSeed;
  if (!seed) {
    if (mode === "daily") {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      seed = `blindpoint-${today}-${pack}-${difficulty}`;
    } else {
      seed = `free-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    }
  }

  const pool = getTargetsByPack(pack, difficulty);

  // Continental stratification for World Cities
  if (pack === "villes_monde") {
    const rng = createRng(hashString(seed));
    const continents = ["EU", "NA", "SA", "AS", "AF"];
    // Optional inclusion of OC by swapping one continent probabilistically
    if (rng() > 0.5) {
      continents[Math.floor(rng() * continents.length)] = "OC";
    }

    const selected: BlindPointTarget[] = [];
    const usedIds = new Set<string>();

    for (const cont of continents) {
      const matching = pool.filter((c) => c.continent === cont && !usedIds.has(c.id));
      if (matching.length > 0) {
        const shuffled = shuffleWithSeed(matching, `${seed}-${cont}`);
        selected.push(shuffled[0]);
        usedIds.add(shuffled[0].id);
      }
    }

    // Fallback if some continent didn't yield a match
    if (selected.length < 5) {
      const remaining = pool.filter((c) => !usedIds.has(c.id));
      const shuffledRem = shuffleWithSeed(remaining, `${seed}-rem`);
      for (const item of shuffledRem) {
        if (selected.length >= 5) break;
        selected.push(item);
        usedIds.add(item.id);
      }
    }

    // Shuffle the final 5 rounds order so continents don't appear in fixed sequence
    const finalShuffled = shuffleWithSeed(selected.slice(0, 5), `${seed}-order`);
    return { seed, targets: finalShuffled };
  }

  // Standard France or others shuffle
  const shuffled = shuffleWithSeed(pool, seed);
  const selected = shuffled.slice(0, 5);

  return { seed, targets: selected };
}

export function getProxyImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/api/image-proxy")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export function toClientTarget(
  target: BlindPointTarget,
  roundIndex: number,
  totalRounds: number = 5
): BlindPointClientTarget {
  return {
    id: target.id,
    name: target.name,
    subtitle: target.subtitle,
    pack: target.pack,
    scale: target.scale,
    difficulty: target.difficulty,
    roundIndex,
    totalRounds,
    imageUrl: getProxyImageUrl(target.imageUrl),
    imageCredit: target.imageCredit,
  };
}

export function getTargetById(
  id: string,
  pack: BlindPointPack,
  difficulty?: BlindPointDifficulty
): BlindPointTarget | null {
  const pool = getTargetsByPack(pack, difficulty);
  return pool.find((t) => t.id === id) || null;
}
