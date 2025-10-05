// Simple bloom prediction model
// Inputs: temperature (T2M), precipitation (PRECTOTCORR), radiation (ALLSKY_SFC_SW_DWN), humidity (RH2M), ndviTrend (optional)

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

// Temperature optimal factor: piecewise peak around 18-26°C
export function temperatureOptimalFactor(tempC) {
  if (tempC == null || Number.isNaN(tempC)) return 0;
  const t = tempC;
  if (t < 0) return 0;
  if (t < 10) return (t - 0) / 10 * 0.4; // up to 0.4 at 10°C
  if (t < 18) return 0.4 + (t - 10) / 8 * 0.4; // up to 0.8 at 18°C
  if (t <= 26) return 1.0; // optimal plateau
  if (t <= 35) return 1.0 - (t - 26) / 9 * 0.6; // down to 0.4 at 35°C
  return 0.2; // very hot
}

export function predictBloomIndex({ temperature, precipitation, radiation, humidity, ndviTrend = 0 }) {
  const factor_temp = temperatureOptimalFactor(temperature);
  const factor_hum = clamp01((humidity ?? 0) / 100);
  const factor_prec = clamp01((precipitation ?? 0) / 5.0); // cap at 5 mm/day
  const factor_rad = clamp01((radiation ?? 0) / 6.0); // normalize to ~6 kWh/m2/day

  let index = (
    factor_temp * 0.35 +
    factor_hum * 0.20 +
    factor_prec * 0.25 +
    factor_rad * 0.20
  );

  if (ndviTrend > 0.1) index *= 1.2;
  else if (ndviTrend < -0.1) index *= 0.8;

  return clamp01(index);
}

export function indexLabel(idx) {
  if (idx >= 0.75) return { label: 'Muy alto', level: 'high' };
  if (idx >= 0.5) return { label: 'Alto', level: 'med-high' };
  if (idx >= 0.3) return { label: 'Medio', level: 'medium' };
  return { label: 'Bajo', level: 'low' };
}

// Given a daily series sorted by date, return last day conditions
export function extractCurrentConditions(series) {
  if (!Array.isArray(series) || series.length === 0) return null;
  // prefer the most recent record that has all key vars present
  for (let i = series.length - 1; i >= 0; i--) {
    const r = series[i];
    if (
      r && r.T2M != null && r.PRECTOTCORR != null &&
      r.ALLSKY_SFC_SW_DWN != null && r.RH2M != null
    ) {
      return r;
    }
  }
  // fallback to last record if none complete
  return series[series.length - 1];
}

// Basic “conditions check” for panel feedback
export function assessIdealConditions({ temperature, precipitation, radiation, humidity }) {
  const ideals = [];
  // Temperature 18-26
  ideals.push({ key: 'temp', ok: temperature != null && temperature >= 18 && temperature <= 26, text: 'Temperatura dentro de rango óptimo (18-26°C)' });
  // Precipitation ~2-5 mm/d
  ideals.push({ key: 'prec', ok: precipitation != null && precipitation >= 2 && precipitation <= 5, text: 'Precipitación adecuada (2-5 mm/día)' });
  // Radiation >= 4 kWh/m2/d
  ideals.push({ key: 'rad', ok: radiation != null && radiation >= 4, text: 'Buena radiación solar (>= 4 kW-h/m²/día)' });
  // Humidity 50-80%
  ideals.push({ key: 'hum', ok: humidity != null && humidity >= 50 && humidity <= 80, text: 'Humedad relativa adecuada (50-80%)' });
  return ideals;
}
