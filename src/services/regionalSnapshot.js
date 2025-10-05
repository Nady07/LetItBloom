import { getDailyPoint } from './nasaPower';
import { getSamplePointsForRegion } from './regions';
import { predictBloomIndex } from '../utils/bloomModel';

const POWER_PARAMS = ['T2M','T2M_MAX','T2M_MIN','PRECTOTCORR','RH2M','ALLSKY_SFC_SW_DWN'];

function monthStartEnd(year, monthIdx) {
  const y = Number(year);
  const m = Number(monthIdx);
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0));
  const fmt = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`;
  return { start: fmt(start), end: fmt(end) };
}

function idxFromDaily(rec) {
  const { T2M, PRECTOTCORR, ALLSKY_SFC_SW_DWN, RH2M } = rec || {};
  if (T2M==null || PRECTOTCORR==null || ALLSKY_SFC_SW_DWN==null || RH2M==null) return null;
  return predictBloomIndex({
    temperature: T2M,
    precipitation: PRECTOTCORR,
    radiation: ALLSKY_SFC_SW_DWN,
    humidity: RH2M,
  });
}

async function avgForRegionMonth(region, year, monthIdx) {
  const pts = getSamplePointsForRegion(region);
  const { start, end } = monthStartEnd(year, monthIdx);
  let sum = 0, cnt = 0;
  for (const p of pts) {
    try {
      const series = await getDailyPoint({ latitude: p.lat, longitude: p.lon, startDate: start, endDate: end, parameters: POWER_PARAMS });
      for (const rec of series) {
        const idx = idxFromDaily(rec);
        if (idx == null) continue; sum += idx; cnt += 1;
      }
    } catch {}
  }
  return cnt ? (sum / cnt) : null;
}

export async function computeRegionalSnapshotBars({ year, monthIndex }) {
  const regions = [
    { code: 'global', label: 'Global' },
    { code: 'north_hemisphere', label: 'North Hem.' },
    { code: 'south_hemisphere', label: 'South Hem.' },
    { code: 'tropics', label: 'Tropics' },
    { code: 'north_america', label: 'N. America' },
    { code: 'south_america', label: 'S. America' },
    { code: 'europe', label: 'Europe' },
    { code: 'africa', label: 'Africa' },
    { code: 'asia', label: 'Asia' },
    { code: 'oceania', label: 'Oceania' },
  ];
  const bars = [];
  for (const r of regions) {
    const v = await avgForRegionMonth(r.code, year, monthIndex);
    bars.push({ region: r.label, value: v ?? 0 });
  }
  // sort desc
  bars.sort((a,b)=>(b.value - a.value));
  return bars;
}
