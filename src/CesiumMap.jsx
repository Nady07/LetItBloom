import React, { useRef, useEffect, useState } from 'react';
import {
  Viewer,
  Cartesian3,
  Color,
  Cartographic,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  WebMapTileServiceImageryProvider,
  OpenStreetMapImageryProvider,
  GeoJsonDataSource,
  JulianDate,
  ArcType
} from 'cesium';
import { Search, MapPin } from 'lucide-react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const GIBS_ENDPOINT = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi';
const GIBS_PRODUCTS = {
  viirs: {
    label: 'VIIRS TrueColor',
    layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    tileMatrixSetID: 'GoogleMapsCompatible_Level9',
    style: 'default',
    format: 'image/jpeg',
    maxLevel: 9,
    type: 'truecolor'
  },
  evi8: {
    label: 'MODIS EVI (8-day)',
    layer: 'MODIS_Terra_EVI_8Day',
    tileMatrixSetID: 'GoogleMapsCompatible_Level9',
    style: 'default',
    format: 'image/png',
    maxLevel: 9,
    type: 'index'
  }
};

const CesiumMap = ({ onLocationSelect, baseLayer = 'viirs', showCountryBorders = true }) => {
  // force fallback if incoming baseLayer is not supported anymore
  const effectiveBase = GIBS_PRODUCTS[baseLayer] ? baseLayer : 'viirs';

  const cesiumContainer = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('');
  const viewerRef = useRef(null);
  const bordersDataSourceRef = useRef(null);
  const hoverHighlightRef = useRef(null);
  const imageryLayerRef = useRef(null);

  // Database of countries with coordinates (subset)
  const countries = {
    'Argentina': { lat: -38.4161, lon: -63.6167, zoom: 5000000 },
    'Australia': { lat: -25.2744, lon: 133.7751, zoom: 7000000 },
    'Bolivia': { lat: -16.2902, lon: -63.5887, zoom: 3500000 },
    'Brazil': { lat: -14.2350, lon: -51.9253, zoom: 6000000 },
    'Canada': { lat: 56.1304, lon: -106.3468, zoom: 8000000 },
    'Chile': { lat: -35.6751, lon: -71.5430, zoom: 4000000 },
    'China': { lat: 35.8617, lon: 104.1954, zoom: 7000000 },
    'Colombia': { lat: 4.5709, lon: -74.2973, zoom: 3000000 },
    'Cuba': { lat: 21.5218, lon: -77.7812, zoom: 1500000 },
    'Dominican Republic': { lat: 18.7357, lon: -70.1627, zoom: 1000000 },
    'Ecuador': { lat: -1.8312, lon: -78.1834, zoom: 2000000 },
    'Egypt': { lat: 26.0975, lon: 30.0444, zoom: 3000000 },
    'France': { lat: 46.6034, lon: 1.8883, zoom: 2000000 },
    'Germany': { lat: 51.1657, lon: 10.4515, zoom: 2000000 },
    'India': { lat: 20.5937, lon: 78.9629, zoom: 5000000 },
    'Indonesia': { lat: -0.7893, lon: 113.9213, zoom: 5000000 },
    'Italy': { lat: 41.8719, lon: 12.5674, zoom: 2000000 },
    'Jamaica': { lat: 18.1096, lon: -77.2975, zoom: 800000 },
    'Japan': { lat: 36.2048, lon: 138.2529, zoom: 3000000 },
    'Kenya': { lat: -0.0236, lon: 37.9062, zoom: 2000000 },
    'Mexico': { lat: 23.6345, lon: -102.5528, zoom: 4000000 },
    'New Zealand': { lat: -40.9006, lon: 174.8860, zoom: 3000000 },
    'Nigeria': { lat: 9.0820, lon: 8.6753, zoom: 3000000 },
    'Norway': { lat: 60.4720, lon: 8.4689, zoom: 3000000 },
    'Panama': { lat: 8.5380, lon: -80.7821, zoom: 1200000 },
    'Paraguay': { lat: -23.4425, lon: -58.4438, zoom: 2500000 },
    'Peru': { lat: -9.1900, lon: -75.0152, zoom: 4000000 },
    'Russia': { lat: 61.5240, lon: 105.3188, zoom: 10000000 },
    'South Africa': { lat: -30.5595, lon: 22.9375, zoom: 4000000 },
    'Spain': { lat: 40.4637, lon: -3.7492, zoom: 2000000 },
    'Sweden': { lat: 60.1282, lon: 18.6435, zoom: 3000000 },
    'Finland': { lat: 61.9241, lon: 25.7482, zoom: 2500000 },
    'Iceland': { lat: 64.9631, lon: -19.0208, zoom: 1500000 },
    'Thailand': { lat: 15.8700, lon: 100.9925, zoom: 2500000 },
    'United Kingdom': { lat: 55.3781, lon: -3.4360, zoom: 2000000 },
    'United States': { lat: 37.0902, lon: -95.7129, zoom: 6000000 },
    'Uruguay': { lat: -32.5228, lon: -55.7658, zoom: 1500000 },
    'Venezuela': { lat: 6.4238, lon: -66.5897, zoom: 3000000 },
    'Vietnam': { lat: 14.0583, lon: 108.2772, zoom: 2500000 }
  };

  // Search functionality
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

  // Helper: get most recent date string (YYYY-MM-DD)
  const computeRecentDate = () => {
    const now = new Date();
    // GIBS suele tener un retardo de ~1 día; tomamos hoy-1
    const d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Build GIBS provider for a given product id
  const buildGibsProvider = (productKey, dateStr) => {
    const prod = GIBS_PRODUCTS[productKey] || GIBS_PRODUCTS.viirs;
    return new WebMapTileServiceImageryProvider({
      url: GIBS_ENDPOINT,
      layer: prod.layer,
      style: prod.style,
      format: prod.format,
      tileMatrixSetID: prod.tileMatrixSetID,
      maximumLevel: prod.maxLevel,
      tileWidth: 256,
      tileHeight: 256,
      credit: 'NASA GIBS',
      // Many 8-day composites require exact dates; omit TIME to get latest for index layers
      dimensions: (productKey === 'viirs' && dateStr) ? { time: dateStr } : undefined,
    });
  };

  // Swap base imagery layer
  const setBaseImagery = (viewer, key, dateStr) => {
    try {
      const newProvider = buildGibsProvider(key, dateStr);
      // Place above OSM fallback (index 1)
      const newLayer = viewer.imageryLayers.addImageryProvider(newProvider, 1);
      newLayer.alpha = 1.0;
      newLayer.brightness = 1.0;
      // If provider throws tile errors (e.g., 400 on TIME), fallback to provider without TIME
      try {
        newProvider.errorEvent?.addEventListener(() => {
          try {
            viewer.imageryLayers.remove(newLayer, true);
          } catch {}
          const fallbackProvider = buildGibsProvider(key, undefined);
          const fallbackLayer = viewer.imageryLayers.addImageryProvider(fallbackProvider, 1);
          imageryLayerRef.current = fallbackLayer;
          // Mark badge as latest
          setCurrentDateStr('latest');
        });
      } catch {}
      if (imageryLayerRef.current && !viewer.isDestroyed()) {
        try { viewer.imageryLayers.remove(imageryLayerRef.current, true); } catch {}
      }
      imageryLayerRef.current = newLayer;
    } catch (e) {
      console.warn('Error setting base imagery, keeping OSM fallback visible.', e);
    }
  };

  useEffect(() => {
    // Ensure Cesium assets path is set at runtime for Workers/Widgets
    try {
      if (!window.CESIUM_BASE_URL) {
        window.CESIUM_BASE_URL = '/cesium/';
      }
    } catch {}

    let viewer;
    let clickHandler;
    let moveHandler;

    try {
      viewer = new Viewer(cesiumContainer.current, {
        terrainProvider: undefined,
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: true,
        sceneModePicker: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
        fullscreenButton: true,
        vrButton: false,
        creditContainer: document.createElement('div')
      });

      viewerRef.current = viewer;

      // Initial camera
      viewer.scene.camera.setView({
        destination: Cartesian3.fromDegrees(0, 10, 16000000)
      });

      // Remove any default imagery
      try {
        const layers = viewer.imageryLayers;
        while (layers.length > 0) {
          layers.remove(layers.get(0), true);
        }
        const osm = new OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' });
        layers.addImageryProvider(osm, 0);
      } catch {}

      // Set initial GIBS imagery
      const dateStr = computeRecentDate();
      setCurrentDateStr(dateStr);
      setBaseImagery(viewer, baseLayer, dateStr);



      // Click handler (entities first, else globe lat/lon)
      const scene = viewer.scene;
      const ellipsoid = scene.globe.ellipsoid;

      clickHandler = new ScreenSpaceEventHandler(scene.canvas);
      clickHandler.setInputAction((movement) => {
        try {
          // 1) Try picking an entity (e.g., country polygon)
          const picked = scene.pick(movement.position);
          if (picked && picked.id && picked.id.polygon) {
            const entity = picked.id;
            viewer.flyTo(entity, { duration: 1.7 });
            const name = entity.properties?.name?.getValue?.() || entity.name || 'Country';
            // Prefer exact click position lat/lon (more representativo); fallback a centroide
            let lat, lon;
            try {
              const cartesian = viewer.camera.pickEllipsoid(movement.position, ellipsoid);
              if (cartesian) {
                const cartographic = Cartographic.fromCartesian(cartesian);
                lat = CesiumMath.toDegrees(cartographic.latitude);
                lon = CesiumMath.toDegrees(cartographic.longitude);
              }
            } catch {}
            if (lat == null || lon == null) {
              try {
                const h = entity.polygon.hierarchy?.getValue?.(JulianDate.now());
                const positions = h?.positions;
                if (positions && positions.length >= 3) {
                  let sumLat = 0, sumLon = 0;
                  for (const p of positions) {
                    const c = Cartographic.fromCartesian(p);
                    sumLat += CesiumMath.toDegrees(c.latitude);
                    sumLon += CesiumMath.toDegrees(c.longitude);
                  }
                  lat = sumLat / positions.length;
                  lon = sumLon / positions.length;
                }
              } catch {}
            }
            if (onLocationSelect) {
              onLocationSelect({ name, lat, lon });
            }
            return;
          }

          // 2) Otherwise, treat as globe click and compute lat/lon
          const cartesian = viewer.camera.pickEllipsoid(movement.position, ellipsoid);
          if (!cartesian) return;
          const cartographic = Cartographic.fromCartesian(cartesian);
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const lon = CesiumMath.toDegrees(cartographic.longitude);
          const camHeight = ellipsoid.cartesianToCartographic(viewer.camera.position).height;
          const FAR_ZOOM = 2_000_000;
          const TARGET_HEIGHT = 800_000;
          if (camHeight > FAR_ZOOM) {
            viewer.scene.camera.flyTo({
              destination: Cartesian3.fromDegrees(lon, lat, TARGET_HEIGHT),
              duration: 1.5,
              maximumHeight: camHeight,
            });
          }
          if (onLocationSelect) {
            onLocationSelect({ name: 'Selected point', lat, lon, zoom: Math.min(camHeight, TARGET_HEIGHT) });
          }
        } catch (e) { console.warn('Error handling click:', e); }
      }, ScreenSpaceEventType.LEFT_CLICK);

      // Load Natural Earth borders (multi-source with fallback)
      const loadBorders = async () => {
        const sources = [
          'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
          'https://cdn.jsdelivr.net/npm/@geo-maps/countries-50m@1/geojson/countries.geo.json',
          '/data/ne_countries_50m.min.geojson'
        ];
        let ds = null;
        for (const url of sources) {
          try {
            ds = await GeoJsonDataSource.load(url, {
              // Avoid stroke/outline to prevent expensive polygon outline geometry
              fill: Color.fromCssColorString('rgba(46,139,87,0.08)'),
              clampToGround: false,
            });
            break;
          } catch (e) {
            console.warn('Border source failed, trying next:', url, e);
          }
        }
        if (!ds) {
          console.warn('No borders dataset could be loaded.');
          return;
        }
        bordersDataSourceRef.current = ds;
        try {
          ds.entities.values.forEach((ent) => {
            if (!ent.polygon) return;
            const props = ent.properties;
            const name = (props?.ADMIN?.getValue?.())
              || (props?.NAME?.getValue?.())
              || (props?.NAME_LONG?.getValue?.())
              || (props?.name?.getValue?.())
              || (props?.NAME_EN?.getValue?.())
              || ent.name
              || 'Country';
            ent.name = name;
            ent.description = `
              <div style="font-family: system-ui, sans-serif; font-size: 14px;">
                <strong>Country:</strong> ${name}
                <div style="opacity:.8; margin-top:6px;">Click to fly to this country</div>
              </div>`;
            // Disable outlines to avoid worker crashes; use geodesic arcs and reduce subdivisions
            ent.polygon.outline = false;
            ent.polygon.material = Color.fromCssColorString('rgba(46,139,87,0.08)');
            ent.polygon.arcType = ArcType.GEODESIC;
            ent.polygon.granularity = CesiumMath.RADIANS_PER_DEGREE; // fewer segments

            // Guard against invalid/degenerate rings
            try {
              const h = ent.polygon.hierarchy?.getValue?.(JulianDate.now());
              const positions = h?.positions;
              if (!positions || positions.length < 3) {
                ent.show = false;
              }
            } catch {}
          });
        } catch {}
        if (showCountryBorders) {
          try { viewer.dataSources.add(ds); } catch {}
        }
      };
      loadBorders();

      // Hover highlight via mouse move
      moveHandler = new ScreenSpaceEventHandler(scene.canvas);
      moveHandler.setInputAction((movement) => {
        try {
          const picked = scene.pick(movement.endPosition);
          // Reset previous
          if (hoverHighlightRef.current && hoverHighlightRef.current.polygon) {
            hoverHighlightRef.current.polygon.material = Color.fromCssColorString('rgba(46,139,87,0.08)');
            hoverHighlightRef.current.polygon.outlineColor = Color.fromCssColorString('rgba(255,255,255,0.85)');
          }
          hoverHighlightRef.current = null;
          if (picked && picked.id && picked.id.polygon) {
            hoverHighlightRef.current = picked.id;
            picked.id.polygon.material = Color.fromCssColorString('rgba(255,215,0,0.25)');
            picked.id.polygon.outlineColor = Color.GOLD;
            try { viewer.container.style.cursor = 'pointer'; } catch {}
          } else {
            try { viewer.container.style.cursor = 'default'; } catch {}
          }
        } catch {}
      }, ScreenSpaceEventType.MOUSE_MOVE);

      // (Removed duplicate LEFT_CLICK binding; merged above)

    } catch (error) {
      console.error('Cesium initialization error:', error);
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        try { viewer.destroy(); } catch {}
      }
      if (clickHandler && !clickHandler.isDestroyed?.()) {
        try { clickHandler.destroy(); } catch {}
      }
      if (moveHandler && !moveHandler.isDestroyed?.()) {
        try { moveHandler.destroy(); } catch {}
      }
    };
  }, []);

  // React to baseLayer changes
  useEffect(() => {
    if (!viewerRef.current || viewerRef.current.isDestroyed()) return;
    const dateStr = currentDateStr || computeRecentDate();
    setBaseImagery(viewerRef.current, effectiveBase, dateStr);
  }, [baseLayer]);

  // React to showCountryBorders toggle
  useEffect(() => {
    const viewer = viewerRef.current;
    const ds = bordersDataSourceRef.current;
    if (!viewer || !ds) return;
    try {
      if (showCountryBorders) {
        if (!viewer.dataSources.contains(ds)) viewer.dataSources.add(ds);
      } else {
        if (viewer.dataSources.contains(ds)) viewer.dataSources.remove(ds, false);
      }
    } catch {}
  }, [showCountryBorders]);

  const activeProduct = GIBS_PRODUCTS[effectiveBase] || GIBS_PRODUCTS.viirs;
  const showLegend = activeProduct.type === 'index';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Search bar */}
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

      {/* Active layer badge */}
      {currentDateStr && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
          NASA GIBS: {currentDateStr} · {activeProduct.label}
        </div>
      )}
      {showLegend && (
        <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '8px 10px', borderRadius: 8, fontSize: 12, maxWidth: 240 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{activeProduct.label}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
            <span>Bajo</span>
            <div style={{ width: 120, height: 10, background: 'linear-gradient(90deg,#8B4513,#F1C232,#92D050,#006400)' }} />
            <span>Alto</span>
          </div>
          <div style={{ opacity: 0.9, marginTop: 6 }}>Índice de vegetación (EVI)</div>
        </div>
      )}

      {/* Map container */}
      <div ref={cesiumContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CesiumMap;