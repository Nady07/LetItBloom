// NASA POWER API service
// Docs: https://power.larc.nasa.gov/
// Provides daily point queries and simple in-memory caching

// Use dev proxy (/power -> https://power.larc.nasa.gov) to avoid CORS in local dev
const BASE_URL = '/power/api/temporal/daily/point';
const CLIM_BASE_URL = '/power/api/temporal/climatology/point';
const COMMUNITY = 'AG'; // Agriculture community presets

// Basic in-memory cache with TTL
const cache = new Map();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

function cacheKey(params) {
  return JSON.stringify(params);
}

function setCache(key, value, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

// Helper: format date to YYYYMMDD
export function fmtDateYYYYMMDD(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

// Build query string for POWER daily point
function buildQuery({ latitude, longitude, start, end, parameters }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start,
    end,
    parameters: (parameters && parameters.length ? parameters : ['T2M']).join(','),
    community: COMMUNITY,
    format: 'JSON',
  });
  return `${BASE_URL}?${params.toString()}`;
}

// Normalize POWER daily response into array of { date: 'YYYY-MM-DD', ...vars }
// Build climatology query string
function buildClimatologyQuery({ latitude, longitude, parameters, start, end }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    parameters: parameters.join(','),
    start: start || '2001',
    end: end || '2020',
    community: COMMUNITY,
    format: 'JSON',
  });
  return `${CLIM_BASE_URL}?${params.toString()}`;
}

// Normalize climatology monthly response into array [{month:'YYYY-MM', var: value}]
function normalizeClimatologyResponse(json) {
  const { properties } = json || {};
  const paramObj = properties?.parameter || {};
  const one = Object.values(paramObj)[0];
  const keys = one ? Object.keys(one) : [];
  const result = [];
  for (const k of keys) {
    // Climatology monthly keys are usually '01'..'12' or 'JAN'..'DEC'
    const mm = k.length === 2 ? k : k.slice(0, 2);
    const rec = { month: `${mm}` };
    for (const [varName, series] of Object.entries(paramObj)) {
      if (series && Object.prototype.hasOwnProperty.call(series, k)) {
        rec[varName] = series[k];
      }
    }
    result.push(rec);
  }
  // Order months 01..12
  return result.sort((a, b) => Number(a.month) - Number(b.month));
}

function normalizeDailyResponse(json) {
  const { properties } = json || {};
  const dates = Object.keys(properties?.parameter?.T2M || {});
  if (!dates || dates.length === 0) return [];

  const result = [];
  for (const dateKey of dates) {
    const yyyy = dateKey.slice(0, 4);
    const mm = dateKey.slice(4, 6);
    const dd = dateKey.slice(6, 8);
    const dateISO = `${yyyy}-${mm}-${dd}`;
    const record = { date: dateISO };
    for (const [varName, series] of Object.entries(properties.parameter)) {
      if (series && Object.prototype.hasOwnProperty.call(series, dateKey)) {
        const v = series[dateKey];
        // POWER missing value convention
        record[varName] = (v === -999 || v === -9999) ? null : v;
      }
    }
    result.push(record);
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getMonthlyClimatology({ latitude, longitude, parameters, start, end, signal }) {
  const key = cacheKey({ type: 'clim', latitude, longitude, parameters, start, end });
  const cached = getCache(key);
  if (cached) return cached;
  const url = buildClimatologyQuery({ latitude, longitude, parameters, start, end });
  const res = await fetchWithTimeout(url, { timeoutMs: 15000, signal });
  if (!res.ok) throw new Error(`NASA POWER climatology failed: ${res.status}`);
  const json = await res.json();
  const normalized = normalizeClimatologyResponse(json);
  setCache(key, normalized, 12 * DEFAULT_TTL_MS); // cache longer
  return normalized;
}
// Public API: get daily data for a point and a date range
export async function getDailyPoint({ latitude, longitude, startDate, endDate, parameters, signal }) {
  const start = typeof startDate === 'string' ? startDate : fmtDateYYYYMMDD(startDate);
  const end = typeof endDate === 'string' ? endDate : fmtDateYYYYMMDD(endDate);
  const key = cacheKey({ latitude, longitude, start, end, parameters });
  const cached = getCache(key);
  if (cached) return cached;

  const url = buildQuery({ latitude, longitude, start, end, parameters });
  const res = await fetchWithTimeout(url, { timeoutMs: 15000, signal });
  if (!res.ok) throw new Error(`NASA POWER request failed: ${res.status}`);
  const json = await res.json();
  const normalized = normalizeDailyResponse(json);
  setCache(key, normalized);
  return normalized;
}

// Helper: get last N days ending yesterday (POWER daily closes with some delay)
export function getDateRangeLastNDays(n) {
  const end = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - (n - 1) * 24 * 60 * 60 * 1000);
  return { start: fmtDateYYYYMMDD(start), end: fmtDateYYYYMMDD(end) };
}

// Fetch helper with timeout and single retry
async function fetchWithTimeout(url, { timeoutMs = 15000, retry = 1, signal } = {}) {
  for (let attempt = 0; attempt <= retry; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    let externalAbortHandler;
    if (signal) {
      if (signal.aborted) {
        clearTimeout(id);
        controller.abort();
        throw new DOMException('Aborted', 'AbortError');
      }
      externalAbortHandler = () => controller.abort();
      signal.addEventListener('abort', externalAbortHandler);
    }
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (signal && externalAbortHandler) {
        signal.removeEventListener('abort', externalAbortHandler);
      }
      return res;
    } catch (e) {
      clearTimeout(id);
      if (signal && externalAbortHandler) {
        signal.removeEventListener('abort', externalAbortHandler);
      }
      if (e && (e.name === 'AbortError' || String(e).includes('AbortError'))) {
        // Do not retry on aborts
        throw e;
      }
      if (attempt === retry) {
        throw new Error('Failed to fetch NASA POWER data (timeout/network).');
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }
}
