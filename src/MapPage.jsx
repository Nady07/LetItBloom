import React, { useState } from 'react';
import { ArrowLeft, Info, Layers, Globe2, Satellite, Map } from 'lucide-react';
import CesiumMap from './CesiumMap';
import './MapPage.css';
import { getDailyPoint, getDateRangeLastNDays, getMonthlyClimatology } from './services/nasaPower';
import { predictBloomIndex, extractCurrentConditions, indexLabel, assessIdealConditions } from './utils/bloomModel';

const MapPage = ({ onBackToHome }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [aborter, setAborter] = useState(null);

  // Persisted UI toggles
  const initialBorders = (() => {
    try {
      const v = localStorage.getItem('lib_show_borders');
      return v == null ? true : v === 'true';
    } catch { return true; }
  })();
  const [showCountryBorders, setShowCountryBorders] = useState(initialBorders);

  const [baseLayer, setBaseLayer] = useState(() => {
    try {
      const saved = localStorage.getItem('lib_base_layer');
      return saved === 'viirs' || saved === 'evi8' ? saved : 'viirs';
    } catch { return 'viirs'; }
  });
  // Coerce unsupported values to viirs once on mount
  React.useEffect(() => {
    if (baseLayer !== 'viirs' && baseLayer !== 'evi8') {
      try { localStorage.setItem('lib_base_layer', 'viirs'); } catch {}
      setBaseLayer('viirs');
    }
  }, []);
  const layerOptions = [
    { id: 'viirs', name: 'VIIRS TrueColor', icon: Satellite },
    { id: 'evi8', name: 'MODIS EVI (8-day)', icon: Map },
  ];
  // POWER data state
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState(null);
  const [climateSeries, setClimateSeries] = useState(null);
  const [climateCurrent, setClimateCurrent] = useState(null);
  const [bloomIndex, setBloomIndex] = useState(null);
  const [bloomIndexMeta, setBloomIndexMeta] = useState(null);
  const [idealChecks, setIdealChecks] = useState([]);
  const [climBaseline, setClimBaseline] = useState(null);

  async function loadClimate(lat, lon) {
    // cancel previous
    if (aborter) {
      try { aborter.abort(); } catch {}
    }
    const controller = new AbortController();
    setAborter(controller);

    setClimateLoading(true);
    setClimateError(null);
    try {
      const { start, end } = getDateRangeLastNDays(60);
      const params = ['T2M','T2M_MAX','T2M_MIN','PRECTOTCORR','RH2M','ALLSKY_SFC_SW_DWN','WS2M','CLOUD_AMT','PS'];
      const series = await getDailyPoint({ latitude: lat, longitude: lon, startDate: start, endDate: end, parameters: params, signal: controller.signal });
      if (controller.signal.aborted) return; // stop if aborted
      setClimateSeries(series);
      const current = extractCurrentConditions(series);
      setClimateCurrent(current);
      if (current && current.T2M!=null && current.PRECTOTCORR!=null && current.ALLSKY_SFC_SW_DWN!=null && current.RH2M!=null) {
        const idx = predictBloomIndex({
          temperature: current.T2M,
          precipitation: current.PRECTOTCORR,
          radiation: current.ALLSKY_SFC_SW_DWN,
          humidity: current.RH2M,
          ndviTrend: 0,
        });
        setBloomIndex(idx);
        setBloomIndexMeta(indexLabel(idx));
        setIdealChecks(assessIdealConditions({
          temperature: current.T2M,
          precipitation: current.PRECTOTCORR,
          radiation: current.ALLSKY_SFC_SW_DWN,
          humidity: current.RH2M,
        }));
      } else {
        setBloomIndex(null); setBloomIndexMeta(null); setIdealChecks([]);
      }

      // Baseline climatológica (mensual) 2001-2020
      const clim = await getMonthlyClimatology({ latitude: lat, longitude: lon, parameters: ['T2M','PRECTOTCORR','ALLSKY_SFC_SW_DWN','RH2M'], signal: controller.signal });
      if (controller.signal.aborted) return;
      setClimBaseline(clim);
    } catch (e) {
      if (e && (e.name === 'AbortError' || String(e).includes('AbortError'))) {
        // Swallow abort errors silently
        return;
      }
      setClimateError(e.message || String(e));
      setClimateSeries(null); setClimateCurrent(null); setBloomIndex(null); setBloomIndexMeta(null); setIdealChecks([]);
      setClimBaseline(null);
    } finally {
      setClimateLoading(false);
    }
  }

  const handleChangeBase = (id) => {
    setBaseLayer(id);
    try { localStorage.setItem('lib_base_layer', id); } catch {}
  };

  const toggleBorders = () => {
    const next = !showCountryBorders;
    setShowCountryBorders(next);
    try { localStorage.setItem('lib_show_borders', String(next)); } catch {}
  };

  // Mock bloom data for selected location
  const bloomData = {
    'Amazon Rainforest': {
      bloomIntensity: 'High',
      peakSeason: 'April - June',
      vegetationType: 'Tropical Rainforest',
      ndviValue: 0.85,
      coverage: '78% of region',
      threats: 'Deforestation, Climate Change',
      conservation: 'Protected Areas: 23%'
    },
    'Great Plains, USA': {
      bloomIntensity: 'Medium',
      peakSeason: 'May - July',
      vegetationType: 'Grasslands & Prairies',
      ndviValue: 0.68,
      coverage: '65% of region',
      threats: 'Agriculture expansion',
      conservation: 'Protected Areas: 15%'
    },
    // Add more locations as needed
  };

  function renderSparkline(values, unit, label) {
    if (!Array.isArray(values) || values.length === 0) return null;
    const w = 180, h = 40, pad = 2;
    const min = Math.min(...values.filter(v => typeof v === 'number'));
    const max = Math.max(...values.filter(v => typeof v === 'number'));
    const span = (max - min) || 1;
    const pts = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
      const y = pad + (1 - ((v - min) / span)) * (h - 2 * pad);
      return `${x},${y}`;
    }).join(' ');
    const last = values[values.length - 1];
    return (
      <div style={{ display: 'inline-block', marginRight: 10 }}>
        <div style={{ fontSize: 12, marginBottom: 2, opacity: 0.85 }}>{label}: {Number(last).toFixed(1)} {unit}</div>
        <svg width={w} height={h} style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 4 }}>
          <polyline points={pts} fill="none" stroke="var(--accent, #2c5530)" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  return (
    <div className="mappage-container">
      {/* Header */}
      <header className="mappage-header">
        <div className="mappage-header-left">
          <button onClick={onBackToHome} className="mappage-back-btn">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <div className="mappage-title">
            <Globe2 className="mappage-title-icon" />
            <h1>Interactive Bloom Explorer</h1>
          </div>
        </div>
        
        <div className="mappage-header-right">
          <button 
            className={`mappage-control-btn ${showLayers ? 'active' : ''}`}
            onClick={() => setShowLayers(!showLayers)}
          >
            <Layers size={18} />
          </button>
          <button 
            className={`mappage-control-btn ${showInfo ? 'active' : ''}`}
            onClick={() => setShowInfo(!showInfo)}
          >
            <Info size={18} />
          </button>
          {clickedCoords && (
            <div style={{
              marginLeft: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(44, 85, 48, 0.08)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              fontSize: '0.9rem',
              color: 'var(--dark)'
            }}>
              Lat: {clickedCoords.lat.toFixed(4)}°, Lon: {clickedCoords.lon.toFixed(4)}°
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="mappage-content">
        {/* Map Container */}
        <div className="mappage-map-container">
          <CesiumMap
            baseLayer={baseLayer}
            showCountryBorders={showCountryBorders}
            onLocationSelect={(loc) => {
              // Support both entity-based selection and raw coords
              if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
                setClickedCoords({ lat: loc.lat, lon: loc.lon });
                // Trigger NASA POWER fetch
                loadClimate(loc.lat, loc.lon);
              }
              setSelectedLocation(loc);
            }}
          />
        </div>

        {/* Layer Control Panel */}
        {showLayers && (
          <div className="mappage-layers-panel">
            <h3>Map Layers</h3>
            <div className="mappage-map-modes">
              {layerOptions.map(mode => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    className={`mappage-mode-btn ${baseLayer === mode.id ? 'active' : ''}`}
                    onClick={() => handleChangeBase(mode.id)}
                  >
                    <IconComponent size={16} />
                    <span>{mode.name}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="mappage-layer-options">
              <label className="mappage-checkbox">
                <input type="checkbox" checked={showCountryBorders} onChange={toggleBorders} />
                <span>Country Borders (Natural Earth)</span>
              </label>
            </div>
          </div>
        )}

        {/* Information Panel */}
        {showInfo && (
          <div className="mappage-info-panel">
            <div className="mappage-info-header">
              <h3>Location Details</h3>
            </div>
            
            {selectedLocation ? (
              <div className="mappage-location-details">
                <h4>{typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name}</h4>
                <div className="mappage-details-grid">
                  {/* Climáticas actuales */}
                  <div className="mappage-detail-item full-width">
                    <span className="mappage-detail-label">🌡️ Condiciones actuales</span>
                    {climateLoading && <span className="mappage-detail-value">Cargando…</span>}
                    {climateError && <span className="mappage-detail-value" style={{color:'var(--danger, #b00)'}}>Error: {climateError}</span>}
                    {(!climateLoading && !climateError && climateCurrent) && (
                      <div className="mappage-conditions-list">
                        <div>
                          Temperatura: {climateCurrent.T2M!=null? Number(climateCurrent.T2M).toFixed(1)+'°C':'N/D'}
                          {' '} (Max: {climateCurrent.T2M_MAX!=null? Number(climateCurrent.T2M_MAX).toFixed(0)+'°C':'N/D'}, Min: {climateCurrent.T2M_MIN!=null? Number(climateCurrent.T2M_MIN).toFixed(0)+'°C':'N/D'})
                        </div>
                        <div>Precipitación: {climateCurrent.PRECTOTCORR!=null? Number(climateCurrent.PRECTOTCORR).toFixed(1)+' mm/día':'N/D'}</div>
                        <div>Humedad: {climateCurrent.RH2M!=null? Number(climateCurrent.RH2M).toFixed(0)+'%':'N/D'}</div>
                        <div>Radiación: {climateCurrent.ALLSKY_SFC_SW_DWN!=null? Number(climateCurrent.ALLSKY_SFC_SW_DWN).toFixed(1)+' kW-h/m²/día':'N/D'}</div>
                      </div>
                    )}
                  </div>

                  {/* Predicción floración */}
                  {(!climateLoading && !climateError && bloomIndex != null) && (
                    <div className="mappage-detail-item full-width">
                      <span className="mappage-detail-label">📈 Predicción Floración</span>
                      <div className="mappage-conditions-list">
                        <div>Índice: {bloomIndex.toFixed(2)} ({bloomIndexMeta?.label || '-'})</div>
                        <div>Floración esperada: 15-20 días</div>
                        <div>Confianza: 75%</div>
                      </div>
                    </div>
                  )}

                  {/* Tendencias (últimos 60 días) */}
                  {(!climateLoading && !climateError && Array.isArray(climateSeries) && climateSeries.length > 0) && (
                    <div className="mappage-detail-item full-width">
                      <span className="mappage-detail-label">📊 Tendencias (60 días)</span>
                      <div className="mappage-trends">
                        {renderSparkline(climateSeries.map(d => d.T2M).filter(v=>v!=null), '°C', 'Temp')}
                        {renderSparkline(climateSeries.map(d => d.PRECTOTCORR).filter(v=>v!=null), 'mm/d', 'Prec')}
                        {renderSparkline(climateSeries.map(d => d.ALLSKY_SFC_SW_DWN).filter(v=>v!=null), 'kWh/m²', 'Rad')}
                      </div>
                    </div>
                  )}

                  {/* Baseline climatológica */}
                  {(!climateLoading && !climateError && Array.isArray(climBaseline) && climBaseline.length > 0) && (
                    <div className="mappage-detail-item full-width">
                      <span className="mappage-detail-label">📚 Baseline (2001–2020)</span>
                      <div className="mappage-trends">
                        {renderSparkline(climBaseline.map(d => d.T2M).filter(v=>v!=null), '°C', 'Temp (mensual)')}
                        {renderSparkline(climBaseline.map(d => d.PRECTOTCORR).filter(v=>v!=null), 'mm/d', 'Prec (mensual)')}
                      </div>
                    </div>
                  )}

                  {/* Condiciones ideales */}
                  {(!climateLoading && !climateError && idealChecks.length > 0) && (
                    <div className="mappage-detail-item full-width">
                      <span className="mappage-detail-label">🌿 Condiciones Ideales</span>
                      <ul className="mappage-ideal-list">
                        {idealChecks.map(item => (
                          <li key={item.key} className={item.ok ? 'ok' : 'warn'}>
                            {item.ok ? '✅' : '⚠️'} {item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mappage-no-selection">
                <Globe2 size={48} className="mappage-placeholder-icon" />
                <p>Click on a bloom marker to view location details</p>
                <p className="mappage-placeholder-tip">Use the search bar to find specific countries</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="mappage-stats-bar">
        <div className="mappage-stat">
          <span className="mappage-stat-value">245</span>
          <span className="mappage-stat-label">Active Blooms</span>
        </div>
        <div className="mappage-stat">
          <span className="mappage-stat-value">78%</span>
          <span className="mappage-stat-label">Global Coverage</span>
        </div>
        <div className="mappage-stat">
          <span className="mappage-stat-value">0.72</span>
          <span className="mappage-stat-label">Avg NDVI</span>
        </div>
        <div className="mappage-stat">
          <span className="mappage-stat-value">156</span>
          <span className="mappage-stat-label">Countries</span>
        </div>
      </div>
    </div>
  );
};

export default MapPage;