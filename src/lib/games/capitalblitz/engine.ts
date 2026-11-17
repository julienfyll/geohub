import { CapitalItem, CapitalBlitzContinent } from "./types";
import rawCapitals from "./data/capitals.json";

export const ALL_CAPITALS: CapitalItem[] = rawCapitals as CapitalItem[];

// Unique list of all capital names for fast search & autocomplete
export const ALL_UNIQUE_CAPITAL_NAMES: string[] = Array.from(
  new Set(ALL_CAPITALS.map((c) => c.capital))
).sort((a, b) => a.localeCompare(b, "fr"));

/**
 * Normalizes text for comparison (lowercase, accent stripped, punctuation removed)
 */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Validates a user guess against a capital item
 */
export function checkCapital(guess: string, item: CapitalItem): boolean {
  const normGuess = normalizeText(guess);
  if (!normGuess) return false;

  if (normalizeText(item.capital) === normGuess) return true;
  return item.aliases.some((alias) => normalizeText(alias) === normGuess);
}

/**
 * High-speed autocomplete suggestions for capitals
 */
export function searchCapitals(query: string, limit = 5): string[] {
  const norm = normalizeText(query);
  if (!norm) return [];

  const exactStarts = new Set<string>();
  const contains = new Set<string>();

  for (const item of ALL_CAPITALS) {
    const normCapital = normalizeText(item.capital);
    const starts =
      normCapital.startsWith(norm) ||
      item.aliases.some((a) => normalizeText(a).startsWith(norm));

    if (starts) {
      exactStarts.add(item.capital);
    } else {
      const inside =
        normCapital.includes(norm) ||
        item.aliases.some((a) => normalizeText(a).includes(norm));
      if (inside) {
        contains.add(item.capital);
      }
    }
  }

  const sortedStarts = Array.from(exactStarts).sort((a, b) => a.localeCompare(b, "fr"));
  const sortedContains = Array.from(contains).sort((a, b) => a.localeCompare(b, "fr"));

  return [...sortedStarts, ...sortedContains].slice(0, limit);
}

/**
 * Hashes a seed string into a 32-bit positive integer
 */
export function hashSeed(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Simple linear congruential PRNG
 */
export function createRng(seedInt: number) {
  let s = seedInt % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates shuffled questions according to a seed and continent filter
 */
export function getShuffledQuestions(
  seed: string,
  continent: CapitalBlitzContinent = "all"
): CapitalItem[] {
  const filtered =
    continent === "all"
      ? [...ALL_CAPITALS]
      : ALL_CAPITALS.filter(
          (c) => c.continent.toLowerCase() === continent.toLowerCase()
        );

  const rng = createRng(hashSeed(seed));
  const array = [...filtered];

  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

/**
 * Progressive combo multiplier based on streak
 */
export function getComboMultiplier(streak: number): number {
  if (streak <= 0) return 1.0;
  if (streak === 1) return 1.2;
  if (streak === 2) return 1.5;
  if (streak === 3) return 2.0;
  if (streak === 4) return 2.5;
  return 3.0;
}

/**
 * Generates Wordle-style emoji summary for social sharing
 */
export function generateShareText(
  score: number,
  correctCount: number,
  durationSeconds: number,
  maxCombo: number
): string {
  return [
    `⚡ GeoHub Capital Blitz ⚡`,
    `Score : ${score.toLocaleString("fr-FR")} pts`,
    `🏛️ ${correctCount} capitales trouvées en ${durationSeconds}s`,
    `🔥 Combo Max : x${maxCombo.toFixed(1)}`,
    `https://geohub.fr/play/capitalblitz`,
  ].join("\n");
}
