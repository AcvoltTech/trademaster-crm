/* ==================== AI ONBOARDING - TRADE MASTER CRM ==================== */
/* Complete AI Tour Guide with detailed section descriptions and how-to guidance */

(function() {
  'use strict';

  // ==================== SECTION KNOWLEDGE BASE ====================
  // Each section has: icon, title, description, features[], howTo[], tips[]
  const SECTIONS = {
    dashboard: {
      icon: '📊', title: 'Tablero / Dashboard',
      desc: '¡Este es tu Centro de Mando! Aquí ves todo lo que está pasando en tu negocio en tiempo real: trabajos activos, técnicos en campo, llamadas de servicio, y vendedores. Es como el tablero de un avión — de un vistazo sabes cómo va todo.',
      features: [
        'Centro de Mando con trabajos ganados, llamadas activas, técnicos disponibles y Home Advisors',
        'Mapa de operaciones en tiempo real — ves dónde están tus técnicos y trabajos en el mapa',
        'Estado de todo el personal — quién está disponible, ocupado u offline',
        'Instalaciones en progreso con pipeline visual (Agendada → En Progreso → Inspección → Completada)',
        'KPIs del año: ingresos ganados, trabajos completados, ticket promedio, nuevos trabajos',
        'Reloj de Entrada/Salida con tarifa por hora y cálculo de ganancias del día',
        'Flujo de Estimados: Abiertos → Aprobados → Facturados → Cobrados',
        'Flujo de Efectivo mensual y trabajos recientes / próximas citas',
        'Planes de Servicio (membresías de mantenimiento recurrente)'
      ],
      howTo: [
        '📌 Haz clic en cualquier tarjeta del Centro de Mando para ir directo a esa sección',
        '📌 Usa el botón "+" en cada tarjeta para crear un nuevo trabajo, llamada o cita rápidamente',
        '📌 El mapa muestra 🟢 técnicos disponibles, 🟡 ocupados, 🟣 vendedores, 🔴 trabajos nuevos, 🔵 en progreso',
        '📌 Selecciona un técnico en el Reloj y haz clic "Marcar Entrada" para registrar su hora de llegada',
        '📌 Cambia el período de los KPIs: Año, Mes, Últimos 30 días, o Últimos 90 días'
      ],
      tips: [
        '💡 Revisa tu Dashboard cada mañana para planear el día',
        '💡 El "Flujo de Estimados" te muestra tu pipeline de ventas — cuánto dinero viene en camino',
        '💡 Crea Planes de Servicio (membresías) para tener ingresos recurrentes mensuales'
      ]
    },

    leads: {
      icon: '🎯', title: 'Leads / Prospectos',
      desc: 'Aquí registras a las personas que llamaron pidiendo servicio o presupuesto, pero que aún NO son clientes confirmados. Es tu "lista de oportunidades" — cada lead es dinero potencial. El objetivo es convertir estos leads en trabajos ganados.',
      features: [
        'Formulario completo: nombre, teléfono, email, servicio necesario, tipo de propiedad y dirección',
        'Filtros por estado: Nuevo, Contactado, Cotizado, Ganado, Perdido',
        'Mapa de Leads con ubicación exacta para planear rutas de visita',
        'Pipeline visual que muestra el flujo de leads por etapas',
        'Integración automática: cuando ganas un lead, se crea como cliente'
      ],
      howTo: [
        '📌 Haz clic en "+ Nuevo Lead" para agregar un nuevo prospecto',
        '📌 Llena nombre, teléfono y dirección. El servicio requerido y tipo de propiedad ayudan a priorizar',
        '📌 El lead aparecerá en el mapa — útil para agrupar visitas por zona geográfica',
        '📌 Cambia el estado del lead conforme avanzas: Nuevo → Contactado → Cotizado → Ganado o Perdido',
        '📌 Cuando ganas un lead, el sistema lo convierte en cliente automáticamente'
      ],
      tips: [
        '💡 Registra TODOS los leads, incluso los que parecen pequeños — un service call puede terminar en una instalación de $15,000',
        '💡 Usa el mapa de leads para agrupar visitas por zona y ahorrar gasolina',
        '💡 Sigue up cada lead en 24-48 horas — la velocidad de respuesta gana trabajos'
      ]
    },

    servicecalls: {
      icon: '📞', title: 'Llamadas de Servicio',
      desc: 'Aquí controlas todas las llamadas de emergencia y servicio que entran. Cada llamada se trackea desde que llega (Nueva) hasta que se completa. Es tu centro de despacho para reparaciones y emergencias.',
      features: [
        'KPIs en tiempo real: Nuevas (sin asignar), Asignadas, En Camino, Completadas hoy',
        'Formulario detallado: cliente, teléfono, dirección, problema, urgencia (Normal/Prioritario/Emergencia)',
        'Asignación de técnico y programación de fecha/hora preferida',
        'Tarjetas visuales para cada llamada con estado y acciones rápidas',
        'Mapa de Llamadas de Servicio con código de colores por estado',
        'Filtros: Activas, Nuevas sin asignar, Asignadas, En Progreso, Completadas'
      ],
      howTo: [
        '📌 Haz clic en "+ Nueva Llamada" cuando recibas una llamada de servicio',
        '📌 Llena el nombre del cliente, teléfono, dirección y describe el problema (ej: "AC no enfría")',
        '📌 Selecciona la urgencia: 🟢 Normal, 🟡 Prioritario, 🔴 Emergencia',
        '📌 Asigna un técnico disponible o déjalo sin asignar para después',
        '📌 El técnico puede actualizar el estado: Asignada → En Camino → Completada',
        '📌 Usa los filtros para ver solo las llamadas activas o por estado específico'
      ],
      tips: [
        '💡 Las emergencias de AC (sin aire en verano) son urgentes — asigna al técnico más cercano',
        '💡 Siempre registra el problema del cliente con detalle — ayuda al técnico a preparar las partes correctas',
        '💡 Revisa las llamadas "sin asignar" frecuentemente para que ningún cliente quede esperando'
      ]
    },

    dispatch: {
      icon: '🚚', title: 'Despacho / Dispatch',
      desc: 'El Despacho es tu central de operaciones. Desde aquí coordinas a todos tus técnicos en campo — ves dónde están, qué están haciendo, y puedes asignarles nuevos trabajos. Incluye el perfil del Coordinador de Despacho.',
      features: [
        'Coordinador de Despacho — asigna quién es el responsable con foto, nombre, puesto, teléfono y turno',
        'Mapa de despacho en tiempo real con ubicación de técnicos y trabajos',
        'Vista de todos los trabajos pendientes de asignación',
        'Asignación rápida de técnicos a trabajos por ubicación',
        'Panel de técnicos disponibles, ocupados y offline'
      ],
      howTo: [
        '📌 Primero configura el Coordinador de Despacho: nombre, foto, teléfono y turno',
        '📌 El mapa muestra técnicos (puntos verdes/amarillos) y trabajos (puntos rojos/azules)',
        '📌 Haz clic en un técnico en el mapa para ver su ubicación exacta y trabajos asignados',
        '📌 Arrastra o asigna trabajos a técnicos basándote en su ubicación y disponibilidad',
        '📌 El coordinador puede subir su foto de perfil para que el equipo lo identifique'
      ],
      tips: [
        '💡 Asigna técnicos al trabajo más CERCANO para minimizar tiempo de viaje',
        '💡 Ten siempre un técnico "de guardia" para emergencias',
        '💡 El link de tracking permite que los técnicos reporten su ubicación desde su celular'
      ]
    },

    jobs: {
      icon: '🔧', title: 'Trabajos y Estimados',
      desc: 'Aquí creas estimados profesionales para tus clientes. El sistema tiene más de 150 partes de HVAC con precios, calcula labor, service call, impuestos, descuentos y genera PDFs que puedes presentar al cliente en su puerta.',
      features: [
        'Creador de Estimados en 5 pasos: Trabajo → Equipo → Service Call → Componentes → Resumen',
        'Selección de tipo de equipo: AC, Heat Pump, Furnace 80%/90%, Mini Split, Package Unit',
        'Service Call Fee automático por distancia: $70 (0-10mi), $120 (10-20mi), $200 (20+mi)',
        'Catálogo de 150+ componentes HVAC con precios configurables',
        'Decisión del cliente: ✅ Hacer reparación, ❌ Solo service call, 🔄 Quiere equipo nuevo',
        'Referencia automática a Home Advisor cuando el equipo tiene 15+ años',
        'Generación de PDF profesional y presentación al cliente',
        'Permisos y documentos del trabajo (inspecciones, fotos antes/después)',
        'Estimados guardados con historial completo'
      ],
      howTo: [
        '📌 Paso 1: Selecciona o crea un trabajo',
        '📌 Paso 2: Elige el tipo de equipo (AC, Heat Pump, Furnace, etc.) y llena modelo, serial, marca y edad',
        '📌 Paso 3: Selecciona el Service Call Fee según la distancia al cliente',
        '📌 Paso 4: Agrega los componentes/partes que necesita la reparación',
        '📌 Paso 5: Revisa el resumen, aplica descuento e impuesto, y genera el PDF',
        '📌 Si el equipo tiene +15 años, el sistema sugiere referir al Home Advisor para reemplazo',
        '📌 Usa "Presentar al Cliente" para mostrar el estimado en pantalla completa al cliente'
      ],
      tips: [
        '💡 Siempre cobra el Service Call — es tu ingreso garantizado aunque el cliente diga que no',
        '💡 Si el cliente dice NO a la reparación, igual cobra el service call y ofrece opciones',
        '💡 Sube fotos del equipo (data plate, modelo, serial, condición) como evidencia',
        '💡 Configura tus precios en la Lista de Precios para que los estimados sean consistentes'
      ]
    },

    technicians: {
      icon: '👷', title: 'Técnicos',
      desc: 'Administra a todo tu equipo de técnicos. Cada uno tiene su perfil con especialidad, certificaciones, documentos del vehículo, y foto. Puedes generar tarjetas de identificación (ID Cards) profesionales para cada técnico.',
      features: [
        'Perfil completo del técnico: nombre, teléfono, email, especialidad, tarifa por hora',
        'Foto del técnico con opción de subir o tomar foto con la cámara',
        'Credenciales y Certificaciones: EPA 608, NATE, OSHA, HVAC Excellence, NCCER, licencia de manejar',
        'Documentos del Vehículo: registración, seguro comercial con fechas de vencimiento',
        'Generador de tarjeta de identificación (ID Card) profesional',
        'Información del vehículo: modelo, placas, VIN, color',
        'Link de Tracking GPS para que los técnicos reporten su ubicación desde su celular'
      ],
      howTo: [
        '📌 Haz clic en "+ Agregar Técnico" para registrar un nuevo técnico',
        '📌 Llena nombre, teléfono, especialidad y tarifa por hora',
        '📌 En "Credenciales" sube las certificaciones de cada técnico (EPA 608, NATE, etc.)',
        '📌 Las fechas de vencimiento te alertan cuando un documento está por expirar',
        '📌 Haz clic en "Generar ID Card" para crear una identificación profesional',
        '📌 Comparte el Link de Tracking con tus técnicos para seguimiento GPS en tiempo real'
      ],
      tips: [
        '💡 Mantén TODAS las certificaciones al día — son requeridas por ley y empresas comerciales',
        '💡 Las ID Cards dan imagen profesional a tu empresa — imprime una para cada técnico',
        '💡 El tracking GPS te permite saber dónde está cada técnico y optimizar rutas'
      ]
    },

    advisors: {
      icon: '🏠', title: 'Home Advisors / Vendedores',
      desc: 'Administra a tus vendedores (Home Advisors) que cierran ventas de instalaciones nuevas. Incluye sistema de comisiones por tiers basado en ganancia, asignación de leads, seguimiento de ventas, recibos del vendedor con conciliación automática.',
      features: [
        'Sistema de comisiones por tiers: 20% (+$10K ganancia), 15% ($7K-$9.9K), 10% ($5K-$6.9K), 5% (<$5K)',
        '4 pestañas: Vendedores, Leads Asignados, Ventas y Comisiones, Recibos y Conciliación',
        'Perfil de cada vendedor: nombre, teléfono, especialidad, zona de cobertura, meta mensual',
        'Asignación de leads a vendedores con fuente del lead (empresa vs propio)',
        'Alerta de leads por vencer (+15 días sin cerrar se rotan automáticamente)',
        'Registro de ventas cerradas con cálculo automático de comisión',
        'Conciliación de recibos: compara lo que dice el vendedor vs. lo que tiene la empresa',
        'Registro de seguimientos (follow-ups): llamadas, visitas, cotizaciones, textos, emails',
        'Órdenes referidas por técnicos — leads pre-calificados para reemplazo de equipo'
      ],
      howTo: [
        '📌 En la pestaña "Vendedores": agrega vendedores con su zona y meta mensual',
        '📌 En "Leads Asignados": asigna leads a vendedores y trackea el estado',
        '📌 En "Ventas y Comisiones": registra cada venta cerrada — el sistema calcula la comisión automáticamente',
        '📌 En "Recibos": el vendedor sube sus recibos y el sistema los compara con los de la empresa',
        '📌 Usa "Registrar Seguimiento" para documentar cada llamada/visita a un lead'
      ],
      tips: [
        '💡 Los leads que un técnico refiere (equipo +15 años) son ORO — ya están pre-calificados',
        '💡 Las comisiones por tiers motivan a los vendedores a negociar mejor para ganar más',
        '💡 La conciliación de recibos evita fraude y asegura que los montos coincidan'
      ]
    },

    clients: {
      icon: '👥', title: 'Clientes',
      desc: 'Tu base de datos de clientes registrados. Cada cliente tiene un perfil completo con historial de trabajos, estimados, facturas, notas internas, archivos adjuntos, y registro de comunicaciones. Es como un expediente completo de cada cliente.',
      features: [
        'Lista de clientes con búsqueda rápida y filtros',
        'Perfil del Cliente 360°: información de contacto, dirección, tipo de propiedad',
        'Historial reciente (timeline) de todas las interacciones',
        'Pestaña de Trabajos: todos los trabajos realizados para este cliente',
        'Pestaña de Estimados: cotizaciones enviadas',
        'Pestaña de Facturas: facturas y estado de pago',
        'Pestaña de Notas: notas internas del equipo',
        'Pestaña de Archivos: documentos, fotos, PDFs adjuntos',
        'Pestaña de Comunicaciones: registro de llamadas, textos, emails, visitas',
        'Indicador de límite de clientes según tu plan (Free: 10, Pro: 50, Enterprise: Ilimitados)'
      ],
      howTo: [
        '📌 Haz clic en "+ Agregar Cliente" para registrar uno nuevo',
        '📌 Haz clic en el nombre de un cliente para abrir su perfil completo',
        '📌 En el perfil, usa las pestañas para navegar entre Trabajos, Estimados, Facturas, Notas, etc.',
        '📌 En "Comunicaciones" registra cada llamada o contacto que hagas con el cliente',
        '📌 Sube archivos como contratos, fotos de equipo, o documentos importantes en "Archivos"'
      ],
      tips: [
        '💡 Agrega notas internas después de cada visita — tu futuro yo te lo agradecerá',
        '💡 El historial de comunicaciones demuestra profesionalismo si hay un reclamo',
        '💡 Si llegas al límite de clientes, actualiza tu plan para seguir creciendo'
      ]
    },

    invoices: {
      icon: '📄', title: 'Facturas',
      desc: 'Crea y administra facturas profesionales para tus clientes. Puedes crear facturas desde un trabajo existente o manualmente. Incluye líneas de factura, service call, descuento, impuesto, y puedes enviar el PDF al cliente.',
      features: [
        'KPIs de facturación: Total facturado, Pagado, Pendiente, Vencido',
        'Crear factura desde un trabajo o manualmente',
        'Líneas de factura con descripción, cantidad y precio',
        'Service Call Fee, Descuento % y Tax % configurables',
        'Vista previa de totales en tiempo real',
        'Estados: Borrador, Enviada, Pagada, Pago Parcial, Vencida, Cancelada',
        'Detalle completo de cada factura con acciones: enviar, marcar pagada, generar PDF',
        'Notas para el cliente y notas internas'
      ],
      howTo: [
        '📌 Haz clic en "+ Nueva Factura" para crear una',
        '📌 Selecciona "Crear desde Trabajo" para cargar los datos automáticamente, o llena manualmente',
        '📌 Agrega líneas de factura con el botón "+ Agregar Línea"',
        '📌 Configura el service call fee, descuento e impuesto',
        '📌 Guarda como borrador o envía directamente al cliente',
        '📌 Usa los filtros para ver facturas por estado (Pagadas, Vencidas, etc.)'
      ],
      tips: [
        '💡 Siempre crea la factura ANTES de salir del trabajo — no dejes dinero en la mesa',
        '💡 Las facturas vencidas aparecen en rojo — dale seguimiento inmediato',
        '💡 Usa "Notas internas" para apuntar cosas que el cliente NO necesita ver'
      ]
    },

    collections: {
      icon: '💰', title: 'Cobranza',
      desc: 'Aquí das seguimiento a todas las facturas pendientes de cobro. Ves cuánto te deben, qué facturas están vencidas, y puedes registrar pagos parciales. Es tu herramienta para asegurar que el dinero entre.',
      features: [
        'KPIs de cobranza: Total pendiente, Vencido, Pago parcial, Recién pagado',
        'Filtros: Todas con balance, Vencidas, Pago parcial, Enviadas sin pago, Recién pagadas',
        'Registro de pagos recibidos con fecha, monto y método de pago',
        'Historial completo de pagos',
        'Vista de clientes con balance pendiente'
      ],
      howTo: [
        '📌 Revisa esta sección diariamente para saber qué facturas están pendientes',
        '📌 Filtra por "Vencidas" para priorizar cobros urgentes',
        '📌 Registra cada pago recibido para mantener los balances actualizados',
        '📌 Usa el historial de pagos para referencia si un cliente cuestiona un cargo'
      ],
      tips: [
        '💡 Cobra ANTES de salir del trabajo siempre que sea posible',
        '💡 Haz follow-up a facturas vencidas cada 3-5 días',
        '💡 Ofrece descuento por pago inmediato si es necesario para cerrar'
      ]
    },

    receipts: {
      icon: '🧾', title: 'Recibos',
      desc: 'Registra y organiza todos los recibos de compras de materiales y partes. Incluye foto del recibo, proveedor (Johnstone, Ferguson, Home Depot, etc.), categoría, monto, impuesto, y relación con trabajo. Perfecto para impuestos y control de gastos.',
      features: [
        'KPIs: Total del mes, Total del año, promedio por recibo, total por categoría',
        'Proveedores pre-configurados: Johnstone Supply, Ferguson, Carrier Enterprise, US Air, Home Depot, Amazon, etc.',
        'Categorías HVAC: Equipos AC, Refrigeración, Calefacción, Partes, Refrigerantes, Herramientas, Eléctrico, Ductos',
        'Foto del recibo con cámara o galería',
        'Relación con trabajo para saber cuánto costó cada job',
        'Método de pago: tarjeta, efectivo, cheque, cuenta del proveedor',
        'Filtros por proveedor, categoría y mes',
        'Exportar a CSV para tu contador'
      ],
      howTo: [
        '📌 Haz clic en "+ Nuevo Recibo" cada vez que compres material',
        '📌 Selecciona el proveedor, categoría y toma foto del recibo',
        '📌 Relaciona el recibo con el trabajo si aplica',
        '📌 Al final del mes, exporta a CSV para tu contador o QuickBooks',
        '📌 Usa los filtros para ver gastos por proveedor o categoría'
      ],
      tips: [
        '💡 Toma foto del recibo INMEDIATAMENTE — los recibos térmicos se borran con el tiempo',
        '💡 Categoriza correctamente — tu contador lo necesita para impuestos',
        '💡 El reporte por proveedor te muestra dónde estás gastando más'
      ]
    },

    expenses: {
      icon: '🏢', title: 'Gastos del Negocio',
      desc: 'Administra TODOS los gastos fijos y recurrentes de tu negocio: renta, seguros, licencias, vehículos, software, préstamos, impuestos. Te ayuda a saber exactamente cuánto te cuesta operar cada mes. Incluye link a QuickBooks.',
      features: [
        'KPIs: Gastos fijos mensuales, Gastos variables del mes, Total gastos, Link a QuickBooks',
        'Categorías organizadas: Local/Oficina, Vehículos, Seguros, Licencias, Software, Financiero',
        'Frecuencia de pago: mensual, trimestral, semestral, anual, una vez',
        'Método de pago: ACH, tarjeta, cheque, efectivo, transferencia',
        'Separación de gastos fijos vs. variables',
        'Reporte de gastos para análisis financiero'
      ],
      howTo: [
        '📌 Haz clic en "+ Agregar Gasto" para registrar un gasto recurrente',
        '📌 Selecciona la categoría adecuada (ej: Renta, Seguro, Gasolina)',
        '📌 Configura la frecuencia de pago para gastos recurrentes',
        '📌 Clasifica como Gasto Fijo (renta, seguros) o Variable (gasolina, partes)',
        '📌 El link a QuickBooks te lleva directo a tu contabilidad'
      ],
      tips: [
        '💡 Registra TODOS tus gastos — conocer tu costo real de operación es clave para cobrar bien',
        '💡 Los gastos fijos son los que pagas llueva o truene — estos determinan tu "punto de equilibrio"',
        '💡 Revisa mensualmente si hay gastos que puedes reducir o eliminar'
      ]
    },

    mymoney: {
      icon: '💵', title: 'Mi Dinero',
      desc: 'Tu resumen financiero personal como dueño del negocio. Ves ingresos, gastos, ganancia neta y lo que te deben. Solo el dueño/CEO tiene acceso a esta sección — nadie más de tu equipo puede verla.',
      features: [
        'KPIs: Ingresos del mes, Gastos del mes, Ganancia Neta, Por Cobrar',
        'Gráfica de Ganancia/Pérdida mensual',
        'Tabla de transacciones con detalle',
        'Formulario para agregar gastos personales del negocio',
        'Filtros por período: Este Mes, Trimestre, Año'
      ],
      howTo: [
        '📌 Revisa tus KPIs semanalmente para saber cómo va tu negocio',
        '📌 La gráfica te muestra la tendencia — ¿estás subiendo o bajando?',
        '📌 Agrega gastos que no están en otras secciones',
        '📌 "Por Cobrar" te dice cuánto dinero está flotando en facturas pendientes'
      ],
      tips: [
        '💡 Si tus gastos son mayores que tus ingresos, algo necesita cambiar — ¡actúa rápido!',
        '💡 Tu ganancia neta REAL es después de restar TODOS los gastos, no solo materiales',
        '💡 Esta sección es SOLO para el dueño — tu equipo NO la puede ver'
      ]
    },

    payroll: {
      icon: '💳', title: 'Nómina / Payroll',
      desc: 'Administra la nómina de todos tus empleados. Registra horas trabajadas, calcula pagos, y lleva un historial completo. Compatible con períodos semanales, quincenales y mensuales.',
      features: [
        'KPIs: Empleados activos, Total nómina del período, Horas de la semana, Pendientes por procesar',
        'Registro de entradas: nombre, horas regulares, overtime, tarifa, bonos, deducciones',
        'Períodos de pago: Semanal, Quincenal, Mensual',
        'Cálculo automático de overtime (1.5x después de 8 hrs/día en California)',
        'Historial de nómina por empleado'
      ],
      howTo: [
        '📌 Haz clic en "+ Agregar Entrada" para registrar las horas de un empleado',
        '📌 Ingresa horas regulares y overtime por separado',
        '📌 Agrega bonos (ej: por trabajo extra) o deducciones (ej: préstamo)',
        '📌 Selecciona el período de pago que uses',
        '📌 Procesa la nómina y marca como pagada cuando hagas el pago'
      ],
      tips: [
        '💡 En California, overtime es después de 8 horas al DÍA, no 40 a la semana',
        '💡 Usa el reloj de entrada/salida del Dashboard para tener horas exactas',
        '💡 Mantén un registro detallado — es tu protección legal'
      ]
    },

    mailbox: {
      icon: '📬', title: 'Correo del Negocio',
      desc: 'Registra y organiza TODA la correspondencia importante de tu negocio: cartas de seguros, del gobierno, proveedores, bancos, legal. Sube fotos/PDFs de cada documento. Es tu archivo digital de correo físico y digital.',
      features: [
        'Tipo de correo: Entrante y Saliente',
        'Prioridad: Normal, Importante, Urgente',
        'Categorías: Factura, Seguros, Gobierno, Impuestos, Banco, Proveedor, Legal, Garantía, Cliente',
        'Adjuntar documento (foto, PDF, scan)',
        'Marcar si requiere acción (aparece en pendientes)',
        'Tabs: Todos, Entrante, Saliente, Urgente, Archivado'
      ],
      howTo: [
        '📌 Cada vez que recibas correo importante del negocio, regístralo aquí',
        '📌 Toma foto o escanea el documento y adjúntalo',
        '📌 Marca "Requiere Acción" para lo que necesita tu atención',
        '📌 Categoriza correctamente para encontrarlo fácilmente después',
        '📌 Archiva lo que ya procesaste para mantener limpio tu buzón'
      ],
      tips: [
        '💡 NUNCA tires un documento importante sin escanearlo primero aquí',
        '💡 Las renovaciones de seguros y licencias tienen fecha límite — márcalas como urgentes',
        '💡 Este archivo te salva si necesitas un documento en una auditoría o reclamo'
      ]
    },

    marketing: {
      icon: '📣', title: 'Mercadotecnia',
      desc: 'Tu centro de marketing digital con acceso directo a TODAS las plataformas de generación de leads (Facebook, Google, Yelp, Angi, HomeAdvisor, Thumbtack, etc.), redes sociales, y herramientas de diseño. También creas y trackeas campañas de marketing.',
      features: [
        'KPIs: Reseñas, Campañas activas, Fuentes de leads, ROI',
        'Acceso directo a plataformas de leads: Facebook Marketplace, Google Ads, Yelp, Angi, HomeAdvisor, Thumbtack, Nextdoor, Bark, Networx',
        'Redes Sociales: Facebook, Instagram, TikTok, YouTube, LinkedIn, X, Pinterest, WhatsApp Business',
        'Herramientas: Canva, Mailchimp, Google Analytics, Search Console',
        'Crear y trackear campañas de marketing (email, SMS, redes, postal, referidos, ads)',
        'Solicitar reseñas a clientes satisfechos (Google, Yelp, Facebook, Nextdoor)',
        'Desglose de fuentes de leads para saber qué canal te trae más trabajo'
      ],
      howTo: [
        '📌 Haz clic en cualquier plataforma para abrirla directamente en otra pestaña',
        '📌 Crea una campaña nueva con presupuesto, fecha de inicio/fin y mensaje',
        '📌 Usa "Solicitar Reseñas" para enviar requests a clientes contentos',
        '📌 Revisa el desglose de fuentes de leads para saber dónde invertir tu dinero de publicidad'
      ],
      tips: [
        '💡 Las reseñas en Google son ORO — pide reseña después de cada trabajo bien hecho',
        '💡 Mide el ROI de cada campaña — no gastes donde no hay retorno',
        '💡 Mantén tu perfil de Google My Business actualizado con fotos y horarios'
      ]
    },

    pricebook: {
      icon: '📒', title: 'Lista de Precios / Price Book',
      desc: 'Tu catálogo completo de precios HVAC con más de 150 componentes. Incluye links directos a los principales distribuidores (Ferguson, Johnstone, Carrier, US Air, Gemaire, Grainger, etc.) para comparar precios y ordenar partes.',
      features: [
        'Catálogo de 150+ componentes HVAC organizados por categoría',
        'Precios de costo y venta configurables',
        'Links a proveedores: Ferguson, Johnstone Supply, Carrier Enterprise, US Air Conditioning, Gemaire, Grainger, Winsupply, Baker, Lennox',
        'Botón "Cargar Catálogo HVAC Completo" para cargar todos los componentes',
        'Categorías: Compresores, Motores, Capacitores, Contactores, Controles, Refrigerante, etc.'
      ],
      howTo: [
        '📌 Haz clic en "Cargar Catálogo HVAC Completo" para tener todos los componentes',
        '📌 Edita los precios según lo que cobras tú (el costo ya viene pre-configurado)',
        '📌 Haz clic en cualquier proveedor para abrir su sitio y verificar precios',
        '📌 Los precios del Price Book se usan automáticamente al crear estimados'
      ],
      tips: [
        '💡 Revisa tus precios cada temporada — los costos de materiales cambian',
        '💡 Tu precio de VENTA debe incluir: costo de la parte + markup + costo de tu tiempo',
        '💡 Compara precios entre distribuidores — a veces hay diferencias de 20-30%'
      ]
    },

    reports: {
      icon: '📊', title: 'Reportes',
      desc: 'Genera reportes detallados de tu negocio. Analiza ingresos, gastos, trabajos completados, rendimiento de técnicos, y tendencias. Los datos te ayudan a tomar mejores decisiones para crecer.',
      features: [
        'Reportes de ingresos por período',
        'Análisis de trabajos completados vs. cotizados',
        'Rendimiento por técnico',
        'Análisis de fuentes de leads',
        'Reporte de gastos por categoría',
        'Tendencias mensuales y anuales'
      ],
      howTo: [
        '📌 Selecciona el tipo de reporte que necesitas',
        '📌 Filtra por período: semana, mes, trimestre, año',
        '📌 Los gráficos te muestran tendencias — busca patrones',
        '📌 Exporta reportes para compartir con tu contador o socios'
      ],
      tips: [
        '💡 Revisa reportes mensualmente como mínimo',
        '💡 Compara mes vs. mes anterior para identificar tendencias',
        '💡 Los reportes te dicen la verdad — úsalos para tomar decisiones, no la intuición'
      ]
    },

    team: {
      icon: '👥', title: 'Usuarios y Equipo',
      desc: 'Administra quién puede acceder a tu CRM y qué puede ver cada persona. Hay 5 roles: Dueño/CEO (acceso total), Contabilidad (finanzas), Coordinador de Despacho (operaciones), Técnico (solo sus trabajos), y Solo Vista (solo ve, no edita).',
      features: [
        '5 roles con permisos diferentes: Dueño, Contabilidad, Coordinador, Técnico, Solo Vista',
        'Crear usuarios con nombre, email, teléfono, username y contraseña',
        'Vista previa de permisos de cada rol antes de asignar',
        'Activar/Desactivar usuarios sin borrarlos',
        'Sesiones activas — ve quién está conectado en este momento'
      ],
      howTo: [
        '📌 Solo el Dueño/CEO puede agregar o modificar usuarios',
        '📌 Haz clic en "+ Agregar Usuario" y selecciona el rol adecuado',
        '📌 El sistema muestra qué permisos tendrá cada rol antes de guardarlo',
        '📌 Para desactivar un usuario, cámbialo a "Inactivo" en lugar de borrarlo'
      ],
      tips: [
        '💡 El técnico SOLO ve sus trabajos asignados — no puede ver facturas ni finanzas',
        '💡 Contabilidad puede ver nómina y gastos, pero NO "Mi Dinero" del dueño',
        '💡 Usa "Solo Vista" para socios o asesores que necesitan ver reportes sin editar nada'
      ]
    },

    hr: {
      icon: '🛡️', title: 'Recursos Humanos',
      desc: 'Gestión de recursos humanos de tu empresa. Documentos de empleados, contratos, políticas de la empresa, y expedientes laborales.',
      features: [
        'Expedientes digitales de empleados',
        'Documentos de contratación',
        'Políticas de la empresa',
        'Contratos y acuerdos'
      ],
      howTo: [
        '📌 Sube los documentos de cada empleado (I-9, W-4, contrato)',
        '📌 Mantén actualizados los expedientes para cumplir con la ley laboral'
      ],
      tips: [
        '💡 Consulta con un abogado laboral para tener tus documentos en orden',
        '💡 En California, los requisitos de empleados son estrictos — mantén todo documentado'
      ]
    },

    settings: {
      icon: '⚙️', title: 'Configuración',
      desc: 'Configura tu empresa: logo, nombre, teléfono, email, dirección, licencia de contratista, bond, nombre del dueño. También sube documentos legales de la empresa (Workers Comp, General Liability, W-9, Bond) y configura las cláusulas de tus estimados y facturas.',
      features: [
        'Logo de la empresa (se muestra en estimados y facturas)',
        'Datos de la empresa: nombre, teléfono, email, dirección',
        'Licencia de Contratista (C-10, C-20) y Bond',
        'Documentos de la empresa: Workers Comp, General Liability, W-9, Bond, Business License',
        'Fechas de vencimiento con alertas',
        'Cláusulas legales para estimados y facturas (cancelación, restocking, garantía, EPA, permisos, etc.)',
        'Generador de datos demo para probar el sistema'
      ],
      howTo: [
        '📌 Sube tu logo — aparecerá en todos los estimados y facturas',
        '📌 Llena todos los datos de la empresa para que aparezcan en documentos',
        '📌 Sube tus documentos de seguros y licencias con fechas de vencimiento',
        '📌 Revisa y personaliza las cláusulas legales (el sistema trae defaults para California)',
        '📌 Usa "Crear Datos Demo" para probar el sistema con datos de ejemplo'
      ],
      tips: [
        '💡 Tu logo y datos profesionales en los documentos dan confianza al cliente',
        '💡 Muchas empresas comerciales te piden Workers Comp y General Liability antes de contratarte',
        '💡 Las cláusulas legales te protegen — revísalas con tu abogado'
      ]
    },

    pipeline: {
      icon: '📈', title: 'Pipeline / Flujo de Ventas',
      desc: 'Tu Kanban board visual del flujo de ventas. Ve todos tus estimados organizados por etapa: Nuevos → Cotizados → Aprobados → Agendados → Ganados. Te muestra la tasa de conversión y el valor total del pipeline.',
      features: [
        'Kanban Board con 5 columnas: Nuevos, Cotizados, Aprobados, Agendados, Ganados',
        'Filtro por período: Todos, Esta Semana, Este Mes, Este Trimestre',
        'KPIs: Valor Total del pipeline, Tasa de Conversión, Trato Promedio, Días para Cerrar',
        'Tarjetas visuales para cada estimado con monto y cliente'
      ],
      howTo: [
        '📌 Cada estimado aparece como una tarjeta en la columna de su estado actual',
        '📌 El Kanban te muestra cuánto dinero tienes en cada etapa',
        '📌 Filtra por período para ver solo los estimados de esta semana o mes',
        '📌 La "Tasa de Conversión" te dice qué porcentaje de cotizaciones se convierte en trabajo ganado'
      ],
      tips: [
        '💡 Si tu pipeline está vacío, necesitas más leads y cotizaciones',
        '💡 Si tienes muchos cotizados pero pocos ganados, tu precio o tu follow-up necesitan trabajo',
        '💡 Un pipeline saludable tiene estimados en TODAS las etapas'
      ]
    }
  };

  // ==================== TOUR SEQUENCE ====================
  const TOUR_ORDER = [
    'dashboard', 'leads', 'servicecalls', 'dispatch', 'jobs', 'technicians', 'advisors',
    'clients', 'invoices', 'collections', 'receipts', 'expenses', 'mymoney', 'payroll',
    'mailbox', 'marketing', 'pricebook', 'reports', 'team', 'hr', 'settings', 'pipeline'
  ];

  // ==================== CATEGORY GROUPS ====================
  const CATEGORIES = {
    'Operaciones': ['dashboard', 'leads', 'servicecalls', 'dispatch', 'jobs', 'technicians', 'advisors'],
    'Finanzas': ['invoices', 'collections', 'receipts', 'expenses', 'mymoney', 'payroll'],
    'Comunicación': ['mailbox'],
    'Crecimiento': ['marketing', 'pricebook', 'reports', 'pipeline'],
    'Sistema': ['team', 'hr', 'settings']
  };

  // ==================== STATE ====================
  let isOpen = false;
  let tourStep = -1; // -1 = no tour active
  let chatHistory = [];

  // ==================== CREATE UI ====================
  function init() {
    createFloatingButton();
    createChatPanel();
    console.log('✅ AI Onboarding Guide — Enhanced Tour System loaded');
  }

  function createFloatingButton() {
    const btn = document.createElement('button');
    btn.className = 'ai-float-btn';
    btn.id = 'aiFloatBtn';
    btn.innerHTML = '<svg viewBox="0 0 120 120" width="36" height="36"><clipPath id="aiL"><rect x="0" y="0" width="60" height="120"/></clipPath><clipPath id="aiR"><rect x="60" y="0" width="60" height="120"/></clipPath><path d="M60 4 A56 56 0 0 0 60 116 Z" fill="#1e3a5f"/><path d="M60 4 A56 56 0 0 1 60 116 Z" fill="#7f1d1d"/><g clip-path="url(#aiL)"><line x1="38" y1="28" x2="38" y2="92" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="60" x2="58" y2="60" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/><line x1="22" y1="38" x2="54" y2="82" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/><line x1="54" y1="38" x2="22" y2="82" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/><line x1="38" y1="28" x2="32" y2="34" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/><line x1="38" y1="28" x2="44" y2="34" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/><line x1="38" y1="92" x2="32" y2="86" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/><line x1="38" y1="92" x2="44" y2="86" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="60" x2="20" y2="54" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="60" x2="20" y2="66" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/><circle cx="26" cy="45" r="2" fill="#93c5fd"/><circle cx="26" cy="75" r="2" fill="#93c5fd"/><circle cx="48" cy="45" r="2" fill="#93c5fd"/><circle cx="48" cy="75" r="2" fill="#93c5fd"/></g><g clip-path="url(#aiR)"><path d="M82 88 C82 88 68 72 68 58 C68 44 76 38 80 30 C80 30 82 44 88 48 C90 38 94 34 94 34 C94 34 100 50 100 62 C100 76 92 88 82 88 Z" fill="#f97316" opacity="0.9"/><path d="M82 88 C82 88 74 78 74 68 C74 58 78 52 82 46 C82 46 84 56 88 58 C88 52 92 48 92 48 C92 48 96 58 96 66 C96 78 88 88 82 88 Z" fill="#fbbf24" opacity="0.9"/><path d="M82 88 C82 88 78 82 78 76 C78 70 80 66 82 60 C84 66 86 70 86 76 C86 82 82 88 82 88 Z" fill="#fef3c7"/></g><line x1="60" y1="8" x2="60" y2="112" stroke="white" stroke-width="2" opacity="0.3"/><circle cx="60" cy="60" r="56" fill="none" stroke="white" stroke-width="1.5" opacity="0.15"/></svg>';
    btn.title = 'Asistente AI — Tour del CRM';
    btn.onclick = togglePanel;
    // New user badge
    if (!localStorage.getItem('tm_ai_visited')) {
      const badge = document.createElement('div');
      badge.className = 'ai-new-badge';
      btn.appendChild(badge);
    }
    document.body.appendChild(btn);
  }

  function createChatPanel() {
    const panel = document.createElement('div');
    panel.className = 'ai-chat-panel';
    panel.id = 'aiChatPanel';
    panel.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-header-left">
          <div class="ai-chat-avatar"><svg viewBox="0 0 120 120" width="32" height="32"><clipPath id="aiHL"><rect x="0" y="0" width="60" height="120"/></clipPath><clipPath id="aiHR"><rect x="60" y="0" width="60" height="120"/></clipPath><path d="M60 4 A56 56 0 0 0 60 116 Z" fill="#1e3a5f"/><path d="M60 4 A56 56 0 0 1 60 116 Z" fill="#7f1d1d"/><g clip-path="url(#aiHL)"><line x1="38" y1="28" x2="38" y2="92" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="60" x2="58" y2="60" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/><line x1="22" y1="38" x2="54" y2="82" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/><line x1="54" y1="38" x2="22" y2="82" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/><circle cx="26" cy="45" r="2" fill="#93c5fd"/><circle cx="26" cy="75" r="2" fill="#93c5fd"/><circle cx="48" cy="45" r="2" fill="#93c5fd"/><circle cx="48" cy="75" r="2" fill="#93c5fd"/></g><g clip-path="url(#aiHR)"><path d="M82 88 C82 88 68 72 68 58 C68 44 76 38 80 30 C80 30 82 44 88 48 C90 38 94 34 94 34 C94 34 100 50 100 62 C100 76 92 88 82 88 Z" fill="#f97316" opacity="0.9"/><path d="M82 88 C82 88 74 78 74 68 C74 58 78 52 82 46 C82 46 84 56 88 58 C88 52 92 48 92 48 C92 48 96 58 96 66 C96 78 88 88 82 88 Z" fill="#fbbf24" opacity="0.9"/><path d="M82 88 C82 88 78 82 78 76 C78 70 80 66 82 60 C84 66 86 70 86 76 C86 82 82 88 82 88 Z" fill="#fef3c7"/></g><line x1="60" y1="8" x2="60" y2="112" stroke="white" stroke-width="2" opacity="0.3"/><circle cx="60" cy="60" r="56" fill="none" stroke="white" stroke-width="1.5" opacity="0.15"/></svg></div>
          <div>
            <h3>Trade Master AI</h3>
            <small>Tu guía del CRM • Pregúntame cualquier cosa</small>
          </div>
        </div>
        <button class="ai-chat-close" onclick="window._aiOnboarding.toggle()">✕</button>
      </div>
      <div id="aiTourProgress" class="ai-tour-progress" style="display:none;">
        <div class="ai-tour-progress-bar"><div class="ai-tour-progress-fill" id="aiTourFill" style="width:0%"></div></div>
        <span class="ai-tour-progress-text" id="aiTourText">0 / ${TOUR_ORDER.length}</span>
      </div>
      <div class="ai-chat-messages" id="aiMessages"></div>
      <div class="ai-chat-input-area">
        <input class="ai-chat-input" id="aiInput" placeholder="Escribe tu pregunta..." onkeydown="if(event.key==='Enter')window._aiOnboarding.send()">
        <button class="ai-chat-send" onclick="window._aiOnboarding.send()">➤</button>
      </div>
    `;
    document.body.appendChild(panel);
  }

  // ==================== TOGGLE PANEL ====================
  function togglePanel() {
    isOpen = !isOpen;
    const panel = document.getElementById('aiChatPanel');
    if (isOpen) {
      panel.classList.add('open');
      localStorage.setItem('tm_ai_visited', '1');
      // Remove new badge
      const badge = document.querySelector('.ai-new-badge');
      if (badge) badge.remove();
      // Show welcome if first time
      if (chatHistory.length === 0) showWelcome();
    } else {
      panel.classList.remove('open');
    }
  }

  // ==================== WELCOME MESSAGE ====================
  function showWelcome() {
    const companyName = document.getElementById('companyDisplay')?.textContent || 'tu empresa';
    addBotMessage(`
      <strong>¡Hola! 👋 Bienvenido a Trade Master CRM</strong><br><br>
      Soy tu asistente AI y estoy aquí para enseñarte <strong>TODO</strong> lo que puedes hacer en este CRM. 
      No solo te digo dónde estás — te <strong>explico cada sección a detalle</strong>, qué hace, cómo usarla, y te doy tips profesionales.<br><br>
      ¿Qué quieres hacer?
    `, [
      { label: '🎓 Tour Completo del CRM', action: 'startTour' },
      { label: '📋 Ver Secciones por Categoría', action: 'showCategories' },
      { label: '❓ Pregunta sobre esta sección', action: 'currentSection' }
    ]);
  }

  // ==================== ADD MESSAGES ====================
  function addBotMessage(html, quickActions, sectionCard) {
    const msgs = document.getElementById('aiMessages');
    const div = document.createElement('div');
    div.className = 'ai-msg bot';
    
    let content = html;
    
    if (sectionCard) {
      content += `
        <div class="ai-section-card">
          <h4>${sectionCard.icon} ${sectionCard.title}</h4>
          <p>${sectionCard.desc}</p>
          ${sectionCard.features ? `<ul class="ai-feature-list">${sectionCard.features.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}
          ${sectionCard.goTo ? `<button class="ai-go-btn" onclick="window._aiOnboarding.goToSection('${sectionCard.goTo}')">👉 Ir a ${sectionCard.title}</button>` : ''}
        </div>
      `;
    }
    
    if (quickActions && quickActions.length) {
      content += '<div class="ai-quick-actions">';
      quickActions.forEach(a => {
        content += `<button class="ai-quick-btn" onclick="window._aiOnboarding.handleAction('${a.action}')">${a.label}</button>`;
      });
      content += '</div>';
    }
    
    div.innerHTML = content;
    msgs.appendChild(div);
    chatHistory.push({ role: 'bot', content: html });
    scrollToBottom();
  }

  function addUserMessage(text) {
    const msgs = document.getElementById('aiMessages');
    const div = document.createElement('div');
    div.className = 'ai-msg user';
    div.textContent = text;
    msgs.appendChild(div);
    chatHistory.push({ role: 'user', content: text });
    scrollToBottom();
  }

  function showTyping() {
    const msgs = document.getElementById('aiMessages');
    const div = document.createElement('div');
    div.className = 'ai-typing';
    div.id = 'aiTyping';
    div.innerHTML = '<div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div>';
    msgs.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('aiTyping');
    if (el) el.remove();
  }

  function scrollToBottom() {
    const msgs = document.getElementById('aiMessages');
    setTimeout(() => msgs.scrollTop = msgs.scrollHeight, 100);
  }

  // ==================== SEND MESSAGE ====================
  function sendMessage() {
    const input = document.getElementById('aiInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUserMessage(text);
    showTyping();
    setTimeout(() => {
      hideTyping();
      processUserMessage(text);
    }, 600);
  }

  // ==================== PROCESS USER MESSAGE ====================
  function processUserMessage(text) {
    const lower = text.toLowerCase();

    // Tour requests
    if (lower.includes('tour') || lower.includes('recorrido') || lower.includes('enseña') || lower.includes('enséña') || lower.includes('muéstrame todo') || lower.includes('mostrar todo')) {
      handleAction('startTour');
      return;
    }

    // Category requests
    if (lower.includes('categor') || lower.includes('secciones') || lower.includes('menú') || lower.includes('menu')) {
      handleAction('showCategories');
      return;
    }

    // Current section
    if (lower.includes('dónde estoy') || lower.includes('donde estoy') || lower.includes('esta sección') || lower.includes('esta seccion') || lower.includes('qué es esto') || lower.includes('que es esto')) {
      handleAction('currentSection');
      return;
    }

    // Search for specific section
    const matchedSection = findSectionByQuery(lower);
    if (matchedSection) {
      showSectionDetail(matchedSection);
      return;
    }

    // How to / Como
    if (lower.includes('cómo') || lower.includes('como') || lower.includes('how')) {
      const sectionMatch = findSectionByQuery(lower);
      if (sectionMatch) {
        showHowTo(sectionMatch);
        return;
      }
    }

    // Tips
    if (lower.includes('tip') || lower.includes('consejo') || lower.includes('recomend')) {
      const sectionMatch = findSectionByQuery(lower);
      if (sectionMatch) {
        showTips(sectionMatch);
        return;
      }
    }

    // Next / Siguiente
    if (lower.includes('siguiente') || lower.includes('next') || lower.includes('continuar')) {
      if (tourStep >= 0) { tourNext(); return; }
    }

    // Default: try to match or show help
    addBotMessage(`
      No encontré una sección específica para "<strong>${text}</strong>", pero puedo ayudarte de varias formas:
    `, [
      { label: '🎓 Tour Completo', action: 'startTour' },
      { label: '📋 Ver Categorías', action: 'showCategories' },
      { label: '❓ ¿Dónde estoy?', action: 'currentSection' },
      { label: '💡 Tips Generales', action: 'generalTips' }
    ]);
  }

  // ==================== FIND SECTION BY QUERY ====================
  function findSectionByQuery(query) {
    const q = query.toLowerCase();
    // Direct matches
    for (const [key, sec] of Object.entries(SECTIONS)) {
      if (q.includes(key)) return key;
      if (sec.title && q.includes(sec.title.toLowerCase())) return key;
    }
    // Keyword matches
    const keywords = {
      dashboard: ['tablero', 'centro', 'mando', 'inicio', 'home', 'dashboard', 'principal'],
      leads: ['lead', 'prospecto', 'oportunidad'],
      servicecalls: ['llamada', 'servicio', 'service call', 'emergencia'],
      dispatch: ['despacho', 'dispatch', 'coordinador'],
      jobs: ['trabajo', 'estimado', 'estimate', 'cotización', 'presupuesto', 'job'],
      technicians: ['técnico', 'tecnico', 'certificación', 'credencial', 'epa', 'nate'],
      advisors: ['advisor', 'vendedor', 'comisión', 'home advisor', 'ventas'],
      clients: ['cliente', 'customer'],
      invoices: ['factura', 'invoice', 'facturación'],
      collections: ['cobranza', 'cobro', 'pago pendiente', 'collection'],
      receipts: ['recibo', 'receipt', 'compra'],
      expenses: ['gasto', 'expense', 'costo fijo', 'renta', 'seguro'],
      mymoney: ['mi dinero', 'money', 'ganancia', 'profit', 'my money'],
      payroll: ['nómina', 'nomina', 'payroll', 'sueldo', 'salario'],
      mailbox: ['correo', 'mail', 'buzón', 'correspondencia'],
      marketing: ['marketing', 'mercadotecnia', 'publicidad', 'reseña', 'review', 'campaña'],
      pricebook: ['precio', 'price', 'catálogo', 'proveedor', 'pricebook', 'componente'],
      reports: ['reporte', 'report', 'análisis', 'estadística'],
      team: ['usuario', 'equipo', 'rol', 'permiso', 'acceso'],
      hr: ['recursos humanos', 'hr', 'empleado'],
      settings: ['configuración', 'config', 'setting', 'logo', 'empresa', 'licencia', 'cláusula'],
      pipeline: ['pipeline', 'flujo de ventas', 'kanban']
    };
    for (const [key, words] of Object.entries(keywords)) {
      if (words.some(w => q.includes(w))) return key;
    }
    return null;
  }

  // ==================== SHOW SECTION DETAIL ====================
  function showSectionDetail(sectionKey) {
    const sec = SECTIONS[sectionKey];
    if (!sec) return;
    addBotMessage(
      `<span class="ai-step-badge">${sec.icon}</span> <strong>${sec.title}</strong>`,
      [
        { label: '📖 Cómo se Usa', action: `howto_${sectionKey}` },
        { label: '💡 Tips Pro', action: `tips_${sectionKey}` },
        { label: `👉 Ir a ${sec.title}`, action: `goto_${sectionKey}` },
        ...(tourStep >= 0 ? [{ label: '⏭️ Siguiente', action: 'tourNext' }] : [])
      ],
      {
        icon: sec.icon,
        title: sec.title,
        desc: sec.desc,
        features: sec.features,
        goTo: sectionKey
      }
    );
  }

  // ==================== SHOW HOW TO ====================
  function showHowTo(sectionKey) {
    const sec = SECTIONS[sectionKey];
    if (!sec || !sec.howTo) return;
    addBotMessage(`
      <strong>📖 Cómo usar: ${sec.icon} ${sec.title}</strong><br><br>
      ${sec.howTo.join('<br>')}
    `, [
      { label: '💡 Tips Pro', action: `tips_${sectionKey}` },
      { label: `👉 Ir a ${sec.title}`, action: `goto_${sectionKey}` },
      ...(tourStep >= 0 ? [{ label: '⏭️ Siguiente', action: 'tourNext' }] : [{ label: '🏠 Menú Principal', action: 'welcome' }])
    ]);
  }

  // ==================== SHOW TIPS ====================
  function showTips(sectionKey) {
    const sec = SECTIONS[sectionKey];
    if (!sec || !sec.tips) return;
    addBotMessage(`
      <strong>💡 Tips Profesionales: ${sec.icon} ${sec.title}</strong><br><br>
      ${sec.tips.join('<br><br>')}
    `, [
      { label: '📖 Cómo se Usa', action: `howto_${sectionKey}` },
      { label: `👉 Ir a ${sec.title}`, action: `goto_${sectionKey}` },
      ...(tourStep >= 0 ? [{ label: '⏭️ Siguiente', action: 'tourNext' }] : [{ label: '🏠 Menú Principal', action: 'welcome' }])
    ]);
  }

  // ==================== TOUR SYSTEM ====================
  function startTour() {
    tourStep = 0;
    updateTourProgress();
    document.getElementById('aiTourProgress').style.display = 'flex';
    addBotMessage(`
      <strong>🎓 ¡Comenzamos el Tour Completo!</strong><br><br>
      Te voy a enseñar las <strong>${TOUR_ORDER.length} secciones</strong> de Trade Master CRM. 
      En cada una te explico qué es, qué puedes hacer, cómo usarla, y te doy tips de profesional.<br><br>
      <strong>Empecemos con el Tablero...</strong>
    `);
    setTimeout(() => showTourStep(), 800);
  }

  function showTourStep() {
    if (tourStep < 0 || tourStep >= TOUR_ORDER.length) {
      finishTour();
      return;
    }
    const sectionKey = TOUR_ORDER[tourStep];
    updateTourProgress();
    showSectionDetail(sectionKey);
    // Navigate to section and highlight
    goToSection(sectionKey);
  }

  function tourNext() {
    tourStep++;
    if (tourStep >= TOUR_ORDER.length) {
      finishTour();
      return;
    }
    showTyping();
    setTimeout(() => {
      hideTyping();
      showTourStep();
    }, 500);
  }

  function finishTour() {
    tourStep = -1;
    document.getElementById('aiTourProgress').style.display = 'none';
    addBotMessage(`
      <strong>🎉 ¡Tour Completado!</strong><br><br>
      Ya conoces <strong>todas las secciones</strong> de Trade Master CRM. Ahora tienes una herramienta poderosa para administrar tu negocio de HVAC como un profesional.<br><br>
      Recuerda que siempre estoy aquí si necesitas ayuda. ¡A trabajar! 💪
    `, [
      { label: '🔄 Repetir Tour', action: 'startTour' },
      { label: '📋 Ver Categorías', action: 'showCategories' },
      { label: '❓ Pregunta Libre', action: 'freeQuestion' }
    ]);
  }

  function updateTourProgress() {
    const fill = document.getElementById('aiTourFill');
    const text = document.getElementById('aiTourText');
    if (!fill || !text) return;
    const pct = ((tourStep + 1) / TOUR_ORDER.length) * 100;
    fill.style.width = pct + '%';
    text.textContent = `${tourStep + 1} / ${TOUR_ORDER.length}`;
  }

  // ==================== SHOW CATEGORIES ====================
  function showCategories() {
    let html = '<strong>📋 Secciones por Categoría</strong><br><br>Haz clic en cualquier sección para ver la descripción completa:<br>';
    
    for (const [catName, sectionKeys] of Object.entries(CATEGORIES)) {
      html += `<br><strong>${catName}</strong><br>`;
      html += '<div class="ai-cat-tabs">';
      sectionKeys.forEach(key => {
        const sec = SECTIONS[key];
        if (sec) {
          html += `<button class="ai-cat-tab" onclick="window._aiOnboarding.handleAction('detail_${key}')">${sec.icon} ${sec.title}</button>`;
        }
      });
      html += '</div>';
    }
    
    addBotMessage(html, [
      { label: '🎓 Tour Completo', action: 'startTour' },
      { label: '❓ ¿Dónde estoy?', action: 'currentSection' }
    ]);
  }

  // ==================== CURRENT SECTION ====================
  function detectCurrentSection() {
    const sections = document.querySelectorAll('.section');
    for (const sec of sections) {
      if (sec.classList.contains('active') || sec.style.display === 'block' || 
          (sec.style.display !== 'none' && sec.offsetParent !== null)) {
        const id = sec.id.replace('-section', '');
        return id;
      }
    }
    return 'dashboard';
  }

  function showCurrentSection() {
    const current = detectCurrentSection();
    if (SECTIONS[current]) {
      addBotMessage(`<strong>📍 Estás en:</strong>`);
      setTimeout(() => showSectionDetail(current), 400);
    } else {
      addBotMessage('Parece que estás en el Tablero principal. ¿Quieres que te lo explique?', [
        { label: '✅ Sí, explícame', action: 'detail_dashboard' },
        { label: '📋 Ver otras secciones', action: 'showCategories' }
      ]);
    }
  }

  // ==================== GENERAL TIPS ====================
  function showGeneralTips() {
    addBotMessage(`
      <strong>💡 Tips Generales para Trade Master CRM</strong><br><br>
      📌 <strong>Empieza por Configuración:</strong> Sube tu logo, datos de empresa y documentos de seguros.<br><br>
      📌 <strong>Registra tus técnicos:</strong> Cada uno con foto, certificaciones y vehículo.<br><br>
      📌 <strong>Usa el Dashboard todas las mañanas:</strong> Es tu centro de mando diario.<br><br>
      📌 <strong>Registra TODO:</strong> Leads, llamadas, recibos, gastos — entre más datos, mejores decisiones.<br><br>
      📌 <strong>Cobra rápido:</strong> Genera la factura antes de salir del trabajo.<br><br>
      📌 <strong>Pide reseñas:</strong> Después de cada trabajo bien hecho, pide reseña en Google.
    `, [
      { label: '🎓 Tour Completo', action: 'startTour' },
      { label: '📋 Ver Secciones', action: 'showCategories' }
    ]);
  }

  // ==================== GO TO SECTION ====================
  function goToSection(sectionKey) {
    if (typeof window.showSection === 'function') {
      window.showSection(sectionKey);
    }
    // Highlight effect
    setTimeout(() => {
      const el = document.getElementById(sectionKey + '-section');
      if (el) {
        el.classList.add('ai-highlight-section');
        setTimeout(() => el.classList.remove('ai-highlight-section'), 3000);
      }
    }, 300);
  }

  // ==================== HANDLE ACTIONS ====================
  function handleAction(action) {
    if (action === 'startTour') { startTour(); return; }
    if (action === 'showCategories') { showCategories(); return; }
    if (action === 'currentSection') { showCurrentSection(); return; }
    if (action === 'tourNext') { tourNext(); return; }
    if (action === 'generalTips') { showGeneralTips(); return; }
    if (action === 'welcome') { showWelcome(); return; }
    if (action === 'freeQuestion') {
      addBotMessage('¡Pregúntame lo que quieras! Escribe tu pregunta abajo. 👇');
      document.getElementById('aiInput').focus();
      return;
    }
    
    // Dynamic actions: detail_xxx, howto_xxx, tips_xxx, goto_xxx
    if (action.startsWith('detail_')) {
      showSectionDetail(action.replace('detail_', ''));
      return;
    }
    if (action.startsWith('howto_')) {
      showHowTo(action.replace('howto_', ''));
      return;
    }
    if (action.startsWith('tips_')) {
      showTips(action.replace('tips_', ''));
      return;
    }
    if (action.startsWith('goto_')) {
      const key = action.replace('goto_', '');
      goToSection(key);
      addBotMessage(`✅ Te llevé a <strong>${SECTIONS[key]?.title || key}</strong>. ¿Necesitas algo más?`, [
        { label: '📖 Cómo se Usa', action: `howto_${key}` },
        { label: '💡 Tips', action: `tips_${key}` },
        { label: '🏠 Menú', action: 'welcome' }
      ]);
      return;
    }
  }

  // ==================== EXPOSE TO WINDOW ====================
  window._aiOnboarding = {
    toggle: togglePanel,
    send: sendMessage,
    handleAction: handleAction,
    goToSection: goToSection
  };

  // ==================== INIT ON DOM READY ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
