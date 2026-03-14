/**
 * Country name/alias -> centroid coordinates for globe centering.
 * Coordinates are approximate country centroids (lat, lng).
 */

export interface CountryCoords {
  lat: number;
  lng: number;
  canonicalName: string;
}

const COUNTRY_ENTRIES: { names: string[]; lat: number; lng: number }[] = [
  { names: ['india'], lat: 20.5937, lng: 78.9629 },
  { names: ['united states', 'usa', 'u.s.a.', 'us', 'america', 'united states of america'], lat: 37.0902, lng: -95.7129 },
  { names: ['china'], lat: 35.8617, lng: 104.1954 },
  { names: ['united kingdom', 'uk', 'u.k.', 'britain', 'great britain', 'england'], lat: 55.3781, lng: -3.436 },
  { names: ['france'], lat: 46.2276, lng: 2.2137 },
  { names: ['germany'], lat: 51.1657, lng: 10.4515 },
  { names: ['japan'], lat: 36.2048, lng: 138.2529 },
  { names: ['brazil'], lat: -14.235, lng: -51.9253 },
  { names: ['russia'], lat: 61.524, lng: 105.3188 },
  { names: ['canada'], lat: 56.1304, lng: -106.3468 },
  { names: ['australia'], lat: -25.2744, lng: 133.7751 },
  { names: ['mexico'], lat: 23.6345, lng: -102.5528 },
  { names: ['italy'], lat: 41.8719, lng: 12.5674 },
  { names: ['spain'], lat: 40.4637, lng: -3.7492 },
  { names: ['south korea', 'korea'], lat: 35.9078, lng: 127.7669 },
  { names: ['north korea'], lat: 40.3399, lng: 127.5101 },
  { names: ['indonesia'], lat: -0.7893, lng: 113.9213 },
  { names: ['turkey', 'türkiye'], lat: 38.9637, lng: 35.2433 },
  { names: ['saudi arabia'], lat: 23.8859, lng: 45.0792 },
  { names: ['iran'], lat: 32.4279, lng: 53.688 },
  { names: ['israel'], lat: 31.0461, lng: 34.8516 },
  { names: ['egypt'], lat: 26.8206, lng: 30.8025 },
  { names: ['south africa'], lat: -30.5595, lng: 22.9375 },
  { names: ['nigeria'], lat: 9.082, lng: 8.6753 },
  { names: ['pakistan'], lat: 30.3753, lng: 69.3451 },
  { names: ['bangladesh'], lat: 23.685, lng: 90.3563 },
  { names: ['vietnam'], lat: 14.0583, lng: 108.2772 },
  { names: ['thailand'], lat: 15.87, lng: 100.9925 },
  { names: ['philippines'], lat: 12.8797, lng: 121.774 },
  { names: ['malaysia'], lat: 4.2105, lng: 101.9758 },
  { names: ['singapore'], lat: 1.3521, lng: 103.8198 },
  { names: ['poland'], lat: 51.9194, lng: 19.1451 },
  { names: ['ukraine'], lat: 48.3794, lng: 31.1656 },
  { names: ['netherlands'], lat: 52.1326, lng: 5.2913 },
  { names: ['belgium'], lat: 50.5039, lng: 4.4699 },
  { names: ['switzerland'], lat: 46.8182, lng: 8.2275 },
  { names: ['austria'], lat: 47.5162, lng: 14.5501 },
  { names: ['sweden'], lat: 60.1282, lng: 18.6435 },
  { names: ['norway'], lat: 60.472, lng: 8.4689 },
  { names: ['argentina'], lat: -38.4161, lng: -63.6167 },
  { names: ['chile'], lat: -35.6751, lng: -71.543 },
  { names: ['colombia'], lat: 4.5709, lng: -74.2973 },
  { names: ['peru'], lat: -9.19, lng: -75.0152 },
  { names: ['uae', 'united arab emirates'], lat: 23.4241, lng: 53.8478 },
  { names: ['qatar'], lat: 25.3548, lng: 51.1839 },
  { names: ['iraq'], lat: 33.2232, lng: 43.6793 },
  { names: ['syria'], lat: 34.8021, lng: 38.9968 },
  { names: ['greece'], lat: 39.0742, lng: 21.8243 },
  { names: ['portugal'], lat: 39.3999, lng: -8.2245 },
  { names: ['ireland'], lat: 53.1424, lng: -7.6921 },
  { names: ['new zealand'], lat: -40.9006, lng: 174.886 },
  { names: ['kenya'], lat: -0.0236, lng: 37.9062 },
  { names: ['morocco'], lat: 31.7917, lng: -7.0926 },
  { names: ['algeria'], lat: 28.0339, lng: 1.6596 },
  { names: ['taiwan'], lat: 23.6978, lng: 120.9605 },
  { names: ['hong kong'], lat: 22.3193, lng: 114.1694 },
];

const normalizedMap = new Map<string, CountryCoords>();

COUNTRY_ENTRIES.forEach((entry) => {
  const canonicalName = entry.names[0];
  const coords: CountryCoords = { lat: entry.lat, lng: entry.lng, canonicalName };
  entry.names.forEach((name) => {
    normalizedMap.set(name.toLowerCase().trim(), coords);
  });
});

/**
 * Resolve a country name (or alias) to coordinates and canonical name.
 * Returns null if the country is not in the lookup.
 */
export const getCountryCoordinates = (countryName: string): CountryCoords | null => {
  if (!countryName || typeof countryName !== 'string') return null;
  const normalized = countryName.toLowerCase().trim().replace(/\s+/g, ' ');
  const direct = normalizedMap.get(normalized);
  if (direct) return direct;
  for (const [key, value] of normalizedMap) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  return null;
};

/** Internal tag used by Command Assistant for globe navigation. Strip before showing user. */
export const GOTO_TAG_REGEX = /##GOTO:([^#\n]+)/g;

/**
 * Strip ##GOTO:CountryName tags from assistant response (internal use only).
 * Returns cleaned text.
 */
export const stripGotoTag = (text: string): string => {
  return text.replace(GOTO_TAG_REGEX, '').replace(/\s{2,}/g, ' ').trim();
};

/**
 * Extract country name from a ##GOTO:CountryName tag in the response.
 * Returns the first match or null.
 */
export const extractGotoCountry = (text: string): string | null => {
  const match = text.match(/##GOTO:([^#\n]+)/);
  return match ? match[1].trim() : null;
};

const GOTO_PHRASES = [
  'take me to',
  'go to',
  'show me',
  'center on',
  'fly to',
  'navigate to',
  'focus on',
  'zoom to',
  'take us to',
  'bring me to',
];

/**
 * Detect "take me to X" style intent and resolve X to a known country.
 * Returns the canonical country name for use in ##GOTO:CanonicalName, or null.
 */
export const getCountryFromPhrase = (userInput: string): string | null => {
  const lower = userInput.toLowerCase().trim();
  for (const phrase of GOTO_PHRASES) {
    if (lower.includes(phrase)) {
      const after = lower.slice(lower.indexOf(phrase) + phrase.length).trim();
      const firstWord = after.split(/[\s,!.?]+/)[0];
      const rest = after.split(/[\s,!.?]+/).slice(0, 4).join(' ');
      const coords = getCountryCoordinates(rest) ?? getCountryCoordinates(firstWord);
      if (coords) return coords.canonicalName;
    }
  }
  const coords = getCountryCoordinates(lower);
  return coords ? coords.canonicalName : null;
};
