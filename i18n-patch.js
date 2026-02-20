/* ============================================================
   i18n-patch.js — Trade Master CRM Full Bilingual Patch v1
   Fixes missing translations + adds DOM-scanning engine
   Load AFTER script.js: <script src="i18n-patch.js"></script>
   ============================================================ */
(function(){
'use strict';

// ===== 1. FIX WRONG EN TRANSLATIONS =====
function fixI18nData(){
  if(typeof i18nData==='undefined') return;
  if(!i18nData.en) i18nData.en={};
  if(!i18nData.es) i18nData.es={};

  // These EN values were still in Spanish
  var fixes={
    nav_dashboard:'Dashboard',
    nav_leads:'Leads',
    nav_pipeline:'Sales Pipeline',
    nav_advisors:'Home Advisors',
    nav_marketing:'Marketing',
    mkt_title:'Marketing',
    pay_total:'Total ($)',
    pb_sku:'SKU / Part #',
    pb_markup:'Markup %'
  };
  for(var k in fixes) i18nData.en[k]=fixes[k];

  // ===== 2. ADD 37 MISSING KEYS =====
  var missing_es={
    nav_servicecalls:'Llamadas de Servicio',
    clock_select_tech:'Seleccionar Persona',
    clock_hourly_rate:'Tarifa por Hora',
    clock_in:'Marcar Entrada',
    clock_worked_today:'Trabajado Hoy',
    clock_earned_today:'Ganado Hoy',
    clock_projected_8h:'Proyección 8hrs',
    clock_history:'Historial de Hoy',
    money_f_month:'Este Mes',
    money_f_quarter:'Este Trimestre',
    money_f_year:'Este Año',
    pay_f_week:'Esta Semana',
    pay_f_biweek:'Quincenal',
    pay_f_month:'Mensual',
    pay_provider_title:'Proveedor de Nómina',
    pay_provider_desc:'Conecta tu proveedor de nómina para sincronizar horas, pagos y reportes automáticamente.',
    pay_manual:'Manual / Sin Proveedor',
    pay_manual_desc:'Administra nómina manualmente en Trade Master',
    pay_api_key:'API Key / Client ID',
    pay_api_secret:'API Secret',
    pay_company_id:'Company ID',
    pay_sync_freq:'Frecuencia de Sync',
    pay_sync_hours:'Sincronizar horas de Entrada/Salida',
    pay_sync_rates:'Sincronizar tarifas de técnicos',
    pay_connect:'Conectar',
    pay_test:'Probar Conexión',
    pay_sync_now:'Sincronizar Ahora',
    pay_disconnect:'Desconectar',
    pay_sync_history:'Historial de Sincronización',
    pb_suppliers:'Proveedores',
    pb_load_catalog:'Cargar Catálogo HVAC Completo',
    pb_supplier_desc:'Busca precios directamente en los distribuidores más usados en HVAC/R.',
    rpt_week:'Esta Semana',
    rpt_month:'Este Mes',
    rpt_quarter:'Este Trimestre',
    rpt_year:'Este Año',
    rpt_custom:'Personalizado'
  };
  var missing_en={
    nav_servicecalls:'Service Calls',
    clock_select_tech:'Select Person',
    clock_hourly_rate:'Hourly Rate',
    clock_in:'Clock In',
    clock_worked_today:'Worked Today',
    clock_earned_today:'Earned Today',
    clock_projected_8h:'8hr Projection',
    clock_history:'Today\'s History',
    money_f_month:'This Month',
    money_f_quarter:'This Quarter',
    money_f_year:'This Year',
    pay_f_week:'This Week',
    pay_f_biweek:'Biweekly',
    pay_f_month:'Monthly',
    pay_provider_title:'Payroll Provider',
    pay_provider_desc:'Connect your payroll provider to sync hours, payments and reports automatically.',
    pay_manual:'Manual / No Provider',
    pay_manual_desc:'Manage payroll manually in Trade Master',
    pay_api_key:'API Key / Client ID',
    pay_api_secret:'API Secret',
    pay_company_id:'Company ID',
    pay_sync_freq:'Sync Frequency',
    pay_sync_hours:'Sync Clock In/Out Hours',
    pay_sync_rates:'Sync Technician Rates',
    pay_connect:'Connect',
    pay_test:'Test Connection',
    pay_sync_now:'Sync Now',
    pay_disconnect:'Disconnect',
    pay_sync_history:'Sync History',
    pb_suppliers:'Suppliers',
    pb_load_catalog:'Load Full HVAC Catalog',
    pb_supplier_desc:'Search prices directly from the most used HVAC/R distributors.',
    rpt_week:'This Week',
    rpt_month:'This Month',
    rpt_quarter:'This Quarter',
    rpt_year:'This Year',
    rpt_custom:'Custom'
  };
  for(var k in missing_es){ if(!i18nData.es[k]) i18nData.es[k]=missing_es[k]; }
  for(var k in missing_en){ if(!i18nData.en[k]) i18nData.en[k]=missing_en[k]; }
}

// ===== 3. COMPREHENSIVE ES→EN TRANSLATION MAP =====
// Maps Spanish text → English text for DOM scanning
var T={
// --- Navigation & Actions ---
'Cancelar':'Cancel',
'Guardar':'Save',
'Cerrar Sesión':'Sign Out',
'Crear Nuevo':'Create New',
'Buscar':'Search',
'Exportar':'Export',
'Filtrar':'Filter',
'Editar':'Edit',
'Eliminar':'Delete',
'Seleccionar':'Select',
'Enviar':'Send',
'Subir':'Upload',
'Ver':'View',
'Imprimir':'Print',
'Descargar':'Download',
'Agregar':'Add',
'Pendiente':'Pending',
'Completada':'Completed',
'Asignada':'Assigned',
'Activos':'Active',
'Inactivo':'Inactive',
'Nuevo':'New',
'Todos':'All',
'Total':'Total',
'Notas':'Notes',
'Monto':'Amount',
'Fecha':'Date',
'Nombre':'Name',
'Estado':'Status',
'Tipo':'Type',
'Cliente':'Client',
'Dirección':'Address',
'Descripción':'Description',
'Teléfono':'Phone',
'Correo Electrónico':'Email',
'Contraseña':'Password',
'Confirmar Contraseña':'Confirm Password',
'Proveedor':'Supplier',
'Categoría':'Category',
'Duración':'Duration',
'Garantía':'Warranty',
'Servicio':'Service',
'Instalación':'Installation',
'Reparación':'Repair',
'Calefacción':'Heating',
'Refrigeración':'Refrigeration',
'Plomería':'Plumbing',
'Eléctrico':'Electrical',
'Vehículo':'Vehicle',
'Comisión':'Commission',
'Mañana':'Morning',
'Día':'Day',
'Reseñas':'Reviews',
'Campañas':'Campaigns',
'Empleados':'Employees',
'Despacho':'Dispatch',
'Cobranza':'Collections',
'Reportes':'Reports',
'Facturas':'Invoices',
'Recibos':'Receipts',
'Trabajos':'Jobs',
'Clientes':'Clients',
'Nómina':'Payroll',
'Técnico':'Technician',
'Técnicos':'Technicians',
'Configuración':'Settings',
'Comunicación':'Communication',

// --- Buttons with icons ---
'💾 Guardar':'💾 Save',
'💾 Guardar Plan':'💾 Save Plan',
'💾 Guardar Advisor':'💾 Save Advisor',
'💾 Guardar Cláusulas':'💾 Save Clauses',
'💾 Guardar Credenciales':'💾 Save Credentials',
'💾 Guardar Factura':'💾 Save Invoice',
'💾 Guardar Gasto':'💾 Save Expense',
'💾 Guardar Llamada':'💾 Save Call',
'💾 Guardar Nota':'💾 Save Note',
'💾 Guardar Permisos':'💾 Save Permissions',
'💾 Guardar Recibo':'💾 Save Receipt',
'💾 Guardar Reporte':'💾 Save Report',
'💾 Guardar Técnico':'💾 Save Technician',
'💾 Guardar Usuario':'💾 Save User',
'💾 Guardar Venta':'💾 Save Sale',
'💾 Guardar Configuración':'💾 Save Settings',
'💾 Crear Cita':'💾 Create Appointment',
'💾 Crear Instalación':'💾 Create Installation',
'📤 Subir':'📤 Upload',
'📤 Subir Foto':'📤 Upload Photo',
'📤 Enviar Solicitud':'📤 Send Request',
'📥 Exportar':'📥 Export',
'📥 Exportar CSV':'📥 Export CSV',
'📥 Importar Clientes':'📥 Import Clients',
'📷 Subir Foto':'📷 Upload Photo',
'🧪 Probar Conexión':'🧪 Test Connection',
'🔄 Sincronizar Ahora':'🔄 Sync Now',
'✕ Desconectar':'✕ Disconnect',
'✏️ Editar':'✏️ Edit',
'👁️ Ver':'👁️ View',
'🎲 Crear Datos Demo':'🎲 Create Demo Data',
'↩️ Logo Default':'↩️ Default Logo',
'⋮ Menú':'⋮ Menu',

// --- Add/New buttons ---
'+ Agregar Documento':'+ Add Document',
'+ Agregar Gasto':'+ Add Expense',
'+ Agregar Línea':'+ Add Line',
'+ Agregar Recibo':'+ Add Receipt',
'+ Agregar Seguimiento':'+ Add Follow-up',
'+ Agregar Técnico':'+ Add Technician',
'+ Agregar Usuario':'+ Add User',
'+ Estimado':'+ Estimate',
'+ Nueva Comunicación':'+ New Communication',
'+ Nueva Factura':'+ New Invoice',
'+ Nueva Instalación':'+ New Installation',
'+ Nueva Llamada':'+ New Call',
'+ Nuevo Advisor':'+ New Advisor',
'+ Nuevo Cliente':'+ New Client',
'+ Nuevo Lead':'+ New Lead',
'+ Nuevo Plan':'+ New Plan',
'+ Nuevo Reporte':'+ New Report',
'+ Nuevo Trabajo':'+ New Job',
'+ Subir Recibo':'+ Upload Receipt',
'+ Trabajo':'+ Job',
'👥 Nuevo Cliente':'👥 New Client',
'🔧 Nuevo Trabajo':'🔧 New Job',
'🎯 Nuevo Lead':'🎯 New Lead',
'💰 Nuevo Estimado':'💰 New Estimate',
'👤 Nuevo Home Advisor':'👤 New Home Advisor',
'👤 Nuevo Usuario':'👤 New User',
'👷 Nuevo Técnico':'👷 New Technician',
'➕ Nuevo Cliente':'➕ New Client',

// --- Selects / Dropdowns ---
'-- Seleccionar Trabajo --':'-- Select Job --',
'-- Seleccionar Técnico --':'-- Select Technician --',
'-- Seleccionar vendedor --':'-- Select Salesperson --',
'-- Seleccionar venta --':'-- Select Sale --',
'-- Asignar después --':'-- Assign Later --',
'-- Sin trabajo --':'-- No Job --',
'Seleccionar o crear...':'Select or create...',
'Seleccionar cliente...':'Select client...',
'Seleccionar trabajo...':'Select job...',
'Seleccionar...':'Select...',
'Seleccionar Advisor':'Select Advisor',
'Seleccionar Lead/Cliente':'Select Lead/Client',
'Seleccionar Persona':'Select Person',
'Seleccionar Trabajo':'Select Job',
'Seleccionar Técnico':'Select Technician',
'Asignar técnico...':'Assign technician...',
'✏️ Escribir nombre manualmente...':'✏️ Type name manually...',
'── Técnicos ──':'── Technicians ──',
'🆕 Nuevo':'🆕 New',

// --- Section headers ---
'🗺️ Mapa de Operaciones en Tiempo Real':'🗺️ Real-Time Operations Map',
'🗺️ Mapa de Despacho en Tiempo Real':'🗺️ Real-Time Dispatch Map',
'🗺️ Mapa de Llamadas de Servicio':'🗺️ Service Calls Map',
'🗺️ Ver Mapa General':'🗺️ View Full Map',
'🎯 Coordinador de Despacho':'🎯 Dispatch Coordinator',
'🎯 Ir a Despacho':'🎯 Go to Dispatch',
'🎯 Leads Asignados':'🎯 Assigned Leads',
'🎯 Leads Asignados a Vendedores':'🎯 Leads Assigned to Salespeople',
'🎯 Plataformas de Generación de Leads':'🎯 Lead Generation Platforms',
'📊 Reportes de Inspección y Auditoría':'📊 Inspection & Audit Reports',
'📊 Nuevo Reporte de Inspección':'📊 New Inspection Report',
'📊 Resumen del Cliente':'📊 Client Summary',
'📋 Citas del Día':'📋 Today\'s Appointments',
'📋 Cláusulas del Contrato / Invoice':'📋 Contract / Invoice Clauses',
'📋 Estimados Guardados':'📋 Saved Estimates',
'📋 Historial de Pagos':'📋 Payment History',
'📋 Trabajos Pendientes':'📋 Pending Jobs',
'📋 Órdenes Referidas':'📋 Referred Orders',
'📋 Órdenes Referidas por Técnicos':'📋 Orders Referred by Technicians',
'📜 Credenciales de Técnicos':'📜 Technician Credentials',
'📑 Permisos y Documentos del Trabajo / Job Permits':'📑 Job Permits & Documents',
'📝 Notas':'📝 Notes',
'📝 Notas Internas':'📝 Internal Notes',
'📝 Notas Adicionales':'📝 Additional Notes',
'📝 Registrar Comunicación':'📝 Record Communication',
'📞 Llamadas de Servicio':'📞 Service Calls',
'📞 Nueva Llamada de Servicio':'📞 New Service Call',
'📄 Facturas':'📄 Invoices',
'📄 Facturas de este cliente':'📄 This client\'s invoices',
'📄 Generar Estimado PDF':'📄 Generate Estimate PDF',
'📄 Nueva Factura':'📄 New Invoice',
'📄 Nuevo Documento':'📄 New Document',
'📄 Nuevo Recibo':'📄 New Receipt',
'📄 Otro Reporte':'📄 Other Report',
'📄 Ver Política de Facturación':'📄 View Billing Policy',
'💰 Cobranza':'💰 Collections',
'💰 Crear Estimado / Presentación':'💰 Create Estimate / Presentation',
'💰 Estimados':'💰 Estimates',
'💰 Estimados de este cliente':'💰 This client\'s estimates',
'💰 Nuevo Estimado':'💰 New Estimate',
'💰 Términos de Pago / Payment Terms':'💰 Payment Terms',
'💬 Comunicación':'💬 Communication',
'💬 Registro de Comunicación':'💬 Communication Log',
'💸 Nuevo Gasto del Negocio':'💸 New Business Expense',
'🔧 Trabajos':'🔧 Jobs',
'🔧 Trabajos Recientes':'🔧 Recent Jobs',
'🔧 Trabajos de este cliente':'🔧 This client\'s jobs',
'🔧 Nueva Instalación':'🔧 New Installation',
'🔧 Nuevo Trabajo':'🔧 New Job',
'🔧 Problema / Descripción':'🔧 Problem / Description',
'🔧 Tipo de Equipo':'🔧 Equipment Type',
'🔧 Técnico':'🔧 Technician',
'🔧 Garantía':'🔧 Warranty',
'👷 Técnicos':'👷 Technicians',
'👷 Gestión de Técnicos':'👷 Technician Management',
'👷 Asignadas':'👷 Assigned',
'👷 Técnicos Asignados':'👷 Assigned Technicians',
'👷 Técnicos:':'👷 Technicians:',
'👷 Asignar Técnico (opcional)':'👷 Assign Technician (optional)',
'👥 Clientes':'👥 Clients',
'👥 Cliente Existente':'👥 Existing Client',
'👥 Estado de Todo el Personal':'👥 All Staff Status',
'👤 Cliente':'👤 Client',
'👤 Nombre del Cliente':'👤 Client Name',
'👤 Nombre del Dueño / CEO':'👤 Owner / CEO Name',
'👑 Dueño / CEO':'👑 Owner / CEO',
'📬 Bandeja - Centro de Comunicación':'📬 Inbox - Communication Center',
'📱 Link de Tracking para Técnicos':'📱 Tracking Link for Technicians',
'📱 Presentar al Cliente':'📱 Present to Client',
'📱 Redes Sociales y Contenido':'📱 Social Media & Content',
'📱 Teléfono':'📱 Phone',
'📱 Llamada Saliente':'📱 Outgoing Call',
'📱 Llamadas Salientes':'📱 Outgoing Calls',
'📱 Llamada Entrante':'📱 Incoming Call',
'📲 Llamada Entrante':'📲 Incoming Call',
'📲 Llamadas Entrantes':'📲 Incoming Calls',
'📷 Foto del Recibo':'📷 Receipt Photo',
'📷 Fotos del Equipo (modelo, serial, data plate, condición)':'📷 Equipment Photos (model, serial, data plate, condition)',
'📸 Foto de Factura / Comprobante':'📸 Invoice / Receipt Photo',
'📸 Foto del Recibo':'📸 Receipt Photo',
'🚐 Documentos del Vehículo / Vehicle Documents':'🚐 Vehicle Documents',
'🚐 Vehículo Asignado':'🚐 Assigned Vehicle',
'🚐 Vehículo Asignado / Assigned Vehicle':'🚐 Assigned Vehicle',
'🛡️ Seguridad':'🛡️ Security',
'🛡️ Plan de Servicio':'🛡️ Service Plan',
'🛡️ Planes de Servicio / Plan de Servicios':'🛡️ Service Plans',
'🛡️ Garantía / Garantía':'🛡️ Warranty',
'🦺 Seguro & Bonding / Insurance & Bonding':'🦺 Insurance & Bonding',
'🧾 Recibos de Proveedores':'🧾 Supplier Receipts',
'🧾 Recibos del Vendedor y Conciliación':'🧾 Salesperson Receipts & Reconciliation',
'🧾 Recibos y Conciliación':'🧾 Receipts & Reconciliation',
'🧾 Subir Recibo del Vendedor':'🧾 Upload Salesperson Receipt',
'🧾 Exportar Recibos CSV':'🧾 Export Receipts CSV',
'🏢 Exportar Gastos CSV':'🏢 Export Expenses CSV',
'🏢 Gastos Fijos y Recurrentes del Negocio':'🏢 Fixed & Recurring Business Expenses',
'📤 Centro de Importación — Housecall Pro':'📤 Import Center — Housecall Pro',
'📗 Integración con QuickBooks':'📗 QuickBooks Integration',
'🔑 Recuperar Contraseña':'🔑 Recover Password',
'🔑 ¿Olvidaste tu contraseña?':'🔑 Forgot your password?',
'🔒 Política de Privacidad / Privacy Policy':'🔒 Privacy Policy',
'🛟 Soporte Técnico':'🛟 Technical Support',
'🧪 Datos de Demostración':'🧪 Demo Data',

// --- Status labels ---
'Completadas Hoy':'Completed Today',
'Asignadas':'Assigned',
'Nuevos':'New',
'Pendientes':'Pending',
'Cobrados':'Collected',
'Facturados':'Invoiced',
'Enviadas (sin pago)':'Sent (unpaid)',
'Recién Pagadas':'Recently Paid',
'Trabajo Nuevo':'New Job',
'Trabajo En Progreso':'Job In Progress',
'Leads Activos':'Active Leads',
'Llamadas activas':'Active Calls',
'Nuevos Clientes':'New Clients',
'Trabajos Ganados':'Won Jobs',
'Vendedores activos':'Active Salespeople',
'Técnicos en Campo':'Technicians in Field',
'Técnico Disponible':'Available Technician',
'Técnico Ocupado':'Busy Technician',
'Clientes Registrados':'Registered Clients',
'Clientes registrados':'Registered clients',
'Comisiones Pendientes':'Pending Commissions',
'Recibos sin Conciliar':'Unreconciled Receipts',
'Facturas pendientes':'Pending invoices',
'Pendiente...':'Pending...',

// --- Estimate steps ---
'1. Seleccionar Trabajo':'1. Select Job',
'2. Información del Equipo':'2. Equipment Information',
'3. Llamada de Servicio (Service Call)':'3. Service Call',
'5. Resumen del Estimado':'5. Estimate Summary',

// --- Form labels ---
'Nombre Completo':'Full Name',
'Nombre de la Empresa':'Company Name',
'Nombre de Usuario':'Username',
'Nombre del Cliente':'Client Name',
'Nombre del Plan':'Plan Name',
'Nombre, Teléfono, Email, Dirección':'Name, Phone, Email, Address',
'Descripción del Trabajo':'Job Description',
'Descripción / Items':'Description / Items',
'Asunto / Descripción':'Subject / Description',
'Tipo de Contacto':'Contact Type',
'Tipo de Equipo':'Equipment Type',
'Tipo de Propiedad':'Property Type',
'Tipo de Reporte':'Report Type',
'Tipo de Servicio':'Service Type',
'Lead/Cliente':'Lead/Client',
'Trabajo Relacionado':'Related Job',
'Trabajo/Venta Relacionada':'Related Job/Sale',
'Fecha de Pago':'Payment Date',
'Fecha de Vencimiento':'Due Date',
'Fecha de Venta':'Sale Date',
'Fecha del Recibo':'Receipt Date',
'Fecha de Inspección':'Inspection Date',
'Fecha Estimada de Fin':'Estimated End Date',
'Fecha Preferida':'Preferred Date',
'Fecha de Inicio':'Start Date',
'Inicio del Período':'Period Start',
'Fin del Período':'Period End',
'Monto ($)':'Amount ($)',
'Monto Cotizado ($)':'Quoted Amount ($)',
'Monto Total de Venta ($)':'Total Sale Amount ($)',
'Monto personalizado':'Custom amount',
'Método de Pago':'Payment Method',
'Calificación / Score':'Rating / Score',
'Inspector / Técnico':'Inspector / Technician',
'Dirección de la Propiedad':'Property Address',
'Notas / Hallazgos':'Notes / Findings',
'Notas / Responsabilidades':'Notes / Responsibilities',
'Notas Internas (no se muestran al cliente)':'Internal Notes (not shown to client)',
'Notas para el Advisor':'Notes for Advisor',
'Notas para el Cliente':'Notes for Client',
'Notas para el cliente':'Notes for client',
'Próximo Seguimiento':'Next Follow-up',
'Edición Aprox (años)':'Approx Age (years)',
'Edad Aprox (años)':'Approx Age (years)',
'Editar Vehículo:':'Edit Vehicle:',
'# de Póliza / Cuenta':'Policy / Account #',
'# de Recibo':'Receipt #',
'# de Recibo / Invoice':'Receipt / Invoice #',
'% COMISIÓN':'% COMMISSION',
'Factura / Invoice':'Invoice',
'Líneas de Factura':'Invoice Lines',
'Tarjeta de Crédito':'Credit Card',
'Tarjeta de Débito':'Debit Card',
'ACH / Débito Automático':'ACH / Auto Debit',
'Pago Parcial':'Partial Payment',
'Creación desde Trabajo (opcional)':'Create from Job (optional)',
'Crear desde Trabajo (opcional)':'Create from Job (optional)',
'CATEGORÍAS':'CATEGORIES',
'COMISIÓN':'COMMISSION',
'Tasa de Conversión':'Conversion Rate',
'TASA DE CONVERSIÓN':'CONVERSION RATE',
'INGRESOS GANADOS':'REVENUE WON',
'TRABAJOS COMPLETADOS':'JOBS COMPLETED',
'NUEVOS TRABAJOS':'NEW JOBS',
'RESERVADOS EN LÍNEA':'BOOKED ONLINE',
'PENDIENTES':'PENDING',
'TOTAL ARTÍCULOS':'TOTAL ITEMS',
'VENTAS TOTALES':'TOTAL SALES',
'VALOR TOTAL':'TOTAL VALUE',
'RECIBOS SUBIDOS':'RECEIPTS UPLOADED',
'DÍAS PARA CERRAR':'DAYS TO CLOSE',
'Retorno de Inversión':'Return on Investment',
'Categoría de Importación':'Import Category',
'Contraseña para entrar al CRM':'Password to access the CRM',
'Cuota del Proveedor':'Supplier Account',
'Cuento del Proveedor':'Supplier Account',

// --- Expenses categories ---
'Gastos Fijos':'Fixed Expenses',
'Gastos Variables':'Variable Expenses',
'Gastos del Negocio':'Business Expenses',
'Gasto Fijo':'Fixed Expense',
'Gasto Variable':'Variable Expense',
'Total Gastado':'Total Spent',
'Total Gastos':'Total Expenses',
'Total Recibos':'Total Receipts',
'Total nómina':'Total payroll',
'Rastreo de gastos':'Expense tracking',
'Proveedor / A quién se paga':'Supplier / Who is paid',
'Oficina / Papelería':'Office / Stationery',
'Almacén / Bodega':'Warehouse / Storage',
'Material Eléctrico':'Electrical Material',
'CRM / Software de Gestión':'CRM / Management Software',
'Internet / Teléfono':'Internet / Phone',
'Servicio de Contestación':'Answering Service',
'Servicios / Utilities':'Utilities',
'Seguro Médico':'Health Insurance',
'Seguro de Vehículos':'Vehicle Insurance',
'Seguro Comercial del Vehículo':'Commercial Vehicle Insurance',
'Pago de Préstamo':'Loan Payment',
'Pago de Vehículo / Lease':'Vehicle Payment / Lease',
'Mantenimiento de Vehículo':'Vehicle Maintenance',
'Licencia / Certificación':'License / Certification',
'Misceláneo':'Miscellaneous',
'Misceláneos':'Miscellaneous',

// --- Dashboard ---
'Estado de Empleados':'Employee Status',
'Flujo de Estimados':'Estimates Pipeline',
'Ingresos por Período':'Revenue by Period',
'Por Técnico':'By Technician',
'Por Día de la Semana':'By Day of Week',
'Top Servicios':'Top Services',
'Visitas por Año':'Visits per Year',
'No hay citas próximas':'No upcoming appointments',
'Próximas Citas':'Upcoming Appointments',

// --- Payroll ---
'Nueva Entrada de Nómina':'New Payroll Entry',
'Agregar Entrada':'Add Entry',
'Nómina / Payroll':'Payroll',
'Nómina + pagos con Square':'Payroll + payments with Square',
'Nómina completa, impuestos, beneficios':'Full payroll, taxes, benefits',
'Nómina para pequeñas empresas':'Payroll for small businesses',
'Nómina y HR para empresas medianas':'Payroll & HR for mid-size companies',
'Nómina y impuestos':'Payroll & taxes',
'Para contratistas independientes':'For independent contractors',
'QuickBooks Nómina':'QuickBooks Payroll',
'Square Nómina':'Square Payroll',
'Manual / Sin Proveedor':'Manual / No Provider',
'Configurar Proveedor':'Configure Provider',
'Sincronizar tarifas de técnicos':'Sync technician rates',
'Historial de Sincronización':'Sync History',
'Conectar':'Connect',
'Frecuencia de Sync':'Sync Frequency',
'Proyección 8hrs':'8hr Projection',

// --- Settings ---
'Configuración de la Empresa':'Company Settings',
'Incluir documentos en estimados y facturas':'Include documents in estimates and invoices',
'Haz clic para subir logo':'Click to upload logo',
'Personaliza los términos legales que aparecen en tus facturas e invoices. Edita según las leyes de tu estado.':'Customize the legal terms that appear on your invoices. Edit according to your state laws.',
'📝 Cláusula Adicional (Opcional)':'📝 Additional Clause (Optional)',

// --- Permissions/Roles descriptions ---
'Acceso total. Mi Dinero, cuenta bancaria, configuración, usuarios.':'Full access. My Money, bank account, settings, users.',
'Despacho, trabajos, técnicos, clientes, correo, agenda.':'Dispatch, jobs, technicians, clients, mail, schedule.',
'Nómina, gastos, recibos, facturas, QuickBooks, reportes.':'Payroll, expenses, receipts, invoices, QuickBooks, reports.',
'Solo sus trabajos asignados, reloj de entrada/salida.':'Only their assigned jobs, clock in/out.',
'Puede ver tablero y reportes pero no puede editar ni crear nada.':'Can view dashboard and reports but cannot edit or create anything.',
'No ve finanzas ni nómina.':'Cannot see finances or payroll.',
'Administra quién puede acceder al CRM y qué secciones puede ver. Solo el':'Manage who can access the CRM and which sections they can see. Only the',

// --- Marketing ---
'Solicitar Reseñas':'Request Reviews',
'Crear Campaña':'Create Campaign',
'Nueva Campaña':'New Campaign',
'Perfil de negocio, reseñas, fotos':'Business profile, reviews, photos',
'Publica contenido, interactúa con clientes':'Post content, interact with clients',
'Noticias, actualizaciones rápidas':'News, quick updates',
'Fotos y reels de trabajos completados':'Photos and reels of completed jobs',
'Fotos de proyectos, antes/después':'Project photos, before/after',
'Reseñas, fotos, responde a clientes':'Reviews, photos, respond to clients',
'Campañas de búsqueda y display':'Search and display campaigns',
'Analítica web y tráfico':'Web analytics and traffic',
'Email marketing y automatización':'Email marketing and automation',
'Diseña flyers, posts, tarjetas':'Design flyers, posts, cards',
'Leads de servicios del hogar':'Home services leads',
'Leads de servicios locales':'Local services leads',
'Leads de servicios profesionales':'Professional services leads',
'Plataforma de gestión de servicios':'Service management platform',
'Administra campañas y anuncios pagados':'Manage campaigns and paid ads',
'Comunicación directa con clientes':'Direct communication with clients',
'Acreditación y confianza':'Accreditation and trust',
'Accede directamente a tus plataformas para administrar campañas, responder leads y monitorear resultados.':'Access your platforms directly to manage campaigns, respond to leads and monitor results.',
'Envía solicitudes de reseñas a tus clientes satisfechos para mejorar tu presencia en línea.':'Send review requests to your satisfied clients to improve your online presence.',
'Busca precios directamente en los distribuidores más usados en HVAC/R. Haz clic para abrir su sitio.':'Search prices directly from the most used HVAC/R distributors. Click to open their site.',

// --- Dispatch ---
'Comparte este link con tus técnicos para que reporten su ubicación en tiempo real desde su celular:':'Share this link with your technicians so they can report their location in real time from their phone:',
'Asigna un responsable de despacho':'Assign a dispatch coordinator',
'Asignar Técnico':'Assign Technician',

// --- Service Calls ---
'Llamadas de Servicio':'Service Calls',
'⚡ Urgencia':'⚡ Urgency',
'⚡ Lo antes posible':'⚡ ASAP',
'⚡ Requiere Acción (aparecerá en pendientes)':'⚡ Requires Action (will appear in pending)',
'🌅 Mañana (8am-12pm)':'🌅 Morning (8am-12pm)',
'Mañana 6am-2pm':'Morning 6am-2pm',
'🟡 Prioritario':'🟡 Priority',
'📞 Llamada':'📞 Call',

// --- Estimates ---
'Equipo Nuevo':'New Equipment',
'No hay estimados guardados':'No saved estimates',
'Agregar Artículo':'Add Item',
'Nuevo Artículo':'New Item',
'Cargar Catálogo HVAC Completo':'Load Full HVAC Catalog',
'¿Cliente aprueba el trabajo?':'Does client approve the job?',
'✅ SÍ — Hacer reparación':'✅ YES — Proceed with repair',
'❌ NO — Solo cobrar service call':'❌ NO — Only charge service call',
'🔄 Quiere equipo nuevo (referir)':'🔄 Wants new equipment (refer)',
'📩 Enviar Referencia al Advisor':'📩 Send Referral to Advisor',
'📱 Presentar al Cliente':'📱 Present to Client',

// --- Clients ---
'Clientes >':'Clients >',
'Clientes:':'Clients:',

// --- Inspection reports ---
'🔋 Energy Audit / Auditoría Energética':'🔋 Energy Audit',
'🔋 Energía':'🔋 Energy',
'🏡 Home Inspection Completa':'🏡 Complete Home Inspection',
'📄 Otro Reporte':'📄 Other Report',
'ℹ️ Informativo (sin calificación)':'ℹ️ Informational (no rating)',
'⏳ Pendiente de Resultados':'⏳ Pending Results',
'Inspección Aprobada':'Inspection Approved',
'⏳ Pendientes':'⏳ Pending',
'✅ Completadas':'✅ Completed',
'📊 Todos':'📊 All',

// --- Permits ---
'Permiso Eléctrico':'Electrical Permit',
'Permiso Mecánico':'Mechanical Permit',
'Permiso de Construcción':'Building Permit',
'Permiso de Plomería':'Plumbing Permit',
'Aprobación del Municipio':'City Approval',
'Cálculo de Carga':'Load Calculation',

// --- Technician section ---
'📧 El técnico usará su':'📧 The technician will use their',
'📱 ¿Eres técnico o vendedor?':'📱 Are you a technician or salesperson?',
'📱 Crear acceso al CRM (para que entre desde su celular)':'📱 Create CRM access (so they can enter from their phone)',
'Registración del Vehículo':'Vehicle Registration',

// --- Home Advisors ---
'Estos leads serán rotados automáticamente al siguiente vendedor disponible.':'These leads will be automatically rotated to the next available salesperson.',
'Trabajos referidos por técnicos para reemplazo de equipo. Estos son leads pre-calificados listos para cerrar.':'Jobs referred by technicians for equipment replacement. These are pre-qualified leads ready to close.',
'🏆 Cliente Ganado (Won)':'🏆 Won Client',
'🏆 Clientes Ganados':'🏆 Won Clients',
'📝 Cotización Enviada':'📝 Quote Sent',
'📝 En Estimado':'📝 In Estimate',
'Todos los Advisors':'All Advisors',
'Todos los Status':'All Statuses',
'>15 días sin cerrar':'>15 days without closing',
'&gt;15 días sin cerrar':'&gt;15 days without closing',
'⚠️ Leads por Vencer (15+ días sin cerrar)':'⚠️ Expiring Leads (15+ days without closing)',

// --- Collection ---
'Por Cobrar':'Accounts Receivable',
'🔴 Facturas Vencidas':'🔴 Overdue Invoices',

// --- Import ---
'Arrastra tu archivo CSV aquí':'Drag your CSV file here',
'o haz clic para seleccionar':'or click to select',
'Sube el archivo aquí abajo 👇':'Upload the file below 👇',
'📋 Cómo exportar de Housecall Pro:':'📋 How to export from Housecall Pro:',
'(uno por línea)':'(one per line)',
'Haz clic o arrastra la foto del recibo aquí':'Click or drag the receipt photo here',
'Haz clic para subir el reporte PDF, foto o scan':'Click to upload the report PDF, photo or scan',
'Haz clic para subir foto':'Click to upload photo',
'Haz clic para subir foto, PDF o scan del documento':'Click to upload photo, PDF or document scan',

// --- Vehicle Documents ---
'Partes AC/Calefacción, refrigerantes':'AC/Heating parts, refrigerants',
'Partes de Calefacción':'Heating Parts',
'Tubería, conexiones, equipos':'Piping, fittings, equipment',
'Equipos Refrigeración':'Refrigeration Equipment',
'Equipos de Calefacción':'Heating Equipment',
'Equipos de Refrigeración':'Refrigeration Equipment',

// --- Auth ---
'Crear Cuenta Empresarial':'Create Business Account',
'Iniciar Sesión':'Sign In',
'Iniciar sesión en tu cuenta':'Sign in to your account',
'Inicia sesión':'Sign in',
'Olvidé mi Contraseña':'Forgot my Password',
'¿No tienes cuenta?':'Don\'t have an account?',
'¿Ya tienes cuenta?':'Already have an account?',
'Regístrate aquí':'Register here',
'Tu Nombre':'Your Name',
'Al registrarte aceptas recibir tu guía de onboarding y comunicaciones de soporte.':'By registering you accept receiving your onboarding guide and support communications.',
'Acepto Términos, Privacidad, Facturación y NDA.':'I accept Terms, Privacy, Billing and NDA.',
'Acepto los Términos, Privacidad, Facturación y Acuerdo de Confidencialidad (NDA).':'I accept the Terms, Privacy, Billing and Non-Disclosure Agreement (NDA).',
'📧 Usaremos este email para enviarte tu guía y soporte':'📧 We will use this email to send you your guide and support',
'Instala Trade Master en tu celular para acceso rápido:':'Install Trade Master on your phone for quick access:',
'Agregar a Inicio':'Add to Home Screen',
'¿Necesitas ayuda? Estamos aquí para ti.':'Need help? We are here for you.',
'Gestión completa de clientes y trabajos':'Complete client and job management',
'Despacho de técnicos con GPS':'Technician dispatch with GPS',
'Facturación y cobranza integrada':'Integrated invoicing and collections',
'Crea técnicos, clientes, leads y citas de ejemplo para probar el sistema.':'Create sample technicians, clients, leads and appointments to test the system.',
'Las sesiones activas aparecerán aquí cuando los usuarios inicien sesión.':'Active sessions will appear here when users sign in.',
'Registra llamadas, visitas, notas y cotizaciones enviadas a cada lead.':'Record calls, visits, notes and quotes sent to each lead.',
'Registro centralizado de todas las comunicaciones con clientes. Llamadas, textos, emails, visitas y follow-ups.':'Centralized log of all client communications. Calls, texts, emails, visits and follow-ups.',
'Membresías de mantenimiento recurrente. Genera ingresos estables y fideliza clientes.':'Recurring maintenance memberships. Generate stable income and build client loyalty.',
'Sube HERS Ratings, Home Inspections, Energy Audits y otros reportes de inspección. Se vinculan al trabajo y al cliente.':'Upload HERS Ratings, Home Inspections, Energy Audits and other inspection reports. They link to the job and client.',
'Sube los permisos, inspecciones, fotos y documentos de cada trabajo. Todo queda archivado con el expediente del trabajo.':'Upload permits, inspections, photos and documents for each job. Everything is filed with the job record.',
'Sube una foto del coordinador de despacho. Se mostrará en el panel principal.':'Upload a photo of the dispatch coordinator. It will be shown on the main panel.',
'Crear Plan de Servicio':'Create Service Plan',
'Límite de clientes':'Client limit',
'Crear Trabajo':'Create Job',
'Guardar Lead':'Save Lead',
'Guardar Configuración':'Save Settings',
'Ver en despacho':'View in dispatch',
'Ver llamadas de servicio':'View service calls',
'Ver política de facturación':'View billing policy',
'Ver todos los reportes':'View all reports',
'Ver trabajos ganados':'View won jobs',
'Ingresos':'Revenue',
'Gastos':'Expenses',
'Ganancia Neta':'Net Profit',
'Todas las Categorías':'All Categories',
'Todas las categorías':'All categories',
'Todo el Año':'All Year',
'Todos los Proveedores':'All Suppliers',
'Este Año':'This Year',
'Este Período':'This Period',
'Mes hasta la fecha':'Month to date',
'Año hasta la fecha':'Year to date',
'Últimos 30 días':'Last 30 days',
'Últimos 90 días':'Last 90 days',
'⏱️ Historial Reciente':'⏱️ Recent History',
'📅 Próximas Citas':'📅 Upcoming Appointments',
'📅 Fecha Preferida':'📅 Preferred Date',
'📅 Fecha Estimada de Fin':'📅 Estimated End Date',
'📅 Fecha de Inicio':'📅 Start Date',
'Reparación AC':'AC Repair',
'Instalación AC':'AC Installation',
'🏗️ Construcción Nueva':'🏗️ New Construction',
'🏠 Tipo de Propiedad':'🏠 Property Type',
'🏭 Industrial':'🏭 Industrial',
'📍 Dirección de Instalación':'📍 Installation Address',
'📍 Dirección del Servicio':'📍 Service Address',
'📍 Tu ubicación se envía cada 30 segundos mientras estés en servicio':'📍 Your location is sent every 30 seconds while on service',
'📍 Ubicación':'📍 Location',
'📎 Subir Reporte (PDF, foto, scan)':'📎 Upload Report (PDF, photo, scan)',
'🔴 Al terminar tu jornada, haz Marcar Salida para dejar de compartir ubicación':'🔴 When your shift ends, Clock Out to stop sharing your location',
'⚠️ Derecho de Cancelación / Right to Cancel':'⚠️ Right to Cancel',
'🔄 Cancelación & Restocking Fee':'🔄 Cancellation & Restocking Fee',
'🔄 Restaurar Defaults del Estado':'🔄 Restore State Defaults',
'Dueño/CEO':'Owner/CEO',
'— Factura manual —':'— Manual Invoice —',
'Guardar Llamada':'Save Call',
'Crear Cita':'Create Appointment',
'Conectar reseñas':'Connect reviews',
'Preguntar algo':'Ask something',
'Hola, ¿en qué nos enfocamos hoy?':'Hi, what should we dive into today?',
'Última Ubicación':'Last Location',
'⭐ Importante':'⭐ Important',
'⭐ VIP':'⭐ VIP',
'✅ Activo':'✅ Active',
'⛔ Inactivo':'⛔ Inactive',
'Seleccionar Persona':'Select Person',
'Tarifa por Hora':'Hourly Rate',
'Marcar Entrada':'Clock In',
'Trabajado Hoy':'Worked Today',
'Ganado Hoy':'Earned Today',
'— El cliente podrá ver/descargar Workers\' Comp, GL, Bond, License, etc. directamente desde el estimado.':'— The client can view/download Workers\' Comp, GL, Bond, License, etc. directly from the estimate.',
'PDF, JPG, PNG, DOC (máx 5MB)':'PDF, JPG, PNG, DOC (max 5MB)',
'Fotos Después':'After Photos',
'Tí\u0074ulo':'Title',
'Título':'Title',
'Título / Servicio':'Title / Service',
'Ve los trabajos y estimados del día':'View today\'s jobs and estimates',
'Agregar estimado':'Add estimate',
'Agregar trabajo':'Add job',
'Agregar materiales':'Add materials',
'Crear Rápido':'Quick Create',
'Nuevo Cliente':'New Client',
'Nuevo Trabajo':'New Job',
'Nuevo Lead':'New Lead',
'Nuevo Estimado':'New Estimate',
'Nuevo Gasto':'New Expense',
'Leads Registrados':'Registered Leads',
'Crear Cuenta Empresarial':'Create Business Account',
'contraseña':'password',
'pendiente':'pending',
'o filtra por tipo':'or filter by type',
'¡Has alcanzado tu límite!':'You have reached your limit!',
'¡Límite de Clientes Alcanzado!':'Client Limit Reached!',
'×':'×',
'Guardar Lead':'Save Lead',
'Nuevo Reporte':'New Report',
'📧 Enviar Solicitud':'📧 Send Request',
'Crear Campaña':'Create Campaign',
'Conectar':'Connect',
'Desconectar':'Disconnect',
'Proveedores':'Suppliers',
'🇺🇸 Estado / State':'🇺🇸 State',
'Equipos de Refrigeración':'Refrigeration Equipment',
'Equipos de Calefacción':'Heating Equipment',
'Equipos Refrigeración':'Refrigeration Equipment',

// --- Dynamic/script.js generated texts ---
'🎯 Centro de Mando':'🎯 Command Center',
'Operaciones en tiempo real - Haz clic en cada tarjeta para ver detalles y ubicaciones':'Real-time operations - Click each card to see details and locations',
'🔄 Actualizar':'🔄 Refresh',
'Por agendar':'To schedule',
'Ver vendedores':'View salespeople',
'Disponibles':'Available',
'Disponible':'Available',
'Fuera de línea':'Offline',
'Vendedor':'Salesperson',
'🏠 Vendedor (Home Advisor)':'🏠 Salesperson (Home Advisor)',
'Disponible • ❓ Sin ubicación':'Available • ❓ No location',
'Ocupado • ❓ Sin ubicación':'Busy • ❓ No location',
'Vendedor • ❓ Sin ubicación':'Salesperson • ❓ No location',
'No hay instalaciones en progreso. Usa el botón \"+ Nueva Instalación\" para agregar una.':'No installations in progress. Use the \"+ New Installation\" button to add one.',
'Tasa de Conversión:':'Conversion Rate:',
'No hay facturas en esta categoría.':'No invoices in this category.',
'No hay referencias todavía':'No referrals yet',
'Sin artículos':'No items',
'Sin campañas':'No campaigns',
'Sin historial de sincronización':'No sync history',
'Método':'Method',
'Factura':'Invoice',
'Coordinador de Despacho':'Dispatch Coordinator',
'🎯 Coordinador de Despacho':'🎯 Dispatch Coordinator',
'Seleccionar Advisor...':'Select Advisor...',
'Seleccionar Archivo':'Select File',
'👤 Lead Propio del Vendedor':'👤 Salesperson\'s Own Lead',
'🎯 Asignar Lead a Vendedor':'🎯 Assign Lead to Salesperson',
'📷 Actualizar Foto':'📷 Update Photo',
'Cuenta del Proveedor':'Supplier Account',
'Configurar ADP Workforce':'Configure ADP Workforce',
'Última Ubicación':'Last Location',
'Fórmula:':'Formula:',
'— Factura manual —':'— Manual Invoice —',
'✏️ Otro proveedor...':'✏️ Other supplier...',
'Vehículo / Vehicle':'Vehicle',
'Vehículo / Mantenimiento':'Vehicle / Maintenance',
'Agrega al Dueño/CEO primero, luego la persona de contabilidad y el coordinador de despacho.':'Add the Owner/CEO first, then the accounting person and dispatch coordinator.',
'* Aplica igual para leads de la empresa y leads propios del vendedor':'* Applies equally to company leads and salesperson\'s own leads',
'Reparación AC':'AC Repair',
'Instalación AC':'AC Installation',
'Fotos Después':'After Photos',
'No hay citas próximas':'No upcoming appointments',
'Recién Pagadas':'Recently Paid',
'Seleccionar trabajo...':'Select job...',
'Seleccionar...':'Select...',
'── Técnicos ──':'── Technicians ──',

// --- Installation pipeline ---
'🔧 Instalaciones en Progreso':'🔧 Installations in Progress',
'🚀 INICIADO':'🚀 STARTED',
'🔧 EN PROGRESO':'🔧 IN PROGRESS',
'✅ TERMINADO':'✅ COMPLETED',
'📋 DOCUMENTADO':'📋 DOCUMENTED',
'🏁 FINALIZADO':'🏁 FINISHED',
'🚐 En Progreso':'🚐 In Progress',
'En Progreso':'In Progress',

// --- Dashboard dynamic labels ---
'COBRADO':'COLLECTED',
'TICKET PROMEDIO':'AVG TICKET',
'Cobrado':'Collected',
'Salespersones:':'Salespeople:',
'Técnicos:':'Technicians:',
'👷 Técnicos:':'👷 Technicians:',

// --- Month abbreviations ---
'Ene':'Jan',
'Abr':'Apr',
'Ago':'Aug',
'Dic':'Dec',

// --- Collections ---
'Total por Cobrar':'Total to Collect',
'Referencia':'Reference',
'REFERENCIA':'REFERENCE',
'💳 Tarjeta':'💳 Card',
'Todas con Balance':'All with Balance',
'VENCIDAS':'OVERDUE',
'0 VENCIDAS':'0 OVERDUE',
'PAGOS RECIBIDOS':'PAYMENTS RECEIVED',
'TOTAL POR COBRAR':'TOTAL TO COLLECT',
'COLLECTED ESTE MES':'COLLECTED THIS MONTH',

// --- Cash Flow ---
'💰 Flujo de Efectivo':'💰 Cash Flow',
'Flujo de Efectivo':'Cash Flow',
'Efectivo':'Cash',

// --- Expenses / Settings ---
'Licencia de Contratista':'Contractor License',
'Licencia de Negocio':'Business License',
'📜 Licencia de Contratista (C-10, C-20, etc.)':'📜 Contractor License (C-10, C-20, etc.)',
'🏛️ Licencia del Contratista / Contractor License Board':'🏛️ Contractor License Board',
'Correo del Negocio':'Business Email',
'Sin historial de sincronización':'No sync history',
'Sin campañas':'No campaigns',
'Sin artículos':'No items',

// --- Dispatch table ---
'Técnico':'Technician',
'Trabajo':'Job',

// --- Mailbox ---
'📥 Correo Entrante':'📥 Incoming Mail',
'📤 Correo Saliente':'📤 Outgoing Mail',
'Correo del Negocio':'Business Email',

// --- Licenses ---
'Licencia de Manejar':'Driver License',

// --- Remaining ---
'— Factura manual —':'— Manual Invoice —',
'Total por Cobrar':'Total to Collect',
'TOTAL POR COBRAR':'TOTAL TO COLLECT',
'Referencia':'Reference',
'REFERENCIA':'REFERENCE',
'Seleccionar...':'Select...',
'Usuarios y Equipo':'Users & Team',
'Recursos Humanos':'Human Resources',
'Ticket Promedio':'Avg Ticket',
'TICKET PROMEDIO':'AVG TICKET',
'trabajos activos':'active jobs',
'0 trabajos activos':'0 active jobs',
'Mensuales':'Monthly',
'Este mes':'This month',
'ESTE MES':'THIS MONTH',
'COLLECTED ESTE MES':'COLLECTED THIS MONTH',
'Cobrado 2026':'Collected 2026',
'No hay gastos registrados. Agrega tu renta, seguros y otros gastos fijos.':'No expenses registered. Add your rent, insurance and other fixed expenses.',
'Tu contador puede acceder directamente a QuickBooks con su propia cuenta.':'Your accountant can access QuickBooks directly with their own account.',
'Ir a QuickBooks':'Go to QuickBooks',
'Dueño/CEO':'Owner/CEO',
'Contabilidad':'Accounting',
'en estimados y facturas para cumplir con requisitos de empresas y clientes comerciales.':'in estimates and invoices to meet business and commercial client requirements.',
'Técnico':'Technician',
'Trabajo':'Job',
'Correo del Negocio':'Business Email',
'Licencia de Manejar':'Driver License',
'Todas':'All',
'📋 Todas':'📋 All',
'Acciones':'Actions',
'ACCIONES':'ACTIONS',
'📞 Llamar':'📞 Call',
'💬 Texto':'💬 Text',
'💬 Texto/SMS':'💬 Text/SMS',
'Ganado':'Won',
'Mapa de Leads':'Leads Map',
'Sin asignar':'Unassigned',
'Sin reportar':'Not reported',
'Nuevas':'New',
'🔴 Activas (sin completar)':'🔴 Active (not completed)',
'🆕 Nuevas (sin asignar)':'🆕 New (unassigned)',
'✅ Completar':'✅ Complete',
'Sin comunicaciones. Registra tu primera interacción con un cliente.':'No communications. Record your first interaction with a client.',
'📭 Sin comunicaciones. Registra tu primera interacción con un cliente.':'📭 No communications. Record your first interaction with a client.',
'Seleccionar cliente...':'Select client...',
'Licencia de Contratista':'Contractor License',
'Licencia de Manejar':'Driver License',
'Editar Vehículo:':'Edit Vehicle:',
'Registración del Vehículo':'Vehicle Registration',
'Seguro Comercial del Vehículo':'Commercial Vehicle Insurance',
'trabajos activos':'active jobs',
'0 trabajos activos':'0 active jobs',
'Fuera de línea':'Offline',
'Nombre, Teléfono, Email, Dirección':'Name, Phone, Email, Address',
'(uno por línea)':'(one per line)',
'Llamada':'Call',
'Mensaje de Texto':'Text Message',
'Visita':'Visit',
'Seguimiento':'Follow-up',
// --- Schedule ---
'📅 Calendario de Citas':'📅 Appointment Calendar',
'Calendario de Citas':'Appointment Calendar',
'Mes':'Month',
'Semana':'Week',
'Hoy':'Today',
'+ Nueva Cita':'+ New Appointment',
'Febrero 2026':'February 2026',
'Enero':'January','Febrero':'February','Marzo':'March','Abril':'April','Mayo':'May','Junio':'June',
'Julio':'July','Agosto':'August','Septiembre':'September','Octubre':'October','Noviembre':'November','Diciembre':'December',
'DOM':'SUN','LUN':'MON','MAR':'TUE','MIÉ':'WED','JUE':'THU','VIE':'FRI','SÁB':'SAT',
'No hay citas este día.':'No appointments this day.',
'+ Crear cita':'+ Create appointment',
'jueves, 19 de febrero':'Thursday, February 19',

// --- Leads ---
'📞 Llamar':'📞 Call',
'💬 Texto':'💬 Text',
'Mapa de Leads':'Leads Map',
'ACCIONES':'ACTIONS',
'Texto enviado':'Text sent',

// --- Service Calls ---
'Nuevas':'New',
'En Camino':'On the Way',
'Completadas Hoy':'Completed Today',
'Esperando':'Waiting',
'En ruta':'En route',
'Finalizadas':'Finished',
'PROBLEMA:':'PROBLEM:',
'Nueva':'New',
'Asignada':'Assigned',
'En Camino':'On the Way',
'Completada':'Completed',
'🔴 Activas (sin completar)':'🔴 Active (not completed)',
'🆕 Nuevas (sin asignar)':'🆕 New (unassigned)',

// --- Jobs ---
'0-10 millas':'0-10 miles',
'10-20 millas':'10-20 miles',
'20+ millas':'20+ miles',
'HORAS DE LABOR':'LABOR HOURS',
'4. Componentes y Reparaciones':'4. Components & Repairs',
'Componentes y Reparaciones':'Components & Repairs',
'DESCUENTO (%)':'DISCOUNT (%)',

// --- Home Advisors ---
'Por pagar':'To pay',
'En seguimiento':'In follow-up',
'Equipo de Ventas':'Sales Team',
'👥 Equipo de Ventas':'👥 Sales Team',
'Ventas y Comisiones':'Sales & Commissions',
'💵 Ventas y Comisiones':'💵 Sales & Commissions',
'Estructura de Comisiones (Basada en Ganancia)':'Commission Structure (Profit Based)',
'📊 Estructura de Comisiones (Basada en Ganancia)':'📊 Commission Structure (Profit Based)',
'Ganancia':'Profit',
'ESPECIALIDAD':'SPECIALTY',
'ZONA':'ZONE',
'Residencial':'Residential',
'Activo':'Active',
'📞 Registro de Seguimientos (Follow-Ups)':'📞 Follow-Up Log',
'Registro de Seguimientos (Follow-Ups)':'Follow-Up Log',
'No hay seguimientos registrados.':'No follow-ups recorded.',

// --- Invoices ---
'VENCIDO':'OVERDUE',
'TOTAL FACTURAS':'TOTAL INVOICES',
'VENCE':'DUE',
'Borrador':'Draft',
'Pagada':'Paid',
'Pago':'Payment',
// === SETTINGS ===
'LOGO DE LA EMPRESA':'COMPANY LOGO',
'Cambiar Logo':'Change Logo',
'Dirección de la empresa':'Company address',
'Nombre completo del dueño':'Owner full name',
// === HR ===
'Gestión de empleados y cumplimiento legal - California':'Employee management and legal compliance - California',
'Nuevo Empleado':'New Employee',
'+ Nuevo Empleado':'+ New Employee',
'Guía Legal':'Legal Guide',
'Empleados':'Employees',
'Incidentes':'Incidents',
'Advertencias':'Warnings',
'Terminaciones':'Terminations',
'Políticas':'Policies',
'Buscar empleado...':'Search employee...',
'No hay empleados registrados':'No employees registered',
'Agrega tu primer empleado para comenzar':'Add your first employee to get started',
'+ Agregar Empleado':'+ Add Employee',
// === USERS & TEAM ===
'Usuarios y Control de Acceso':'Users & Access Control',
'Sin usuarios registrados':'No registered users',
'Sesiones Activas':'Active Sessions',
'Acceso total. My Money, cuenta bancaria, configuración, usuarios.':'Full access. My Money, bank account, settings, users.',
'Solo 1 por empresa.':'Only 1 per company.',
'Payroll, gastos, recibos, facturas, QuickBooks, reportes.':'Payroll, expenses, receipts, invoices, QuickBooks, reports.',
'No ve My Money ni cuenta bancaria.':'Cannot see My Money or bank account.',
'Despacho, trabajos, técnicos, clientes, correo, agenda.':'Dispatch, jobs, technicians, clients, email, schedule.',
'No ve finanzas ni nómina.':'Cannot see finances or payroll.',
'Solo sus trabajos asignados, reloj de entrada/salida.':'Only their assigned jobs, clock in/out.',
'No ve otros datos.':'Cannot see other data.',
'Solo Vista':'View Only',
// === BUSINESS EMAIL/MAIL ===
'Entrada':'Inbox',
'Salida':'Outbox',
'Urgente':'Urgent',
'Archivados':'Archived',
'Documentos':'Documents',
'Todos':'All',
'Entrante':'Incoming',
'Saliente':'Outgoing',
'Archivado':'Archived',
'No hay documentos en esta vista.':'No documents in this view.',
'facturas de proveedores, avisos del gobierno, correspondencia de seguros, etc.':'supplier invoices, government notices, insurance correspondence, etc.',
// === RECEIPTS ===
'Proveedores':'Suppliers',
'Sin Foto':'No Photo',
'No hay recibos registrados.':'No receipts recorded.',
// === HOME ADVISORS ===
'Comisiones Pendings':'Pending Commissions',
'Comisiones Pendientes':'Pending Commissions',
'Leads Activos':'Active Leads',
'Receipts sin Conciliar':'Unreconciled Receipts',
'Venta':'Sale',
'Materiales':'Materials',
'Labor':'Labor',
'Activo':'Active',
// === DISPATCH ===
'ESPECIALIDAD':'SPECIALTY',
'PRIORIDAD':'PRIORITY',
'Baja':'Low',
'Completado':'Completed',
'hace':'ago',
'En Ruta':'En Route',
// === SERVICE CALLS MAP ===
'Asignada':'Assigned',
'Completada':'Completed',
// === JOBS ===
'HORAS DE LABOR':'LABOR HOURS',
'DESCUENTO (%)':'DISCOUNT (%)',
'Garantía, condiciones, recomendaciones...':'Warranty, conditions, recommendations...',
// === PRICE BOOK ===
'Buscar parte, servicio...':'Search part, service...',
'Equipos Carrier, Bryant, Payne':'Carrier, Bryant, Payne equipment',
'equipos completos':'complete equipment',
'Motores, controles, herramientas':'Motors, controls, tools',
'Partes, herramientas, accesorios':'Parts, tools, accessories',
'Equipos, filtros, ductos':'Equipment, filters, ducts',
'Partes usadas y nuevas, boards':'Used and new parts, boards',
'Equipos y partes Trane/American Standard':'Trane/American Standard equipment and parts',
'Equipos y partes Lennox':'Lennox equipment and parts',
'Mini-splits, boilers, partes':'Mini-splits, boilers, parts'
};

// ===== 4. DOM SCANNING TRANSLATION ENGINE =====
var originalTexts = new Map(); // element -> original ES text

function translateDOM(){
  if(typeof currentLang==='undefined') return;
  var isEN = currentLang === 'en';

  // Translate all text nodes in leaf elements
  var selectors = 'button,label,h2,h3,h4,h5,th,td,span,a,option,legend,summary,p,small,li,div';
  document.querySelectorAll(selectors).forEach(function(el){
    // Skip elements with data-i18n (handled by applyLanguage)
    if(el.getAttribute('data-i18n')) return;
    // Skip elements with many children (containers) - but allow divs with few children
    if(el.tagName === 'DIV' && el.children.length > 2) return;
    if(el.tagName !== 'DIV' && el.children.length > 3) return;
    // Skip script/style/ai panel
    if(el.closest('script,style,.ai-chat-panel,noscript')) return;

    var text = el.textContent.trim();
    if(!text || text.length < 2 || text.length > 200) return;

    if(isEN){
      // Store original if not stored
      if(!originalTexts.has(el)) originalTexts.set(el, text);
      var orig = originalTexts.get(el);
      // Look up translation
      if(T[orig]){
        // Only replace if the element is a leaf or has minimal children
        if(el.children.length === 0){
          el.textContent = T[orig];
        } else {
          // For elements with icon children, try to translate text nodes
          translateTextNodes(el, orig, T[orig]);
        }
      }
    } else {
      // Restore Spanish
      if(originalTexts.has(el)){
        var orig = originalTexts.get(el);
        if(el.children.length === 0){
          el.textContent = orig;
        } else {
          translateTextNodes(el, el.textContent.trim(), orig);
        }
      }
    }
  });

  // Translate placeholders
  document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function(el){
    if(!el._origPH) el._origPH = el.placeholder;
    if(isEN){
      if(T[el._origPH]){
        el.placeholder = T[el._origPH];
      } else if(el._origPH.match(/Buscar cliente, trabajo, factura/)){
        el.placeholder = el._origPH.replace('Buscar cliente, trabajo, factura...','Search client, job, invoice...');
      }
    } else if(!isEN && el._origPH){
      el.placeholder = el._origPH;
    }
  });

  // Translate title attributes
  document.querySelectorAll('[title]').forEach(function(el){
    if(!el._origTitle) el._origTitle = el.title;
    if(isEN && T[el._origTitle]){
      el.title = T[el._origTitle];
    } else if(!isEN && el._origTitle){
      el.title = el._origTitle;
    }
  });

  // Apply regex patterns for dynamic content
  if(isEN) applyPatterns();
}

function translateTextNodes(el, fromText, toText){
  // Walk text nodes and replace
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  while(walker.nextNode()){
    var node = walker.currentNode;
    var trimmed = node.textContent.trim();
    if(trimmed.length > 1 && T[trimmed]){
      node.textContent = node.textContent.replace(trimmed, T[trimmed]);
    }
  }
}

// Partial pattern replacements for dynamic content from script.js
var PATTERNS = [
  // Installation statuses (UPPERCASE from script.js)
  [/\bINICIADO\b/g, 'STARTED'],
  [/\bEN PROGRESO\b/g, 'IN PROGRESS'],
  [/\bTERMINADO\b/g, 'COMPLETED'],
  [/\bDOCUMENTADO\b/g, 'DOCUMENTED'],
  [/\bFINALIZADO\b/g, 'FINISHED'],
  [/Instalaciones en Progreso/g, 'Installations in Progress'],
  [/En Progreso/g, 'In Progress'],
  // Dashboard metrics
  [/\bCOBRADO\b/g, 'COLLECTED'],
  [/\bTICKET PROMEDIO\b/g, 'AVG TICKET'],
  [/\bpendiente\b/g, 'pending'],
  [/\bCobrado\b/g, 'Collected'],
  // Month abbreviations (Spanish → English)
  [/\bEne\b/g, 'Jan'],
  [/\bAbr\b/g, 'Apr'],
  [/\bAgo\b/g, 'Aug'],
  [/\bDic\b/g, 'Dec'],
  // Job types
  [/Reparación AC/g, 'AC Repair'],
  [/Instalación AC/g, 'AC Installation'],
  [/Reparación/g, 'Repair'],
  // Time/counts
  [/(\d+) días/g, '$1 days'],
  [/Sin ubicación/g, 'No location'],
  // Equipment warnings
  [/Equipo con más de (\d+) años/g, 'Equipment over $1 years old'],
  [/considerar reemplazo/g, 'consider replacement'],
  // Service call rules
  [/La llamada de servicio SIEMPRE se cobra/g, 'The service call is ALWAYS charged'],
  [/si el cliente decide hacer el trabajo, se cobra ADICIONAL a labor \+ partes/g, 'if the client proceeds, it is charged IN ADDITION to labor + parts'],
  // Status/location
  [/Fotos Después/g, 'After Photos'],
  [/Fuera de línea/g, 'Offline'],
  [/Última Ubicación/g, 'Last Location'],
  [/Por agendar/g, 'To schedule'],
  [/Disponible/g, 'Available'],
  [/Ocupado/g, 'Busy'],
  [/Vendedor/g, 'Salesperson'],
  [/Pendiente/g, 'Pending'],
  [/Trabajo Nuevo/g, 'New Job'],
  [/Trabajo En Progreso/g, 'Job In Progress'],
  [/Recién Pagadas/g, 'Recently Paid'],
  // Long dynamic messages
  [/No hay empleados registrados\. Agrega técnicos en Despacho y vendedores en Home Advisors\./g, 'No employees registered. Add technicians in Dispatch and salespeople in Home Advisors.'],
  [/No hay planes de servicio\. Crea tu primer plan de mantenimiento para generar ingresos recurrentes\./g, 'No service plans. Create your first maintenance plan to generate recurring income.'],
  [/No hay citas próximas/g, 'No upcoming appointments'],
  [/No hay instalaciones en progreso/g, 'No installations in progress'],
  [/No hay facturas en esta categoría/g, 'No invoices in this category'],
  [/No hay referencias todavía/g, 'No referrals yet'],
  [/Sin artículos/g, 'No items'],
  [/Sin campañas/g, 'No campaigns'],
  [/Sin historial de sincronización/g, 'No sync history'],
  // Documents/settings
  [/Sube tus documentos legales y de seguros/g, 'Upload your legal and insurance documents'],
  [/se incluirán automáticamente en estimados y facturas/g, 'will be automatically included in estimates and invoices'],
  [/cuando el cliente o la ciudad lo requieran/g, 'when the client or city requires it'],
  [/Los recibos del vendedor deben coincidir con los recibos de la empresa/g, 'Salesperson receipts must match company receipts'],
  [/El sistema compara automáticamente/g, 'The system automatically compares'],
  [/monto, fecha y proveedor/g, 'amount, date and supplier'],
  [/Sube las credenciales y certificaciones de cada técnico/g, 'Upload the credentials and certifications for each technician'],
  [/Estos documentos se pueden incluir/g, 'These documents can be included'],
  [/en estimados y facturas para mostrar confianza al cliente/g, 'in estimates and invoices to show trust to the client'],
  [/El técnico usará su/g, 'The technician will use their'],
  [/contraseña/g, 'password'],
  [/para entrar al CRM/g, 'to access the CRM'],
  [/Crear acceso al CRM/g, 'Create CRM access'],
  [/para que entre desde su celular/g, 'so they can enter from their phone'],
  [/Agrega al Dueño\/CEO primero/g, 'Add the Owner/CEO first'],
  [/luego la persona de contabilidad y el coordinador de despacho/g, 'then the accounting person and dispatch coordinator'],
  [/Aplica igual para leads de la empresa y leads propios del vendedor/g, 'Applies equally to company leads and salesperson own leads'],
  [/Fórmula:/g, 'Formula:'],
  [/Tasa de Conversión:/g, 'Conversion Rate:'],
  // Technician tracker messages
  [/Tu ubicación se envía cada 30 segundos/g, 'Your location is sent every 30 seconds'],
  [/mientras estés en servicio/g, 'while on service'],
  [/Al terminar tu jornada/g, 'When your shift ends'],
  [/haz Marcar Salida para dejar de compartir ubicación/g, 'Clock Out to stop sharing your location'],
  [/Comparte este link con tus técnicos/g, 'Share this link with your technicians'],
  [/para que reporten su ubicación en tiempo real desde su celular/g, 'so they can report their location in real time from their phone'],
  // Pipeline / Advisors
  [/Asignar Lead a Vendedor/g, 'Assign Lead to Salesperson'],
  [/Lead Propio del Vendedor/g, 'Salesperson Own Lead'],
  [/Leads por Vencer/g, 'Expiring Leads'],
  [/días sin cerrar/g, 'days without closing'],
  // Selects
  [/Seleccionar Advisor\.\.\./g, 'Select Advisor...'],
  [/Seleccionar Archivo/g, 'Select File'],
  [/── Técnicos ──/g, '── Technicians ──'],
  // Quick create
  [/Crear Rápido/g, 'Quick Create'],
  [/Crear Nuevo/g, 'Create New'],
  // Various
  [/Configurar ADP Workforce/g, 'Configure ADP Workforce'],
  [/Cuenta del Proveedor/g, 'Supplier Account'],
  [/Actualizar Foto/g, 'Update Photo'],
  [/Coordinador de Despacho/g, 'Dispatch Coordinator'],
  [/Registración del Vehículo/g, 'Vehicle Registration'],
  [/Seguro Comercial del Vehículo/g, 'Commercial Vehicle Insurance'],
  [/Identificación para/g, 'ID for'],
  [/Editar Vehículo:/g, 'Edit Vehicle:'],
  [/Factura manual/g, 'Manual Invoice'],
  [/Otro proveedor\.\.\./g, 'Other supplier...'],
  // Client limit modal
  [/Has alcanzado tu límite/g, 'You have reached your limit'],
  [/Límite de Clientes Alcanzado/g, 'Client Limit Reached'],
  [/Actualizar Plan/g, 'Upgrade Plan'],
  // Estimate pipeline statuses
  [/\bABIERTOS\b/g, 'OPEN'],
  [/\bAPROBADOS\b/g, 'APPROVED'],
  [/\bINVOICED\b/g, 'INVOICED'],
  [/\bCOLLECTED\b/g, 'COLLECTED'],
  [/de estimados aprobados/g, 'of approved estimates'],
  [/Sin registros de entrada hoy/g, 'No clock entries today'],
  // Sidebar nav items that script.js generates
  [/Recibos/g, 'Receipts'],
  [/Gastos del Negocio/g, 'Business Expenses'],
  [/Mi Dinero/g, 'My Money'],
  [/Nómina/g, 'Payroll'],
  [/Lista de Precios/g, 'Price List'],
  [/Configuración/g, 'Settings'],
  // Salesperson labels
  [/Salespersones:/g, 'Salespeople:'],
  [/Tecnicos:/g, 'Technicians:'],
  // More form/content patterns
  [/\bAprobado\b/g, 'Approved'],
  [/Nombre, Teléfono, Email, Dirección/g, 'Name, Phone, Email, Address'],
  [/uno por línea/g, 'one per line'],
  [/Cobrado (\d+)/g, 'Collected $1'],
  [/y certificaciones de cada técnico/g, 'and certifications for each technician'],
  [/Estos documentos se pueden incluir/g, 'These documents can be included'],
  [/en estimados y facturas para mostrar confianza al cliente/g, 'in estimates and invoices to show trust to the client'],
  [/Identificación para/g, 'ID for'],
  [/Registración del Vehículo/g, 'Vehicle Registration'],
  [/Seguro Comercial del Vehículo/g, 'Commercial Vehicle Insurance'],
  [/Personaliza los términos legales/g, 'Customize the legal terms'],
  [/que aparecen en tus facturas e invoices/g, 'that appear on your invoices'],
  [/Edita según las leyes de tu estado/g, 'Edit according to your state laws'],
  [/Para contratistas independientes/g, 'For independent contractors'],
  [/Nómina completa, impuestos, beneficios/g, 'Full payroll, taxes, benefits'],
  [/Nómina para pequeñas empresas/g, 'Payroll for small businesses'],
  [/Nómina y HR para empresas medianas/g, 'Payroll & HR for mid-size companies'],
  [/Nómina y impuestos/g, 'Payroll & taxes'],
  [/Conecta tu proveedor de nómina/g, 'Connect your payroll provider'],
  [/para sincronizar horas, pagos y reportes automáticamente/g, 'to sync hours, payments and reports automatically'],
  [/Administra nómina manualmente en Trade Master/g, 'Manage payroll manually in Trade Master'],
  // Receipts/expenses
  [/Recibos sin Conciliar/g, 'Unreconciled Receipts'],
  [/Total Gastado/g, 'Total Spent'],
  [/Total Gastos/g, 'Total Expenses'],
  [/Total Recibos/g, 'Total Receipts'],
  [/Gastos Fijos/g, 'Fixed Expenses'],
  [/Gastos Variables/g, 'Variable Expenses'],
  // Reports  
  [/Todos los Proveedores/g, 'All Suppliers'],
  [/Todas las Categorías/g, 'All Categories'],
  [/Todas las categorías/g, 'All categories'],
  [/Todo el Año/g, 'All Year'],
  // Collections
  [/Total por Cobrar/g, 'Total to Collect'],
  [/Referencia/g, 'Reference'],
  [/Tarjeta/g, 'Card'],
  [/Todas con Balance/g, 'All with Balance'],
  [/Vencidas/g, 'Overdue'],
  [/Pagos Recibidos/g, 'Payments Received'],
  // Cash flow / Dashboard
  [/Flujo de Efectivo/g, 'Cash Flow'],
  [/Efectivo/g, 'Cash'],
  // Expenses / Settings
  [/Licencia de Contratista/g, 'Contractor License'],
  [/Licencia de Negocio/g, 'Business License'],
  [/Licencia del Contratista/g, 'Contractor License'],
  [/Exporta tus recibos y gastos como CSV y súbelos a QuickBooks para mantener tu contabilidad/g, 'Export your receipts and expenses as CSV and upload them to QuickBooks to keep your accounting'],
  [/El cliente podrá ver\/descargar/g, 'The client can view/download'],
  [/directamente desde/g, 'directly from'],
  [/Correo del Negocio/g, 'Business Email'],
  // Mailbox
  [/El coordinador de despacho puede subir correo físico o digital importante del negocio/g, 'The dispatch coordinator can upload important physical or digital business mail'],
  [/facturas de proveedores, avisos de gobierno, correspondencia legal/g, 'supplier invoices, government notices, legal correspondence'],
  [/Correo Entrante/g, 'Incoming Mail'],
  [/Correo Saliente/g, 'Outgoing Mail'],
  // Settings licenses
  [/Licencia de Manejar/g, 'Driver License'],
  // Invoice
  [/Factura manual/g, 'Manual Invoice'],
  // Jobs
  [/Prueba de Flujo/g, 'Airflow Test'],
  // Dispatch table headers handled in T map,
  // Remaining fix for partial translations  
  [/CSV y upload/g, 'CSV and upload'],
  [/CSV y súbelos/g, 'CSV and upload them'],
  // Reports
  [/\bReparación\b/g, 'Repair'],
  [/Usuarios y Equipo/g, 'Users & Team'],
  [/Recursos Humanos/g, 'Human Resources'],
  [/Ticket Promedio/g, 'Avg Ticket'],
  [/TICKET PROMEDIO/g, 'AVG TICKET'],
  [/trabajos activos/g, 'active jobs'],
  [/Mensuales/g, 'Monthly'],
  [/Este mes/g, 'This month'],
  [/ESTE MES/g, 'THIS MONTH'],
  [/No hay gastos registrados/g, 'No expenses registered'],
  [/Agrega tu renta, seguros y otros gastos fijos/g, 'Add your rent, insurance and other fixed expenses'],
  [/Tu contador puede acceder directamente a QuickBooks/g, 'Your accountant can access QuickBooks directly'],
  [/Ir a QuickBooks/g, 'Go to QuickBooks'],
  [/Cobrado (\d+)/g, 'Collected $1'],
  [/Correo Entrante/g, 'Incoming Mail'],
  [/Correo Saliente/g, 'Outgoing Mail'],
  [/Licencia de Manejar/g, 'Driver License'],
  [/Factura manual/g, 'Manual Invoice'],
  [/Prueba de Flujo/g, 'Airflow Test'],
  [/El coordinador de despacho puede subir correo/g, 'The dispatch coordinator can upload mail'],
  [/Contabilidad/g, 'Accounting'],
  [/Sin comunicaciones/g, 'No communications'],
  [/Registra tu primera interacción con un cliente/g, 'Record your first interaction with a client'],
  [/Sin asignar/g, 'Unassigned'],
  [/Sin reportar/g, 'Not reported'],
  [/Activas \(sin completar\)/g, 'Active (not completed)'],
  [/Nuevas \(sin asignar\)/g, 'New (unassigned)'],
  [/Mapa de Leads/g, 'Leads Map'],
  [/Texto enviado/g, 'Text sent'],
  [/Acciones/g, 'Actions'],
  [/Llamar/g, 'Call'],
  [/Ganado/g, 'Won'],
  [/Nombre, Teléfono, Email, Dirección/g, 'Name, Phone, Email, Address'],
  [/uno por línea/g, 'one per line'],
  [/Editar Vehículo:/g, 'Edit Vehicle:'],
  [/Registración del Vehículo/g, 'Vehicle Registration'],
  [/Seguro Comercial del Vehículo/g, 'Commercial Vehicle Insurance'],
  [/Sin registros de entrada hoy/g, 'No clock entries today'],
  [/Calendario de Citas/g, 'Appointment Calendar'],
  [/Nueva Cita/g, 'New Appointment'],
  [/No hay citas este día/g, 'No appointments this day'],
  [/Crear cita/g, 'Create appointment'],
  [/En Camino/g, 'On the Way'],
  [/Completadas Hoy/g, 'Completed Today'],
  [/Esperando/g, 'Waiting'],
  [/En ruta/g, 'En route'],
  [/Finalizadas/g, 'Finished'],
  [/PROBLEMA:/g, 'PROBLEM:'],
  [/HORAS DE LABOR/g, 'LABOR HOURS'],
  [/Componentes y Reparaciones/g, 'Components & Repairs'],
  [/DESCUENTO/g, 'DISCOUNT'],
  [/Por pagar/g, 'To pay'],
  [/En seguimiento/g, 'In follow-up'],
  [/Equipo de Ventas/g, 'Sales Team'],
  [/Ventas y Comisiones/g, 'Sales & Commissions'],
  [/Estructura de Comisiones/g, 'Commission Structure'],
  [/Basada en Ganancia/g, 'Profit Based'],
  [/Ganancia/g, 'Profit'],
  [/ESPECIALIDAD/g, 'SPECIALTY'],
  [/ZONA/g, 'ZONE'],
  [/Residencial/g, 'Residential'],
  [/Registro de Seguimientos/g, 'Follow-Up Log'],
  [/No hay seguimientos registrados/g, 'No follow-ups recorded'],
  [/VENCIDO/g, 'OVERDUE'],
  [/TOTAL FACTURAS/g, 'TOTAL INVOICES'],
  [/VENCE/g, 'DUE'],
  [/Borrador/g, 'Draft'],
  [/Pagada/g, 'Paid'],
  [/Pago/g, 'Payment'],
  [/millas/g, 'miles'],
  [/Febrero/g, 'February'],
  [/Enero/g, 'January'],
  [/Marzo/g, 'March'],
  [/Abril/g, 'April'],
  [/Mayo/g, 'May'],
  [/Junio/g, 'June'],
  [/Julio/g, 'July'],
  [/Agosto/g, 'August'],
  [/Septiembre/g, 'September'],
  [/Octubre/g, 'October'],
  [/Noviembre/g, 'November'],
  [/Diciembre/g, 'December'],
  [/LOGO DE LA EMPRESA/g, 'COMPANY LOGO'],
  [/Cambiar Logo/g, 'Change Logo'],
  [/Dirección de la empresa/g, 'Company address'],
  [/Nombre completo del dueño/g, 'Owner full name'],
  [/Gestión de empleados y cumplimiento legal/g, 'Employee management and legal compliance'],
  [/Nuevo Empleado/g, 'New Employee'],
  [/Guía Legal/g, 'Legal Guide'],
  [/Empleados/g, 'Employees'],
  [/Incidentes/g, 'Incidents'],
  [/Advertencias/g, 'Warnings'],
  [/Terminaciones/g, 'Terminations'],
  [/Políticas/g, 'Policies'],
  [/Buscar empleado/g, 'Search employee'],
  [/No hay empleados registrados/g, 'No employees registered'],
  [/Agrega tu primer empleado para comenzar/g, 'Add your first employee to get started'],
  [/Agregar Empleado/g, 'Add Employee'],
  [/Usuarios y Control de Acceso/g, 'Users & Access Control'],
  [/Sin usuarios registrados/g, 'No registered users'],
  [/Sesiones Activas/g, 'Active Sessions'],
  [/Solo 1 por empresa/g, 'Only 1 per company'],
  [/No ve My Money ni cuenta bancaria/g, 'Cannot see My Money or bank account'],
  [/No ve finanzas ni nómina/g, 'Cannot see finances or payroll'],
  [/Solo sus trabajos asignados/g, 'Only their assigned jobs'],
  [/reloj de entrada\/salida/g, 'clock in/out'],
  [/No ve otros datos/g, 'Cannot see other data'],
  [/Solo Vista/g, 'View Only'],
  [/Entrada/g, 'Inbox'],
  [/Salida/g, 'Outbox'],
  [/Archivados/g, 'Archived'],
  [/Archivado/g, 'Archived'],
  [/Documentos/g, 'Documents'],
  [/Entrante/g, 'Incoming'],
  [/Saliente/g, 'Outgoing'],
  [/No hay documentos en esta vista/g, 'No documents in this view'],
  [/facturas de proveedores, avisos del gobierno/g, 'supplier invoices, government notices'],
  [/correspondencia de seguros/g, 'insurance correspondence'],
  [/Proveedores/g, 'Suppliers'],
  [/Sin Foto/g, 'No Photo'],
  [/No hay recibos registrados/g, 'No receipts recorded'],
  [/Comisiones Pend/g, 'Pending Commiss'],
  [/Leads Activos/g, 'Active Leads'],
  [/Receipts sin Conciliar/g, 'Unreconciled Receipts'],
  [/ESPECIALIDAD/g, 'SPECIALTY'],
  [/PRIORIDAD/g, 'PRIORITY'],
  [/Completado/g, 'Completed'],
  [/En Ruta/g, 'En Route'],
  [/Buscar parte, servicio/g, 'Search part, service'],
  [/Garantía, condiciones, recomendaciones/g, 'Warranty, conditions, recommendations'],
  [/Equipos Carrier/g, 'Carrier equipment'],
  [/equipos completos/g, 'complete equipment'],
  [/Motores, controles, herramientas/g, 'Motors, controls, tools'],
  [/Partes, herramientas, accesorios/g, 'Parts, tools, accessories'],
  [/Equipos, filtros, ductos/g, 'Equipment, filters, ducts'],
  [/Partes usadas y nuevas/g, 'Used and new parts'],
  [/Equipos y partes Trane/g, 'Trane equipment and parts'],
  [/Equipos y partes Lennox/g, 'Lennox equipment and parts'],
  [/Mini-splits, boilers, partes/g, 'Mini-splits, boilers, parts'],
  [/Venta/g, 'Sale'],
  [/Materiales/g, 'Materials']
];

function applyPatterns(){
  if(typeof currentLang==='undefined' || currentLang !== 'en') return;
  // Apply regex patterns to text nodes that weren't caught by exact match
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  while(walker.nextNode()){
    var node = walker.currentNode;
    if(node.parentElement && node.parentElement.closest('script,style,.ai-chat-panel,noscript,input,textarea')) continue;
    var text = node.textContent;
    if(text.length < 3) continue;
    var changed = false;
    PATTERNS.forEach(function(p){
      if(p[0].test(text)){
        text = text.replace(p[0], p[1]);
        changed = true;
        // Reset regex lastIndex
        p[0].lastIndex = 0;
      }
    });
    if(changed) node.textContent = text;
  }
}

// ===== 5. HOOK INTO applyLanguage() =====
function hookApplyLanguage(){
  if(typeof applyLanguage !== 'function') return;
  var originalApply = applyLanguage;
  window.applyLanguage = function(){
    originalApply.call(this);
    // Run DOM translation after the original i18n system
    setTimeout(translateDOM, 50);
  };
}

// ===== 6. MUTATION OBSERVER for dynamic content =====
function setupObserver(){
  var debounceTimer;
  var observer = new MutationObserver(function(){
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function(){
      if(typeof currentLang !== 'undefined' && currentLang === 'en'){
        translateDOM();
      }
    }, 80);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// ===== INIT =====
function init(){
  fixI18nData();
  hookApplyLanguage();
  setupObserver();

  // Hook showSection to re-translate on section change
  if(typeof showSection === 'function'){
    var origShow = showSection;
    window.showSection = function(){
      origShow.apply(this, arguments);
      if(typeof currentLang !== 'undefined' && currentLang === 'en'){
        setTimeout(translateDOM, 50);
        setTimeout(translateDOM, 300);
      }
    };
  }

  // Re-apply the i18n system to pick up fixed keys
  if(typeof applyLanguage === 'function'){
    setTimeout(applyLanguage, 100);
  }

  // Multiple staggered scans to catch script.js dynamic content
  if(typeof currentLang !== 'undefined' && currentLang === 'en'){
    [200, 600, 1500, 3000, 5000].forEach(function(ms){
      setTimeout(translateDOM, ms);
    });
  }

  console.log('✅ i18n-patch.js v6 loaded — ' + Object.keys(T).length + ' translations + ' + PATTERNS.length + ' patterns ready');
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
