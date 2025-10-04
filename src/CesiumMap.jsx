import React, { useRef, useEffect, useState } from 'react';
import { Viewer, Cartesian3, Color } from 'cesium';
import { Search, MapPin } from 'lucide-react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const CesiumMap = ({ onLocationSelect }) => {
  const cesiumContainer = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const viewerRef = useRef(null);

  // Database of countries with coordinates
  const countries = {
    'Afghanistan': { lat: 33.9391, lon: 67.7100, zoom: 3000000 },
    'Albania': { lat: 41.1533, lon: 20.1683, zoom: 1500000 },
    'Algeria': { lat: 28.0339, lon: 1.6596, zoom: 5000000 },
    'Argentina': { lat: -38.4161, lon: -63.6167, zoom: 5000000 },
    'Australia': { lat: -25.2744, lon: 133.7751, zoom: 7000000 },
    'Austria': { lat: 47.5162, lon: 14.5501, zoom: 1500000 },
    'Bangladesh': { lat: 23.6850, lon: 90.3563, zoom: 2000000 },
    'Belgium': { lat: 50.5039, lon: 4.4699, zoom: 1200000 },
    'Bolivia': { lat: -16.2902, lon: -63.5887, zoom: 4000000 },
    'Brazil': { lat: -14.2350, lon: -51.9253, zoom: 6000000 },
    'Bulgaria': { lat: 42.7339, lon: 25.4858, zoom: 1800000 },
    'Canada': { lat: 56.1304, lon: -106.3468, zoom: 8000000 },
    'Chile': { lat: -35.6751, lon: -71.5430, zoom: 4000000 },
    'China': { lat: 35.8617, lon: 104.1954, zoom: 7000000 },
    'Colombia': { lat: 4.5709, lon: -74.2973, zoom: 3000000 },
    'Croatia': { lat: 45.1000, lon: 15.2000, zoom: 1500000 },
    'Cuba': { lat: 21.5218, lon: -77.7812, zoom: 1800000 },
    'Czech Republic': { lat: 49.8175, lon: 15.4730, zoom: 1500000 },
    'Denmark': { lat: 56.2639, lon: 9.5018, zoom: 1200000 },
    'Ecuador': { lat: -1.8312, lon: -78.1834, zoom: 2500000 },
    'Egypt': { lat: 26.0975, lon: 30.0444, zoom: 3000000 },
    'Finland': { lat: 61.9241, lon: 25.7482, zoom: 2500000 },
    'France': { lat: 46.6034, lon: 1.8883, zoom: 2000000 },
    'Germany': { lat: 51.1657, lon: 10.4515, zoom: 2000000 },
    'Ghana': { lat: 7.9465, lon: -1.0232, zoom: 2000000 },
    'Greece': { lat: 39.0742, lon: 21.8243, zoom: 1800000 },
    'Hungary': { lat: 47.1625, lon: 19.5033, zoom: 1500000 },
    'Iceland': { lat: 64.9631, lon: -19.0208, zoom: 1500000 },
    'India': { lat: 20.5937, lon: 78.9629, zoom: 5000000 },
    'Indonesia': { lat: -0.7893, lon: 113.9213, zoom: 5000000 },
    'Iran': { lat: 32.4279, lon: 53.6880, zoom: 4000000 },
    'Iraq': { lat: 33.2232, lon: 43.6793, zoom: 3000000 },
    'Ireland': { lat: 53.4129, lon: -8.2439, zoom: 1200000 },
    'Israel': { lat: 31.0461, lon: 34.8516, zoom: 1000000 },
    'Italy': { lat: 41.8719, lon: 12.5674, zoom: 2000000 },
    'Japan': { lat: 36.2048, lon: 138.2529, zoom: 3000000 },
    'Jordan': { lat: 30.5852, lon: 36.2384, zoom: 1500000 },
    'Kazakhstan': { lat: 48.0196, lon: 66.9237, zoom: 6000000 },
    'Kenya': { lat: -0.0236, lon: 37.9062, zoom: 2000000 },
    'Libya': { lat: 26.3351, lon: 17.2283, zoom: 4000000 },
    'Malaysia': { lat: 4.2105, lon: 101.9758, zoom: 2500000 },
    'Mexico': { lat: 23.6345, lon: -102.5528, zoom: 4000000 },
    'Morocco': { lat: 31.7917, lon: -7.0926, zoom: 3000000 },
    'Netherlands': { lat: 52.1326, lon: 5.2913, zoom: 1200000 },
    'New Zealand': { lat: -40.9006, lon: 174.8860, zoom: 3000000 },
    'Nigeria': { lat: 9.0820, lon: 8.6753, zoom: 3000000 },
    'Norway': { lat: 60.4720, lon: 8.4689, zoom: 3000000 },
    'Pakistan': { lat: 30.3753, lon: 69.3451, zoom: 4000000 },
    'Peru': { lat: -9.1900, lon: -75.0152, zoom: 4000000 },
    'Philippines': { lat: 12.8797, lon: 121.7740, zoom: 3000000 },
    'Poland': { lat: 51.9194, lon: 19.1451, zoom: 2000000 },
    'Portugal': { lat: 39.3999, lon: -8.2245, zoom: 1500000 },
    'Romania': { lat: 45.9432, lon: 24.9668, zoom: 2000000 },
    'Russia': { lat: 61.5240, lon: 105.3188, zoom: 10000000 },
    'Saudi Arabia': { lat: 23.8859, lon: 45.0792, zoom: 4000000 },
    'South Africa': { lat: -30.5595, lon: 22.9375, zoom: 4000000 },
    'South Korea': { lat: 35.9078, lon: 127.7669, zoom: 1800000 },
    'Spain': { lat: 40.4637, lon: -3.7492, zoom: 2000000 },
    'Sweden': { lat: 60.1282, lon: 18.6435, zoom: 3000000 },
    'Switzerland': { lat: 46.8182, lon: 8.2275, zoom: 1200000 },
    'Thailand': { lat: 15.8700, lon: 100.9925, zoom: 2500000 },
    'Turkey': { lat: 38.9637, lon: 35.2433, zoom: 3000000 },
    'Ukraine': { lat: 48.3794, lon: 31.1656, zoom: 3000000 },
    'United Kingdom': { lat: 55.3781, lon: -3.4360, zoom: 2000000 },
    'United States': { lat: 37.0902, lon: -95.7129, zoom: 6000000 },
    'Uruguay': { lat: -32.5228, lon: -55.7658, zoom: 1800000 },
    'Venezuela': { lat: 6.4238, lon: -66.5897, zoom: 3000000 },
    'Vietnam': { lat: 14.0583, lon: 108.2772, zoom: 2500000 },
    'Bolivia': { lat: -16.2902, lon: -63.5887, zoom: 3000000 },
    'Ecuador': { lat: -1.8312, lon: -78.1834, zoom: 2000000 },
    'Paraguay': { lat: -23.4425, lon: -58.4438, zoom: 2500000 },
    'Cuba': { lat: 21.5218, lon: -77.7812, zoom: 1500000 },
    'Iceland': { lat: 64.9631, lon: -19.0208, zoom: 1200000 },
    'Ireland': { lat: 53.1424, lon: -7.6921, zoom: 1500000 },
    'Austria': { lat: 47.5162, lon: 14.5501, zoom: 1500000 },
    'Belgium': { lat: 50.5039, lon: 4.4699, zoom: 1200000 },
    'Denmark': { lat: 56.2639, lon: 9.5018, zoom: 1500000 },
    'Finland': { lat: 61.9241, lon: 25.7482, zoom: 2500000 },
    'Greece': { lat: 39.0742, lon: 21.8243, zoom: 1800000 },
    'Hungary': { lat: 47.1625, lon: 19.5033, zoom: 1500000 },
    'Israel': { lat: 31.0461, lon: 34.8516, zoom: 1000000 },
    'Luxembourg': { lat: 49.8153, lon: 6.1296, zoom: 800000 },
    'Malta': { lat: 35.9375, lon: 14.3754, zoom: 500000 },  
    'Monaco': { lat: 43.7384, lon: 7.4246, zoom: 200000 },
    'Vatican': { lat: 41.9029, lon: 12.4534, zoom: 100000 },
    'Singapore': { lat: 1.3521, lon: 103.8198, zoom: 500000 },
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
    if (country && viewerRef.current && !viewerRef.current.isDestroyed()) {
      setIsSearching(true);
      
      // Ensure zoom is within safe limits
      const safeZoom = Math.max(Math.min(country.zoom, 40000000), 10000);
      
      viewerRef.current.scene.camera.flyTo({
        destination: Cartesian3.fromDegrees(country.lon, country.lat, safeZoom),
        duration: 2.5,
        orientation: {
          heading: 0.0,
          pitch: -0.5, // Look down at an angle
          roll: 0.0
        },
        complete: () => {
          setIsSearching(false);
          console.log(`Flown to ${countryName} at zoom level ${safeZoom}`);
        },
        cancel: () => {
          setIsSearching(false);
          console.log('Flight cancelled');
        }
      });
      setSearchTerm(countryName);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    // Set Cesium base URL to the copied assets
    window.CESIUM_BASE_URL = '/cesium/';
    
    let viewer;
    let handleFullscreenChange;
    
    // Small delay to ensure container is fully mounted
    const initTimeout = setTimeout(() => {
    
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
        fullscreenElement: cesiumContainer.current, // Pantalla completa solo para el mapa
        vrButton: false,
        creditContainer: document.createElement('div'),
      });
      
      // Store viewer reference for country search functionality
      viewerRef.current = viewer;
      
      // Add fullscreen change event listeners
      handleFullscreenChange = () => {
        // Resize viewer when entering/exiting fullscreen
        if (viewer && !viewer.isDestroyed()) {
          viewer.resize();
        }
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('msfullscreenchange', handleFullscreenChange);
      
      // Configure camera controls to prevent zoom issues
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableTranslate = true;
      viewer.scene.screenSpaceCameraController.enableZoom = true;
      viewer.scene.screenSpaceCameraController.enableTilt = true;
      viewer.scene.screenSpaceCameraController.enableLook = true;
      
      // Set zoom limits to prevent infinite zoom
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000;
      
      // Set initial view to show the whole Earth with stable position
      viewer.scene.camera.flyTo({
        destination: Cartesian3.fromDegrees(0, 20, 15000000),
        duration: 0.1, // Quick initial positioning
        complete: () => {
          // Camera is now stable
          console.log('Initial camera position set');
        }
      });
      
      // Add bloom location markers
      const bloomLocations = [
        { name: 'Amazon Rainforest', lat: -3.4653, lon: -62.2159, color: Color.HOTPINK },
        { name: 'Great Plains, USA', lat: 41.1, lon: -100.5, color: Color.GOLD },
        { name: 'Mediterranean Coast', lat: 43.3, lon: 5.4, color: Color.HOTPINK },
        { name: 'Sub-Saharan Africa', lat: 9.0, lon: 8.6, color: Color.SEAGREEN },
      ];
      
      bloomLocations.forEach(location => {
        const entity = viewer.entities.add({
          name: location.name, // Add name for identification
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

      // Add click event listener for entities
      if (onLocationSelect) {
        viewer.selectedEntityChanged.addEventListener(() => {
          const selectedEntity = viewer.selectedEntity;
          if (selectedEntity && selectedEntity.name) {
            onLocationSelect(selectedEntity.name);
          }
        });
      }
      
    } catch (error) {
      console.error('Cesium initialization error:', error);
    }
    
    }, 100); // Small delay to ensure container is ready
    
    return () => {
      // Clear timeout
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      
      // Remove fullscreen event listeners
      if (handleFullscreenChange) {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      }
      
      // Clean up viewer
      if (viewer && !viewer.isDestroyed()) {
        try {
          viewer.destroy();
        } catch (error) {
          console.warn('Error destroying Cesium viewer:', error);
        }
      }
      
      // Clear viewer reference
      if (viewerRef.current) {
        viewerRef.current = null;
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
            placeholder="🔍 Search for any country..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
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
      
      {/* Cesium Map Container */}
      <div
        ref={cesiumContainer}
        style={{ width: '100%', height: '100%', borderRadius: '1rem', overflow: 'hidden' }}
        id="cesiumContainer"
      />
    </div>
  );
};

export default CesiumMap;
