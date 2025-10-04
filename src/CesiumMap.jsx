import React, { useRef, useEffect } from 'react';
import { Viewer, Cartesian3 } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const CesiumMap = () => {
  const cesiumContainer = useRef(null);

  useEffect(() => {
    let viewer;
    try {
      viewer = new Viewer(cesiumContainer.current, {
        terrainProvider: undefined,
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
        fullscreenButton: false,
        vrButton: false,
      });
      
      // Add simple markers
      viewer.entities.add({
        position: Cartesian3.fromDegrees(-62.2159, -3.4653),
        point: {
          pixelSize: 15,
          color: '#FF69B4',
          outlineColor: '#FFFFFF',
          outlineWidth: 2,
        },
        label: {
          text: 'Amazon Rainforest',
          font: '12pt sans-serif',
          fillColor: '#FFFFFF',
          outlineColor: '#000000',
          outlineWidth: 2,
          style: 1,
          pixelOffset: { x: 0, y: -40 }
        }
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
    <div
      ref={cesiumContainer}
      style={{ width: '100%', height: '60vh', borderRadius: '1rem', overflow: 'hidden' }}
      id="cesiumContainer"
    />
  );
};

export default CesiumMap;
