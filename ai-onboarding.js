// Polyfills
if(typeof formatMoney==='undefined'){window.formatMoney=function(a){var n=parseFloat(a)||0;return '$'+n.toFixed(2).replace(/\B(?=(?:\d{3})+(?!\d))/g,',');}}

/* ==================== AI ONBOARDING - TRADE MASTER CRM ==================== */
/* Voice-guided, interactive tour with real highlights and conversational tone */

(function() {
  'use strict';

  function safeShowSection(key) {
    try {
      safeShowSection(key);
    } catch(e) {
      console.warn('AI Tour: showSection error for ' + key + ':', e.message);
    }
  }


  // ===== TRADE MASTER LOGO SVG (inline) =====
  const LOGO_SVG_36 = '<svg viewBox="0 0 120 120" width="36" height="36"><defs><clipPath id="aiL"><rect x="0" y="0" width="60" height="120"/></clipPath><clipPath id="aiR"><rect x="60" y="0" width="60" height="120"/></clipPath></defs><path d="M60 4 A56 56 0 0 0 60 116 Z" fill="#1e3a5f"/><path d="M60 4 A56 56 0 0 1 60 116 Z" fill="#7f1d1d"/><g clip-path="url(#aiL)"><line x1="38" y1="28" x2="38" y2="92" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="60" x2="58" y2="60" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/><line x1="22" y1="38" x2="54" y2="82" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/><line x1="54" y1="38" x2="22" y2="82" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/><circle cx="26" cy="45" r="2" fill="#93c5fd"/><circle cx="26" cy="75" r="2" fill="#93c5fd"/><circle cx="48" cy="45" r="2" fill="#93c5fd"/><circle cx="48" cy="75" r="2" fill="#93c5fd"/></g><g clip-path="url(#aiR)"><path d="M82 88 C82 88 68 72 68 58 C68 44 76 38 80 30 C80 30 82 44 88 48 C90 38 94 34 94 34 C94 34 100 50 100 62 C100 76 92 88 82 88 Z" fill="#f97316" opacity="0.9"/><path d="M82 88 C82 88 74 78 74 68 C74 58 78 52 82 46 C82 46 84 56 88 58 C88 52 92 48 92 48 C92 48 96 58 96 66 C96 78 88 88 82 88 Z" fill="#fbbf24" opacity="0.9"/><path d="M82 88 C82 88 78 82 78 76 C78 70 80 66 82 60 C84 66 86 70 86 76 C86 82 82 88 82 88 Z" fill="#fef3c7"/></g><line x1="60" y1="8" x2="60" y2="112" stroke="white" stroke-width="2" opacity="0.3"/><circle cx="60" cy="60" r="56" fill="none" stroke="white" stroke-width="1.5" opacity="0.15"/></svg>';
  const LOGO_SVG_32 = LOGO_SVG_36.replace(/width="36"/g,'width="32"').replace(/height="36"/g,'height="32"');

  // ===== VOICE SYSTEM (Bilingual Female) =====
  let voiceEnabled = true;
  let currentLang = 'es'; // 'es' or 'en' — auto-detected from CRM
  let femaleVoiceES = null;
  let femaleVoiceEN = null;

  function initVoice() {
    const load = () => {
      const v = speechSynthesis.getVoices();
      // Spanish female (México/US): Google español de Estados Unidos is female & natural
      femaleVoiceES = v.find(x => x.name === 'Google español de Estados Unidos') ||
                      v.find(x => x.name === 'Google español') ||
                      v.find(x => x.lang === 'es-MX') ||
                      v.find(x => x.lang === 'es-US') ||
                      v.find(x => x.lang.startsWith('es')) || null;
      // English female (USA): Google US English is female & clear
      femaleVoiceEN = v.find(x => x.name === 'Google US English') ||
                      v.find(x => x.name === 'Microsoft Zira - English (United States)') ||
                      v.find(x => x.name === 'Google UK English Female') ||
                      v.find(x => x.lang === 'en-US') || null;
    };
    speechSynthesis.onvoiceschanged = load;
    load();
    setTimeout(load, 500);
    setTimeout(load, 1500);
    // Auto-detect CRM language
    detectCRMLang();
    // Watch for CRM language changes
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
        if (aiLangBtn) aiLangBtn.textContent = currentLang === 'en' ? '🇺🇸' : '🇲🇽';
      }
    }
  }

  function speak(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    stopSpeaking();
    const clean = text.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
    if (!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);
    if (currentLang === 'en') {
      utter.lang = 'en-US';
      utter.rate = 0.93;
      utter.pitch = 1.08;
      if (femaleVoiceEN) utter.voice = femaleVoiceEN;
    } else {
      utter.lang = 'es-US';
      utter.rate = 0.93;
      utter.pitch = 1.08;
      if (femaleVoiceES) utter.voice = femaleVoiceES;
    }
    utter.volume = 1;
    speechSynthesis.speak(utter);
  }

  function stopSpeaking() {
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  }

  function switchLang(lang) {
    currentLang = lang;
    stopSpeaking();
    const btn = document.getElementById('aiLangBtn');
    if (btn) btn.textContent = lang === 'en' ? '🇺🇸' : '🇲🇽';
    // Also toggle CRM language to match
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

  // ===== SECTION KNOWLEDGE =====
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

  // ===== ENGLISH TRANSLATIONS =====
  const EN = {
    dashboard: { hi:'Good morning! Welcome to the Dashboard, your Command Center.', explain:'From here you can see your entire business in real time. You have cards showing jobs won, active service calls, salespeople and technicians in the field. Below there is a live operations map, the employee clock in and out system, and your estimates pipeline.' },
    leads: { hi:'Now let\'s go to Leads!', explain:'Here you register people who call asking for service or a quote but are not confirmed clients yet. The goal is to follow up and convert them into won jobs. Each lead is potential money.' },
    servicecalls: { hi:'Now Service Calls!', explain:'Here you control all emergency and service calls. Each call is tracked from when it comes in until it is completed. You can assign a technician, set the urgency, and follow up.' },
    dispatch: { hi:'Now Dispatch!', explain:'This is your coordination center. Here you see where all your technicians are on the map, assign them jobs, and set up your Dispatch Coordinator.' },
    jobs: { hi:'This section is super important! Here you create professional estimates.', explain:'The system guides you in 5 steps to create an estimate. It has over 150 HVAC parts with prices. You select the equipment, service call, components, and it generates a professional PDF for the client.' },
    technicians: { hi:'Now Technicians!', explain:'Here you manage your entire team. Each technician has a complete profile with photo, specialty, rate, certifications like EPA 608 and NATE, vehicle documents, and you can even generate a professional ID card.' },
    advisors: { hi:'Now Home Advisors, your sales team!', explain:'Here you manage the salespeople who close new installation sales. The system has tiered commissions: 20 percent for profits over 10 thousand, 15 for 7 to 10, 10 for 5 to 7, and 5 percent for under 5 thousand.' },
    clients: { hi:'The Clients database!', explain:'Each client has a complete file. Job history, estimates, invoices, internal notes, attachments, and communication records. Everything you need to know about each client in one place.' },
    invoices: { hi:'Now Invoices!', explain:'Create professional invoices from a job or manually. The system calculates subtotal, discount, tax and total. You can filter by status and follow up on collection.' },
    collections: { hi:'Collections! Here you make sure money comes in.', explain:'You see all invoices pending collection, overdue ones, and you can record payments. Check it every day so no collection slips through.' },
    receipts: { hi:'Now Purchase Receipts!', explain:'Record every material receipt with photo, supplier, category and amount. You have pre-configured suppliers like Johnstone, Ferguson, Home Depot and more. At the end of the month export everything to CSV for your accountant.' },
    expenses: { hi:'Business Expenses!', explain:'Here you record all fixed expenses: rent, insurance, licenses, vehicles, software. It tells you exactly how much it costs to operate your business each month. Key to knowing how much to charge.' },
    mymoney: { hi:'My Money! This section is only for you as the owner.', explain:'Nobody else on your team can see this. Here you see your income, expenses, net profit and accounts receivable. Check it every week.' },
    payroll: { hi:'Payroll!', explain:'Record hours worked, overtime, bonuses and deductions for each employee. In California overtime is after 8 hours per day, not 40 per week. The system calculates automatically.' },
    mailbox: { hi:'Business Mail!', explain:'Record all important correspondence: insurance letters, government, suppliers, banks. Upload photo or PDF and never lose an important document.' },
    marketing: { hi:'Marketing! Your marketing center.', explain:'You have direct access to all platforms: Facebook, Google, Yelp, Angi, HomeAdvisor, Thumbtack. You can also create campaigns and request reviews from satisfied clients. Reviews are gold for your business.' },
    pricebook: { hi:'The Price Book!', explain:'Your catalog of over 150 HVAC components with prices. Also direct links to distributors like Ferguson, Johnstone, and US Air to compare prices and order parts.' },
    reports: { hi:'Reports!', explain:'Generate reports on income, expenses, completed jobs and technician performance. Review them monthly to make better data-driven decisions.' },
    team: { hi:'Users and Team!', explain:'Control who can access the CRM. 5 roles: Owner sees everything, Accounting sees finances, Coordinator sees operations, Technician only sees their jobs, and View Only just looks.' },
    settings: { hi:'Finally, Settings!', explain:'Upload your logo, fill in company data, insurance and license documents, and customize legal clauses. Everything you put here appears on documents you send to clients.' }
  };

  // Get text in current language
  function getContent(sectionKey, field) {
    if (currentLang === 'en' && EN[sectionKey] && EN[sectionKey][field]) {
      return EN[sectionKey][field];
    }
    return S[sectionKey][field];
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
    // CSS for highlight animation
    const st = document.createElement('style');
    st.textContent = '@keyframes aiPulseHL{0%,100%{box-shadow:0 0 0 9999px rgba(0,0,0,0.5),0 0 20px 4px rgba(244,118,33,0.5)}50%{box-shadow:0 0 0 9999px rgba(0,0,0,0.5),0 0 32px 8px rgba(244,118,33,0.9)}}';
    document.head.appendChild(st);
    createBtn();
    createPanel();
    initVoice();
    console.log('✅ AI Tour Guide v2 — Voice + Highlight loaded');
  }

  function createBtn() {
    const b = document.createElement('button');
    b.className = 'ai-float-btn';
    b.id = 'aiFloatBtn';
    b.innerHTML = LOGO_SVG_36;
    b.title = 'Asistente AI';
    b.onclick = toggle;
    if (!localStorage.getItem('tm_ai_v2')) {
      const dot = document.createElement('div');
      dot.className = 'ai-new-badge';
      b.appendChild(dot);
    }
    document.body.appendChild(b);
  }

  function createPanel() {
    const p = document.createElement('div');
    p.className = 'ai-chat-panel';
    p.id = 'aiChatPanel';
    p.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-header-left">
          <div class="ai-chat-avatar">${LOGO_SVG_32}</div>
          <div><h3>Trade Master AI</h3><small>Tu guía personal</small></div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="ai-voice-toggle" id="aiLangBtn" onclick="window._ai.switchLang()" title="Español / English">🇲🇽</button>
          <button class="ai-voice-toggle" id="aiVoiceBtn" onclick="window._ai.toggleVoice()" title="Voz">🔊</button>
          <button class="ai-chat-close" onclick="window._ai.toggle()">✕</button>
        </div>
      </div>
      <div id="aiProgress" class="ai-tour-progress" style="display:none;">
        <div class="ai-tour-progress-bar"><div class="ai-tour-progress-fill" id="aiFill" style="width:0%"></div></div>
        <span class="ai-tour-progress-text" id="aiPText">0/${TOUR.length}</span>
      </div>
      <div class="ai-chat-messages" id="aiMsgs"></div>
      <div class="ai-chat-input-area">
        <input class="ai-chat-input" id="aiIn" placeholder="Escribe tu pregunta..." onkeydown="if(event.key==='Enter')window._ai.send()">
        <button class="ai-chat-send" onclick="window._ai.send()">➤</button>
      </div>`;
    document.body.appendChild(p);
  }

  // ===== TOGGLE =====
  function toggle() {
    isOpen = !isOpen;
    const p = document.getElementById('aiChatPanel');
    if (isOpen) {
      p.classList.add('open');
      localStorage.setItem('tm_ai_v2','1');
      const dot = document.querySelector('.ai-new-badge');
      if (dot) dot.remove();
      if (!document.getElementById('aiMsgs').children.length) welcome();
    } else {
      p.classList.remove('open');
      stopSpeaking();
    }
  }

  // ===== WELCOME =====
  function welcome() {
    const t = currentLang === 'en'
      ? 'Hi there! I am your Trade Master assistant. I am here to teach you every part of the CRM step by step. I will explain each section, show you where things are, and give you professional tips. What would you like to do?'
      : '¡Hola, buen día! Soy tu asistente de Trade Master. Estoy aquí para enseñarte todo el CRM paso a paso. Te explico cada sección, te muestro dónde están las cosas, y te doy tips de profesional. ¿Qué hacemos?';
    botMsg(t, [
      { l: currentLang === 'en' ? '🎓 Full CRM Tour' : '🎓 Tour Completo del CRM', a:'startTour' },
      { l: currentLang === 'en' ? '❓ Explain where I am' : '❓ Explícame dónde estoy', a:'explainHere' },
      { l: currentLang === 'en' ? '📋 See all sections' : '📋 Ver todas las secciones', a:'categories' }
    ]);
    speak(t);
  }

  // ===== MESSAGES =====
  function botMsg(text, btns) {
    const c = document.getElementById('aiMsgs');
    const d = document.createElement('div');
    d.className = 'ai-msg bot';
    let h = text;
    if (btns && btns.length) {
      h += '<div class="ai-quick-actions">';
      btns.forEach(b => { h += `<button class="ai-quick-btn" onclick="window._ai.act('${b.a}')">${b.l}</button>`; });
      h += '</div>';
    }
    d.innerHTML = h;
    c.appendChild(d);
    sb();
  }

  function userMsg(text) {
    const c = document.getElementById('aiMsgs');
    const d = document.createElement('div');
    d.className = 'ai-msg user';
    d.textContent = text;
    c.appendChild(d);
    sb();
  }

  function typing() {
    const c = document.getElementById('aiMsgs');
    const d = document.createElement('div');
    d.className = 'ai-typing';
    d.id = 'aiTyp';
    d.innerHTML = '<div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div>';
    c.appendChild(d);
    sb();
  }
  function untyping() { const e = document.getElementById('aiTyp'); if(e) e.remove(); }
  function sb() { const m = document.getElementById('aiMsgs'); setTimeout(() => m.scrollTop = m.scrollHeight, 100); }

  // ===== SEND =====
  function send() {
    const i = document.getElementById('aiIn');
    const t = i.value.trim();
    if (!t) return;
    i.value = '';
    userMsg(t);
    proc(t);
  }

  function proc(text) {
    const q = text.toLowerCase();
    if (q.match(/tour|recorrido|enseña|muestra todo|enséñame/)) { act('startTour'); return; }
    if (q.match(/^(sí|si|yes|dale|va|órale|orale|siguiente|next|continuar|vamos|ándale)$/i) || q.match(/siguiente|next|continuar/)) {
      if (inTour) { tourNext(); return; }
      if (walkIdx >= 0) return; // walkthrough in progress
    }
    if (q.match(/dónde estoy|donde estoy|qué es esto|que es esto|explica/)) { act('explainHere'); return; }
    const found = findSec(q);
    if (found) { goExplain(found); return; }
    const t = 'Claro, dime qué sección te interesa o puedo hacerte el tour completo.';
    botMsg(t, [
      { l:'🎓 Tour Completo', a:'startTour' },
      { l:'❓ Dónde estoy', a:'explainHere' },
      { l:'📋 Secciones', a:'categories' }
    ]);
    speak(t);
  }

  function findSec(q) {
    const map = {
      dashboard:['tablero','dashboard','centro','inicio'], leads:['lead','prospecto'],
      servicecalls:['llamada','service call','emergencia'], dispatch:['despacho','dispatch','coordinador'],
      jobs:['trabajo','estimado','cotización','presupuesto'], technicians:['técnico','tecnico','certificación','epa'],
      advisors:['advisor','vendedor','comisión','asesor'], clients:['cliente','customer'],
      invoices:['factura','invoice'], collections:['cobranza','cobro'],
      receipts:['recibo','receipt'], expenses:['gasto','expense','costo'],
      mymoney:['mi dinero','money','ganancia'], payroll:['nómina','nomina','payroll','sueldo'],
      mailbox:['correo','mail','buzón'], marketing:['marketing','mercadotecnia','publicidad','reseña'],
      pricebook:['precio','price','catálogo','proveedor'], reports:['reporte','report'],
      team:['usuario','equipo','rol','permiso'], settings:['configuración','config','setting','logo']
    };
    for (const [k, ws] of Object.entries(map)) {
      if (ws.some(w => q.includes(w))) return k;
    }
    return null;
  }

  // ===== GO + EXPLAIN =====
  function goExplain(key) {
    const s = S[key];
    if (!s) return;
    try{if(typeof window.showSection==='function')window.showSection(key)}catch(e){console.warn('AI:'+e)};
    typing();
    setTimeout(() => {
      untyping();
      const hi = getContent(key, 'hi');
      const explain = getContent(key, 'explain');
      const msg = hi + ' ' + explain;
      const btns = [];
      if (s.walk && s.walk.length) btns.push({ l: currentLang === 'en' ? '👀 Show me step by step' : '👀 Muéstrame paso a paso', a:'walk_'+key });
      if (inTour) {
        btns.push({ l: currentLang === 'en' ? '⏭️ Next section' : '⏭️ Siguiente sección', a:'tourNext' });
        btns.push({ l: currentLang === 'en' ? '🛑 Stop tour' : '🛑 Parar tour', a:'endTour' });
      } else {
        if (s.next) btns.push({ l:'⏭️ ' + (S[s.next]?.title||''), a:'go_'+s.next });
        btns.push({ l: currentLang === 'en' ? '📋 Sections' : '📋 Ver secciones', a:'categories' });
      }
      botMsg(msg, btns);
      speak(msg);
      setTimeout(() => {
        const el = document.getElementById(key+'-section');
        if (el) highlight(el, 3000);
      }, 500);
    }, 700);
  }

  // ===== WALKTHROUGH =====
  function startWalk(key) {
    const s = S[key];
    if (!s || !s.walk || !s.walk.length) {
      botMsg('Esta sección no tiene pasos detallados, pero ya te expliqué lo principal. ¿Seguimos?', postWalkBtns(key));
      return;
    }
    walkIdx = 0;
    doWalk(key);
  }

  function doWalk(key) {
    clearHL();
    const s = S[key];
    if (walkIdx >= s.walk.length) {
      walkIdx = -1;
      clearHL();
      const t = '¡Listo! Ya te mostré todo lo de ' + s.title + '. ¿Qué hacemos ahora?';
      botMsg(t, postWalkBtns(key));
      speak(t);
      return;
    }
    const step = s.walk[walkIdx];
    typing();
    setTimeout(() => {
      untyping();
      const num = walkIdx + 1;
      const total = s.walk.length;
      botMsg(`<strong>👆 Paso ${num} de ${total}:</strong> ${step.say}`, [
        { l: num < total ? '👉 Siguiente paso' : '✅ Listo', a:'wn_'+key }
      ]);
      speak(step.say);
      if (step.hl) setTimeout(() => highlight(step.hl, 999999), 400);
    }, 900);
  }

  function postWalkBtns(key) {
    const s = S[key];
    const b = [];
    if (inTour) {
      if (s.next) b.push({ l:'⏭️ Siguiente sección', a:'tourNext' });
      b.push({ l:'🛑 Parar tour', a:'endTour' });
    } else {
      if (s.next) b.push({ l:'⏭️ '+S[s.next]?.title, a:'go_'+s.next });
      b.push({ l:'📋 Secciones', a:'categories' });
    }
    return b;
  }

  // ===== TOUR =====
  function startTour() {
    tourIdx = 0;
    inTour = true;
    document.getElementById('aiProgress').style.display = 'flex';
    upProg();
    const t = '¡Perfecto, vamos con el tour completo! Te voy a llevar por las ' + TOUR.length + ' secciones del CRM. En cada una te explico qué es y cómo se usa. ¡Empecemos!';
    botMsg(t);
    speak(t);
    setTimeout(() => goExplain(TOUR[0]), 4000);
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
    const t = '🎉 ¡Felicidades! Ya terminaste el tour completo. Ahora conoces todas las secciones de Trade Master CRM. ¡A trabajar!';
    botMsg(t, [{ l:'🔄 Repetir', a:'startTour' }, { l:'📋 Secciones', a:'categories' }]);
    speak(t);
  }

  function endTour() {
    inTour = false; tourIdx = -1;
    document.getElementById('aiProgress').style.display = 'none';
    clearHL(); stopSpeaking();
    botMsg('Tour pausado. ¿En qué te ayudo?', [{ l:'🔄 Continuar tour', a:'startTour' }, { l:'📋 Secciones', a:'categories' }]);
  }

  function upProg() {
    const f = document.getElementById('aiFill');
    const t = document.getElementById('aiPText');
    if (!f) return;
    f.style.width = ((tourIdx+1)/TOUR.length*100)+'%';
    t.textContent = (tourIdx+1)+'/'+TOUR.length;
  }

  // ===== CATEGORIES =====
  function categories() {
    const cats = {
      '🔧 Operaciones':['dashboard','leads','servicecalls','dispatch','jobs','technicians','advisors'],
      '💰 Finanzas':['invoices','collections','receipts','expenses','mymoney','payroll'],
      '📬 Comunicación':['mailbox'],
      '📈 Crecimiento':['marketing','pricebook','reports'],
      '⚙️ Sistema':['team','settings']
    };
    let h = '<strong>📋 Todas las secciones:</strong><br><br>';
    for (const [cat,keys] of Object.entries(cats)) {
      h += `<strong>${cat}</strong><div class="ai-quick-actions" style="margin-bottom:8px;">`;
      keys.forEach(k => { const s = S[k]; if(s) h += `<button class="ai-quick-btn" onclick="window._ai.act('go_${k}')">${s.icon} ${s.title}</button>`; });
      h += '</div>';
    }
    botMsg(h);
    speak('Aquí tienes todas las secciones organizadas por categoría. Haz clic en la que quieras explorar.');
  }

  // ===== EXPLAIN HERE =====
  function explainHere() {
    const a = document.querySelector('.section.active') || document.querySelector('.section[style*="display: block"]') || document.querySelector('.section[style*="display:block"]');
    let id = 'dashboard';
    if (a) id = a.id.replace('-section','');
    if (S[id]) goExplain(id);
    else goExplain('dashboard');
  }

  // ===== TOGGLE VOICE =====
  function toggleVoice() {
    voiceEnabled = !voiceEnabled;
    document.getElementById('aiVoiceBtn').textContent = voiceEnabled ? '🔊' : '🔇';
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
    if (a.startsWith('walk_')) { const k = a.slice(5); try{if(typeof window.showSection==='function')window.showSection(k)}catch(e){console.warn('AI:'+e)}; startWalk(k); return; }
    if (a.startsWith('wn_')) { const k = a.slice(3); walkIdx++; doWalk(k); return; }
  }

  // ===== EXPOSE =====
  window._ai = { toggle, send, act, toggleVoice, switchLang: function() { const newLang = currentLang === 'es' ? 'en' : 'es'; switchLang(newLang); const msg = newLang === 'en' ? 'Switched to English! I will guide you in English now.' : '¡Cambiado a Español! Ahora te guío en español.'; botMsg(msg); speak(msg); } };

  // ===== BOOT =====
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
