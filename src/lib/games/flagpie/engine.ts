import {
  FlagPieCountry,
  FlagPiePack,
  FlagPieMode,
  FlagColorSlice,
  FlagPieRoundState,
} from "./types";
import flagsData from "./data/flags.json";

export const ALL_FLAGS: FlagPieCountry[] = flagsData as FlagPieCountry[];

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
 * Filters the country pool based on the requested pack
 */
export function getPackCountries(pack: FlagPiePack): FlagPieCountry[] {
  if (pack === "europe") {
    return ALL_FLAGS.filter((c) => c.continent === "Europe");
  }
  if (pack === "afrique") {
    return ALL_FLAGS.filter((c) => c.continent === "Africa");
  }
  if (pack === "ameriques") {
    return ALL_FLAGS.filter((c) => c.continent === "Americas");
  }
  if (pack === "asie") {
    return ALL_FLAGS.filter((c) => c.continent === "Asia" || c.continent === "Oceania");
  }
  return ALL_FLAGS;
}

/**
 * Searches countries with multi-tier ranking (Prefix, Contains, Aliases)
 */
export function searchCountries(
  query: string,
  pool: FlagPieCountry[] = ALL_FLAGS,
  limit = 6
): FlagPieCountry[] {
  const q = normalizeSearchText(query);
  if (!q) return [];

  const tier0: FlagPieCountry[] = []; // Exact match
  const tier1: FlagPieCountry[] = []; // Prefix match on main name
  const tier2: FlagPieCountry[] = []; // Word prefix match on main name
  const tier3: FlagPieCountry[] = []; // Contains on main name
  const tier4: FlagPieCountry[] = []; // Alias match

  for (const country of pool) {
    const normName = normalizeSearchText(country.name);
    if (normName === q) {
      tier0.push(country);
      continue;
    }
    if (normName.startsWith(q)) {
      tier1.push(country);
      continue;
    }
    const words = normName.split(/[\s-]+/);
    if (words.some((w) => w.startsWith(q))) {
      tier2.push(country);
      continue;
    }
    if (normName.includes(q)) {
      tier3.push(country);
      continue;
    }
    const matchesAlias = country.aliases.some((alias) =>
      normalizeSearchText(alias).includes(q)
    );
    if (matchesAlias) {
      tier4.push(country);
    }
  }

  return [...tier0, ...tier1, ...tier2, ...tier3, ...tier4].slice(0, limit);
}

/**
 * Validates whether player's input corresponds to the target country
 */
export function validateGuess(
  targetCountry: FlagPieCountry,
  guessInput: string
): boolean {
  const q = normalizeSearchText(guessInput);
  if (!q) return false;

  const normTarget = normalizeSearchText(targetCountry.name);
  if (normTarget === q) return true;

  if (targetCountry.id.toLowerCase() === q) return true;

  return targetCountry.aliases.some((alias) => normalizeSearchText(alias) === q);
}

/**
 * Generates a challenge session of 5 distinct country rounds
 */
export function generateChallenge(options: {
  pack: FlagPiePack;
  mode: FlagPieMode;
  seed?: string;
  count?: number;
}): {
  sessionId: string;
  pack: FlagPiePack;
  mode: FlagPieMode;
  dateStr: string;
  countries: FlagPieCountry[];
} {
  const { pack, mode, seed, count = 5 } = options;
  const pool = getPackCountries(pack);

  const today = new Date().toISOString().split("T")[0];
  const effectiveSeed =
    mode === "daily"
      ? seed || `flagpie-daily-${today}-${pack}`
      : seed || `flagpie-free-${Math.random().toString(36).substring(2, 9)}`;

  const rng = createRng(hashSeed(effectiveSeed));

  // Shuffle copy of pool
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return {
    sessionId: effectiveSeed,
    pack,
    mode,
    dateStr: today,
    countries: selected,
  };
}

/**
 * Calculates points according to attempt number
 * Attempt 1: 5000 pts
 * Attempt 2: 3000 pts
 * Attempt 3: 1000 pts
 * Failed / Skipped: 0 pt
 */
export function calculateRoundScore(attemptNumber: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  if (attemptNumber === 1) return 5000;
  if (attemptNumber === 2) return 3000;
  if (attemptNumber === 3) return 1000;
  return 0;
}

/**
 * Generates Wordle-style viral emoji share text
 */
export function generateShareText(
  roundScores: number[],
  totalScore: number,
  mode: FlagPieMode,
  dateStr?: string
): string {
  const dateHeader = mode === "daily" && dateStr ? ` (${dateStr})` : "";
  const lines: string[] = [
    `GeoHub — FlagPie${dateHeader} 🥧`,
    `Score : ${totalScore.toLocaleString("fr-FR")} / 25 000 pts`,
    "",
  ];

  roundScores.forEach((score, idx) => {
    let emoji = "🔴 0 pt (Échec)";
    if (score === 5000) emoji = "🟢 5 000 pts (1er coup !)";
    else if (score === 3000) emoji = "🟡 3 000 pts (2e coup)";
    else if (score === 1000) emoji = "🟠 1 000 pts (3e coup)";
    lines.push(`Manche ${idx + 1} : ${emoji}`);
  });

  lines.push("");
  lines.push("https://geohub.world/play/flagpie");

  return lines.join("\n");
}
