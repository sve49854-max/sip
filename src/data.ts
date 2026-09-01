export const partners = [
  'Promart',
  'Oechsle',
  'Makro',
  'Mifarma',
  'Inkafarma',
  'plazaVea',
  'Real Plaza',
  'Vivanda',
] as const

export const navItems = [
  {
    label: 'Productos',
    href: '#productos',
    children: [
      { label: 'Cuenta CTS', href: '#hero' },
      { label: 'AhorraMás', href: '#interes' },
      { label: 'Depósito a plazo fijo', href: '#interes' },
      { label: 'Tarjeta de Crédito Sip', href: '#interes' },
      { label: 'Tarjeta de Débito Sip', href: '#interes' },
      { label: 'Crédito Efectivo', href: '#interes' },
    ],
  },
  {
    label: 'Beneficios',
    href: '#por-que',
    children: [
      { label: 'Recompensas', href: '#por-que' },
      { label: 'Súper tasa CTS', href: '#simular' },
      { label: 'Descuentos Intercorp', href: '#por-que' },
    ],
  },
  {
    label: 'Canales Digitales',
    href: '#app',
    children: [
      { label: 'App Sip', href: '#app' },
      { label: 'Sip en línea', href: '#app' },
    ],
  },
  {
    label: 'Ayuda',
    href: '#faq',
    children: [
      { label: 'Preguntas frecuentes', href: '#faq' },
      { label: 'Centro de Ayuda', href: '#faq' },
      { label: 'Libro de reclamaciones', href: '#footer' },
    ],
  },
] as const

export const whyItems = [
  {
    title: 'Operaciones 100% digital',
    text: 'Solicitud de apertura y cancelación desde la app o web.',
    icon: 'phone',
  },
  {
    title: 'Super tasa especial',
    text: 'Tu dinero crece con nuestra súper tasa especial en soles.',
    icon: 'percent',
  },
  {
    title: 'Mayor seguridad para ti',
    text: 'Con el respaldo del grupo Intercorp y por el Fondo Seguro de Depósito.',
    icon: 'lock',
  },
] as const

export const documents = [
  'Contrato más cartilla informativa',
  'Tarifario CTS',
  'CTS para extranjeros',
  'Información de Interés CTS',
  'Fórmulas y ejemplos',
  'Manual de abono para empleador',
  'Manual de Uso Web CTS',
  'Para empresas: Plantilla Aperturas',
  'Para empresas: Macro Abono Semestral',
  'Traslado CTS desde otra entidad a SIP',
  'Traslado CTS desde SIP a otra entidad',
] as const

export const faqs = [
  {
    q: '¿Tiene algún costo trasladar mi CTS?',
    a: 'El traslado de tu CTS a Sip no tiene ningún costo y recibirás el importe de tu CTS previo al traslado.',
  },
  {
    q: '¿Cuánto demora el trámite de traslado de la CTS?',
    a: 'El trámite puede tomar hasta 15 días hábiles, desde que tu empleador presenta la solicitud ante la entidad donde tienes tu CTS actualmente.',
  },
  {
    q: '¿Me van a cobrar comisiones y/o mantenimientos de algún tipo por mi cuenta CTS?',
    a: 'No. Tu Cuenta CTS en Sip no tiene comisiones ni costo de mantenimiento.',
  },
  {
    q: '¿Qué es el Fondo de Seguro de Depósito?',
    a: 'Es un seguro que protege tus depósitos en entidades supervisadas por la SBS. El monto de cobertura se actualiza trimestralmente.',
  },
  {
    q: 'Retiro el 100% disponible de mi CTS',
    a: 'Según la normativa vigente puedes disponer del 100% de tu CTS. Revisa las condiciones actualizadas en el tarifario y en el Centro de Ayuda.',
  },
] as const

export const related = [
  {
    title: 'Disposición de efectivo',
    text: 'Retira efectivo de la línea de tu tarjeta crédito Sip',
    tag: '100% digital',
    image: '/disposicion-efectivo.png',
  },
  {
    title: 'Depósito a plazo fijo',
    text: 'Abre tu cuenta 100% digital con nuestra tasa de interés preferencial.',
    tag: '100% digital',
    image: '/deposito-plazo.png',
  },
  {
    title: 'Opciones de financiamiento',
    text: 'Conoce las opciones de financiamiento que tiene Sip y descubre la manera más conveniente para ordenar tus pagos.',
    tag: '',
    image: '/financiamiento.jpg',
  },
  {
    title: 'Tarjeta de Crédito Sip',
    text: 'Solicita tu tarjeta de crédito y recógela en Centros de Atención.',
    tag: '100% digital',
    image: '/credito-sip.png',
  },
  {
    title: 'Tarjeta de Crédito Sip con Garantía',
    text: 'Solicita tu tarjeta de crédito y empieza a comprar 100% digital al instante.',
    tag: '',
    image: '/credito-garantia.png',
  },
] as const

export const TREA = 0.065
