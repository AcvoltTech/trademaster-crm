// Polyfills
if(typeof formatMoney==='undefined'){window.formatMoney=function(a){var n=parseFloat(a)||0;return '$'+n.toFixed(2).replace(/\B(?=(?:\d{3})+(?!\d))/g,',');}}

/* ==================== AI ONBOARDING - TRADE MASTER CRM ==================== */
/* Voice-guided, interactive tour with real highlights and conversational tone */
/* v3 - Full Bilingual ES/EN with walk translations                          */

(function() {
  'use strict';

  // Fixed: was calling itself recursively, now correctly calls window.showSection
  function safeShowSection(key) {
    try {
      if (typeof window.showSection === 'function') window.showSection(key);
    } catch(e) {
      console.warn('AI Tour: showSection error for ' + key + ':', e.message);
    }
  }

  // ===== TRADE MASTER LOGO SVG (inline) =====
  const LOGO_SVG_36 = '<svg viewBox="0 0 120 120" width="36" height="36"><defs><clipPath id="aiL"><rect x="0" y="0" width="60" height="120"/></clipPath><clipPath id="aiR"><rect x="60" y="0" width="60" height="120"/></clipPath></defs><path d="M60 4 A56 56 0 0 0 60 116 Z" fill="#1e3a5f"/><path d="M60 4 A56 56 0 0 1 60 116 Z" fill="#7f1d1d"/><g clip-path="url(#aiL)"><line x1="38" y1="28" x2="38" y2="92" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="60" x2="58" y2="60" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/><line x1="22" y1="38" x2="54" y2="82" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/><line x1="54" y1="38" x2="22" y2="82" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/><circle cx="26" cy="45" r="2" fill="#93c5fd"/><circle cx="26" cy="75" r="2" fill="#93c5fd"/><circle cx="48" cy="45" r="2" fill="#93c5fd"/><circle cx="48" cy="75" r="2" fill="#93c5fd"/></g><g clip-path="url(#aiR)"><path d="M82 88 C82 88 68 72 68 58 C68 44 76 38 80 30 C80 30 82 44 88 48 C90 38 94 34 94 34 C94 34 100 50 100 62 C100 76 92 88 82 88 Z" fill="#f97316" opacity="0.9"/><path d="M82 88 C82 88 74 78 74 68 C74 58 78 52 82 46 C82 46 84 56 88 58 C88 52 92 48 92 48 C92 48 96 58 96 66 C96 78 88 88 82 88 Z" fill="#fbbf24" opacity="0.9"/><path d="M82 88 C82 88 78 82 78 76 C78 70 80 66 82 60 C84 66 86 70 86 76 C86 82 82 88 82 88 Z" fill="#fef3c7"/></g><line x1="60" y1="8" x2="60" y2="112" stroke="white" stroke-width="2" opacity="0.3"/><circle cx="60" cy="60" r="56" fill="none" stroke="white" stroke-width="1.5" opacity="0.15"/></svg>';
  const LOGO_SVG_32 = LOGO_SVG_36.replace(/width="36"/g,'width="32"').replace(/height="36"/g,'height="32"');

  // ===== VOICE SYSTEM (ElevenLabs - Brenda) =====
  let voiceEnabled = true;
  let currentLang = 'es';
  let currentAudio = null;
  const XI_KEY = 'sk_8e80353deeb8fe03cc064e016d771560111e4777e0eb2df3';
  const VOICE_ES = '7iMdMxFdAglGhAvtYtqS';
  const VOICE_EN = '7iMdMxFdAglGhAvtYtqS';

  function initVoice() {
    detectCRMLang();
    setInterval(detectCRMLang, 2000);
  }

  function detectCRMLang() {
    const langBtn = document.querySelector('button[onclick="toggleLanguage()"]');
    if (langBtn) {
      const txt = langBtn.textContent.trim().toUpperCase();
      const newLang = txt.includes('EN') ? 'en' : 'es';
      if (newLang !== currentLang) {
        currentLang = newLang;
        const aiLangBtn = document.getElementById('aiLangBtn');
        if (aiLangBtn) aiLangBtn.textContent = currentLang === 'en' ? '\u{1F1FA}\u{1F1F8}' : '\u{1F1F2}\u{1F1FD}';
      }
    }
  }

  function speak(text) {
    if (!voiceEnabled) return;
    stopSpeaking();
    const clean = text.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
    if (!clean) return;
    const voiceId = currentLang === 'en' ? VOICE_EN : VOICE_ES;
    fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId + '/stream', {
      method: 'POST',
      headers: { 'xi-api-key': XI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clean,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 1.1 }
      })
    }).then(r => { if (r.ok) return r.blob(); throw new Error('TTS fail'); })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      currentAudio = new Audio(url);
      currentAudio.play();
      currentAudio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; };
    }).catch(() => {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = currentLang === 'en' ? 'en-US' : 'es-US';
        u.rate = 0.93; u.pitch = 1.08;
        speechSynthesis.speak(u);
      }
    });
  }

  function stopSpeaking() {
    if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null; }
    if ('speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
  }

  function switchLang(lang) {
    currentLang = lang;
    stopSpeaking();
    const btn = document.getElementById('aiLangBtn');
    if (btn) btn.textContent = lang === 'en' ? '\u{1F1FA}\u{1F1F8}' : '\u{1F1F2}\u{1F1FD}';
    const crmBtn = document.querySelector('button[onclick="toggleLanguage()"]');
    if (crmBtn) {
      const crmTxt = crmBtn.textContent.trim().toUpperCase();
      const crmIsEN = crmTxt.includes('EN');
      if ((lang === 'en' && !crmIsEN) || (lang === 'es' && crmIsEN)) {
        if (typeof toggleLanguage === 'function') toggleLanguage();
      }
    }
  }

  // ===== HIGHLIGHT =====
  let hlOverlay = null;
  let hlPointer = null;

  function createOverlays() {
    hlOverlay = document.createElement('div');
    hlOverlay.id = 'aiHLOverlay';
    hlOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9990;pointer-events:none;opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(hlOverlay);
    hlPointer = document.createElement('div');
    hlPointer.id = 'aiPointer';
    hlPointer.style.cssText = 'position:fixed;z-index:9995;pointer-events:none;opacity:0;transition:all 0.5s ease;font-size:36px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4));';
    hlPointer.textContent = '👆';
    document.body.appendChild(hlPointer);
  }

  function highlight(selector, duration) {
    duration = duration || 4500;
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) { clearHL(); return; }
    el.scrollIntoView({ behavior:'smooth', block:'center' });
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      hlOverlay.innerHTML = '';
      hlOverlay.style.opacity = '1';
      const cut = document.createElement('div');
      cut.style.cssText = `position:fixed;top:${r.top-8}px;left:${r.left-8}px;width:${r.width+16}px;height:${r.height+16}px;border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,0.5),0 0 24px 6px rgba(244,118,33,0.7);border:3px solid #f47621;z-index:9991;pointer-events:none;animation:aiPulseHL 1.5s ease infinite;`;
      hlOverlay.appendChild(cut);
      hlPointer.style.opacity = '1';
      hlPointer.style.left = (r.left + r.width/2 - 18) + 'px';
      hlPointer.style.top = (r.top - 44) + 'px';
      setTimeout(clearHL, duration);
    }, 500);
  }

  function clearHL() {
    if (hlOverlay) { hlOverlay.style.opacity = '0'; setTimeout(() => { if(hlOverlay) hlOverlay.innerHTML=''; }, 300); }
    if (hlPointer) hlPointer.style.opacity = '0';
  }

  // ===== SECTION KNOWLEDGE (SPANISH - master copy with hl selectors) =====
  const S = {
    dashboard: {
      icon:'📊', title:'Tablero',
      hi:'¡Buen día! Bienvenido al Tablero, tu Centro de Mando.',
      explain:'Desde aquí ves todo tu negocio en tiempo real. Tienes tarjetas con los trabajos ganados, llamadas de servicio activas, vendedores y técnicos en campo. Abajo hay un mapa con ubicaciones en tiempo real, el reloj de entrada y salida de tus empleados, y el flujo de tus estimados.',
      walk: [
        { say:'Mira estas tarjetas de arriba. Cada una te da un resumen rápido. Puedes hacer clic en cualquiera para ir directo a esa sección. Y con el botón de más puedes crear un trabajo nuevo rapidísimo.', hl:'.hcp-summary-grid' },
        { say:'Este es el Mapa de Operaciones en Tiempo Real. Los puntos verdes son técnicos disponibles, los amarillos están ocupados, los morados son vendedores, y los rojos son trabajos nuevos.', hl:'#commandCenterMap' },
        { say:'Aquí tienes el reloj de entrada y salida. Selecciona al técnico, ponle su tarifa por hora, y cuando llegue al trabajo le das Marcar Entrada. El sistema le calcula cuánto va ganando en el día.', hl:'.clock-widget-card' },
        { say:'Y este es el Flujo de Estimados. Te muestra cuántos estimados tienes abiertos, aprobados, facturados y cobrados. Así ves cuánto dinero viene en camino.', hl:'#estimatePipeline' },
        { say:'Por último, aquí puedes crear Planes de Servicio, que son membresías de mantenimiento para tus clientes. Esto te genera ingresos recurrentes cada mes.', hl:'.card:has(#servicePlanFormArea)' }
      ],
      next:'leads'
    },
    leads: {
      icon:'🎯', title:'Prospectos',
      hi:'¡Vamos a Prospectos!',
      explain:'Aquí registras a las personas que llaman pidiendo servicio o presupuesto pero que todavía no son clientes confirmados. El chiste es darles seguimiento y convertirlos en trabajos ganados. Cada prospecto es dinero potencial.',
      walk: [
        { say:'Para agregar un prospecto nuevo, haces clic en Nuevo Lead. Te pide nombre, teléfono, email, qué servicio necesita, tipo de propiedad y dirección.', hl:'#leadFormContainer' },
        { say:'Aquí aparece la lista de todos tus prospectos. Los puedes filtrar por estado: Nuevo, Contactado, Cotizado, Ganado o Perdido.', hl:'#leadsList' },
        { say:'Y este mapa te muestra dónde están todos tus prospectos. Súper útil para planear tus rutas y agrupar visitas por zona.', hl:'#leadsMap' }
      ],
      next:'servicecalls'
    },
    servicecalls: {
      icon:'📞', title:'Llamadas de Servicio',
      hi:'¡Ahora las Llamadas de Servicio!',
      explain:'Aquí controlas todas las llamadas de emergencia y servicio. Cada llamada se rastrea desde que entra hasta que se completa. Puedes asignar técnico, poner urgencia, y dar seguimiento.',
      walk: [
        { say:'Estos contadores te dicen de un vistazo cuántas llamadas tienes Nuevas, Asignadas, En Camino y Completadas hoy.', hl:'.hcp-summary-grid' },
        { say:'Para registrar una llamada nueva, haz clic en Nueva Llamada. Llena el nombre del cliente, teléfono, dirección y describe el problema. Si es emergencia ponle urgencia roja.', hl:'#serviceCallFormContainer' },
        { say:'Las llamadas aparecen como tarjetas aquí. Cada una muestra el cliente, problema, urgencia y técnico asignado.', hl:'#serviceCallsGrid' },
        { say:'Y abajo el mapa te muestra las llamadas por color: rojo es nueva, amarillo asignada, azul en camino, y verde completada.', hl:'#serviceCallsMap' }
      ],
      next:'dispatch'
    },
    dispatch: {
      icon:'🚚', title:'Despacho',
      hi:'¡Ahora Despacho!',
      explain:'Este es tu centro de coordinación. Aquí ves dónde están todos tus técnicos en el mapa, les asignas trabajos, y configuras quién es el Coordinador de Despacho.',
      walk: [
        { say:'Aquí arriba configuras al Coordinador. Ponle nombre, foto, teléfono, email, licencia y turno. Haz clic en Editar para llenar sus datos.', hl:'#dispCoordDisplay' },
        { say:'Y aquí abajo está el link de tracking. Compártelo con tus técnicos para que reporten su ubicación desde su celular.', hl:'#trackingLinkContainer' }
      ],
      next:'jobs'
    },
    jobs: {
      icon:'🔧', title:'Trabajos y Estimados',
      hi:'¡Esta sección es súper importante! Aquí creas estimados profesionales.',
      explain:'El sistema te guía en 5 pasos para crear un estimado. Tiene más de 150 partes de HVAC con precios. Seleccionas el equipo, el service call, los componentes, y al final genera un PDF profesional para presentar al cliente.',
      walk: [
        { say:'Paso 1: Selecciona el trabajo aquí arriba.', hl:'#estJobSelect' },
        { say:'Paso 2: Escoge el tipo de equipo. AC, Heat Pump, Furnace de 80 o 90 por ciento, Mini Split, o Package Unit. Llena modelo, serial y marca.', hl:'.equip-grid' },
        { say:'Paso 3: Selecciona el Service Call según la distancia: 70 dólares hasta 10 millas, 120 hasta 20 millas, 200 para más lejos, o un monto personalizado.', hl:'.service-call-options' },
        { say:'Si el equipo tiene más de 15 años, el sistema te sugiere referir al Home Advisor para una instalación nueva. Eso puede ser una venta de 10 a 20 mil dólares.', hl:'#equipAgeWarning' },
        { say:'Al final tienes el resumen con descuento, impuesto y total. Generas el PDF y se lo presentas al cliente.', hl:'#estimateTotals' }
      ],
      next:'technicians'
    },
    technicians: {
      icon:'👷', title:'Técnicos',
      hi:'¡Ahora los Técnicos!',
      explain:'Aquí administras a todo tu equipo. Cada técnico tiene perfil completo con foto, especialidad, tarifa, certificaciones como EPA 608 y NATE, documentos del vehículo, y hasta puedes generar una tarjeta de identificación profesional.',
      walk: [
        { say:'Aquí ves todos tus técnicos con nombre, especialidad y estado.', hl:'#techniciansFullList' },
        { say:'En Credenciales subes las certificaciones de cada técnico: licencia de manejar, EPA 608, NATE, OSHA, HVAC Excellence y más. Con fecha de vencimiento para que no se te pase.', hl:'#techCredGrid' },
        { say:'Puedes generar una ID Card profesional para cada técnico. Eso da muy buena imagen a tu empresa.', hl:'#techProfileCard' }
      ],
      next:'advisors'
    },
    advisors: {
      icon:'🏠', title:'Asesores del Hogar',
      hi:'¡Ahora los Home Advisors, tus vendedores!',
      explain:'Aquí administras a los vendedores que cierran ventas de instalaciones nuevas. El sistema tiene comisiones por niveles: 20 por ciento si la ganancia pasa de 10 mil, 15 para 7 a 10, 10 para 5 a 7, y 5 por ciento para menos de 5 mil.',
      walk: [
        { say:'Tienes 4 pestañas. Vendedores muestra el equipo. Leads Asignados son los prospectos que tienen. Ventas y Comisiones es donde registras ventas cerradas. Y Recibos es para la conciliación.', hl:'.adv-tabs' },
        { say:'Cuando registras una venta, el sistema calcula automáticamente la comisión del vendedor basado en la ganancia neta. Todo transparente.', hl:'#addSaleModal' }
      ],
      next:'clients'
    },
    clients: {
      icon:'👥', title:'Clientes',
      hi:'¡La base de datos de Clientes!',
      explain:'Cada cliente tiene un expediente completo. Historial de trabajos, estimados, facturas, notas internas, archivos adjuntos, y registro de comunicaciones. Es todo lo que necesitas saber de cada cliente en un solo lugar.',
      walk: [
        { say:'Aquí está la lista de todos tus clientes. Puedes buscar por nombre o teléfono. Haz clic en cualquiera para ver su perfil completo.', hl:'#clientListView' },
        { say:'Dentro del perfil tiene pestañas: Información general, Trabajos, Estimados, Facturas, Notas, Archivos y Comunicaciones. Es como el expediente completo del cliente.', hl:'#clientProfileView' }
      ],
      next:'invoices'
    },
    invoices: {
      icon:'📄', title:'Facturas',
      hi:'¡Ahora Facturas!',
      explain:'Crea facturas profesionales desde un trabajo o manualmente. El sistema calcula subtotal, descuento, impuesto y total. Las puedes filtrar por estado y darle seguimiento al cobro.',
      walk: [
        { say:'Los indicadores de arriba te muestran total facturado, pagado, pendiente y vencido.', hl:'#invoiceKPIs' },
        { say:'Para crear una factura nueva, haz clic en Nueva Factura. Puedes cargar datos de un trabajo o llenarla manual. Agregas líneas, service call, descuento e impuesto.', hl:'#invoiceFormContainer' }
      ],
      next:'collections'
    },
    collections: {
      icon:'💰', title:'Cobranza',
      hi:'¡Cobranza! Aquí te aseguras de que el dinero entre.',
      explain:'Ves todas las facturas pendientes de cobro, las vencidas, y puedes registrar pagos. Revísala todos los días para que no se te escape ningún cobro.',
      walk: [
        { say:'Filtra por vencidas para priorizar los cobros más urgentes. Registra cada pago que recibas para mantener los balances al día.', hl:'#collectionsTable' }
      ],
      next:'receipts'
    },
    receipts: {
      icon:'🧾', title:'Recibos',
      hi:'¡Ahora los Recibos de compras!',
      explain:'Registra cada recibo de materiales con foto, proveedor, categoría y monto. Tienes proveedores pre-configurados como Johnstone, Ferguson, Home Depot y más. Al final del mes exportas todo a CSV para tu contador.',
      walk: [
        { say:'Toma foto del recibo inmediatamente. Los recibos térmicos se borran con el tiempo. Categoriza bien para que tu contador pueda deducir los gastos.', hl:'#receiptsList' }
      ],
      next:'expenses'
    },
    expenses: {
      icon:'🏢', title:'Gastos del Negocio',
      hi:'¡Los Gastos del Negocio!',
      explain:'Aquí registras todos tus gastos fijos: renta, seguros, licencias, vehículos, software. Te dice exactamente cuánto cuesta operar tu negocio cada mes. Eso es clave para saber cuánto cobrar.',
      walk: [
        { say:'Las categorías están organizadas por tipo. Selecciona la categoría, proveedor, monto, frecuencia de pago, y si es gasto fijo o variable.', hl:'#expenseFormContainer' }
      ],
      next:'mymoney'
    },
    mymoney: {
      icon:'💵', title:'Mi Dinero',
      hi:'¡Mi Dinero! Esta sección es solo para ti como dueño.',
      explain:'Nadie más de tu equipo puede ver esto. Aquí ves tus ingresos, gastos, ganancia neta y lo que te deben. Revísalo cada semana.',
      walk: [
        { say:'Los 4 indicadores son Ingresos, Gastos, Ganancia Neta y Por Cobrar. Si los gastos son mayores que los ingresos, algo necesita cambiar rápido.', hl:'.hcp-summary-grid' }
      ],
      next:'payroll'
    },
    payroll: {
      icon:'💳', title:'Nómina',
      hi:'¡La Nómina!',
      explain:'Registra horas trabajadas, overtime, bonos y deducciones de cada empleado. En California el overtime es después de 8 horas al día, no 40 a la semana. El sistema calcula automático.',
      walk: [],
      next:'mailbox'
    },
    mailbox: {
      icon:'📬', title:'Correo del Negocio',
      hi:'¡El Correo del Negocio!',
      explain:'Registra toda la correspondencia importante: cartas de seguros, gobierno, proveedores, bancos. Sube foto o PDF y nunca pierdas un documento importante.',
      walk: [],
      next:'marketing'
    },
    marketing: {
      icon:'📣', title:'Mercadotecnia',
      hi:'¡Mercadotecnia! Tu centro de marketing.',
      explain:'Tienes acceso directo a todas las plataformas: Facebook, Google, Yelp, Angi, HomeAdvisor, Thumbtack. También puedes crear campañas y pedir reseñas a clientes satisfechos. Las reseñas son oro para tu negocio.',
      walk: [
        { say:'Haz clic en cualquier plataforma para abrirla directo. También puedes solicitar reseñas a clientes en Google, Yelp, Facebook o Nextdoor.', hl:'.supplier-grid' }
      ],
      next:'pricebook'
    },
    pricebook: {
      icon:'📒', title:'Lista de Precios',
      hi:'¡La Lista de Precios!',
      explain:'Tu catálogo de más de 150 componentes de HVAC con precios. También links directos a distribuidores como Ferguson, Johnstone, y US Air para comparar precios y ordenar partes.',
      walk: [],
      next:'reports'
    },
    reports: {
      icon:'📊', title:'Reportes',
      hi:'¡Los Reportes!',
      explain:'Genera reportes de ingresos, gastos, trabajos completados y rendimiento de técnicos. Revísalos cada mes para tomar mejores decisiones basadas en datos.',
      walk: [],
      next:'team'
    },
    team: {
      icon:'👥', title:'Usuarios y Equipo',
      hi:'¡Usuarios y Equipo!',
      explain:'Controla quién puede entrar al CRM. 5 roles: Dueño ve todo, Contabilidad ve finanzas, Coordinador ve operaciones, Técnico solo ve sus trabajos, y Solo Vista nada más mira.',
      walk: [
        { say:'El técnico solo ve los trabajos que tiene asignados. No puede ver facturas ni cuánto ganas. Contabilidad puede ver nómina pero no Mi Dinero del dueño.', hl:'#teamUsersList' }
      ],
      next:'settings'
    },
    settings: {
      icon:'⚙️', title:'Configuración',
      hi:'¡Por último, Configuración!',
      explain:'Sube tu logo, llena datos de empresa, documentos de seguros y licencias, y personaliza las cláusulas legales. Todo lo que pongas aquí aparece en los documentos que mandas a clientes.',
      walk: [
        { say:'Lo primero que debes hacer es subir tu logo y llenar los datos de tu empresa. Esto aparece en todos los estimados y facturas.', hl:'.settings-form' },
        { say:'Sube Workers Comp, General Liability, W9 y Bond. Muchas empresas comerciales te los piden antes de contratarte.', hl:'#companyDocsGrid' }
      ],
      next:null
    }
  };

  // ===== ENGLISH TRANSLATIONS (with titles + walk steps) =====
  const EN = {
    dashboard: {
      title:'Dashboard',
      hi:'Good morning! Welcome to the Dashboard, your Command Center.',
      explain:'From here you can see your entire business in real time. You have cards showing jobs won, active service calls, salespeople and technicians in the field. Below there is a live operations map, the employee clock in and out system, and your estimates pipeline.',
      walk: [
        { say:'Look at these cards at the top. Each one gives you a quick summary. You can click any of them to go directly to that section. And with the plus button you can create a new job super fast.' },
        { say:'This is the Real-Time Operations Map. Green dots are available technicians, yellow ones are busy, purple are salespeople, and red are new jobs.' },
        { say:'Here you have the clock in and out system. Select the technician, set their hourly rate, and when they arrive at the job hit Clock In. The system calculates how much they are earning throughout the day.' },
        { say:'And this is the Estimates Pipeline. It shows you how many estimates you have open, approved, invoiced and collected. So you can see how much money is on the way.' },
        { say:'Lastly, here you can create Service Plans, which are maintenance memberships for your clients. This generates recurring income every month.' }
      ]
    },
    leads: {
      title:'Leads',
      hi:'Now let\'s go to Leads!',
      explain:'Here you register people who call asking for service or a quote but are not confirmed clients yet. The goal is to follow up and convert them into won jobs. Each lead is potential money.',
      walk: [
        { say:'To add a new lead, click New Lead. It asks for the name, phone, email, what service they need, property type and address.' },
        { say:'Here you see the list of all your leads. You can filter them by status: New, Contacted, Quoted, Won or Lost.' },
        { say:'And this map shows you where all your leads are located. Super useful for planning your routes and grouping visits by area.' }
      ]
    },
    servicecalls: {
      title:'Service Calls',
      hi:'Now Service Calls!',
      explain:'Here you control all emergency and service calls. Each call is tracked from when it comes in until it is completed. You can assign a technician, set the urgency, and follow up.',
      walk: [
        { say:'These counters tell you at a glance how many calls you have that are New, Assigned, En Route and Completed today.' },
        { say:'To register a new call, click New Call. Fill in the client name, phone, address and describe the problem. If it is an emergency set the urgency to red.' },
        { say:'Calls appear as cards here. Each one shows the client, problem, urgency and assigned technician.' },
        { say:'And below, the map shows calls by color: red is new, yellow is assigned, blue is en route, and green is completed.' }
      ]
    },
    dispatch: {
      title:'Dispatch',
      hi:'Now Dispatch!',
      explain:'This is your coordination center. Here you see where all your technicians are on the map, assign them jobs, and set up your Dispatch Coordinator.',
      walk: [
        { say:'Up here you configure the Coordinator. Add their name, photo, phone, email, license and shift. Click Edit to fill in their details.' },
        { say:'And down here is the tracking link. Share it with your technicians so they can report their location from their phone.' }
      ]
    },
    jobs: {
      title:'Jobs & Estimates',
      hi:'This section is super important! Here you create professional estimates.',
      explain:'The system guides you in 5 steps to create an estimate. It has over 150 HVAC parts with prices. You select the equipment, service call, components, and it generates a professional PDF for the client.',
      walk: [
        { say:'Step 1: Select the job up here.' },
        { say:'Step 2: Choose the equipment type. AC, Heat Pump, 80 or 90 percent Furnace, Mini Split, or Package Unit. Fill in the model, serial and brand.' },
        { say:'Step 3: Select the Service Call based on distance: 70 dollars up to 10 miles, 120 up to 20 miles, 200 for farther, or a custom amount.' },
        { say:'If the equipment is over 15 years old, the system suggests referring to the Home Advisor for a new installation. That could be a 10 to 20 thousand dollar sale.' },
        { say:'At the end you have the summary with discount, tax and total. Generate the PDF and present it to the client.' }
      ]
    },
    technicians: {
      title:'Technicians',
      hi:'Now Technicians!',
      explain:'Here you manage your entire team. Each technician has a complete profile with photo, specialty, rate, certifications like EPA 608 and NATE, vehicle documents, and you can even generate a professional ID card.',
      walk: [
        { say:'Here you see all your technicians with their name, specialty and status.' },
        { say:'In Credentials you upload each technician\'s certifications: driver\'s license, EPA 608, NATE, OSHA, HVAC Excellence and more. With expiration dates so nothing slips by.' },
        { say:'You can generate a professional ID Card for each technician. That gives your company a great professional image.' }
      ]
    },
    advisors: {
      title:'Home Advisors',
      hi:'Now Home Advisors, your sales team!',
      explain:'Here you manage the salespeople who close new installation sales. The system has tiered commissions: 20 percent for profits over 10 thousand, 15 for 7 to 10, 10 for 5 to 7, and 5 percent for under 5 thousand.',
      walk: [
        { say:'You have 4 tabs. Sales Team shows your people. Assigned Leads are the prospects they have. Sales and Commissions is where you record closed sales. And Receipts is for reconciliation.' },
        { say:'When you record a sale, the system automatically calculates the salesperson\'s commission based on net profit. Everything is transparent.' }
      ]
    },
    clients: {
      title:'Clients',
      hi:'The Clients database!',
      explain:'Each client has a complete file. Job history, estimates, invoices, internal notes, attachments, and communication records. Everything you need to know about each client in one place.',
      walk: [
        { say:'Here is the list of all your clients. You can search by name or phone. Click any of them to see their full profile.' },
        { say:'Inside the profile you have tabs: General Info, Jobs, Estimates, Invoices, Notes, Files and Communications. It is like the complete client file.' }
      ]
    },
    invoices: {
      title:'Invoices',
      hi:'Now Invoices!',
      explain:'Create professional invoices from a job or manually. The system calculates subtotal, discount, tax and total. You can filter by status and follow up on collection.',
      walk: [
        { say:'The indicators at the top show you total invoiced, paid, pending and overdue.' },
        { say:'To create a new invoice, click New Invoice. You can load data from a job or fill it in manually. Add line items, service call, discount and tax.' }
      ]
    },
    collections: {
      title:'Collections',
      hi:'Collections! Here you make sure money comes in.',
      explain:'You see all invoices pending collection, overdue ones, and you can record payments. Check it every day so no collection slips through.',
      walk: [
        { say:'Filter by overdue to prioritize the most urgent collections. Record each payment you receive to keep balances up to date.' }
      ]
    },
    receipts: {
      title:'Receipts',
      hi:'Now Purchase Receipts!',
      explain:'Record every material receipt with photo, supplier, category and amount. You have pre-configured suppliers like Johnstone, Ferguson, Home Depot and more. At the end of the month export everything to CSV for your accountant.',
      walk: [
        { say:'Take a photo of the receipt right away. Thermal receipts fade over time. Categorize properly so your accountant can deduct the expenses.' }
      ]
    },
    expenses: {
      title:'Business Expenses',
      hi:'Business Expenses!',
      explain:'Here you record all fixed expenses: rent, insurance, licenses, vehicles, software. It tells you exactly how much it costs to operate your business each month. Key to knowing how much to charge.',
      walk: [
        { say:'Categories are organized by type. Select the category, vendor, amount, payment frequency, and whether it is a fixed or variable expense.' }
      ]
    },
    mymoney: {
      title:'My Money',
      hi:'My Money! This section is only for you as the owner.',
      explain:'Nobody else on your team can see this. Here you see your income, expenses, net profit and accounts receivable. Check it every week.',
      walk: [
        { say:'The 4 indicators are Income, Expenses, Net Profit and Accounts Receivable. If expenses are higher than income, something needs to change fast.' }
      ]
    },
    payroll: {
      title:'Payroll',
      hi:'Payroll!',
      explain:'Record hours worked, overtime, bonuses and deductions for each employee. In California overtime is after 8 hours per day, not 40 per week. The system calculates automatically.',
      walk: []
    },
    mailbox: {
      title:'Business Mail',
      hi:'Business Mail!',
      explain:'Record all important correspondence: insurance letters, government, suppliers, banks. Upload photo or PDF and never lose an important document.',
      walk: []
    },
    marketing: {
      title:'Marketing',
      hi:'Marketing! Your marketing center.',
      explain:'You have direct access to all platforms: Facebook, Google, Yelp, Angi, HomeAdvisor, Thumbtack. You can also create campaigns and request reviews from satisfied clients. Reviews are gold for your business.',
      walk: [
        { say:'Click any platform to open it directly. You can also request reviews from clients on Google, Yelp, Facebook or Nextdoor.' }
      ]
    },
    pricebook: {
      title:'Price Book',
      hi:'The Price Book!',
      explain:'Your catalog of over 150 HVAC components with prices. Also direct links to distributors like Ferguson, Johnstone, and US Air to compare prices and order parts.',
      walk: []
    },
    reports: {
      title:'Reports',
      hi:'Reports!',
      explain:'Generate reports on income, expenses, completed jobs and technician performance. Review them monthly to make better data-driven decisions.',
      walk: []
    },
    team: {
      title:'Users & Team',
      hi:'Users and Team!',
      explain:'Control who can access the CRM. 5 roles: Owner sees everything, Accounting sees finances, Coordinator sees operations, Technician only sees their jobs, and View Only just looks.',
      walk: [
        { say:'The technician only sees their assigned jobs. They cannot see invoices or how much you earn. Accounting can see payroll but not the owner\'s My Money section.' }
      ]
    },
    settings: {
      title:'Settings',
      hi:'Finally, Settings!',
      explain:'Upload your logo, fill in company data, insurance and license documents, and customize legal clauses. Everything you put here appears on documents you send to clients.',
      walk: [
        { say:'The first thing you should do is upload your logo and fill in your company details. This appears on all estimates and invoices.' },
        { say:'Upload Workers Comp, General Liability, W-9 and Bond. Many commercial companies require these before hiring you.' }
      ]
    }
  };

  // ===== BILINGUAL HELPERS =====

  /** Get hi/explain text in current language */
  function getContent(sectionKey, field) {
    if (currentLang === 'en' && EN[sectionKey] && EN[sectionKey][field]) {
      return EN[sectionKey][field];
    }
    return S[sectionKey][field];
  }

  /** Get title in current language */
  function getTitle(sectionKey) {
    if (currentLang === 'en' && EN[sectionKey] && EN[sectionKey].title) {
      return EN[sectionKey].title;
    }
    return S[sectionKey].title;
  }

  /** Get walk steps: uses EN say text when available, always uses S hl selectors */
  function getWalk(sectionKey) {
    const sWalk = S[sectionKey].walk || [];
    if (currentLang === 'en' && EN[sectionKey] && EN[sectionKey].walk && EN[sectionKey].walk.length) {
      return sWalk.map(function(step, i) {
        return {
          say: (EN[sectionKey].walk[i] && EN[sectionKey].walk[i].say) ? EN[sectionKey].walk[i].say : step.say,
          hl: step.hl
        };
      });
    }
    return sWalk;
  }

  const TOUR = ['dashboard','leads','servicecalls','dispatch','jobs','technicians','advisors','clients','invoices','collections','receipts','expenses','mymoney','payroll','mailbox','marketing','pricebook','reports','team','settings'];

  // ===== STATE =====
  let isOpen = false;
  let tourIdx = -1;
  let walkIdx = -1;
  let inTour = false;

  // ===== INIT =====
  function init() {
    createOverlays();
    var st = document.createElement('style');
    st.textContent = '@keyframes aiPulseHL{0%,100%{box-shadow:0 0 0 9999px rgba(0,0,0,0.5),0 0 20px 4px rgba(244,118,33,0.5)}50%{box-shadow:0 0 0 9999px rgba(0,0,0,0.5),0 0 32px 8px rgba(244,118,33,0.9)}}';
    document.head.appendChild(st);
    createBtn();
    createPanel();
    initVoice();
    console.log('✅ AI Tour Guide v3 — Full Bilingual ES/EN loaded');
  }

  function createBtn() {
    var b = document.createElement('button');
    b.className = 'ai-float-btn';
    b.id = 'aiFloatBtn';
    b.innerHTML = LOGO_SVG_36;
    b.title = 'Asistente AI';
    b.onclick = toggle;
    if (!localStorage.getItem('tm_ai_v2')) {
      var dot = document.createElement('div');
      dot.className = 'ai-new-badge';
      b.appendChild(dot);
    }
    document.body.appendChild(b);
  }

  function createPanel() {
    var p = document.createElement('div');
    p.className = 'ai-chat-panel';
    p.id = 'aiChatPanel';
    p.innerHTML = '<div class="ai-chat-header">' +
      '<div class="ai-chat-header-left">' +
        '<div class="ai-chat-avatar">' + LOGO_SVG_32 + '</div>' +
        '<div><h3>Trade Master AI</h3><small>Tu gu\u00eda personal</small></div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;align-items:center;">' +
        '<button class="ai-voice-toggle" id="aiLangBtn" onclick="window._ai.switchLang()" title="Espa\u00f1ol / English">\ud83c\uddf2\ud83c\uddfd</button>' +
        '<button class="ai-voice-toggle" id="aiVoiceBtn" onclick="window._ai.toggleVoice()" title="Voz">\ud83d\udd0a</button>' +
        '<button class="ai-chat-close" onclick="window._ai.toggle()">\u2715</button>' +
      '</div>' +
    '</div>' +
    '<div id="aiProgress" class="ai-tour-progress" style="display:none;">' +
      '<div class="ai-tour-progress-bar"><div class="ai-tour-progress-fill" id="aiFill" style="width:0%"></div></div>' +
      '<span class="ai-tour-progress-text" id="aiPText">0/' + TOUR.length + '</span>' +
    '</div>' +
    '<div class="ai-chat-messages" id="aiMsgs"></div>' +
    '<div class="ai-chat-input-area">' +
      '<input class="ai-chat-input" id="aiIn" placeholder="Escribe tu pregunta..." onkeydown="if(event.key===\'Enter\')window._ai.send()">' +
      '<button class="ai-chat-send" onclick="window._ai.send()">\u27A4</button>' +
    '</div>';
    document.body.appendChild(p);
  }

  // ===== TOGGLE =====
  function toggle() {
    isOpen = !isOpen;
    var p = document.getElementById('aiChatPanel');
    if (isOpen) {
      p.classList.add('open');
      localStorage.setItem('tm_ai_v2','1');
      var dot = document.querySelector('.ai-new-badge');
      if (dot) dot.remove();
      if (!document.getElementById('aiMsgs').children.length) welcome();
    } else {
      p.classList.remove('open');
      stopSpeaking();
    }
  }

  // ===== WELCOME (bilingual) =====
  function welcome() {
    var isEN = currentLang === 'en';
    var t = isEN
      ? 'Hi there! I am your Trade Master assistant. I am here to teach you every part of the CRM step by step. I will explain each section, show you where things are, and give you professional tips. What would you like to do?'
      : '\u00a1Hola, buen d\u00eda! Soy tu asistente de Trade Master. Estoy aqu\u00ed para ense\u00f1arte todo el CRM paso a paso. Te explico cada secci\u00f3n, te muestro d\u00f3nde est\u00e1n las cosas, y te doy tips de profesional. \u00bfQu\u00e9 hacemos?';
    botMsg(t, [
      { l: isEN ? '\ud83c\udf93 Full CRM Tour' : '\ud83c\udf93 Tour Completo del CRM', a:'startTour' },
      { l: isEN ? '\u2753 Explain where I am' : '\u2753 Expl\u00edcame d\u00f3nde estoy', a:'explainHere' },
      { l: isEN ? '\ud83d\udccb See all sections' : '\ud83d\udccb Ver todas las secciones', a:'categories' }
    ]);
    speak(t);
  }

  // ===== MESSAGES =====
  function botMsg(text, btns) {
    var c = document.getElementById('aiMsgs');
    var d = document.createElement('div');
    d.className = 'ai-msg bot';
    var h = text;
    if (btns && btns.length) {
      h += '<div class="ai-quick-actions">';
      btns.forEach(function(b) { h += '<button class="ai-quick-btn" onclick="window._ai.act(\'' + b.a + '\')">' + b.l + '</button>'; });
      h += '</div>';
    }
    d.innerHTML = h;
    c.appendChild(d);
    sb();
  }

  function userMsg(text) {
    var c = document.getElementById('aiMsgs');
    var d = document.createElement('div');
    d.className = 'ai-msg user';
    d.textContent = text;
    c.appendChild(d);
    sb();
  }

  function typing() {
    var c = document.getElementById('aiMsgs');
    var d = document.createElement('div');
    d.className = 'ai-typing';
    d.id = 'aiTyp';
    d.innerHTML = '<div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div>';
    c.appendChild(d);
    sb();
  }
  function untyping() { var e = document.getElementById('aiTyp'); if(e) e.remove(); }
  function sb() { var m = document.getElementById('aiMsgs'); setTimeout(function() { m.scrollTop = m.scrollHeight; }, 100); }

  // ===== SEND =====
  function send() {
    var i = document.getElementById('aiIn');
    var t = i.value.trim();
    if (!t) return;
    i.value = '';
    userMsg(t);
    proc(t);
  }

  // ===== PROCESS INPUT (bilingual) =====
  function proc(text) {
    var q = text.toLowerCase();
    if (q.match(/tour|recorrido|ense\u00f1a|muestra todo|ens\u00e9\u00f1ame|show me everything|teach me/)) { act('startTour'); return; }
    if (q.match(/^(s\u00ed|si|yes|dale|va|\u00f3rale|orale|siguiente|next|continuar|continue|vamos|\u00e1ndale|let's go|go ahead|keep going)$/i) || q.match(/siguiente|next|continuar|continue/)) {
      if (inTour) { tourNext(); return; }
      if (walkIdx >= 0) return;
    }
    if (q.match(/d\u00f3nde estoy|donde estoy|qu\u00e9 es esto|que es esto|explica|where am i|what is this|explain this/)) { act('explainHere'); return; }
    var found = findSec(q);
    if (found) { goExplain(found); return; }
    var isEN = currentLang === 'en';
    var t = isEN
      ? 'Sure, tell me which section interests you or I can give you the full tour.'
      : 'Claro, dime qu\u00e9 secci\u00f3n te interesa o puedo hacerte el tour completo.';
    botMsg(t, [
      { l: isEN ? '\ud83c\udf93 Full Tour' : '\ud83c\udf93 Tour Completo', a:'startTour' },
      { l: isEN ? '\u2753 Where am I' : '\u2753 D\u00f3nde estoy', a:'explainHere' },
      { l: isEN ? '\ud83d\udccb Sections' : '\ud83d\udccb Secciones', a:'categories' }
    ]);
    speak(t);
  }

  // ===== FIND SECTION (bilingual keywords) =====
  function findSec(q) {
    var map = {
      dashboard:['tablero','dashboard','centro','inicio','command','home'],
      leads:['lead','prospecto','prospect'],
      servicecalls:['llamada','service call','emergencia','emergency'],
      dispatch:['despacho','dispatch','coordinador','coordinator'],
      jobs:['trabajo','estimado','cotizaci\u00f3n','presupuesto','estimate','quote','job'],
      technicians:['t\u00e9cnico','tecnico','certificaci\u00f3n','epa','technician','certification'],
      advisors:['advisor','vendedor','comisi\u00f3n','asesor','salesperson','commission','sales team'],
      clients:['cliente','customer','client'],
      invoices:['factura','invoice','bill'],
      collections:['cobranza','cobro','collection','payment'],
      receipts:['recibo','receipt','purchase'],
      expenses:['gasto','expense','costo','cost','overhead'],
      mymoney:['mi dinero','money','ganancia','profit','my money'],
      payroll:['n\u00f3mina','nomina','payroll','sueldo','salary','wage'],
      mailbox:['correo','mail','buz\u00f3n','mailbox','correspondence'],
      marketing:['marketing','mercadotecnia','publicidad','rese\u00f1a','review','advertising'],
      pricebook:['precio','price','cat\u00e1logo','proveedor','catalog','supplier'],
      reports:['reporte','report','analytics'],
      team:['usuario','equipo','rol','permiso','user','role','permission','access'],
      settings:['configuraci\u00f3n','config','setting','logo','setup']
    };
    for (var k in map) {
      if (map[k].some(function(w) { return q.includes(w); })) return k;
    }
    return null;
  }

  // ===== GO + EXPLAIN (bilingual) =====
  function goExplain(key) {
    var s = S[key];
    if (!s) return;
    safeShowSection(key);
    typing();
    setTimeout(function() {
      untyping();
      var hi = getContent(key, 'hi');
      var explain = getContent(key, 'explain');
      var msg = hi + ' ' + explain;
      var walkSteps = getWalk(key);
      var isEN = currentLang === 'en';
      var btns = [];
      if (walkSteps && walkSteps.length) {
        btns.push({ l: isEN ? '\ud83d\udc40 Show me step by step' : '\ud83d\udc40 Mu\u00e9strame paso a paso', a:'walk_'+key });
      }
      if (inTour) {
        btns.push({ l: isEN ? '\u23ed\ufe0f Next section' : '\u23ed\ufe0f Siguiente secci\u00f3n', a:'tourNext' });
        btns.push({ l: isEN ? '\ud83d\uded1 Stop tour' : '\ud83d\uded1 Parar tour', a:'endTour' });
      } else {
        if (s.next) btns.push({ l:'\u23ed\ufe0f ' + getTitle(s.next), a:'go_'+s.next });
        btns.push({ l: isEN ? '\ud83d\udccb Sections' : '\ud83d\udccb Ver secciones', a:'categories' });
      }
      botMsg(msg, btns);
      speak(msg);
      setTimeout(function() {
        var el = document.getElementById(key+'-section');
        if (el) highlight(el, 3000);
      }, 500);
    }, 700);
  }

  // ===== WALKTHROUGH (bilingual) =====
  function startWalk(key) {
    var walkSteps = getWalk(key);
    if (!walkSteps || !walkSteps.length) {
      var isEN = currentLang === 'en';
      var t = isEN
        ? 'This section doesn\'t have detailed steps, but I already explained the main points. Shall we continue?'
        : 'Esta secci\u00f3n no tiene pasos detallados, pero ya te expliqu\u00e9 lo principal. \u00bfSeguimos?';
      botMsg(t, postWalkBtns(key));
      speak(t);
      return;
    }
    walkIdx = 0;
    doWalk(key);
  }

  function doWalk(key) {
    clearHL();
    var walkSteps = getWalk(key);
    var isEN = currentLang === 'en';
    if (walkIdx >= walkSteps.length) {
      walkIdx = -1;
      clearHL();
      var title = getTitle(key);
      var t = isEN
        ? 'Done! I showed you everything about ' + title + '. What shall we do now?'
        : '\u00a1Listo! Ya te mostr\u00e9 todo lo de ' + title + '. \u00bfQu\u00e9 hacemos ahora?';
      botMsg(t, postWalkBtns(key));
      speak(t);
      return;
    }
    var step = walkSteps[walkIdx];
    typing();
    setTimeout(function() {
      untyping();
      var num = walkIdx + 1;
      var total = walkSteps.length;
      var stepLabel = isEN ? 'Step' : 'Paso';
      var ofLabel = isEN ? 'of' : 'de';
      var nextLabel = num < total
        ? (isEN ? '\ud83d\udc49 Next step' : '\ud83d\udc49 Siguiente paso')
        : (isEN ? '\u2705 Done' : '\u2705 Listo');
      botMsg('<strong>\ud83d\udc46 ' + stepLabel + ' ' + num + ' ' + ofLabel + ' ' + total + ':</strong> ' + step.say, [
        { l: nextLabel, a:'wn_'+key }
      ]);
      speak(step.say);
      if (step.hl) setTimeout(function() { highlight(step.hl, 999999); }, 400);
    }, 900);
  }

  function postWalkBtns(key) {
    var s = S[key];
    var isEN = currentLang === 'en';
    var b = [];
    if (inTour) {
      if (s.next) b.push({ l: isEN ? '\u23ed\ufe0f Next section' : '\u23ed\ufe0f Siguiente secci\u00f3n', a:'tourNext' });
      b.push({ l: isEN ? '\ud83d\uded1 Stop tour' : '\ud83d\uded1 Parar tour', a:'endTour' });
    } else {
      if (s.next) b.push({ l:'\u23ed\ufe0f ' + getTitle(s.next), a:'go_'+s.next });
      b.push({ l: isEN ? '\ud83d\udccb Sections' : '\ud83d\udccb Secciones', a:'categories' });
    }
    return b;
  }

  // ===== TOUR (bilingual) =====
  function startTour() {
    tourIdx = 0;
    inTour = true;
    document.getElementById('aiProgress').style.display = 'flex';
    upProg();
    var isEN = currentLang === 'en';
    var t = isEN
      ? 'Perfect, let\'s start the full tour! I will walk you through all ' + TOUR.length + ' sections of the CRM. For each one I will explain what it is and how to use it. Let\'s go!'
      : '\u00a1Perfecto, vamos con el tour completo! Te voy a llevar por las ' + TOUR.length + ' secciones del CRM. En cada una te explico qu\u00e9 es y c\u00f3mo se usa. \u00a1Empecemos!';
    botMsg(t);
    speak(t);
    setTimeout(function() { goExplain(TOUR[0]); }, 4000);
  }

  function tourNext() {
    clearHL(); stopSpeaking();
    tourIdx++;
    if (tourIdx >= TOUR.length) { finishTour(); return; }
    upProg();
    goExplain(TOUR[tourIdx]);
  }

  function finishTour() {
    inTour = false; tourIdx = -1;
    document.getElementById('aiProgress').style.display = 'none';
    clearHL();
    var isEN = currentLang === 'en';
    var t = isEN
      ? '\ud83c\udf89 Congratulations! You have completed the full tour. Now you know every section of Trade Master CRM. Time to get to work!'
      : '\ud83c\udf89 \u00a1Felicidades! Ya terminaste el tour completo. Ahora conoces todas las secciones de Trade Master CRM. \u00a1A trabajar!';
    botMsg(t, [
      { l: isEN ? '\ud83d\udd04 Repeat' : '\ud83d\udd04 Repetir', a:'startTour' },
      { l: isEN ? '\ud83d\udccb Sections' : '\ud83d\udccb Secciones', a:'categories' }
    ]);
    speak(t);
  }

  function endTour() {
    inTour = false; tourIdx = -1;
    document.getElementById('aiProgress').style.display = 'none';
    clearHL(); stopSpeaking();
    var isEN = currentLang === 'en';
    var t = isEN ? 'Tour paused. How can I help you?' : 'Tour pausado. \u00bfEn qu\u00e9 te ayudo?';
    botMsg(t, [
      { l: isEN ? '\ud83d\udd04 Continue tour' : '\ud83d\udd04 Continuar tour', a:'startTour' },
      { l: isEN ? '\ud83d\udccb Sections' : '\ud83d\udccb Secciones', a:'categories' }
    ]);
  }

  function upProg() {
    var f = document.getElementById('aiFill');
    var t = document.getElementById('aiPText');
    if (!f) return;
    f.style.width = ((tourIdx+1)/TOUR.length*100)+'%';
    t.textContent = (tourIdx+1)+'/'+TOUR.length;
  }

  // ===== CATEGORIES (bilingual) =====
  function categories() {
    var isEN = currentLang === 'en';
    var cats = isEN ? {
      '\ud83d\udd27 Operations':['dashboard','leads','servicecalls','dispatch','jobs','technicians','advisors'],
      '\ud83d\udcb0 Finance':['invoices','collections','receipts','expenses','mymoney','payroll'],
      '\ud83d\udcec Communication':['mailbox'],
      '\ud83d\udcc8 Growth':['marketing','pricebook','reports'],
      '\u2699\ufe0f System':['team','settings']
    } : {
      '\ud83d\udd27 Operaciones':['dashboard','leads','servicecalls','dispatch','jobs','technicians','advisors'],
      '\ud83d\udcb0 Finanzas':['invoices','collections','receipts','expenses','mymoney','payroll'],
      '\ud83d\udcec Comunicaci\u00f3n':['mailbox'],
      '\ud83d\udcc8 Crecimiento':['marketing','pricebook','reports'],
      '\u2699\ufe0f Sistema':['team','settings']
    };
    var h = '<strong>' + (isEN ? '\ud83d\udccb All sections:' : '\ud83d\udccb Todas las secciones:') + '</strong><br><br>';
    for (var cat in cats) {
      h += '<strong>' + cat + '</strong><div class="ai-quick-actions" style="margin-bottom:8px;">';
      cats[cat].forEach(function(k) {
        var icon = S[k] ? S[k].icon : '';
        var title = getTitle(k);
        h += '<button class="ai-quick-btn" onclick="window._ai.act(\'go_' + k + '\')">' + icon + ' ' + title + '</button>';
      });
      h += '</div>';
    }
    botMsg(h);
    var spk = isEN
      ? 'Here are all sections organized by category. Click the one you want to explore.'
      : 'Aqu\u00ed tienes todas las secciones organizadas por categor\u00eda. Haz clic en la que quieras explorar.';
    speak(spk);
  }

  // ===== EXPLAIN HERE =====
  function explainHere() {
    var a = document.querySelector('.section.active') || document.querySelector('.section[style*="display: block"]') || document.querySelector('.section[style*="display:block"]');
    var id = 'dashboard';
    if (a) id = a.id.replace('-section','');
    if (S[id]) goExplain(id);
    else goExplain('dashboard');
  }

  // ===== TOGGLE VOICE =====
  function toggleVoice() {
    voiceEnabled = !voiceEnabled;
    document.getElementById('aiVoiceBtn').textContent = voiceEnabled ? '\ud83d\udd0a' : '\ud83d\udd07';
    if (!voiceEnabled) stopSpeaking();
  }

  // ===== ACTION =====
  function act(a) {
    stopSpeaking(); clearHL();
    if (a === 'startTour') { startTour(); return; }
    if (a === 'explainHere') { explainHere(); return; }
    if (a === 'categories') { categories(); return; }
    if (a === 'welcome') { welcome(); return; }
    if (a === 'tourNext') { tourNext(); return; }
    if (a === 'endTour') { endTour(); return; }
    if (a.startsWith('go_')) { goExplain(a.slice(3)); return; }
    if (a.startsWith('walk_')) { var k = a.slice(5); safeShowSection(k); startWalk(k); return; }
    if (a.startsWith('wn_')) { var k2 = a.slice(3); walkIdx++; doWalk(k2); return; }
  }

  // ===== EXPOSE =====
  window._ai = {
    toggle: toggle,
    send: send,
    act: act,
    toggleVoice: toggleVoice,
    switchLang: function() {
      var newLang = currentLang === 'es' ? 'en' : 'es';
      switchLang(newLang);
      var msg = newLang === 'en'
        ? 'Switched to English! I will guide you in English now.'
        : '\u00a1Cambiado a Espa\u00f1ol! Ahora te gu\u00edo en espa\u00f1ol.';
      botMsg(msg);
      speak(msg);
    }
  };

  // ===== BOOT =====
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
