import { BlindPointPack, BlindPointDifficulty, BlindPointTarget, BlindPointClientTarget, BlindPointMode } from "./types";
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
 * Selects distinct targets for a session based on pack(s), mode, difficulty, seed, and rounds count.
 * For world cities (standard mode), guarantees continental stratification across the 5 rounds.
 * For custom mode, supports combining multiple packs, custom round count (3, 5, 10, 15) and continent filtering.
 */
export function getSessionTargets(
  pack: BlindPointPack | BlindPointPack[],
  mode: BlindPointMode = "daily",
  difficulty: BlindPointDifficulty | "all" = "moyen",
  customSeed?: string,
  totalRounds: number = 5,
  continentFilter?: string
): { seed: string; targets: BlindPointTarget[]; scale: "fr" | "world" | "paris" } {
  const packsArray: BlindPointPack[] = Array.isArray(pack) ? pack : [pack];

  // Determine overall map scale
  let scale: "fr" | "world" | "paris" = "fr";
  const hasWorldPack = packsArray.some(
    (p) => p === "villes_monde" || p === "lieux_monde" || p === "monuments_monde"
  );
  const onlyParis = packsArray.length === 1 && packsArray[0] === "lieux_paris";

  if (hasWorldPack) {
    scale = "world";
  } else if (onlyParis) {
    scale = "paris";
  } else {
    scale = "fr";
  }

  let seed = customSeed;
  if (!seed) {
    if (mode === "daily") {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      seed = `blindpoint-${today}-${packsArray.join("_")}-${difficulty}`;
    } else if (mode === "custom") {
      seed = `custom-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    } else {
      seed = `free-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    }
  }

  // Continental stratification for single pack World Cities in daily/free 5-round mode
  if (
    packsArray.length === 1 &&
    packsArray[0] === "villes_monde" &&
    mode !== "custom" &&
    totalRounds === 5 &&
    !continentFilter
  ) {
    const pool = getTargetsByPack("villes_monde", difficulty === "all" ? undefined : difficulty);
    const rng = createRng(hashString(seed));
    const continents = ["EU", "NA", "SA", "AS", "AF"];
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

    if (selected.length < 5) {
      const remaining = pool.filter((c) => !usedIds.has(c.id));
      const shuffledRem = shuffleWithSeed(remaining, `${seed}-rem`);
      for (const item of shuffledRem) {
        if (selected.length >= 5) break;
        selected.push(item);
        usedIds.add(item.id);
      }
    }

    const finalShuffled = shuffleWithSeed(selected.slice(0, 5), `${seed}-order`);
    return { seed, targets: finalShuffled, scale };
  }

  // Multi-pack or custom mode pool building
  let pool: BlindPointTarget[] = [];
  const seenIds = new Set<string>();

  for (const p of packsArray) {
    const packTargets = getTargetsByPack(p);
    for (const t of packTargets) {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        pool.push(t);
      }
    }
  }

  // Filter by continent if continent filter is specified (e.g. EU, AS, NA, etc.)
  if (continentFilter && continentFilter !== "") {
    const continentMatching = pool.filter((t) => t.continent === continentFilter);
    if (continentMatching.length >= totalRounds) {
      pool = continentMatching;
    }
  }

  // Filter by difficulty if difficulty is not "all"
  if (difficulty && difficulty !== "all") {
    const diffMatching = pool.filter((t) => t.difficulty === difficulty);
    if (diffMatching.length >= totalRounds) {
      pool = diffMatching;
    }
  }

  // Deterministic shuffle using seed
  const shuffled = shuffleWithSeed(pool, seed);
  const selected = shuffled.slice(0, Math.min(totalRounds, shuffled.length));

  return { seed, targets: selected, scale };
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
    funFact: target.funFact,
    arrondissement: target.arrondissement,
    bank: target.bank,
    category: target.category,
    yearBuilt: target.yearBuilt,
  };
}

export function getTargetById(
  id: string,
  pack?: BlindPointPack | BlindPointPack[],
  difficulty?: BlindPointDifficulty
): BlindPointTarget | null {
  if (!pack) {
    const all = [...citiesFrance, ...citiesWorld, ...lieuxFrance, ...lieuxMonde, ...lieuxParis];
    return all.find((t) => t.id === id) || null;
  }
  const packs = Array.isArray(pack) ? pack : [pack];
  for (const p of packs) {
    const pool = getTargetsByPack(p, difficulty);
    const found = pool.find((t) => t.id === id);
    if (found) return found;
  }
  return null;
}
