import { BlindPointPack, BlindPointDifficulty, BlindPointTarget, BlindPointClientTarget, BlindPointMode } from "./types";
import monumentsData from "./data/monuments.json";
import castlesData from "./data/castles.json";
import citiesFranceData from "./data/cities_france.json";
import citiesWorldData from "./data/cities_world.json";
import lieuxFranceData from "./data/lieux_france.json";
import lieuxMondeData from "./data/lieux_monde.json";
import lieuxParisData from "./data/lieux_paris.json";
import metroParisData from "./data/metro_paris.json";

const monuments = monumentsData as BlindPointTarget[];
const castles = castlesData as BlindPointTarget[];
const citiesFrance = citiesFranceData as BlindPointTarget[];
const citiesWorld = citiesWorldData as BlindPointTarget[];
const lieuxFrance = lieuxFranceData as BlindPointTarget[];
const lieuxMonde = lieuxMondeData as BlindPointTarget[];
const lieuxParis = lieuxParisData as BlindPointTarget[];
const metroParis = metroParisData as BlindPointTarget[];

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
    case "villes_europe":
      pool = citiesWorld.filter((c) => c.continent === "EU");
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
    case "metro_paris":
      pool = metroParis;
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
 * Deterministic Day Counter since Reference Epoch (2026-01-01 UTC)
 */
export const DAILY_EPOCH_MS = new Date("2026-01-01T00:00:00Z").getTime();

export function getDayIndex(dateStr: string): number {
  const dt = new Date(`${dateStr}T00:00:00Z`).getTime();
  return Math.floor((dt - DAILY_EPOCH_MS) / 86400000);
}

/**
 * Builds a deterministic cycle permutation for a pool.
 * Prevents adjacent collisions across cycle boundaries (last day of cycle C cannot overlap with day 0 of cycle C+1).
 */
export function getCyclePermutation<T extends { id: string }>(
  pool: T[],
  masterSeed: string,
  cycleNumber: number,
  countPerDay: number
): T[] {
  if (pool.length === 0) return [];
  const daysPerCycle = Math.max(1, Math.floor(pool.length / countPerDay));
  const currentShuffled = shuffleWithSeed(pool, `${masterSeed}-cycle-${cycleNumber}`);

  if (cycleNumber > 0 && daysPerCycle > 1) {
    // Determine the last day items of cycleNumber - 1
    const prevShuffled = shuffleWithSeed(pool, `${masterSeed}-cycle-${cycleNumber - 1}`);
    const prevLastDayIds = new Set(
      prevShuffled
        .slice((daysPerCycle - 1) * countPerDay, daysPerCycle * countPerDay)
        .map((x) => x.id)
    );

    // Swap any item in the first day (indices 0..countPerDay-1) that was in prevLastDayIds
    for (let i = 0; i < countPerDay; i++) {
      if (prevLastDayIds.has(currentShuffled[i].id)) {
        for (let j = countPerDay; j < currentShuffled.length; j++) {
          if (!prevLastDayIds.has(currentShuffled[j].id)) {
            const temp = currentShuffled[i];
            currentShuffled[i] = currentShuffled[j];
            currentShuffled[j] = temp;
            break;
          }
        }
      }
    }
  }

  return currentShuffled;
}

/**
 * Returns the non-repeating slice of items for a specific day index.
 * Guarantee: Within any cycle, every item appears exactly once. Across cycle boundaries,
 * no item is repeated on consecutive days.
 */
export function getCycleSlice<T extends { id: string }>(
  pool: T[],
  masterSeed: string,
  dayIndex: number,
  countPerDay: number
): T[] {
  if (pool.length === 0) return [];
  const daysPerCycle = Math.max(1, Math.floor(pool.length / countPerDay));
  const cycleNumber = Math.floor(dayIndex / daysPerCycle);
  const dayInCycle = ((dayIndex % daysPerCycle) + daysPerCycle) % daysPerCycle;

  const cyclePerm = getCyclePermutation(pool, masterSeed, cycleNumber, countPerDay);
  const start = dayInCycle * countPerDay;
  return cyclePerm.slice(start, start + countPerDay);
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
    (p) => p === "villes_monde" || p === "lieux_monde" || p === "monuments_monde" || p === "villes_europe"
  );
  const onlyParis = packsArray.length === 1 && (packsArray[0] === "lieux_paris" || packsArray[0] === "metro_paris");

  if (hasWorldPack) {
    scale = "world";
  } else if (onlyParis) {
    scale = "paris";
  } else {
    scale = "fr";
  }

  let seed = customSeed;
  let dailyDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  if (mode === "daily") {
    if (customSeed) {
      const match = customSeed.match(/blindpoint-(\d{4}-\d{2}-\d{2})/);
      if (match) {
        dailyDateStr = match[1];
      }
    }
    if (!seed) {
      seed = `blindpoint-${dailyDateStr}-${packsArray.join("_")}`;
    }
  } else if (!seed) {
    if (mode === "custom") {
      seed = `custom-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    } else {
      seed = `free-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    }
  }

  // Daily Mode: Balanced Gradual Progression with Guaranteed Non-Repeating Cycles
  // M1/M2 Facile, M3/M4 Moyen, M5 Difficile
  if (mode === "daily" && packsArray.length === 1 && totalRounds === 5 && !continentFilter) {
    const p = packsArray[0];
    const dayIndex = getDayIndex(dailyDateStr);

    if (p === "villes_france" || p === "villes_europe" || p === "lieux_paris" || p === "metro_paris") {
      const allPool = getTargetsByPack(p);
      const faciles = allPool.filter((c) => c.difficulty === "facile");
      const moyens = allPool.filter((c) => c.difficulty === "moyen");
      const difficiles = allPool.filter((c) => c.difficulty === "difficile");

      const shF = getCycleSlice(faciles, `daily-${p}-facile`, dayIndex, 2);
      const shM = getCycleSlice(moyens, `daily-${p}-moyen`, dayIndex, 2);
      const shD = getCycleSlice(difficiles, `daily-${p}-difficile`, dayIndex, 1);

      const targets: BlindPointTarget[] = [shF[0], shF[1], shM[0], shM[1], shD[0]];
      return { seed, targets, scale };
    }
    if (p === "villes_monde") {
      const pool = getTargetsByPack("villes_monde");
      const continents = ["EU", "NA", "AS", "SA", "AF"];
      const selected: BlindPointTarget[] = [];

      for (const cont of continents) {
        const matching = pool.filter((c) => c.continent === cont);
        if (matching.length > 0) {
          const picked = getCycleSlice(matching, `daily-villes_monde-${cont}`, dayIndex, 1);
          if (picked.length > 0) {
            selected.push(picked[0]);
          }
        }
      }
      return { seed, targets: selected, scale };
    }
    if (p === "lieux_monde" || p === "lieux_france" || p === "chateaux_france" || p === "monuments_monde") {
      const pool = getTargetsByPack(p);
      const targets = getCycleSlice(pool, `daily-${p}`, dayIndex, 5);
      return { seed, targets, scale };
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
  // Local static assets (e.g. /images/paris/...) should be served directly without proxy
  if (url.startsWith("/")) return url;
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
