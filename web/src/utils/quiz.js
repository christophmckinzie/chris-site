// Pure quiz helpers (no Mapbox, no Solid) so they can be unit tested.

import countryCoords from "../data/country_coords.json";
import { ALIASES, EXTRA } from "../data/countryCoordsExtra.js";

// Percent of answers that were correct, rounded. 0 when nothing has been asked yet.
export function scorePercent(correct, asked) {
  if (correct === 0 || asked === 0) return 0;
  return Math.round((correct / asked) * 100);
}

// Same shuffle the quiz has always used (not a uniform shuffle, but kept as-is).
export function shuffleNames(names) {
  return [...names].sort(() => Math.random() - 0.5);
}

const coordsByName = new Map(countryCoords.ref_country_codes.map((c) => [c.country, c]));

// [longitude, latitude] to fly to for a country name from the quiz, or null if unknown.
export function flyToCoords(name) {
  const entry = coordsByName.get(ALIASES[name] ?? name) ?? EXTRA[name];
  return entry ? [entry.longitude, entry.latitude] : null;
}
