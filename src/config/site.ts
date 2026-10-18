export interface SiteCategory {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  iconName: 'LayoutGrid' | 'Zap' | 'BatteryCharging' | 'Sun' | 'Cable' | 'Wrench' | 'Shield';
  image: string;
}

export const siteConfig = {
  name: 'ENERGY KVA',
  storeName: 'ENERGY KVA',
  slogan: 'Soluciones en Alta y Baja Tensión',
  tagline: 'Transformadores, Respaldo Energético, Protección Industrial e Iluminación',
  description:
    'Ingeniería y suministro eléctrico de grado industrial en Guanare, Portuguesa. Transformadores de distribución, respaldo anti-apagones, iluminación solar y protección eléctrica con despacho a toda Venezuela.',
  location: 'Guanare, Edo. Portuguesa - Carrera 11 entre calles 18 y 19',
  email: 'ventas@energykva.com',
  currencySymbol: '$',
  freeShippingThreshold: 50,
  whatsappNumber: '+58 414-0000000',
  contact: {
    whatsapp: '584140000000',
    phoneDisplay: '+58 414-0000000',
    email: 'ventas@energykva.com',
  },
  whatsapp: {
    number: '584140000000',
    defaultMessage: 'Hola equipo de ENERGY KVA, solicito asesoría técnica y cotización de equipos industriales.',
  },
  branding: {
    logoWhite: '/branding/logo-white.png',
    logoDark: '/branding/logo-dark.png',
    videoMobile: '/videos/hero-mobile.mp4',
    videoDesktop: '/videos/hero-desktop.mp4',
  },
  colors: {
    pearlWhite: '#F6F8FB',
    glassDark: '#0A0E17',
    cyanGlow: '#00D2FF',
  },
  navigation: [
    { name: 'Inicio', href: '/' },
    { name: 'Catálogo Industrial', href: '/catalogo' },
    { name: 'Ofertas y Lotes', href: '/#ofertas' },
    { name: 'Asesoría Proyectos', href: 'https://wa.me/584140000000' },
    { name: 'Finalizar Compra', href: '/checkout' },
  ],
  categories: [
    {
      id: 'Todos',
      name: 'Catálogo Completo',
      shortName: 'Todos',
      slug: 'todos',
      iconName: 'LayoutGrid',
      image: '/categories/todos.png',
    },
    {
      id: 'TRANSFORMADORES', /* ID UNIFICADO */
      name: 'Transformadores y Alta Tensión',
      shortName: 'Transformadores',
      slug: 'transformadores',
      iconName: 'Zap',
      image: '/categories/smarthome.png',
    },
    {
      id: 'RESPALDO',
      name: 'Respaldo y Anti-Apagones',
      shortName: 'Respaldo',
      slug: 'respaldo',
      iconName: 'BatteryCharging',
      image: '/categories/gadgets.png',
    },
    {
      id: 'ILUMINACION',
      name: 'Iluminación Industrial y Solar',
      shortName: 'Iluminación',
      slug: 'iluminacion',
      iconName: 'Sun',
      image: '/categories/sonido.png',
    },
    {
      id: 'CONDUCTORES',
      name: 'Conductores y Puesta a Tierra',
      shortName: 'Conductores',
      slug: 'conductores',
      iconName: 'Cable',
      image: '/categories/phone.png',
    },
    {
      id: 'HERRAMIENTAS',
      name: 'Herramientas de Tendido',
      shortName: 'Herramientas',
      slug: 'herramientas',
      iconName: 'Wrench',
      image: '/categories/gadgets.png',
    },
    {
      id: 'PROTECCION',
      name: 'Protección y Maniobra',
      shortName: 'Protección',
      slug: 'proteccion',
      iconName: 'Shield',
      image: '/categories/gaming.png',
    },
  ] as SiteCategory[],
};