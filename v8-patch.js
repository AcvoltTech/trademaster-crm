// ============================================================
// i18n-patch.js v8 STUBBORN FIXER
// Paste this ENTIRE block at the VERY END of i18n-patch.js
// (after the last line, which should be init(); or similar)
// ============================================================

// STUBBORN REPLACEMENTS: These elements resist normal translation
// because script.js generates them AFTER our scanner runs.
// This interval checks every 500ms and fixes them.
(function stubbornFixer() {
  
  // Map of exact text replacements for innerHTML of elements
  var STUBBORN = {
    // Calendar day headers
    'DOM': 'SUN', 'LUN': 'MON', 'MAR': 'TUE', 
    'MIÉ': 'WED', 'JUE': 'THU', 'VIE': 'FRI', 'SÁB': 'SAT',
    // Invoice headers
    'VENCIDO': 'OVERDUE', 'TOTAL FACTURAS': 'TOTAL INVOICES', 'VENCE': 'DUE',
    // Service Calls map legend & cards
    'Nueva': 'New', 'Asignada': 'Assigned', 'Completada': 'Completed',
    'Nuevas': 'New', 'En Camino': 'On the Way', 'Completadas Hoy': 'Completed Today',
    'Esperando': 'Waiting', 'En ruta': 'En route', 'Finalizadas': 'Finished',
    'PROBLEMA:': 'PROBLEM:',
    // Dispatch
    'ESPECIALIDAD': 'SPECIALTY', 'ZONA': 'ZONE', 'PRIORIDAD': 'PRIORITY',
    'Baja': 'Low', 'Completado': 'Completed', 'Sin reportar': 'Not reported',
    'Sin asignar': 'Unassigned', 'En Ruta': 'En Route',
    // Home Advisors  
    'Activo': 'Active', 'Comisiones Pendientes': 'Pending Commissions',
    'Leads Activos': 'Active Leads', 'Receipts sin Conciliar': 'Unreconciled Receipts',
    // Leads
    'Llamar': 'Call', 'Texto': 'Text', 'Ganado': 'Won', 
    'Acciones': 'Actions', 'ACCIONES': 'ACTIONS',
    'Mapa de Leads': 'Leads Map',
    // Inbox
    'Todas': 'All',
    // Technicians  
    'Disponible': 'Available', 'Ocupado': 'Busy', 
    'Fuera de línea': 'Offline', 'Sin ubicación': 'No location',
    // Schedule extras
    'Seleccionar cliente...': 'Select client...',
    'Buscar empleado...': 'Search employee...',
    // Settings
    'LOGO DE LA EMPRESA': 'COMPANY LOGO',
    'Cambiar Logo': 'Change Logo',
    'No subido': 'Not uploaded',
    'Vence / Expires:': 'Expires:',
    // Business Mail
    'Entrada': 'Inbox', 'Salida': 'Outbox', 'Documentos': 'Documents',
    'Todos': 'All', 'Entrante': 'Incoming', 'Saliente': 'Outgoing',
    'Urgente': 'Urgent', 'Archivados': 'Archived', 'Archivado': 'Archived',
    // Receipts
    'Proveedores': 'Suppliers', 'Sin Foto': 'No Photo',
    // Users
    'Sesiones Activas': 'Active Sessions',
    'Sin usuarios registrados': 'No registered users'
  };

  // innerHTML pattern replacements for mixed/longer text
  var STUBBORN_PATTERNS = [
    [/Texto enviado (\d+\/\d+\/\d+ \d+:\d+)/g, 'Text sent $1'],
    [/jueves, \d+ de febrero/gi, function(m){ return 'Thursday, February ' + m.match(/\d+(?= de)/)[0]; }],
    [/lunes, \d+ de febrero/gi, function(m){ return 'Monday, February ' + m.match(/\d+(?= de)/)[0]; }],
    [/martes, \d+ de febrero/gi, function(m){ return 'Tuesday, February ' + m.match(/\d+(?= de)/)[0]; }],
    [/miércoles, \d+ de febrero/gi, function(m){ return 'Wednesday, February ' + m.match(/\d+(?= de)/)[0]; }],
    [/viernes, \d+ de febrero/gi, function(m){ return 'Friday, February ' + m.match(/\d+(?= de)/)[0]; }],
    [/sábado, \d+ de febrero/gi, function(m){ return 'Saturday, February ' + m.match(/\d+(?= de)/)[0]; }],
    [/domingo, \d+ de febrero/gi, function(m){ return 'Sunday, February ' + m.match(/\d+(?= de)/)[0]; }],
    [/hace >(\d+)min/g, '$1min ago'],
    [/hace (\d+) min/g, '$1 min ago'],
    [/Documents de la Empresa Documents/g, 'Company Documents'],
    [/Estos will be automatically included/g, 'These will be automatically included'],
    [/cuando el cliente o empresa lo solicite/g, 'when the client or company requests it'],
    [/Administra quién puede acceder al CRM y qué secciones puede ver\./g, 'Manage who can access the CRM and what sections they can see.'],
    [/Solo el/g, 'Only the'],
    [/puede administrar usuarios\./g, 'can manage users.'],
    [/Acceso total\. My Money, cuenta bancaria, configuración, usuarios\./g, 'Full access. My Money, bank account, settings, users.'],
    [/Solo 1 por empresa\./g, 'Only 1 per company.'],
    [/Payroll, gastos, recibos, facturas, QuickBooks, reportes\./g, 'Payroll, expenses, receipts, invoices, QuickBooks, reports.'],
    [/No ve My Money ni cuenta bancaria\./g, 'Cannot see My Money or bank account.'],
    [/Despacho, trabajos, técnicos, clientes, correo, agenda\./g, 'Dispatch, jobs, technicians, clients, email, schedule.'],
    [/No ve finanzas ni nómina\./g, 'Cannot see finances or payroll.'],
    [/Solo sus trabajos asignados, reloj de entrada\/salida\./g, 'Only assigned jobs, clock in/out.'],
    [/No ve otros datos\./g, 'Cannot see other data.'],
    [/en estimados y facturas para cumplir con requisitos de empresas y clientes comerciales\./g, 'in estimates and invoices to meet business and commercial client requirements.'],
    [/facturas de proveedores, avisos del gobierno, correspondencia de seguros, etc\./g, 'supplier invoices, government notices, insurance correspondence, etc.'],
    [/No hay documentos en esta vista\./g, 'No documents in this view.'],
    [/No hay recibos registrados\./g, 'No receipts recorded.'],
    [/No hay seguimientos registrados\./g, 'No follow-ups recorded.'],
    [/Garantía, condiciones, recomendaciones\.\.\./g, 'Warranty, conditions, recommendations...'],
    [/Dirección de la empresa/g, 'Company address'],
    [/Nombre completo del dueño/g, 'Owner full name'],
    [/Buscar parte, servicio\.\.\./g, 'Search part, service...'],
    [/garantia de un furnace que? no esta funcinando/gi, 'warranty on a furnace that is not working'],
    [/revisar un furnace/gi, 'check a furnace'],
    [/reparar su ac/gi, 'repair their ac'],
    [/furnace repacio/gi, 'furnace repair'],
    [/Equipos Carrier, Bryant, Payne/g, 'Carrier, Bryant, Payne equipment'],
    [/Rheem, Ruud, equipos completos/g, 'Rheem, Ruud, complete equipment'],
    [/Motores, controles, herramientas/g, 'Motors, controls, tools'],
    [/Partes, herramientas, accesorios/g, 'Parts, tools, accessories'],
    [/Equipos, filtros, ductos/g, 'Equipment, filters, ducts'],
    [/Partes usadas y nuevas, boards/g, 'Used and new parts, boards'],
    [/Equipos y partes Trane\/American Standard/g, 'Trane/American Standard equipment & parts'],
    [/Equipos y partes Lennox/g, 'Lennox equipment & parts'],
    [/Mini-splits, boilers, partes/g, 'Mini-splits, boilers, parts'],
    [/Sin comunicaciones\. Registra tu primera interacción con un cliente\./g, 'No communications. Record your first interaction with a client.'],
    [/No hay citas próximas/g, 'No upcoming appointments'],
    [/Sin registros de entrada hoy/g, 'No clock entries today'],
    [/Tasa de Conversión:/g, 'Conversion Rate:'],
    [/Técnicos:/g, 'Technicians:'],
    [/── Técnicos ──/g, '── Technicians ──'],
    [/No hay empleados registrados/g, 'No employees registered'],
    [/Agrega tu primer empleado para comenzar/g, 'Add your first employee to get started'],
    [/Gestión de empleados y cumplimiento legal/g, 'Employee management and legal compliance'],
    [/Usuarios y Control de Acceso/g, 'Users & Access Control']
  ];

  function fixStubborn() {
    if (document.documentElement.lang === 'es') return; // Spanish mode, don't translate
    
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var changed = 0;
    
    while (walker.nextNode()) {
      var node = walker.currentNode;
      var text = node.textContent.trim();
      if (text.length < 2 || text.length > 500) continue;
      
      // Skip scripts, styles, and AI chat
      var parent = node.parentElement;
      if (!parent) continue;
      var tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
      if (parent.closest && parent.closest('.ai-chat-panel')) continue;
      
      // Exact match
      if (STUBBORN[text]) {
        node.textContent = node.textContent.replace(text, STUBBORN[text]);
        changed++;
        continue;
      }
      
      // Pattern match on parent innerHTML for longer texts
      var html = parent.innerHTML;
      var originalHtml = html;
      
      for (var i = 0; i < STUBBORN_PATTERNS.length; i++) {
        var pattern = STUBBORN_PATTERNS[i][0];
        var replacement = STUBBORN_PATTERNS[i][1];
        // Reset lastIndex for global regex
        pattern.lastIndex = 0;
        if (pattern.test(html)) {
          pattern.lastIndex = 0;
          html = html.replace(pattern, replacement);
        }
      }
      
      if (html !== originalHtml) {
        parent.innerHTML = html;
        changed++;
      }
    }
    
    // Also fix placeholder attributes
    var placeholders = document.querySelectorAll('input[placeholder], textarea[placeholder]');
    var PH = {
      'Buscar empleado...': 'Search employee...',
      'Seleccionar cliente...': 'Select client...',
      'Buscar parte, servicio...': 'Search part, service...',
      'Garantía, condiciones, recomendaciones...': 'Warranty, conditions, recommendations...',
      'Dirección de la empresa': 'Company address',
      'Nombre completo del dueño': 'Owner full name',
      'Nombre, Teléfono, Email, Dirección': 'Name, Phone, Email, Address'
    };
    placeholders.forEach(function(el) {
      var ph = el.getAttribute('placeholder');
      if (PH[ph]) {
        el.setAttribute('placeholder', PH[ph]);
        changed++;
      }
    });
    
    // Fix select option values
    var options = document.querySelectorAll('select option');
    var OPT = {
      'Todas': 'All', 'Ganado': 'Won', 'Nuevo': 'New', 'Nueva': 'New',
      'Pendiente': 'Pending', 'Completado': 'Completed', 'Cancelado': 'Cancelled',
      'Sin asignar': 'Unassigned'
    };
    options.forEach(function(opt) {
      var t = opt.textContent.trim();
      if (OPT[t]) {
        opt.textContent = OPT[t];
        changed++;
      }
    });
    
    return changed;
  }

  // Run immediately
  fixStubborn();
  
  // Run on every section change (500ms interval, stops after 30 seconds of no changes)
  var noChangeCount = 0;
  var stubbornInterval = setInterval(function() {
    var c = fixStubborn();
    if (c === 0) {
      noChangeCount++;
      if (noChangeCount > 60) { // 30 seconds of no changes
        clearInterval(stubbornInterval);
        // But still listen for clicks
      }
    } else {
      noChangeCount = 0;
    }
  }, 500);

  // Also run when sidebar links are clicked
  document.addEventListener('click', function(e) {
    var link = e.target.closest && e.target.closest('a, .sidebar-link, [onclick]');
    if (link) {
      // Reset interval if it was cleared
      if (noChangeCount > 60) {
        noChangeCount = 0;
        stubbornInterval = setInterval(function() {
          var c = fixStubborn();
          if (c === 0) {
            noChangeCount++;
            if (noChangeCount > 60) clearInterval(stubbornInterval);
          } else {
            noChangeCount = 0;
          }
        }, 500);
      }
      // Run 3 times with delays after click
      setTimeout(fixStubborn, 200);
      setTimeout(fixStubborn, 600);
      setTimeout(fixStubborn, 1500);
    }
  }, true);

  console.log('🔧 i18n v8 STUBBORN FIXER loaded');
})();
