import React, { useRef, useEffect, useState } from 'react';
import { Viewer, Cartesian3, Color } from 'cesium';
import { Search, MapPin, Home } from 'lucide-react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const CesiumMap = ({ onLocationSelect }) => {
  const cesiumContainer = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const viewerRef = useRef(null);

  // Database of countries with coordinates
  const countries = {
    'Argentina': { lat: -38.4161, lon: -63.6167, zoom: 5000000 },
    'Australia': { lat: -25.2744, lon: 133.7751, zoom: 7000000 },
    'Brazil': { lat: -14.2350, lon: -51.9253, zoom: 6000000 },
    'Canada': { lat: 56.1304, lon: -106.3468, zoom: 8000000 },
    'China': { lat: 35.8617, lon: 104.1954, zoom: 7000000 },
    'Egypt': { lat: 26.0975, lon: 30.0444, zoom: 3000000 },
    'France': { lat: 46.6034, lon: 1.8883, zoom: 2000000 },
    'Germany': { lat: 51.1657, lon: 10.4515, zoom: 2000000 },
    'India': { lat: 20.5937, lon: 78.9629, zoom: 5000000 },
    'Indonesia': { lat: -0.7893, lon: 113.9213, zoom: 5000000 },
    'Italy': { lat: 41.8719, lon: 12.5674, zoom: 2000000 },
    'Japan': { lat: 36.2048, lon: 138.2529, zoom: 3000000 },
    'Mexico': { lat: 23.6345, lon: -102.5528, zoom: 4000000 },
    'Russia': { lat: 61.5240, lon: 105.3188, zoom: 10000000 },
    'Spain': { lat: 40.4637, lon: -3.7492, zoom: 2000000 },
    'United Kingdom': { lat: 55.3781, lon: -3.4360, zoom: 2000000 },
    'United States': { lat: 37.0902, lon: -95.7129, zoom: 6000000 },
    'South Africa': { lat: -30.5595, lon: 22.9375, zoom: 4000000 },
    'Nigeria': { lat: 9.0820, lon: 8.6753, zoom: 3000000 },
    'Kenya': { lat: -0.0236, lon: 37.9062, zoom: 2000000 },
    'Thailand': { lat: 15.8700, lon: 100.9925, zoom: 2500000 },
    'Vietnam': { lat: 14.0583, lon: 108.2772, zoom: 2500000 },
    'Chile': { lat: -35.6751, lon: -71.5430, zoom: 4000000 },
    'Peru': { lat: -9.1900, lon: -75.0152, zoom: 4000000 },
    'Colombia': { lat: 4.5709, lon: -74.2973, zoom: 3000000 },
    'New Zealand': { lat: -40.9006, lon: 174.8860, zoom: 3000000 },
    'Norway': { lat: 60.4720, lon: 8.4689, zoom: 3000000 },
    'Sweden': { lat: 60.1282, lon: 18.6435, zoom: 3000000 },
    'Finland': { lat: 61.9241, lon: 25.7482, zoom: 2500000 },
    'Iceland': { lat: 64.9631, lon: -19.0208, zoom: 1500000 }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.length > 0) {
      const filtered = Object.keys(countries).filter(country =>
        country.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const flyToCountry = (countryName) => {
    const country = countries[countryName];
    if (country && viewerRef.current) {
      setIsSearching(true);
      viewerRef.current.scene.camera.flyTo({
        destination: Cartesian3.fromDegrees(country.lon, country.lat, country.zoom),
        duration: 2.0,
        complete: () => {
          setIsSearching(false);
          if (onLocationSelect) {
            onLocationSelect({
              name: countryName,
              lat: country.lat,
              lon: country.lon,
              zoom: country.zoom
            });
          }
        }
      });
      setSearchTerm(countryName);
      setSuggestions([]);
    }
  };

  const resetToHome = () => {
    if (viewerRef.current) {
      viewerRef.current.scene.camera.flyTo({
        destination: Cartesian3.fromDegrees(0, 0, 20000000),
        duration: 2.0
      });
      setSearchTerm('');
      setSuggestions([]);
    }
  };

  useEffect(() => {
    // Set Cesium base URL to the copied assets
    window.CESIUM_BASE_URL = '/cesium/';
    
    let viewer;
    try {
      viewer = new Viewer(cesiumContainer.current, {
        terrainProvider: undefined,
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: true,
        infoBox: true,
        selectionIndicator: true,
        fullscreenButton: true,
        vrButton: false
      });
      
      // Store viewer reference
      viewerRef.current = viewer;
      
      // Set initial view
      viewer.scene.camera.setView({
        destination: Cartesian3.fromDegrees(0, 0, 20000000)
      });
      
      // Add bloom location markers
      const bloomLocations = [
        { name: 'Amazon Rainforest', lat: -3.4653, lon: -62.2159, color: Color.HOTPINK },
        { name: 'Great Plains, USA', lat: 41.1, lon: -100.5, color: Color.GOLD },
        { name: 'Mediterranean Coast', lat: 43.3, lon: 5.4, color: Color.HOTPINK },
        { name: 'Sub-Saharan Africa', lat: 9.0, lon: 8.6, color: Color.SEAGREEN },
      ];
      
      bloomLocations.forEach(location => {
        viewer.entities.add({
          position: Cartesian3.fromDegrees(location.lon, location.lat),
          point: {
            pixelSize: 18,
            color: location.color,
            outlineColor: Color.WHITE,
            outlineWidth: 3,
            heightReference: 1,
          },
          label: {
            text: location.name,
            font: '14pt sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: 1,
            pixelOffset: { x: 0, y: -50 },
            showBackground: true,
            backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.7)'),
            backgroundPadding: { x: 10, y: 6 }
          }
        });
      });
      
    } catch (error) {
      console.error('Cesium initialization error:', error);
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Country Search Bar */}
      <div className="cesium-search-container">
        <div className="cesium-search-input-wrapper">
          <Search className="cesium-search-icon" size={20} />
          <input
            type="text"
            placeholder="🔍 Search countries..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions.length > 0) {
                flyToCountry(suggestions[0]);
              }
            }}
            className="cesium-search-input"
          />
          {isSearching && (
            <div className="cesium-search-loading">🌍</div>
          )}
        </div>
        
        {/* Search Suggestions */}
        {suggestions.length > 0 && (
          <div className="cesium-search-suggestions">
            {suggestions.map((country) => (
              <div
                key={country}
                onClick={() => flyToCountry(country)}
                className="cesium-search-suggestion"
              >
                <MapPin size={16} />
                <span>{country}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Home Button */}
      <button 
        onClick={resetToHome}
        className="cesium-home-button"
        title="Return to Earth view"
      >
        <Home size={20} />
      </button>
      
      {/* Cesium Map Container */}
      <div ref={cesiumContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CesiumMap;