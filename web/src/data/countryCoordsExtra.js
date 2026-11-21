// Fixes for country names in world-countries.json that country_coords.json does not match.
// (country_coords.json is third-party data, so these live in a separate overlay.)

// Quiz name -> the name country_coords.json already uses for the same country.
export const ALIASES = {
  "The Bahamas": "Bahamas",
  "Republic of the Congo": "Republic of Congo",
  "Republic of Serbia": "Serbia",
  "United Republic of Tanzania": "Tanzania",
};

// Countries with no entry at all. Approximate centers, used only to fly the map there
// after a wrong answer.
export const EXTRA = {
  Kosovo: { latitude: 42.6026, longitude: 20.903 },
  "South Sudan": { latitude: 6.877, longitude: 31.307 },
  Somaliland: { latitude: 9.56, longitude: 44.065 },
  Vanuatu: { latitude: -15.3767, longitude: 166.9592 },
  "Northern Cyprus": { latitude: 35.25, longitude: 33.5 },
  "West Bank": { latitude: 31.9522, longitude: 35.2332 },
};
