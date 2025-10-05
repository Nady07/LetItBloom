import React from 'react';
import '../styles/CropDetails.css';

const CropDetails = ({ countryData }) => {
  if (!countryData) return null;

  return (
    <div className="crop-details">
      <h4 className="crop-section-title">Información Agrícola</h4>
      
      <div className="crops-grid">
        {countryData.mainCrops.map((crop, index) => (
          <div key={index} className="crop-card">
            <h5 className="crop-name">{crop.name}</h5>
            <div className="crop-type">{crop.type}</div>
            <div className="crop-info">
              <div className="crop-detail">
                <span className="detail-label">Producción Anual:</span>
                <span className="detail-value">{crop.annualProduction}</span>
              </div>
              <div className="crop-detail">
                <span className="detail-label">Regiones Principales:</span>
                <span className="detail-value">{crop.mainRegions}</span>
              </div>
              <div className="crop-description">{crop.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="additional-info">
        <div className="info-item">
          <span className="info-label">Período de Cultivo:</span>
          <span className="info-value">{countryData.cultivationPeriod}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Tipos de Riego:</span>
          <span className="info-value">{countryData.irrigationTypes.join(", ")}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Iniciativas de Sostenibilidad:</span>
          <span className="info-value">{countryData.sustainabilityInitiatives}</span>
        </div>
      </div>
    </div>
  );
};

export default CropDetails;