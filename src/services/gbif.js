// GBIF service helpers
// Docs: https://www.gbif.org/developer/occurrence

const GBIF_BASE = '/gbif';

// Simple in-memory cache
const cache = new Map();
const TTL = 30 * 60 * 1000; // 30 minutes

function toKey(obj) { return JSON.stringify(obj); }
function setCache(k, v, ttl = TTL) { cache.set(k, { v, e: Date.now() + ttl }); }
function getCache(k) {
  const it = cache.get(k);
  if (!it) return null;
  if (Date.now() > it.e) { cache.delete(k); return null; }
  return it.v;
}

export function getLastNYearsRange(n = 5) {
  const now = new Date();
  const end = now.getUTCFullYear();
  const start = end - (n - 1);
  return `${start},${end}`;
}
// Generic POST to GBIF with timeout
async function postGbif(path, payload, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${GBIF_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw new Error('Failed to fetch');
  }
}


export function wktFromBBox(lonMin, latMin, lonMax, latMax) {
  const ring = [
    `${lonMin} ${latMin}`,
    `${lonMax} ${latMin}`,
    `${lonMax} ${latMax}`,
    `${lonMin} ${latMax}`,
    `${lonMin} ${latMin}`,
  ].join(', ');
  return `POLYGON((${ring}))`;
}

// Build a geodesic circle polygon (WKT) around lon/lat with radiusKm
export function wktCircle(lonDeg, latDeg, radiusKm = 100, segments = 64) {
  const R = 6371.0088; // Earth radius in km
  const lat1 = (latDeg * Math.PI) / 180;
  const lon1 = (lonDeg * Math.PI) / 180;
  const d = radiusKm / R; // angular distance
  const coords = [];
  for (let i = 0; i <= segments; i++) {
    const brng = (i / segments) * 2 * Math.PI; // 0..2pi
    const sinLat1 = Math.sin(lat1), cosLat1 = Math.cos(lat1);
    const sinD = Math.sin(d), cosD = Math.cos(d);
    const sinLat2 = sinLat1 * cosD + cosLat1 * sinD * Math.cos(brng);
    const lat2 = Math.asin(sinLat2);
    const y = Math.sin(brng) * sinD * cosLat1;
    const x = cosD - sinLat1 * sinLat2;
    const lon2 = lon1 + Math.atan2(y, x);
    const outLat = (lat2 * 180) / Math.PI;
    let outLon = (lon2 * 180) / Math.PI;
    // normalize lon to -180..180
    if (outLon > 180) outLon -= 360;
    if (outLon < -180) outLon += 360;
    coords.push(`${outLon} ${outLat}`);
  }
  // Ensure ring closure (first == last)
  if (coords[0] !== coords[coords.length - 1]) coords.push(coords[0]);
  return `POLYGON((${coords.join(', ')}))`;
}

export function getMonthWindow(centerMonth /*1-12*/, delta = 2) {
  const res = [];
  for (let d = -delta; d <= delta; d++) {
    let m = centerMonth + d;
    if (m < 1) m += 12;
    if (m > 12) m -= 12;
    res.push(m);
  }
  return Array.from(new Set(res));
}

function appendArrayParam(params, key, values) {
  if (Array.isArray(values)) {
    values.forEach(v => params.append(key, String(v)));
  } else if (values != null) {
    params.append(key, String(values));
  }
}

function buildOccurrenceParams({
  geometryWkt,
  yearRange,
  months,
  limit = 0,
  taxonKey = 6, // Plantae
  basisOfRecord = ['HUMAN_OBSERVATION', 'PRESERVED_SPECIMEN'],
  hasCoordinate = true,
  hasGeospatialIssue = false,
}) {
  const p = new URLSearchParams();
  if (geometryWkt) p.set('geometry', geometryWkt);
  if (yearRange) p.set('year', yearRange);
  if (taxonKey) p.set('taxonKey', String(taxonKey));
  p.set('hasCoordinate', String(hasCoordinate));
  p.set('hasGeospatialIssue', String(hasGeospatialIssue));
  // basisOfRecord is repeatable
  appendArrayParam(p, 'basisOfRecord', basisOfRecord);
  // month is repeatable and numeric 1..12
  if (Array.isArray(months) && months.length) {
    months.forEach(m => p.append('month', String(m)));
  }
  p.set('limit', String(limit));
  return p;
}

// Get species facet: returns top species buckets [{speciesKey, count}]
export async function getSpeciesFacet({ geometryWkt, yearRange, months, facetLimit = 10 }) {
  const key = toKey(['speciesFacet', geometryWkt, yearRange, months, facetLimit]);
  const cached = getCache(key); if (cached) return cached;
  const payload = {
    geometry: geometryWkt,
    year: yearRange,
    hasCoordinate: true,
    hasGeospatialIssue: false,
    basisOfRecord: ['HUMAN_OBSERVATION', 'PRESERVED_SPECIMEN'],
    kingdomKey: 6, // Plantae
    limit: 0,
    facet: ['speciesKey'],
    facetLimit,
  };
  if (Array.isArray(months) && months.length) payload.month = months;
  const res = await postGbif('/occurrence/search', payload);
  if (!res.ok) throw new Error(`GBIF species facet failed: ${res.status}`);
  const json = await res.json();
  const buckets = json.facets?.find(f => f.field === 'SPECIES_KEY')?.counts || json.facets?.[0]?.counts || [];
  const out = buckets.map(b => ({ speciesKey: Number(b.name), count: b.count }));
  setCache(key, out);
  return out;
}

// Get month facet for seasonality over the same filters
export async function getMonthFacet({ geometryWkt, yearRange }) {
  const key = toKey(['monthFacet', geometryWkt, yearRange]);
  const cached = getCache(key); if (cached) return cached;
  const payload = {
    geometry: geometryWkt,
    year: yearRange,
    hasCoordinate: true,
    hasGeospatialIssue: false,
    basisOfRecord: ['HUMAN_OBSERVATION', 'PRESERVED_SPECIMEN'],
    kingdomKey: 6,
    limit: 0,
    facet: ['month'],
    facetLimit: 12,
  };
  const res = await postGbif('/occurrence/search', payload);
  if (!res.ok) throw new Error(`GBIF month facet failed: ${res.status}`);
  const json = await res.json();
  const buckets = json.facets?.find(f => f.field === 'MONTH')?.counts || json.facets?.[0]?.counts || [];
  const out = buckets.map(b => ({ month: Number(b.name), count: b.count }));
  setCache(key, out);
  return out;
}

// Map speciesKey -> canonical name via sampling 1 occurrence (faster than separate species API for many keys)
export async function getSpeciesNamesViaSample({ geometryWkt, speciesKeys, yearRange }) {
  const results = new Map();
  const promises = speciesKeys.map(async (sk) => {
    const ck = toKey(['nameSample', geometryWkt, sk, yearRange]);
    const c = getCache(ck); if (c) { results.set(sk, c); return; }
    const payload = {
      geometry: geometryWkt,
      year: yearRange,
      hasCoordinate: true,
      hasGeospatialIssue: false,
      basisOfRecord: ['HUMAN_OBSERVATION', 'PRESERVED_SPECIMEN'],
      kingdomKey: 6,
      limit: 1,
      speciesKey: sk,
    };
    const res = await postGbif('/occurrence/search', payload);
    if (!res.ok) return;
    const json = await res.json();
    const rec = json.results?.[0];
    const name = rec?.species || rec?.scientificName || `species ${sk}`;
    setCache(ck, name);
    results.set(sk, name);
  });
  await Promise.all(promises);
  return results; // Map
}

// For a few top species, get 1 image URL if available
export async function getSpeciesImageFor({ geometryWkt, speciesKey, yearRange }) {
  const ck = toKey(['img', geometryWkt, speciesKey, yearRange]);
  const c = getCache(ck); if (c) return c;
  const payload = {
    geometry: geometryWkt,
    year: yearRange,
    hasCoordinate: true,
    hasGeospatialIssue: false,
    basisOfRecord: ['HUMAN_OBSERVATION', 'PRESERVED_SPECIMEN'],
    kingdomKey: 6,
    limit: 1,
    speciesKey,
    mediaType: 'StillImage',
  };
  const res = await postGbif('/occurrence/search', payload);
  if (!res.ok) { setCache(ck, null); return null; }
  const json = await res.json();
  const rec = json.results?.[0];
  const media = rec?.media?.find(m => m.identifier);
  const img = media?.identifier || null;
  setCache(ck, img);
  return img;
}

// Compute featured species with names and optional images
export async function getFeaturedSpecies({ geometryWkt, max = 10, fallbackCenter }) {
  const yearRange = getLastNYearsRange(10);
  let monthFacet = await getMonthFacet({ geometryWkt, yearRange });
  let speciesFacet = await getSpeciesFacet({ geometryWkt, yearRange, months: undefined, facetLimit: max });

  // Fallback 1: expand radius to 200km if center provided
  if ((!speciesFacet || speciesFacet.length === 0) && fallbackCenter) {
    try {
      const bigCircle = wktCircle(fallbackCenter.lon, fallbackCenter.lat, 200);
      monthFacet = await getMonthFacet({ geometryWkt: bigCircle, yearRange });
      speciesFacet = await getSpeciesFacet({ geometryWkt: bigCircle, yearRange, months: undefined, facetLimit: max });
    } catch {}
  }

  // Fallback 2: relax year filter (all years)
  if ((!speciesFacet || speciesFacet.length === 0)) {
    try {
      monthFacet = await getMonthFacet({ geometryWkt, yearRange: undefined });
      speciesFacet = await getSpeciesFacet({ geometryWkt, yearRange: undefined, months: undefined, facetLimit: max });
    } catch {}
  }

  // Fallback 3: remove kingdom filter by calling GET without filters (broadest)
  if ((!speciesFacet || speciesFacet.length === 0)) {
    try {
      const params = buildOccurrenceParams({ geometryWkt, yearRange: undefined, limit: 0 });
      params.set('facet', 'speciesKey');
      params.set('facetLimit', String(max));
      const url = `${GBIF_BASE}/occurrence/search?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const buckets = json.facets?.find(f => f.field === 'SPECIES_KEY')?.counts || json.facets?.[0]?.counts || [];
        speciesFacet = buckets.map(b => ({ speciesKey: Number(b.name), count: b.count }));
      }
    } catch {}
  }
  const keys = speciesFacet.map(b => b.speciesKey);
  const nameMap = await getSpeciesNamesViaSample({ geometryWkt, speciesKeys: keys, yearRange });
  // Optionally fetch images, but do not block panel if slow (best-effort)
  const out = await Promise.all(speciesFacet.map(async (b) => {
    const peak = monthFacet.reduce((a, m) => m.count > a.count ? m : a, { month: null, count: -1 });
    let img = null; try { img = await getSpeciesImageFor({ geometryWkt, speciesKey: b.speciesKey, yearRange }); } catch {}
    return {
      speciesKey: b.speciesKey,
      name: nameMap.get(b.speciesKey) || `species ${b.speciesKey}`,
      observations: b.count,
      peakMonth: peak?.month || null,
      imageUrl: img,
    };
  }));
  return { featured: out, metrics: computeMetrics({ monthFacet, speciesFacet }) };
}

function computeMetrics({ monthFacet, speciesFacet }) {
  const speciesRichness = speciesFacet.length; // top bucket count only; true richness would need facetLimit=10000
  const observationsThisYear = 0; // can be added by a dedicated year=current facet or count
  const peak = monthFacet.reduce((a, m) => m.count > a.count ? m : a, { month: null, count: -1 });
  return { speciesRichness, observationsThisYear, peakMonth: peak?.month || null };
}
