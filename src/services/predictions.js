// Bloom Predictions & Analytics service
// Uses NASA POWER daily data + bloomModel to estimate:
// - Next Peak Bloom month for the selected region
// - Timing shift vs baseline years (earlier/later)
// - Intensity change vs baseline years

import { getDailyPoint } from './nasaPower';
import { predictBloomIndex } from '../utils/bloomModel';
import { getSamplePointsForRegion } from './regions';

const POWER_PARAMS = ['T2M','T2M_MAX','T2M_MIN','PRECTOTCORR','RH2M','ALLSKY_SFC_SW_DWN'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthKey(dateStr /* YYYY-MM-DD */) {
  return dateStr ? dateStr.slice(0,7) : null; // YYYY-MM
}

function idxFromRec(rec) {
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

function yearRange(year) {
  const y = Number(year);
  const start = `${y}0101`;
  const now = new Date();
  let end;
  if (now.getUTCFullYear() === y) {
    const d = new Date(now.getTime() - 24*60*60*1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    end = `${yyyy}${mm}${dd}`;
  } else {
    end = `${y}1231`;
  }
  return { start, end };
}

async function aggregateRegionalMonthly({ region, year, pointsOverride }) {
  const points = (Array.isArray(pointsOverride) && pointsOverride.length)
    ? pointsOverride
    : getSamplePointsForRegion(region).map((p, i) => ({ name: `P${i+1}`, ...p }));

  const { start, end } = yearRange(year);

  // Fetch per point and aggregate to monthly across region
  const perPoint = await Promise.all(points.map(async (p) => {
    try {
      const series = await getDailyPoint({
        latitude: p.lat, longitude: p.lon,
        startDate: start, endDate: end,
        parameters: POWER_PARAMS,
      });
      if (!Array.isArray(series) || series.length === 0) return null;
      const monthly = new Map();
      let sumAll = 0, cntAll = 0;
      for (const rec of series) {
        const idx = idxFromRec(rec);
        if (idx == null) continue;
        sumAll += idx; cntAll += 1;
        const mk = monthKey(rec.date);
        if (!mk) continue;
        const prev = monthly.get(mk) || { sum: 0, count: 0 };
        prev.sum += idx; prev.count += 1;
        monthly.set(mk, prev);
      }
      return { ok: true, monthly, sumAll, cntAll };
    } catch {
      return null;
    }
  }));

  // Combine across points
  const combined = new Map(); // YYYY-MM -> { sum, count }
  let sumAll = 0, cntAll = 0;
  for (const r of perPoint) {
    if (!r || !r.ok) continue;
    sumAll += r.sumAll; cntAll += r.cntAll;
    for (const [mk, agg] of r.monthly.entries()) {
      const prev = combined.get(mk) || { sum: 0, count: 0 };
      prev.sum += agg.sum; prev.count += agg.count;
      combined.set(mk, prev);
    }
  }
  // monthly averages array for a single year
  const months = Array.from(combined.keys()).filter(k => k.startsWith(String(year))).sort();
  const monthlySeries = months.map(mk => {
    const { sum, count } = combined.get(mk);
    return { mk, avg: count ? sum / count : 0 };
  });
  const yearlyAvg = cntAll ? (sumAll / cntAll) : 0;
  return { monthlySeries, yearlyAvg };
}

function findPeakMonth(monthlySeries) {
  // monthlySeries: [{ mk:'YYYY-MM', avg:number }]
  if (!monthlySeries.length) return { monthIndex: null, label: null };
  let best = monthlySeries[0];
  for (const m of monthlySeries) {
    if (m.avg > best.avg) best = m;
  }
  const [, mm] = best.mk.split('-');
  const monthIndex = Math.max(0, Math.min(11, Number(mm) - 1));
  return { monthIndex, label: MONTH_LABELS[monthIndex] };
}

function mean(nums) {
  const arr = nums.filter(n => typeof n === 'number');
  if (!arr.length) return null;
  return arr.reduce((a,b)=>a+b,0) / arr.length;
}

function mode(nums) {
  const counts = new Map();
  for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);
  let best = null, bestC = -1;
  for (const [n,c] of counts.entries()) {
    if (c > bestC) { best = n; bestC = c; }
  }
  return best;
}

export async function computeBloomPredictions({ region = 'global', targetYear, yearsBack = 4, points } = {}) {
  const y = Number(targetYear);
  const current = await aggregateRegionalMonthly({ region, year: y, pointsOverride: points });
  const currentPeak = findPeakMonth(current.monthlySeries);

  // Baseline over the previous N years
  const baselines = [];
  for (let i = 1; i <= yearsBack; i++) {
    const yr = y - i;
    const agg = await aggregateRegionalMonthly({ region, year: yr, pointsOverride: points });
    const pk = findPeakMonth(agg.monthlySeries);
    baselines.push({ year: yr, peakMonthIndex: pk.monthIndex, yearlyAvg: agg.yearlyAvg });
  }

  const baselinePeakMonths = baselines.map(b => b.peakMonthIndex).filter(v => v != null);
  const baselineMeanPeak = mean(baselinePeakMonths);
  const baselineModePeak = mode(baselinePeakMonths);
  const baselineAvgIntensity = mean(baselines.map(b => b.yearlyAvg));
  const baselineConfidence = (baselinePeakMonths.length && baselineModePeak != null)
    ? (baselinePeakMonths.filter(m => m === baselineModePeak).length / baselinePeakMonths.length)
    : null;

  // Timing shift: positive means current is earlier (smaller index)
  let timingShiftMonths = null;
  if (currentPeak.monthIndex != null && baselineMeanPeak != null) {
    timingShiftMonths = baselineMeanPeak - currentPeak.monthIndex;
  }

  // Intensity change vs baseline (%).
  let intensityChangePercent = null;
  if (baselineAvgIntensity && baselineAvgIntensity !== 0) {
    intensityChangePercent = ((current.yearlyAvg - baselineAvgIntensity) / baselineAvgIntensity) * 100;
  }

  // Forecast next peak: use baseline mode (most common) as robust estimate.
  const forecastMonthIdx = (baselineModePeak != null ? baselineModePeak : (currentPeak.monthIndex ?? 5));
  const forecastMonthLabel = MONTH_LABELS[forecastMonthIdx];

  // Choose forecast year: if targetYear is current calendar year and today already passed the forecast month, pick next year.
  const now = new Date();
  let forecastYear = y;
  if (now.getUTCFullYear() === y) {
    const nowMonthIdx = now.getUTCMonth(); // 0..11
    if (nowMonthIdx > forecastMonthIdx) forecastYear = y + 1;
  }

  // Format helpers
  const shiftLabel = (timingShiftMonths == null)
    ? '—'
    : timingShiftMonths > 0
      ? `${Math.round(Math.abs(timingShiftMonths))} mo earlier`
      : timingShiftMonths < 0
        ? `${Math.round(Math.abs(timingShiftMonths))} mo later`
        : 'no change';

  return {
    nextPeak: {
      monthIndex: forecastMonthIdx,
      monthLabel: forecastMonthLabel,
      year: forecastYear,
    },
    trend: {
      timingShiftMonths,
      shiftLabel,
      intensityChangePercent,
      confidence: baselineConfidence,
    },
  };
}
