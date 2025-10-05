import React, { useState, useEffect } from 'react';
import { Leaf, MapPin, Calendar, TrendingUp, Globe, Sun, Droplets, Wind, ExternalLink } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
// Removed: BarChart widgets imports
import MapPage from './MapPage';
import './LetItBloom.css';


const LetItBloom = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [showMapPage, setShowMapPage] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [activeSeason, setActiveSeason] = useState('spring');
  const [floatingElements, setFloatingElements] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedSatellite, setSelectedSatellite] = useState('MODIS');
  const [selectedVegetation, setSelectedVegetation] = useState('All');
  const [timeSlider, setTimeSlider] = useState(4);
  const [mapView, setMapView] = useState('satellite');
  // Overview/trend state (real data)
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [overviewStats, setOverviewStats] = useState({
    activeBloomLocations: null,
    globalIndexAvg: null,
    countriesMonitored: null,
    lastUpdateUtc: null,
  });
  const [trendData, setTrendData] = useState(null);
  // Seasons UI only (removed radar analytics)

  // Predictions & Analytics state
  const [predLoading, setPredLoading] = useState(true);
  const [predError, setPredError] = useState(null);
  const [predictions, setPredictions] = useState({ nextPeak: null, trend: null });

  // Removed: anomalies and regional snapshot widgets state

  // Load overview and trend when filters change (year & region)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setOverviewLoading(true);
      setOverviewError(null);
      try {
        const mod = await import('./services/overview');
        const { computeGlobalOverviewAndTrend } = mod;
        const { overview, trend } = await computeGlobalOverviewAndTrend({ year: selectedYear, region: selectedRegion });
        if (!mounted) return;
        setOverviewStats(overview);
        setTrendData(trend);
      } catch (e) {
        if (!mounted) return;
        setOverviewError(e?.message || String(e));
      } finally {
        if (mounted) setOverviewLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedYear, selectedRegion]);

  // Removed: anomaly and regional snapshot effects

  // Removed seasonal analytics loading (radar chart deleted)

  // Load predictions when year/region changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      setPredLoading(true);
      setPredError(null);
      try {
        const { computeBloomPredictions } = await import('./services/predictions');
        const result = await computeBloomPredictions({ region: selectedRegion, targetYear: Number(selectedYear), yearsBack: 4 });
        if (!mounted) return;
        setPredictions(result);
      } catch (e) {
        if (!mounted) return;
        setPredError(e?.message || String(e));
      } finally {
        if (mounted) setPredLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedYear, selectedRegion]);

  // Mock bloom locations
  const bloomLocations = [
    { id: 1, name: 'Amazon Rainforest', lat: -3.4653, lon: -62.2159, intensity: 'High', ndvi: 0.85, type: 'Tropical Flora', date: 'April 2025' },
    { id: 2, name: 'Great Plains, USA', lat: 41.1, lon: -100.5, intensity: 'Medium', ndvi: 0.68, type: 'Grasslands', date: 'May 2025' },
    { id: 3, name: 'Mediterranean Coast', lat: 43.3, lon: 5.4, intensity: 'High', ndvi: 0.79, type: 'Wildflowers', date: 'March 2025' },
    { id: 4, name: 'Sub-Saharan Africa', lat: 9.0, lon: 8.6, intensity: 'Medium', ndvi: 0.62, type: 'Savanna', date: 'June 2025' },
  ];

  // Seasonal data
  const seasons = {
    spring: { icon: '🌷', gradient: 'linear-gradient(135deg, #f9a8d4, #86efac)', title: 'Spring Awakening', desc: 'Peak blooming season in temperate regions' },
    summer: { icon: '🌻', gradient: 'linear-gradient(135deg, #fde047, #fb923c)', title: 'Summer Bloom', desc: 'Maximum vegetation activity worldwide' },
    autumn: { icon: '🍂', gradient: 'linear-gradient(135deg, #fb923c, #f87171)', title: 'Autumn Transition', desc: 'Late-season flowers and harvest time' },
    winter: { icon: '❄️', gradient: 'linear-gradient(135deg, #93c5fd, #c084fc)', title: 'Winter Rest', desc: 'Southern hemisphere blooms, northern dormancy' },
  };

  const regionLabel = (code) => {
    switch (code) {
      case 'global': return 'Global';
      case 'north_hemisphere': return 'Northern Hemisphere';
      case 'tropics': return 'Tropics (20°S–20°N)';
      case 'south_hemisphere': return 'Southern Hemisphere';
      case 'north_america': return 'North America';
      case 'south_america': return 'South America';
      case 'europe': return 'Europe';
      case 'africa': return 'Africa';
      case 'asia': return 'Asia';
      case 'oceania': return 'Oceania';
      default: return 'Global';
    }
  };

  // Seasonal radar data now computed from POWER via services/seasons.js

  useEffect(() => {
    // Generate floating elements for animation
    const elements = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      icon: ['🌸', '🌼', '🌺', '🌻', '🌷'][Math.floor(Math.random() * 5)]
    }));
    setFloatingElements(elements);
  }, []);

  const scrollToSection = (section) => {
    setActiveSection(section);
  };

  // Show MapPage if requested
  if (showMapPage) {
    return <MapPage onBackToHome={() => setShowMapPage(false)} />;
  }

  return (
  <div className="letitbloom-bg">
      {/* Navbar */}
  <nav className="letitbloom-header">
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '2rem', marginRight: 8 }}>
            <Leaf style={{ color: '#16a34a', width: 32, height: 32, verticalAlign: 'middle' }} /> Let It Bloom!
          </span>
          <span style={{ marginLeft: 24 }}>
            <button onClick={() => scrollToSection('home')} className="letitbloom-btn">Home</button>
            <button onClick={() => scrollToSection('dashboard')} className="letitbloom-btn">Dashboard</button>
            <button onClick={() => scrollToSection('seasons')} className="letitbloom-btn">Seasons</button>
            <button onClick={() => scrollToSection('about')} className="letitbloom-btn">About</button>
          </span>
        </div>
      </nav>

      {/* Hero Section */}
  <section className="letitbloom-section letitbloom-hero">
        {/* Floating Elements */}
        {floatingElements.map(el => (
          <div
            key={el.id}
            className="letitbloom-floating"
            style={{
              left: `${el.left}%`,
              animationDelay: `${el.delay}s`,
              animationDuration: `${el.duration}s`
            }}
          >
            {el.icon}
          </div>
        ))}

  <div className="letitbloom-hero-content">
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: 16 }}>
            Let It Bloom! 🌸
          </h1>
          <p style={{ fontSize: '1.5rem', marginBottom: 12 }}>
            Explore how Earth blooms from space
          </p>
          <p style={{ fontSize: '1.1rem', marginBottom: 24, color: '#333', maxWidth: 600, margin: '0 auto' }}>
            Using NASA satellite data to visualize global plant blooming events, seasonal patterns, and vegetation dynamics across our living planet.
          </p>
          <button
            onClick={() => scrollToSection('dashboard')}
            className="letitbloom-btn-accent"
          >
            Explore Dashboard 🚀
          </button>
        </div>
      </section>

      {/* Dashboard Section */}
  <section className="letitbloom-section letitbloom-dashboard-bg">
  <div className="letitbloom-container">
          <h2 className="letitbloom-title">Global Bloom Dashboard</h2>
          <p className="letitbloom-subtitle">Real-time vegetation monitoring from NASA satellites</p>

          {/* Filters */}
          <div className="letitbloom-filters">
            <div className="letitbloom-filter-card">
              <Calendar className="letitbloom-icon-green" />
              <select
                className="letitbloom-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="2025">2025 Season</option>
                <option value="2024">2024 Season</option>
                <option value="2023">2023 Season</option>
                <option value="2022">2022 Season</option>
                <option value="2021">2021 Season</option>
              </select>
            </div>
            <div className="letitbloom-filter-card">
              <Globe className="letitbloom-icon-blue" />
              <select
                className="letitbloom-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="global">Global</option>
                <option value="north_hemisphere">Northern Hemisphere</option>
                <option value="tropics">Tropics (20°S–20°N)</option>
                <option value="south_hemisphere">Southern Hemisphere</option>
                <option value="north_america">North America</option>
                <option value="south_america">South America</option>
                <option value="europe">Europe</option>
                <option value="africa">Africa</option>
                <option value="asia">Asia</option>
                <option value="oceania">Oceania</option>
              </select>
            </div>
            <div className="letitbloom-filter-card">
              <Globe className="letitbloom-icon-blue" />
              <select className="letitbloom-select">
                <option>MODIS</option>
                <option>Landsat</option>
                <option>VIIRS</option>
              </select>
            </div>
            <div className="letitbloom-filter-card">
              <Leaf className="letitbloom-icon-accent" />
              <select className="letitbloom-select">
                <option>All Vegetation</option>
                <option>Forests</option>
                <option>Grasslands</option>
                <option>Croplands</option>
              </select>
            </div>
          </div>

          {/* Map Access Card */}
          <div className="letitbloom-map-access-container">
            <div className="letitbloom-card letitbloom-map-access-card">
              <div className="letitbloom-map-access-content">
                <div className="letitbloom-map-access-icon">
                  <Globe size={48} className="letitbloom-icon-green" />
                </div>
                <div className="letitbloom-map-access-info">
                  <h3 className="letitbloom-card-title">
                    <MapPin className="letitbloom-icon-green" /> 
                    Interactive Global Bloom Map
                  </h3>
                  <p className="letitbloom-map-access-description">
                    Explore our interactive 3D globe with real-time vegetation data from NASA satellites. 
                    Search countries, discover bloom locations, and analyze vegetation patterns worldwide.
                  </p>
                  <div className="letitbloom-map-access-features">
                    <span className="letitbloom-feature-tag">🔍 Country Search</span>
                    <span className="letitbloom-feature-tag">🌍 3D Globe</span>
                    <span className="letitbloom-feature-tag">📍 Bloom Markers</span>
                    <span className="letitbloom-feature-tag">🛰️ NASA Data</span>
                  </div>
                </div>
              </div>
              <button 
                className="letitbloom-map-access-btn"
                onClick={() => setShowMapPage(true)}
              >
                <ExternalLink size={20} />
                <span>Explore Interactive Map</span>
              </button>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="letitbloom-dashboard-stats">
            <div className="letitbloom-card letitbloom-stats-card">
              <h3 className="letitbloom-card-title">
                <TrendingUp className="letitbloom-icon-green" /> Vegetation Overview — {regionLabel(selectedRegion)}
              </h3>
              {overviewLoading ? (
                <div className="letitbloom-stats-grid">
                  <div className="letitbloom-stat-item"><span className="letitbloom-stat-number">…</span><span className="letitbloom-stat-label">Active Bloom Locations</span></div>
                  <div className="letitbloom-stat-item"><span className="letitbloom-stat-number">…</span><span className="letitbloom-stat-label">Global Vegetation Avg</span></div>
                  <div className="letitbloom-stat-item"><span className="letitbloom-stat-number">…</span><span className="letitbloom-stat-label">Countries Monitored</span></div>
                  <div className="letitbloom-stat-item"><span className="letitbloom-stat-number">…</span><span className="letitbloom-stat-label">Last Update</span></div>
                </div>
              ) : overviewError ? (
                <div style={{ padding: '0.75rem', color: 'var(--danger)' }}>Error loading overview: {overviewError}</div>
              ) : (
                <div className="letitbloom-stats-grid">
                  <div className="letitbloom-stat-item">
                    <span className="letitbloom-stat-number">{overviewStats.activeBloomLocations ?? '—'}</span>
                    <span className="letitbloom-stat-label">Active Bloom Locations</span>
                  </div>
                  <div className="letitbloom-stat-item">
                    <span className="letitbloom-stat-number">{overviewStats.globalIndexAvg!=null ? overviewStats.globalIndexAvg.toFixed(2) : '—'}</span>
                    <span className="letitbloom-stat-label">Global Vegetation Avg</span>
                  </div>
                  <div className="letitbloom-stat-item">
                    <span className="letitbloom-stat-number">{overviewStats.countriesMonitored ?? '—'}</span>
                    <span className="letitbloom-stat-label">Countries Monitored</span>
                  </div>
                  <div className="letitbloom-stat-item">
                    <span className="letitbloom-stat-number">{overviewStats.lastUpdateUtc ? new Date(overviewStats.lastUpdateUtc).toISOString().slice(0,10) : '—'}</span>
                    <span className="letitbloom-stat-label">Last Update (UTC)</span>
                  </div>
                  {overviewStats?.diagnostics && (
                    <div className="letitbloom-stat-item" style={{ gridColumn: 'span 4', opacity: 0.75 }}>
                      <span className="letitbloom-stat-label">
                        Data coverage: {overviewStats.diagnostics.pointsValid}/{overviewStats.diagnostics.pointsRequested} points
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* NDVI Trend Chart */}
            <div className="letitbloom-card letitbloom-trend-card">
              <h3 className="letitbloom-card-title"><TrendingUp className="letitbloom-icon-green" /> Vegetation Trend {selectedYear} — {regionLabel(selectedRegion)}</h3>
              {overviewLoading ? (
                <div style={{ padding: '1rem', opacity: .8 }}>Loading trend…</div>
              ) : overviewError ? (
                <div style={{ padding: '1rem', color: 'var(--danger)' }}>Could not load trend.</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData || []} key={`trend-${selectedYear}-${selectedRegion}`}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="ndvi" stroke="#2E8B57" strokeWidth={3} name="Vegetation Index" />
                    <Line type="monotone" dataKey="evi" stroke="#FF7BAC" strokeWidth={2} name="EVI (proxy)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Removed: Global Vegetation Gauge, Anomaly badges, and Regional Snapshot (bars) */}
          </div>
        </div>
      </section>

      {/* Seasons Section (kept UI cards, removed radar chart) */}
  <section className="letitbloom-section letitbloom-seasons-bg">
  <div className="letitbloom-container">
          <h2 className="letitbloom-title">Blooming Through the Seasons</h2>
          <p className="letitbloom-subtitle">How vegetation cycles change across the year</p>

          <div className="letitbloom-seasons-grid">
            {Object.entries(seasons).map(([key, season]) => (
              <button
                key={key}
                onClick={() => setActiveSeason(key)}
                className={`letitbloom-season-card${activeSeason === key ? ' letitbloom-season-card-active' : ''}`}
                style={{ background: season.gradient }}
              >
                <div className="text-6xl mb-3">{season.icon}</div>
                <h3 className="letitbloom-season-title">{season.title}</h3>
                <p className="letitbloom-season-desc">{season.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
  <section className="letitbloom-section letitbloom-impact-bg">
  <div className="letitbloom-container">
          <h2 className="letitbloom-title">Why Blooming Matters</h2>
          <p className="letitbloom-subtitle">Understanding Earth's vegetation cycles</p>

          <div className="letitbloom-impact-grid">
            <div className="letitbloom-card letitbloom-impact-card">
              <div className="letitbloom-impact-icon letitbloom-impact-icon-pink"><Leaf className="letitbloom-icon-pink-lg" /></div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Biodiversity</h3>
              <p className="text-gray-600">Blooming events support pollinators and maintain ecosystem balance across habitats.</p>
            </div>

            <div className="letitbloom-card letitbloom-impact-card">
              <div className="letitbloom-impact-icon letitbloom-impact-icon-green"><Sun className="letitbloom-icon-green-lg" /></div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Food Security</h3>
              <p className="text-gray-600">Monitoring crop bloom cycles helps predict yields and manage agricultural resources.</p>
            </div>

            <div className="letitbloom-card letitbloom-impact-card">
              <div className="letitbloom-impact-icon letitbloom-impact-icon-blue"><Droplets className="letitbloom-icon-blue-lg" /></div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Climate Patterns</h3>
              <p className="text-gray-600">Bloom timing reveals climate change impacts and phenological shifts globally.</p>
            </div>

            <div className="letitbloom-card letitbloom-impact-card">
              <div className="letitbloom-impact-icon letitbloom-impact-icon-yellow"><Wind className="letitbloom-icon-yellow-lg" /></div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Conservation</h3>
              <p className="text-gray-600">Satellite data enables targeted protection of critical blooming habitats worldwide.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Prediction Section */}
  <section className="letitbloom-section letitbloom-prediction-bg">
  <div className="letitbloom-container">
          <h2 className="letitbloom-title">Bloom Predictions & Analytics</h2>
          <p className="letitbloom-subtitle">AI-powered insights from historical data</p>

          <div className="letitbloom-prediction-grid">
            <div className="letitbloom-card letitbloom-prediction-card letitbloom-prediction-card-green">
              <h3 className="text-2xl font-bold mb-4">Next Peak Bloom — {regionLabel(selectedRegion)}</h3>
              {predLoading ? (
                <p className="text-3xl font-bold mb-4">Calculating…</p>
              ) : predError ? (
                <p className="text-red-600">Failed to compute: {predError}</p>
              ) : predictions.nextPeak ? (
                <>
                  <p className="text-5xl font-bold mb-4">{predictions.nextPeak.monthLabel} {predictions.nextPeak.year}</p>
                  <p className="text-lg opacity-90">Estimated using a satellite-derived environmental proxy and a 4-year baseline.</p>
                </>
              ) : (
                <p>—</p>
              )}
            </div>

            <div className="letitbloom-card letitbloom-prediction-card letitbloom-prediction-card-pink">
              <h3 className="text-2xl font-bold mb-4">Trend Analysis — {regionLabel(selectedRegion)}</h3>
              {predLoading ? (
                <p className="text-3xl font-bold mb-4">Processing…</p>
              ) : predError ? (
                <p className="text-red-600">—</p>
              ) : predictions.trend ? (
                <>
                  <p className="text-5xl font-bold mb-2">
                    {predictions.trend.shiftLabel}
                  </p>
                  <p className="text-lg opacity-90">
                    {typeof predictions.trend.intensityChangePercent === 'number'
                      ? `${predictions.trend.intensityChangePercent >= 0 ? '+' : ''}${predictions.trend.intensityChangePercent.toFixed(1)}% intensity vs baseline`
                      : '—'}
                  </p>
                  {typeof predictions.trend.confidence === 'number' && (
                    <p className="text-sm opacity-80 mt-1">Confidence in peak timing: {(predictions.trend.confidence * 100).toFixed(0)}%</p>
                  )}
                </>
              ) : (
                <p>—</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
  <section className="letitbloom-section letitbloom-about-bg">
  <div className="letitbloom-container letitbloom-about-container">
          <h2 className="letitbloom-title">About This Project</h2>
          <p className="letitbloom-about-desc">
            Let It Bloom! leverages NASA's Earth observation satellites including MODIS, VIIRS, Landsat, and EMIT to track global vegetation dynamics. By analyzing spectral indices like NDVI and EVI, we visualize when and where Earth's plants bloom, providing crucial insights for agriculture, ecology, and climate science.
          </p>
          <div className="letitbloom-about-tags">
            <span className="letitbloom-about-tag">MODIS</span>
            <span className="letitbloom-about-tag">Landsat</span>
            <span className="letitbloom-about-tag">VIIRS</span>
            <span className="letitbloom-about-tag">EMIT</span>
            <span className="letitbloom-about-tag">PACE</span>
          </div>
          <p className="text-gray-600">
            Created for NASA Space Apps Challenge 2025 - Exploring Earth's living systems from space
          </p>
        </div>
      </section>

      {/* Footer */}
  <footer className="letitbloom-footer">
  <div className="letitbloom-footer-container">
          <p className="letitbloom-footer-text">© 2025 Let It Bloom — Powered by NASA Earth Data</p>
          <div className="letitbloom-footer-links">
            <a href="#" className="letitbloom-footer-link">GitHub</a>
            <a href="#" className="letitbloom-footer-link">NASA Data</a>
            <a href="#" className="letitbloom-footer-link">Team</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
          50% { transform: translateY(-100vh) rotate(360deg); opacity: 0.8; }
        }
        .animate-float {
          animation: float linear infinite;
        }
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LetItBloom;