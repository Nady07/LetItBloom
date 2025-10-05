// Sampling points per region for global snapshots (MVP)
// Keep lists small to limit API calls; expand later for fidelity

export function getSamplePointsForRegion(region = 'global') {
  const GLOBAL = [
    // Northern
    { lat: 55, lon: -100 }, { lat: 50, lon: -5 }, { lat: 45, lon: 10 }, { lat: 40, lon: -75 }, { lat: 35, lon: 140 },
    // Tropics
    { lat: 15, lon: -60 }, { lat: 5, lon: -45 }, { lat: 0, lon: 30 }, { lat: -5, lon: 120 }, { lat: 10, lon: 100 },
    // Southern
    { lat: -25, lon: -60 }, { lat: -30, lon: 25 }, { lat: -35, lon: 115 }, { lat: -40, lon: -70 }, { lat: -35, lon: 140 },
  ];

  const NORTH_HEMI = [
    { lat: 60, lon: -110 }, { lat: 55, lon: -100 }, { lat: 50, lon: -5 }, { lat: 48, lon: 15 }, { lat: 40, lon: -75 }, { lat: 35, lon: 140 }
  ];
  const TROPICS = [
    { lat: 15, lon: -60 }, { lat: 10, lon: -50 }, { lat: 5, lon: 10 }, { lat: 0, lon: 30 }, { lat: -5, lon: 120 }, { lat: 10, lon: 100 }
  ];
  const SOUTH_HEMI = [
    // South America
    { lat: -15, lon: -55 }, { lat: -25, lon: -60 }, { lat: -35, lon: -58 },
    // Southern Africa
    { lat: -23, lon: 24 }, { lat: -30, lon: 25 },
    // Australia & NZ
    { lat: -27, lon: 133 }, { lat: -33, lon: 151 }, { lat: -42, lon: 147 }
  ];

  const NORTH_AMERICA = [
    { lat: 60, lon: -110 }, { lat: 49, lon: -100 }, { lat: 37, lon: -95 }, { lat: 30, lon: -100 }
  ];
  const SOUTH_AMERICA = [
    { lat: 5, lon: -60 }, { lat: -10, lon: -70 }, { lat: -15, lon: -55 }, { lat: -25, lon: -60 }
  ];
  const EUROPE = [
    { lat: 55, lon: 10 }, { lat: 50, lon: -5 }, { lat: 48, lon: 15 }, { lat: 45, lon: 5 }, { lat: 60, lon: 25 }
  ];
  const AFRICA = [
    { lat: 10, lon: 0 }, { lat: -1, lon: 35 }, { lat: 7, lon: 20 }, { lat: -10, lon: 20 }, { lat: -25, lon: 25 }
  ];
  const ASIA = [
    { lat: 30, lon: 70 }, { lat: 35, lon: 105 }, { lat: 20, lon: 78 }, { lat: 45, lon: 90 }, { lat: 15, lon: 120 }
  ];
  const OCEANIA = [
    { lat: -20, lon: 132 }, { lat: -33, lon: 151 }, { lat: -42, lon: 147 }, { lat: -6, lon: 147 }
  ];

  switch (region) {
    case 'north_hemisphere': return NORTH_HEMI;
    case 'tropics': return TROPICS;
    case 'south_hemisphere': return SOUTH_HEMI;
    case 'north_america': return NORTH_AMERICA;
    case 'south_america': return SOUTH_AMERICA;
    case 'europe': return EUROPE;
    case 'africa': return AFRICA;
    case 'asia': return ASIA;
    case 'oceania': return OCEANIA;
    case 'global':
    default: return GLOBAL;
  }
}
