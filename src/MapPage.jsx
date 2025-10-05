import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, Layers, Search, Settings, Home, Globe2, Satellite, Map } from 'lucide-react';
import CesiumMap from './CesiumMap';
import FlowerDetails from './components/FlowerDetails';
import CropDetails from './components/CropDetails';
import flowersData from './resources/data/flowers.json';
import cropsData from './resources/data/crops.json';
import './MapPage.css';

const MapPage = ({ onBackToHome }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [mapMode, setMapMode] = useState('satellite');
  const [showInfo, setShowInfo] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [showStats, setShowStats] = useState(true);

  // Función para buscar la flor por país
  const findFlowerByLocation = (location) => {
    if (!location) return null;
    const locationName = typeof location === 'string' ? location : location.name;
    
    // Buscar flor por país
    const flower = flowersData.flowers.find(f => 
      f.country && f.country.toLowerCase() === locationName.toLowerCase()
    );
    
    setSelectedFlower(flower || null);
    return flower;
  };

  // Actualizar la flor seleccionada cuando cambie la ubicación
  useEffect(() => {
    findFlowerByLocation(selectedLocation);
  }, [selectedLocation]);

  // Datos de ubicaciones y floraciones
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

  const mapModes = [
    { id: 'satellite', name: 'Satellite', icon: Satellite },
    { id: 'terrain', name: 'Terrain', icon: Globe2 },
    { id: 'hybrid', name: 'Hybrid', icon: Map }
  ];

  return (
    <>
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
            <button 
              className={`mappage-control-btn ${showStats ? 'active' : ''}`}
              onClick={() => setShowStats(!showStats)}
              title="Toggle Statistics"
            >
              <Layers size={18} />
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
          <div className={`mappage-map-container ${showInfo ? 'shifted' : ''}`}>
            <CesiumMap
              onLocationSelect={(loc) => {
                // Support both entity-based selection and raw coords
                if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
                  setClickedCoords({ lat: loc.lat, lon: loc.lon });
                }
                setSelectedLocation(loc);
                setShowInfo(true); // Mostrar el panel al seleccionar ubicación
              }}
            />

            {/* Layer Control Panel */}
            <div className={`mappage-layers-panel ${showLayers ? 'visible' : ''}`}>
              <h3>Map Layers</h3>
              <div className="mappage-map-modes">
                {mapModes.map(mode => {
                  const IconComponent = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      className={`mappage-mode-btn ${mapMode === mode.id ? 'active' : ''}`}
                      onClick={() => setMapMode(mode.id)}
                    >
                      <IconComponent size={16} />
                      <span>{mode.name}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="mappage-layer-options">
                <label className="mappage-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Bloom Markers</span>
                </label>
                <label className="mappage-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Country Borders</span>
                </label>
                <label className="mappage-checkbox">
                  <input type="checkbox" />
                  <span>Climate Zones</span>
                </label>
                <label className="mappage-checkbox">
                  <input type="checkbox" />
                  <span>Protected Areas</span>
                </label>
              </div>
            </div>

          {/* Information Panel */}
          {showInfo && (
            <div className={`mappage-info-panel ${showInfo ? 'visible' : ''}`}>
              <div className="mappage-info-header">
                <h3>Location Details</h3>
              </div>
              
              {selectedLocation ? (
                <div className="mappage-location-details">
          <h4>{typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name}</h4>
          
          {/* Mostrar detalles de la flor si está disponible */}
          {selectedFlower && <FlowerDetails flower={selectedFlower} />}
          
          {/* Mostrar información de cultivos si está disponible */}
          {selectedLocation && (
            <CropDetails 
              countryData={cropsData.crops[typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name]} 
            />
          )}
          
          {/* Mostrar datos de floración si no hay flor específica */}
          {!selectedFlower && bloomData[typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name] && (
            <div className="mappage-details-grid">
                      {(() => {
                        const locationName = typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name;
                        const locationData = bloomData[locationName];
                        
                        return (
                          <>
                            <div className="mappage-detail-item">
                              <span className="mappage-detail-label">Bloom Intensity</span>
                              <span className={`mappage-detail-value intensity-${locationData.bloomIntensity.toLowerCase()}`}>
                                {locationData.bloomIntensity}
                              </span>
                            </div>
                            
                            <div className="mappage-detail-item">
                              <span className="mappage-detail-label">Peak Season</span>
                              <span className="mappage-detail-value">{locationData.peakSeason}</span>
                            </div>
                            
                            <div className="mappage-detail-item">
                              <span className="mappage-detail-label">Vegetation Type</span>
                              <span className="mappage-detail-value">{locationData.vegetationType}</span>
                            </div>
                            
                            <div className="mappage-detail-item">
                              <span className="mappage-detail-label">NDVI Value</span>
                              <span className="mappage-detail-value ndvi-value">{locationData.ndviValue}</span>
                            </div>
                            
                            <div className="mappage-detail-item">
                              <span className="mappage-detail-label">Coverage</span>
                              <span className="mappage-detail-value">{locationData.coverage}</span>
                            </div>
                            
                            <div className="mappage-detail-item full-width">
                              <span className="mappage-detail-label">Conservation Status</span>
                              <span className="mappage-detail-value">{locationData.conservation}</span>
                            </div>
                            
                            <div className="mappage-detail-item full-width threats">
                              <span className="mappage-detail-label">Threats</span>
                              <span className="mappage-detail-value">{locationData.threats}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
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
        <div className={`mappage-stats-bar ${showStats ? 'visible' : ''}`}>
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
        </div>
    </>
  );
};

export default MapPage;