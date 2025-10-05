import React from 'react';
import '../styles/FlowerDetails.css';

const FlowerDetails = ({ flower }) => {
  if (!flower) return null;

  return (
    <div className="flower-details">
      {flower.imageUrl && (
        <div className="flower-image-container full-width">
          <div className="flower-image-wrapper">
            <img 
              src={flower.imageUrl} 
              alt={`${flower.name} - ${flower.scientificName}`} 
              className="flower-image"
              loading="lazy"
            />
          </div>
          <div className="flower-image-caption">
            <span className="flower-name">{flower.name}</span>
          </div>
        </div>
      )}
      
      <div className="mappage-detail-item full-width">
        <span className="mappage-detail-label">Scientific Name</span>
        <span className="mappage-detail-value">{flower.scientificName}</span>
      </div>
      
      {flower.type && (
        <div className="mappage-detail-item full-width">
          <span className="mappage-detail-label">Type</span>
          <span className="mappage-detail-value">{flower.type}</span>
        </div>
      )}

      <div className="mappage-detail-item full-width">
        <span className="mappage-detail-label">Country</span>
        <span className="mappage-detail-value">{flower.country || 'Various Regions'}</span>
      </div>

      <div className="mappage-detail-item full-width">
        <span className="mappage-detail-label">Description</span>
        <span className="mappage-detail-value">{flower.description}</span>
      </div>

      <div className="mappage-detail-item">
        <span className="mappage-detail-label">Color</span>
        <span className="mappage-detail-value">{flower.characteristics.color}</span>
      </div>

      <div className="mappage-detail-item">
        <span className="mappage-detail-label">Height</span>
        <span className="mappage-detail-value">{flower.characteristics.height}</span>
      </div>

      <div className="mappage-detail-item">
        <span className="mappage-detail-label">Blooming Season</span>
        <span className="mappage-detail-value">{flower.characteristics.bloomingSeason}</span>
      </div>

      <div className="mappage-detail-item full-width">
        <span className="mappage-detail-label">Habitat</span>
        <span className="mappage-detail-value">{flower.characteristics.habitat}</span>
      </div>
    </div>
  );
};

export default FlowerDetails;