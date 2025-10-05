// Global overview and trend service
// Uses NASA POWER daily point data + existing bloom model to compute:
// - Active Bloom Locations (count of sample regions with high bloomIndex)
// - Global Vegetation Index average (proxy using bloomIndex)
// - Countries Monitored (count of successful sample regions)
// - Monthly trend (average bloomIndex per month across regions)

import { getDailyPoint, getDateRangeLastNDays } from './nasaPower';
import { predictBloomIndex, extractCurrentConditions } from '../utils/bloomModel';
import { getSamplePointsForRegion } from './regions';

// Representative land points moved to services/regions.js per selected region.

const POWER_PARAMS = ['T2M','T2M_MAX','T2M_MIN','PRECTOTCORR','RH2M','ALLSKY_SFC_SW_DWN'];

// Compute bloomIndex for a POWER daily record (expects keys present)
function indexFromRecord(rec) {
  if (!rec) return null;
  const { T2M, PRECTOTCORR, ALLSKY_SFC_SW_DWN, RH2M } = rec;
  if (
    T2M == null || PRECTOTCORR == null || ALLSKY_SFC_SW_DWN == null || RH2M == null
  ) return null;
  return predictBloomIndex({
    temperature: T2M,
    precipitation: PRECTOTCORR,
    radiation: ALLSKY_SFC_SW_DWN,
    humidity: RH2M,
    ndviTrend: 0,
  });
}

function monthKey(isoDate /* YYYY-MM-DD */) {
  return isoDate ? isoDate.slice(0,7) : null; // YYYY-MM
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getYearRange(year) {
  const y = Number(year);
  if (!y || String(y).length !== 4) {
    // Fallback: last N days
    const { start, end } = getDateRangeLastNDays(60);
    return { start, end, mode: 'window', isCurrent: false };
  }
  const start = `${y}0101`;
  // End: if current year, use yesterday; else Dec 31
  const now = new Date();
  let endDateStr;
  if (now.getUTCFullYear() === y) {
    const d = new Date(now.getTime() - 24*60*60*1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    endDateStr = `${yyyy}${mm}${dd}`;
  } else {
    endDateStr = `${y}1231`;
  }
  return { start, end: endDateStr, mode: 'year', isCurrent: now.getUTCFullYear() === y };
}

export async function computeGlobalOverviewAndTrend({
  points,
  year, // optional YYYY
  activeThreshold = 0.6,
  region = 'global',
} = {}) {
  const { start, end, mode, isCurrent } = getYearRange(year);
  const usedPoints = Array.isArray(points) && points.length ? points : getSamplePointsForRegion(region).map((p, i) => ({ name: `P${i+1}`, ...p }));

  const perPoint = await Promise.all(usedPoints.map(async (p) => {
    try {
      const series = await getDailyPoint({
        latitude: p.lat,
        longitude: p.lon,
        startDate: start,
        endDate: end,
        parameters: POWER_PARAMS,
      });
      if (!Array.isArray(series) || series.length === 0) {
        return { name: p.name, ok: false };
      }
      // monthly aggregation of index
      const monthly = new Map(); // YYYY-MM -> { sum, count }
      for (const rec of series) {
        const idx = indexFromRecord(rec);
        if (idx == null) continue;
        const mk = monthKey(rec.date);
        if (!mk) continue;
        const prev = monthly.get(mk) || { sum: 0, count: 0 };
        prev.sum += idx; prev.count += 1;
        monthly.set(mk, prev);
      }
      if (monthly.size === 0) {
        return { name: p.name, ok: false };
      }
      return { name: p.name, ok: true, monthly };
    } catch {
      return { name: p.name, ok: false };
    }
  }));

  // Overview KPIs
  const valid = perPoint.filter(r => r.ok);

  // Trend: combine months across points
  const combined = new Map(); // YYYY-MM -> { sum, count }
  for (const r of valid) {
    for (const [mk, agg] of r.monthly.entries()) {
      const prev = combined.get(mk) || { sum: 0, count: 0 };
      prev.sum += agg.sum; prev.count += agg.count;
      combined.set(mk, prev);
    }
  }
  // Filter to selected year if provided; else keep last 8 months
  let monthsFiltered = Array.from(combined.keys());
  if (year) monthsFiltered = monthsFiltered.filter(k => k.startsWith(String(year)));
  monthsFiltered.sort();
  if (!year) {
    monthsFiltered = monthsFiltered.slice(-8);
  } else if (monthsFiltered.length === 0) {
    // Fallback: no data matched the year filter; use the most recent 8 months available
    const all = Array.from(combined.keys()).sort();
    monthsFiltered = all.slice(-8);
  }
  const trend = monthsFiltered.map(mk => {
    const { sum, count } = combined.get(mk);
    const avg = count ? (sum / count) : null;
    // Chart expects month short label and two series keys; use same value for ndvi/evi as proxy.
    const [y, m] = mk.split('-');
    const label = MONTH_LABELS[Number(m) - 1] || mk;
    return { month: label, ndvi: avg ?? 0, evi: avg ?? 0 };
  });

  // Compute overview averages and actives for the selected year
  let overallSum = 0, overallCount = 0;
  for (const mk of monthsFiltered) {
    const { sum, count } = combined.get(mk);
    overallSum += sum; overallCount += count;
  }
  const globalIndexAvg = overallCount ? (overallSum / overallCount) : null;

  // Active Bloom = count of points with last month's avg >= threshold
  let activeBloomLocations = 0;
  const lastMonthKey = monthsFiltered[monthsFiltered.length - 1];
  if (lastMonthKey) {
    const byPointLastMonth = valid.map(r => {
      const agg = r.monthly.get(lastMonthKey);
      if (!agg || !agg.count) return null;
      return agg.sum / agg.count;
    }).filter(v => typeof v === 'number');
    activeBloomLocations = byPointLastMonth.filter(v => v >= activeThreshold).length;
  }
  const countriesMonitored = valid.length;

  return {
    overview: {
      activeBloomLocations,
      globalIndexAvg, // 0..1, proxy for NDVI avg
      countriesMonitored,
      lastUpdateUtc: mode === 'year' ? (isCurrent ? new Date().toISOString() : `${String(year)}-12-31T00:00:00Z`) : new Date().toISOString(),
      diagnostics: {
        pointsRequested: usedPoints.length,
        pointsValid: valid.length,
      }
    },
    trend,
  };
}

export function formatNumber(n, { digits = 0 } = {}) {
  if (n == null || Number.isNaN(n)) return '—';
  return Number(n).toFixed(digits);
}
