import React, { useState } from 'react';
import { ArrowLeft, Info, Layers, Globe2, Satellite, Map, ChevronLeft, ChevronRight } from 'lucide-react';
import CesiumMap from './CesiumMap';
import './MapPage.css';
import { getDailyPoint, getDateRangeLastNDays, getMonthlyClimatology } from './services/nasaPower';
import { predictBloomIndex, extractCurrentConditions, indexLabel, assessIdealConditions } from './utils/bloomModel';

const MapPage = ({ onBackToHome }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [aborter, setAborter] = useState(null);
  const [currentFlowerPage, setCurrentFlowerPage] = useState(0);

  // Base de datos de países con flores y cultivos más representativos
  const countryFloralData = {
    'Brazil': {
      flag: '🇧🇷',
      climate: 'Tropical y Subtropical',
      biomes: 'Amazonia, Cerrado, Mata Atlántica, Caatinga',
      topFlowers: [
        {
          name: 'Ipê Amarelo',
          scientificName: 'Handroanthus albus (Cham.) Mattos',
          family: 'Bignoniaceae',
          distribution: 'Cerrado y Mata Atlántica de Brasil',
          altitude: '200 - 1,200 metros sobre el nivel del mar',
          nativeCountries: 'Brasil, Paraguay, Bolivia',
          season: 'Julio - Septiembre (época seca)',
          habitat: 'Cerrado y Mata Atlántica, suelos bien drenados',
          description: 'Árbol nacional de Brasil, flores amarillas en racimos terminales',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Tabebuia_chrysotricha_%28Ipê_amarelo%29.jpg/320px-Tabebuia_chrysotricha_%28Ipê_amarelo%29.jpg',
          uses: 'Árbol nacional, ornamental, medicina tradicional, madera noble',
          height: '8-16 metros de altura',
          leaves: 'Compuestas, digitadas, 5-7 folíolos',
          flowers: 'Amarillas tubulares, 4-6 cm, en racimos',
          flowering: 'Julio a septiembre (antes de las lluvias)',
          pollination: 'Abejas y mariposas',
          climate: 'Tropical savana, resistente a sequía',
          temperature: '18-28°C',
          precipitation: '800-1,500 mm anuales',
          soil: 'Franco-arenoso, pH 5.5-7.0, bien drenado',
          propagation: 'Semillas (90% germinación), estacas',
          germination: '85-95% en condiciones controladas',
          growth: 'Moderado a rápido (40-80 cm/año)',
          longevity: '80-150 años en condiciones naturales'
        },
        {
          name: 'Victoria Amazónica',
          scientificName: 'Victoria amazonica (Poepp.) J.C.Sowerby',
          family: 'Nymphaeaceae',
          distribution: 'Cuenca amazónica de Brasil, Perú, Bolivia',
          altitude: '50 - 200 metros sobre el nivel del mar',
          nativeCountries: 'Brasil, Perú, Bolivia, Colombia, Venezuela',
          season: 'Todo el año (floración nocturna)',
          habitat: 'Lagos y remansos amazónicos, aguas tranquilas',
          description: 'Nenúfar gigante con hojas de hasta 3 metros de diámetro',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Victoria_amazonica_flower.jpg/320px-Victoria_amazonica_flower.jpg',
          uses: 'Ornamental acuática, símbolo amazónico, investigación',
          height: 'Acuática flotante',
          leaves: 'Circulares, 1-3 metros diámetro, bordes elevados',
          flowers: 'Blancas a rosadas, 20-40 cm, nocturnas',
          flowering: 'Todo el año, apertura nocturna por 2 días',
          pollination: 'Escarabajos (termogénesis)',
          climate: 'Tropical húmedo amazónico',
          temperature: '24-30°C (agua y aire)',
          precipitation: '2,000-3,000 mm anuales',
          soil: 'Sedimentos ricos, pH 6.0-7.5',
          propagation: 'Semillas (requieren agua caliente)',
          germination: '60-80% en condiciones ideales',
          growth: 'Muy rápido en época húmeda',
          longevity: '10-15 años en cultivo'
        },
        {
          name: 'Orquídea Cattleya',
          scientificName: 'Cattleya labiata Lindl.',
          family: 'Orchidaceae',
          distribution: 'Mata Atlántica de Brasil',
          altitude: '200 - 1,000 metros sobre el nivel del mar',
          nativeCountries: 'Brasil (endémica)',
          season: 'Septiembre - Noviembre (estación seca)',
          habitat: 'Epífita en bosques húmedos de Mata Atlántica',
          description: 'Flor nacional de Brasil, orquídea de gran belleza y fragancia',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Cattleya_labiata_Lindl._1821.jpg/320px-Cattleya_labiata_Lindl._1821.jpg',
          uses: 'Flor nacional, ornamental, cultivo comercial, perfumería',
          height: 'Epífita, pseudobulbos de 15-25 cm',
          leaves: '1-2 hojas coriáceas por pseudobulbo',
          flowers: 'Lilas a púrpuras, 15-20 cm, muy fragantes',
          flowering: 'Septiembre a noviembre, una vez por año',
          pollination: 'Abejas euglosinas específicas',
          climate: 'Tropical húmedo, neblinas matutinas',
          temperature: '18-25°C (días), 15-20°C (noches)',
          precipitation: '1,200-2,000 mm anuales',
          soil: 'Epífita, sustrato drenante, musgo y corteza',
          propagation: 'División de pseudobulbos, cultivo in vitro',
          germination: 'Simbiótica con hongos micorriza',
          growth: 'Lento, 1-2 pseudobulbos nuevos por año',
          longevity: '20-50 años en cultivo adecuado'
        }
      ]
    },
    'Colombia': {
      flag: '🇨🇴',
      climate: 'Tropical ecuatorial',
      biomes: 'Amazonía, Andes, Costa Caribe, Llanos',
      topFlowers: [
        {
          name: 'Orquídea Cattleya Trianae',
          scientificName: 'Cattleya trianae',
          season: 'Diciembre - Abril',
          habitat: 'Cordilleras andinas, 1000-2000m',
          description: 'Flor nacional de Colombia, colores de la bandera',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Cattleya_trianae_1.jpg/320px-Cattleya_trianae_1.jpg',
          uses: 'Símbolo nacional, ornamental, exportación'
        },
        {
          name: 'Frailejón',
          scientificName: 'Espeletia grandiflora',
          season: 'Octubre - Febrero',
          habitat: 'Páramos andinos, 3000-4000m',
          description: 'Planta endémica de páramos, flores amarillas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Espeletia_grandiflora.jpg/320px-Espeletia_grandiflora.jpg',
          uses: 'Regulador hídrico, medicina tradicional'
        },
        {
          name: 'Heliconia Rostrata',
          scientificName: 'Heliconia rostrata',
          season: 'Todo el año',
          habitat: 'Selvas húmedas, 0-1500m',
          description: 'Ave del paraíso tropical, colores vibrantes',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Heliconia_rostrata_1.jpg/320px-Heliconia_rostrata_1.jpg',
          uses: 'Ornamental, ecoturismo, artesanías'
        }
      ]
    },
    'Ethiopia': {
      flag: '🇪🇹',
      climate: 'Tropical de montaña',
      biomes: 'Altiplano etíope, Sabanas, Bosques montanos',
      topFlowers: [
        {
          name: 'Rosa de Etiopía',
          scientificName: 'Rosa abyssinica',
          season: 'Octubre - Febrero',
          habitat: 'Montañas etíopes, 2000-3500m',
          description: 'Rosa silvestre endémica, flores blancas fragantes',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Rosa_abyssinica.jpg/320px-Rosa_abyssinica.jpg',
          uses: 'Ornamental, medicina tradicional, perfumería'
        },
        {
          name: 'Protea Etíope',
          scientificName: 'Protea gaguedi',
          season: 'Abril - Agosto',
          habitat: 'Altiplanos, 1500-3000m',
          description: 'Flores exóticas en forma de copa, colores intensos',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Protea_gaguedi.jpg/320px-Protea_gaguedi.jpg',
          uses: 'Ornamental, exportación, arreglos florales'
        },
        {
          name: 'Jazmín Etíope',
          scientificName: 'Jasminum abyssinicum',
          season: 'Marzo - Junio',
          habitat: 'Bosques húmedos, 1000-2500m',
          description: 'Flores blancas muy aromáticas, trepadora',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Jasminum_abyssinicum.jpg/320px-Jasminum_abyssinicum.jpg',
          uses: 'Ceremonia del café, perfumería, medicina'
        }
      ]
    },
    'Vietnam': {
      flag: '🇻🇳',
      climate: 'Tropical monzónico',
      biomes: 'Deltas de ríos, Montañas, Costas',
      topFlowers: [
        {
          name: 'Loto Sagrado',
          scientificName: 'Nelumbo nucifera',
          season: 'Mayo - Agosto',
          habitat: 'Lagos y estanques, deltas',
          description: 'Flor nacional de Vietnam, símbolo de pureza',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Sacred_lotus_Nelumbo_nucifera.jpg/320px-Sacred_lotus_Nelumbo_nucifera.jpg',
          uses: 'Símbolo cultural, alimentación, medicina'
        },
        {
          name: 'Flor de Cerezo Vietnamita',
          scientificName: 'Prunus campanulata',
          season: 'Enero - Marzo',
          habitat: 'Montañas del norte, 800-1500m',
          description: 'Cerezo rosa brillante, floración espectacular',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Prunus_campanulata_flowers.jpg/320px-Prunus_campanulata_flowers.jpg',
          uses: 'Ornamental, turismo, festivales'
        },
        {
          name: 'Frangipani',
          scientificName: 'Plumeria rubra',
          season: 'Marzo - Octubre',
          habitat: 'Zonas costeras y jardines',
          description: 'Flores fragantes blancas y amarillas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Plumeria_rubra_flowers.jpg/320px-Plumeria_rubra_flowers.jpg',
          uses: 'Ornamental, perfumería, medicina tradicional'
        }
      ]
    },
    'Indonesia': {
      flag: '🇮🇩',
      climate: 'Tropical ecuatorial',
      biomes: 'Selvas tropicales, Volcanes, Archipiélagos',
      topFlowers: [
        {
          name: 'Rafflesia Arnoldii',
          scientificName: 'Rafflesia arnoldii',
          season: 'Todo el año (impredecible)',
          habitat: 'Selvas de Sumatra y Borneo',
          description: 'Flor más grande del mundo, hasta 1 metro',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rafflesia_arnoldii_flower.jpg/320px-Rafflesia_arnoldii_flower.jpg',
          uses: 'Atracción turística, conservación, investigación'
        },
        {
          name: 'Orquídea Vanda',
          scientificName: 'Vanda tricolor',
          season: 'Agosto - Octubre',
          habitat: 'Bosques húmedos de Java',
          description: 'Orquídea epífita con flores multicolor',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vanda_tricolor_orchid.jpg/320px-Vanda_tricolor_orchid.jpg',
          uses: 'Ornamental, exportación, cultivo comercial'
        },
        {
          name: 'Bunga Bangkai',
          scientificName: 'Amorphophallus titanum',
          season: 'Cada 7-10 años',
          habitat: 'Selvas de Sumatra',
          description: 'Inflorescencia gigante, olor peculiar',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Amorphophallus_titanum_flower.jpg/320px-Amorphophallus_titanum_flower.jpg',
          uses: 'Investigación botánica, jardines botánicos'
        }
      ]
    },
    'Honduras': {
      flag: '🇭🇳',
      rank: 6,
      production: '3.8% mundial (≈6.5 millones de sacos)',
      regions: 'Copán, Opalaca, Montecillos, Comayagua, Agalta',
      varieties: 'Catuaí, Bourbon, Caturra, Típica, IHCAFE 90',
      altitude: '1,000-1,700 msnm',
      harvest: 'Diciembre - Abril',
      processing: 'Lavado (Washed), Honey, Natural',
      cupProfile: 'Chocolate, caramelo, frutas tropicales, acidez media',
      certifications: 'Fair Trade, Organic, Rainforest Alliance'
    },
    'Peru': {
      flag: '🇵🇪',
      rank: 7,
      production: '2.8% mundial (≈4.8 millones de sacos)',
      regions: 'Cajamarca, Amazonas, San Martín, Junín, Cusco',
      varieties: 'Típica, Bourbon, Caturra, Catimor, Pache',
      altitude: '1,200-2,200 msnm',
      harvest: 'Marzo - Septiembre',
      processing: 'Lavado (Washed), Natural, Honey',
      cupProfile: 'Chocolate, nueces, cítricos, cuerpo medio',
      certifications: 'Fair Trade (70% mundial), Organic, UTZ'
    },
    'Guatemala': {
      flag: '🇬🇹',
      rank: 9,
      production: '2.4% mundial (≈4.1 millones de sacos)',
      regions: 'Antigua, Huehuetenango, Cobán, Atitlán, San Marcos',
      varieties: 'Bourbon, Caturra, Catuaí, Típica, Pache',
      altitude: '1,300-2,000 msnm',
      harvest: 'Diciembre - Marzo',
      processing: 'Lavado (Washed), Natural, Honey',
      cupProfile: 'Chocolate, especias, cítricos, cuerpo completo',
      certifications: 'Fair Trade, Organic, Rainforest Alliance'
    },
    'Uganda': {
      flag: '🇺🇬',
      rank: 8,
      production: '3.2% mundial (≈5.4 millones de sacos)',
      regions: 'Bugisu (Monte Elgon), Rwenzori, West Nile, Central',
      varieties: 'Robusta (80%), SL-14, SL-28, Bourbon, Típica',
      altitude: '1,200-2,300 msnm (Arábica)',
      harvest: 'Marzo - Agosto (Arábica), Todo el año (Robusta)',
      processing: 'Natural (seco), Lavado, Semi-lavado',
      cupProfile: 'Chocolate, vino, frutal, acidez brillante (Arábica)',
      certifications: 'Fair Trade, Organic, UTZ'
    },
    'Bolivia': {
      flag: '🇧🇴',
      climate: 'Tropical de montaña y altiplánico',
      biomes: 'Altiplano, Yungas, Chaco, Amazonia boliviana',
      topFlowers: [
        {
          name: 'Kantuta',
          scientificName: 'Cantua buxifolia',
          family: 'Polemoniaceae',
          distribution: 'Valles interandinos (2,000-3,500 msnm)',
          altitude: '2,000 - 3,500 metros sobre el nivel del mar',
          nativeCountries: 'Bolivia (Flor Nacional), Perú',
          season: 'Junio - Octubre (época seca andina)',
          habitat: 'Valles interandinos, laderas rocosas y quebradas',
          description: 'Flor nacional de Bolivia, Kantuta o Flor del Inca, tricolor patrio',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Cantua_buxifolia_flowers.jpg/320px-Cantua_buxifolia_flowers.jpg',
          uses: 'Símbolo patriótico, ornamental, ceremonial, rituales tradicionales',
          height: 'Arbusto de 2-4 metros de altura',
          leaves: 'Pequeñas, lanceoladas, verde intenso',
          flowers: 'Tubulares en racimos colgantes, colores rojo, amarillo y verde',
          flowering: 'Junio a octubre, floración abundante en época seca',
          pollination: 'Picaflores (colibríes) y abejas nativas',
          climate: 'Templado-frío de montaña andina',
          temperature: '8-18°C, resistente a heladas ligeras',
          precipitation: '400-800 mm anuales, época seca marcada',
          soil: 'Franco-arenoso, bien drenado, pH 6.0-7.0',
          propagation: 'Semillas y estacas leñosas',
          germination: '40-60% en condiciones controladas',
          growth: 'Lento a moderado (20-30 cm/año)',
          longevity: '15-20 años, muy resistente'
        },
        {
          name: 'Patujú',
          scientificName: 'Heliconia rostrata',
          family: 'Heliconiaceae',
          distribution: 'Tierras bajas del oriente boliviano',
          altitude: '200 - 1,000 metros sobre el nivel del mar',
          nativeCountries: 'Bolivia (co-flor nacional), Brasil, Colombia',
          season: 'Todo el año en climas cálidos',
          habitat: 'Yungas, bosques húmedos, tierras bajas tropicales',
          description: 'Patujú o Bandera boliviana, co-flor nacional junto con Kantuta',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Heliconia_rostrata_1.jpg/320px-Heliconia_rostrata_1.jpg',
          uses: 'Ceremonial en danzas tradicionales, ornamental tropical',
          height: 'Planta herbácea perenne de 2-4 metros',
          leaves: 'Grandes similares al plátano, hasta 2 metros',
          flowers: 'Inflorescencias colgantes con brácteas rojas y amarillas',
          flowering: 'Continua todo el año en clima tropical',
          pollination: 'Colibríes especializados del oriente',
          climate: 'Tropical cálido y húmedo',
          temperature: '22-30°C, alta humedad constante',
          precipitation: '1,500-2,500 mm anuales, bien distribuidos',
          soil: 'Rico en materia orgánica, húmedo, pH 5.5-6.5',
          propagation: 'División de rizomas, hijuelos',
          germination: '80-90% con rizomas frescos',
          growth: 'Muy rápido en condiciones húmedas (1-2 m/año)',
          longevity: '8-12 años por planta, colonias perpetuas'
        },
        {
          name: 'Ch\'ukeka',
          scientificName: 'Mutisia spp.',
          family: 'Asteraceae',
          distribution: 'Valles y yungas bolivianas',
          altitude: '1,500 - 3,200 metros sobre el nivel del mar',
          nativeCountries: 'Bolivia, Perú (regiones andinas)',
          season: 'Agosto - Noviembre (floración intensa)',
          habitat: 'Laderas rocosas, valles secos, yungas',
          description: 'Ch\'ukeka o Flor del sol, sagrada en cultura quechua-aymara',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Mutisia_decurrens_flower.jpg/320px-Mutisia_decurrens_flower.jpg',
          uses: 'Medicinal tradicional, ornamental, rituales ancestrales',
          height: 'Enredadera trepadora de 3-6 metros',
          leaves: 'Pinnadas con zarcillos, adaptadas al trepar',
          flowers: 'Capítulos naranjas intensos, muy vistosos',
          flowering: 'Agosto a noviembre, floración espectacular',
          pollination: 'Abejas nativas andinas, mariposas diurnas',
          climate: 'Templado seco de valle, amplitud térmica',
          temperature: '12-25°C días, 5-15°C noches',
          precipitation: '300-800 mm anuales, estacional',
          soil: 'Pedregoso, bien drenado, alcalino pH 7.0-8.0',
          propagation: 'Semillas, esquejes de tallos tiernos',
          germination: '30-60% con tratamiento de semillas',
          growth: 'Moderado, muy adaptable (50-100 cm/año)',
          longevity: '12-20 años, muy resistente a sequía'
        }
      ]
    },
    'Mexico': {
      flag: '🇲🇽',
      climate: 'Diverso: tropical a desertico',
      biomes: 'Desiertos, Bosques templados, Selvas',
      topFlowers: [
        {
          name: 'Dalia',
          scientificName: 'Dahlia pinnata',
          season: 'Julio - Noviembre',
          habitat: 'Altiplanos mexicanos, 1500-3000m',
          description: 'Flor nacional de México, gran variedad de colores',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Dahlia_pinnata_flowers.jpg/320px-Dahlia_pinnata_flowers.jpg',
          uses: 'Símbolo nacional, ornamental, exportación'
        },
        {
          name: 'Flor de Cempasúchil',
          scientificName: 'Tagetes erecta',
          season: 'Octubre - Noviembre',
          habitat: 'Todo México, clima templado',
          description: 'Flor de los muertos, naranja brillante',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Tagetes_erecta_flowers.jpg/320px-Tagetes_erecta_flowers.jpg',
          uses: 'Tradición cultural, ornamental, medicina'
        },
        {
          name: 'Flor de Nochebuena',
          scientificName: 'Euphorbia pulcherrima',
          season: 'Diciembre - Febrero',
          habitat: 'Regiones tropicales, 0-1000m',
          description: 'Poinsettia, brácteas rojas navideñas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Euphorbia_pulcherrima_red.jpg/320px-Euphorbia_pulcherrima_red.jpg',
          uses: 'Navidad, exportación mundial, ornamental'
        }
      ]
    },
    'Costa Rica': {
      flag: '🇨🇷',
      rank: 15,
      production: '0.8% mundial (≈1.4 millones de sacos)',
      regions: 'Tarrazú, Central Valley, West Valley, Tres Ríos, Brunca',
      varieties: 'Caturra, Catuaí, Villalobos, Geisha, SL-28',
      altitude: '1,200-1,700 msnm',
      harvest: 'Diciembre - Abril',
      processing: 'Lavado (Washed), Honey (innovador), Micro-lotes',
      cupProfile: 'Cítricos, chocolate, miel, acidez brillante',
      certifications: 'Rainforest Alliance, Organic, Carbon Neutral'
    },
    'Kenya': {
      flag: '🇰🇪',
      rank: 16,
      production: '0.7% mundial (≈1.2 millones de sacos)',
      regions: 'Central Province, Nyeri, Kirinyaga, Murang\'a, Kiambu',
      varieties: 'SL-28, SL-34, K7, Bourbon, Batian, Ruiru 11',
      altitude: '1,400-2,100 msnm',
      harvest: 'Octubre - Diciembre (Principal), Abril - Junio (Fly)',
      processing: 'Lavado (Washed), Double Fermentation',
      cupProfile: 'Grosella negra, vino, cítricos, acidez intensa',
      certifications: 'Fair Trade, Organic, Rainforest Alliance'
    },
    'Nicaragua': {
      flag: '🇳🇮',
      rank: 12,
      production: '1.5% mundial (≈2.5 millones de sacos)',
      regions: 'Matagalpa, Jinotega, Nueva Segovia, Estelí',
      varieties: 'Caturra, Bourbon, Catuaí, Pacamara, Maragogype',
      altitude: '1,000-1,500 msnm',
      harvest: 'Diciembre - Abril',
      processing: 'Lavado (Washed), Natural, Honey',
      cupProfile: 'Chocolate, caramelo, frutas, equilibrado',
      certifications: 'Fair Trade, Organic, Rainforest Alliance'
    },
    'El Salvador': {
      flag: '🇸🇻',
      rank: 17,
      production: '0.6% mundial (≈1.0 millones de sacos)',
      regions: 'Apaneca-Ilamatepec, Alotepec-Metapán, El Bálsamo-Quezaltepec',
      varieties: 'Bourbon, Pacas, Pacamara, Tekisic, Catuaí',
      altitude: '1,200-1,800 msnm',
      harvest: 'Noviembre - Febrero',
      processing: 'Lavado (Washed), Honey, Natural',
      cupProfile: 'Chocolate, caramelo, frutas cítricas, cuerpo medio',
      certifications: 'Rainforest Alliance, Organic, Fair Trade'
    },
    'Ecuador': {
      flag: '🇪🇨',
      climate: 'Tropical ecuatorial y andino',
      biomes: 'Amazonía, Andes, Costa, Galápagos',
      topFlowers: [
        {
          name: 'Orquídea del Ecuador',
          scientificName: 'Epidendrum jamiesonis',
          family: 'Orchidaceae',
          distribution: 'Andes ecuatorianos, 1,800-3,200 msnm',
          altitude: '1,800 - 3,200 metros sobre el nivel del mar',
          nativeCountries: 'Ecuador (endémica)',
          season: 'Mayo - Septiembre (época seca)',
          habitat: 'Bosques nublados andinos, epífita',
          description: 'Orquídea terrestre endémica de Ecuador, flores pequeñas agrupadas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Epidendrum_jamiesonis.jpg/320px-Epidendrum_jamiesonis.jpg',
          uses: 'Conservación, investigación botánica, ornamental especializada',
          height: 'Planta epífita de 30-80 cm',
          leaves: 'Lanceoladas, coriáceas, verde intenso',
          flowers: 'Pequeñas amarillas en racimos densos',
          flowering: 'Mayo a septiembre, floración prolongada',
          pollination: 'Abejas pequeñas y moscas especializadas',
          climate: 'Templado húmedo de montaña',
          temperature: '12-18°C, neblinas constantes',
          precipitation: '1,200-2,000 mm anuales',
          soil: 'Epífita en cortezas, sustrato orgánico',
          propagation: 'División de pseudobulbos, cultivo in vitro',
          germination: 'Simbiótica con hongos micorriza',
          growth: 'Lento, adaptada a alta humedad',
          longevity: '15-25 años en condiciones adecuadas'
        },
        {
          name: 'Chuquirahua',
          scientificName: 'Chuquiraga jussieui',
          family: 'Asteraceae',
          distribution: 'Páramos ecuatorianos y colombianos',
          altitude: '3,000 - 4,200 metros sobre el nivel del mar',
          nativeCountries: 'Ecuador, Colombia, Perú',
          season: 'Julio - Noviembre (época seca)',
          habitat: 'Páramos andinos, pajonales de altura',
          description: 'Flor de los páramos, arbusto resistente con flores naranjas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Chuquiraga_jussieui_flowers.jpg/320px-Chuquiraga_jussieui_flowers.jpg',
          uses: 'Medicina tradicional, leña, indicador ecológico',
          height: 'Arbusto de 1-3 metros de altura',
          leaves: 'Pequeñas, linear-lanceoladas, adaptadas al frío',
          flowers: 'Capítulos naranjas solitarios, muy vistosos',
          flowering: 'Julio a noviembre, floración intensa',
          pollination: 'Colibríes de altura, abejas andinas',
          climate: 'Páramo frío, gran amplitud térmica',
          temperature: '2-15°C, heladas frecuentes',
          precipitation: '800-1,200 mm anuales',
          soil: 'Andisoles, bien drenados, ácidos pH 4.5-6.0',
          propagation: 'Semillas, esquejes semi-leñosos',
          germination: '50-70% con tratamiento',
          growth: 'Muy lento, extremadamente resistente',
          longevity: '30-50 años, muy longeva'
        },
        {
          name: 'Flor de Ceibo',
          scientificName: 'Erythrina crista-galli',
          family: 'Fabaceae',
          distribution: 'Costa ecuatoriana y región litoral',
          altitude: '0 - 800 metros sobre el nivel del mar',
          nativeCountries: 'Ecuador, Argentina, Uruguay, Brasil',
          season: 'Diciembre - Abril (época lluviosa)',
          habitat: 'Bosques secos costeros, riberas',
          description: 'Ceibo costero, árbol con flores rojas en racimos',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Erythrina_crista-galli_flowers.jpg/320px-Erythrina_crista-galli_flowers.jpg',
          uses: 'Ornamental, sombra, medicina tradicional',
          height: 'Árbol de 5-8 metros de altura',
          leaves: 'Trifoliadas, caducas en época seca',
          flowers: 'Rojas en racimos terminales, muy llamativas',
          flowering: 'Diciembre a abril, floración espectacular',
          pollination: 'Colibríes y aves nectarívoras',
          climate: 'Tropical seco costero',
          temperature: '22-28°C, cálido constante',
          precipitation: '500-1,000 mm anuales, estacional',
          soil: 'Aluviales, tolerante a inundación temporal',
          propagation: 'Semillas, estacas grandes',
          germination: '80-90% con escarificación',
          growth: 'Rápido en condiciones favorables',
          longevity: '40-80 años, muy resistente a sequía'
        }
      ]
    },
    'Argentina': {
      flag: '🇦🇷',
      climate: 'Diverso: templado, subtropical, árido',
      biomes: 'Pampas, Patagonia, Yungas, Chaco',
      topFlowers: [
        {
          name: 'Ceibo',
          scientificName: 'Erythrina crista-galli',
          family: 'Fabaceae',
          distribution: 'Región pampeana y litoral argentino',
          altitude: '0 - 500 metros sobre el nivel del mar',
          nativeCountries: 'Argentina (flor nacional), Uruguay, sur de Brasil',
          season: 'Octubre - Febrero (primavera-verano)',
          habitat: 'Riberas de ríos, humedales pampeanos',
          description: 'Flor nacional de Argentina, seibo de flores rojas carmesí',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Erythrina_crista-galli_flowers.jpg/320px-Erythrina_crista-galli_flowers.jpg',
          uses: 'Símbolo nacional, ornamental, artesanías con madera',
          height: 'Árbol de 4-10 metros de altura',
          leaves: 'Trifoliadas, verde claro, caducas',
          flowers: 'Rojas carmesí en racimos colgantes',
          flowering: 'Octubre a febrero, floración prolongada',
          pollination: 'Colibríes, especialmente picaflor común',
          climate: 'Templado húmedo pampeano',
          temperature: '12-25°C, inviernos suaves',
          precipitation: '800-1,200 mm anuales',
          soil: 'Húmedos, tolera anegamiento temporal',
          propagation: 'Semillas pre-tratadas, estacas',
          germination: '70-85% con escarificación',
          growth: 'Moderado, 50-80 cm por año',
          longevity: '60-100 años en condiciones naturales'
        },
        {
          name: 'Jacarandá',
          scientificName: 'Jacaranda mimosifolia',
          family: 'Bignoniaceae',
          distribution: 'Noroeste argentino, naturalizada en todo el país',
          altitude: '200 - 1,500 metros sobre el nivel del mar',
          nativeCountries: 'Argentina, Bolivia, Paraguay',
          season: 'Septiembre - Diciembre (primavera)',
          habitat: 'Yungas, bosques subtropicales, urbano',
          description: 'Tarco, árbol de flores violetas en primavera porteña',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Jacaranda_mimosifolia_tree.jpg/320px-Jacaranda_mimosifolia_tree.jpg',
          uses: 'Ornamental urbano, madera, medicina popular',
          height: 'Árbol de 8-15 metros de altura',
          leaves: 'Bipinnadas, muy finamente divididas',
          flowers: 'Violetas en panículas terminales densas',
          flowering: 'Septiembre a diciembre, muy espectacular',
          pollination: 'Abejas, abejorros, aves pequeñas',
          climate: 'Subtropical a templado cálido',
          temperature: '15-28°C, sin heladas fuertes',
          precipitation: '600-1,200 mm anuales',
          soil: 'Bien drenados, tolerante a sequía',
          propagation: 'Semillas aladas, muy prolífico',
          germination: '85-95% en condiciones favorables',
          growth: 'Rápido, 80-120 cm por año',
          longevity: '80-150 años, muy longevo'
        },
        {
          name: 'Amancay',
          scientificName: 'Alstroemeria aurea',
          family: 'Alstroemeriaceae',
          distribution: 'Patagonia andina argentina y chilena',
          altitude: '600 - 2,000 metros sobre el nivel del mar',
          nativeCountries: 'Argentina, Chile (Patagonia)',
          season: 'Noviembre - Febrero (verano patagónico)',
          habitat: 'Bosques andino-patagónicos, laderas húmedas',
          description: 'Lirio del campo patagónico, flor dorada de montaña',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Alstroemeria_aurea_flowers.jpg/320px-Alstroemeria_aurea_flowers.jpg',
          uses: 'Ornamental, flor de corte, turismo ecológico',
          height: 'Planta herbácea de 60-120 cm',
          leaves: 'Lanceoladas, verde gris, resupinadas',
          flowers: 'Amarillo-naranja con manchas oscuras',
          flowering: 'Noviembre a febrero, floración masiva',
          pollination: 'Abejas nativas patagónicas, mariposas',
          climate: 'Templado frío andino-patagónico',
          temperature: '8-20°C, inviernos fríos',
          precipitation: '800-2,000 mm anuales (invierno)',
          soil: 'Volcánicos, bien drenados, ricos en humus',
          propagation: 'División de rizomas, semillas',
          germination: '60-80% con estratificación fría',
          growth: 'Moderado, forma colonias densas',
          longevity: '10-20 años por rizoma individual'
        }
      ]
    },
    'Chile': {
      flag: '🇨🇱',
      climate: 'Mediterráneo, desértico y templado',
      biomes: 'Desierto de Atacama, Valle Central, Bosque Valdiviano',
      topFlowers: [
        {
          name: 'Copihue',
          scientificName: 'Lapageria rosea',
          family: 'Philesiaceae',
          distribution: 'Bosques templados de Chile central y sur',
          altitude: '200 - 1,200 metros sobre el nivel del mar',
          nativeCountries: 'Chile (endémica, flor nacional)',
          season: 'Marzo - Mayo (otoño austral)',
          habitat: 'Bosque valdiviano, sotobosque húmedo',
          description: 'Flor nacional de Chile, enredadera de flores campanuladas rosadas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Lapageria_rosea_flowers.jpg/320px-Lapageria_rosea_flowers.jpg',
          uses: 'Símbolo nacional, ornamental, medicina mapuche',
          height: 'Enredadera de 5-10 metros de longitud',
          leaves: 'Alternas, coriáceas, perennes',
          flowers: 'Campanuladas rosadas, colgantes, cerosas',
          flowering: 'Marzo a mayo, floración espectacular',
          pollination: 'Picaflores chilenos, especialmente sephanoides',
          climate: 'Templado oceánico, húmedo',
          temperature: '8-18°C, sin grandes variaciones',
          precipitation: '1,500-3,000 mm anuales (invierno)',
          soil: 'Ácidos, ricos en materia orgánica, pH 5.0-6.5',
          propagation: 'Semillas, esquejes, muy difícil',
          germination: '30-50%, proceso muy lento',
          growth: 'Muy lento, extremadamente longevo',
          longevity: '100+ años, crecimiento centenario'
        },
        {
          name: 'Añañuca',
          scientificName: 'Rhodophiala bifida',
          family: 'Amaryllidaceae',
          distribution: 'Desierto florido y Chile central',
          altitude: '0 - 1,000 metros sobre el nivel del mar',
          nativeCountries: 'Chile, Argentina (Cuyo)',
          season: 'Septiembre - Noviembre (desierto florido)',
          habitat: 'Matorral mediterráneo, desierto costero',
          description: 'Flor del desierto florido, bulbosa de flores rojas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Rhodophiala_bifida_flowers.jpg/320px-Rhodophiala_bifida_flowers.jpg',
          uses: 'Fenómeno turístico, ornamental xerófila',
          height: 'Planta bulbosa de 20-40 cm',
          leaves: 'Lineales, aparecen después de floración',
          flowers: 'Rojas en umbelas, muy vistosas',
          flowering: 'Septiembre a noviembre (años lluviosos)',
          pollination: 'Abejas solitarias del desierto',
          climate: 'Desértico costero con nieblas',
          temperature: '12-22°C, moderado por océano',
          precipitation: '50-200 mm anuales, muy variable',
          soil: 'Arenosos, extremadamente bien drenados',
          propagation: 'Bulbos hijos, semillas',
          germination: '60-80% con humedad adecuada',
          growth: 'Muy lento, dormancia prolongada',
          longevity: '20-40 años, ciclo muy extenso'
        },
        {
          name: 'Notro',
          scientificName: 'Embothrium coccineum',
          family: 'Proteaceae',
          distribution: 'Bosques patagónicos de Chile y Argentina',
          altitude: '0 - 1,800 metros sobre el nivel del mar',
          nativeCountries: 'Chile, Argentina (Patagonia)',
          season: 'Octubre - Enero (primavera-verano austral)',
          habitat: 'Bosque andino-patagónico, laderas volcánicas',
          description: 'Ciruelillo, árbol de fuego patagónico con flores rojas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Embothrium_coccineum_flowers.jpg/320px-Embothrium_coccineum_flowers.jpg',
          uses: 'Ornamental patagónico, leña, medicina mapuche',
          height: 'Árbol de 6-15 metros de altura',
          leaves: 'Lanceoladas, coriáceas, perennes',
          flowers: 'Rojas tubulares en racimos densos',
          flowering: 'Octubre a enero, muy llamativo',
          pollination: 'Picaflores patagónicos, abejas nativas',
          climate: 'Templado frío lluvioso',
          temperature: '5-15°C, inviernos fríos',
          precipitation: '800-4,000 mm anuales',
          soil: 'Volcánicos ácidos, bien drenados',
          propagation: 'Semillas, muy específico',
          germination: '40-70% con tratamiento',
          growth: 'Lento, muy resistente al viento',
          longevity: '80-200 años, extremadamente resistente'
        }
      ]
    },
    'Venezuela': {
      flag: '🇻🇪',
      climate: 'Tropical con variaciones altitudinales',
      biomes: 'Llanos, Guayana, Andes, Maracaibo',
      topFlowers: [
        {
          name: 'Orquídea Flor de Mayo',
          scientificName: 'Cattleya mossiae',
          family: 'Orchidaceae',
          distribution: 'Cordillera de la Costa venezolana',
          altitude: '400 - 1,800 metros sobre el nivel del mar',
          nativeCountries: 'Venezuela (flor nacional)',
          season: 'Marzo - Julio (época seca)',
          habitat: 'Bosques húmedos montanos, epífita',
          description: 'Flor nacional de Venezuela, orquídea de gran belleza y fragancia',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Cattleya_mossiae_flowers.jpg/320px-Cattleya_mossiae_flowers.jpg',
          uses: 'Símbolo nacional, ornamental, cultivo comercial',
          height: 'Epífita con pseudobulbos de 15-30 cm',
          leaves: '1-2 hojas coriáceas por pseudobulbo',
          flowers: 'Lilas-rosadas, 15-20 cm, muy fragantes',
          flowering: 'Marzo a julio, floración anual',
          pollination: 'Abejas euglosinas venezolanas',
          climate: 'Tropical húmedo de montaña',
          temperature: '18-26°C, templado constante',
          precipitation: '1,200-2,200 mm anuales',
          soil: 'Epífita, sustratos orgánicos drenantes',
          propagation: 'División pseudobulbos, cultivo in vitro',
          germination: 'Simbiótica con hongos específicos',
          growth: 'Lento, 1-2 pseudobulbos anuales',
          longevity: '25-50 años con cuidado especializado'
        },
        {
          name: 'Araguaney',
          scientificName: 'Handroanthus chrysanthus',
          family: 'Bignoniaceae',
          distribution: 'Llanos y piedemontes venezolanos',
          altitude: '50 - 1,200 metros sobre el nivel del mar',
          nativeCountries: 'Venezuela, Colombia, Guyana',
          season: 'Febrero - Abril (época seca)',
          habitat: 'Sabanas llaneras, bosques de galería',
          description: 'Árbol nacional de Venezuela, floración dorada espectacular',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Handroanthus_chrysanthus_flowers.jpg/320px-Handroanthus_chrysanthus_flowers.jpg',
          uses: 'Árbol nacional, ornamental urbano, madera noble',
          height: 'Árbol de 6-12 metros de altura',
          leaves: 'Palmadas, 5 folíolos, caducas',
          flowers: 'Amarillo oro en racimos terminales',
          flowering: 'Febrero a abril, sin hojas',
          pollination: 'Abejas meliponas, mariposas',
          climate: 'Tropical de sabana con sequía marcada',
          temperature: '24-32°C, cálido constante',
          precipitation: '800-1,500 mm anuales (mayo-octubre)',
          soil: 'Bien drenados, tolerante a inundación',
          propagation: 'Semillas aladas, muy viable',
          germination: '80-95% en época húmeda',
          growth: 'Moderado a rápido (60-100 cm/año)',
          longevity: '100-200 años, muy resistente'
        },
        {
          name: 'Bucaré',
          scientificName: 'Erythrina poeppigiana',
          family: 'Fabaceae',
          distribution: 'Andes venezolanos y piedemonte',
          altitude: '800 - 2,200 metros sobre el nivel del mar',
          nativeCountries: 'Venezuela, Colombia, Ecuador, Perú',
          season: 'Enero - Abril (época seca)',
          habitat: 'Bosques nublados andinos, cafetales',
          description: 'Árbol de sombra cafetero, flores rojas en racimos',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Erythrina_poeppigiana_flowers.jpg/320px-Erythrina_poeppigiana_flowers.jpg',
          uses: 'Sombra para café, ornamental, medicina tradicional',
          height: 'Árbol de 10-20 metros de altura',
          leaves: 'Trifoliadas, grandes, caducas en floración',
          flowers: 'Rojas en racimos terminales erectos',
          flowering: 'Enero a abril, antes de las hojas',
          pollination: 'Colibríes andinos, murciélagos',
          climate: 'Tropical de montaña, húmedo',
          temperature: '16-24°C, templado de altura',
          precipitation: '1,500-3,000 mm anuales',
          soil: 'Andinos, ricos en materia orgánica',
          propagation: 'Estacas grandes, semillas',
          germination: '70-90% con tratamiento',
          growth: 'Rápido, excelente para sombra',
          longevity: '50-100 años, crecimiento sostenido'
        }
      ]
    },
    'Paraguay': {
      flag: '🇵🇾',
      climate: 'Subtropical húmedo',
      biomes: 'Chaco, Mata Atlántica, Cerrado',
      topFlowers: [
        {
          name: 'Mburucuyá',
          scientificName: 'Passiflora caerulea',
          family: 'Passifloraceae',
          distribution: 'Paraguay oriental y Argentina',
          altitude: '100 - 800 metros sobre el nivel del mar',
          nativeCountries: 'Paraguay, Argentina, sur de Brasil',
          season: 'Octubre - Marzo (verano)',
          habitat: 'Bosques ribereños, cerrados húmedos',
          description: 'Flor de la pasión guaraní, enredadera medicinal sagrada',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Passiflora_caerulea_flowers.jpg/320px-Passiflora_caerulea_flowers.jpg',
          uses: 'Medicina guaraní, fruto comestible, ornamental',
          height: 'Enredadera de 3-8 metros de longitud',
          leaves: 'Palmatilobadas, 5-7 lóbulos profundos',
          flowers: 'Blanco-azuladas, corona filamentosa compleja',
          flowering: 'Octubre a marzo, floración prolongada',
          pollination: 'Abejas nativas, mariposas heliconias',
          climate: 'Subtropical húmedo sin estación seca',
          temperature: '18-28°C, cálido moderado',
          precipitation: '1,200-1,800 mm anuales uniformes',
          soil: 'Húmedos, ricos en materia orgánica',
          propagation: 'Semillas, esquejes semileñosos',
          germination: '70-85% con escarificación',
          growth: 'Rápido, muy vigorosa',
          longevity: '15-25 años, productiva prolongadamente'
        },
        {
          name: 'Lapacho Rosado',
          scientificName: 'Handroanthus impetiginosus',
          family: 'Bignoniaceae',
          distribution: 'Mata Atlántica del Alto Paraná',
          altitude: '200 - 1,000 metros sobre el nivel del mar',
          nativeCountries: 'Paraguay, Brasil, Argentina (Misiones)',
          season: 'Julio - Septiembre (invierno seco)',
          habitat: 'Bosques atlánticos, selva paranaense',
          description: 'Tajy hovy en guaraní, árbol de floración rosa intensa',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Handroanthus_impetiginosus_flowers.jpg/320px-Handroanthus_impetiginosus_flowers.jpg',
          uses: 'Madera noble, medicina tradicional, ornamental',
          height: 'Árbol de 8-18 metros de altura',
          leaves: 'Palmadas, 5 folíolos dentados, caducas',
          flowers: 'Rosa-magenta en racimos terminales densos',
          flowering: 'Julio a septiembre, espectacular',
          pollination: 'Abejas sin aguijón, colibríes',
          climate: 'Subtropical húmedo atlántico',
          temperature: '16-26°C, inviernos suaves',
          precipitation: '1,400-2,200 mm anuales',
          soil: 'Rojos lateríticos, bien estructurados',
          propagation: 'Semillas aladas, alta viabilidad',
          germination: '85-95% en condiciones óptimas',
          growth: 'Moderado, madera de alta calidad',
          longevity: '150-300 años, muy longevo'
        },
        {
          name: 'Kurupí ka\'a',
          scientificName: 'Piper umbellatum',
          family: 'Piperaceae',
          distribution: 'Bosques húmedos del Paraguay oriental',
          altitude: '200 - 600 metros sobre el nivel del mar',
          nativeCountries: 'Paraguay, Brasil, Bolivia, Perú',
          season: 'Noviembre - Febrero (lluvias)',
          habitat: 'Sotobosque húmedo, bosques de galería',
          description: 'Planta medicinal guaraní, espigas florales aromáticas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Piper_umbellatum_flowers.jpg/320px-Piper_umbellatum_flowers.jpg',
          uses: 'Medicina guaraní tradicional, ritual shamánico',
          height: 'Arbusto de 1-3 metros de altura',
          leaves: 'Cordadas grandes, peltadas, aromáticas',
          flowers: 'Espigas blancas umbreliforme, pequeñas',
          flowering: 'Noviembre a febrero, época lluviosa',
          pollination: 'Moscas pequeñas, trips',
          climate: 'Subtropical húmedo de sotobosque',
          temperature: '20-28°C, cálido húmedo constante',
          precipitation: '1,400-2,000 mm anuales',
          soil: 'Húmedos permanentemente, ricos en humus',
          propagation: 'Esquejes, división de mata',
          germination: '60-80% con humedad constante',
          growth: 'Moderado, requiere sombra parcial',
          longevity: '8-15 años, renovación constante'
        }
      ]
    },
    'Uruguay': {
      flag: '🇺🇾',
      climate: 'Templado oceánico',
      biomes: 'Pampas, pradera, costa atlántica',
      topFlowers: [
        {
          name: 'Ceibo',
          scientificName: 'Erythrina crista-galli',
          family: 'Fabaceae',
          distribution: 'Cuenca del Río de la Plata',
          altitude: '0 - 200 metros sobre el nivel del mar',
          nativeCountries: 'Uruguay, Argentina, sur de Brasil',
          season: 'Noviembre - Marzo (verano)',
          habitat: 'Riberas, bañados, humedales pampeanos',
          description: 'Flor nacional de Uruguay y Argentina, seibo de flores rojas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Erythrina_crista-galli_flowers.jpg/320px-Erythrina_crista-galli_flowers.jpg',
          uses: 'Flor nacional, ornamental ribereño, medicina popular',
          height: 'Árbol de 4-8 metros de altura',
          leaves: 'Trifoliadas, folíolos ovales, caducas',
          flowers: 'Rojas en racimos erectos, muy vistosas',
          flowering: 'Noviembre a marzo, floración prolongada',
          pollination: 'Colibríes, abejas grandes',
          climate: 'Templado húmedo oceánico',
          temperature: '12-24°C, moderado por océano',
          precipitation: '1,000-1,300 mm anuales uniformes',
          soil: 'Húmedos a anegadizos, tolerante a salinidad',
          propagation: 'Semillas, esquejes grandes',
          germination: '80-90% con escarificación',
          growth: 'Moderado, muy resistente a inundación',
          longevity: '80-150 años, extremadamente resistente'
        },
        {
          name: 'Coronilla',
          scientificName: 'Scutia buxifolia',
          family: 'Rhamnaceae',
          distribution: 'Montes nativos del Uruguay',
          altitude: '0 - 300 metros sobre el nivel del mar',
          nativeCountries: 'Uruguay, Argentina (litoral), sur de Brasil',
          season: 'Septiembre - Noviembre (primavera)',
          habitat: 'Montes ribereños, quebradas húmedas',
          description: 'Arbusto nativo de los montes uruguayos, flores amarillas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Scutia_buxifolia_flowers.jpg/320px-Scutia_buxifolia_flowers.jpg',
          uses: 'Restauración de montes nativos, medicina popular',
          height: 'Arbusto de 2-4 metros de altura',
          leaves: 'Pequeñas ovales, coriáceas, perennes',
          flowers: 'Amarillo-verdosas en racimos axilares',
          flowering: 'Septiembre a noviembre, discreta',
          pollination: 'Abejas nativas pequeñas, dípteros',
          climate: 'Templado húmedo, protegido del viento',
          temperature: '10-22°C, sin extremos',
          precipitation: '1,200-1,400 mm anuales',
          soil: 'Húmedos, ricos en materia orgánica',
          propagation: 'Semillas, muy específico',
          germination: '40-60% con tratamiento prolongado',
          growth: 'Muy lento, extremadamente resistente',
          longevity: '50-100 años, crecimiento centenario'
        },
        {
          name: 'Duraznillo Blanco',
          scientificName: 'Solanum granuloso-leprosum',
          family: 'Solanaceae',
          distribution: 'Campos y praderas del Uruguay',
          altitude: '0 - 400 metros sobre el nivel del mar',
          nativeCountries: 'Uruguay, Argentina pampeana, sur de Brasil',
          season: 'Octubre - Enero (primavera-verano)',
          habitat: 'Praderas pampeanas, bordes de monte',
          description: 'Arbusto de campo con flores blancas estrelladas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Solanum_granuloso-leprosum_flowers.jpg/320px-Solanum_granuloso-leprosum_flowers.jpg',
          uses: 'Medicina popular, ornamental de campo',
          height: 'Arbusto de 1-2.5 metros de altura',
          leaves: 'Lanceoladas, pubescentes, aromáticas',
          flowers: 'Blancas estrelladas en cimas terminales',
          flowering: 'Octubre a enero, abundante',
          pollination: 'Abejas solitarias, abejorros',
          climate: 'Templado pampeano con veranos húmedos',
          temperature: '8-26°C, amplitud moderada',
          precipitation: '900-1,200 mm anuales',
          soil: 'Pampeanos profundos, bien drenados',
          propagation: 'Semillas, esquejes herbáceos',
          germination: '70-85% en primavera',
          growth: 'Moderado a rápido estacional',
          longevity: '15-30 años, renovación regular'
        }
      ]
    },
    'Panama': {
      flag: '🇵🇦',
      climate: 'Tropical húmedo',
      biomes: 'Bosque tropical, manglares, páramo',
      topFlowers: [
        {
          name: 'Flor del Espíritu Santo',
          scientificName: 'Peristeria elata',
          family: 'Orchidaceae',
          distribution: 'Bosques húmedos de Panamá y Costa Rica',
          altitude: '300 - 1,200 metros sobre el nivel del mar',
          nativeCountries: 'Panamá (flor nacional), Costa Rica',
          season: 'Julio - Octubre (época lluviosa)',
          habitat: 'Bosques húmedos montanos, epífita',
          description: 'Flor nacional de Panamá, orquídea con forma de paloma',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Peristeria_elata_flowers.jpg/320px-Peristeria_elata_flowers.jpg',
          uses: 'Símbolo nacional, conservación, ornamental',
          height: 'Epífita con pseudobulbos de 8-15 cm',
          leaves: '2-4 hojas plegadas, grandes',
          flowers: 'Blancas cerosas con columna que parece paloma',
          flowering: 'Julio a octubre, fragante',
          pollination: 'Abejas euglosinas centroamericanas',
          climate: 'Tropical húmedo montano',
          temperature: '20-26°C, húmedo constante',
          precipitation: '2,000-4,000 mm anuales',
          soil: 'Epífita, sustratos muy drenantes',
          propagation: 'División, cultivo in vitro especializado',
          germination: 'Simbiótica, muy compleja',
          growth: 'Muy lento, extremadamente delicada',
          longevity: '30-60 años en condiciones óptimas'
        },
        {
          name: 'Guayacán',
          scientificName: 'Tabebuia rosea',
          family: 'Bignoniaceae',
          distribution: 'Bosques secos del Pacífico panameño',
          altitude: '0 - 800 metros sobre el nivel del mar',
          nativeCountries: 'Panamá, Costa Rica, Nicaragua, México',
          season: 'Enero - Abril (época seca)',
          habitat: 'Bosque tropical seco, sabanas arboladas',
          description: 'Roble de sabana, floración rosada espectacular',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Tabebuia_rosea_flowers.jpg/320px-Tabebuia_rosea_flowers.jpg',
          uses: 'Madera noble, ornamental urbano, medicina',
          height: 'Árbol de 15-25 metros de altura',
          leaves: 'Palmadas, 5 folíolos, caducas en floración',
          flowers: 'Rosa-lila en panículas terminales densas',
          flowering: 'Enero a abril, sin hojas',
          pollination: 'Abejas meliponas, mariposas grandes',
          climate: 'Tropical seco con marcada estacionalidad',
          temperature: '24-32°C, cálido constante',
          precipitation: '1,200-2,000 mm (mayo-noviembre)',
          soil: 'Bien drenados, tolerante a sequía',
          propagation: 'Semillas aladas, muy viable',
          germination: '80-95% en época húmeda',
          growth: 'Moderado a rápido (80-120 cm/año)',
          longevity: '100-200 años, muy resistente'
        },
        {
          name: 'Flor de la Candelaria',
          scientificName: 'Pseudobombax septenatum',
          family: 'Malvaceae',
          distribution: 'Bosques secos centroamericanos',
          altitude: '0 - 600 metros sobre el nivel del mar',
          nativeCountries: 'Panamá, Costa Rica, Nicaragua',
          season: 'Febrero - Marzo (época seca)',
          habitat: 'Bosque tropical seco, deciduo',
          description: 'Barrigón, árbol de tronco ensanchado y flores blancas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Pseudobombax_septenatum_flowers.jpg/320px-Pseudobombax_septenatum_flowers.jpg',
          uses: 'Ornamental, fibra, medicina tradicional',
          height: 'Árbol de 8-15 metros, tronco ensanchado',
          leaves: 'Palmadas, 5-7 folíolos, caducas',
          flowers: 'Blancas grandes con estambres prominentes',
          flowering: 'Febrero a marzo, antes de hojas',
          pollination: 'Murciélagos nectarívoros, esfinge nocturna',
          climate: 'Tropical seco marcadamente estacional',
          temperature: '26-34°C, muy cálido',
          precipitation: '800-1,500 mm (mayo-octubre)',
          soil: 'Secos a moderadamente húmedos',
          propagation: 'Semillas con fibra sedosa',
          germination: '70-85% con tratamiento',
          growth: 'Lento, almacena agua en tronco',
          longevity: '80-150 años, muy resistente sequía'
        }
      ]
    },
    'Dominican Republic': {
      flag: '🇩🇴',
      climate: 'Tropical con variaciones altitudinales',
      biomes: 'Bosque seco, húmedo, manglares, montano',
      topFlowers: [
        {
          name: 'Rosa de Bayahíbe',
          scientificName: 'Pereskia quisqueyana',
          family: 'Cactaceae',
          distribution: 'Endémica del sureste de República Dominicana',
          altitude: '0 - 100 metros sobre el nivel del mar',
          nativeCountries: 'República Dominicana (endémica, flor nacional)',
          season: 'Marzo - Mayo (época seca)',
          habitat: 'Bosque seco costero, matorral xerófilo',
          description: 'Flor nacional dominicana, cactus primitivo con flores rosadas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Pereskia_quisqueyana_flowers.jpg/320px-Pereskia_quisqueyana_flowers.jpg',
          uses: 'Símbolo nacional, conservación crítica, ornamental',
          height: 'Arbusto suculento de 2-4 metros',
          leaves: 'Carnosas ovales, deciduas estacionalmente',
          flowers: 'Rosa intenso, 5-7 cm diámetro',
          flowering: 'Marzo a mayo, abundante',
          pollination: 'Abejas carpenter, mariposas antillanas',
          climate: 'Tropical seco costero caribeño',
          temperature: '24-30°C, cálido constante',
          precipitation: '600-1,000 mm anuales',
          soil: 'Calcáreos secos, extremadamente drenados',
          propagation: 'Esquejes, semillas (muy difícil)',
          germination: '30-50% con tratamiento especializado',
          growth: 'Lento, adaptado a sequía extrema',
          longevity: '50-100 años, muy resistente'
        },
        {
          name: 'Caoba Antillana',
          scientificName: 'Swietenia mahagoni',
          family: 'Meliaceae',
          distribution: 'Antillas Mayores nativas',
          altitude: '0 - 800 metros sobre el nivel del mar',
          nativeCountries: 'República Dominicana, Cuba, Jamaica, Bahamas',
          season: 'Abril - Junio (inicio lluvias)',
          habitat: 'Bosques húmedos y semi-húmedos montanos',
          description: 'Caoba del Caribe, árbol noble de flores pequeñas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Swietenia_mahagoni_flowers.jpg/320px-Swietenia_mahagoni_flowers.jpg',
          uses: 'Madera preciosa histórica, reforestación',
          height: 'Árbol de 15-30 metros de altura',
          leaves: 'Pinnadas paripinnadas, folíolos coriáceos',
          flowers: 'Amarillo-verdosas en panículas axilares',
          flowering: 'Abril a junio, discretas pero abundantes',
          pollination: 'Abejas pequeñas, trips',
          climate: 'Tropical húmedo a semi-húmedo',
          temperature: '22-28°C, cálido moderado',
          precipitation: '1,200-2,500 mm anuales',
          soil: 'Profundos, ricos, bien drenados',
          propagation: 'Semillas aladas grandes',
          germination: '60-80% fresco, pierde viabilidad',
          growth: 'Lento, madera de alta calidad',
          longevity: '200-400 años, extremadamente longevo'
        },
        {
          name: 'Flamboyan',
          scientificName: 'Delonix regia',
          family: 'Fabaceae',
          distribution: 'Naturalizada en todo el Caribe',
          altitude: '0 - 500 metros sobre el nivel del mar',
          nativeCountries: 'Madagascar (nativo), Antillas (naturalizado)',
          season: 'Mayo - Agosto (lluvias)',
          habitat: 'Urbano tropical, parques, avenidas',
          description: 'Framboyán, árbol ornamental de floración espectacular',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Delonix_regia_flowers.jpg/320px-Delonix_regia_flowers.jpg',
          uses: 'Ornamental urbano icónico, sombra',
          height: 'Árbol de 8-15 metros, copa extendida',
          leaves: 'Bipinnadas finamente divididas, caducas',
          flowers: 'Rojo-naranja con pétalos manchados',
          flowering: 'Mayo a agosto, muy espectacular',
          pollination: 'Colibríes antillanos, abejas grandes',
          climate: 'Tropical cálido húmedo',
          temperature: '24-30°C, sin heladas',
          precipitation: '800-2,000 mm anuales',
          soil: 'Diversos, muy adaptable',
          propagation: 'Semillas en vainas largas',
          germination: '80-95% con escarificación',
          growth: 'Rápido, copa muy extendida',
          longevity: '80-150 años, muy resistente'
        }
      ]
    },
    'Cuba': {
      flag: '🇨🇺',
      climate: 'Tropical con influencia oceánica',
      biomes: 'Bosque húmedo, seco, manglares, mogotes',
      topFlowers: [
        {
          name: 'Mariposa Blanca',
          scientificName: 'Hedychium coronarium',
          family: 'Zingiberaceae',
          distribution: 'Naturalizada en toda Cuba',
          altitude: '0 - 600 metros sobre el nivel del mar',
          nativeCountries: 'Asia tropical (nativo), Cuba (flor nacional)',
          season: 'Mayo - Octubre (lluvias)',
          habitat: 'Riberas, lugares húmedos, jardines',
          description: 'Flor nacional de Cuba, jengibre blanco fragante',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Hedychium_coronarium_flowers.jpg/320px-Hedychium_coronarium_flowers.jpg',
          uses: 'Flor nacional, ornamental, perfumería',
          height: 'Herbácea rizomatosa de 1-2 metros',
          leaves: 'Lanceoladas grandes, alternas',
          flowers: 'Blancas fragantes en espigas terminales',
          flowering: 'Mayo a octubre, muy fragante',
          pollination: 'Mariposas nocturnas, esfinge',
          climate: 'Tropical húmedo caribeño',
          temperature: '20-30°C, cálido oceánico',
          precipitation: '1,200-2,000 mm anuales',
          soil: 'Húmedos, ricos en materia orgánica',
          propagation: 'División de rizomas, muy fácil',
          germination: '90-100% por división',
          growth: 'Rápido, forma colonias densas',
          longevity: 'Perenne indefinida por rizomas'
        },
        {
          name: 'Ceiba',
          scientificName: 'Ceiba pentandra',
          family: 'Malvaceae',
          distribution: 'Bosques húmedos de Cuba',
          altitude: '0 - 400 metros sobre el nivel del mar',
          nativeCountries: 'Cuba, Antillas Mayores, Centroamérica',
          season: 'Enero - Marzo (época seca)',
          habitat: 'Bosques húmedos, riberas, lugares sagrados',
          description: 'Árbol sagrado yoruba, gigante tropical de tronco espinoso',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Ceiba_pentandra_flowers.jpg/320px-Ceiba_pentandra_flowers.jpg',
          uses: 'Árbol sagrado, fibra, medicina tradicional',
          height: 'Árbol gigante de 25-60 metros',
          leaves: 'Palmadas, 5-9 folíolos, caducas',
          flowers: 'Blanco-rosadas, pequeñas en racimos',
          flowering: 'Enero a marzo, antes de hojas',
          pollination: 'Murciélagos frugívoros, abejas',
          climate: 'Tropical húmedo sin heladas',
          temperature: '22-28°C, cálido constante',
          precipitation: '1,000-2,500 mm anuales',
          soil: 'Profundos, húmedos, bien drenados',
          propagation: 'Semillas con fibra (kapok)',
          germination: '70-90% en época húmeda',
          growth: 'Muy rápido cuando joven',
          longevity: '300-800 años, milenario'
        },
        {
          name: 'Flamboyán de Cuba',
          scientificName: 'Caesalpinia pulcherrima',
          family: 'Fabaceae',
          distribution: 'Naturalizada en toda Cuba',
          altitude: '0 - 300 metros sobre el nivel del mar',
          nativeCountries: 'Antillas (nativo), ampliamente cultivado',
          season: 'Marzo - Noviembre (casi todo el año)',
          habitat: 'Jardines, patios, áreas urbanas',
          description: 'Clavellina, arbusto ornamental de flores naranjas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Caesalpinia_pulcherrima_flowers.jpg/320px-Caesalpinia_pulcherrima_flowers.jpg',
          uses: 'Ornamental popular, medicina tradicional',
          height: 'Arbusto de 2-4 metros de altura',
          leaves: 'Bipinnadas, folíolos pequeños',
          flowers: 'Naranja-rojo con estambres rojos largos',
          flowering: 'Marzo a noviembre, casi continuo',
          pollination: 'Colibríes, mariposas, abejas carpenter',
          climate: 'Tropical cálido, resistente sequía',
          temperature: '20-32°C, muy adaptable',
          precipitation: '600-2,000 mm anuales',
          soil: 'Diversos, muy tolerante',
          propagation: 'Semillas, esquejes semileñosos',
          germination: '80-95% con escarificación',
          growth: 'Rápido, floración temprana',
          longevity: '20-40 años, renovación frecuente'
        }
      ]
    },
    'Jamaica': {
      flag: '🇯🇲',
      climate: 'Tropical con montañas húmedas',
      biomes: 'Bosque húmedo montano, seco costero, manglares',
      topFlowers: [
        {
          name: 'Lignum Vitae',
          scientificName: 'Guaiacum officinale',
          family: 'Zygophyllaceae',
          distribution: 'Antillas Mayores y Menores',
          altitude: '0 - 300 metros sobre el nivel del mar',
          nativeCountries: 'Jamaica (flor nacional), Antillas Menores',
          season: 'Marzo - Mayo (época seca)',
          habitat: 'Bosques secos costeros, matorrales xerófilos',
          description: 'Flor nacional de Jamaica, palo santo de flores azules',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/g/g2/Guaiacum_officinale_flowers.jpg/320px-Guaiacum_officinale_flowers.jpg',
          uses: 'Flor nacional, madera medicinal histórica',
          height: 'Árbol pequeño de 6-10 metros',
          leaves: 'Pinnadas, folíolos pequeños coriáceos',
          flowers: 'Azul intenso en racimos terminales',
          flowering: 'Marzo a mayo, muy vistosas',
          pollination: 'Abejas carpinteras antillanas, colibríes',
          climate: 'Tropical seco costero caribeño',
          temperature: '24-30°C, cálido constante',
          precipitation: '600-1,200 mm anuales',
          soil: 'Calcáreos secos, bien drenados',
          propagation: 'Semillas, muy lenta germinación',
          germination: '30-60% con tratamiento prolongado',
          growth: 'Extremadamente lento, madera densa',
          longevity: '200-500 años, crecimiento milenario'
        },
        {
          name: 'Ackee',
          scientificName: 'Blighia sapida',
          family: 'Sapindaceae',
          distribution: 'Naturalizada en Jamaica desde África',
          altitude: '0 - 800 metros sobre el nivel del mar',
          nativeCountries: 'África Occidental (nativo), Jamaica (naturalizado)',
          season: 'Enero - Marzo y Junio - Agosto',
          habitat: 'Jardines, huertos, bosques secundarios',
          description: 'Fruto nacional jamaiquino, flores pequeñas fragantes',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Blighia_sapida_flowers.jpg/320px-Blighia_sapida_flowers.jpg',
          uses: 'Fruto nacional comestible, ornamental',
          height: 'Árbol de 8-15 metros de altura',
          leaves: 'Pinnadas, 6-10 folíolos coriáceos',
          flowers: 'Blanco-verdosas fragantes en racimos',
          flowering: 'Enero-marzo y junio-agosto',
          pollination: 'Abejas melíferas, moscas',
          climate: 'Tropical húmedo a semi-húmedo',
          temperature: '20-28°C, moderadamente cálido',
          precipitation: '1,000-2,200 mm anuales',
          soil: 'Profundos, ricos, bien drenados',
          propagation: 'Semillas grandes, injertos',
          germination: '70-90% fresco, pierde viabilidad',
          growth: 'Moderado, fructificación 3-6 años',
          longevity: '100-200 años, muy productivo'
        },
        {
          name: 'Bougainvillea Jamaiquina',
          scientificName: 'Bougainvillea spectabilis',
          family: 'Nyctaginaceae',
          distribution: 'Naturalizada en toda Jamaica',
          altitude: '0 - 1,000 metros sobre el nivel del mar',
          nativeCountries: 'Sudamérica (nativo), Jamaica (naturalizada)',
          season: 'Noviembre - Abril (época seca)',
          habitat: 'Jardines, cercos, áreas urbanas',
          description: 'Trinitaria, enredadera ornamental de brácteas coloridas',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Bougainvillea_spectabilis_flowers.jpg/320px-Bougainvillea_spectabilis_flowers.jpg',
          uses: 'Ornamental icónica, cercos vivos',
          height: 'Enredadera/arbusto de 3-8 metros',
          leaves: 'Ovales alternas, con espinas axilares',
          flowers: 'Pequeñas blancas, brácteas magenta vistosas',
          flowering: 'Noviembre a abril, época seca',
          pollination: 'Mariposas, colibríes, abejas carpenter',
          climate: 'Tropical seco, resistente sequía',
          temperature: '18-32°C, muy adaptable',
          precipitation: '500-1,800 mm anuales',
          soil: 'Diversos, prefiere drenaje perfecto',
          propagation: 'Esquejes semileñosos, muy fácil',
          germination: '80-95% por esquejes',
          growth: 'Muy rápido y vigoroso',
          longevity: '30-60 años, poda regenerativa'
        }
      ]
    }
  };
  
  // Función para determinar si mostrar información floral del país
  const shouldShowFloralInfo = (location) => {
    if (!location) return false;
    const locationName = typeof location === 'string' ? location : location.name;
    return countryFloralData.hasOwnProperty(locationName);
  };

  // Función para obtener datos florales específicos del país
  const getCountryFloralInfo = (location) => {
    if (!location) return null;
    const locationName = typeof location === 'string' ? location : location.name;
    return countryFloralData[locationName] || null;
  };

  // Persisted UI toggles
  const initialBorders = (() => {
    try {
      const v = localStorage.getItem('lib_show_borders');
      return v == null ? true : v === 'true';
    } catch { return true; }
  })();
  const [showCountryBorders, setShowCountryBorders] = useState(initialBorders);

  const [baseLayer, setBaseLayer] = useState(() => {
    try {
      const saved = localStorage.getItem('lib_base_layer');
      return saved === 'viirs' || saved === 'evi8' ? saved : 'viirs';
    } catch { return 'viirs'; }
  });
  // Coerce unsupported values to viirs once on mount
  React.useEffect(() => {
    if (baseLayer !== 'viirs' && baseLayer !== 'evi8') {
      try { localStorage.setItem('lib_base_layer', 'viirs'); } catch {}
      setBaseLayer('viirs');
    }
  }, []);
  const layerOptions = [
    { id: 'viirs', name: 'VIIRS TrueColor', icon: Satellite },
    { id: 'evi8', name: 'MODIS EVI (8-day)', icon: Map },
  ];
  // POWER data state
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState(null);
  const [climateSeries, setClimateSeries] = useState(null);
  const [climateCurrent, setClimateCurrent] = useState(null);
  const [bloomIndex, setBloomIndex] = useState(null);
  const [bloomIndexMeta, setBloomIndexMeta] = useState(null);
  const [idealChecks, setIdealChecks] = useState([]);
  const [climBaseline, setClimBaseline] = useState(null);

  async function loadClimate(lat, lon) {
    // cancel previous
    if (aborter) {
      try { aborter.abort(); } catch {}
    }
    const controller = new AbortController();
    setAborter(controller);

    setClimateLoading(true);
    setClimateError(null);
    try {
      const { start, end } = getDateRangeLastNDays(60);
      const params = ['T2M','T2M_MAX','T2M_MIN','PRECTOTCORR','RH2M','ALLSKY_SFC_SW_DWN','WS2M','CLOUD_AMT','PS'];
      const series = await getDailyPoint({ latitude: lat, longitude: lon, startDate: start, endDate: end, parameters: params, signal: controller.signal });
      if (controller.signal.aborted) return; // stop if aborted
      setClimateSeries(series);
      const current = extractCurrentConditions(series);
      setClimateCurrent(current);
      if (current && current.T2M!=null && current.PRECTOTCORR!=null && current.ALLSKY_SFC_SW_DWN!=null && current.RH2M!=null) {
        const idx = predictBloomIndex({
          temperature: current.T2M,
          precipitation: current.PRECTOTCORR,
          radiation: current.ALLSKY_SFC_SW_DWN,
          humidity: current.RH2M,
          ndviTrend: 0,
        });
        setBloomIndex(idx);
        setBloomIndexMeta(indexLabel(idx));
        setIdealChecks(assessIdealConditions({
          temperature: current.T2M,
          precipitation: current.PRECTOTCORR,
          radiation: current.ALLSKY_SFC_SW_DWN,
          humidity: current.RH2M,
        }));
      } else {
        setBloomIndex(null); setBloomIndexMeta(null); setIdealChecks([]);
      }

      // Baseline climatológica (mensual) 2001-2020
      const clim = await getMonthlyClimatology({ latitude: lat, longitude: lon, parameters: ['T2M','PRECTOTCORR','ALLSKY_SFC_SW_DWN','RH2M'], signal: controller.signal });
      if (controller.signal.aborted) return;
      setClimBaseline(clim);
    } catch (e) {
      if (e && (e.name === 'AbortError' || String(e).includes('AbortError'))) {
        // Swallow abort errors silently
        return;
      }
      setClimateError(e.message || String(e));
      setClimateSeries(null); setClimateCurrent(null); setBloomIndex(null); setBloomIndexMeta(null); setIdealChecks([]);
      setClimBaseline(null);
    } finally {
      setClimateLoading(false);
    }
  }

  const handleChangeBase = (id) => {
    setBaseLayer(id);
    try { localStorage.setItem('lib_base_layer', id); } catch {}
  };

  const toggleBorders = () => {
    const next = !showCountryBorders;
    setShowCountryBorders(next);
    try { localStorage.setItem('lib_show_borders', String(next)); } catch {}
  };

  // Mock bloom data for selected location
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

  function renderSparkline(values, unit, label) {
    if (!Array.isArray(values) || values.length === 0) return null;
    const w = 180, h = 40, pad = 2;
    const min = Math.min(...values.filter(v => typeof v === 'number'));
    const max = Math.max(...values.filter(v => typeof v === 'number'));
    const span = (max - min) || 1;
    const pts = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - 2 * pad);
      const y = pad + (1 - ((v - min) / span)) * (h - 2 * pad);
      return `${x},${y}`;
    }).join(' ');
    const last = values[values.length - 1];
    return (
      <div style={{ display: 'inline-block', marginRight: 10 }}>
        <div style={{ fontSize: 12, marginBottom: 2, opacity: 0.85 }}>{label}: {Number(last).toFixed(1)} {unit}</div>
        <svg width={w} height={h} style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 4 }}>
          <polyline points={pts} fill="none" stroke="var(--accent, #2c5530)" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  return (
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
        <div className="mappage-map-container">
          <CesiumMap
            baseLayer={baseLayer}
            showCountryBorders={showCountryBorders}
            onLocationSelect={(loc) => {
              // Support both entity-based selection and raw coords
              if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
                setClickedCoords({ lat: loc.lat, lon: loc.lon });
                // Trigger NASA POWER fetch
                loadClimate(loc.lat, loc.lon);
              }
              setSelectedLocation(loc);
              // Reset flower pagination when new location is selected
              setCurrentFlowerPage(0);
            }}
          />
        </div>

        {/* Floral Country Panel - Left Side */}
        {shouldShowFloralInfo(selectedLocation) && (
          <div className="mappage-coffee-panel">
            {(() => {
              const countryInfo = getCountryFloralInfo(selectedLocation);
              const countryName = typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name;
              
              return (
                <>
                  <div className="mappage-coffee-header">
                    <h3>{countryInfo?.flag} Flora de {countryName}</h3>
                    <div className="mappage-coffee-subtitle">{countryInfo?.climate} • {countryInfo?.biomes}</div>
                  </div>
                  
                  {/* Flower Pagination Navigation */}
                  <div className="flower-pagination-header">
                    <div className="flower-counter">
                      {currentFlowerPage + 1} de {countryInfo?.topFlowers?.length || 0} flores
                    </div>
                    <div className="flower-navigation">
                      <button 
                        className="flower-nav-btn" 
                        onClick={() => {
                          const newPage = currentFlowerPage > 0 ? currentFlowerPage - 1 : (countryInfo?.topFlowers?.length - 1) || 0;
                          setCurrentFlowerPage(newPage);
                        }}
                        disabled={!countryInfo?.topFlowers?.length}
                      >
                        <ChevronLeft size={20} />
                        Anterior
                      </button>
                      <button 
                        className="flower-nav-btn" 
                        onClick={() => {
                          const newPage = currentFlowerPage < (countryInfo?.topFlowers?.length - 1) ? currentFlowerPage + 1 : 0;
                          setCurrentFlowerPage(newPage);
                        }}
                        disabled={!countryInfo?.topFlowers?.length}
                      >
                        Siguiente
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Single Flower Display */}
                  <div className="flower-page-container">
                    {countryInfo?.topFlowers && countryInfo.topFlowers[currentFlowerPage] && (
                      <div className="flower-card">
                        <div className="flower-image-container">
                          <img 
                            src={countryInfo.topFlowers[currentFlowerPage].image} 
                            alt={countryInfo.topFlowers[currentFlowerPage].name}
                            className="flower-image"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200/2c5530/ffffff?text=Flower+Image';
                            }}
                          />
                          <div className="flower-overlay">
                            <h4 className="flower-name">{countryInfo.topFlowers[currentFlowerPage].name}</h4>
                            <p className="flower-scientific">{countryInfo.topFlowers[currentFlowerPage].scientificName}</p>
                          </div>
                        </div>
                        
                        <div className="flower-details">
                          <div className="flower-section">
                            <h5>🌍 Ubicación y Georreferencia</h5>
                            <ul>
                              <li><strong>Nombre científico:</strong> {countryInfo.topFlowers[currentFlowerPage].scientificName}</li>
                              <li><strong>Distribución natural:</strong> {countryInfo.topFlowers[currentFlowerPage].distribution || countryInfo.topFlowers[currentFlowerPage].habitat}</li>
                              <li><strong>Rango altitudinal:</strong> {countryInfo.topFlowers[currentFlowerPage].altitude || 'Variable según región'}</li>
                              <li><strong>Países nativos:</strong> {countryInfo.topFlowers[currentFlowerPage].nativeCountries || countryName}</li>
                            </ul>
                          </div>

                          <div className="flower-section">
                            <h5>🌱 Tipo de Cultivo</h5>
                            <ul>
                              <li><strong>Familia:</strong> {countryInfo.topFlowers[currentFlowerPage].family || 'Información no disponible'}</li>
                              <li><strong>Nombre común:</strong> {countryInfo.topFlowers[currentFlowerPage].name}</li>
                              <li><strong>Estatus nacional:</strong> {countryInfo.topFlowers[currentFlowerPage].description}</li>
                              <li><strong>Usos documentados:</strong> {countryInfo.topFlowers[currentFlowerPage].uses}</li>
                            </ul>
                          </div>

                          <div className="flower-section">
                            <h5>🌺 Estado Fenológico y Características Botánicas</h5>
                            <ul>
                              <li><strong>Porte:</strong> {countryInfo.topFlowers[currentFlowerPage].height || 'Variable según especie'}</li>
                              <li><strong>Hojas:</strong> {countryInfo.topFlowers[currentFlowerPage].leaves || 'Características típicas de la familia'}</li>
                              <li><strong>Flores:</strong> {countryInfo.topFlowers[currentFlowerPage].flowers || countryInfo.topFlowers[currentFlowerPage].description}</li>
                              <li><strong>Floración:</strong> {countryInfo.topFlowers[currentFlowerPage].flowering || countryInfo.topFlowers[currentFlowerPage].season}</li>
                              <li><strong>Polinización:</strong> {countryInfo.topFlowers[currentFlowerPage].pollination || 'Polinizadores nativos'}</li>
                            </ul>
                          </div>

                          <div className="flower-section">
                            <h5>🌿 Datos Ambientales y Ecológicos</h5>
                            <ul>
                              <li><strong>Clima:</strong> {countryInfo.topFlowers[currentFlowerPage].climate || countryInfo.climate}</li>
                              <li><strong>Temperatura:</strong> {countryInfo.topFlowers[currentFlowerPage].temperature || 'Adaptada al clima local'}</li>
                              <li><strong>Precipitación:</strong> {countryInfo.topFlowers[currentFlowerPage].precipitation || 'Según régimen climático'}</li>
                              <li><strong>Suelos:</strong> {countryInfo.topFlowers[currentFlowerPage].soil || 'Suelos nativos de la región'}</li>
                              <li><strong>Asociaciones ecológicas:</strong> {countryInfo.topFlowers[currentFlowerPage].habitat}</li>
                            </ul>
                          </div>

                          <div className="flower-section">
                            <h5>📋 Datos de Propagación Documentados</h5>
                            <ul>
                              <li><strong>Métodos:</strong> {countryInfo.topFlowers[currentFlowerPage].propagation || 'Semillas y métodos tradicionales'}</li>
                              <li><strong>Germinación:</strong> {countryInfo.topFlowers[currentFlowerPage].germination || 'Según condiciones locales'}</li>
                              <li><strong>Crecimiento:</strong> {countryInfo.topFlowers[currentFlowerPage].growth || 'Adaptado al clima local'}</li>
                              <li><strong>Longevidad:</strong> {countryInfo.topFlowers[currentFlowerPage].longevity || 'Variable según cuidados'}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Layer Control Panel */}
        {showLayers && (
          <div className="mappage-layers-panel">
            <h3>Map Layers</h3>
            <div className="mappage-map-modes">
              {layerOptions.map(mode => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    className={`mappage-mode-btn ${baseLayer === mode.id ? 'active' : ''}`}
                    onClick={() => handleChangeBase(mode.id)}
                  >
                    <IconComponent size={16} />
                    <span>{mode.name}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="mappage-layer-options">
              <label className="mappage-checkbox">
                <input type="checkbox" checked={showCountryBorders} onChange={toggleBorders} />
                <span>Country Borders (Natural Earth)</span>
              </label>
            </div>
          </div>
        )}

        {/* Information Panel */}
        {showInfo && (
          <div className="mappage-info-panel">
            <div className="mappage-info-header">
              <h3>Location Details</h3>
            </div>
            
            {selectedLocation ? (
              <div className="mappage-location-details">
                <h4>{typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name}</h4>
                <div className="mappage-details-grid">
                  {/* Climáticas actuales */}
                  <div className="mappage-detail-item full-width">
                    <span className="mappage-detail-label">🌡️ Condiciones actuales</span>
                    {climateLoading && <span className="mappage-detail-value">Cargando…</span>}
                    {climateError && <span className="mappage-detail-value" style={{color:'var(--danger, #b00)'}}>Error: {climateError}</span>}
                    {(!climateLoading && !climateError && climateCurrent) && (
                      <div className="mappage-conditions-list">
                        <div>
                          Temperatura: {climateCurrent.T2M!=null? Number(climateCurrent.T2M).toFixed(1)+'°C':'N/D'}
                          {' '} (Max: {climateCurrent.T2M_MAX!=null? Number(climateCurrent.T2M_MAX).toFixed(0)+'°C':'N/D'}, Min: {climateCurrent.T2M_MIN!=null? Number(climateCurrent.T2M_MIN).toFixed(0)+'°C':'N/D'})
                        </div>
                        <div>Precipitación: {climateCurrent.PRECTOTCORR!=null? Number(climateCurrent.PRECTOTCORR).toFixed(1)+' mm/día':'N/D'}</div>
                        <div>Humedad: {climateCurrent.RH2M!=null? Number(climateCurrent.RH2M).toFixed(0)+'%':'N/D'}</div>
                        <div>Radiación: {climateCurrent.ALLSKY_SFC_SW_DWN!=null? Number(climateCurrent.ALLSKY_SFC_SW_DWN).toFixed(1)+' kW-h/m²/día':'N/D'}</div>
                      </div>
                    )}
                  </div>

                  {/* Predicción floración */}
                  {(!climateLoading && !climateError && bloomIndex != null) && (
                    <div className="mappage-detail-item full-width">
                      <span className="mappage-detail-label">📈 Predicción Floración</span>
                      <div className="mappage-conditions-list">
                        <div>Índice: {bloomIndex.toFixed(2)} ({bloomIndexMeta?.label || '-'})</div>
                        <div>Floración esperada: 15-20 días</div>
                        <div>Confianza: 75%</div>
                      </div>
                    </div>
                  )}

                  {/* Tendencias (últimos 60 días) */}
                  {(!climateLoading && !climateError && Array.isArray(climateSeries) && climateSeries.length > 0) && (
                    <div className="mappage-detail-item full-width">
                      <span className="mappage-detail-label">📊 Tendencias (60 días)</span>
                      <div className="mappage-trends">
                        {renderSparkline(climateSeries.map(d => d.T2M).filter(v=>v!=null), '°C', 'Temp')}
                        {renderSparkline(climateSeries.map(d => d.PRECTOTCORR).filter(v=>v!=null), 'mm/d', 'Prec')}
                        {renderSparkline(climateSeries.map(d => d.ALLSKY_SFC_SW_DWN).filter(v=>v!=null), 'kWh/m²', 'Rad')}
                      </div>
                    </div>
                  )}

                  {/* Baseline climatológica */}
                  {(!climateLoading && !climateError && Array.isArray(climBaseline) && climBaseline.length > 0) && (
                    <div className="mappage-detail-item full-width">
                      <span className="mappage-detail-label">📚 Baseline (2001–2020)</span>
                      <div className="mappage-trends">
                        {renderSparkline(climBaseline.map(d => d.T2M).filter(v=>v!=null), '°C', 'Temp (mensual)')}
                        {renderSparkline(climBaseline.map(d => d.PRECTOTCORR).filter(v=>v!=null), 'mm/d', 'Prec (mensual)')}
                      </div>
                    </div>
                  )}

                  {/* Condiciones ideales */}
                  {(!climateLoading && !climateError && idealChecks.length > 0) && (
                    <div className="mappage-detail-item full-width">
                      <span className="mappage-detail-label">🌿 Condiciones Ideales</span>
                      <ul className="mappage-ideal-list">
                        {idealChecks.map(item => (
                          <li key={item.key} className={item.ok ? 'ok' : 'warn'}>
                            {item.ok ? '✅' : '⚠️'} {item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}


                </div>
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
      <div className="mappage-stats-bar">
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
  );
};

export default MapPage;