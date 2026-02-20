// ============================================================
// i18n-patch.js v8 STUBBORN FIXER
// Paste this ENTIRE block at the VERY END of i18n-patch.js
// (after the last line, which should be init(); or similar)
// ============================================================

(function stubbornFixer() {
  
  var STUBBORN = {
    // Calendar day headers
    'DOM': 'SUN', 'LUN': 'MON', 'MAR': 'TUE', 
    'MIÉ': 'WED', 'JUE': 'THU', 'VIE': 'FRI', 'SÁB': 'SAT',
    // Invoice headers
    'VENCIDO': 'OVERDUE', 'TOTAL FACTURAS': 'TOTAL INVOICES', 'VENCE': 'DUE',
    // Service Calls
    'Nueva': 'New', 'Asignada': 'Assigned', 'Completada': 'Completed',
    'Nuevas': 'New', 'En Camino': 'On the Way', 'Completadas Hoy': 'Completed Today',
    'Esperando': 'Waiting', 'En ruta': 'En route', 'Finalizadas': 'Finished',
    'PROBLEMA:': 'PROBLEM:',
    // Dispatch & tables
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
    'Técnico': 'Technician', 'Técnicos': 'Technicians',
    // Settings
    'LOGO DE LA EMPRESA': 'COMPANY LOGO',
    'Cambiar Logo': 'Change Logo',
    'No subido': 'Not uploaded',
    // Business Mail
    'Entrada': 'Inbox', 'Salida': 'Outbox', 'Documentos': 'Documents',
    'Todos': 'All', 'Entrante': 'Incoming', 'Saliente': 'Outgoing',
    'Urgente': 'Urgent', 'Archivados': 'Archived', 'Archivado': 'Archived',
    // Receipts
    'Proveedores': 'Suppliers', 'Sin Foto': 'No Photo',
    // Users
    'Sesiones Activas': 'Active Sessions',
    'Sin usuarios registrados': 'No registered users',
    // Jobs
    'MARCA': 'BRAND',
    'HORAS DE LABOR': 'LABOR HOURS',
    'DESCUENTO (%)': 'DISCOUNT (%)',
    // Payroll
    'No conectado': 'Not connected',
    'Integrado con contabilidad QB': 'Integrated with QB accounting',
    'Ingresa tu API Key...': 'Enter your API Key...',
    'Ingresa tu Secret...': 'Enter your Secret...',
    'ID de tu empresa en el proveedor': 'Your company ID with the provider',
    // Expenses
    'al dia': 'up to date',
    'con su propia cuenta': 'with their own account',
    // Schedule date
    'Seleccionar cliente...': 'Select client...',
    'Buscar empleado...': 'Search employee...'
  };

  var STUBBORN_PATTERNS = [
    [/Texto enviado (\d+\/\d+\/\d+ \d+:\d+)/g, 'Text sent $1'],
    [/jueves, (\d+) de febrero/gi, 'Thursday, February $1'],
    [/lunes, (\d+) de febrero/gi, 'Monday, February $1'],
    [/martes, (\d+) de febrero/gi, 'Tuesday, February $1'],
    [/miércoles, (\d+) de febrero/gi, 'Wednesday, February $1'],
    [/viernes, (\d+) de febrero/gi, 'Friday, February $1'],
    [/sábado, (\d+) de febrero/gi, 'Saturday, February $1'],
    [/domingo, (\d+) de febrero/gi, 'Sunday, February $1'],
    [/hace >?(\d+)min/g, '$1min ago'],
    [/hace (\d+) min/g, '$1 min ago'],
    [/Documents de la Empresa Documents/g, 'Company Documents'],
    [/Documents de la Empresa/g, 'Company Documents'],
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
    [/Garantía, condiciones, recomendaciones/g, 'Warranty, conditions, recommendations'],
    [/Dirección de la empresa/g, 'Company address'],
    [/Nombre completo del dueño/g, 'Owner full name'],
    [/Buscar parte, servicio/g, 'Search part, service'],
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
    [/👷 Técnicos:/g, '👷 Technicians:'],
    [/── Técnicos ──/g, '── Technicians ──'],
    [/No hay empleados registrados/g, 'No employees registered'],
    [/Agrega tu primer empleado para comenzar/g, 'Add your first employee to get started'],
    [/Gestión de empleados y cumplimiento legal/g, 'Employee management and legal compliance'],
    [/Usuarios y Control de Acceso/g, 'Users & Access Control'],
    [/LOGO DE LA EMPRESA/g, 'COMPANY LOGO'],
    [/Ingresa tu API Key/g, 'Enter your API Key'],
    [/Ingresa tu Secret/g, 'Enter your Secret'],
    [/ID de tu empresa en el proveedor/g, 'Your company ID with the provider'],
    [/No conectado/g, 'Not connected'],
    [/Integrado con contabilidad QB/g, 'Integrated with QB accounting'],
    [/keep your accounting al dia/g, 'keep your accounting up to date'],
    [/directly con su propia cuenta/g, 'directly with their own account'],
    [/accounting al dia/g, 'accounting up to date'],
    [/con su propia cuenta/g, 'with their own account'],
    [/Vence \/ Expires:/g, 'Expires:'],
    [/No subido/g, 'Not uploaded'],
    [/Service Calls Map/g, 'Service Calls Map']
  ];

  function fixStubborn() {
    if (document.documentElement.lang === 'es') return 0;
    
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var changed = 0;
    var processed = new Set();
    
    while (walker.nextNode()) {
      var node = walker.currentNode;
      var text = node.textContent.trim();
      if (text.length < 2 || text.length > 500) continue;
      
      var parent = node.parentElement;
      if (!parent) continue;
      var tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
      if (parent.closest && parent.closest('.ai-chat-panel')) continue;
      
      // Exact match on trimmed text
      if (STUBBORN[text]) {
        node.textContent = node.textContent.replace(text, STUBBORN[text]);
        changed++;
        continue;
      }
      
      // Pattern match - only on parent innerHTML if not already processed
      var parentId = parent.getAttribute('data-i18n-checked');
      if (parentId) continue;
      
      var html = parent.innerHTML;
      var originalHtml = html;
      
      for (var i = 0; i < STUBBORN_PATTERNS.length; i++) {
        var pattern = STUBBORN_PATTERNS[i][0];
        var replacement = STUBBORN_PATTERNS[i][1];
        pattern.lastIndex = 0;
        if (pattern.test(html)) {
          pattern.lastIndex = 0;
          html = html.replace(pattern, replacement);
        }
      }
      
      if (html !== originalHtml) {
        parent.innerHTML = html;
        parent.setAttribute('data-i18n-checked', '1');
        changed++;
      }
    }
    
    // Fix placeholder attributes
    var PH = {
      'Buscar empleado...': 'Search employee...',
      'Seleccionar cliente...': 'Select client...',
      'Buscar parte, servicio...': 'Search part, service...',
      'Garantía, condiciones, recomendaciones...': 'Warranty, conditions, recommendations...',
      'Dirección de la empresa': 'Company address',
      'Nombre completo del dueño': 'Owner full name',
      'Nombre, Teléfono, Email, Dirección': 'Name, Phone, Email, Address',
      'Ingresa tu API Key...': 'Enter your API Key...',
      'Ingresa tu Secret...': 'Enter your Secret...',
      'ID de tu empresa en el proveedor': 'Your company ID with the provider'
    };
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(function(el) {
      var ph = el.getAttribute('placeholder');
      if (PH[ph]) { el.setAttribute('placeholder', PH[ph]); changed++; }
    });
    
    // Fix select options
    var OPT = {
      'Todas': 'All', 'Ganado': 'Won', 'Nuevo': 'New', 'Nueva': 'New',
      'Pendiente': 'Pending', 'Completado': 'Completed', 'Cancelado': 'Cancelled',
      'Sin asignar': 'Unassigned', 'Disponible': 'Available', 'Ocupado': 'Busy',
      'Fuera de línea': 'Offline'
    };
    document.querySelectorAll('select option').forEach(function(opt) {
      var t = opt.textContent.trim();
      if (OPT[t]) { opt.textContent = OPT[t]; changed++; }
    });
    
    return changed;
  }

  // Run immediately
  fixStubborn();
  
  // Run every 500ms, stop after 30s of no changes
  var noChangeCount = 0;
  var stubbornInterval = setInterval(function() {
    // Clear processed markers so we can re-check
    document.querySelectorAll('[data-i18n-checked]').forEach(function(el){
      el.removeAttribute('data-i18n-checked');
    });
    var c = fixStubborn();
    if (c === 0) {
      noChangeCount++;
      if (noChangeCount > 60) clearInterval(stubbornInterval);
    } else {
      noChangeCount = 0;
    }
  }, 500);

  // Re-activate on sidebar clicks
  document.addEventListener('click', function(e) {
    var link = e.target.closest && e.target.closest('a, [onclick]');
    if (link) {
      noChangeCount = 0;
      if (!stubbornInterval) {
        stubbornInterval = setInterval(function() {
          document.querySelectorAll('[data-i18n-checked]').forEach(function(el){
            el.removeAttribute('data-i18n-checked');
          });
          var c = fixStubborn();
          if (c === 0) {
            noChangeCount++;
            if (noChangeCount > 60) { clearInterval(stubbornInterval); stubbornInterval = null; }
          } else { noChangeCount = 0; }
        }, 500);
      }
      setTimeout(fixStubborn, 200);
      setTimeout(fixStubborn, 800);
      setTimeout(fixStubborn, 2000);
    }
  }, true);

  console.log('🔧 i18n v8 STUBBORN FIXER active');
})();
