const AK_PERENUAL = 'sk-L8Rk68e2229db88bc126g 93';

function buscarPlanta(plantName) {
    const query = plantName.trim();
    
    if (!query) {
        console.log('Por favor, ingresa el nombre de una planta.');
        return;
    }

    try {
      const rest = fetch(`https://perenual.com/api/species-list?key=${AK_PERENUAL}&q=${query}`);
      const data = rest.json();

      if (!data.data || data.data.length === 0) {
          console.log('No se encontraron plantas.');
          return;
      }

      data.data.forEach((plant) => {
        // const img = plant.default_image ? `<img src="${plant.default_image.medium_url}" alt="${plant.common_name || 'Imagen de planta'}" class="plant-image">` : '<div class="no-image">No hay imagen disponible</div>';
        const commonName = plant.common_name || 'Nombre común no disponible';
        const scientificName = plant.scientific_name || 'Nombre científico no disponible';
        const family = plant.family || 'Familia no disponible';
        const genus = plant.genus || 'Género no disponible';

        console.log(commonName, scientificName, family, genus);
      });
    } catch (error) {
        console.error('Error al buscar la planta:', error);
    }
} 

buscarPlanta('rose');

// buscarPlanta('tulip');