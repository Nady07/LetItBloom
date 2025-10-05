import { getDailyPoint, getMonthlyClimatology } from './nasaPower';
import { getSamplePointsForRegion } from './regions';
import { predictBloomIndex } from '../utils/bloomModel';

const POWER_PARAMS = ['T2M','T2M_MAX','T2M_MIN','PRECTOTCORR','RH2M','ALLSKY_SFC_SW_DWN'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function idxFromDaily(rec) {
  if (!rec) return null;
  const { T2M, PRECTOTCORR, ALLSKY_SFC_SW_DWN, RH2M } = rec;
  if (T2M==null || PRECTOTCORR==null || ALLSKY_SFC_SW_DWN==null || RH2M==null) return null;
  return predictBloomIndex({
    temperature: T2M,
    precipitation: PRECTOTCORR,
    radiation: ALLSKY_SFC_SW_DWN,
    humidity: RH2M,
  });
}

function idxFromClim(rec) {
  if (!rec) return null;
  const { T2M, PRECTOTCORR, ALLSKY_SFC_SW_DWN, RH2M } = rec;
  if (T2M==null || PRECTOTCORR==null || ALLSKY_SFC_SW_DWN==null || RH2M==null) return null;
  return predictBloomIndex({
    temperature: T2M,
    precipitation: PRECTOTCORR,
    radiation: ALLSKY_SFC_SW_DWN,
    humidity: RH2M,
  });
}

function monthStartEnd(year, monthIdx) {
  const y = Number(year);
  const m = Number(monthIdx); // 0..11
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0)); // last day of month
  const fmt = (d) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };
  return { start: fmt(start), end: fmt(end) };
}

export async function computeAnomalyForRegionMonth({ region = 'global', year, monthIndex }) {
  const points = getSamplePointsForRegion(region);
  const { start, end } = monthStartEnd(year, monthIndex);

  // Aggregate current month per point
  let sumIdx = 0, cntIdx = 0;
  let sumClim = 0, cntClim = 0;

  for (const p of points) {
    try {
      const series = await getDailyPoint({
        latitude: p.lat, longitude: p.lon,
        startDate: start, endDate: end,
        parameters: POWER_PARAMS,
      });
      for (const rec of series) {
        const idx = idxFromDaily(rec);
        if (idx == null) continue;
        sumIdx += idx; cntIdx += 1;
      }

      const clim = await getMonthlyClimatology({
        latitude: p.lat, longitude: p.lon,
        parameters: POWER_PARAMS,
        start: '2001', end: '2020',
      });
      // clim is array of { month:'MM', var: value }
      const mm = String(monthIndex + 1).padStart(2, '0');
      const climRec = clim.find(r => r.month === mm);
      if (climRec) {
        const idxC = idxFromClim(climRec);
        if (idxC != null) { sumClim += idxC; cntClim += 1; }
      }
    } catch {
      // ignore point failures
    }
  }

  const currentAvg = cntIdx ? sumIdx / cntIdx : null;
  const baselineAvg = cntClim ? sumClim / cntClim : null;
  let anomalyPercent = null;
  if (baselineAvg && baselineAvg !== 0 && currentAvg != null) {
    anomalyPercent = ((currentAvg - baselineAvg) / baselineAvg) * 100;
  }
  return {
    monthLabel: MONTH_LABELS[monthIndex],
    currentAvg, baselineAvg, anomalyPercent,
    diagnostics: { points: points.length, dailyCount: cntIdx, climCount: cntClim }
  };
}
