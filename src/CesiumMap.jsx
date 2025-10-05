import React, { useRef, useEffect, useState } from 'react';
import {
  Viewer,
  Cartesian3,
  Color,
  Cartographic,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from 'cesium';
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
  'Argentina': { lat: -38.4161, lon: -63.6167, zoom: 5000000 },
  'Australia': { lat: -25.2744, lon: 133.7751, zoom: 7000000 },
  'Brazil': { lat: -14.2350, lon: -51.9253, zoom: 6000000 },
  'Canada': { lat: 56.1304, lon: -106.3468, zoom: 8000000 },
  'China': { lat: 35.8617, lon: 104.1954, zoom: 7000000 },
  'Egypt': { lat: 26.8206, lon: 30.8025, zoom: 3000000 },
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
  'Iceland': { lat: 64.9631, lon: -19.0208, zoom: 1500000 },
  'Bolivia': { lat: -16.2902, lon: -63.5887, zoom: 3000000 },
  'Paraguay': { lat: -23.4425, lon: -58.4438, zoom: 2500000 },
  'Uruguay': { lat: -32.5228, lon: -55.7658, zoom: 2000000 },
  'Ecuador': { lat: -1.8312, lon: -78.1834, zoom: 2500000 },
  'Venezuela': { lat: 6.4238, lon: -66.5897, zoom: 3000000 },
  'Panama': { lat: 8.5379, lon: -80.7821, zoom: 1500000 },
  'Costa Rica': { lat: 9.7489, lon: -83.7534, zoom: 1500000 },
  'Cuba': { lat: 21.5218, lon: -77.7812, zoom: 2000000 },
  'Dominican Republic': { lat: 18.7357, lon: -70.1627, zoom: 1500000 },
  'Honduras': { lat: 15.2000, lon: -86.2419, zoom: 1500000 },
  'Guatemala': { lat: 15.7835, lon: -90.2308, zoom: 1500000 },
  'El Salvador': { lat: 13.7942, lon: -88.8965, zoom: 1500000 },
  'Nicaragua': { lat: 12.8654, lon: -85.2072, zoom: 1500000 },
  'Pakistan': { lat: 30.3753, lon: 69.3451, zoom: 4000000 },
  'Bangladesh': { lat: 23.6850, lon: 90.3563, zoom: 2000000 },
  'Nepal': { lat: 28.3949, lon: 84.1240, zoom: 1500000 },
  'Sri Lanka': { lat: 7.8731, lon: 80.7718, zoom: 1500000 },
  'Saudi Arabia': { lat: 23.8859, lon: 45.0792, zoom: 5000000 },
  'United Arab Emirates': { lat: 23.4241, lon: 53.8478, zoom: 1500000 },
  'Israel': { lat: 31.0461, lon: 34.8516, zoom: 1000000 },
  'Turkey': { lat: 38.9637, lon: 35.2433, zoom: 3000000 },
  'Iran': { lat: 32.4279, lon: 53.6880, zoom: 4000000 },
  'Iraq': { lat: 33.2232, lon: 43.6793, zoom: 2500000 },
  'Greece': { lat: 39.0742, lon: 21.8243, zoom: 1500000 },
  'Poland': { lat: 51.9194, lon: 19.1451, zoom: 2000000 },
  'Switzerland': { lat: 46.8182, lon: 8.2275, zoom: 1000000 },
  'Austria': { lat: 47.5162, lon: 14.5501, zoom: 1000000 },
  'Netherlands': { lat: 52.1326, lon: 5.2913, zoom: 1000000 },
  'Belgium': { lat: 50.5039, lon: 4.4699, zoom: 1000000 },
  'Denmark': { lat: 56.2639, lon: 9.5018, zoom: 1000000 },
  'Ireland': { lat: 53.4129, lon: -8.2439, zoom: 1000000 },
  'South Korea': { lat: 35.9078, lon: 127.7669, zoom: 2000000 },
  'North Korea': { lat: 40.3399, lon: 127.5101, zoom: 2000000 },
  'Philippines': { lat: 12.8797, lon: 121.7740, zoom: 3000000 },
  'Malaysia': { lat: 4.2105, lon: 101.9758, zoom: 2500000 },
  'Singapore': { lat: 1.3521, lon: 103.8198, zoom: 500000 },
  'Morocco': { lat: 31.7917, lon: -7.0926, zoom: 2500000 },
  'Algeria': { lat: 28.0339, lon: 1.6596, zoom: 4000000 },
  'Ethiopia': { lat: 9.1450, lon: 40.4897, zoom: 3000000 },
  'Ghana': { lat: 7.9465, lon: -1.0232, zoom: 2000000 },
  'Tanzania': { lat: -6.3690, lon: 34.8888, zoom: 3000000 }
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
        },
        cancel: () => {
          setIsSearching(false);
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
    let clickHandler;
    try {
      viewer = new Viewer(cesiumContainer.current, {
        terrainProvider: undefined,
        timeline: false,
        animation: false,
        baseLayerPicker: true,
        geocoder: false,
        homeButton: false,
        sceneModePicker: true,
        navigationHelpButton: true,
        infoBox: true,
        selectionIndicator: true,
        fullscreenButton: true,
        vrButton: false,
        creditContainer: document.createElement('div')
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

    // Add click interaction: when zoomed out, fly into clicked point and report lat/lon upwards
    const setupClickHandler = () => {
      if (!viewer || viewer.isDestroyed()) return;
      const scene = viewer.scene;
      const ellipsoid = scene.globe.ellipsoid;

      clickHandler = new ScreenSpaceEventHandler(scene.canvas);
      clickHandler.setInputAction((movement) => {
        try {
          if (!viewer || viewer.isDestroyed()) return;

          // Convert screen click to a point on the ellipsoid
          const cartesian = viewer.camera.pickEllipsoid(movement.position, ellipsoid);
          if (!cartesian) return;

          const cartographic = Cartographic.fromCartesian(cartesian);
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const lon = CesiumMath.toDegrees(cartographic.longitude);

          // Current camera height
          const camHeight = ellipsoid.cartesianToCartographic(viewer.camera.position).height;
          const FAR_ZOOM = 2_000_000; // 2,000 km
          const TARGET_HEIGHT = 800_000; // 800 km

          // If currently far, fly closer to the clicked point
          if (camHeight > FAR_ZOOM) {
            viewer.scene.camera.flyTo({
              destination: Cartesian3.fromDegrees(lon, lat, TARGET_HEIGHT),
              duration: 1.5,
              maximumHeight: camHeight,
            });
          }

          // Notify parent with lat/lon so UI can show it
          if (onLocationSelect) {
            onLocationSelect({ name: 'Selected point', lat, lon, zoom: Math.min(camHeight, TARGET_HEIGHT) });
          }
        } catch (e) {
          console.warn('Error handling globe click:', e);
        }
      }, ScreenSpaceEventType.LEFT_CLICK);
    };

    setupClickHandler();

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      if (clickHandler && !clickHandler.isDestroyed?.()) {
        try { clickHandler.destroy(); } catch {}
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
      
      {/* Cesium Map Container */}
      <div ref={cesiumContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CesiumMap;