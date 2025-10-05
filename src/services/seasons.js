// Seasonal activity service using NASA POWER monthly data + bloom model
// Returns seasonal activity (0-100) for Northern, Southern, Tropical hemispheres for a given year

import { predictBloomIndex } from '../utils/bloomModel';

const POWER_BASE = '/power/api/temporal/monthly/point';
const PARAMETERS = ['T2M','T2M_MIN','T2M_MAX','PRECTOTCORR','RH2M','ALLSKY_SFC_SW_DWN'].join(',');
const MONTH_MAP = { JAN:1, FEB:2, MAR:3, APR:4, MAY:5, JUN:6, JUL:7, AUG:8, SEP:9, OCT:10, NOV:11, DEC:12 };

async function fetchMonthlyPower({ lat, lon, year }) {
  const url = `${POWER_BASE}?parameters=${PARAMETERS}&start=${year}&end=${year}&latitude=${lat}&longitude=${lon}&community=AG&format=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`POWER monthly failed: ${res.status}`);
  const json = await res.json();
  const params = json?.properties?.parameter || {};
  const byMonth = Array.from({ length: 12 }, (_, i) => ({ month: i + 1 }));
  for (const [varName, obj] of Object.entries(params)) {
    for (const [mName, val] of Object.entries(obj)) {
      const m = MONTH_MAP[mName];
      const num = (val === -999 || val === -9999) ? null : Number(val);
      byMonth[m - 1][varName] = num;
    }
  }
  return byMonth;
}

function seasonNorth(m) {
  if ([3,4,5].includes(m)) return 'Spring';
  if ([6,7,8].includes(m)) return 'Summer';
  if ([9,10,11].includes(m)) return 'Autumn';
  return 'Winter';
}
function seasonSouth(m) {
  if ([12,1,2].includes(m)) return 'Summer';
  if ([3,4,5].includes(m)) return 'Autumn';
  if ([6,7,8].includes(m)) return 'Winter';
  return 'Spring';
}

const avg = (arr) => {
  const v = arr.filter((x) => Number.isFinite(x));
  return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null;
};
const clamp01 = (x) => x == null ? null : Math.max(0, Math.min(1, x));

// Light sampling per band for MVP (tune later)
const POINTS_N = [
  { lat: 55, lon: -100 }, { lat: 45, lon: 10 }, { lat: 35, lon: 140 },
  { lat: 50, lon: -5 }, { lat: 40, lon: -75 }, { lat: 30, lon: 100 },
];
const POINTS_T = [
  { lat: 10, lon: -60 }, { lat: 0, lon: 30 }, { lat: -5, lon: 120 },
  { lat: 15, lon: 35 }, { lat: -10, lon: -70 }, { lat: 5, lon: 100 },
];
const POINTS_S = [
  { lat: -25, lon: -60 }, { lat: -35, lon: 140 }, { lat: -45, lon: 20 },
  { lat: -30, lon: 25 }, { lat: -40, lon: -70 }, { lat: -35, lon: 115 },
];

async function bandSeasonProfile(points, year, hemisphere) {
  const results = await Promise.allSettled(points.map(p => fetchMonthlyPower({ ...p, year })));
  const monthSeries = results.filter(r=>r.status==='fulfilled').map(r=>r.value);

  const monthlyIdx = Array.from({ length: 12 }, () => []);
  for (const series of monthSeries) {
    for (const m of series) {
      const idx = clamp01(predictBloomIndex({
        temperature: m.T2M,
        humidity: m.RH2M,
        precipitation: m.PRECTOTCORR,
        radiation: m.ALLSKY_SFC_SW_DWN,
      }));
      monthlyIdx[m.month - 1].push(idx);
    }
  }

  const buckets = { Spring: [], Summer: [], Autumn: [], Winter: [] };
  for (let i = 0; i < 12; i++) {
    const month = i + 1;
    const s = hemisphere === 'south' ? seasonSouth(month) : seasonNorth(month);
    buckets[s].push(avg(monthlyIdx[i]));
  }
  return Object.fromEntries(Object.entries(buckets).map(([k, arr]) => [k, avg(arr)]));
}

export async function computeSeasonalActivity({ year }) {
  const [north, tropic, south] = await Promise.all([
    bandSeasonProfile(POINTS_N, year, 'north'),
    bandSeasonProfile(POINTS_T, year, 'north'),
    bandSeasonProfile(POINTS_S, year, 'south'),
  ]);

  const toPct = (x) => x == null ? 0 : Math.round(clamp01(x) * 100);
  const seasons = ['Spring','Summer','Autumn','Winter'];
  return {
    seasonalData: seasons.map(s => ({
      season: s,
      northern: toPct(north[s]),
      southern: toPct(south[s]),
      tropical: toPct(tropic[s]),
    }))
  };
}
