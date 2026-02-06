// ===== TRADE MASTER CRM - FULL SYSTEM =====
var SUPABASE_URL = 'https://ucowlcrddzukykbaitzt.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb3dsY3JkZHp1a3lrYmFpdHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY4MDUsImV4cCI6MjA4NTg4MjgwNX0.SMZ6VA4jOfT120nUZm0U19dGE2j2MQ2sn_gGjv-oPes';
var sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var leadsMap = null, dispatchMap = null, trackingMap = null;
var markers = [], dispatchMarkers = [];
var leadsData = [], techsData = [], jobsData = [];
var currentUser = null, companyId = null;
var trackingInterval = null;

// ===== AUTH =====
function switchTab(tab) {
    var lf = document.getElementById('loginForm');
    var rf = document.getElementById('registerForm');
    var btns = document.querySelectorAll('.tab-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    lf.classList.remove('active'); rf.classList.remove('active');
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
    if (tab === 'login') { btns[0].classList.add('active'); lf.classList.add('active'); }
    else { btns[1].classList.add('active'); rf.classList.add('active'); }
}

async function handleLogin(event) {
    event.preventDefault();
    var btn = document.getElementById('loginBtn');
    var err = document.getElementById('loginError');
    err.style.display = 'none'; btn.disabled = true; btn.textContent = 'Iniciando sesión...';
    try {
        var res = await sbClient.auth.signInWithPassword({
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value
        });
        if (res.error) { err.textContent = res.error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : res.error.message; err.style.display = 'block'; }
        else { currentUser = res.data.user; await loadCompanyId(); showDashboard(); }
    } catch(e) { err.textContent = 'Error de conexión'; err.style.display = 'block'; }
    btn.disabled = false; btn.textContent = 'Iniciar Sesión';
}

async function handleRegister(event) {
    event.preventDefault();
    var btn = document.getElementById('registerBtn');
    var err = document.getElementById('registerError');
    var suc = document.getElementById('registerSuccess');
    err.style.display = 'none'; suc.style.display = 'none';
    var pw = document.getElementById('registerPassword').value;
    if (pw !== document.getElementById('confirmPassword').value) { err.textContent = 'Las contraseñas no coinciden'; err.style.display = 'block'; return; }
    if (pw.length < 6) { err.textContent = 'Mínimo 6 caracteres'; err.style.display = 'block'; return; }
    btn.disabled = true; btn.textContent = 'Creando cuenta...';
    try {
        var res = await sbClient.auth.signUp({
            email: document.getElementById('registerEmail').value,
            password: pw,
            options: { data: { first_name: document.getElementById('firstName').value, last_name: document.getElementById('lastName').value, company_name: document.getElementById('companyName').value, phone: document.getElementById('phone').value } }
        });
        if (res.error) { err.textContent = res.error.message; err.style.display = 'block'; }
        else if (res.data.user && !res.data.session) { suc.textContent = '¡Cuenta creada! Revisa tu email para confirmar.'; suc.style.display = 'block'; }
        else if (res.data.session) { currentUser = res.data.user; await createCompany(); showDashboard(); }
    } catch(e) { err.textContent = 'Error de conexión'; err.style.display = 'block'; }
    btn.disabled = false; btn.textContent = 'Crear Cuenta Empresarial';
}

async function createCompany() {
    var meta = currentUser.user_metadata || {};
    var res = await sbClient.from('companies').insert({ name: meta.company_name || 'Mi Empresa', phone: meta.phone || '', created_by: currentUser.id }).select().single();
    if (res.data) companyId = res.data.id;
}

async function loadCompanyId() {
    var res = await sbClient.from('companies').select('id, name, phone, email, contract_clauses').eq('created_by', currentUser.id).single();
    if (res.data) {
        companyId = res.data.id;
        // Store company info for settings
        window._companyInfo = res.data;
    }
}

// ===== DASHBOARD =====
function showDashboard() {
    if (!currentUser) return;
    var meta = currentUser.user_metadata || {};
    var name = meta.first_name || currentUser.email.split('@')[0];
    var company = (window._companyInfo && window._companyInfo.name) ? window._companyInfo.name : (meta.company_name || 'Mi Empresa');
    var ini = name.charAt(0).toUpperCase();
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'grid';
    document.getElementById('companyDisplay').textContent = company;
    var sidebarName = document.querySelector('.sidebar-brand h2');
    if (sidebarName) sidebarName.textContent = company;
    document.title = company + ' - CRM HVACR';
    document.getElementById('userInitials').textContent = ini;
    document.getElementById('sidebarInitials').textContent = ini;
    document.getElementById('sidebarUserName').textContent = name;
    // Pre-fill settings
    if (window._companyInfo) {
        document.getElementById('settingsCompanyName').value = window._companyInfo.name || '';
        document.getElementById('settingsPhone').value = window._companyInfo.phone || '';
        document.getElementById('settingsEmail').value = window._companyInfo.email || '';
        if (window._companyInfo.contract_clauses) {
            loadClausesFromData(window._companyInfo.contract_clauses);
        } else {
            loadDefaultClauses();
        }
    } else {
        loadDefaultClauses();
    }
    showSection('dashboard');
    loadAllData();
}

async function loadAllData() {
    await loadTechnicians();
    await loadLeadsData();
    await loadJobs();
    try { await loadInvoices(); } catch(e) { console.log('Invoices table not ready'); }
    try { await loadClients(); } catch(e) { console.log('Clients table not ready'); }
    try { await loadAppointments(); } catch(e) { console.log('Appointments table not ready'); }
    try { await loadAdvisors(); } catch(e) {}
    try { await loadReferrals(); } catch(e) {}
    updateKPIs();
    renderDashboardDynamic();
}

function updateKPIs() {
    document.getElementById('leadCountKPI').textContent = leadsData.length;
    document.getElementById('techCountKPI').textContent = techsData.length;
    document.getElementById('jobCountKPI').textContent = jobsData.filter(function(j) { return j.status !== 'completed' && j.status !== 'cancelled'; }).length;
    document.getElementById('clientCountKPI').textContent = clientsData.length;
}

// ===== NAVIGATION =====
function showSection(name) {
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    var t = document.getElementById(name + '-section');
    if (t) t.classList.add('active');
    var titles = { dashboard:'Dashboard', calendar:'Calendario', leads:'Gestión de Leads', dispatch:'Dispatch - Centro de Control', clients:'Clientes', jobs:'Trabajos', technicians:'Técnicos', advisors:'Home Advisors', invoices:'Facturas', collections:'Cobranza', settings:'Configuración' };
    document.getElementById('pageTitle').textContent = titles[name] || 'Dashboard';
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    var al = document.querySelector('[onclick="showSection(\'' + name + '\')"]');
    if (al) al.classList.add('active');
    if (name === 'dashboard') { renderDashboardDynamic(); }
    if (name === 'calendar') { initCalendar(); }
    if (name === 'clients') { loadClients(); }
    if (name === 'leads') setTimeout(function() { if (!leadsMap) initLeadsMap(); else google.maps.event.trigger(leadsMap, 'resize'); }, 150);
    if (name === 'dispatch') setTimeout(function() { if (!dispatchMap) initDispatchMap(); else google.maps.event.trigger(dispatchMap, 'resize'); updateDispatchMap(); }, 150);
    if (name === 'technicians') { renderTechFullList(); generateTrackingLinks(); }
    if (name === 'jobs') { populateEstimateJobs(); loadAdvisors(); }
    if (name === 'advisors') { loadAdvisors(); loadReferrals(); }
    if (name === 'invoices') { populateInvoiceSelects(); loadInvoices(); }
    if (name === 'collections') { loadCollections(); }
}

// ===== LEADS =====
function showLeadForm() { document.getElementById('leadFormContainer').style.display = 'block'; document.getElementById('leadForm').reset(); }
function hideLeadForm() { document.getElementById('leadFormContainer').style.display = 'none'; }

async function handleLeadCreate(event) {
    event.preventDefault();
    var lat = document.getElementById('leadLat').value;
    var lng = document.getElementById('leadLng').value;
    if (!lat || !lng) { alert('Ingresa una dirección válida'); return; }
    await sbClient.from('leads').insert({
        company_id: companyId, name: document.getElementById('leadName').value,
        phone: document.getElementById('leadPhone').value, email: document.getElementById('leadEmail').value,
        service: document.getElementById('leadService').value, address: document.getElementById('leadAddress').value,
        property_type: document.getElementById('leadPropertyType').value,
        lat: parseFloat(lat), lng: parseFloat(lng), notes: document.getElementById('leadNotes').value
    });
    hideLeadForm(); await loadLeadsData(); updateKPIs(); alert('¡Lead creado!');
}

async function loadLeadsData() {
    if (!companyId) return;
    var res = await sbClient.from('leads').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    leadsData = res.data || [];
    renderLeadsTable();
    if (leadsMap) updateLeadsMap();
}

function renderLeadsTable() {
    var c = document.getElementById('leadsList');
    if (leadsData.length === 0) { c.innerHTML = '<p class="empty-msg">No hay leads. Crea uno para comenzar.</p>'; return; }
    // Build tech options for assign dropdown
    var techOpts = '<option value="">Asignar técnico...</option>';
    techsData.forEach(function(t) { techOpts += '<option value="' + t.id + '">' + t.name + '</option>'; });
    var statusOpts = ['new','contacted','quoted','won','lost'];
    var statusLabels = {new:'Nuevo',contacted:'Contactado',quoted:'Cotizado',won:'Ganado',lost:'Perdido'};

    var propEmojis = {residential:'🏠',commercial:'🏢',industrial:'🏭',restaurant:'🍽️'};

    var h = '<table class="leads-table"><thead><tr><th>Tipo</th><th>Nombre</th><th>Teléfono</th><th>Servicio</th><th>Estado</th><th>Técnico</th><th>Dirección</th><th>Acciones</th></tr></thead><tbody>';
    leadsData.forEach(function(l) {
        var assignedTech = '';
        if (l.technician_id) {
            var found = techsData.find(function(t) { return t.id === l.technician_id; });
            assignedTech = found ? found.name : '';
        }
        // Status dropdown
        var statusSelect = '<select class="inline-select" onchange="changeLeadStatus(\'' + l.id + '\', this.value)">';
        statusOpts.forEach(function(s) { statusSelect += '<option value="' + s + '"' + (l.status === s ? ' selected' : '') + '>' + statusLabels[s] + '</option>'; });
        statusSelect += '</select>';

        var propIcon = propEmojis[l.property_type] || '🏠';
        h += '<tr><td style="font-size:24px;text-align:center;">' + propIcon + '</td>';
        h += '<td><strong>' + l.name + '</strong><br><span style="font-size:11px;color:#94a3b8;">' + (l.email || '') + '</span></td>';
        h += '<td>' + l.phone + '<div class="contact-btns">';
        h += '<a href="tel:' + l.phone + '" class="btn-call" onclick="logContact(\'' + l.id + '\',\'llamada\')">📞 Llamar</a>';
        h += '<a href="sms:' + l.phone + '" class="btn-text" onclick="logContact(\'' + l.id + '\',\'texto\')">💬 Texto</a>';
        h += '</div>';
        if (l.last_contact) { h += '<span class="contact-log">✅ ' + l.last_contact + '</span>'; }
        h += '</td><td>' + l.service + '</td>';
        h += '<td>' + statusSelect + '</td>';
        h += '<td>';
        if (assignedTech) { h += '<span style="color:var(--primary);font-weight:600;">' + assignedTech + '</span>'; }
        else { h += '<select class="inline-select" onchange="assignLeadTech(\'' + l.id + '\', this.value)">' + techOpts + '</select>'; }
        h += '</td>';
        h += '<td style="font-size:12px;">' + l.address + '</td><td><div class="lead-actions">';
        h += '<button class="btn-nav" onclick="navigateTo(' + l.lat + ',' + l.lng + ')">🧭</button>';
        h += '<button class="btn-icon" onclick="openStreetView(' + l.lat + ',' + l.lng + ')">📸</button>';
        h += '<button class="btn-icon btn-zillow" onclick="openZillow(\'' + encodeURIComponent(l.address) + '\')">🏘️</button>';
        h += '<button class="btn-icon" onclick="convertLeadToJob(\'' + l.id + '\')">📋</button>';
        h += '<button class="btn-danger-sm" onclick="deleteLead(\'' + l.id + '\')">X</button>';
        h += '</div></td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

async function changeLeadStatus(id, status) {
    await sbClient.from('leads').update({ status: status }).eq('id', id);
    await loadLeadsData(); updateKPIs();
}

async function logContact(leadId, type) {
    var now = new Date();
    var dateStr = now.toLocaleDateString('es') + ' ' + now.toLocaleTimeString('es', {hour:'2-digit',minute:'2-digit'});
    var msg = type === 'llamada' ? 'Llamada cel ' + dateStr : 'Texto enviado ' + dateStr;
    await sbClient.from('leads').update({ status: 'contacted', last_contact: msg }).eq('id', leadId);
    setTimeout(function() { loadLeadsData(); }, 1500);
}

async function assignLeadTech(leadId, techId) {
    if (!techId) return;
    await sbClient.from('leads').update({ technician_id: techId }).eq('id', leadId);
    await loadLeadsData();
}

async function convertLeadToJob(leadId) {
    var lead = leadsData.find(function(l) { return l.id === leadId; });
    if (!lead) return;
    if (!confirm('¿Convertir lead "' + lead.name + '" en trabajo?')) return;
    
    // Auto-create client from lead
    try {
        await autoCreateClient(lead.name, lead.phone, lead.email, lead.address, 'lead', leadId);
    } catch(e) { console.log('Client auto-create skipped'); }

    var res = await sbClient.from('work_orders').insert({
        company_id: companyId, title: lead.service + ' - ' + lead.name,
        service_type: lead.service, address: lead.address,
        lat: lead.lat, lng: lead.lng,
        technician_id: lead.technician_id || null,
        notes: 'Lead: ' + lead.name + ' | Tel: ' + lead.phone + (lead.notes ? ' | ' + lead.notes : '')
    }).select();
    if (res.error) { 
        console.error('Error converting lead:', res.error);
        alert('Error: ' + res.error.message + '\nDetalle: ' + (res.error.details || '') + '\nHint: ' + (res.error.hint || ''));
        return;
    }
    await sbClient.from('leads').update({ status: 'won' }).eq('id', leadId);
    await loadLeadsData(); await loadJobs(); updateKPIs();
    alert('¡Lead convertido a trabajo y cliente creado! Ve a Dispatch para verlo.');
}

async function deleteLead(id) {
    if (confirm('¿Eliminar lead?')) { await sbClient.from('leads').delete().eq('id', id); await loadLeadsData(); updateKPIs(); }
}

// ===== TECHNICIANS =====
function showTechForm() { document.getElementById('techFormContainer').style.display = 'block'; document.getElementById('techForm').reset(); }
function hideTechForm() { document.getElementById('techFormContainer').style.display = 'none'; }

async function handleTechCreate(event) {
    event.preventDefault();
    await sbClient.from('technicians').insert({
        company_id: companyId, name: document.getElementById('techName').value,
        phone: document.getElementById('techPhone').value, email: document.getElementById('techEmail').value,
        specialty: document.getElementById('techSpecialty').value
    });
    hideTechForm(); await loadTechnicians(); updateKPIs(); alert('¡Técnico agregado!');
}

async function loadTechnicians() {
    if (!companyId) return;
    var res = await sbClient.from('technicians').select('*').eq('company_id', companyId).order('name');
    techsData = res.data || [];
    renderTechList(); updateTechSelect();
}

function renderTechList() {
    var c = document.getElementById('techniciansList');
    if (techsData.length === 0) { c.innerHTML = '<p class="empty-msg">No hay técnicos registrados.</p>'; return; }
    var statusOpts = ['available','busy','on_route','offline'];
    var statusLabels = {available:'Disponible',busy:'Ocupado',on_route:'En Ruta',offline:'Offline'};
    var h = '<table class="dispatch-table"><thead><tr><th>Nombre</th><th>Especialidad</th><th>Estado</th><th>Última Ubicación</th><th>Acciones</th></tr></thead><tbody>';
    techsData.forEach(function(t) {
        var locTime = t.last_location_update ? new Date(t.last_location_update).toLocaleString('es') : 'Sin reportar';
        // Check if tracking is stale (>10 min)
        var isStale = false;
        if (t.last_location_update) {
            var diff = (Date.now() - new Date(t.last_location_update).getTime()) / 60000;
            if (diff > 10) isStale = true;
        }
        var staleTag = isStale ? ' <span style="color:var(--danger);font-size:10px;">⚠️ hace >' + Math.round((Date.now() - new Date(t.last_location_update).getTime()) / 60000) + 'min</span>' : '';

        // Status dropdown
        var statusSelect = '<select class="inline-select status-select-' + t.status + '" onchange="changeTechStatus(\'' + t.id + '\', this.value)">';
        statusOpts.forEach(function(s) { statusSelect += '<option value="' + s + '"' + (t.status === s ? ' selected' : '') + '>' + statusLabels[s] + '</option>'; });
        statusSelect += '</select>';

        h += '<tr><td><strong>' + t.name + '</strong></td><td>' + (t.specialty || '-') + '</td>';
        h += '<td>' + statusSelect + '</td>';
        h += '<td style="font-size:11px;">' + locTime + staleTag + '</td>';
        h += '<td><div class="tech-actions">';
        if (t.phone) h += '<a href="tel:' + t.phone + '" class="btn-call">📞</a><a href="sms:' + t.phone + '" class="btn-text">💬</a>';
        if (t.current_lat && t.current_lng && t.status !== 'offline') h += '<button class="btn-nav" onclick="navigateTo(' + t.current_lat + ',' + t.current_lng + ')">📍</button>';
        h += '<button class="btn-danger-sm" onclick="deleteTech(\'' + t.id + '\')">X</button>';
        h += '</div></td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

async function changeTechStatus(techId, status) {
    await sbClient.from('technicians').update({ status: status }).eq('id', techId);
    await loadTechnicians();
    if (dispatchMap) updateDispatchMap();
}

function renderTechFullList() {
    var c = document.getElementById('techniciansFullList');
    if (!c) return;
    c.innerHTML = document.getElementById('techniciansList').innerHTML;
}

function updateTechSelect() {
    var sel = document.getElementById('jobTechId');
    if (!sel) return;
    sel.innerHTML = '<option value="">Sin asignar</option>';
    techsData.forEach(function(t) { sel.innerHTML += '<option value="' + t.id + '">' + t.name + ' (' + t.specialty + ')</option>'; });
}

async function deleteTech(id) {
    if (confirm('¿Eliminar técnico?')) { await sbClient.from('technicians').delete().eq('id', id); await loadTechnicians(); updateKPIs(); }
}

function generateTrackingLinks() {
    var c = document.getElementById('trackingLinkContainer');
    if (!c || techsData.length === 0) { if (c) c.innerHTML = 'Agrega técnicos primero en Dispatch.'; return; }
    var h = '';
    techsData.forEach(function(t) {
        var url = window.location.origin + '?track=' + t.id;
        h += '<div style="margin-bottom:12px;"><strong>' + t.name + ':</strong><br><a href="' + url + '" target="_blank" style="color:var(--primary);word-break:break-all;">' + url + '</a></div>';
    });
    c.innerHTML = h;
}

// ===== JOBS =====
function showJobForm() { document.getElementById('jobFormContainer').style.display = 'block'; document.getElementById('jobForm').reset(); }
function hideJobForm() { document.getElementById('jobFormContainer').style.display = 'none'; }

async function handleJobCreate(event) {
    event.preventDefault();
    var lat = document.getElementById('jobLat').value;
    var lng = document.getElementById('jobLng').value;
    var techId = document.getElementById('jobTechId').value || null;
    await sbClient.from('work_orders').insert({
        company_id: companyId, title: document.getElementById('jobTitle').value,
        service_type: document.getElementById('jobServiceType').value,
        priority: document.getElementById('jobPriority').value,
        address: document.getElementById('jobAddress').value,
        lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null,
        scheduled_date: document.getElementById('jobDate').value || null,
        technician_id: techId, notes: document.getElementById('jobNotes').value
    });
    hideJobForm(); await loadJobs(); updateKPIs(); alert('¡Trabajo creado!');
}

async function loadJobs() {
    if (!companyId) return;
    var res = await sbClient.from('work_orders').select('*, technicians(name)').eq('company_id', companyId).order('created_at', { ascending: false });
    jobsData = res.data || [];
    renderJobsList();
}

function renderJobsList() {
    var c = document.getElementById('jobsList');
    if (jobsData.length === 0) { c.innerHTML = '<p class="empty-msg">No hay trabajos pendientes.</p>'; return; }

    var jobStatuses = ['pending','in_progress','completed','cancelled'];
    var jobStatusLabels = {pending:'Pendiente',in_progress:'En Progreso',completed:'Completado',cancelled:'Cancelado'};

    var priorities = ['low','medium','high','urgent'];
    var priorityLabels = {low:'Baja',medium:'Normal',high:'Alta',urgent:'Urgente'};

    var h = '<table class="dispatch-table"><thead><tr><th>Trabajo</th><th>Prioridad</th><th>Técnico</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
    jobsData.forEach(function(j) {
        var status = j.status || 'pending';
        var priority = j.priority || 'medium';

        // Tech dropdown
        var techSelect = '<select class="inline-select" onchange="changeJobTech(\'' + j.id + '\', this.value)">';
        techSelect += '<option value="">Sin asignar</option>';
        techsData.forEach(function(t) { 
            techSelect += '<option value="' + t.id + '"' + (j.technician_id === t.id ? ' selected' : '') + '>' + t.name + '</option>'; 
        });
        techSelect += '</select>';

        // Status dropdown
        var statusSelect = '<select class="inline-select" onchange="changeJobStatus(\'' + j.id + '\', this.value)">';
        jobStatuses.forEach(function(s) { statusSelect += '<option value="' + s + '"' + (status === s ? ' selected' : '') + '>' + jobStatusLabels[s] + '</option>'; });
        statusSelect += '</select>';

        // Priority dropdown
        var prioSelect = '<select class="inline-select" onchange="changeJobPriority(\'' + j.id + '\', this.value)">';
        priorities.forEach(function(p) { prioSelect += '<option value="' + p + '"' + (priority === p ? ' selected' : '') + '>' + priorityLabels[p] + '</option>'; });
        prioSelect += '</select>';

        h += '<tr><td><strong>' + j.title + '</strong><br><span style="font-size:11px;color:#94a3b8;">' + (j.address || '') + '</span>';
        if (j.notes) h += '<br><span style="font-size:10px;color:#64748b;">📝 ' + j.notes + '</span>';
        h += '</td>';
        h += '<td>' + prioSelect + '</td>';
        h += '<td>' + techSelect + '</td>';
        h += '<td>' + statusSelect + '</td>';
        h += '<td><div class="job-actions">';
        h += '<button class="btn-icon btn-edit" onclick="editJob(\'' + j.id + '\')">✏️</button>';
        if (j.lat && j.lng) h += '<button class="btn-nav" onclick="navigateTo(' + j.lat + ',' + j.lng + ')">🧭</button>';
        if (j.lat && j.lng) h += '<button class="btn-icon" onclick="openStreetView(' + j.lat + ',' + j.lng + ')">📸</button>';
        h += '<button class="btn-danger-sm" onclick="deleteJob(\'' + j.id + '\')">X</button>';
        h += '</div></td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

function editJob(jobId) {
    var j = jobsData.find(function(x) { return x.id === jobId; });
    if (!j) return;
    var modal = document.getElementById('editJobModal');
    if (!modal) {
        // Create modal
        var div = document.createElement('div');
        div.id = 'editJobModal';
        div.className = 'edit-modal-overlay';
        div.innerHTML = '<div class="edit-modal">' +
            '<h3>✏️ Editar Trabajo</h3>' +
            '<div class="form-group"><label>Título / Tipo de Trabajo</label><input type="text" id="editJobTitle"></div>' +
            '<div class="form-group"><label>Tipo de Servicio</label>' +
            '<select id="editJobService"><option value="Instalación AC">Instalación AC</option><option value="Reparación AC">Reparación AC</option><option value="Mantenimiento">Mantenimiento</option><option value="Calefacción">Calefacción</option><option value="Refrigeración">Refrigeración</option><option value="Ductos">Ductos</option><option value="Otro">Otro</option></select></div>' +
            '<div class="form-group"><label>Dirección</label><input type="text" id="editJobAddress"><input type="hidden" id="editJobLat"><input type="hidden" id="editJobLng"></div>' +
            '<div class="form-group"><label>Teléfono del Cliente</label><input type="tel" id="editJobPhone"></div>' +
            '<div class="form-group"><label>Notas</label><textarea id="editJobNotes" rows="3"></textarea></div>' +
            '<input type="hidden" id="editJobId">' +
            '<div class="form-actions">' +
            '<button class="btn-primary btn-sm" onclick="saveJobEdit()">💾 Guardar Cambios</button>' +
            '<button class="btn-secondary btn-sm" onclick="closeEditJob()">Cancelar</button>' +
            '</div></div>';
        document.body.appendChild(div);
        // Add geocoding to edit address
        document.getElementById('editJobAddress').addEventListener('blur', function() {
            if (this.value) geocodeAddress(this.value, 'editJobLat', 'editJobLng');
        });
        modal = div;
    }
    // Fill values
    document.getElementById('editJobId').value = j.id;
    document.getElementById('editJobTitle').value = j.title || '';
    document.getElementById('editJobService').value = j.service_type || 'Otro';
    document.getElementById('editJobAddress').value = j.address || '';
    document.getElementById('editJobLat').value = j.lat || '';
    document.getElementById('editJobLng').value = j.lng || '';
    document.getElementById('editJobPhone').value = j.phone || '';
    document.getElementById('editJobNotes').value = j.notes || '';
    modal.style.display = 'flex';
}

function closeEditJob() { document.getElementById('editJobModal').style.display = 'none'; }

async function saveJobEdit() {
    var id = document.getElementById('editJobId').value;
    var address = document.getElementById('editJobAddress').value;
    var update = {
        title: document.getElementById('editJobTitle').value,
        service_type: document.getElementById('editJobService').value,
        address: address,
        phone: document.getElementById('editJobPhone').value,
        notes: document.getElementById('editJobNotes').value
    };
    // Re-geocode address before saving
    if (address) {
        try {
            var coords = await geocodeAddressAsync(address);
            if (coords) { update.lat = coords.lat; update.lng = coords.lng; }
        } catch(e) { console.log('Geocode failed, keeping old coords'); }
    }
    var res = await sbClient.from('work_orders').update(update).eq('id', id);
    if (res.error) { alert('Error: ' + res.error.message); return; }
    closeEditJob();
    await loadJobs(); if (dispatchMap) updateDispatchMap();
    alert('✅ Trabajo actualizado');
}

function geocodeAddressAsync(address) {
    return new Promise(function(resolve, reject) {
        new google.maps.Geocoder().geocode({ address: address }, function(results, status) {
            if (status === 'OK' && results.length > 0) {
                var loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
            } else { reject('No encontrada'); }
        });
    });
}

async function changeJobTech(jobId, techId) {
    await sbClient.from('work_orders').update({ technician_id: techId || null }).eq('id', jobId);
    await loadJobs(); if (dispatchMap) updateDispatchMap();
}

async function changeJobStatus(jobId, status) {
    await sbClient.from('work_orders').update({ status: status }).eq('id', jobId);
    await loadJobs(); updateKPIs();
}

async function changeJobPriority(jobId, priority) {
    await sbClient.from('work_orders').update({ priority: priority }).eq('id', jobId);
    await loadJobs();
}

async function deleteJob(id) {
    if (confirm('¿Eliminar trabajo?')) { await sbClient.from('work_orders').delete().eq('id', id); await loadJobs(); updateKPIs(); }
}

// ===== NAVIGATION =====
function navigateTo(lat, lng) {
    window.open('https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng, '_blank');
}

function openStreetView(lat, lng) {
    window.open('https://www.google.com/maps/@' + lat + ',' + lng + ',3a,75y,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192', '_blank');
}

function openZillow(address) {
    window.open('https://www.zillow.com/homes/' + address + '_rb/', '_blank');
}

// ===== GOOGLE MAPS - LEADS =====
function initLeadsMap() {
    leadsMap = new google.maps.Map(document.getElementById('leadsMap'), {
        zoom: 11, center: { lat: 34.1083, lng: -117.2898 },
        styles: [{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] }, { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] }],
        mapTypeControl: true, fullscreenControl: true
    });
    updateLeadsMap();
}

function updateLeadsMap() {
    markers.forEach(function(m) { m.setMap(null); }); markers = [];
    if (leadsData.length === 0) return;
    var bounds = new google.maps.LatLngBounds();
    leadsData.forEach(function(l) {
        if (!l.lat || !l.lng) return;
        var pos = { lat: parseFloat(l.lat), lng: parseFloat(l.lng) };
        var propIcons = {
            residential: { label: '🏠', color: '#10b981' },
            commercial: { label: '🏢', color: '#3b82f6' },
            industrial: { label: '🏭', color: '#f59e0b' },
            restaurant: { label: '🍽️', color: '#ef4444' }
        };
        var prop = propIcons[l.property_type] || propIcons.residential;
        var m = new google.maps.Marker({ position: pos, map: leadsMap, title: l.name,
            label: { text: prop.label, fontSize: '18px' },
            icon: { path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', fillColor: prop.color, fillOpacity: 1, strokeColor: 'white', strokeWeight: 2, scale: 1.8, anchor: new google.maps.Point(12, 22), labelOrigin: new google.maps.Point(12, 10) } });
        var propLabel = {residential:'🏠 Residencial',commercial:'🏢 Comercial',industrial:'🏭 Industrial',restaurant:'🍽️ Restaurante'};
        var streetViewUrl = 'https://maps.googleapis.com/maps/api/streetview?size=300x150&location=' + l.lat + ',' + l.lng + '&key=AIzaSyCkHcL1QcgKzxABmI4IJeEmjjvnZz_Xtys';
        var zillowUrl = 'https://www.zillow.com/homes/' + encodeURIComponent(l.address) + '_rb/';
        var googleMapsUrl = 'https://www.google.com/maps/@' + l.lat + ',' + l.lng + ',3a,75y,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192';
        var iwContent = '<div style="color:#333;padding:4px;font-size:13px;max-width:320px;">';
        iwContent += '<img src="' + streetViewUrl + '" style="width:100%;border-radius:6px;margin-bottom:8px;">';
        iwContent += '<strong>' + l.name + '</strong> ' + (propLabel[l.property_type] || '🏠') + '<br>';
        iwContent += '📞 ' + l.phone + '<br>📍 ' + l.address + '<br>🔧 ' + l.service + '<br>';
        iwContent += '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">';
        iwContent += '<a href="tel:' + l.phone + '" style="color:#059669;font-weight:bold;font-size:12px;">📞 Llamar</a>';
        iwContent += '<a href="https://www.google.com/maps/dir/?api=1&destination=' + l.lat + ',' + l.lng + '" target="_blank" style="color:#3b82f6;font-weight:bold;font-size:12px;">🧭 Navegar</a>';
        iwContent += '<a href="' + googleMapsUrl + '" target="_blank" style="color:#8b5cf6;font-weight:bold;font-size:12px;">📸 Street View</a>';
        iwContent += '<a href="' + zillowUrl + '" target="_blank" style="color:#e44d25;font-weight:bold;font-size:12px;">🏘️ Zillow</a>';
        iwContent += '</div></div>';
        var iw = new google.maps.InfoWindow({ content: iwContent });
        m.addListener('click', function() { iw.open(leadsMap, m); });
        markers.push(m); bounds.extend(pos);
    });
    if (leadsData.length > 1) leadsMap.fitBounds(bounds);
    else { leadsMap.setCenter(bounds.getCenter()); leadsMap.setZoom(14); }
}

// ===== GOOGLE MAPS - DISPATCH =====
function initDispatchMap() {
    dispatchMap = new google.maps.Map(document.getElementById('dispatchMap'), {
        zoom: 11, center: { lat: 34.1083, lng: -117.2898 },
        styles: [{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] }, { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] }],
        mapTypeControl: true, fullscreenControl: true
    });
    updateDispatchMap();
}

function updateDispatchMap() {
    dispatchMarkers.forEach(function(m) { m.setMap(null); }); dispatchMarkers = [];
    var bounds = new google.maps.LatLngBounds();
    var hasMarkers = false;

    // Técnicos con icono de vehículo (solo si NO están offline)
    // Van/truck SVG path
    var vanPath = 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z';
    techsData.forEach(function(t) {
        if (!t.current_lat || !t.current_lng) return;
        if (t.status === 'offline') return;
        var pos = { lat: parseFloat(t.current_lat), lng: parseFloat(t.current_lng) };
        var statusColors = {available:'#3b82f6', busy:'#f59e0b', on_route:'#8b5cf6'};
        var statusLabels = {available:'🟢 Disponible', busy:'🟡 Ocupado', on_route:'🟣 En Ruta'};
        var pinColor = statusColors[t.status] || '#3b82f6';
        var m = new google.maps.Marker({ position: pos, map: dispatchMap, title: t.name,
            icon: { path: vanPath, fillColor: pinColor, fillOpacity: 1, strokeColor: 'white', strokeWeight: 1.5, scale: 1.4, anchor: new google.maps.Point(12, 12) } });
        var iw = new google.maps.InfoWindow({ content: '<div style="color:#333;padding:8px;font-size:13px;"><strong>🚐 ' + t.name + '</strong><br>📱 ' + (t.phone || '') + '<br>🔧 ' + (t.specialty || '') + '<br>' + (statusLabels[t.status] || t.status) + '<br><div style="margin-top:6px;"><a href="tel:' + (t.phone || '') + '" style="color:#059669;font-weight:bold;">📞 Llamar</a> | <a href="sms:' + (t.phone || '') + '" style="color:#3b82f6;font-weight:bold;">💬 Texto</a></div></div>' });
        m.addListener('click', function() { iw.open(dispatchMap, m); });
        dispatchMarkers.push(m); bounds.extend(pos); hasMarkers = true;
    });

    // Trabajos en amarillo
    jobsData.forEach(function(j) {
        if (!j.lat || !j.lng) return;
        var pos = { lat: parseFloat(j.lat), lng: parseFloat(j.lng) };
        var techName = j.technicians ? j.technicians.name : 'Sin asignar';
        var m = new google.maps.Marker({ position: pos, map: dispatchMap, title: j.title,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: '#f59e0b', fillOpacity: 1, strokeColor: 'white', strokeWeight: 2 } });
        var iw = new google.maps.InfoWindow({ content: '<div style="color:#333;padding:8px;font-size:13px;"><strong>📋 ' + j.title + '</strong><br>📍 ' + (j.address || '') + '<br>👷 ' + techName + '<br><a href="https://www.google.com/maps/dir/?api=1&destination=' + j.lat + ',' + j.lng + '" target="_blank" style="color:#059669;font-weight:bold;">🧭 Navegar</a></div>' });
        m.addListener('click', function() { iw.open(dispatchMap, m); });
        dispatchMarkers.push(m); bounds.extend(pos); hasMarkers = true;
    });

    if (hasMarkers && dispatchMarkers.length > 1) dispatchMap.fitBounds(bounds);
    else if (hasMarkers) { dispatchMap.setCenter(bounds.getCenter()); dispatchMap.setZoom(14); }
}

// ===== GEOCODING =====
function geocodeAddress(address, latId, lngId) {
    new google.maps.Geocoder().geocode({ address: address }, function(results, status) {
        if (status === 'OK' && results.length > 0) {
            var loc = results[0].geometry.location;
            document.getElementById(latId).value = loc.lat().toFixed(6);
            document.getElementById(lngId).value = loc.lng().toFixed(6);
        } else { alert('No se encontró la dirección'); }
    });
}

// ===== TECHNICIAN GPS TRACKING PAGE =====
function initTrackingPage(techId) {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('techTrackingPage').style.display = 'block';
    window._trackTechId = techId;
    trackingMap = new google.maps.Map(document.getElementById('trackingMap'), {
        zoom: 15, center: { lat: 34.1083, lng: -117.2898 },
        styles: [{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] }]
    });
    // Load tech name
    sbClient.from('technicians').select('name,status').eq('id', techId).single().then(function(res) {
        if (res.data) {
            document.getElementById('trackingTechName').textContent = '👷 ' + res.data.name;
            updateTrackingUI(res.data.status);
        }
    });
    document.getElementById('trackingStatus').textContent = 'Listo para iniciar jornada';
}

function updateTrackingUI(status) {
    var clockBtn = document.getElementById('clockInBtn');
    var trackBtn = document.getElementById('trackingBtn');
    if (status === 'offline') {
        clockBtn.textContent = '🟢 Iniciar Jornada (Clock In)';
        clockBtn.className = 'btn-primary';
        trackBtn.style.display = 'none';
        document.getElementById('trackingStatus').textContent = 'Fuera de servicio';
        document.getElementById('trackingStatus').className = 'tracking-status';
    } else {
        clockBtn.textContent = '🔴 Terminar Jornada (Clock Out)';
        clockBtn.className = 'btn-primary btn-clockout';
        trackBtn.style.display = 'block';
        document.getElementById('trackingStatus').textContent = 'En servicio - ' + status;
        document.getElementById('trackingStatus').className = 'tracking-status active';
    }
}

async function toggleClockIn() {
    var techId = window._trackTechId;
    var res = await sbClient.from('technicians').select('status').eq('id', techId).single();
    if (!res.data) return;
    if (res.data.status === 'offline') {
        // Clock In
        await sbClient.from('technicians').update({ status: 'available' }).eq('id', techId);
        updateTrackingUI('available');
        // Auto start tracking
        if (!trackingInterval) toggleTracking();
    } else {
        // Clock Out
        if (trackingInterval) toggleTracking(); // stop tracking
        await sbClient.from('technicians').update({ status: 'offline', current_lat: null, current_lng: null }).eq('id', techId);
        updateTrackingUI('offline');
    }
}

function toggleTracking() {
    var btn = document.getElementById('trackingBtn');
    if (trackingInterval) {
        clearInterval(trackingInterval); trackingInterval = null;
        btn.textContent = '▶️ Reanudar Tracking GPS';
        document.getElementById('trackingInfo').textContent = 'Tracking pausado';
    } else {
        btn.textContent = '⏸️ Pausar Tracking GPS';
        sendLocation();
        trackingInterval = setInterval(sendLocation, 30000);
    }
}

function sendLocation() {
    if (!navigator.geolocation) { document.getElementById('trackingStatus').textContent = 'GPS no disponible'; return; }
    navigator.geolocation.getCurrentPosition(async function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var techId = window._trackTechId;
        await sbClient.from('technicians').update({ current_lat: lat, current_lng: lng, last_location_update: new Date().toISOString() }).eq('id', techId);
        await sbClient.from('technician_locations').insert({ technician_id: techId, lat: lat, lng: lng });
        if (trackingMap) { trackingMap.setCenter({ lat: lat, lng: lng }); }
        document.getElementById('trackingInfo').textContent = 'Última: ' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ' - ' + new Date().toLocaleTimeString('es');
    }, function(err) {
        document.getElementById('trackingStatus').textContent = 'Error GPS: ' + err.message;
        document.getElementById('trackingStatus').className = 'tracking-status error';
    }, { enableHighAccuracy: true });
}

// ===== SETTINGS =====
async function saveSettings() {
    if (!companyId) { alert('No hay empresa configurada'); return; }
    var name = document.getElementById('settingsCompanyName').value;
    var phone = document.getElementById('settingsPhone').value;
    var email = document.getElementById('settingsEmail').value;
    var res = await sbClient.from('companies').update({ name: name, phone: phone, email: email }).eq('id', companyId);
    if (res.error) { alert('Error: ' + res.error.message); return; }
    // Update all displays
    document.getElementById('companyDisplay').textContent = name;
    var sidebarName = document.querySelector('.sidebar-brand h2');
    if (sidebarName) sidebarName.textContent = name;
    document.title = name + ' - CRM HVACR';
    alert('✅ Configuración guardada');
}

// ===== LOGOUT =====
async function logout() { if (confirm('¿Cerrar sesión?')) { await sbClient.auth.signOut(); location.reload(); } }

// ===== REALTIME SUBSCRIPTIONS =====
function subscribeRealtime() {
    sbClient.channel('tech-locations').on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, function() {
        loadTechnicians().then(function() { if (dispatchMap) updateDispatchMap(); });
    }).subscribe();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async function() {
    // Check if tracking page
    var params = new URLSearchParams(window.location.search);
    var trackId = params.get('track');
    if (trackId) { initTrackingPage(trackId); return; }

    var session = await sbClient.auth.getSession();
    if (session.data.session && session.data.session.user) {
        currentUser = session.data.session.user;
        await loadCompanyId();
        showDashboard();
        subscribeRealtime();
    } else {
        document.getElementById('authPage').style.display = 'flex';
        document.getElementById('dashboardPage').style.display = 'none';
    }

    sbClient.auth.onAuthStateChange(function(event, session) {
        if (event === 'SIGNED_IN' && session) { currentUser = session.user; loadCompanyId().then(function() { showDashboard(); subscribeRealtime(); }); }
        else if (event === 'SIGNED_OUT') { location.reload(); }
    });

    // Geocode listeners
    var leadAddr = document.getElementById('leadAddress');
    if (leadAddr) leadAddr.addEventListener('blur', function() { if (this.value) geocodeAddress(this.value, 'leadLat', 'leadLng'); });
    var jobAddr = document.getElementById('jobAddress');
    if (jobAddr) jobAddr.addEventListener('blur', function() { if (this.value) geocodeAddress(this.value, 'jobLat', 'jobLng'); });

    // Equipment age check
    var ageInput = document.getElementById('estEquipAge');
    if (ageInput) ageInput.addEventListener('change', checkEquipAge);

    // Load saved logo
    loadSavedLogo();
});

// ===== COMPANY LOGO =====
function handleLogoUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var dataUrl = e.target.result;
        localStorage.setItem('tm_company_logo', dataUrl);
        applyLogo(dataUrl);
    };
    reader.readAsDataURL(file);
}

function applyLogo(dataUrl) {
    var logoContainer = document.getElementById('companyLogo');
    if (logoContainer) logoContainer.innerHTML = '<img src="' + dataUrl + '" alt="Logo">';
    var preview = document.getElementById('logoPreview');
    if (preview) preview.innerHTML = '<img src="' + dataUrl + '" alt="Logo">';
}

function resetLogo() {
    localStorage.removeItem('tm_company_logo');
    location.reload();
}

function loadSavedLogo() {
    var saved = localStorage.getItem('tm_company_logo');
    if (saved) applyLogo(saved);
}

// ===== ESTIMATE / PRICING CATALOG =====
var selectedEstItems = [];
var currentEquipType = null;
var serviceCallFee = 0;
var equipPhotos = [];

// Component catalog with pricing per equipment type
var componentCatalog = {
    ac_single: {
        label: '❄️ AC Single Stage',
        components: [
            { cat: 'Compresor', name: 'Compresor Single Stage (reemplazo)', price: 1850, labor: 650 },
            { cat: 'Compresor', name: 'Compresor - Diagnóstico y recarga', price: 85, labor: 150 },
            { cat: 'Condensador', name: 'Condensador de arranque (Start Capacitor)', price: 35, labor: 95 },
            { cat: 'Condensador', name: 'Condensador de marcha (Run Capacitor)', price: 25, labor: 95 },
            { cat: 'Condensador', name: 'Condensador Dual Run', price: 45, labor: 95 },
            { cat: 'Motor', name: 'Motor de Condensador (Condenser Fan Motor)', price: 285, labor: 185 },
            { cat: 'Motor', name: 'Motor del Evaporador (Blower Motor)', price: 350, labor: 225 },
            { cat: 'Contactor', name: 'Contactor (reemplazo)', price: 45, labor: 95 },
            { cat: 'Refrigerante', name: 'R-410A (por libra)', price: 85, labor: 0 },
            { cat: 'Refrigerante', name: 'R-22 (por libra)', price: 165, labor: 0 },
            { cat: 'Coil', name: 'Evaporator Coil (reemplazo)', price: 850, labor: 450 },
            { cat: 'Coil', name: 'Condenser Coil (reemplazo)', price: 750, labor: 350 },
            { cat: 'Coil', name: 'Limpieza de Coil (evaporador)', price: 0, labor: 185 },
            { cat: 'Coil', name: 'Limpieza de Coil (condensador)', price: 0, labor: 125 },
            { cat: 'Válvula', name: 'TXV / Válvula de Expansión', price: 185, labor: 285 },
            { cat: 'Válvula', name: 'Válvula Reversible (Check Valve)', price: 65, labor: 150 },
            { cat: 'Eléctrico', name: 'Transformer 24V', price: 35, labor: 85 },
            { cat: 'Eléctrico', name: 'Relay / Secuenciador', price: 45, labor: 95 },
            { cat: 'Eléctrico', name: 'Disconnect Box (reemplazo)', price: 55, labor: 95 },
            { cat: 'Eléctrico', name: 'Whip eléctrico (reemplazo)', price: 45, labor: 75 },
            { cat: 'Termostato', name: 'Termostato Básico (Honeywell)', price: 85, labor: 95 },
            { cat: 'Termostato', name: 'Termostato Smart (Ecobee/Nest)', price: 250, labor: 125 },
            { cat: 'Ductos', name: 'Reparación de ducto flexible', price: 45, labor: 150 },
            { cat: 'Ductos', name: 'Sello de ductos (Duct Seal)', price: 25, labor: 185 },
            { cat: 'Filtro', name: 'Filtro estándar (1")', price: 15, labor: 0 },
            { cat: 'Filtro', name: 'Filtro HEPA / Media Filter (4")', price: 65, labor: 45 },
            { cat: 'Drenaje', name: 'Limpieza de línea de drenaje', price: 0, labor: 125 },
            { cat: 'Drenaje', name: 'Float Switch (reemplazo)', price: 25, labor: 75 },
            { cat: 'Servicio', name: 'Tune-Up / Mantenimiento Completo', price: 0, labor: 185 },
            { cat: 'Servicio', name: 'Service Call / Diagnóstico', price: 0, labor: 89 },
            { cat: 'Servicio', name: 'Emergency / After Hours', price: 0, labor: 175 }
        ]
    },
    heat_pump: {
        label: '🔄 Heat Pump Single Stage',
        components: [
            { cat: 'Compresor', name: 'Compresor Heat Pump (reemplazo)', price: 2100, labor: 750 },
            { cat: 'Compresor', name: 'Compresor - Diagnóstico y recarga', price: 85, labor: 150 },
            { cat: 'Condensador', name: 'Condensador de arranque', price: 35, labor: 95 },
            { cat: 'Condensador', name: 'Condensador de marcha', price: 25, labor: 95 },
            { cat: 'Condensador', name: 'Condensador Dual Run', price: 45, labor: 95 },
            { cat: 'Motor', name: 'Motor de Condensador', price: 285, labor: 185 },
            { cat: 'Motor', name: 'Motor del Evaporador (Blower)', price: 350, labor: 225 },
            { cat: 'Contactor', name: 'Contactor (reemplazo)', price: 45, labor: 95 },
            { cat: 'Válvula', name: 'Reversing Valve (4-Way Valve)', price: 385, labor: 450 },
            { cat: 'Válvula', name: 'TXV / Válvula de Expansión', price: 185, labor: 285 },
            { cat: 'Válvula', name: 'Check Valve', price: 65, labor: 150 },
            { cat: 'Defrost', name: 'Defrost Board / Timer', price: 125, labor: 150 },
            { cat: 'Defrost', name: 'Defrost Sensor / Thermostat', price: 35, labor: 95 },
            { cat: 'Refrigerante', name: 'R-410A (por libra)', price: 85, labor: 0 },
            { cat: 'Coil', name: 'Evaporator Coil (reemplazo)', price: 850, labor: 450 },
            { cat: 'Coil', name: 'Condenser Coil (reemplazo)', price: 750, labor: 350 },
            { cat: 'Coil', name: 'Limpieza de Coils', price: 0, labor: 185 },
            { cat: 'Eléctrico', name: 'Transformer 24V', price: 35, labor: 85 },
            { cat: 'Eléctrico', name: 'Disconnect Box', price: 55, labor: 95 },
            { cat: 'Eléctrico', name: 'Heat Strips / Aux Heat Element', price: 185, labor: 195 },
            { cat: 'Termostato', name: 'Termostato Heat Pump Compatible', price: 125, labor: 95 },
            { cat: 'Termostato', name: 'Termostato Smart (Ecobee/Nest)', price: 250, labor: 125 },
            { cat: 'Servicio', name: 'Tune-Up / Mantenimiento Completo', price: 0, labor: 185 },
            { cat: 'Servicio', name: 'Service Call / Diagnóstico', price: 0, labor: 89 }
        ]
    },
    furnace_80: {
        label: '🔥 Furnace 80% AFUE - Cat I Induced Draft',
        components: [
            { cat: 'Motor', name: 'Inducer Motor (Draft Inducer)', price: 350, labor: 250 },
            { cat: 'Motor', name: 'Blower Motor (reemplazo)', price: 350, labor: 225 },
            { cat: 'Motor', name: 'Blower Motor Capacitor', price: 25, labor: 85 },
            { cat: 'Ignición', name: 'Hot Surface Ignitor (HSI)', price: 45, labor: 95 },
            { cat: 'Ignición', name: 'Spark Ignitor Module', price: 125, labor: 125 },
            { cat: 'Ignición', name: 'Pilot Assembly (standing pilot)', price: 75, labor: 125 },
            { cat: 'Sensor', name: 'Flame Sensor (limpieza/reemplazo)', price: 25, labor: 85 },
            { cat: 'Sensor', name: 'Limit Switch (High Limit)', price: 35, labor: 95 },
            { cat: 'Sensor', name: 'Rollout Switch', price: 25, labor: 85 },
            { cat: 'Sensor', name: 'Pressure Switch', price: 45, labor: 95 },
            { cat: 'Gas Valve', name: 'Gas Valve (reemplazo)', price: 285, labor: 195 },
            { cat: 'Gas Valve', name: 'Gas Valve - ajuste/calibración', price: 0, labor: 125 },
            { cat: 'Board', name: 'Control Board / Circuit Board', price: 385, labor: 195 },
            { cat: 'Board', name: 'Sequencer / Fan Relay', price: 45, labor: 95 },
            { cat: 'Intercambiador', name: 'Heat Exchanger (reemplazo)', price: 1250, labor: 850 },
            { cat: 'Intercambiador', name: 'Heat Exchanger - Inspección/Crack Test', price: 0, labor: 150 },
            { cat: 'Eléctrico', name: 'Transformer 24V', price: 35, labor: 85 },
            { cat: 'Eléctrico', name: 'Thermocouple', price: 25, labor: 75 },
            { cat: 'Filtro', name: 'Filtro estándar', price: 15, labor: 0 },
            { cat: 'Filtro', name: 'Filtro Media 4"', price: 65, labor: 45 },
            { cat: 'Ductos', name: 'Flue Pipe / Vent repair', price: 65, labor: 150 },
            { cat: 'Termostato', name: 'Termostato Básico', price: 85, labor: 95 },
            { cat: 'Termostato', name: 'Termostato Smart', price: 250, labor: 125 },
            { cat: 'Seguridad', name: 'CO Detector (instalación)', price: 45, labor: 65 },
            { cat: 'Servicio', name: 'Furnace Tune-Up Completo', price: 0, labor: 165 },
            { cat: 'Servicio', name: 'Service Call / Diagnóstico', price: 0, labor: 89 },
            { cat: 'Servicio', name: 'Emergency / After Hours', price: 0, labor: 175 }
        ]
    },
    furnace_90: {
        label: '🔥 Furnace 90%+ AFUE - Cat IV Condensing',
        components: [
            { cat: 'Motor', name: 'Inducer Motor (Draft Inducer)', price: 425, labor: 275 },
            { cat: 'Motor', name: 'Blower Motor ECM', price: 550, labor: 275 },
            { cat: 'Motor', name: 'Blower Motor Capacitor', price: 25, labor: 85 },
            { cat: 'Ignición', name: 'Hot Surface Ignitor', price: 45, labor: 95 },
            { cat: 'Sensor', name: 'Flame Sensor', price: 25, labor: 85 },
            { cat: 'Sensor', name: 'Limit Switch', price: 35, labor: 95 },
            { cat: 'Sensor', name: 'Pressure Switch', price: 55, labor: 95 },
            { cat: 'Sensor', name: 'Condensate Pressure Switch', price: 45, labor: 95 },
            { cat: 'Gas Valve', name: 'Gas Valve (reemplazo)', price: 325, labor: 225 },
            { cat: 'Board', name: 'Control Board (Integrated)', price: 485, labor: 225 },
            { cat: 'Intercambiador', name: 'Primary Heat Exchanger', price: 1450, labor: 950 },
            { cat: 'Intercambiador', name: 'Secondary Heat Exchanger', price: 1250, labor: 850 },
            { cat: 'Drenaje', name: 'Condensate Trap (limpieza/reemplazo)', price: 25, labor: 85 },
            { cat: 'Drenaje', name: 'Condensate Pump', price: 85, labor: 95 },
            { cat: 'Drenaje', name: 'Condensate Line (PVC repair)', price: 15, labor: 95 },
            { cat: 'Ductos', name: 'PVC Vent Pipe repair', price: 45, labor: 150 },
            { cat: 'Ductos', name: 'PVC Intake Pipe repair', price: 45, labor: 125 },
            { cat: 'Eléctrico', name: 'Transformer 24V', price: 35, labor: 85 },
            { cat: 'Termostato', name: 'Termostato Smart', price: 250, labor: 125 },
            { cat: 'Servicio', name: 'Furnace Tune-Up Completo', price: 0, labor: 185 },
            { cat: 'Servicio', name: 'Service Call / Diagnóstico', price: 0, labor: 89 }
        ]
    },
    mini_split: {
        label: '🌬️ Mini Split',
        components: [
            { cat: 'Compresor', name: 'Compresor Mini Split', price: 1650, labor: 550 },
            { cat: 'Board', name: 'PCB Indoor Unit', price: 285, labor: 175 },
            { cat: 'Board', name: 'PCB Outdoor Unit', price: 325, labor: 195 },
            { cat: 'Motor', name: 'Fan Motor Indoor', price: 185, labor: 150 },
            { cat: 'Motor', name: 'Fan Motor Outdoor', price: 225, labor: 165 },
            { cat: 'Sensor', name: 'Thermistor Sensor', price: 25, labor: 75 },
            { cat: 'Refrigerante', name: 'R-410A (por libra)', price: 85, labor: 0 },
            { cat: 'Drenaje', name: 'Drain Pump (reemplazo)', price: 65, labor: 95 },
            { cat: 'Línea', name: 'Line Set (por pie)', price: 12, labor: 15 },
            { cat: 'Servicio', name: 'Limpieza profunda Indoor/Outdoor', price: 0, labor: 225 },
            { cat: 'Servicio', name: 'Service Call / Diagnóstico', price: 0, labor: 89 }
        ]
    },
    package_unit: {
        label: '📦 Package Unit',
        components: [
            { cat: 'Compresor', name: 'Compresor Package Unit', price: 2200, labor: 750 },
            { cat: 'Motor', name: 'Condenser Fan Motor', price: 285, labor: 195 },
            { cat: 'Motor', name: 'Blower Motor', price: 375, labor: 250 },
            { cat: 'Condensador', name: 'Dual Run Capacitor', price: 45, labor: 95 },
            { cat: 'Contactor', name: 'Contactor', price: 45, labor: 95 },
            { cat: 'Gas Valve', name: 'Gas Valve', price: 285, labor: 195 },
            { cat: 'Ignición', name: 'Hot Surface Ignitor', price: 45, labor: 95 },
            { cat: 'Board', name: 'Control Board', price: 385, labor: 195 },
            { cat: 'Coil', name: 'Evaporator Coil', price: 950, labor: 550 },
            { cat: 'Refrigerante', name: 'R-410A (por libra)', price: 85, labor: 0 },
            { cat: 'Servicio', name: 'Tune-Up Completo', price: 0, labor: 195 },
            { cat: 'Servicio', name: 'Service Call / Diagnóstico', price: 0, labor: 89 }
        ]
    }
};

function selectEquipType(type) {
    currentEquipType = type;
    selectedEstItems = [];
    document.querySelectorAll('.equip-btn').forEach(function(b) { b.classList.remove('selected'); });
    event.target.closest('.equip-btn').classList.add('selected');
    checkEquipAge();
    renderComponentList();
}

function checkEquipAge() {
    var age = parseInt(document.getElementById('estEquipAge').value) || 0;
    var warn = document.getElementById('equipAgeWarning');
    if (age >= 15) { warn.style.display = 'block'; } else { warn.style.display = 'none'; }
}

function selectServiceCall(amount) {
    if (amount === -1) {
        document.getElementById('customServiceCall').style.display = 'block';
        serviceCallFee = 0;
    } else {
        document.getElementById('customServiceCall').style.display = 'none';
        serviceCallFee = amount;
    }
    updateEstimateTotals();
}

function handleClientDecision() {
    var decision = document.getElementById('estClientDecision').value;
    var compStep = document.getElementById('componentsStep');
    if (decision === 'yes') {
        compStep.style.display = 'block';
    } else if (decision === 'no') {
        compStep.style.display = 'none';
        selectedEstItems = [];
        updateEstimateSummary();
    } else if (decision === 'replace') {
        compStep.style.display = 'none';
        referToAdvisor();
    } else {
        compStep.style.display = 'block';
    }
    updateEstimateTotals();
}

function handleEquipPhotos(event) {
    var files = event.target.files;
    var grid = document.getElementById('photoPreviewGrid');
    equipPhotos = [];
    grid.innerHTML = '';
    for (var i = 0; i < files.length && i < 6; i++) {
        (function(file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                equipPhotos.push(e.target.result);
                var img = document.createElement('div');
                img.className = 'photo-thumb';
                img.innerHTML = '<img src="' + e.target.result + '"><button onclick="this.parentElement.remove()">X</button>';
                grid.appendChild(img);
            };
            reader.readAsDataURL(file);
        })(files[i]);
    }
}

function referToAdvisor() {
    document.getElementById('advisorReferralBox').style.display = 'block';
    populateAdvisorSelect();
}

// ===== HOME ADVISORS MODULE =====
var advisorsData = [];

function showAdvisorForm() { document.getElementById('advisorFormContainer').style.display = 'block'; }
function hideAdvisorForm() { document.getElementById('advisorFormContainer').style.display = 'none'; }

async function handleAdvisorCreate(e) {
    e.preventDefault();
    var advisor = {
        company_id: companyId,
        name: document.getElementById('advisorName').value,
        phone: document.getElementById('advisorPhone').value,
        email: document.getElementById('advisorEmail').value || null,
        specialty: document.getElementById('advisorSpecialty').value,
        zone: document.getElementById('advisorZone').value || null,
        status: 'active'
    };
    var res = await sbClient.from('home_advisors').insert([advisor]).select();
    if (res.error) { alert('Error: ' + res.error.message); return; }
    document.getElementById('advisorForm').reset();
    hideAdvisorForm();
    loadAdvisors();
}

async function loadAdvisors() {
    if (!companyId) return;
    var res = await sbClient.from('home_advisors').select('*').eq('company_id', companyId).order('name');
    advisorsData = res.data || [];
    renderAdvisorsList();
}

function renderAdvisorsList() {
    var c = document.getElementById('advisorsList');
    if (!c) return;
    if (advisorsData.length === 0) { c.innerHTML = '<p class="empty-msg">No hay Home Advisors registrados</p>'; return; }
    var h = '<table class="data-table"><thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Especialidad</th><th>Zona</th><th>Status</th><th>Acciones</th></tr></thead><tbody>';
    advisorsData.forEach(function(a) {
        var statusColor = a.status === 'active' ? '#10b981' : '#94a3b8';
        h += '<tr>';
        h += '<td><strong>🏠 ' + a.name + '</strong></td>';
        h += '<td><a href="tel:' + a.phone + '">' + a.phone + '</a></td>';
        h += '<td>' + (a.email || '-') + '</td>';
        h += '<td>' + (a.specialty || '-') + '</td>';
        h += '<td>' + (a.zone || '-') + '</td>';
        h += '<td><span style="color:' + statusColor + ';font-weight:600;">' + (a.status === 'active' ? '🟢 Activo' : '⚫ Inactivo') + '</span></td>';
        h += '<td><button class="btn-sm" onclick="callAdvisor(\'' + a.phone + '\')">📞</button> <button class="btn-sm" onclick="textAdvisor(\'' + a.phone + '\')">💬</button></td>';
        h += '</tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

function callAdvisor(phone) { window.open('tel:' + phone); }
function textAdvisor(phone) { window.open('sms:' + phone); }

function populateAdvisorSelect() {
    var sel = document.getElementById('estAdvisorSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar Advisor...</option>';
    advisorsData.forEach(function(a) {
        if (a.status === 'active') sel.innerHTML += '<option value="' + a.id + '">' + a.name + ' - ' + a.phone + ' (' + (a.specialty || '') + ')</option>';
    });
}

async function sendReferralToAdvisor() {
    var advisorId = document.getElementById('estAdvisorSelect').value;
    if (!advisorId) { alert('Selecciona un Home Advisor'); return; }
    var advisor = advisorsData.find(function(a) { return a.id === advisorId; });

    var jobSel = document.getElementById('estJobSelect');
    var job = jobSel.value ? jobsData.find(function(j) { return j.id === jobSel.value; }) : null;
    var model = document.getElementById('estModelNum').value;
    var serial = document.getElementById('estSerialNum').value;
    var brand = document.getElementById('estBrand').value;
    var age = document.getElementById('estEquipAge').value;
    var equipType = currentEquipType ? componentCatalog[currentEquipType].label : 'N/A';
    var urgency = document.getElementById('referralUrgency').value;
    var notes = document.getElementById('referralNotes').value;

    // Save referral to DB
    var referral = {
        company_id: companyId,
        advisor_id: advisorId,
        job_id: job ? job.id : null,
        client_name: job ? job.title : 'N/A',
        address: job ? job.address : 'N/A',
        phone: job ? job.phone : '',
        equipment_type: equipType,
        brand: brand || null,
        model_number: model || null,
        serial_number: serial || null,
        equipment_age: age ? parseInt(age) : null,
        urgency: urgency,
        notes: notes || null,
        status: 'pending'
    };
    var res = await sbClient.from('advisor_referrals').insert([referral]).select();
    if (res.error) { 
        alert('Error guardando referencia: ' + res.error.message + '\n\nNota: Puede que necesites crear la tabla advisor_referrals en Supabase.'); 
    }

    // Send SMS to advisor
    var msg = '🏠 NUEVA REFERENCIA - Trade Master\n\n';
    msg += 'Cliente: ' + (job ? job.title : 'N/A') + '\n';
    msg += 'Dir: ' + (job ? job.address : 'N/A') + '\n';
    msg += 'Tel: ' + (job ? (job.phone || '') : '') + '\n';
    msg += 'Equipo: ' + equipType + '\n';
    msg += 'Marca: ' + (brand || '?') + ' | Modelo: ' + (model || '?') + '\n';
    msg += 'Edad: ' + (age || '?') + ' años\n';
    msg += 'Urgencia: ' + urgency + '\n';
    if (notes) msg += 'Notas: ' + notes + '\n';

    // Open SMS to advisor
    window.open('sms:' + advisor.phone + '?body=' + encodeURIComponent(msg));
    alert('✅ Referencia enviada a ' + advisor.name + '\n\nSe abrirá SMS para confirmar.');
    loadReferrals();
}

async function loadReferrals() {
    if (!companyId) return;
    var res = await sbClient.from('advisor_referrals').select('*, home_advisors(name, phone)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20);
    var referrals = res.data || [];
    renderReferrals(referrals);
}

function renderReferrals(referrals) {
    var c = document.getElementById('referralsList');
    if (!c) return;
    if (referrals.length === 0) { c.innerHTML = '<p class="empty-msg">No hay referencias todavía</p>'; return; }
    var h = '<table class="data-table"><thead><tr><th>Cliente</th><th>Equipo</th><th>Advisor</th><th>Urgencia</th><th>Status</th></tr></thead><tbody>';
    referrals.forEach(function(r) {
        var urgColor = r.urgency === 'urgente' ? '#ef4444' : r.urgency === 'programar' ? '#3b82f6' : '#94a3b8';
        var statusBadge = r.status === 'pending' ? '🟡 Pendiente' : r.status === 'contacted' ? '🔵 Contactado' : r.status === 'sold' ? '🟢 Vendido' : '⚫ ' + r.status;
        h += '<tr>';
        h += '<td><strong>' + (r.client_name || '-') + '</strong><br><small>' + (r.address || '') + '</small></td>';
        h += '<td>' + (r.equipment_type || '-') + '<br><small>' + (r.brand || '') + ' ' + (r.model_number || '') + '</small></td>';
        h += '<td>' + (r.home_advisors ? r.home_advisors.name : '-') + '</td>';
        h += '<td style="color:' + urgColor + ';font-weight:600;">' + r.urgency + '</td>';
        h += '<td>' + statusBadge + '</td>';
        h += '</tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

function renderComponentList() {
    var c = document.getElementById('componentsList');
    if (!currentEquipType) { c.innerHTML = '<p class="empty-msg">Selecciona un tipo de equipo primero</p>'; return; }
    var equip = componentCatalog[currentEquipType];
    var cats = {};
    equip.components.forEach(function(comp) {
        if (!cats[comp.cat]) cats[comp.cat] = [];
        cats[comp.cat].push(comp);
    });

    var h = '<div class="comp-catalog">';
    Object.keys(cats).forEach(function(cat) {
        h += '<div class="comp-category"><h5>' + cat + '</h5>';
        cats[cat].forEach(function(comp, idx) {
            var total = comp.price + comp.labor;
            var compId = currentEquipType + '_' + cat + '_' + idx;
            var isSelected = selectedEstItems.find(function(s) { return s.id === compId; });
            h += '<div class="comp-item ' + (isSelected ? 'selected' : '') + '" onclick="toggleComponent(\'' + compId + '\')">';
            h += '<div class="comp-info"><span class="comp-name">' + comp.name + '</span>';
            h += '<span class="comp-detail">Parte: $' + comp.price.toFixed(0) + ' | Labor: $' + comp.labor.toFixed(0) + '</span></div>';
            h += '<div class="comp-price">$' + total.toFixed(0) + '</div>';
            if (isSelected) h += '<span class="comp-qty">x<input type="number" value="' + isSelected.qty + '" min="1" max="99" onclick="event.stopPropagation()" onchange="updateCompQty(\'' + compId + '\', this.value)"></span>';
            h += '</div>';
        });
        h += '</div>';
    });
    c.innerHTML = h + '</div>';
    updateEstimateSummary();
}

function toggleComponent(compId) {
    var idx = selectedEstItems.findIndex(function(s) { return s.id === compId; });
    if (idx >= 0) { selectedEstItems.splice(idx, 1); }
    else {
        var parts = compId.split('_');
        var type = parts[0] + '_' + parts[1];
        var cat = parts.slice(2, parts.length - 1).join('_');
        var compIdx = parseInt(parts[parts.length - 1]);
        // Find the component
        var equip = componentCatalog[currentEquipType];
        var catComps = {};
        equip.components.forEach(function(c) { if (!catComps[c.cat]) catComps[c.cat] = []; catComps[c.cat].push(c); });
        var allByOrder = equip.components;
        var counter = {};
        var found = null;
        equip.components.forEach(function(c) {
            if (!counter[c.cat]) counter[c.cat] = 0;
            var thisId = currentEquipType + '_' + c.cat + '_' + counter[c.cat];
            if (thisId === compId) found = c;
            counter[c.cat]++;
        });
        if (found) selectedEstItems.push({ id: compId, name: found.name, price: found.price, labor: found.labor, qty: 1 });
    }
    renderComponentList();
}

function updateCompQty(compId, qty) {
    var item = selectedEstItems.find(function(s) { return s.id === compId; });
    if (item) { item.qty = parseInt(qty) || 1; updateEstimateSummary(); }
}

function updateEstimateSummary() {
    var c = document.getElementById('estimateSummary');
    var decision = document.getElementById('estClientDecision').value;
    if (selectedEstItems.length === 0 && decision !== 'no') { 
        c.innerHTML = '<p class="empty-msg">Selecciona componentes arriba</p>'; 
        updateEstimateTotals();
        return; 
    }
    if (decision === 'no') {
        c.innerHTML = '<div style="padding:12px;background:rgba(245,158,11,0.05);border-radius:8px;color:var(--warning);text-align:center;"><strong>⚠️ Cliente declinó reparación — Solo Service Call</strong></div>';
        updateEstimateTotals();
        return;
    }
    var h = '<table class="est-table"><thead><tr><th>Componente</th><th>Cant</th><th>Parte</th><th>Labor</th><th>Total</th><th></th></tr></thead><tbody>';
    selectedEstItems.forEach(function(item) {
        var lineTotal = (item.price + item.labor) * item.qty;
        h += '<tr><td>' + item.name + '</td><td>' + item.qty + '</td>';
        h += '<td>$' + (item.price * item.qty).toFixed(2) + '</td>';
        h += '<td>$' + (item.labor * item.qty).toFixed(2) + '</td>';
        h += '<td><strong>$' + lineTotal.toFixed(2) + '</strong></td>';
        h += '<td><button class="btn-danger-sm" onclick="removeEstItem(\'' + item.id + '\')">X</button></td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
    updateEstimateTotals();
}

function removeEstItem(compId) {
    selectedEstItems = selectedEstItems.filter(function(s) { return s.id !== compId; });
    renderComponentList();
}

function updateEstimateTotals() {
    var subtotal = 0, partsTotal = 0, laborTotal = 0;
    var decision = document.getElementById('estClientDecision').value;
    
    selectedEstItems.forEach(function(item) {
        partsTotal += item.price * item.qty;
        laborTotal += item.labor * item.qty;
    });
    subtotal = partsTotal + laborTotal;
    
    var discount = parseFloat(document.getElementById('estDiscount').value) || 0;
    var discountAmt = subtotal * (discount / 100);
    var afterDiscount = subtotal - discountAmt;
    var taxRate = parseFloat(document.getElementById('estTax').value) || 0;
    var taxAmt = afterDiscount * (taxRate / 100);
    var repairTotal = afterDiscount + taxAmt;
    
    // Service call ALWAYS added
    var scFee = serviceCallFee || 0;
    var grandTotal = repairTotal + scFee;

    // If client declines, only charge service call + tax on service call
    if (decision === 'no') { 
        var scTax = scFee * (taxRate / 100);
        grandTotal = scFee + scTax; 
    }

    var h = '<div class="totals-grid">';
    h += '<div class="total-row sc-row"><span>🚐 Service Call:</span><span>$' + scFee.toFixed(2) + '</span></div>';
    if (decision !== 'no') {
        h += '<div class="total-row"><span>Partes:</span><span>$' + partsTotal.toFixed(2) + '</span></div>';
        h += '<div class="total-row"><span>Labor:</span><span>$' + laborTotal.toFixed(2) + '</span></div>';
        h += '<div class="total-row"><span>Subtotal:</span><span>$' + subtotal.toFixed(2) + '</span></div>';
        if (discount > 0) h += '<div class="total-row discount"><span>Descuento (' + discount + '%):</span><span>-$' + discountAmt.toFixed(2) + '</span></div>';
        h += '<div class="total-row"><span>Tax (' + taxRate + '%):</span><span>$' + taxAmt.toFixed(2) + '</span></div>';
    } else {
        var scTaxAmt = scFee * (taxRate / 100);
        h += '<div class="total-row"><span>Tax (' + taxRate + '%):</span><span>$' + scTaxAmt.toFixed(2) + '</span></div>';
        h += '<div class="total-row" style="color:var(--warning);"><span>⚠️ Cliente declinó reparación</span><span></span></div>';
    }
    h += '<div class="total-row grand"><span>TOTAL:</span><span>$' + grandTotal.toFixed(2) + '</span></div>';
    h += '</div>';
    document.getElementById('estimateTotals').innerHTML = h;
}

function loadEstimateJob() {
    var sel = document.getElementById('estJobSelect');
    var info = document.getElementById('estJobInfo');
    var job = jobsData.find(function(j) { return j.id === sel.value; });
    if (!job) { info.style.display = 'none'; return; }
    var techName = job.technicians ? job.technicians.name : 'Sin asignar';
    info.innerHTML = '<strong>' + job.title + '</strong> | 📍 ' + (job.address || '') + ' | 👷 ' + techName;
    info.style.display = 'block';
}

function populateEstimateJobs() {
    var sel = document.getElementById('estJobSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar trabajo...</option>';
    jobsData.forEach(function(j) { sel.innerHTML += '<option value="' + j.id + '">' + j.title + ' - ' + (j.address || '') + '</option>'; });
}

function presentEstimateToClient() {
    var decision = document.getElementById('estClientDecision').value;
    if (selectedEstItems.length === 0 && decision !== 'no') { alert('Agrega componentes primero'); return; }
    if (!serviceCallFee && serviceCallFee !== 0) { alert('Selecciona tarifa de Service Call'); return; }
    var equip = currentEquipType ? componentCatalog[currentEquipType] : { label: 'Servicio General' };
    var discount = parseFloat(document.getElementById('estDiscount').value) || 0;
    var taxRate = parseFloat(document.getElementById('estTax').value) || 0;
    var subtotal = 0;
    selectedEstItems.forEach(function(i) { subtotal += (i.price + i.labor) * i.qty; });
    var discountAmt = subtotal * (discount / 100);
    var afterDiscount = subtotal - discountAmt;
    var taxAmt = afterDiscount * (taxRate / 100);
    var repairTotal = afterDiscount + taxAmt;
    var scFee = serviceCallFee || 0;
    var scTax = scFee * (taxRate / 100);
    var grandTotal = (decision === 'no') ? (scFee + scTax) : (repairTotal + scFee);

    // Get tech name from selected job
    var techName = '';
    var jobSel = document.getElementById('estJobSelect');
    if (jobSel && jobSel.value) {
        var job = jobsData.find(function(j) { return j.id === jobSel.value; });
        if (job && job.technicians) techName = job.technicians.name;
    }
    // Get today's date formatted
    var today = new Date();
    var dateStr = (today.getMonth()+1) + '/' + today.getDate() + '/' + today.getFullYear();

    var w = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Estimado - Trade Master</title>';
    html += '<style>';
    html += '*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;background:#f9fafb}';
    html += '.header{text-align:center;padding:20px;border-bottom:3px solid #10b981;margin-bottom:20px}';
    html += '.header h1{color:#10b981;font-size:24px}.header p{color:#666;font-size:14px}';
    html += 'table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#10b981;color:white;padding:10px;text-align:left;font-size:13px}';
    html += 'td{padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:13px}';
    html += '.total-section{margin-top:20px;text-align:right}';
    html += '.total-line{display:flex;justify-content:flex-end;gap:40px;padding:4px 0;font-size:14px}';
    html += '.grand{font-size:20px;font-weight:bold;color:#10b981;border-top:2px solid #10b981;padding-top:8px;margin-top:8px}';
    html += '.notes{margin-top:20px;padding:16px;background:#f0fdf4;border-radius:8px;font-size:13px}';
    html += '.sig-section{margin-top:30px;display:flex;gap:20px;flex-wrap:wrap}';
    html += '.sig-box{flex:1;min-width:250px;text-align:center}';
    html += '.sig-box label{display:block;font-size:13px;font-weight:bold;color:#333;margin-bottom:6px}';
    html += '.sig-canvas{border:2px solid #ccc;border-radius:8px;background:white;cursor:crosshair;touch-action:none;width:100%;height:120px}';
    html += '.sig-canvas.signed{border-color:#10b981}';
    html += '.sig-actions{margin-top:4px;display:flex;gap:8px;justify-content:center}';
    html += '.sig-actions button{padding:4px 12px;font-size:11px;border:1px solid #ccc;border-radius:4px;cursor:pointer;background:#f9fafb}';
    html += '.sig-actions button:hover{background:#e5e7eb}';
    html += '.date-box{flex:0 0 200px;text-align:center}';
    html += '.date-display{font-size:18px;font-weight:bold;color:#333;padding:10px;border:2px solid #10b981;border-radius:8px;background:#f0fdf4;margin-top:6px}';
    html += '.tech-display{font-size:16px;font-weight:bold;color:#10b981;margin-top:6px}';
    html += '.print-bar{text-align:center;margin:20px 0;padding:16px;background:#f0fdf4;border-radius:8px}';
    html += '.print-bar button{padding:10px 24px;font-size:14px;font-weight:bold;border:none;border-radius:6px;cursor:pointer;margin:0 6px}';
    html += '.btn-print{background:#10b981;color:white}.btn-print:hover{background:#059669}';
    html += '.btn-save{background:#3b82f6;color:white}.btn-save:hover{background:#2563eb}';
    html += '@media print{.print-bar{display:none}.sig-actions{display:none}}';
    html += '</style></head><body>';

    // Header
    html += '<div class="header"><h1>🔧 Trade Master</h1><p>' + (decision === 'no' ? 'Recibo de Service Call' : 'Estimado de Servicio') + '</p><p style="margin-top:8px;">' + equip.label + '</p></div>';

    // Equipment info
    var model = document.getElementById('estModelNum').value;
    var serial = document.getElementById('estSerialNum').value;
    var brand = document.getElementById('estBrand').value;
    if (model || serial || brand) {
        html += '<div style="padding:10px;background:#f0fdf4;border-radius:8px;margin-bottom:16px;font-size:13px;">';
        if (brand) html += '<strong>Marca:</strong> ' + brand + ' &nbsp;|&nbsp; ';
        if (model) html += '<strong>Modelo:</strong> ' + model + ' &nbsp;|&nbsp; ';
        if (serial) html += '<strong>Serial:</strong> ' + serial;
        html += '</div>';
    }

    // Table (only if repair approved)
    if (decision !== 'no' && selectedEstItems.length > 0) {
        html += '<table><thead><tr><th>Componente</th><th>Cant</th><th>Parte</th><th>Labor</th><th>Total</th></tr></thead><tbody>';
        selectedEstItems.forEach(function(i) {
            html += '<tr><td>' + i.name + '</td><td>' + i.qty + '</td><td>$' + (i.price*i.qty).toFixed(2) + '</td><td>$' + (i.labor*i.qty).toFixed(2) + '</td><td><strong>$' + ((i.price+i.labor)*i.qty).toFixed(2) + '</strong></td></tr>';
        });
        html += '</tbody></table>';
    }

    // Totals
    html += '<div class="total-section">';
    html += '<div class="total-line" style="color:#e67e22;font-weight:bold;"><span>🚐 Service Call:</span><span>$' + scFee.toFixed(2) + '</span></div>';
    if (decision !== 'no' && selectedEstItems.length > 0) {
        html += '<div class="total-line"><span>Partes + Labor:</span><span>$' + subtotal.toFixed(2) + '</span></div>';
        if (discount > 0) html += '<div class="total-line"><span>Descuento (' + discount + '%):</span><span>-$' + discountAmt.toFixed(2) + '</span></div>';
        html += '<div class="total-line"><span>Tax (' + taxRate + '%):</span><span>$' + taxAmt.toFixed(2) + '</span></div>';
    } else {
        html += '<div class="total-line"><span>Tax (' + taxRate + '%):</span><span>$' + scTax.toFixed(2) + '</span></div>';
    }
    html += '<div class="total-line grand"><span>TOTAL:</span><span>$' + grandTotal.toFixed(2) + '</span></div></div>';

    // Notes
    var notes = document.getElementById('estNotes').value;
    if (notes) html += '<div class="notes"><strong>Notas:</strong><br>' + notes + '</div>';

    // Signature section with canvas pads
    html += '<div class="sig-section">';
    html += '<div class="sig-box"><label>✍️ Firma del Cliente</label><canvas id="sigClient" class="sig-canvas" width="300" height="120"></canvas>';
    html += '<div class="sig-actions"><button onclick="clearSig(\'sigClient\')">🗑️ Borrar</button></div></div>';
    html += '<div class="sig-box"><label>👷 Técnico</label><div class="tech-display">' + (techName || 'N/A') + '</div>';
    html += '<canvas id="sigTech" class="sig-canvas" width="300" height="120" style="margin-top:10px;"></canvas>';
    html += '<div class="sig-actions"><button onclick="clearSig(\'sigTech\')">🗑️ Borrar</button></div></div>';
    html += '<div class="date-box"><label>📅 Fecha</label><div class="date-display">' + dateStr + '</div></div>';
    html += '</div>';

    // Print / Save bar
    html += '<div class="print-bar">';
    html += '<button class="btn-print" onclick="window.print()">🖨️ Imprimir / PDF</button>';
    html += '</div>';

    html += '<p style="text-align:center;margin-top:20px;color:#999;font-size:11px;">Generado por Trade Master CRM | trademastersusa.org</p>';

    // Signature pad JavaScript
    html += '<script>';
    html += 'function initSigPad(canvasId){';
    html += '  var c=document.getElementById(canvasId),ctx=c.getContext("2d");';
    html += '  var drawing=false,lastX=0,lastY=0;';
    html += '  c.width=c.offsetWidth;c.height=c.offsetHeight;';
    html += '  ctx.strokeStyle="#333";ctx.lineWidth=2;ctx.lineCap="round";ctx.lineJoin="round";';
    html += '  function getPos(e){var r=c.getBoundingClientRect();var t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}';
    html += '  function startDraw(e){e.preventDefault();drawing=true;var p=getPos(e);lastX=p.x;lastY=p.y;}';
    html += '  function draw(e){e.preventDefault();if(!drawing)return;var p=getPos(e);ctx.beginPath();ctx.moveTo(lastX,lastY);ctx.lineTo(p.x,p.y);ctx.stroke();lastX=p.x;lastY=p.y;}';
    html += '  function stopDraw(){if(drawing){drawing=false;c.classList.add("signed");}}';
    html += '  c.addEventListener("mousedown",startDraw);c.addEventListener("mousemove",draw);c.addEventListener("mouseup",stopDraw);c.addEventListener("mouseleave",stopDraw);';
    html += '  c.addEventListener("touchstart",startDraw,{passive:false});c.addEventListener("touchmove",draw,{passive:false});c.addEventListener("touchend",stopDraw);';
    html += '}';
    html += 'function clearSig(id){var c=document.getElementById(id);var ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);c.classList.remove("signed");}';
    html += 'window.onload=function(){initSigPad("sigClient");initSigPad("sigTech");};';
    html += '<\/script>';
    html += '</body></html>';
    w.document.write(html);
    w.document.close();
}

function generateEstimatePDF() { presentEstimateToClient(); }

// ===== INVOICES MODULE =====
var invoicesData = [];
var invoiceLineCounter = 0;
var editingInvoiceId = null;

function showInvoiceForm() {
    document.getElementById('invoiceFormContainer').style.display = 'block';
    document.getElementById('invoiceForm').reset();
    editingInvoiceId = null;
    invoiceLineCounter = 0;
    document.getElementById('invoiceLines').innerHTML = '';
    addInvoiceLine(); // Start with one line
    populateInvoiceSelects();
    calcInvoiceTotals();
    // Set default due date to 30 days from now
    var d = new Date(); d.setDate(d.getDate() + 30);
    document.getElementById('invDueDate').value = d.toISOString().split('T')[0];
}
function hideInvoiceForm() { document.getElementById('invoiceFormContainer').style.display = 'none'; editingInvoiceId = null; }

function populateInvoiceSelects() {
    // Jobs select
    var jobSel = document.getElementById('invJobSelect');
    jobSel.innerHTML = '<option value="">— Factura manual —</option>';
    jobsData.forEach(function(j) {
        jobSel.innerHTML += '<option value="' + j.id + '">' + j.title + ' - ' + (j.address || 'Sin dirección') + '</option>';
    });
    // Tech select
    var techSel = document.getElementById('invTechSelect');
    techSel.innerHTML = '<option value="">Seleccionar...</option>';
    techsData.forEach(function(t) {
        techSel.innerHTML += '<option value="' + t.id + '">' + t.name + '</option>';
    });
}

function loadInvoiceFromJob() {
    var jobId = document.getElementById('invJobSelect').value;
    if (!jobId) return;
    var job = jobsData.find(function(j) { return j.id === jobId; });
    if (!job) return;
    document.getElementById('invClientName').value = job.title || '';
    document.getElementById('invClientAddress').value = job.address || '';
    if (job.technician_id) document.getElementById('invTechSelect').value = job.technician_id;
    if (job.notes) document.getElementById('invNotes').value = job.notes;
}

function addInvoiceLine() {
    var container = document.getElementById('invoiceLines');
    var lineId = 'inv_line_' + invoiceLineCounter++;
    var div = document.createElement('div');
    div.id = lineId;
    div.className = 'invoice-line-row';
    div.innerHTML = '<div class="form-row" style="align-items:end;">' +
        '<div class="form-group" style="flex:3;"><label>Descripción</label><input type="text" class="inv-line-desc" placeholder="Descripción del servicio/parte"></div>' +
        '<div class="form-group" style="flex:0.5;"><label>Cant</label><input type="number" class="inv-line-qty" value="1" min="1" onchange="calcInvoiceTotals()"></div>' +
        '<div class="form-group" style="flex:1;"><label>Parte $</label><input type="number" class="inv-line-price" value="0" min="0" step="0.01" onchange="calcInvoiceTotals()"></div>' +
        '<div class="form-group" style="flex:1;"><label>Labor $</label><input type="number" class="inv-line-labor" value="0" min="0" step="0.01" onchange="calcInvoiceTotals()"></div>' +
        '<div class="form-group" style="flex:0.8;"><label>Total</label><span class="inv-line-total" style="display:block;padding:10px 0;font-weight:700;color:var(--accent);">$0.00</span></div>' +
        '<button type="button" class="btn-danger-sm" onclick="removeInvoiceLine(\'' + lineId + '\')" style="margin-bottom:16px;align-self:end;">✕</button>' +
        '</div>';
    container.appendChild(div);
    calcInvoiceTotals();
}

function removeInvoiceLine(lineId) {
    var el = document.getElementById(lineId);
    if (el) el.remove();
    calcInvoiceTotals();
}

function getInvoiceLines() {
    var lines = [];
    document.querySelectorAll('.invoice-line-row').forEach(function(row) {
        var desc = row.querySelector('.inv-line-desc').value;
        var qty = parseFloat(row.querySelector('.inv-line-qty').value) || 1;
        var price = parseFloat(row.querySelector('.inv-line-price').value) || 0;
        var labor = parseFloat(row.querySelector('.inv-line-labor').value) || 0;
        var total = (price + labor) * qty;
        if (desc) lines.push({ name: desc, qty: qty, unit_price: price, labor: labor, total: total });
    });
    return lines;
}

function calcInvoiceTotals() {
    var partsTotal = 0, laborTotal = 0;
    document.querySelectorAll('.invoice-line-row').forEach(function(row) {
        var qty = parseFloat(row.querySelector('.inv-line-qty').value) || 1;
        var price = parseFloat(row.querySelector('.inv-line-price').value) || 0;
        var labor = parseFloat(row.querySelector('.inv-line-labor').value) || 0;
        var lineTotal = (price + labor) * qty;
        partsTotal += price * qty;
        laborTotal += labor * qty;
        row.querySelector('.inv-line-total').textContent = '$' + lineTotal.toFixed(2);
    });
    var subtotal = partsTotal + laborTotal;
    var scFee = parseFloat(document.getElementById('invServiceCall').value) || 0;
    var discPct = parseFloat(document.getElementById('invDiscount').value) || 0;
    var discAmt = subtotal * (discPct / 100);
    var afterDisc = subtotal - discAmt;
    var taxPct = parseFloat(document.getElementById('invTax').value) || 0;
    var taxAmt = (afterDisc + scFee) * (taxPct / 100);
    var grand = afterDisc + scFee + taxAmt;

    var h = '<div class="totals-grid">';
    if (scFee > 0) h += '<div class="total-row sc-row"><span>🚐 Service Call:</span><span>$' + scFee.toFixed(2) + '</span></div>';
    h += '<div class="total-row"><span>Partes:</span><span>$' + partsTotal.toFixed(2) + '</span></div>';
    h += '<div class="total-row"><span>Labor:</span><span>$' + laborTotal.toFixed(2) + '</span></div>';
    h += '<div class="total-row"><span>Subtotal:</span><span>$' + subtotal.toFixed(2) + '</span></div>';
    if (discPct > 0) h += '<div class="total-row discount"><span>Descuento (' + discPct + '%):</span><span>-$' + discAmt.toFixed(2) + '</span></div>';
    h += '<div class="total-row"><span>Tax (' + taxPct + '%):</span><span>$' + taxAmt.toFixed(2) + '</span></div>';
    h += '<div class="total-row grand"><span>TOTAL:</span><span>$' + grand.toFixed(2) + '</span></div>';
    h += '</div>';
    document.getElementById('invoiceTotalsPreview').innerHTML = h;
    return { subtotal: subtotal, scFee: scFee, discPct: discPct, discAmt: discAmt, taxPct: taxPct, taxAmt: taxAmt, total: grand };
}

function generateInvoiceNumber() {
    var now = new Date();
    var num = 'INV-' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + '-' + String(Math.floor(Math.random()*9000)+1000);
    return num;
}

async function handleInvoiceCreate(event) {
    event.preventDefault();
    var lines = getInvoiceLines();
    if (lines.length === 0) { alert('Agrega al menos una línea a la factura'); return; }
    var totals = calcInvoiceTotals();
    var techId = document.getElementById('invTechSelect').value || null;
    var jobId = document.getElementById('invJobSelect').value || null;
    var data = {
        company_id: companyId,
        invoice_number: editingInvoiceId ? undefined : generateInvoiceNumber(),
        job_id: jobId,
        technician_id: techId,
        client_name: document.getElementById('invClientName').value,
        client_email: document.getElementById('invClientEmail').value,
        client_phone: document.getElementById('invClientPhone').value,
        client_address: document.getElementById('invClientAddress').value,
        line_items: lines,
        service_call_fee: totals.scFee,
        subtotal: totals.subtotal,
        discount_percent: totals.discPct,
        discount_amount: totals.discAmt,
        tax_percent: totals.taxPct,
        tax_amount: totals.taxAmt,
        total: totals.total,
        balance_due: totals.total,
        amount_paid: 0,
        due_date: document.getElementById('invDueDate').value || null,
        notes: document.getElementById('invNotes').value,
        internal_notes: document.getElementById('invInternalNotes').value,
        status: 'draft'
    };

    if (editingInvoiceId) {
        delete data.invoice_number;
        delete data.company_id;
        await sbClient.from('invoices').update(data).eq('id', editingInvoiceId);
        alert('¡Factura actualizada!');
    } else {
        await sbClient.from('invoices').insert(data);
        alert('¡Factura creada!');
    }
    hideInvoiceForm();
    await loadInvoices();
}

async function loadInvoices() {
    if (!companyId) return;
    var res = await sbClient.from('invoices').select('*, technicians(name)').eq('company_id', companyId).order('created_at', { ascending: false });
    invoicesData = res.data || [];
    // Auto-check overdue
    var today = new Date().toISOString().split('T')[0];
    invoicesData.forEach(function(inv) {
        if (inv.due_date && inv.due_date < today && (inv.status === 'sent' || inv.status === 'partial')) {
            sbClient.from('invoices').update({ status: 'overdue' }).eq('id', inv.id);
            inv.status = 'overdue';
        }
    });
    renderInvoiceKPIs();
    renderInvoicesTable();
}

function renderInvoiceKPIs() {
    var totalRevenue = 0, totalPending = 0, totalOverdue = 0, paidCount = 0;
    invoicesData.forEach(function(inv) {
        if (inv.status === 'paid') { totalRevenue += parseFloat(inv.total) || 0; paidCount++; }
        if (inv.status === 'sent' || inv.status === 'partial') totalPending += parseFloat(inv.balance_due) || 0;
        if (inv.status === 'overdue') totalOverdue += parseFloat(inv.balance_due) || 0;
    });
    var h = '<div class="invoice-kpi-row">';
    h += '<div class="inv-kpi"><span class="inv-kpi-icon">💰</span><span class="inv-kpi-value">$' + totalRevenue.toLocaleString('en-US', {minimumFractionDigits:2}) + '</span><span class="inv-kpi-label">Cobrado</span></div>';
    h += '<div class="inv-kpi"><span class="inv-kpi-icon">⏳</span><span class="inv-kpi-value">$' + totalPending.toLocaleString('en-US', {minimumFractionDigits:2}) + '</span><span class="inv-kpi-label">Pendiente</span></div>';
    h += '<div class="inv-kpi warn"><span class="inv-kpi-icon">🔴</span><span class="inv-kpi-value">$' + totalOverdue.toLocaleString('en-US', {minimumFractionDigits:2}) + '</span><span class="inv-kpi-label">Vencido</span></div>';
    h += '<div class="inv-kpi"><span class="inv-kpi-icon">📄</span><span class="inv-kpi-value">' + invoicesData.length + '</span><span class="inv-kpi-label">Total Facturas</span></div>';
    h += '</div>';
    document.getElementById('invoiceKPIs').innerHTML = h;
}

function renderInvoicesTable() {
    var c = document.getElementById('invoicesTable');
    var filter = document.getElementById('invoiceFilterStatus').value;
    var filtered = filter === 'all' ? invoicesData : invoicesData.filter(function(i) { return i.status === filter; });

    if (filtered.length === 0) { c.innerHTML = '<p class="empty-msg">No hay facturas' + (filter !== 'all' ? ' con ese estado' : '') + '.</p>'; return; }

    var statusLabels = { draft: '📝 Borrador', sent: '📨 Enviada', paid: '✅ Pagada', partial: '🔶 Parcial', overdue: '🔴 Vencida', cancelled: '❌ Cancelada' };
    var statusClasses = { draft: 'inv-draft', sent: 'inv-sent', paid: 'inv-paid', partial: 'inv-partial', overdue: 'inv-overdue', cancelled: 'inv-cancelled' };

    var h = '<table class="dispatch-table inv-table"><thead><tr><th>Factura</th><th>Cliente</th><th>Total</th><th>Balance</th><th>Estado</th><th>Vence</th><th>Acciones</th></tr></thead><tbody>';
    filtered.forEach(function(inv) {
        var techName = inv.technicians ? inv.technicians.name : '';
        var dueDate = inv.due_date ? new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric'}) : '—';
        var statusBadge = '<span class="inv-badge ' + (statusClasses[inv.status] || '') + '">' + (statusLabels[inv.status] || inv.status) + '</span>';

        h += '<tr>';
        h += '<td><strong>' + inv.invoice_number + '</strong>';
        if (techName) h += '<br><span style="font-size:11px;color:var(--text-muted);">👷 ' + techName + '</span>';
        h += '</td>';
        h += '<td>' + inv.client_name;
        if (inv.client_address) h += '<br><span style="font-size:11px;color:var(--text-muted);">📍 ' + inv.client_address + '</span>';
        h += '</td>';
        h += '<td style="font-weight:700;color:var(--primary);">$' + parseFloat(inv.total).toFixed(2) + '</td>';
        h += '<td style="font-weight:700;color:' + (parseFloat(inv.balance_due) > 0 ? 'var(--danger)' : 'var(--success)') + ';">$' + parseFloat(inv.balance_due).toFixed(2) + '</td>';
        h += '<td>' + statusBadge + '</td>';
        h += '<td style="font-size:12px;">' + dueDate + '</td>';
        h += '<td><div class="job-actions">';
        h += '<button class="btn-icon" onclick="viewInvoiceDetail(\'' + inv.id + '\')" title="Ver detalle">👁️</button>';
        h += '<button class="btn-icon" onclick="printInvoice(\'' + inv.id + '\')" title="Imprimir/PDF">🖨️</button>';
        if (inv.status !== 'paid' && inv.status !== 'cancelled') {
            h += '<button class="btn-icon" onclick="editInvoice(\'' + inv.id + '\')" title="Editar">✏️</button>';
            h += '<button class="btn-nav" onclick="recordPayment(\'' + inv.id + '\')" style="font-size:11px;padding:4px 10px;">💵 Pago</button>';
        }
        if (inv.status === 'draft') h += '<button class="btn-icon" onclick="changeInvoiceStatus(\'' + inv.id + '\',\'sent\')" title="Marcar Enviada">📨</button>';
        h += '<button class="btn-danger-sm" onclick="deleteInvoice(\'' + inv.id + '\')" style="padding:4px 8px;">X</button>';
        h += '</div></td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

function viewInvoiceDetail(invId) {
    var inv = invoicesData.find(function(i) { return i.id === invId; });
    if (!inv) return;
    var statusLabels = { draft: '📝 Borrador', sent: '📨 Enviada', paid: '✅ Pagada', partial: '🔶 Parcial', overdue: '🔴 Vencida', cancelled: '❌ Cancelada' };
    var techName = inv.technicians ? inv.technicians.name : 'N/A';
    var items = inv.line_items || [];

    var h = '<h3 style="color:var(--primary);margin-bottom:16px;">📄 ' + inv.invoice_number + '</h3>';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
    h += '<span class="inv-badge ' + ('inv-' + inv.status) + '" style="font-size:14px;padding:6px 16px;">' + (statusLabels[inv.status] || inv.status) + '</span>';
    h += '<span style="color:var(--text-muted);font-size:13px;">Creada: ' + new Date(inv.created_at).toLocaleDateString('en-US') + '</span></div>';

    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">';
    h += '<div style="padding:12px;background:var(--bg-input);border-radius:8px;">';
    h += '<strong style="font-size:12px;color:var(--text-muted);text-transform:uppercase;">Cliente</strong><br>';
    h += '<span style="font-weight:600;">' + inv.client_name + '</span>';
    if (inv.client_phone) h += '<br>📱 ' + inv.client_phone;
    if (inv.client_email) h += '<br>📧 ' + inv.client_email;
    if (inv.client_address) h += '<br>📍 ' + inv.client_address;
    h += '</div>';
    h += '<div style="padding:12px;background:var(--bg-input);border-radius:8px;">';
    h += '<strong style="font-size:12px;color:var(--text-muted);text-transform:uppercase;">Detalles</strong><br>';
    h += '👷 Técnico: ' + techName;
    if (inv.due_date) h += '<br>📅 Vence: ' + new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-US');
    if (inv.payment_method) h += '<br>💳 Pago: ' + inv.payment_method;
    h += '</div></div>';

    // Line items table
    if (items.length > 0) {
        h += '<table class="est-table"><thead><tr><th>Descripción</th><th>Cant</th><th>Parte</th><th>Labor</th><th>Total</th></tr></thead><tbody>';
        items.forEach(function(item) {
            h += '<tr><td>' + item.name + '</td><td>' + item.qty + '</td>';
            h += '<td>$' + (item.unit_price * item.qty).toFixed(2) + '</td>';
            h += '<td>$' + (item.labor * item.qty).toFixed(2) + '</td>';
            h += '<td><strong>$' + item.total.toFixed(2) + '</strong></td></tr>';
        });
        h += '</tbody></table>';
    }

    // Totals
    h += '<div class="totals-grid" style="margin-top:16px;">';
    if (parseFloat(inv.service_call_fee) > 0) h += '<div class="total-row sc-row"><span>🚐 Service Call:</span><span>$' + parseFloat(inv.service_call_fee).toFixed(2) + '</span></div>';
    h += '<div class="total-row"><span>Subtotal:</span><span>$' + parseFloat(inv.subtotal).toFixed(2) + '</span></div>';
    if (parseFloat(inv.discount_percent) > 0) h += '<div class="total-row discount"><span>Descuento (' + inv.discount_percent + '%):</span><span>-$' + parseFloat(inv.discount_amount).toFixed(2) + '</span></div>';
    h += '<div class="total-row"><span>Tax (' + inv.tax_percent + '%):</span><span>$' + parseFloat(inv.tax_amount).toFixed(2) + '</span></div>';
    h += '<div class="total-row grand"><span>TOTAL:</span><span>$' + parseFloat(inv.total).toFixed(2) + '</span></div>';
    if (parseFloat(inv.amount_paid) > 0) h += '<div class="total-row" style="color:var(--success);"><span>✅ Pagado:</span><span>$' + parseFloat(inv.amount_paid).toFixed(2) + '</span></div>';
    if (parseFloat(inv.balance_due) > 0) h += '<div class="total-row" style="color:var(--danger);font-weight:700;"><span>⚠️ Balance:</span><span>$' + parseFloat(inv.balance_due).toFixed(2) + '</span></div>';
    h += '</div>';

    if (inv.notes) h += '<div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;font-size:13px;"><strong>Notas:</strong> ' + inv.notes + '</div>';

    // Action buttons
    h += '<div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap;">';
    h += '<button class="btn-primary btn-sm" onclick="printInvoice(\'' + inv.id + '\')">🖨️ Imprimir / PDF</button>';
    if (inv.status !== 'paid' && inv.status !== 'cancelled') {
        h += '<button class="btn-nav" onclick="recordPayment(\'' + inv.id + '\');closeInvoiceDetail();">💵 Registrar Pago</button>';
        h += '<button class="btn-secondary btn-sm" onclick="editInvoice(\'' + inv.id + '\');closeInvoiceDetail();">✏️ Editar</button>';
    }
    if (inv.status === 'draft') h += '<button class="btn-secondary btn-sm" onclick="changeInvoiceStatus(\'' + inv.id + '\',\'sent\');closeInvoiceDetail();">📨 Marcar Enviada</button>';
    h += '</div>';

    document.getElementById('invoiceDetailContent').innerHTML = h;
    document.getElementById('invoiceDetailModal').style.display = 'block';
}

function closeInvoiceDetail() { document.getElementById('invoiceDetailModal').style.display = 'none'; }

function editInvoice(invId) {
    var inv = invoicesData.find(function(i) { return i.id === invId; });
    if (!inv) return;
    editingInvoiceId = invId;
    showInvoiceForm();
    // Populate form
    document.getElementById('invClientName').value = inv.client_name || '';
    document.getElementById('invClientPhone').value = inv.client_phone || '';
    document.getElementById('invClientEmail').value = inv.client_email || '';
    document.getElementById('invClientAddress').value = inv.client_address || '';
    if (inv.technician_id) document.getElementById('invTechSelect').value = inv.technician_id;
    if (inv.job_id) document.getElementById('invJobSelect').value = inv.job_id;
    if (inv.due_date) document.getElementById('invDueDate').value = inv.due_date;
    document.getElementById('invServiceCall').value = inv.service_call_fee || 0;
    document.getElementById('invDiscount').value = inv.discount_percent || 0;
    document.getElementById('invTax').value = inv.tax_percent || 8.75;
    document.getElementById('invNotes').value = inv.notes || '';
    document.getElementById('invInternalNotes').value = inv.internal_notes || '';
    // Rebuild lines
    document.getElementById('invoiceLines').innerHTML = '';
    invoiceLineCounter = 0;
    var items = inv.line_items || [];
    items.forEach(function(item) {
        addInvoiceLine();
        var rows = document.querySelectorAll('.invoice-line-row');
        var lastRow = rows[rows.length - 1];
        lastRow.querySelector('.inv-line-desc').value = item.name;
        lastRow.querySelector('.inv-line-qty').value = item.qty;
        lastRow.querySelector('.inv-line-price').value = item.unit_price;
        lastRow.querySelector('.inv-line-labor').value = item.labor;
    });
    calcInvoiceTotals();
}

async function changeInvoiceStatus(invId, status) {
    await sbClient.from('invoices').update({ status: status, updated_at: new Date().toISOString() }).eq('id', invId);
    await loadInvoices();
}

async function deleteInvoice(invId) {
    if (!confirm('¿Eliminar esta factura? Esta acción no se puede deshacer.')) return;
    await sbClient.from('invoices').delete().eq('id', invId);
    await loadInvoices();
}

function recordPayment(invId) {
    var inv = invoicesData.find(function(i) { return i.id === invId; });
    if (!inv) return;
    var balance = parseFloat(inv.balance_due) || 0;
    if (balance <= 0) { alert('Esta factura ya está pagada completamente.'); return; }

    // Build payment modal
    var h = '<div class="edit-modal-overlay" id="paymentModal" style="display:flex;">';
    h += '<div class="edit-modal" style="max-width:550px;">';
    h += '<h3 style="color:var(--primary);">💰 Registrar Pago</h3>';
    h += '<div style="background:var(--bg-input);padding:12px;border-radius:8px;margin-bottom:16px;border:1px solid var(--border);">';
    h += '<strong>' + inv.invoice_number + '</strong> — ' + inv.client_name;
    h += '<br><span style="font-size:13px;">Total: $' + parseFloat(inv.total).toFixed(2) + ' | Pagado: $' + parseFloat(inv.amount_paid).toFixed(2) + ' | <strong style="color:var(--danger);">Balance: $' + balance.toFixed(2) + '</strong></span>';
    h += '</div>';

    // Payment method selection
    h += '<div class="form-group"><label>MÉTODO DE PAGO</label>';
    h += '<div class="payment-method-grid">';
    h += '<label class="pay-option"><input type="radio" name="payMethod" value="cash" checked onchange="updatePaymentFee(\'' + invId + '\')"><div class="pay-card"><span class="pay-icon">💵</span><span>Cash</span><small>Sin cargo</small></div></label>';
    h += '<label class="pay-option"><input type="radio" name="payMethod" value="check" onchange="updatePaymentFee(\'' + invId + '\')"><div class="pay-card"><span class="pay-icon">📝</span><span>Check</span><small>Sin cargo</small></div></label>';
    h += '<label class="pay-option"><input type="radio" name="payMethod" value="debit" onchange="updatePaymentFee(\'' + invId + '\')"><div class="pay-card"><span class="pay-icon">💳</span><span>Debit Card</span><small>Sin cargo</small></div></label>';
    h += '<label class="pay-option"><input type="radio" name="payMethod" value="credit_card" onchange="updatePaymentFee(\'' + invId + '\')"><div class="pay-card"><span class="pay-icon">💳</span><span>Credit Card</span><small style="color:var(--warning);">+3% fee</small></div></label>';
    h += '<label class="pay-option"><input type="radio" name="payMethod" value="zelle" onchange="updatePaymentFee(\'' + invId + '\')"><div class="pay-card"><span class="pay-icon">⚡</span><span>Zelle</span><small>Sin cargo</small></div></label>';
    h += '<label class="pay-option"><input type="radio" name="payMethod" value="venmo" onchange="updatePaymentFee(\'' + invId + '\')"><div class="pay-card"><span class="pay-icon">📱</span><span>Venmo</span><small>Sin cargo</small></div></label>';
    h += '</div></div>';

    // Bounced check warning option
    h += '<div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
    h += '<input type="checkbox" id="payBounceCheck" onchange="updatePaymentFee(\'' + invId + '\')" style="width:auto;">';
    h += '<span style="font-size:13px;">⚠️ <strong>Returned/Bounced Check</strong> — Aplicar 10% fee por cheque devuelto</span>';
    h += '</label></div>';

    // Amount
    h += '<div class="form-row">';
    h += '<div class="form-group"><label>MONTO BASE</label><input type="number" id="payBaseAmount" value="' + balance.toFixed(2) + '" min="0.01" max="' + (balance * 2).toFixed(2) + '" step="0.01" onchange="updatePaymentFee(\'' + invId + '\')"></div>';
    h += '<div class="form-group"><label>FEE</label><input type="text" id="payFeeDisplay" value="$0.00" readonly style="background:#f3f4f6;font-weight:700;color:var(--warning);"></div>';
    h += '</div>';

    // Total with fee
    h += '<div style="background:rgba(244,118,33,0.05);border:2px solid var(--accent);border-radius:10px;padding:16px;margin:12px 0;text-align:center;">';
    h += '<span style="font-size:12px;color:var(--text-muted);text-transform:uppercase;">Total a Cobrar (con fees)</span>';
    h += '<div id="payTotalWithFee" style="font-size:28px;font-weight:800;color:var(--accent);">$' + balance.toFixed(2) + '</div>';
    h += '<div id="payFeeBreakdown" style="font-size:11px;color:var(--text-muted);"></div>';
    h += '</div>';

    // Reference
    h += '<div class="form-group"><label>REFERENCIA / # CHEQUE / ID TRANSACCIÓN</label><input type="text" id="payReference" placeholder="Número de referencia..."></div>';
    h += '<div class="form-group"><label>NOTAS</label><input type="text" id="payNotes" placeholder="Notas opcionales..."></div>';

    h += '<div class="form-actions" style="margin-top:16px;">';
    h += '<button class="btn-primary btn-sm" onclick="submitPayment(\'' + invId + '\')">💰 Registrar Pago</button>';
    h += '<button class="btn-secondary btn-sm" onclick="closePaymentModal()">Cancelar</button>';
    h += '</div>';
    h += '</div></div>';

    // Inject modal
    var div = document.createElement('div');
    div.id = 'paymentModalWrapper';
    div.innerHTML = h;
    document.body.appendChild(div);
}

function closePaymentModal() {
    var w = document.getElementById('paymentModalWrapper');
    if (w) w.remove();
}

function updatePaymentFee(invId) {
    var inv = invoicesData.find(function(i) { return i.id === invId; });
    if (!inv) return;
    var baseAmount = parseFloat(document.getElementById('payBaseAmount').value) || 0;
    var method = document.querySelector('input[name="payMethod"]:checked').value;
    var isBounce = document.getElementById('payBounceCheck').checked;

    var feePercent = 0;
    var feeLabel = '';

    // Credit card = 3% fee
    if (method === 'credit_card') {
        feePercent += 3;
        feeLabel = 'Credit Card Fee 3%';
    }

    // Bounced check = 10% fee
    if (isBounce) {
        feePercent += 10;
        feeLabel = feeLabel ? feeLabel + ' + Bounced Check Fee 10%' : 'Bounced Check Fee 10%';
    }

    var feeAmount = baseAmount * (feePercent / 100);
    var totalWithFee = baseAmount + feeAmount;

    document.getElementById('payFeeDisplay').value = '$' + feeAmount.toFixed(2) + (feePercent > 0 ? ' (' + feePercent + '%)' : '');
    document.getElementById('payTotalWithFee').textContent = '$' + totalWithFee.toFixed(2);

    var breakdown = '';
    if (feePercent > 0) {
        breakdown = 'Base: $' + baseAmount.toFixed(2) + ' + Fee: $' + feeAmount.toFixed(2) + ' (' + feeLabel + ')';
    }
    document.getElementById('payFeeBreakdown').textContent = breakdown;

    // Style the fee display
    document.getElementById('payFeeDisplay').style.color = feePercent > 0 ? 'var(--danger)' : 'var(--success)';
}

async function submitPayment(invId) {
    var inv = invoicesData.find(function(i) { return i.id === invId; });
    if (!inv) return;

    var baseAmount = parseFloat(document.getElementById('payBaseAmount').value) || 0;
    var method = document.querySelector('input[name="payMethod"]:checked').value;
    var isBounce = document.getElementById('payBounceCheck').checked;
    var reference = document.getElementById('payReference').value;
    var notes = document.getElementById('payNotes').value;

    if (baseAmount <= 0) { alert('El monto debe ser mayor a $0'); return; }

    var balance = parseFloat(inv.balance_due) || 0;
    if (baseAmount > balance * 1.15) { alert('El monto excede el balance pendiente'); return; }

    // Calculate fees
    var feePercent = 0;
    if (method === 'credit_card') feePercent += 3;
    if (isBounce) feePercent += 10;
    var feeAmount = baseAmount * (feePercent / 100);
    var totalCharged = baseAmount + feeAmount;

    // Build payment note with fee info
    var payNotes = notes || '';
    if (feePercent > 0) {
        payNotes += (payNotes ? ' | ' : '') + 'Fee ' + feePercent + '% ($' + feeAmount.toFixed(2) + ')';
    }
    if (isBounce) {
        payNotes += ' | BOUNCED CHECK';
        method = 'bounced_check';
    }

    var methodLabel = { cash:'Cash', check:'Check', debit:'Debit Card', credit_card:'Credit Card (+3%)', zelle:'Zelle', venmo:'Venmo', bounced_check:'Bounced Check (+10%)' };
    if (!confirm('¿Confirmar pago?\n\nMétodo: ' + (methodLabel[method] || method) + '\nBase: $' + baseAmount.toFixed(2) + (feeAmount > 0 ? '\nFee: $' + feeAmount.toFixed(2) : '') + '\nTotal Cobrado: $' + totalCharged.toFixed(2))) return;

    // Record payment in payments table (total charged including fees)
    await sbClient.from('payments').insert({
        company_id: companyId,
        invoice_id: invId,
        amount: totalCharged,
        payment_method: method,
        reference: reference,
        notes: payNotes
    });

    // Update invoice - apply base amount to balance (fee is additional revenue)
    var newPaid = (parseFloat(inv.amount_paid) || 0) + baseAmount;
    var newBalance = (parseFloat(inv.total) || 0) - newPaid;
    var newStatus = newBalance <= 0.01 ? 'paid' : 'partial';

    await sbClient.from('invoices').update({
        amount_paid: newPaid,
        balance_due: Math.max(0, newBalance),
        status: newStatus,
        payment_method: method,
        payment_date: new Date().toISOString(),
        payment_reference: reference,
        updated_at: new Date().toISOString()
    }).eq('id', invId);

    closePaymentModal();
    alert('✅ Pago registrado!\n\nBase: $' + baseAmount.toFixed(2) + (feeAmount > 0 ? '\nFee: $' + feeAmount.toFixed(2) + '\nTotal Cobrado: $' + totalCharged.toFixed(2) : ''));
    await loadInvoices();
}

function printInvoice(invId) {
    var inv = invoicesData.find(function(i) { return i.id === invId; });
    if (!inv) return;
    var items = inv.line_items || [];
    var techName = inv.technicians ? inv.technicians.name : 'N/A';
    var company = (window._companyInfo && window._companyInfo.name) ? window._companyInfo.name : 'Trade Master';
    var companyPhone = (window._companyInfo && window._companyInfo.phone) ? window._companyInfo.phone : '';
    var companyEmail = (window._companyInfo && window._companyInfo.email) ? window._companyInfo.email : '';
    var issueDate = inv.issue_date ? new Date(inv.issue_date + 'T00:00:00').toLocaleDateString('en-US') : new Date(inv.created_at).toLocaleDateString('en-US');
    var dueDate = inv.due_date ? new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-US') : 'N/A';
    var statusLabels = { draft: 'BORRADOR', sent: 'ENVIADA', paid: 'PAGADA', partial: 'PAGO PARCIAL', overdue: 'VENCIDA', cancelled: 'CANCELADA' };

    var w = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factura ' + inv.invoice_number + '</title>';
    html += '<style>';
    html += '*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;background:#fff;color:#333;max-width:800px;margin:0 auto}';
    html += '.inv-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #1e3a5f;margin-bottom:24px}';
    html += '.company-info h1{color:#1e3a5f;font-size:24px;margin-bottom:4px}.company-info p{color:#666;font-size:12px}';
    html += '.inv-title{text-align:right}.inv-title h2{color:#f47621;font-size:28px;margin-bottom:4px}.inv-title p{font-size:12px;color:#666}';
    html += '.inv-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}';
    html += '.badge-paid{background:#dcfce7;color:#16a34a}.badge-sent{background:#dbeafe;color:#2563eb}.badge-draft{background:#f3f4f6;color:#6b7280}';
    html += '.badge-overdue{background:#fef2f2;color:#dc2626}.badge-partial{background:#fef9c3;color:#ca8a04}.badge-cancelled{background:#f3f4f6;color:#9ca3af}';
    html += '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}';
    html += '.info-box{padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}';
    html += '.info-box h4{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px}';
    html += '.info-box p{font-size:13px;margin-bottom:3px}';
    html += 'table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#1e3a5f;color:white;padding:10px 12px;text-align:left;font-size:12px}';
    html += 'td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}tr:nth-child(even){background:#f9fafb}';
    html += '.totals{max-width:300px;margin-left:auto}.total-line{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}';
    html += '.total-grand{font-size:18px;font-weight:bold;color:#f47621;border-top:2px solid #f47621;padding-top:8px;margin-top:8px}';
    html += '.total-paid{color:#16a34a}.total-balance{color:#dc2626;font-weight:700}';
    html += '.notes{margin-top:20px;padding:16px;background:#f0fdf4;border-radius:8px;font-size:12px;border:1px solid #bbf7d0}';
    html += '.footer{text-align:center;margin-top:30px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}';
    html += '.print-bar{text-align:center;margin:20px 0;padding:16px;background:#f0f4f8;border-radius:8px}';
    html += '.print-bar button{padding:10px 24px;font-size:14px;font-weight:bold;border:none;border-radius:6px;cursor:pointer;margin:0 6px}';
    html += '.btn-pr{background:#1e3a5f;color:white}.btn-pr:hover{background:#152d4a}';
    html += '@media print{.print-bar{display:none}}';
    html += '</style></head><body>';

    // Header
    html += '<div class="inv-header"><div class="company-info"><h1>🔧 ' + company + '</h1>';
    if (companyPhone) html += '<p>📱 ' + companyPhone + '</p>';
    if (companyEmail) html += '<p>📧 ' + companyEmail + '</p>';
    html += '</div><div class="inv-title"><h2>FACTURA</h2>';
    html += '<p><strong>' + inv.invoice_number + '</strong></p>';
    var badgeClass = 'badge-' + inv.status;
    html += '<span class="inv-badge ' + badgeClass + '">' + (statusLabels[inv.status] || inv.status) + '</span>';
    html += '</div></div>';

    // Info grid
    html += '<div class="info-grid"><div class="info-box"><h4>Facturar a</h4>';
    html += '<p><strong>' + inv.client_name + '</strong></p>';
    if (inv.client_phone) html += '<p>📱 ' + inv.client_phone + '</p>';
    if (inv.client_email) html += '<p>📧 ' + inv.client_email + '</p>';
    if (inv.client_address) html += '<p>📍 ' + inv.client_address + '</p>';
    html += '</div><div class="info-box"><h4>Detalles</h4>';
    html += '<p>Fecha: ' + issueDate + '</p>';
    html += '<p>Vence: ' + dueDate + '</p>';
    html += '<p>Técnico: ' + techName + '</p>';
    html += '</div></div>';

    // Items table
    if (items.length > 0) {
        html += '<table><thead><tr><th>Descripción</th><th>Cant</th><th>Parte</th><th>Labor</th><th style="text-align:right;">Total</th></tr></thead><tbody>';
        items.forEach(function(item) {
            html += '<tr><td>' + item.name + '</td><td>' + item.qty + '</td>';
            html += '<td>$' + (item.unit_price * item.qty).toFixed(2) + '</td>';
            html += '<td>$' + (item.labor * item.qty).toFixed(2) + '</td>';
            html += '<td style="text-align:right;font-weight:600;">$' + item.total.toFixed(2) + '</td></tr>';
        });
        html += '</tbody></table>';
    }

    // Totals
    html += '<div class="totals">';
    if (parseFloat(inv.service_call_fee) > 0) html += '<div class="total-line" style="color:#f47621;font-weight:600;"><span>🚐 Service Call:</span><span>$' + parseFloat(inv.service_call_fee).toFixed(2) + '</span></div>';
    html += '<div class="total-line"><span>Subtotal:</span><span>$' + parseFloat(inv.subtotal).toFixed(2) + '</span></div>';
    if (parseFloat(inv.discount_percent) > 0) html += '<div class="total-line" style="color:#dc2626;"><span>Descuento (' + inv.discount_percent + '%):</span><span>-$' + parseFloat(inv.discount_amount).toFixed(2) + '</span></div>';
    html += '<div class="total-line"><span>Tax (' + inv.tax_percent + '%):</span><span>$' + parseFloat(inv.tax_amount).toFixed(2) + '</span></div>';
    html += '<div class="total-line total-grand"><span>TOTAL:</span><span>$' + parseFloat(inv.total).toFixed(2) + '</span></div>';
    if (parseFloat(inv.amount_paid) > 0) html += '<div class="total-line total-paid"><span>✅ Pagado:</span><span>$' + parseFloat(inv.amount_paid).toFixed(2) + '</span></div>';
    if (parseFloat(inv.balance_due) > 0) html += '<div class="total-line total-balance"><span>BALANCE:</span><span>$' + parseFloat(inv.balance_due).toFixed(2) + '</span></div>';
    html += '</div>';

    // Notes
    if (inv.notes) html += '<div class="notes"><strong>Notas:</strong><br>' + inv.notes + '</div>';

    // ===== LEGAL TERMS & CONDITIONS (from editable clauses) =====
    var cl = (window._companyInfo && window._companyInfo.contract_clauses) ? window._companyInfo.contract_clauses : getClausesData();
    // If no clauses saved, load defaults
    if (!cl || !cl.payment) {
        var state = (cl && cl.state) || 'CA';
        cl = defaultClausesByState[state] || defaultClausesByState.CA;
    }

    html += '<div style="margin-top:30px;page-break-before:auto;">';
    html += '<h3 style="color:#1e3a5f;font-size:14px;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:12px;">📋 TERMS & CONDITIONS / TÉRMINOS Y CONDICIONES</h3>';

    function clauseBlock(icon, title, text) {
        if (!text) return '';
        var h = '<div style="margin-bottom:14px;font-size:11px;line-height:1.6;color:#333;">';
        h += '<h4 style="font-size:12px;color:#1e3a5f;margin-bottom:4px;">' + icon + ' ' + title + '</h4>';
        h += '<p>' + text.replace(/\n/g, '<br>') + '</p></div>';
        return h;
    }

    html += clauseBlock('💰', 'PAYMENT TERMS / TÉRMINOS DE PAGO', cl.payment);

    // 3-Day Cancel with special styling
    if (cl.cancel) {
        html += '<div style="margin-bottom:14px;font-size:11px;line-height:1.6;color:#333;padding:12px;border:2px solid #f47621;border-radius:8px;background:#fff8f0;">';
        html += '<h4 style="font-size:12px;color:#f47621;margin-bottom:6px;">⚠️ RIGHT TO CANCEL / DERECHO DE CANCELACIÓN</h4>';
        html += '<p>' + cl.cancel.replace(/\n/g, '<br>') + '</p>';
        html += '<p style="padding:6px;background:white;border:1px solid #ddd;border-radius:4px;margin:6px 0;"><strong>Send cancellation to / Enviar cancelación a:</strong> ' + company;
        if (companyPhone) html += ' | ' + companyPhone;
        if (companyEmail) html += ' | ' + companyEmail;
        html += '</p></div>';
    }

    html += clauseBlock('🔄', 'CANCELLATION & RESTOCKING POLICY / POLÍTICA DE CANCELACIÓN', cl.restock);
    html += clauseBlock('🏛️', 'CONTRACTOR LICENSE NOTICE / AVISO DE LICENCIA', cl.license);
    html += clauseBlock('💵', 'DOWN PAYMENT / ENGANCHE', cl.downPayment);
    html += clauseBlock('🔗', 'MECHANICS LIEN WARNING / AVISO DE LIENS', cl.lien);
    html += clauseBlock('🛡️', 'WARRANTY / GARANTÍA', cl.warranty);
    html += clauseBlock('🔒', 'PRIVACY POLICY / POLÍTICA DE PRIVACIDAD', cl.privacy);
    if (cl.custom) html += clauseBlock('📝', 'ADDITIONAL TERMS / TÉRMINOS ADICIONALES', cl.custom);

    // Signature block
    html += '<div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:24px;">';
    html += '<div style="border-top:2px solid #333;padding-top:8px;text-align:center;">';
    html += '<p style="font-size:11px;font-weight:bold;">Customer Signature / Firma del Cliente</p>';
    html += '<p style="font-size:10px;color:#666;">Date / Fecha: _______________</p></div>';
    html += '<div style="border-top:2px solid #333;padding-top:8px;text-align:center;">';
    html += '<p style="font-size:11px;font-weight:bold;">Contractor Signature / Firma del Contratista</p>';
    html += '<p style="font-size:10px;color:#666;">Date / Fecha: _______________</p></div>';
    html += '</div>';

    html += '<p style="font-size:10px;color:#999;text-align:center;margin-top:12px;">By signing above, both parties acknowledge and agree to all terms and conditions outlined in this document.</p>';
    html += '</div>';

    // Print bar
    html += '<div class="print-bar"><button class="btn-pr" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button></div>';

    // Footer
    html += '<div class="footer"><p>Gracias por su preferencia | ' + company + '</p>';
    html += '<p>Generado por Trade Master CRM | trademastersusa.org</p></div>';

    html += '</body></html>';
    w.document.write(html);
    w.document.close();
}

// ===== COLLECTIONS MODULE =====
var paymentsData = [];

async function loadCollections() {
    if (!companyId) return;
    var res = await sbClient.from('payments').select('*, invoices(invoice_number, client_name)').eq('company_id', companyId).order('payment_date', { ascending: false }).limit(50);
    paymentsData = res.data || [];
    renderCollectionsKPIs();
    renderCollections();
    renderPaymentsHistory();
}

function renderCollectionsKPIs() {
    var totalDue = 0, overdueAmt = 0, overdueCount = 0, collectedThisMonth = 0;
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    invoicesData.forEach(function(inv) {
        var bal = parseFloat(inv.balance_due) || 0;
        if (bal > 0 && inv.status !== 'cancelled' && inv.status !== 'draft') totalDue += bal;
        if (inv.status === 'overdue') { overdueAmt += bal; overdueCount++; }
    });

    paymentsData.forEach(function(p) {
        if (p.payment_date >= monthStart) collectedThisMonth += parseFloat(p.amount) || 0;
    });

    var h = '<div class="inv-kpi"><span class="inv-kpi-icon">⏳</span><span class="inv-kpi-value">$' + totalDue.toLocaleString('en-US', {minimumFractionDigits:2}) + '</span><span class="inv-kpi-label">Total por Cobrar</span></div>';
    h += '<div class="inv-kpi warn"><span class="inv-kpi-icon">🔴</span><span class="inv-kpi-value">$' + overdueAmt.toLocaleString('en-US', {minimumFractionDigits:2}) + '</span><span class="inv-kpi-label">' + overdueCount + ' Vencidas</span></div>';
    h += '<div class="inv-kpi"><span class="inv-kpi-icon">💵</span><span class="inv-kpi-value">$' + collectedThisMonth.toLocaleString('en-US', {minimumFractionDigits:2}) + '</span><span class="inv-kpi-label">Cobrado este Mes</span></div>';
    h += '<div class="inv-kpi"><span class="inv-kpi-icon">📊</span><span class="inv-kpi-value">' + paymentsData.length + '</span><span class="inv-kpi-label">Pagos Recibidos</span></div>';
    document.getElementById('collectionsKPIs').innerHTML = h;
}

function renderCollections() {
    var c = document.getElementById('collectionsTable');
    var filter = document.getElementById('collectionsFilter').value;
    var today = new Date().toISOString().split('T')[0];

    var filtered = invoicesData.filter(function(inv) {
        if (filter === 'all_due') return parseFloat(inv.balance_due) > 0 && inv.status !== 'cancelled' && inv.status !== 'draft';
        if (filter === 'overdue') return inv.status === 'overdue';
        if (filter === 'partial') return inv.status === 'partial';
        if (filter === 'sent') return inv.status === 'sent';
        if (filter === 'recent_paid') return inv.status === 'paid';
        return true;
    });

    if (filtered.length === 0) { c.innerHTML = '<p class="empty-msg">No hay facturas en esta categoría.</p>'; return; }

    filtered.sort(function(a, b) {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        return (a.due_date || '').localeCompare(b.due_date || '');
    });

    var statusLabels = { draft: '📝', sent: '📨', paid: '✅', partial: '🔶', overdue: '🔴', cancelled: '❌' };

    var h = '<table class="dispatch-table inv-table"><thead><tr><th>Factura</th><th>Cliente</th><th>Total</th><th>Pagado</th><th>Balance</th><th>Vence</th><th>Días</th><th>Acciones</th></tr></thead><tbody>';
    filtered.forEach(function(inv) {
        var balance = parseFloat(inv.balance_due) || 0;
        var paid = parseFloat(inv.amount_paid) || 0;
        var total = parseFloat(inv.total) || 0;
        var dueDate = inv.due_date || '';
        var daysInfo = '';
        if (dueDate && inv.status !== 'paid') {
            var diff = Math.floor((new Date(dueDate) - new Date(today)) / 86400000);
            if (diff < 0) daysInfo = '<span style="color:var(--danger);font-weight:700;">' + Math.abs(diff) + 'd vencida</span>';
            else if (diff === 0) daysInfo = '<span style="color:var(--warning);font-weight:600;">Hoy</span>';
            else daysInfo = '<span style="color:var(--success);">' + diff + 'd</span>';
        }
        var dueDateStr = dueDate ? new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric'}) : '—';
        var paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;

        h += '<tr' + (inv.status === 'overdue' ? ' style="background:rgba(239,68,68,0.03);"' : '') + '>';
        h += '<td><strong>' + (statusLabels[inv.status] || '') + ' ' + inv.invoice_number + '</strong></td>';
        h += '<td>' + inv.client_name;
        if (inv.client_phone) h += '<br><a href="tel:' + inv.client_phone + '" class="btn-call" style="margin-top:4px;">📱 Llamar</a>';
        h += '</td>';
        h += '<td style="font-weight:600;">$' + total.toFixed(2) + '</td>';
        h += '<td><span style="color:var(--success);">$' + paid.toFixed(2) + '</span>';
        if (paidPct > 0 && paidPct < 100) h += '<br><span style="font-size:10px;color:var(--text-muted);">' + paidPct + '% pagado</span>';
        h += '</td>';
        h += '<td style="font-weight:700;color:' + (balance > 0 ? 'var(--danger)' : 'var(--success)') + ';">$' + balance.toFixed(2) + '</td>';
        h += '<td style="font-size:12px;">' + dueDateStr + '</td>';
        h += '<td style="font-size:12px;">' + daysInfo + '</td>';
        h += '<td><div class="job-actions">';
        if (balance > 0) h += '<button class="btn-nav" onclick="recordPayment(\'' + inv.id + '\')" style="font-size:11px;padding:4px 10px;">💵 Cobrar</button>';
        h += '<button class="btn-icon" onclick="viewInvoiceDetail(\'' + inv.id + '\')" title="Ver">👁️</button>';
        h += '<button class="btn-icon" onclick="printInvoice(\'' + inv.id + '\')" title="Imprimir">🖨️</button>';
        h += '</div></td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

function renderPaymentsHistory() {
    var c = document.getElementById('paymentsHistory');
    if (paymentsData.length === 0) { c.innerHTML = '<p class="empty-msg">No hay pagos registrados.</p>'; return; }

    var methodLabels = { cash: '💵 Efectivo', check: '📝 Cheque', debit: '💳 Débito', credit_card: '💳 Crédito (+3%)', card: '💳 Tarjeta', zelle: '⚡ Zelle', venmo: '📲 Venmo', bounced_check: '⚠️ Bounced Check (+10%)', other: '💱 Otro' };

    var h = '<table class="dispatch-table" style="font-size:12px;"><thead><tr><th>Fecha</th><th>Factura</th><th>Cliente</th><th>Monto</th><th>Método</th><th>Referencia</th></tr></thead><tbody>';
    paymentsData.forEach(function(p) {
        var dateStr = new Date(p.payment_date).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
        var invNum = p.invoices ? p.invoices.invoice_number : '—';
        var clientName = p.invoices ? p.invoices.client_name : '—';
        h += '<tr><td>' + dateStr + '</td>';
        h += '<td><strong>' + invNum + '</strong></td>';
        h += '<td>' + clientName + '</td>';
        h += '<td style="font-weight:700;color:var(--success);">$' + parseFloat(p.amount).toFixed(2) + '</td>';
        h += '<td>' + (methodLabels[p.payment_method] || p.payment_method || '') + '</td>';
        h += '<td style="color:var(--text-muted);">' + (p.reference || '—') + '</td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

// ===== CLIENTS MODULE =====
var clientsData = [];
var editingClientId = null;

async function loadClients() {
    if (!companyId) return;
    var res = await sbClient.from('clients').select('*').eq('company_id', companyId).order('name', { ascending: true });
    clientsData = res.data || [];
    renderClientsList();
}

function showClientForm(cId) {
    document.getElementById('clientFormContainer').style.display = 'block';
    document.getElementById('clientForm').reset();
    editingClientId = null;
    document.getElementById('clientFormTitle').textContent = '👥 Nuevo Cliente';
    document.getElementById('clientSubmitBtn').textContent = '💾 Guardar';
    if (cId) {
        var c = clientsData.find(function(x) { return x.id === cId; });
        if (!c) return;
        editingClientId = cId;
        document.getElementById('clientFormTitle').textContent = '✏️ Editar Cliente';
        document.getElementById('clientSubmitBtn').textContent = '💾 Actualizar';
        document.getElementById('clientName').value = c.name || '';
        document.getElementById('clientPhone').value = c.phone || '';
        document.getElementById('clientEmail').value = c.email || '';
        document.getElementById('clientAddress').value = c.address || '';
        document.getElementById('clientPropertyType').value = c.property_type || 'Residencial';
        document.getElementById('clientNotes').value = c.notes || '';
    }
}
function hideClientForm() { document.getElementById('clientFormContainer').style.display = 'none'; editingClientId = null; }

async function handleClientCreate(event) {
    event.preventDefault();
    var data = {
        company_id: companyId,
        name: document.getElementById('clientName').value,
        phone: document.getElementById('clientPhone').value,
        email: document.getElementById('clientEmail').value,
        address: document.getElementById('clientAddress').value,
        property_type: document.getElementById('clientPropertyType').value,
        notes: document.getElementById('clientNotes').value,
        source: 'manual'
    };
    if (editingClientId) {
        delete data.company_id; delete data.source;
        await sbClient.from('clients').update(data).eq('id', editingClientId);
    } else {
        await sbClient.from('clients').insert(data);
    }
    hideClientForm(); await loadClients(); updateKPIs();
}

async function deleteClient(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    await sbClient.from('clients').delete().eq('id', id);
    await loadClients(); updateKPIs();
}

function renderClientsList() {
    var c = document.getElementById('clientsList');
    var search = (document.getElementById('clientSearchInput').value || '').toLowerCase();
    var filtered = clientsData.filter(function(cl) {
        if (!search) return true;
        return (cl.name || '').toLowerCase().indexOf(search) >= 0 ||
               (cl.phone || '').indexOf(search) >= 0 ||
               (cl.email || '').toLowerCase().indexOf(search) >= 0 ||
               (cl.address || '').toLowerCase().indexOf(search) >= 0;
    });
    if (filtered.length === 0) { c.innerHTML = '<p class="empty-msg">No hay clientes' + (search ? ' que coincidan' : '') + '.</p>'; return; }

    var srcLabels = { manual: '✋ Manual', lead: '🎯 Lead', invoice: '📄 Factura', referral: '🏠 Referencia' };
    var h = '<table class="dispatch-table"><thead><tr><th>Cliente</th><th>Contacto</th><th>Dirección</th><th>Tipo</th><th>Origen</th><th>Acciones</th></tr></thead><tbody>';
    filtered.forEach(function(cl) {
        h += '<tr><td><strong>' + cl.name + '</strong>';
        if (cl.notes) h += '<br><span style="font-size:10px;color:var(--text-muted);">📝 ' + cl.notes.substring(0,50) + '</span>';
        h += '</td>';
        h += '<td style="font-size:12px;">';
        if (cl.phone) h += '<a href="tel:' + cl.phone + '" class="btn-call">📱 ' + cl.phone + '</a> ';
        if (cl.email) h += '<br><span style="color:var(--text-muted);">' + cl.email + '</span>';
        h += '</td>';
        h += '<td style="font-size:12px;">' + (cl.address || '—') + '</td>';
        h += '<td><span style="font-size:11px;">' + (cl.property_type || '') + '</span></td>';
        h += '<td><span style="font-size:11px;">' + (srcLabels[cl.source] || cl.source || '') + '</span></td>';
        h += '<td><div class="job-actions">';
        h += '<button class="btn-icon" onclick="showClientForm(\'' + cl.id + '\')" title="Editar">✏️</button>';
        h += '<button class="btn-icon" onclick="createApptForClient(\'' + cl.id + '\')" title="Crear Cita">📅</button>';
        h += '<button class="btn-danger-sm" onclick="deleteClient(\'' + cl.id + '\')" style="padding:4px 8px;">X</button>';
        h += '</div></td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

// Auto-create client from lead conversion
async function autoCreateClient(name, phone, email, address, sourceType, sourceId) {
    if (!companyId) return;
    // Check if client already exists by phone
    var existing = clientsData.find(function(c) { return c.phone === phone && phone; });
    if (existing) return existing.id;
    var res = await sbClient.from('clients').insert({
        company_id: companyId, name: name, phone: phone, email: email,
        address: address, source: sourceType, source_id: sourceId
    }).select().single();
    if (res.data) { clientsData.push(res.data); return res.data.id; }
    return null;
}

function createApptForClient(clientId) {
    showSection('calendar');
    setTimeout(function() {
        showApptForm();
        document.getElementById('apptClientSelect').value = clientId;
        loadApptClientInfo();
    }, 200);
}

// ===== CALENDAR / APPOINTMENTS MODULE =====
var appointmentsData = [];
var calYear, calMonth;
var editingApptId = null;

async function loadAppointments() {
    if (!companyId) return;
    var res = await sbClient.from('appointments').select('*, clients(name, phone), technicians(name)').eq('company_id', companyId).order('appointment_date', { ascending: true });
    appointmentsData = res.data || [];
}

function initCalendar() {
    if (!calYear) { var now = new Date(); calYear = now.getFullYear(); calMonth = now.getMonth(); }
    loadAppointments().then(function() { renderCalendar(); });
    populateApptSelects();
}

function calPrev() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function calNext() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }
function calToday() { var now = new Date(); calYear = now.getFullYear(); calMonth = now.getMonth(); renderCalendar(); }

function renderCalendar() {
    var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    document.getElementById('calMonthLabel').textContent = months[calMonth] + ' ' + calYear;

    var firstDay = new Date(calYear, calMonth, 1).getDay();
    var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

    var days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var h = '<div class="cal-header-row">';
    days.forEach(function(d) { h += '<div class="cal-day-header">' + d + '</div>'; });
    h += '</div><div class="cal-body">';

    // Empty cells before first day
    for (var i = 0; i < firstDay; i++) h += '<div class="cal-cell empty"></div>';

    for (var d = 1; d <= daysInMonth; d++) {
        var dateStr = calYear + '-' + String(calMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        var isToday = dateStr === todayStr;
        var dayAppts = appointmentsData.filter(function(a) { return a.appointment_date === dateStr; });

        h += '<div class="cal-cell' + (isToday ? ' today' : '') + (dayAppts.length > 0 ? ' has-appts' : '') + '" onclick="showDayAppts(\'' + dateStr + '\')">';
        h += '<span class="cal-date">' + d + '</span>';
        if (dayAppts.length > 0) {
            h += '<div class="cal-appts">';
            dayAppts.slice(0, 3).forEach(function(a) {
                var statusClass = a.status === 'completed' ? 'appt-done' : a.status === 'cancelled' ? 'appt-cancel' : '';
                h += '<div class="cal-appt ' + statusClass + '">';
                h += '<span class="appt-time">' + (a.start_time || '') + '</span> ';
                h += '<span class="appt-name">' + a.title.substring(0,15) + '</span>';
                h += '</div>';
            });
            if (dayAppts.length > 3) h += '<div class="cal-more">+' + (dayAppts.length - 3) + ' más</div>';
            h += '</div>';
        }
        h += '</div>';
    }
    h += '</div>';
    document.getElementById('calendarGrid').innerHTML = h;

    // Show today's appointments by default
    showDayAppts(todayStr);
}

function showDayAppts(dateStr) {
    var dayAppts = appointmentsData.filter(function(a) { return a.appointment_date === dateStr; });
    var dateObj = new Date(dateStr + 'T12:00:00');
    var dayLabel = dateObj.toLocaleDateString('es-MX', { weekday:'long', month:'long', day:'numeric' });
    document.getElementById('calDayTitle').textContent = '📋 ' + dayLabel;

    var c = document.getElementById('calDayAppts');
    if (dayAppts.length === 0) {
        c.innerHTML = '<p class="empty-msg">No hay citas este día. <a href="#" onclick="showApptForm();document.getElementById(\'apptDate\').value=\'' + dateStr + '\';" style="color:var(--accent);">+ Crear cita</a></p>';
        return;
    }

    dayAppts.sort(function(a,b) { return (a.start_time || '').localeCompare(b.start_time || ''); });
    var statusLabels = { scheduled:'📅 Programada', confirmed:'✅ Confirmada', completed:'✔️ Completada', cancelled:'❌ Cancelada', no_show:'⚠️ No Show' };

    var h = '';
    dayAppts.forEach(function(a) {
        var clientName = a.clients ? a.clients.name : 'Sin cliente';
        var clientPhone = a.clients ? a.clients.phone : '';
        var techName = a.technicians ? a.technicians.name : 'Sin asignar';
        h += '<div class="appt-card">';
        h += '<div class="appt-card-header">';
        h += '<div><strong>' + (a.start_time || '—') + (a.end_time ? ' - ' + a.end_time : '') + '</strong>';
        h += ' <span class="inv-badge inv-' + (a.status === 'completed' ? 'paid' : a.status === 'cancelled' ? 'cancelled' : 'sent') + '">' + (statusLabels[a.status] || a.status) + '</span></div>';
        h += '<div class="job-actions">';
        if (a.status === 'scheduled') h += '<button class="btn-icon" onclick="changeApptStatus(\'' + a.id + '\',\'confirmed\')" title="Confirmar">✅</button>';
        if (a.status !== 'completed' && a.status !== 'cancelled') {
            h += '<button class="btn-icon" onclick="changeApptStatus(\'' + a.id + '\',\'completed\')" title="Completar">✔️</button>';
            h += '<button class="btn-icon" onclick="editAppt(\'' + a.id + '\')" title="Editar">✏️</button>';
            h += '<button class="btn-icon" onclick="changeApptStatus(\'' + a.id + '\',\'cancelled\')" title="Cancelar">❌</button>';
        }
        h += '<button class="btn-danger-sm" onclick="deleteAppt(\'' + a.id + '\')" style="padding:4px 8px;">X</button>';
        h += '</div></div>';
        h += '<div class="appt-card-body">';
        h += '<strong>' + a.title + '</strong><br>';
        h += '👤 ' + clientName;
        if (clientPhone) h += ' <a href="tel:' + clientPhone + '" class="btn-call" style="font-size:10px;padding:2px 6px;">📱 ' + clientPhone + '</a>';
        if (a.address) h += '<br>📍 ' + a.address;
        if (a.description) h += '<br><span style="font-size:12px;color:var(--text-muted);">📝 ' + a.description + '</span>';

        // Assignment dropdowns
        h += '<div class="appt-assign-row">';
        // Tech assignment
        h += '<div class="appt-assign"><label>👷 Técnico</label><select class="inline-select" onchange="assignApptTech(\'' + a.id + '\', this.value)">';
        h += '<option value="">Sin asignar</option>';
        techsData.forEach(function(t) {
            h += '<option value="' + t.id + '"' + (a.technician_id === t.id ? ' selected' : '') + '>' + t.name + '</option>';
        });
        h += '</select></div>';
        // Status change
        h += '<div class="appt-assign"><label>📋 Estado</label><select class="inline-select" onchange="changeApptStatus(\'' + a.id + '\', this.value)">';
        var statuses = ['scheduled','confirmed','completed','cancelled','no_show'];
        var statusNames = {scheduled:'Programada',confirmed:'Confirmada',completed:'Completada',cancelled:'Cancelada',no_show:'No Show'};
        statuses.forEach(function(s) {
            h += '<option value="' + s + '"' + (a.status === s ? ' selected' : '') + '>' + statusNames[s] + '</option>';
        });
        h += '</select></div>';
        h += '</div>';

        h += '</div></div>';
    });
    c.innerHTML = h;
}

function populateApptSelects() {
    var clientSel = document.getElementById('apptClientSelect');
    if (!clientSel) return;
    clientSel.innerHTML = '<option value="">Seleccionar cliente...</option><option value="__new__">➕ Nuevo Cliente</option>';
    clientsData.forEach(function(cl) {
        clientSel.innerHTML += '<option value="' + cl.id + '">' + cl.name + (cl.phone ? ' - ' + cl.phone : '') + '</option>';
    });
    var techSel = document.getElementById('apptTechSelect');
    techSel.innerHTML = '<option value="">Sin asignar</option>';
    techsData.forEach(function(t) {
        techSel.innerHTML += '<option value="' + t.id + '">' + t.name + '</option>';
    });
}

function loadApptClientInfo() {
    var val = document.getElementById('apptClientSelect').value;
    var newFields = document.getElementById('apptNewClientFields');
    if (val === '__new__') { newFields.style.display = 'block'; return; }
    newFields.style.display = 'none';
    if (val) {
        var cl = clientsData.find(function(c) { return c.id === val; });
        if (cl && cl.address) document.getElementById('apptAddress').value = cl.address;
    }
}

function showApptForm(apptId) {
    document.getElementById('apptFormContainer').style.display = 'block';
    document.getElementById('apptForm').reset();
    document.getElementById('apptNewClientFields').style.display = 'none';
    editingApptId = null;
    document.getElementById('apptFormTitle').textContent = '📅 Nueva Cita';
    document.getElementById('apptSubmitBtn').textContent = '💾 Crear Cita';
    populateApptSelects();
    // Default date = today
    document.getElementById('apptDate').value = new Date().toISOString().split('T')[0];

    if (apptId) {
        var a = appointmentsData.find(function(x) { return x.id === apptId; });
        if (!a) return;
        editingApptId = apptId;
        document.getElementById('apptFormTitle').textContent = '✏️ Editar Cita';
        document.getElementById('apptSubmitBtn').textContent = '💾 Actualizar';
        document.getElementById('apptTitle').value = a.title || '';
        document.getElementById('apptDate').value = a.appointment_date || '';
        document.getElementById('apptStartTime').value = a.start_time || '09:00';
        document.getElementById('apptEndTime').value = a.end_time || '10:00';
        if (a.client_id) document.getElementById('apptClientSelect').value = a.client_id;
        if (a.technician_id) document.getElementById('apptTechSelect').value = a.technician_id;
        document.getElementById('apptAddress').value = a.address || '';
        document.getElementById('apptNotes').value = a.description || '';
    }
}
function hideApptForm() { document.getElementById('apptFormContainer').style.display = 'none'; editingApptId = null; }
function editAppt(id) { showApptForm(id); }

async function handleApptCreate(event) {
    event.preventDefault();
    var clientId = document.getElementById('apptClientSelect').value;

    // If new client, create it first
    if (clientId === '__new__') {
        var newName = document.getElementById('apptNewClientName').value;
        if (!newName) { alert('Ingresa el nombre del nuevo cliente'); return; }
        clientId = await autoCreateClient(
            newName,
            document.getElementById('apptNewClientPhone').value,
            document.getElementById('apptNewClientEmail').value,
            document.getElementById('apptAddress').value,
            'manual', null
        );
        await loadClients();
    }

    var data = {
        company_id: companyId,
        client_id: clientId || null,
        technician_id: document.getElementById('apptTechSelect').value || null,
        title: document.getElementById('apptTitle').value,
        appointment_date: document.getElementById('apptDate').value,
        start_time: document.getElementById('apptStartTime').value,
        end_time: document.getElementById('apptEndTime').value,
        address: document.getElementById('apptAddress').value,
        description: document.getElementById('apptNotes').value
    };

    if (editingApptId) {
        delete data.company_id;
        await sbClient.from('appointments').update(data).eq('id', editingApptId);
    } else {
        await sbClient.from('appointments').insert(data);
    }
    hideApptForm();
    await loadAppointments();
    renderCalendar();
}

async function changeApptStatus(id, status) {
    await sbClient.from('appointments').update({ status: status }).eq('id', id);
    await loadAppointments(); renderCalendar();
}

async function assignApptTech(id, techId) {
    await sbClient.from('appointments').update({ technician_id: techId || null }).eq('id', id);
    await loadAppointments(); renderCalendar();
}

async function deleteAppt(id) {
    if (!confirm('¿Eliminar esta cita?')) return;
    await sbClient.from('appointments').delete().eq('id', id);
    await loadAppointments(); renderCalendar();
}

// ===== DYNAMIC DASHBOARD =====
function renderDashboardDynamic() {
    renderRecentJobs();
    renderUpcomingAppts();
    renderOverdueAlert();
    renderPipeline();
}

function renderRecentJobs() {
    var c = document.getElementById('dashRecentJobs');
    if (!c) return;
    var recent = jobsData.slice(0, 5);
    if (recent.length === 0) { c.innerHTML = '<p class="empty-msg">No hay trabajos recientes</p>'; return; }
    var statusIcons = { pending:'🟡', in_progress:'🔵', completed:'✅', cancelled:'❌' };
    var h = '';
    recent.forEach(function(j) {
        var icon = statusIcons[j.status] || '⚪';
        var tech = j.technicians ? j.technicians.name : 'Sin asignar';
        h += '<div class="dash-item">';
        h += '<span class="dash-icon">' + icon + '</span>';
        h += '<div class="dash-info"><strong>' + j.title + '</strong><span>' + tech + ' · ' + (j.address || '').substring(0,30) + '</span></div>';
        h += '</div>';
    });
    c.innerHTML = h;
}

function renderUpcomingAppts() {
    var c = document.getElementById('dashUpcomingAppts');
    if (!c) return;
    var today = new Date().toISOString().split('T')[0];
    var upcoming = appointmentsData.filter(function(a) {
        return a.appointment_date >= today && a.status !== 'cancelled' && a.status !== 'completed';
    }).slice(0, 5);
    if (upcoming.length === 0) { c.innerHTML = '<p class="empty-msg">No hay citas próximas</p>'; return; }
    var h = '';
    upcoming.forEach(function(a) {
        var clientName = a.clients ? a.clients.name : '';
        var dateObj = new Date(a.appointment_date + 'T12:00:00');
        var dateLabel = dateObj.toLocaleDateString('es-MX', {weekday:'short', month:'short', day:'numeric'});
        h += '<div class="dash-item">';
        h += '<span class="dash-icon">📅</span>';
        h += '<div class="dash-info"><strong>' + a.title + '</strong><span>' + dateLabel + ' ' + (a.start_time || '') + ' · ' + clientName + '</span></div>';
        h += '</div>';
    });
    c.innerHTML = h;
}

function renderOverdueAlert() {
    var container = document.getElementById('dashOverdueAlert');
    var c = document.getElementById('dashOverdueList');
    if (!container || !c) return;
    var overdue = invoicesData.filter(function(i) { return i.status === 'overdue'; });
    if (overdue.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    var h = '';
    overdue.forEach(function(inv) {
        h += '<div class="dash-item" style="border-left:3px solid var(--danger);padding-left:12px;">';
        h += '<span class="dash-icon">🔴</span>';
        h += '<div class="dash-info"><strong>' + inv.invoice_number + ' - ' + inv.client_name + '</strong>';
        h += '<span>Balance: $' + parseFloat(inv.balance_due).toFixed(2) + ' · Vence: ' + (inv.due_date || '') + '</span></div>';
        h += '<button class="btn-nav" onclick="showSection(\'collections\')" style="font-size:11px;padding:4px 10px;">Cobrar</button>';
        h += '</div>';
    });
    c.innerHTML = h;
}

function renderPipeline() {
    // Setup year selector
    var yearSel = document.getElementById('pipelineYear');
    if (yearSel && yearSel.options.length === 0) {
        var curYear = new Date().getFullYear();
        for (var y = curYear; y >= curYear - 2; y--) {
            yearSel.innerHTML += '<option value="' + y + '">' + y + '</option>';
        }
    }
    var selYear = parseInt((yearSel && yearSel.value) || new Date().getFullYear());
    var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    // Aggregate by month
    var paid = new Array(12).fill(0);
    var pending = new Array(12).fill(0);
    var jobs_count = new Array(12).fill(0);

    invoicesData.forEach(function(inv) {
        var created = new Date(inv.created_at);
        if (created.getFullYear() !== selYear) return;
        var m = created.getMonth();
        if (inv.status === 'paid') paid[m] += parseFloat(inv.total) || 0;
        else if (inv.status !== 'cancelled' && inv.status !== 'draft') pending[m] += parseFloat(inv.balance_due) || 0;
    });

    jobsData.forEach(function(j) {
        var created = new Date(j.created_at);
        if (created.getFullYear() !== selYear) return;
        jobs_count[created.getMonth()]++;
    });

    // Find max for scaling
    var maxVal = 1;
    for (var i = 0; i < 12; i++) { var total = paid[i] + pending[i]; if (total > maxVal) maxVal = total; }

    var curMonth = new Date().getMonth();
    var h = '<div class="pipeline-bars">';
    months.forEach(function(m, idx) {
        var paidH = Math.round((paid[idx] / maxVal) * 160);
        var pendH = Math.round((pending[idx] / maxVal) * 160);
        var isCurrent = (idx === curMonth && selYear === new Date().getFullYear());
        h += '<div class="pipe-col' + (isCurrent ? ' current' : '') + '">';
        h += '<div class="pipe-bar-container" style="height:170px;">';
        if (pending[idx] > 0) h += '<div class="pipe-bar pipe-pending" style="height:' + pendH + 'px;" title="Pendiente: $' + pending[idx].toFixed(0) + '"></div>';
        if (paid[idx] > 0) h += '<div class="pipe-bar pipe-paid" style="height:' + paidH + 'px;" title="Cobrado: $' + paid[idx].toFixed(0) + '"></div>';
        h += '</div>';
        h += '<div class="pipe-label">' + m + '</div>';
        if (paid[idx] + pending[idx] > 0) h += '<div class="pipe-amount">$' + ((paid[idx] + pending[idx]) / 1000).toFixed(1) + 'k</div>';
        else h += '<div class="pipe-amount" style="color:var(--text-muted);">—</div>';
        h += '</div>';
    });
    h += '</div>';
    h += '<div class="pipe-legend"><span class="pipe-leg-item"><span class="pipe-dot paid"></span> Cobrado</span><span class="pipe-leg-item"><span class="pipe-dot pending"></span> Pendiente</span></div>';
    document.getElementById('pipelineChart').innerHTML = h;

    // Stats summary
    var yearPaid = paid.reduce(function(a,b) { return a+b; }, 0);
    var yearPending = pending.reduce(function(a,b) { return a+b; }, 0);
    var yearJobs = jobs_count.reduce(function(a,b) { return a+b; }, 0);
    var avgTicket = yearPaid > 0 ? yearPaid / invoicesData.filter(function(i) { return i.status === 'paid' && new Date(i.created_at).getFullYear() === selYear; }).length : 0;

    var sh = '<div class="pipeline-stat-row">';
    sh += '<div class="pipe-stat"><span class="pipe-stat-val" style="color:var(--success);">$' + yearPaid.toLocaleString('en-US', {minimumFractionDigits:0}) + '</span><span class="pipe-stat-lbl">Cobrado ' + selYear + '</span></div>';
    sh += '<div class="pipe-stat"><span class="pipe-stat-val" style="color:var(--warning);">$' + yearPending.toLocaleString('en-US', {minimumFractionDigits:0}) + '</span><span class="pipe-stat-lbl">Pendiente</span></div>';
    sh += '<div class="pipe-stat"><span class="pipe-stat-val" style="color:var(--primary);">' + yearJobs + '</span><span class="pipe-stat-lbl">Trabajos</span></div>';
    sh += '<div class="pipe-stat"><span class="pipe-stat-val" style="color:var(--accent);">$' + (avgTicket || 0).toFixed(0) + '</span><span class="pipe-stat-lbl">Ticket Promedio</span></div>';
    sh += '</div>';
    document.getElementById('pipelineStats').innerHTML = sh;
}

// ===== CONTRACT CLAUSES (Editable per state) =====
var defaultClausesByState = {
    CA: {
        payment: 'Payment is due upon completion of work unless otherwise agreed in writing. Accepted payment methods: Cash, Check, Debit Card, Credit Card, Zelle, and Venmo.\n\nCredit Card Payments: A processing fee of 3% will be applied to all credit card transactions.\n\nReturned/Bounced Checks: A fee of 10% of the check amount will be assessed for any returned or bounced check, in addition to any bank fees incurred.\n\nLate Payment: Invoices not paid within 30 days of the due date may be subject to a late fee of 1.5% per month (18% per annum) on the outstanding balance.',
        cancel: 'California Business and Professions Code §7159 & Civil Code §1689.5-1689.14:\n\nYou, the buyer, may cancel this transaction at any time prior to midnight of the third business day after the date of this transaction. If you cancel, any property traded in, any payments made by you under the contract, and any negotiable instrument executed by you will be returned within 10 business days following receipt by the seller of your cancellation notice.\n\nThe "Three-Day Right to Cancel" does not apply to Service and Repair contracts under $750 where work begins immediately, or to contracts negotiated at the contractor\'s place of business.\n\nFor customers 65 years of age or older, the right to cancel is extended to FIVE (5) business days per California AB 2471.',
        restock: 'If the customer cancels the contract after the 3-day right to cancel period has expired:\n\n• A 20% restocking fee will be applied to any materials and/or equipment that have been purchased, ordered, or reserved for the project, provided that a purchase receipt or proof of order is presented.\n• Any permits already pulled and paid for are non-refundable. The full cost of permits will be deducted from any refund.\n• If custom or special-order equipment has been ordered and cannot be returned to the supplier, the customer is responsible for the full cost of said equipment.\n• Labor already performed prior to cancellation will be billed at the agreed-upon rate.',
        license: 'CSLB is the state consumer protection agency that licenses and regulates construction contractors.\n\nContact CSLB for information about the licensed contractor you are considering, including information about disclosable complaints, disciplinary actions, and civil judgments.\n\nCSLB Contact: 800-321-CSLB (2752) | Website: www.cslb.ca.gov | P.O. Box 26000, Sacramento, CA 95826\n\nIMPORTANT: Use only licensed contractors. If you file a complaint against a licensed contractor within the legal deadline (usually four years), CSLB has authority to investigate the complaint.',
        downPayment: 'Per California law (BPC §7159), the down payment cannot exceed $1,000 or 10% of the contract price, whichever is less. Subsequent progress payments cannot exceed the value of work performed or materials delivered. There are no exceptions for special-order materials.',
        lien: 'Anyone who helps improve your property but who is not paid may record what is called a mechanics lien on your property. A mechanics lien is a claim against your property, recorded at the County Recorder\'s Office, that could result in a court-ordered foreclosure sale of your property.',
        warranty: 'All work performed is guaranteed for a period of one (1) year from the date of completion for labor and workmanship. Manufacturer warranties on equipment and parts are separate and may vary. All warranty claims must be reported in writing within the warranty period.',
        privacy: 'We collect personal information solely for the purpose of providing HVAC services and maintaining service records. Your information will not be sold, shared, or distributed to third parties without your consent, except as required by law. Service records may be retained for warranty and regulatory compliance purposes.',
        custom: ''
    },
    TX: {
        payment: 'Payment is due upon completion of work unless otherwise agreed in writing. Accepted payment methods: Cash, Check, Debit Card, Credit Card, Zelle, and Venmo.\n\nCredit Card Payments: A processing fee of 3% will be applied to all credit card transactions.\n\nReturned/Bounced Checks: A fee of 10% of the check amount will be assessed for any returned or bounced check.',
        cancel: 'Texas Property Code §53 & Texas Business and Commerce Code:\n\nYou, the buyer, may cancel this transaction at any time prior to midnight of the third business day after the date of this transaction. Written notice of cancellation must be sent to the contractor.\n\nThe right to cancel does not apply to emergency repairs or services requested by the homeowner where work has already begun.',
        restock: 'If the customer cancels the contract after the cancellation period:\n\n• A 20% restocking fee will be applied to materials/equipment purchased with proof of receipt.\n• Permits already obtained are non-refundable.\n• Custom or special-order equipment costs are the customer\'s responsibility.\n• Labor already performed will be billed at the agreed rate.',
        license: 'Texas does not require a statewide HVAC contractor license, but contractors must hold a license from the Texas Department of Licensing and Regulation (TDLR) for AC and Refrigeration work.\n\nTDLR Contact: (800) 803-9202 | Website: www.tdlr.texas.gov',
        downPayment: 'Texas law does not set a specific limit on down payments for home improvement contracts. However, payments should not exceed the value of work completed or materials delivered.',
        lien: 'Under Texas Property Code Chapter 53, contractors, subcontractors, and material suppliers may file a mechanics lien if not paid. Homeowners should request lien waivers with each payment.',
        warranty: 'All work performed is guaranteed for a period of one (1) year from the date of completion for labor and workmanship. Manufacturer warranties are separate and may vary.',
        privacy: 'We collect personal information solely for the purpose of providing HVAC services and maintaining service records. Your information will not be sold or shared with third parties without your consent.',
        custom: ''
    },
    AZ: {
        payment: 'Payment is due upon completion of work unless otherwise agreed in writing. Accepted payment methods: Cash, Check, Debit Card, Credit Card, Zelle, and Venmo.\n\nCredit Card Payments: A processing fee of 3% will be applied.\nReturned/Bounced Checks: A fee of 10% will be assessed.',
        cancel: 'Arizona Revised Statutes §44-5001:\n\nYou may cancel this transaction within three business days of signing. Written cancellation notice must be delivered to the contractor.',
        restock: 'Cancellation after the 3-day period:\n\n• 20% restocking fee on materials with purchase receipt.\n• Non-refundable permit costs deducted from refund.\n• Custom equipment costs are the customer\'s responsibility.\n• Completed labor billed at agreed rate.',
        license: 'Arizona Registrar of Contractors (ROC) licenses and regulates contractors.\n\nROC Contact: (602) 542-1525 | Website: roc.az.gov',
        downPayment: 'Arizona law allows contractors to collect a down payment, but the total of all payments cannot exceed the value of work performed and materials delivered, plus a reasonable allowance for overhead and profit.',
        lien: 'Under Arizona law, contractors may file a mechanics lien for unpaid work. A preliminary 20-day notice is required to preserve lien rights.',
        warranty: 'All work guaranteed for one (1) year from completion. Manufacturer warranties are separate.',
        privacy: 'Personal information collected for HVAC service purposes only and will not be shared without consent.',
        custom: ''
    },
    NV: {
        payment: 'Payment is due upon completion. Credit Card: +3% fee. Bounced Check: +10% fee. Late payment: 1.5%/month.',
        cancel: 'Nevada Revised Statutes (NRS) Chapter 598:\n\nYou may cancel within three business days of signing. Written notice required.',
        restock: 'Post-cancellation period: 20% restocking fee with receipt, non-refundable permits, custom equipment at customer cost.',
        license: 'Nevada State Contractors Board (NSCB) regulates contractors.\n\nNSCB Contact: (702) 486-1100 | Website: nscb.nv.gov',
        downPayment: 'Nevada law limits down payments to 10% of the contract price or the cost of materials, whichever is less.',
        lien: 'Nevada mechanics lien rights require a Notice of Right to Lien within 15 days of first work or materials delivery.',
        warranty: 'One (1) year labor warranty. Manufacturer warranties separate.',
        privacy: 'Personal information used only for HVAC services and not shared without consent.',
        custom: ''
    }
};

// Copy defaults for FL, NY, OTHER
defaultClausesByState.FL = Object.assign({}, defaultClausesByState.TX, { license: 'Florida requires HVAC contractors to hold a state license through the Department of Business and Professional Regulation (DBPR).\n\nDBPR Contact: (850) 487-1395 | Website: myfloridalicense.com', downPayment: 'Florida law limits down payments to 10% of the contract amount for contracts over $1,000.' });
defaultClausesByState.NY = Object.assign({}, defaultClausesByState.TX, { license: 'New York requires home improvement contractors to register with the local county or city consumer affairs office. NYC contractors must be licensed by the Department of Consumer and Worker Protection.', cancel: 'New York General Business Law §36-A & Home Improvement Act:\n\nYou may cancel within three business days of signing. Written notice must be sent to the contractor.' });
defaultClausesByState.OTHER = Object.assign({}, defaultClausesByState.TX, { license: 'Contact your state contractor licensing board for specific requirements in your area.', cancel: 'Check your state laws for specific cancellation rights. Many states provide a three-day right to cancel.' });

function loadDefaultClauses() {
    var state = document.getElementById('clauseState').value || 'CA';
    var defaults = defaultClausesByState[state] || defaultClausesByState.OTHER;
    document.getElementById('clausePayment').value = defaults.payment;
    document.getElementById('clauseCancel').value = defaults.cancel;
    document.getElementById('clauseRestock').value = defaults.restock;
    document.getElementById('clauseLicense').value = defaults.license;
    document.getElementById('clauseDownPayment').value = defaults.downPayment;
    document.getElementById('clauseLien').value = defaults.lien;
    document.getElementById('clauseWarranty').value = defaults.warranty;
    document.getElementById('clausePrivacy').value = defaults.privacy;
    document.getElementById('clauseCustom').value = defaults.custom || '';
}

function loadClausesFromData(clauses) {
    if (!clauses) { loadDefaultClauses(); return; }
    if (clauses.state) document.getElementById('clauseState').value = clauses.state;
    document.getElementById('clausePayment').value = clauses.payment || '';
    document.getElementById('clauseCancel').value = clauses.cancel || '';
    document.getElementById('clauseRestock').value = clauses.restock || '';
    document.getElementById('clauseLicense').value = clauses.license || '';
    document.getElementById('clauseDownPayment').value = clauses.downPayment || '';
    document.getElementById('clauseLien').value = clauses.lien || '';
    document.getElementById('clauseWarranty').value = clauses.warranty || '';
    document.getElementById('clausePrivacy').value = clauses.privacy || '';
    document.getElementById('clauseCustom').value = clauses.custom || '';
}

function getClausesData() {
    return {
        state: document.getElementById('clauseState').value,
        payment: document.getElementById('clausePayment').value,
        cancel: document.getElementById('clauseCancel').value,
        restock: document.getElementById('clauseRestock').value,
        license: document.getElementById('clauseLicense').value,
        downPayment: document.getElementById('clauseDownPayment').value,
        lien: document.getElementById('clauseLien').value,
        warranty: document.getElementById('clauseWarranty').value,
        privacy: document.getElementById('clausePrivacy').value,
        custom: document.getElementById('clauseCustom').value
    };
}

async function saveClauses() {
    if (!companyId) return;
    var clauses = getClausesData();
    await sbClient.from('companies').update({ contract_clauses: clauses }).eq('id', companyId);
    if (window._companyInfo) window._companyInfo.contract_clauses = clauses;
    alert('✅ Cláusulas guardadas exitosamente!');
}

// ===== SEED DEMO DATA =====
async function seedDemoData() {
    if (!companyId) return;
    if (!confirm('¿Crear datos de demostración? (3 clientes, 1 lead, 2 citas)')) return;

    // Create demo clients
    var clientRes = await sbClient.from('clients').insert([
        { company_id: companyId, name: 'María González', phone: '(909) 555-0001', email: 'maria.g@email.com', address: '1234 Oak St, San Bernardino, CA 92401', property_type: 'Residencial', source: 'manual' },
        { company_id: companyId, name: 'Roberto Silva', phone: '(909) 555-0002', email: 'roberto.s@email.com', address: '5678 Maple Ave, Riverside, CA 92501', property_type: 'Comercial', source: 'manual' },
        { company_id: companyId, name: 'Ana Martínez', phone: '(951) 555-0003', email: 'ana.m@email.com', address: '910 Pine Dr, Fontana, CA 92335', property_type: 'Residencial', source: 'manual' }
    ]).select();

    // Create demo lead
    await sbClient.from('leads').insert({
        company_id: companyId, name: 'Pedro López', phone: '(909) 555-9999',
        email: 'pedro.l@email.com', service: 'Reparación AC',
        address: '456 Cedar Blvd, Rancho Cucamonga, CA 91730',
        property_type: 'Residencial', lat: 34.1064, lng: -117.5931,
        notes: 'AC no enfría, tiene 8 años. Quiere presupuesto.'
    });

    // Create demo appointments
    var today = new Date();
    var clients = clientRes.data || [];
    if (clients.length >= 2) {
        var tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        var nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 3);
        await sbClient.from('appointments').insert([
            { company_id: companyId, client_id: clients[0].id, title: 'Tune-Up AC Sistema Split', appointment_date: tomorrow.toISOString().split('T')[0], start_time: '09:00', end_time: '10:30', address: clients[0].address, status: 'scheduled' },
            { company_id: companyId, client_id: clients[1].id, title: 'Reparación Furnace 90%', appointment_date: nextWeek.toISOString().split('T')[0], start_time: '14:00', end_time: '16:00', address: clients[1].address, status: 'confirmed' }
        ]);
    }

    // Reload everything
    await loadAllData();
    alert('✅ Datos de demostración creados: 2 técnicos, 3 clientes, 1 lead, 2 citas');
}
