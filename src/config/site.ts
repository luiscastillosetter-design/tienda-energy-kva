export interface SiteCategory {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  iconName: 'LayoutGrid' | 'Zap' | 'BatteryCharging' | 'Sun' | 'Cable' | 'Wrench' | 'Shield';
  image: string;
}

export interface PaymentAccount {
  label: string;
  value: string;
  copyValue?: string;
}

export interface PaymentMethodConfig {
  id: 'pago_movil' | 'transferencia' | 'zelle' | 'binance' | 'efectivo';
  name: string;
  shortLabel: string;
  currency: 'VES' | 'USD' | 'USDT';
  requiresReference: boolean;
  requiresReceipt: boolean;
  instructions: string;
  details: PaymentAccount[];
}

export const siteConfig = {
  name: 'ENERGY KVA',
  storeName: 'ENERGY KVA C.A.',
  slogan: 'Soluciones en Alta y Baja Tensión',
  tagline: 'Transformadores, Respaldo Energético, Protección Industrial e Iluminación',
  description:
    'Ingeniería y suministro eléctrico de grado industrial en Guanare, Portuguesa. Transformadores de distribución, respaldo anti-apagones, iluminación solar y protección eléctrica con despacho a toda Venezuela.',
  location: 'Guanare, Edo. Portuguesa - Carrera 11 entre calles 18 y 19',
  email: 'ventas@energykva.com',
  currencySymbol: '$',
  freeShippingThreshold: 50,
  whatsappNumber: '+58 414-0909873',
  contact: {
    whatsapp: '584140909873',
    phoneDisplay: '0414-0909873',
    email: 'ventas@energykva.com',
  },
  whatsapp: {
    number: '584140909873',
    defaultMessage: 'Hola equipo de ENERGY KVA C.A., solicito asesoría técnica y cotización de equipos industriales.',
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
  paymentMethods: [
    {
      id: 'pago_movil',
      name: 'Pago Móvil (Bs a Tasa BCV)',
      shortLabel: 'Pago Móvil (Bs)',
      currency: 'VES',
      requiresReference: true,
      requiresReceipt: true,
      instructions: 'Realiza el Pago Móvil en Bolívares al cambio BCV del día, ingresa los dígitos completos de la referencia y adjunta la captura del comprobante.',
      details: [
        { label: 'Banco', value: 'BBVA Provincial (0108)', copyValue: '0108' },
        { label: 'Teléfono', value: '0414-0909873', copyValue: '04140909873' },
        { label: 'C.I. / RIF', value: 'V-22981292', copyValue: '22981292' },
        { label: 'Titular', value: 'María Fernanda Craveiro Sánchez' },
      ],
    },
    {
      id: 'transferencia',
      name: 'Transferencia Bancaria en Bs (Banesco / Provincial)',
      shortLabel: 'Transferencia (Bs)',
      currency: 'VES',
      requiresReference: true,
      requiresReceipt: true,
      instructions: 'Transfiere el monto exacto en Bolívares (Tasa BCV) a cualquiera de nuestras cuentas autorizadas, coloca el número de referencia completo y sube la captura.',
      details: [
        { label: 'Banesco', value: '0134-0338-47-3381058114', copyValue: '01340338473381058114' },
        { label: 'BBVA Provincial (Opción 1)', value: '0108-0066-81-0100710994', copyValue: '01080066810100710994' },
        { label: 'BBVA Provincial (Opción 2)', value: '0108-2421-49-0100135855', copyValue: '01082421490100135855' },
        { label: 'C.I. / Titular', value: 'V-22981292 • María Fernanda Craveiro Sánchez', copyValue: '22981292' },
      ],
    },
    {
      id: 'zelle',
      name: 'Zelle ($ USD)',
      shortLabel: 'Zelle ($)',
      currency: 'USD',
      requiresReference: false,
      requiresReceipt: true,
      instructions: 'Envía el pago en dólares por Zelle y sube la captura del comprobante de pago para validación por administración.',
      details: [
        { label: 'Correo Zelle', value: 'marcosrivero0207@gmail.com', copyValue: 'marcosrivero0207@gmail.com' },
        { label: 'Titular', value: 'Marcos Rivero Pietrobon', copyValue: 'Marcos Rivero Pietrobon' },
      ],
    },
    {
      id: 'binance',
      name: 'Binance Pay (USDT)',
      shortLabel: 'Binance (USDT)',
      currency: 'USDT',
      requiresReference: false,
      requiresReceipt: true,
      instructions: 'Envía el monto en USDT a través de Binance Pay al usuario indicado y sube la captura del comprobante.',
      details: [
        { label: 'Usuario / Pay ID Binance', value: 'craveirokva', copyValue: 'craveirokva' },
        { label: 'Titular', value: 'ENERGY KVA C.A. (craveirokva)' },
      ],
    },
    {
      id: 'efectivo',
      name: 'Efectivo en $ Americanos (Por Tienda)',
      shortLabel: 'Efectivo $ (En Tienda)',
      currency: 'USD',
      requiresReference: false,
      requiresReceipt: false,
      instructions: 'Tu pedido pasará a Valery y quedará reservado para que realices el pago en efectivo ($ USD) directamente en nuestra sede física en Guanare.',
      details: [
        { label: 'Sede Física', value: 'Guanare, Edo. Portuguesa - Carrera 11 entre calles 18 y 19' },
        { label: 'Validación', value: 'Recepción y facturación directa por Administración en tienda' },
      ],
    },
  ] as PaymentMethodConfig[],
  navigation: [
    { name: 'Inicio', href: '/' },
    { name: 'Catálogo Industrial', href: '/catalogo' },
    { name: 'Ofertas y Lotes', href: '/#ofertas' },
    { name: 'Asesoría Proyectos', href: 'https://wa.me/584140909873' },
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
      id: 'TRANSFORMADORES',
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