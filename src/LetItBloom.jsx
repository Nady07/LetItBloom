import React, { useState, useEffect } from 'react';
import { Leaf, MapPin, Calendar, TrendingUp, Globe, Sun, Droplets, Wind, ExternalLink } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import CesiumMap from './CesiumMap';
import MapPage from './MapPage';
import './LetItBloom.css';


const LetItBloom = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [showMapPage, setShowMapPage] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [activeSeason, setActiveSeason] = useState('spring');
  const [floatingElements, setFloatingElements] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedSatellite, setSelectedSatellite] = useState('MODIS');
  const [selectedVegetation, setSelectedVegetation] = useState('All');
  const [timeSlider, setTimeSlider] = useState(4);
  const [mapView, setMapView] = useState('satellite');

  // Mock data for NDVI trends
  const ndviData = [
    { month: 'Jan', ndvi: 0.3, evi: 0.25 },
    { month: 'Feb', ndvi: 0.35, evi: 0.28 },
    { month: 'Mar', ndvi: 0.5, evi: 0.42 },
    { month: 'Apr', ndvi: 0.72, evi: 0.65 },
    { month: 'May', ndvi: 0.85, evi: 0.78 },
    { month: 'Jun', ndvi: 0.82, evi: 0.75 },
    { month: 'Jul', ndvi: 0.75, evi: 0.68 },
    { month: 'Aug', ndvi: 0.65, evi: 0.58 },
  ];

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

  // Seasonal radar data
  const seasonalData = [
    { season: 'Spring', northern: 95, southern: 45, tropical: 80 },
    { season: 'Summer', northern: 100, southern: 30, tropical: 85 },
    { season: 'Autumn', northern: 60, southern: 75, tropical: 75 },
    { season: 'Winter', northern: 20, southern: 100, tropical: 70 },
  ];

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
              <select className="letitbloom-select">
                <option>2025 Season</option>
                <option>2024 Season</option>
                <option>2023 Season</option>
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
              <Leaf className="letitbloom-icon-pink" />
              <select className="letitbloom-select">
                <option>All Vegetation</option>
                <option>Forests</option>
                <option>Grasslands</option>
                <option>Croplands</option>
              </select>
            </div>
          </div>

          {/* Full Screen Map */}
          <div className="letitbloom-fullscreen-map-container">
            <div className="letitbloom-card letitbloom-fullscreen-map-card">
              <div className="letitbloom-map-header">
                <h3 className="letitbloom-card-title"><MapPin className="letitbloom-icon-green" /> Interactive Global Bloom Map</h3>
                <button 
                  className="letitbloom-fullscreen-btn"
                  onClick={() => setShowMapPage(true)}
                  title="Open Full Map Explorer"
                >
                  <ExternalLink size={18} />
                  <span>Full Explorer</span>
                </button>
              </div>
              <CesiumMap />
            </div>
          </div>

          {/* Info Panels Below Map */}
          <div className="letitbloom-bottom-panels">
            <div className="letitbloom-card letitbloom-location-card">
              <h3 className="letitbloom-card-title">
                {selectedRegion ? selectedRegion.name : 'Select a Location'}
              </h3>
              {selectedRegion ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bloom Date:</span>
                    <span className="font-semibold text-green-600">{selectedRegion.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Vegetation Type:</span>
                    <span className="font-semibold">{selectedRegion.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">NDVI Index:</span>
                    <span className="font-semibold text-blue-600">{selectedRegion.ndvi}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Intensity:</span>
                    <span className={`font-semibold px-3 py-1 rounded-full ${
                      selectedRegion.intensity === 'High' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {selectedRegion.intensity}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="letitbloom-info-placeholder">Click on a marker to view bloom details</p>
              )}
            </div>

            {/* NDVI Chart */}
            <div className="letitbloom-card letitbloom-trend-card">
              <h3 className="letitbloom-card-title"><TrendingUp className="letitbloom-icon-green" /> Vegetation Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ndviData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="ndvi" stroke="#2E8B57" strokeWidth={3} />
                  <Line type="monotone" dataKey="evi" stroke="#FF7BAC" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Seasons Section */}
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
                style={{
                  background: season.gradient
                }}
              >
                <div className="text-6xl mb-3">{season.icon}</div>
                <h3 className="letitbloom-season-title">{season.title}</h3>
                <p className="letitbloom-season-desc">{season.desc}</p>
              </button>
            ))}
          </div>

          {/* Seasonal Radar Chart */}
          <div className="letitbloom-card letitbloom-radar-card">
            <h3 className="letitbloom-card-title letitbloom-center">Hemisphere Bloom Activity</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={seasonalData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="season" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Northern" dataKey="northern" stroke="#2E8B57" fill="#2E8B57" fillOpacity={0.6} />
                <Radar name="Southern" dataKey="southern" stroke="#FF7BAC" fill="#FF7BAC" fillOpacity={0.6} />
                <Radar name="Tropical" dataKey="tropical" stroke="#FFD166" fill="#FFD166" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
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
              <h3 className="text-2xl font-bold mb-4">Next Peak Bloom</h3>
              <p className="text-5xl font-bold mb-4">May 2026</p>
              <p className="text-lg opacity-90">Amazon Basin - Expected high intensity flowering season based on 15-year MODIS data analysis.</p>
            </div>

            <div className="letitbloom-card letitbloom-prediction-card letitbloom-prediction-card-pink">
              <h3 className="text-2xl font-bold mb-4">Trend Analysis</h3>
              <p className="text-5xl font-bold mb-4">8% Earlier</p>
              <p className="text-lg opacity-90">Global flowering events occurring earlier compared to 10-year average, indicating climate shift patterns.</p>
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