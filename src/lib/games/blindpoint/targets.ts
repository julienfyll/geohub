import { BlindPointPack, BlindPointTarget, BlindPointClientTarget } from "./types";
import monumentsData from "./data/monuments.json";
import castlesData from "./data/castles.json";
import citiesFranceData from "./data/cities_france.json";

const monuments = monumentsData as BlindPointTarget[];
const castles = castlesData as BlindPointTarget[];
const citiesFrance = citiesFranceData as BlindPointTarget[];

export function getTargetsByPack(pack: BlindPointPack): BlindPointTarget[] {
  switch (pack) {
    case "villes_france":
      return citiesFrance;
    case "chateaux_france":
      return castles;
    case "monuments_monde":
      return monuments;
  }
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
 * Selects 5 distinct targets for a session based on pack, mode, and seed
 */
export function getSessionTargets(
  pack: BlindPointPack,
  mode: "daily" | "free",
  customSeed?: string
): { seed: string; targets: BlindPointTarget[] } {
  const pool = getTargetsByPack(pack);

  let seed = customSeed;
  if (!seed) {
    if (mode === "daily") {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      seed = `blindpoint-${today}-${pack}`;
    } else {
      seed = `free-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    }
  }

  const shuffled = shuffleWithSeed(pool, seed);
  const selected = shuffled.slice(0, 5);

  return { seed, targets: selected };
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
    roundIndex,
    totalRounds,
  };
}

export function getTargetById(id: string, pack: BlindPointPack): BlindPointTarget | null {
  const pool = getTargetsByPack(pack);
  return pool.find((t) => t.id === id) || null;
}
