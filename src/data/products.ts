export interface Product {
  id: string;
  title: string;
  price: number;
  badge?: string;
  images: string[];
  description: string;
  features: string[];
  category: string;
  stock?: number;
}

export const products: Product[] = [
  {
    id: 'transformador-25kva',
    title: 'Transformador de Distribución 25 KVA Monofásico',
    price: 1450.00,
    badge: 'Industrial',
    category: 'TRANSFORMADORES',
    images: [],
    description: 'Transformador en baño de aceite diseñado para tendidos eléctricos, fincas y zonas agroindustriales en Portuguesa con garantía certificada.',
    features: [
      'Capacidad nominal: 25 KVA',
      'Voltaje Primario: 13.800V',
      'Voltaje Secundario: 120/240V',
      'Normativa: Estándares Corpoelec / CADAFE'
    ],
    stock: 4
  },
  {
    id: 'transformador-50kva',
    title: 'Transformador Monofásico 50 KVA 13.8kV Tipo Poste',
    price: 2350.00,
    badge: 'Alta Tensión',
    category: 'TRANSFORMADORES',
    images: [],
    description: 'Transformador convencional de alta eficiencia para proyectos agroindustriales, urbanismos y plantas procesadoras.',
    features: [
      'Potencia continua: 50 KVA',
      'Bobinado de cobre electrolítico de alta pureza',
      'Tanque sellado con pintura electrostática anticorrosiva',
      'Pruebas de protocolo incluidas'
    ],
    stock: 3
  },
  {
    id: 'estacion-portatil-300w',
    title: 'Estación de Energía Portátil 300W LiFePO4 Anti-Apagones',
    price: 145.00,
    badge: 'Stock Limitado',
    category: 'RESPALDO',
    images: [],
    description: 'Batería LiFePO4 de alta duración con salidas AC 110V onda pura, USB-C PD y panel LED. Ideal para mantener operativos routers, laptops, puntos de venta y ventiladores.',
    features: [
      'Potencia continua: 300W (Picos de 600W)',
      'Química LiFePO4 (+3.000 ciclos de vida)',
      'Carga rápida por red 110V o panel solar',
      'Pantalla digital inteligente de autonomía'
    ],
    stock: 12
  },
  {
    id: 'planta-diesel-15kva',
    title: 'Planta Eléctrica Diésel Insonorizada 15 KVA Bifásica',
    price: 3490.00,
    badge: 'Envío Gratis',
    category: 'RESPALDO',
    images: [],
    description: 'Generador industrial diésel con cabina ultra silenciosa y tablero de transferencia automática (ATS) incluido para respaldo continuo.',
    features: [
      'Potencia Standby: 15 KVA (120V/240V)',
      'Incluye módulo ATS (Arranque automático por corte)',
      'Cabina insonorizada intemperie',
      'Autonomía continua de hasta 14 horas'
    ],
    stock: 2
  },
  {
    id: 'luminaria-solar-150w',
    title: 'Luminaria Vial Solar LED 150W All-In-One IP65',
    price: 38.00,
    badge: 'Oferta',
    category: 'ILUMINACION',
    images: [],
    description: 'Alumbrado público e industrial autónomo de alto flujo luminoso con panel solar monocristalino integrado y sensor radar.',
    features: [
      'Potencia lumínica: 150W LED SMD de alto brillo',
      'Batería Litio Ferroso integrada de 12 horas',
      'Control remoto incluido y sensor crepuscular',
      'Grado de protección IP65 contra tormentas'
    ],
    stock: 35
  },
  {
    id: 'barra-copperweld-240',
    title: 'Barra Copperweld Puesta a Tierra 5/8" x 2.40 Mts + Conector',
    price: 19.00,
    badge: 'Certificado',
    category: 'CONDUCTORES',
    images: [],
    description: 'Electrodo de acero con recubrimiento electrolítico de cobre puro para sistemas de aterramiento de transformadores, pararrayos y tableros.',
    features: [
      'Longitud reglamentaria: 2.40 metros',
      'Diámetro: 5/8 pulgada con conector de bronce',
      'Alta disipación de descargas atmosféricas',
      'Resistencia superior a la corrosión del suelo'
    ],
    stock: 60
  },
  {
    id: 'crimpeadora-pelacable',
    title: 'Crimpeadora Hidráulica Profesional 16 Toneladas (10-300mm²)',
    price: 68.00,
    badge: 'Oferta',
    category: 'HERRAMIENTAS',
    images: [],
    description: 'Prensa terminales hidráulica de alto tonelaje con juego completo de dados hexagonales para cables de cobre y aluminio de alta y baja tensión.',
    features: [
      'Fuerza de compresión: 16 Toneladas',
      'Rango de dados: 10mm² hasta 300mm²',
      'Cabezal rotativo de 180° en acero forjado',
      'Maletín rígido de transporte incluido'
    ],
    stock: 15
  },
  {
    id: 'supresor-industrial-trifasico',
    title: 'Protector y Supresor de Picos Industrial Trifásico 100kA',
    price: 115.00,
    badge: 'Envío Gratis',
    category: 'PROTECCION',
    images: [],
    description: 'Dispositivo de protección contra sobretensiones transitorias (DPS) y descargas atmosféricas para tableros principales y maquinaria.',
    features: [
      'Capacidad de descarga máxima: 100 kA',
      'Protección Trifásica + Neutro + Tierra',
      'Tiempo de respuesta térmico < 25 nanosegundos',
      'Indicadores LED de estado por cada fase'
    ],
    stock: 10
  }
];

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getAllProductIds(): string[] {
  return products.map((product) => product.id);
}