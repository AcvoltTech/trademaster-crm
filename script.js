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
    var res = await sbClient.from('companies').select('id, name, phone, email, contract_clauses, company_documents').eq('created_by', currentUser.id).single();
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
        if (window._companyInfo.contract_clauses && window._companyInfo.contract_clauses.payment) {
            loadClausesFromData(window._companyInfo.contract_clauses);
        } else {
            loadDefaultClauses();
        }
        // Load company documents
        if (window._companyInfo.company_documents) {
            loadCompanyDocs(window._companyInfo.company_documents);
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

var _techPhotoData = null;

function previewTechPhoto(input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (file.size > 3*1024*1024) { alert('⚠️ Foto máx 3MB'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        _techPhotoData = e.target.result;
        var preview = document.getElementById('techPhotoPreview');
        preview.innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover;">';
    };
    reader.readAsDataURL(file);
}

async function handleTechCreate(event) {
    event.preventDefault();
    var data = {
        company_id: companyId,
        name: document.getElementById('techName').value,
        phone: document.getElementById('techPhone').value,
        email: document.getElementById('techEmail').value,
        specialty: document.getElementById('techSpecialty').value,
        vehicle_info: {
            vehicle: document.getElementById('techVehicle').value || '',
            plate: document.getElementById('techPlate').value || '',
            vin: document.getElementById('techVin').value || '',
            color: document.getElementById('techVehicleColor').value || ''
        }
    };
    if (_techPhotoData) data.photo = _techPhotoData;
    await sbClient.from('technicians').insert(data);
    _techPhotoData = null;
    document.getElementById('techPhotoPreview').innerHTML = '<span style="font-size:11px;color:var(--text-muted);text-align:center;">📷 Foto del<br>Técnico</span>';
    hideTechForm(); await loadTechnicians(); updateKPIs(); alert('¡Técnico agregado!');
}

async function loadTechnicians() {
    if (!companyId) return;
    var res = await sbClient.from('technicians').select('*').eq('company_id', companyId).order('name');
    techsData = res.data || [];
    renderTechList(); updateTechSelect(); updateTechCredSelect();
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
    updateJobPermitSelect();
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
    html += '@media print{.print-bar{display:none}.sig-actions{display:none}.nav-bar{display:none}}';
    html += '.nav-bar{position:sticky;top:0;z-index:100;background:#1e293b;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;margin:-20px -20px 20px -20px}';
    html += '.nav-bar a,.nav-bar button{color:white;text-decoration:none;font-size:14px;font-weight:bold;cursor:pointer;border:none;background:none;display:flex;align-items:center;gap:6px}';
    html += '.nav-bar a:hover,.nav-bar button:hover{color:#10b981}';
    html += '</style></head><body>';

    // Navigation bar
    html += '<div class="nav-bar">';
    html += '<a href="#" onclick="window.opener?window.opener.focus():null;window.close();return false;">← Regresar al CRM</a>';
    html += '<span style="color:#10b981;font-weight:bold;font-size:14px;">🔧 Trade Master</span>';
    html += '<button onclick="window.print()">🖨️ Imprimir</button>';
    html += '</div>';

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

    // ===== LEGAL TERMS (from editable clauses) =====
    var cl = (window._companyInfo && window._companyInfo.contract_clauses) ? window._companyInfo.contract_clauses : null;
    if (!cl || !cl.payment) {
        var st = (cl && cl.state) || 'CA';
        cl = (typeof defaultClausesByState !== 'undefined') ? (defaultClausesByState[st] || defaultClausesByState.CA) : null;
    }
    if (cl) {
        html += '<div style="margin-top:24px;border-top:2px solid #10b981;padding-top:16px;">';
        html += '<h3 style="font-size:13px;color:#10b981;margin-bottom:10px;">📋 TERMS & CONDITIONS</h3>';

        function estClause(icon, title, text) {
            if (!text) return '';
            return '<div style="margin-bottom:10px;font-size:10px;line-height:1.5;color:#444;"><strong style="font-size:11px;color:#333;">' + icon + ' ' + title + '</strong><br>' + text.replace(/\n/g, '<br>') + '</div>';
        }

        html += estClause('💰', 'PAYMENT TERMS', cl.payment);

        if (cl.cancel) {
            html += '<div style="margin-bottom:10px;font-size:10px;line-height:1.5;padding:8px;border:1.5px solid #f47621;border-radius:6px;background:#fff8f0;">';
            html += '<strong style="font-size:11px;color:#f47621;">⚠️ RIGHT TO CANCEL</strong><br>';
            html += cl.cancel.replace(/\n/g, '<br>');
            html += '</div>';
        }

        html += estClause('🔄', 'CANCELLATION & RESTOCKING', cl.restock);
        html += estClause('🏛️', 'CONTRACTOR LICENSE', cl.license);
        html += estClause('💵', 'DOWN PAYMENT', cl.downPayment);
        html += estClause('🔗', 'MECHANICS LIEN WARNING', cl.lien);
        html += estClause('🛡️', 'WARRANTY', cl.warranty);
        if (cl.epa) html += estClause('🌿', 'EPA / REFRIGERANTS', cl.epa);
        if (cl.permits) html += estClause('📋', 'PERMITS & INSPECTIONS', cl.permits);
        if (cl.insurance) html += estClause('🦺', 'INSURANCE & BONDING', cl.insurance);
        html += estClause('🔒', 'PRIVACY POLICY', cl.privacy);
        if (cl.refuse) html += estClause('🚫', 'RIGHT TO REFUSE SERVICE', cl.refuse);
        if (cl.custom) html += estClause('📝', 'ADDITIONAL TERMS', cl.custom);
        html += '</div>';
    }

    // ===== COMPANY DOCUMENTS SECTION =====
    var estDocs = (typeof getCompanyDocsForEstimate === 'function') ? getCompanyDocsForEstimate() : [];
    if (estDocs.length > 0) {
        html += '<div style="margin-top:20px;border-top:2px solid #3b82f6;padding-top:16px;">';
        html += '<h3 style="font-size:14px;color:#3b82f6;margin-bottom:12px;">📁 CONTRACTOR DOCUMENTS / DOCUMENTOS DEL CONTRATISTA</h3>';
        html += '<p style="font-size:11px;color:#666;margin-bottom:10px;">The following company documents are available for your review. / Los siguientes documentos de la empresa están disponibles para su revisión.</p>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">';
        estDocs.forEach(function(d, idx) {
            html += '<div style="padding:10px;background:#f0f9ff;border:1px solid #93c5fd;border-radius:8px;text-align:center;">';
            html += '<div style="font-size:12px;font-weight:bold;color:#1e40af;margin-bottom:4px;">' + d.label + '</div>';
            html += '<div style="font-size:10px;color:#666;margin-bottom:6px;">' + d.name + '</div>';
            html += '<button onclick="openDoc(' + idx + ')" style="padding:4px 12px;font-size:11px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;">👁️ Ver / View</button>';
            html += '</div>';
        });
        html += '</div></div>';
    }

    // ===== APPROVAL SECTION =====
    html += '<div style="margin-top:24px;border-top:3px solid #10b981;padding-top:16px;">';
    html += '<h3 style="font-size:16px;color:#10b981;margin-bottom:12px;">✅ APROBACIÓN DEL CLIENTE / CLIENT APPROVAL</h3>';

    // Acceptance checkbox
    html += '<div style="padding:12px;background:#f0fdf4;border:2px solid #10b981;border-radius:8px;margin-bottom:16px;">';
    html += '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;line-height:1.5;">';
    html += '<input type="checkbox" id="acceptTerms" style="margin-top:3px;width:20px;height:20px;accent-color:#10b981;" onchange="document.getElementById(\'approveBtn\').disabled=!this.checked;document.getElementById(\'approveBtn\').style.opacity=this.checked?\'1\':\'0.5\';">';
    html += '<span>I, the undersigned client, have reviewed the estimated work, components, pricing, and all terms and conditions listed above. I understand and agree to the scope of work, payment terms, cancellation policy, and warranty conditions. I authorize the contractor to proceed with the work described in this estimate.<br><br>';
    html += '<em>Yo, el cliente abajo firmante, he revisado el estimado de trabajo, componentes, precios y todos los términos y condiciones. Entiendo y acepto el alcance del trabajo, términos de pago, política de cancelación y condiciones de garantía. Autorizo al contratista a proceder con el trabajo descrito.</em></span>';
    html += '</label></div>';

    // Signature section with canvas pads
    html += '<div class="sig-section">';
    html += '<div class="sig-box"><label>✍️ Firma del Cliente / Client Signature</label><canvas id="sigClient" class="sig-canvas" width="300" height="120"></canvas>';
    html += '<div class="sig-actions"><button onclick="clearSig(\'sigClient\')">🗑️ Borrar</button></div>';
    html += '<div style="margin-top:6px;"><label style="font-size:11px;color:#666;">Nombre / Print Name:</label><input type="text" id="clientPrintName" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:4px;font-size:13px;" placeholder="Nombre completo del cliente"></div></div>';
    html += '<div class="sig-box"><label>👷 Técnico / Technician</label><div class="tech-display">' + (techName || 'N/A') + '</div>';
    html += '<canvas id="sigTech" class="sig-canvas" width="300" height="120" style="margin-top:10px;"></canvas>';
    html += '<div class="sig-actions"><button onclick="clearSig(\'sigTech\')">🗑️ Borrar</button></div></div>';
    html += '<div class="date-box"><label>📅 Fecha</label><div class="date-display">' + dateStr + '</div></div>';
    html += '</div>';

    // Approve button
    html += '<div style="text-align:center;margin:16px 0;">';
    html += '<button id="approveBtn" disabled style="opacity:0.5;padding:14px 40px;font-size:16px;font-weight:bold;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;" onclick="approveEstimate()">✅ CLIENTE APRUEBA / CLIENT APPROVES</button>';
    html += '</div>';
    html += '</div>';

    // ===== PAYMENT COLLECTION SECTION =====
    html += '<div id="paymentSection" style="display:none;margin-top:20px;border-top:3px solid #f47621;padding-top:16px;">';
    html += '<h3 style="font-size:16px;color:#f47621;margin-bottom:12px;">💰 COLECCIÓN DE PAGO / PAYMENT COLLECTION</h3>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">';

    // Payment method
    html += '<div>';
    html += '<label style="font-size:12px;font-weight:bold;color:#333;display:block;margin-bottom:4px;">Método de Pago / Payment Method</label>';
    html += '<select id="payMethod" style="width:100%;padding:10px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;" onchange="togglePayFields()">';
    html += '<option value="">-- Seleccionar --</option>';
    html += '<option value="cash">💵 Cash / Efectivo</option>';
    html += '<option value="check">📝 Check / Cheque</option>';
    html += '<option value="card">💳 Credit/Debit Card / Tarjeta</option>';
    html += '<option value="zelle">⚡ Zelle</option>';
    html += '<option value="venmo">📱 Venmo</option>';
    html += '<option value="other">📋 Otro / Other</option>';
    html += '</select></div>';

    // Payment amount
    html += '<div>';
    html += '<label style="font-size:12px;font-weight:bold;color:#333;display:block;margin-bottom:4px;">Monto / Amount</label>';
    html += '<div style="display:flex;gap:6px;">';
    html += '<button type="button" onclick="document.getElementById(\'payAmount\').value=\'' + grandTotal.toFixed(2) + '\'" style="padding:8px 12px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;white-space:nowrap;">Total $' + grandTotal.toFixed(2) + '</button>';
    html += '<input type="number" id="payAmount" step="0.01" min="0" value="' + grandTotal.toFixed(2) + '" style="flex:1;padding:10px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;">';
    html += '</div></div>';

    html += '</div>';

    // Card fee notice
    html += '<div id="cardFeeNotice" style="display:none;padding:8px 12px;background:#fff3cd;border:1px solid #ffc107;border-radius:6px;margin-bottom:12px;font-size:12px;">';
    html += '⚠️ Credit card payments include a 3% processing fee. / Los pagos con tarjeta incluyen 3% de cargo por procesamiento.';
    html += '<div style="margin-top:6px;font-weight:bold;">Total con fee: <span id="cardTotalWithFee">$0.00</span></div>';
    html += '</div>';

    // Check number field
    html += '<div id="checkField" style="display:none;margin-bottom:12px;">';
    html += '<label style="font-size:12px;font-weight:bold;color:#333;">Número de Cheque / Check Number</label>';
    html += '<input type="text" id="payCheckNum" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;" placeholder="Check #"></div>';

    // Reference field
    html += '<div id="refField" style="display:none;margin-bottom:12px;">';
    html += '<label style="font-size:12px;font-weight:bold;color:#333;">Referencia / Reference (Zelle, Venmo, Confirmation #)</label>';
    html += '<input type="text" id="payReference" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;" placeholder="Transaction ID / Confirmation"></div>';

    // Payment notes
    html += '<div style="margin-bottom:12px;">';
    html += '<label style="font-size:12px;font-weight:bold;color:#333;">Notas de Pago / Payment Notes</label>';
    html += '<textarea id="payNotes" rows="2" style="width:100%;padding:8px;border:2px solid #e5e7eb;border-radius:6px;font-size:13px;" placeholder="Notas adicionales..."></textarea></div>';

    // Collect Payment button
    html += '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">';
    html += '<button onclick="collectPayment()" style="padding:14px 30px;font-size:15px;font-weight:bold;background:#f47621;color:white;border:none;border-radius:8px;cursor:pointer;">💰 Cobrar Pago / Collect Payment</button>';
    html += '<button onclick="skipPayment()" style="padding:14px 30px;font-size:15px;font-weight:bold;background:#6b7280;color:white;border:none;border-radius:8px;cursor:pointer;">⏭️ Cobrar Después / Collect Later</button>';
    html += '</div>';

    html += '</div>'; // end paymentSection

    // ===== CONFIRMATION SECTION (hidden initially) =====
    html += '<div id="confirmSection" style="display:none;margin-top:20px;padding:20px;background:#f0fdf4;border:3px solid #10b981;border-radius:12px;text-align:center;">';
    html += '<div style="font-size:48px;margin-bottom:10px;">✅</div>';
    html += '<h2 style="color:#10b981;margin-bottom:8px;">Estimado Aprobado y Procesado</h2>';
    html += '<p id="confirmMsg" style="font-size:14px;color:#666;"></p>';
    html += '</div>';

    // Print / Save / Convert bar
    html += '<div class="print-bar">';
    html += '<button class="btn-print" onclick="window.print()">🖨️ Imprimir / PDF</button>';
    html += '<button class="btn-save" onclick="window.opener.postMessage({action:\'convertEstimateToInvoice\'},\'*\');this.textContent=\'✅ Enviado!\';this.disabled=true;">📄 Convertir a Factura</button>';
    html += '</div>';

    html += '<p style="text-align:center;margin-top:20px;color:#999;font-size:11px;">Generado por Trade Master CRM | trademastersusa.org</p>';

    // ===== JAVASCRIPT =====
    html += '<script>';
    // Pass document data to estimate window
    html += 'var _estDocs=' + JSON.stringify(estDocs.map(function(d){ return {label:d.label, name:d.name, data:d.data, fileType:d.fileType}; })) + ';';
    html += 'function openDoc(idx){var d=_estDocs[idx];if(!d)return;var w=window.open("","_blank");';
    html += 'if(d.fileType&&d.fileType.startsWith("image/")){w.document.write("<html><body style=\\"margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f1f5f9\\"><img src=\\""+d.data+"\\" style=\\"max-width:100%;max-height:95vh\\"></body></html>");}';
    html += 'else{w.document.write("<html><body style=\\"margin:0\\"><iframe src=\\""+d.data+"\\" style=\\"width:100%;height:100vh;border:none\\"></iframe></body></html>");}';
    html += 'w.document.close();}';

    // Signature pad code
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

    // Approve estimate function
    html += 'function approveEstimate(){';
    html += '  var sigCanvas=document.getElementById("sigClient");';
    html += '  var hasSignature=sigCanvas.classList.contains("signed");';
    html += '  if(!hasSignature){alert("⚠️ Se requiere la firma del cliente / Client signature required");return;}';
    html += '  var clientName=document.getElementById("clientPrintName").value;';
    html += '  if(!clientName.trim()){alert("⚠️ Escriba el nombre del cliente / Enter client name");return;}';
    html += '  document.getElementById("paymentSection").style.display="block";';
    html += '  document.getElementById("approveBtn").textContent="✅ APROBADO / APPROVED";';
    html += '  document.getElementById("approveBtn").style.background="#059669";';
    html += '  document.getElementById("approveBtn").disabled=true;';
    html += '  document.getElementById("paymentSection").scrollIntoView({behavior:"smooth"});';
    html += '  window.opener.postMessage({action:"estimateApproved",clientName:clientName,signature:sigCanvas.toDataURL()}, "*");';
    html += '}';

    // Toggle payment fields based on method
    html += 'function togglePayFields(){';
    html += '  var m=document.getElementById("payMethod").value;';
    html += '  document.getElementById("cardFeeNotice").style.display=(m==="card")?"block":"none";';
    html += '  document.getElementById("checkField").style.display=(m==="check")?"block":"none";';
    html += '  document.getElementById("refField").style.display=(m==="zelle"||m==="venmo"||m==="other")?"block":"none";';
    html += '  if(m==="card"){var amt=parseFloat(document.getElementById("payAmount").value)||0;document.getElementById("cardTotalWithFee").textContent="$"+(amt*1.03).toFixed(2);}';
    html += '}';

    // Collect payment
    html += 'function collectPayment(){';
    html += '  var method=document.getElementById("payMethod").value;';
    html += '  var amount=parseFloat(document.getElementById("payAmount").value)||0;';
    html += '  if(!method){alert("⚠️ Seleccione método de pago / Select payment method");return;}';
    html += '  if(amount<=0){alert("⚠️ Ingrese monto válido / Enter valid amount");return;}';
    html += '  var ref="";';
    html += '  if(method==="check") ref=document.getElementById("payCheckNum").value;';
    html += '  else if(method==="zelle"||method==="venmo"||method==="other") ref=document.getElementById("payReference").value;';
    html += '  var finalAmount=amount;';
    html += '  if(method==="card") finalAmount=amount*1.03;';
    html += '  var payData={action:"collectPayment",method:method,amount:finalAmount,reference:ref,notes:document.getElementById("payNotes").value,clientName:document.getElementById("clientPrintName").value};';
    html += '  window.opener.postMessage(payData,"*");';
    html += '  document.getElementById("paymentSection").style.display="none";';
    html += '  document.getElementById("confirmSection").style.display="block";';
    html += '  var methodNames={cash:"Efectivo",check:"Cheque",card:"Tarjeta",zelle:"Zelle",venmo:"Venmo",other:"Otro"};';
    html += '  document.getElementById("confirmMsg").innerHTML="<strong>Pago de $"+finalAmount.toFixed(2)+" recibido via "+methodNames[method]+"</strong>"+(ref?"<br>Ref: "+ref:"")+"<br><br>El estimado ha sido aprobado y el pago registrado.";';
    html += '  document.getElementById("confirmSection").scrollIntoView({behavior:"smooth"});';
    html += '}';

    // Skip payment (collect later)
    html += 'function skipPayment(){';
    html += '  window.opener.postMessage({action:"estimateApprovedNoPay",clientName:document.getElementById("clientPrintName").value},"*");';
    html += '  document.getElementById("paymentSection").style.display="none";';
    html += '  document.getElementById("confirmSection").style.display="block";';
    html += '  document.getElementById("confirmMsg").innerHTML="<strong>Estimado aprobado.</strong><br>Pago pendiente — se cobrará después.<br><br>Puede convertir este estimado a factura desde el CRM.";';
    html += '  document.getElementById("confirmSection").scrollIntoView({behavior:"smooth"});';
    html += '}';

    html += 'window.onload=function(){initSigPad("sigClient");initSigPad("sigTech");};';
    html += '<\/script>';
    html += '</body></html>';
    w.document.write(html);
    w.document.close();
}

function generateEstimatePDF() { presentEstimateToClient(); }

// Listen for "Convert to Invoice" message from estimate popup
window.addEventListener('message', function(event) {
    if (!event.data || !event.data.action) return;
    if (event.data.action === 'convertEstimateToInvoice') {
        convertEstimateToInvoice();
    }
    if (event.data.action === 'estimateApproved') {
        console.log('✅ Estimate approved by:', event.data.clientName);
        // Could save approval status to DB here
    }
    if (event.data.action === 'collectPayment') {
        console.log('💰 Payment collected:', event.data);
        // Auto-convert to invoice with payment
        convertEstimateToInvoice(event.data);
    }
    if (event.data.action === 'estimateApprovedNoPay') {
        console.log('⏭️ Estimate approved, payment later:', event.data.clientName);
        convertEstimateToInvoice({ noPay: true });
    }
});

async function convertEstimateToInvoice(paymentInfo) {
    if (!companyId) return;
    var decision = document.getElementById('estClientDecision').value;
    var discount = parseFloat(document.getElementById('estDiscount').value) || 0;
    var taxRate = parseFloat(document.getElementById('estTax').value) || 0;
    var scFee = serviceCallFee || 0;

    // Build line items from estimate
    var lines = [];
    if (decision !== 'no') {
        selectedEstItems.forEach(function(i) {
            lines.push({
                name: i.name,
                qty: i.qty,
                unit_price: i.price,
                labor: i.labor,
                total: (i.price + i.labor) * i.qty
            });
        });
    }

    // Calculate totals
    var subtotal = 0;
    lines.forEach(function(l) { subtotal += l.total; });
    var discAmt = subtotal * (discount / 100);
    var afterDisc = subtotal - discAmt;
    var taxAmt = (afterDisc + scFee) * (taxRate / 100);
    var total = afterDisc + scFee + taxAmt;

    // Get client info from job if available
    var clientName = '', clientPhone = '', clientEmail = '', clientAddr = '', techId = null, jobId = null;
    var jobSel = document.getElementById('estJobSelect');
    if (jobSel && jobSel.value) {
        jobId = jobSel.value;
        var job = jobsData.find(function(j) { return j.id === jobSel.value; });
        if (job) {
            clientName = job.client_name || job.title || '';
            clientAddr = job.address || '';
            techId = job.technician_id || null;
        }
    }

    // Override client name if provided from estimate approval
    if (paymentInfo && paymentInfo.clientName) clientName = paymentInfo.clientName;

    var invNumber = 'INV-' + new Date().getFullYear() + String(new Date().getMonth()+1).padStart(2,'0') + '-' + String(Math.floor(Math.random()*9000)+1000);

    // Determine payment status
    var amountPaid = 0;
    var balanceDue = total;
    var status = 'draft';
    var paymentMethod = null;
    var paymentRef = null;
    var paymentDate = null;

    if (paymentInfo && !paymentInfo.noPay && paymentInfo.amount) {
        amountPaid = paymentInfo.amount;
        balanceDue = Math.max(0, total - amountPaid);
        paymentMethod = paymentInfo.method || null;
        paymentRef = paymentInfo.reference || null;
        paymentDate = new Date().toISOString();
        status = balanceDue <= 0 ? 'paid' : 'partial';
    } else if (paymentInfo && paymentInfo.noPay) {
        status = 'sent'; // Approved but unpaid
    }

    var data = {
        company_id: companyId,
        invoice_number: invNumber,
        job_id: jobId,
        technician_id: techId,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        client_address: clientAddr,
        line_items: lines,
        service_call_fee: scFee,
        subtotal: subtotal,
        discount_percent: discount,
        discount_amount: discAmt,
        tax_percent: taxRate,
        tax_amount: taxAmt,
        total: total,
        balance_due: balanceDue,
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        payment_reference: paymentRef,
        payment_date: paymentDate,
        notes: document.getElementById('estNotes').value || '',
        status: status
    };

    var res = await sbClient.from('invoices').insert(data).select().single();
    if (res.data) {
        // If payment was collected, also log it in payments table
        if (amountPaid > 0) {
            await sbClient.from('payments').insert({
                company_id: companyId,
                invoice_id: res.data.id,
                amount: amountPaid,
                payment_method: paymentMethod,
                reference: paymentRef,
                notes: paymentInfo.notes || 'Pago al aprobar estimado'
            });
        }
        var msg = '✅ Factura ' + invNumber + ' creada por $' + total.toFixed(2);
        if (amountPaid > 0) msg += '\n💰 Pago de $' + amountPaid.toFixed(2) + ' registrado (' + paymentMethod + ')';
        if (balanceDue > 0 && amountPaid > 0) msg += '\n📋 Balance pendiente: $' + balanceDue.toFixed(2);
        msg += '\n\nVe a Facturas para verla.';
        alert(msg);
        await loadInvoices();
    } else {
        alert('❌ Error al crear factura: ' + (res.error ? res.error.message : 'Error desconocido'));
    }
}

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
    if (cl.epa) html += clauseBlock('🌿', 'EPA / REFRIGERANTS & ENVIRONMENTAL', cl.epa);
    if (cl.permits) html += clauseBlock('📋', 'PERMITS & INSPECTIONS / PERMISOS', cl.permits);
    if (cl.insurance) html += clauseBlock('🦺', 'INSURANCE & BONDING / SEGURO', cl.insurance);
    html += clauseBlock('🔒', 'PRIVACY POLICY / POLÍTICA DE PRIVACIDAD', cl.privacy);
    if (cl.refuse) html += clauseBlock('🚫', 'RIGHT TO REFUSE SERVICE / RESERVA DE DERECHO', cl.refuse);
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
    renderEstimatePipeline();
    generateNotifications();
    loadServicePlans();
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
// ===== STATE REGULATION SUMMARIES =====
var stateRegSummaries = {
    CA: '🏛️ CSLB C-20 License Required | Bond: $25,000 | Down Payment Max: $1,000 or 10% | 3-Day Cancel (5 days for 65+) | Permits required for installations | HERS testing required',
    TX: '🏛️ TDLR ACR License Required (Class A/B) | Insurance: $100K-$300K GL | No down payment limit by law | 3-Day Cancel (in-home sales) | TDLR regulates all AC&R work',
    AZ: '🏛️ ROC License Required | Bond: $2,500-$15,000+ | 3-Day Cancel | ROC complaint process | Permits required by municipality',
    NV: '🏛️ NSCB License Required | Bond: varies by class | Down Payment Max: 10% | 3-Day Cancel | Financial responsibility required',
    FL: '🏛️ DBPR License Required (CAC/CFC) | Insurance: $100K GL + $25K property | No statutory down payment limit | 3-Day Cancel (home solicitation) | Building permits required',
    NY: '🏛️ Local License/Registration Required | NYC: DCA License | 3-Day Cancel | Home Improvement Act protections | Insurance required by locality',
    CO: '🏛️ State License NOT required (local jurisdictions vary) | Denver, Boulder, Aurora require local licenses | 3-Day Cancel | Permits by municipality',
    GA: '🏛️ Low-Voltage & Conditioned Air License via SOS | Bond: $10,000+ | 3-Day Cancel | Georgia Residential & General Contractor Act',
    IL: '🏛️ No statewide license (Chicago requires local license) | 3-Day Cancel (Home Repair & Remodeling Act) | Permits by municipality',
    NJ: '🏛️ HVAC License via DCA | Registration required | 3-Day Cancel | Consumer Fraud Act protections | Permits required',
    NC: '🏛️ State Board of Examiners license required (H-1, H-2, H-3) | Bond: $10,000 | 3-Day Cancel | Permits required',
    OH: '🏛️ HVAC License via OCILB | Bond required | 3-Day Cancel (Home Solicitation Sales Act) | Permits by municipality',
    PA: '🏛️ No statewide license (Philadelphia, Pittsburgh require local) | 3-Day Cancel (Consumer Protection Law) | Permits required',
    VA: '🏛️ DPOR Class A/B/C Contractor License | Bond: $10,000-$50,000 | 3-Day Cancel | Virginia Contractor Transaction Recovery Fund',
    WA: '🏛️ L&I Electrical/HVAC Specialty License | Bond: $12,000 | 3-Day Cancel | Permits required statewide',
    OR: '🏛️ CCB License Required | Bond: $20,000 | 3-Day Cancel (Oregon Home Solicitation Sales Act) | Permits required',
    MI: '🏛️ Mechanical Contractor License via LARA | Bond required | 3-Day Cancel (Home Improvement Finance Act) | Permits required',
    MA: '🏛️ No statewide HVAC license (local permits required) | Home Improvement Contractor Registration | 3-Day Cancel',
    TN: '🏛️ Board for Licensing Contractors (projects >$25,000) | Bond: $10,000+ | 3-Day Cancel | Permits by municipality',
    MO: '🏛️ No statewide license (Kansas City, St. Louis require local) | 3-Day Cancel (Merchandising Practices Act) | Permits vary',
    SC: '🏛️ LLR Mechanical Contractor License | Bond required | 3-Day Cancel | Reciprocity with TX & GA',
    LA: '🏛️ LSLBC Mechanical License | Bond: $5,000-$15,000 | 3-Day Cancel | Permits required statewide',
    MD: '🏛️ MHIC License Required | Bond: varies | 3-Day Cancel | Maryland Home Improvement Commission regulates',
    MN: '🏛️ DLI License Required | Bond: $25,000 | 3-Day Cancel | Permits required statewide',
    WI: '🏛️ DSPS Credential Required | Bond varies | 3-Day Cancel | Wisconsin Administrative Code regulates',
    IN: '🏛️ No statewide license (local jurisdictions vary) | 3-Day Cancel | Permits by municipality',
    UT: '🏛️ DOPL S350 License Required | Bond: $15,000 | 3-Day Cancel | Permits required',
    OK: '🏛️ CIB Mechanical License | Bond: varies | 3-Day Cancel | Oklahoma Consumer Protection Act',
    CT: '🏛️ DCP Registration Required (HIC) | Bond varies | 3-Day Cancel (Home Solicitation Sales Act) | Permits required',
    NM: '🏛️ CID License Required (Mechanical) | Bond: varies | 3-Day Cancel | Permits required',
    KY: '🏛️ HVAC License via DHBC (master/journeyman) | Bond varies | 3-Day Cancel | Permits required',
    AL: '🏛️ ASBHCE License Required | Bond required | 3-Day Cancel (Alabama Home Solicitation Act) | Permits vary',
    HI: '🏛️ DCCA C-16 Specialty License | Bond: $15,000 | 3-Day Cancel | Permits required statewide',
    MS: '🏛️ Board of Contractors License (>$50K) | Bond varies | 3-Day Cancel | Permits by municipality',
    AR: '🏛️ Contractors Licensing Board (>$50K) | Bond varies | 3-Day Cancel | Permits by municipality',
    KS: '🏛️ No statewide license (local jurisdictions vary) | 3-Day Cancel | Permits by municipality',
    IA: '🏛️ No statewide HVAC license | Mechanical permits required | 3-Day Cancel',
    NE: '🏛️ No statewide license | Local mechanical permits | 3-Day Cancel',
    ME: '🏛️ Oil & Solid Fuel Board (heating) | 3-Day Cancel | Permits required',
    NH: '🏛️ No statewide license | Gas fitter license for gas work | 3-Day Cancel | Permits required',
    VT: '🏛️ No statewide license | Permits by municipality | 3-Day Cancel',
    WV: '🏛️ Division of Labor HVAC License | Bond varies | 3-Day Cancel | Permits required',
    ND: '🏛️ No statewide license | Permits by municipality | 3-Day Cancel',
    SD: '🏛️ No statewide license | Permits by municipality | 3-Day Cancel',
    MT: '🏛️ No statewide license | Permits by municipality | 3-Day Cancel',
    WY: '🏛️ No statewide license | Permits by municipality | 3-Day Cancel',
    DE: '🏛️ DAPE License Required | Bond: $5,000 | 3-Day Cancel | Permits required',
    RI: '🏛️ Contractor Registration Required | Bond: $10,000 | 3-Day Cancel | Permits required',
    ID: '🏛️ HVAC License via DBS | Bond: $2,000 | 3-Day Cancel | Permits required',
    DC: '🏛️ DCRA License Required | Bond required | 3-Day Cancel | All permits through DCRA',
    PR: '🏛️ DACO regulates contractors | Bond varies | Cancellation per PR Consumer Affairs | Permits required'
};

var _commonRefuse = 'RIGHT TO REFUSE SERVICE\n\nWe reserve the right to decline or discontinue service to any customer whose behavior negatively affects our business operations, our team, or our company\'s reputation. This includes, but is not limited to:\n\n• Verbal abuse, threats, or harassment directed at our technicians or staff.\n• Posting unfounded, defamatory, or fraudulent reviews on social media, Google, Yelp, or any other review platform with the intent to damage our business reputation.\n• Refusal to allow safe working conditions or access to equipment.\n• Repeated failure to honor payment agreements.\n\nAll service disputes should be communicated directly to our office before any public action. We are committed to resolving issues professionally and fairly.';

// ===== COMPREHENSIVE DEFAULT CLAUSES BY STATE =====
var defaultClausesByState = {
    CA: {
        payment: 'Payment is due upon completion of work unless otherwise agreed in writing. Accepted methods: Cash, Check, Debit Card, Credit Card, Zelle, Venmo.\n\nCredit Card: A processing fee of 3% applies to all credit card transactions.\nReturned/Bounced Checks: A fee of 10% of the check amount will be assessed, plus any bank fees.\nLate Payment: Invoices not paid within 30 days are subject to a late fee of 1.5% per month (18% per annum).',
        cancel: 'CALIFORNIA 3-DAY RIGHT TO CANCEL (BPC §7159 & Civil Code §1689.5-1689.14)\n\nYou, the buyer, may cancel this transaction at any time prior to midnight of the THIRD BUSINESS DAY after the date of this transaction. If you cancel, any property traded in, any payments made by you, and any negotiable instrument executed by you will be returned within 10 business days following receipt of your cancellation notice.\n\nEXCEPTIONS:\n• Service/repair contracts under $750 where work begins immediately.\n• Contracts negotiated at the contractor\'s place of business.\n\nSENIOR CITIZENS (65+): Per California AB 2471, you have FIVE (5) business days to cancel.\n\nTo cancel, mail or deliver a signed copy of the cancellation notice to the contractor at the address shown on this contract.',
        restock: 'CANCELLATION AFTER 3-DAY PERIOD:\n\n• 20% restocking fee on materials/equipment purchased, ordered, or reserved (proof of purchase required).\n• Permits already pulled and paid for are non-refundable.\n• Custom or special-order equipment that cannot be returned: customer responsible for full cost.\n• Labor already performed billed at the agreed-upon rate.\n• All refunds processed within 15 business days.',
        license: 'CALIFORNIA CONTRACTORS STATE LICENSE BOARD (CSLB) NOTICE\n\nCSLB is the state consumer protection agency that licenses and regulates construction contractors. Any contractor performing work valued at $1,000 or more (labor + materials) must hold a valid CSLB license. As of January 1, 2025 (AB 2622), the licensing threshold increased from $500 to $1,000.\n\nHVAC contractors must hold a C-20 (Warm-Air Heating, Ventilating & Air-Conditioning) license. Electrical work requires a separate C-10 license.\n\nContact CSLB for information about licensed contractors, complaints, disciplinary actions, and civil judgments.\n\nCSLB: 800-321-CSLB (2752) | www.cslb.ca.gov | P.O. Box 26000, Sacramento, CA 95826\n\nIMPORTANT: Always use licensed contractors. File complaints within 4 years for CSLB to investigate.',
        downPayment: 'CALIFORNIA DOWN PAYMENT LIMIT (BPC §7159)\n\nThe down payment cannot exceed $1,000 or 10% of the contract price, WHICHEVER IS LESS. Subsequent progress payments cannot exceed the value of work performed or materials delivered.\n\nException: Licensees who carry a special Consumer Protection Bond (shown on CSLB website) may collect larger deposits. Verify at www.cslb.ca.gov.',
        lien: 'MECHANICS LIEN WARNING (California Civil Code §8000-9566)\n\nAnyone who helps improve your property but is not paid may record a MECHANICS LIEN against your property at the County Recorder\'s Office. This could result in a court-ordered foreclosure sale.\n\nTo protect yourself:\n• Request lien waivers (conditional/unconditional) with each payment.\n• Keep copies of all contracts, change orders, and payment records.\n• Make checks payable to both the contractor and material supplier when appropriate.',
        warranty: 'WARRANTY ON LABOR: All work is guaranteed for ONE (1) YEAR from date of completion for labor and workmanship.\n\nWARRANTY ON PARTS:\n• OEM (Original Equipment Manufacturer) Parts: 1 year manufacturer warranty.\n• Aftermarket/Generic Parts: 3 months warranty.\n• New Equipment Parts: Manufacturer warranty from 1 to 10 years depending on brand, model, and component (compressors typically 5-10 years, parts 1-5 years).\n\nAll warranty claims must be reported in writing within the warranty period. Warranty does NOT cover damage caused by: misuse, neglect, lack of maintenance, power surges, acts of nature, unauthorized modifications, or improper operation by the customer.',
        epa: 'EPA SECTION 608 COMPLIANCE\n\nAll technicians handling refrigerants are EPA Section 608 certified as required by the Clean Air Act. Refrigerant recovery, recycling, and reclamation follow EPA regulations. Intentional venting of refrigerants is prohibited (fines up to $44,539 per day per violation).\n\nCALIFORNIA ADDITIONAL: CARB (California Air Resources Board) has additional regulations on refrigerant management and reporting. HFC phase-down under the AIM Act may affect equipment recommendations.',
        permits: 'PERMITS & INSPECTIONS (California Building Code / Title 24)\n\nBuilding permits are REQUIRED for: all equipment replacements, new installations, duct modifications, and gas line work. Per California Title 24, HERS (Home Energy Rating System) testing and verification is required for HVAC installations.\n\n2025 Energy Code Update: Effective Jan 1, 2026, heat pump installations must comply with the 2025 Building Energy Efficiency Standards.\n\nThe contractor is responsible for pulling all required permits, scheduling inspections, and ensuring code compliance. Permit costs are included in the contract unless otherwise stated.',
        insurance: 'INSURANCE & BONDING (California Requirements)\n\n• Contractor License Bond: $25,000 (required by CSLB for all active licenses).\n• Workers\' Compensation: Required for all employees (or exempt if sole proprietor with no employees).\n• General Liability Insurance: Recommended minimum $1,000,000.\n• Vehicle Insurance: All company vehicles are insured.\n\nVerify contractor insurance status at www.cslb.ca.gov.',
        privacy: 'PRIVACY POLICY: Personal information is collected solely for providing HVAC services, scheduling, billing, and maintaining service records. Information will not be sold, shared, or distributed to third parties without consent, except as required by law. Service records retained for warranty and regulatory compliance (minimum 4 years per CSLB requirements).',
        refuse: 'RIGHT TO REFUSE SERVICE\n\nWe reserve the right to decline or discontinue service to any customer whose behavior negatively affects our business operations, our team, or our company\'s reputation. This includes, but is not limited to:\n\n• Verbal abuse, threats, or harassment directed at our technicians or staff.\n• Posting unfounded, defamatory, or fraudulent reviews on social media, Google, Yelp, or any other review platform with the intent to damage our business reputation.\n• Refusal to allow safe working conditions or access to equipment.\n• Repeated failure to honor payment agreements.\n\nAll service disputes should be communicated directly to our office before any public action. We are committed to resolving issues professionally and fairly.',
        custom: ''
    },
    TX: {
        payment: 'Payment is due upon completion of work unless otherwise agreed in writing. Accepted methods: Cash, Check, Debit Card, Credit Card, Zelle, Venmo.\n\nCredit Card: 3% processing fee applies.\nReturned/Bounced Checks: 10% fee assessed plus bank charges.\nLate Payment: Invoices past 30 days subject to 1.5%/month late fee.',
        cancel: 'TEXAS 3-DAY RIGHT TO CANCEL (Business & Commerce Code §601.052)\n\nFor contracts signed at the customer\'s residence (door-to-door/home solicitation), you may cancel within THREE (3) BUSINESS DAYS of signing. Written notice of cancellation must be delivered to the contractor.\n\nEXCEPTIONS:\n• Emergency repairs requested by the homeowner where work has begun.\n• Contracts negotiated at the contractor\'s place of business.\n• Work valued under $25.\n\nThe contractor must provide a written Notice of Cancellation form at the time of signing.',
        restock: 'CANCELLATION AFTER 3-DAY PERIOD:\n\n• 20% restocking fee on materials/equipment purchased (proof of receipt required).\n• Permits already obtained are non-refundable.\n• Custom or special-order equipment: customer responsible for full cost.\n• Labor already performed billed at the agreed rate.\n• Refunds processed within 15 business days.',
        license: 'TEXAS DEPARTMENT OF LICENSING AND REGULATION (TDLR) NOTICE\n\nAll contractors who install, repair, or maintain air conditioning, refrigeration, or heating systems MUST have a TDLR ACR (Air Conditioning & Refrigeration) License. Companies must employ a licensed ACR contractor at each permanent location.\n\nLicense Classes:\n• Class A: Unlimited capacity systems.\n• Class B: Systems up to 25 tons cooling / 1.5 million BTU heating.\n\nEndorsements: Environmental Air Conditioning, Commercial Refrigeration & Process Cooling.\n\nTDLR: (800) 803-9202 | www.tdlr.texas.gov | P.O. Box 12157, Austin, TX 78711',
        downPayment: 'TEXAS DOWN PAYMENT: Texas law does not set a specific statutory limit on down payments for home improvement contracts. However, payments should reasonably correspond to the value of work completed or materials delivered. Large upfront payments without corresponding work may violate the Texas Deceptive Trade Practices Act (DTPA).',
        lien: 'MECHANICS LIEN (Texas Property Code Chapter 53)\n\nContractors, subcontractors, and material suppliers may file a mechanics lien if not paid. Key deadlines:\n• Original contractor: lien must be filed by the 15th day of the 3rd month after work completed.\n• Subcontractors/suppliers: must send preliminary notice within specific timeframes.\n\nHomeowners should request lien waivers with each payment. Retain all payment records.',
        warranty: 'WARRANTY ON LABOR: All work guaranteed for ONE (1) YEAR from completion.\n\nWARRANTY ON PARTS:\n• OEM Parts: 1 year manufacturer warranty.\n• Aftermarket/Generic Parts: 3 months warranty.\n• New Equipment: Manufacturer warranty 1-10 years depending on brand/model/component.\n\nClaims must be reported in writing. Excludes misuse, neglect, power surges, acts of nature, unauthorized modifications.',
        epa: 'EPA SECTION 608 COMPLIANCE\n\nAll technicians are EPA Section 608 certified as required by the Clean Air Act. Refrigerant recovery, recycling, and reclamation follow federal regulations. Intentional venting prohibited (fines up to $44,539/day/violation).\n\nTEXAS ADDITIONAL: Texas Commission on Environmental Quality (TCEQ) has additional requirements for refrigerant management and equipment disposal.',
        permits: 'PERMITS & INSPECTIONS (Texas Municipal Codes / IRC / IMC)\n\nPermit requirements vary by city and county. Most Texas municipalities require permits for: equipment replacements, new installations, gas line modifications, and ductwork changes.\n\nThe contractor is responsible for pulling permits and scheduling inspections where required. Some rural areas may not require permits — verify with your local jurisdiction. Permit costs are included unless otherwise stated.',
        insurance: 'INSURANCE & BONDING (Texas TDLR Requirements)\n\n• General Liability Insurance: REQUIRED by TDLR.\n  - Class A: $300,000/occurrence, $600,000 aggregate.\n  - Class B: $100,000/occurrence, $200,000 aggregate.\n• Workers\' Compensation: Required if employees are on staff.\n• Vehicle Insurance: All company vehicles insured.\n\nVerify contractor license and insurance at www.tdlr.texas.gov.',
        privacy: 'PRIVACY POLICY: Personal information collected for HVAC services, billing, and service records only. Not sold or shared without consent except as required by law.',
        refuse: _commonRefuse,
        custom: ''
    },
    AZ: {
        payment: 'Payment is due upon completion. Accepted methods: Cash, Check, Debit Card, Credit Card, Zelle, Venmo.\n\nCredit Card: 3% processing fee. Bounced Checks: 10% fee. Late Payment: 1.5%/month after 30 days.',
        cancel: 'ARIZONA 3-DAY RIGHT TO CANCEL (ARS §44-5001 – Door-to-Door Sales)\n\nFor transactions at the buyer\'s residence, you may cancel within THREE (3) BUSINESS DAYS. The contractor must provide a written Notice of Cancellation.\n\nEXCEPTIONS: Emergency repairs, contracts at contractor\'s business location.',
        restock: 'CANCELLATION AFTER 3-DAY PERIOD:\n\n• 20% restocking fee with proof of purchase.\n• Non-refundable permit costs deducted.\n• Custom equipment: customer responsible.\n• Completed labor billed at agreed rate.',
        license: 'ARIZONA REGISTRAR OF CONTRACTORS (ROC) NOTICE\n\nAll contractors must be licensed by the ROC. HVAC work falls under the KA (Mechanical - Heating & Cooling) or KB (Plumbing) classifications depending on scope.\n\nROC investigates complaints and can order corrective work, assess penalties, suspend or revoke licenses.\n\nROC: (602) 542-1525 | roc.az.gov | 1700 W Washington St, Phoenix, AZ 85007\n\nReciprocity: Arizona has reciprocity agreements with several states for equivalent licensing.',
        downPayment: 'ARIZONA DOWN PAYMENT: Arizona law requires that total payments cannot exceed the value of work performed and materials delivered, plus a reasonable allowance for overhead and profit. There is no specific statutory cap like California\'s 10%, but collecting excessive deposits before work begins may violate consumer protection laws.',
        lien: 'MECHANICS LIEN (Arizona ARS §33-981 et seq.)\n\nContractors must serve a PRELIMINARY 20-DAY NOTICE to preserve lien rights. Lien must be recorded within 120 days after completion. Homeowners should request lien waivers with each payment.',
        warranty: 'WARRANTY ON LABOR: One (1) year from completion.\n\nPARTS:\n• OEM Parts: 1 year warranty. • Aftermarket: 3 months. • New Equipment: 1-10 years per manufacturer.\n\nWritten claims required. Excludes misuse, neglect, acts of nature.',
        epa: 'EPA SECTION 608 COMPLIANCE\n\nAll technicians EPA 608 certified. Refrigerant handled per Clean Air Act. Arizona Department of Environmental Quality (ADEQ) may have additional requirements for equipment disposal and refrigerant management.',
        permits: 'PERMITS & INSPECTIONS\n\nPermit requirements vary by city/county. Most Arizona municipalities (Phoenix, Tucson, Mesa, etc.) require permits for HVAC installations and replacements. ROC may investigate unpermitted work.\n\nContractor responsible for permits and inspections. Desert climate considerations: proper sizing (Manual J) and insulation are critical.',
        insurance: 'INSURANCE & BONDING (Arizona ROC Requirements)\n\nContractor Bond: Required by ROC, amount varies by license class ($2,500-$15,000+).\nGeneral Liability: Required.\nWorkers\' Compensation: Required if employees.\n\nVerify at roc.az.gov.',
        privacy: 'PRIVACY: Information collected for HVAC services only. Not shared without consent except as required by law.',
        refuse: _commonRefuse,
        custom: ''
    },
    NV: {
        payment: 'Payment due upon completion. Credit Card: +3%. Bounced Check: +10%. Late: 1.5%/month after 30 days.',
        cancel: 'NEVADA 3-DAY RIGHT TO CANCEL (NRS Chapter 598)\n\nFor home solicitation sales, you may cancel within THREE (3) BUSINESS DAYS. Written notice required. Contractor must provide Notice of Cancellation form.',
        restock: 'Post-cancellation: 20% restocking fee with receipt. Non-refundable permits. Custom equipment at customer cost. Labor billed at agreed rate.',
        license: 'NEVADA STATE CONTRACTORS BOARD (NSCB) NOTICE\n\nAll contractors must hold a valid NSCB license. HVAC work requires the appropriate classification (C-21 Refrigeration & Air Conditioning, or C-1 Plumbing & Heating).\n\nNSCB: (702) 486-1100 (Las Vegas) | (775) 688-1141 (Reno) | nscb.nv.gov\n\nNevada offers reciprocity to HVAC professionals from states with comparable or stricter requirements.',
        downPayment: 'NEVADA DOWN PAYMENT LIMIT (NRS 624.607): Deposits cannot exceed 10% of the contract price or the cost of initial materials, whichever is less, unless a bond covering the deposit amount is posted.',
        lien: 'MECHANICS LIEN (NRS Chapter 108)\n\nNotice of Right to Lien must be given within 15 days of first work or materials delivery. Lien must be recorded within 90 days of completion. Request lien waivers with payments.',
        warranty: 'One (1) year labor warranty. Parts: OEM 1 year, Aftermarket 3 months, New Equipment 1-10 years per manufacturer. Written claims required. Excludes misuse/neglect/acts of nature.',
        epa: 'EPA Section 608 certified technicians. Refrigerant managed per Clean Air Act. Nevada Division of Environmental Protection (NDEP) regulates equipment disposal.',
        permits: 'Permits required by municipality (Clark County, Washoe County, etc.). Contractor responsible for permits/inspections. Energy code compliance required.',
        insurance: 'NSCB requires financial responsibility filing (bond, insurance, or combination). General liability and workers\' comp required. Verify at nscb.nv.gov.',
        privacy: 'Information collected for HVAC services only. Not shared without consent.',
        refuse: _commonRefuse,
        custom: ''
    },
    FL: {
        payment: 'Payment due upon completion. Credit Card: +3%. Bounced Check: +10%. Late: 1.5%/month after 30 days.',
        cancel: 'FLORIDA 3-DAY RIGHT TO CANCEL (Home Solicitation Sales)\n\nFor transactions at the buyer\'s home, you may cancel within THREE (3) BUSINESS DAYS (72 hours). Written cancellation required.\n\nFlorida does NOT have a general statutory cooling-off period for all contracts — only specific types including home solicitation.\n\nEXCEPTIONS: Emergency repairs, contracts at contractor\'s business.',
        restock: 'Post-cancellation: 20% restocking fee with receipt. Non-refundable permits. Custom equipment at customer cost. Labor billed at agreed rate.',
        license: 'FLORIDA DEPARTMENT OF BUSINESS AND PROFESSIONAL REGULATION (DBPR) NOTICE\n\nFlorida requires HVAC contractors to hold a state license through DBPR:\n• CAC (Certified Air Conditioning Contractor): Work statewide.\n• CFC (Certified Plumbing/Mechanical Contractor): Combined scope.\n• Registered contractors: Limited to specific local areas.\n\nLicense Classes:\n• Class A: Unlimited capacity.\n• Class B: Up to 500,000 BTU heating / 25 tons cooling.\n\nDBPR: (850) 487-1395 | myfloridalicense.com',
        downPayment: 'FLORIDA DOWN PAYMENT: Florida law does not set a specific statutory cap on deposits for HVAC work. However, the Florida Home Improvement Finance Act and consumer protection laws require that payments reasonably correspond to work performed.',
        lien: 'MECHANICS LIEN (Florida Statutes Chapter 713)\n\nContractors must serve a Notice to Owner within the first 45 days of work. Lien must be recorded within 90 days of last work. Request lien waivers with each payment.',
        warranty: 'One (1) year labor warranty. Parts: OEM 1 year, Aftermarket 3 months, New Equipment 1-10 years per manufacturer. Written claims required. Hurricane/flood/salt-air corrosion damage excluded.',
        epa: 'EPA Section 608 certified. Florida Department of Environmental Protection (DEP) regulates equipment disposal. Coastal salt-air corrosion considerations apply.',
        permits: 'BUILDING PERMITS REQUIRED for all HVAC installations, replacements, and major repairs per Florida Building Code. Inspections required. Contractor pulls permits. Hurricane strapping/anchoring requirements apply in coastal areas.',
        insurance: 'FLORIDA REQUIREMENTS:\n• General Liability: $100,000 minimum.\n• Property Damage: $25,000 minimum.\n• Workers\' Compensation: Required for ALL contractors in building trades.\n\nVerify at myfloridalicense.com.',
        privacy: 'Information collected for HVAC services only. Not shared without consent.',
        refuse: _commonRefuse,
        custom: ''
    },
    NY: {
        payment: 'Payment due upon completion. Credit Card: +3%. Bounced Check: +10%. Late: 1.5%/month after 30 days.',
        cancel: 'NEW YORK 3-DAY RIGHT TO CANCEL (General Business Law §36-A & Home Improvement Act §770)\n\nYou may cancel within THREE (3) BUSINESS DAYS of signing. Written notice must be sent to the contractor. The contractor must provide a Notice of Cancellation form.\n\nNew York expands cancellation rights for home improvement contracts and provides additional protections through the Home Improvement Contractor Registration program.',
        restock: 'Post-cancellation: 20% restocking fee with receipt. Non-refundable permits. Custom equipment at customer cost. Labor billed at agreed rate.',
        license: 'NEW YORK CONTRACTOR LICENSE NOTICE\n\nNew York requires home improvement contractors to register with the local county or city consumer affairs office.\n\nNYC: Contractors must be licensed by the Department of Consumer and Worker Protection (DCWP). License required for work over $200.\n\nWestchester, Nassau, Suffolk: County registration/licensing required.\n\nNew York State does not have a statewide HVAC contractor license, but local requirements apply.',
        downPayment: 'NEW YORK: NYC Administrative Code limits deposits to one-third of the total contract price. Other jurisdictions may vary. Check local consumer protection laws.',
        lien: 'MECHANICS LIEN (New York Lien Law Article 2)\n\nMechanics liens may be filed within 8 months after completion of work (4 months for single-family residential). Request lien waivers with payments.',
        warranty: 'One (1) year labor warranty. Parts: OEM 1 year, Aftermarket 3 months, New Equipment 1-10 years per manufacturer. Written claims required.',
        epa: 'EPA Section 608 certified. New York State DEC has additional refrigerant management requirements. NYC has local environmental regulations.',
        permits: 'Permits required by municipality. NYC Department of Buildings (DOB) permits required for most HVAC work. Contractor responsible for permits/inspections.',
        insurance: 'New York requires general liability insurance for licensed/registered contractors. Workers\' compensation required. NYC may have additional insurance requirements. Verify with local consumer affairs office.',
        privacy: 'Information collected for HVAC services only. Not shared without consent.',
        refuse: _commonRefuse,
        custom: ''
    }
};

// ===== GENERATE CLAUSES FOR ALL OTHER STATES =====
(function buildAllStateClauses() {
    // Common payment, restock, warranty, epa, privacy, permits templates
    var commonPayment = 'Payment due upon completion. Accepted: Cash, Check, Card, Zelle, Venmo.\nCredit Card: +3%. Bounced Check: +10%. Late: 1.5%/month after 30 days.';
    var commonRestock = 'Post-cancellation: 20% restocking fee with receipt. Non-refundable permits. Custom equipment at customer cost. Labor billed at agreed rate.';
    var commonWarranty = 'WARRANTY ON LABOR: All work is guaranteed for ONE (1) YEAR from date of completion for labor and workmanship.\n\nWARRANTY ON PARTS:\n• OEM (Original Equipment Manufacturer) Parts: 1 year manufacturer warranty.\n• Aftermarket/Generic Parts: 3 months warranty.\n• New Equipment Parts: Manufacturer warranty from 1 to 10 years depending on brand, model, and component (compressors typically 5-10 years, parts 1-5 years).\n\nAll warranty claims must be reported in writing within the warranty period. Warranty does NOT cover damage caused by: misuse, neglect, lack of maintenance, power surges, acts of nature, unauthorized modifications, or improper operation by the customer.';
    var commonEpa = 'EPA SECTION 608: All technicians EPA 608 certified per Clean Air Act. Refrigerant recovery/recycling per federal regulations. Intentional venting prohibited (fines up to $44,539/day).';
    var commonPrivacy = 'Personal information collected for HVAC services, billing, and records only. Not sold or shared without consent except as required by law.';
    var commonRefuse = _commonRefuse;
    var commonPermits = 'Permits required per local building department. Contractor responsible for pulling permits, scheduling inspections, and ensuring code compliance. Permit costs included unless otherwise stated.';
    var commonInsurance = 'Contractor maintains general liability insurance, workers\' compensation (where required), and vehicle insurance. Verify license and insurance with your state licensing board.';

    // State-specific data: [license text, cancel text, downPayment text, lien text, specialInsurance, specialPermits]
    var stateData = {
        CO: [
            'COLORADO: No statewide HVAC contractor license required. However, local jurisdictions (Denver, Boulder, Aurora, Colorado Springs) require their own mechanical contractor licenses and permits.\n\nAlways verify local requirements with your city/county building department.',
            'COLORADO 3-DAY RIGHT TO CANCEL (CRS §6-1-708 – Home Solicitation Sales)\n\nFor home solicitation sales, cancel within 3 business days. Written notice required.',
            'Colorado does not set a statewide statutory limit on deposits. Payments should correspond to work performed.',
            'Mechanics Lien (CRS §38-22): Must file a statement of lien within 4 months of completion. Preliminary notice recommended. Request lien waivers.', null, null
        ],
        GA: [
            'GEORGIA CONTRACTOR LICENSE\n\nConditioned Air Contractor License required through the Secretary of State\'s Construction Industry Licensing Board. Georgia has reciprocity with Texas and South Carolina.\n\nSOS: (404) 656-3900 | sos.ga.gov',
            'GEORGIA 3-DAY RIGHT TO CANCEL (OCGA §10-1-6 – Home Solicitation Sales)\n\nCancel within 3 business days for home solicitations. Written notice required.',
            'No specific statutory cap. Georgia Residential & General Contractor Act applies.',
            'Mechanics Lien (OCGA §44-14-361): Preliminary notice required. Lien filed within 90 days of completion.',
            'Bond: $10,000+ required. General liability required. Workers\' comp required if 3+ employees.', null
        ],
        IL: [
            'ILLINOIS: No statewide HVAC contractor license. HOWEVER, Chicago and many suburbs require local licenses and permits.\n\nChicago: Department of Buildings license required. Other municipalities vary.',
            'ILLINOIS 3-DAY RIGHT TO CANCEL (Home Repair & Remodeling Act, 815 ILCS 513)\n\nCancel within 3 business days. The Home Repair Act requires written contracts for work over $1,000 and provides consumer protections.',
            'Illinois does not set a specific cap. Home Repair Act requires written agreement on payment schedule.',
            'Mechanics Lien (770 ILCS 60): Subcontractors must serve 60-day notice. Lien filed within 4 months.', null, null
        ],
        NJ: [
            'NEW JERSEY HVAC LICENSE\n\nHVAC contractors must register with the NJ Division of Consumer Affairs (DCA). Home improvement contractors must register under the Contractor Registration Act.\n\nDCA: (973) 504-6200 | njconsumeraffairs.gov',
            'NEW JERSEY 3-DAY RIGHT TO CANCEL (Consumer Fraud Act & Home Improvement Practices Regulations)\n\nCancel within 3 business days for home solicitations. NJ Consumer Fraud Act provides additional protections.',
            'No specific statutory cap. NJ regulations require written contracts for work over $500.',
            'Mechanics Lien (NRS §2A:44A): NJ Construction Lien Law requires preliminary notice. File within 90 days.', null, null
        ],
        NC: [
            'NORTH CAROLINA STATE BOARD OF EXAMINERS\n\nHVAC License Required:\n• H-1: Heating Group 1 (unlimited)\n• H-2: Heating Group 2 (limited)\n• H-3: Heating Group 3 (limited)\n• Plumbing/Mechanical combined licenses available.\n\nBoard: (919) 875-3612 | nclicensing.org',
            'NORTH CAROLINA 3-DAY RIGHT TO CANCEL (GS §25A-39 – Home Solicitation Sales)\n\nCancel within 3 business days. Written notice required.',
            'No specific statutory cap. Bond: $10,000 required by licensing board.',
            'Mechanics Lien (GS Chapter 44A): Subcontractors must give Notice to Lien Agent. File within 120 days.', null, null
        ],
        OH: [
            'OHIO CONSTRUCTION INDUSTRY LICENSING BOARD (OCILB)\n\nHVAC contractors must be licensed. Ohio requires both state and local licensing in many jurisdictions.\n\nOCILB: (614) 644-3493 | com.ohio.gov',
            'OHIO 3-DAY RIGHT TO CANCEL (Home Solicitation Sales Act, ORC §1345.21-1345.28)\n\nCancel within 3 business days for home solicitations. Ohio Consumer Sales Practices Act provides additional protections.',
            'No specific statutory cap. Ohio Consumer Sales Practices Act applies.',
            'Mechanics Lien (ORC §1311.01): Must serve affidavit within 60 days. File lien within 75 days.', null, null
        ],
        PA: [
            'PENNSYLVANIA: No statewide HVAC contractor license. Philadelphia and Pittsburgh require local licenses.\n\nPhiladelphia: L&I License required. Pittsburgh: Mechanical contractor permit required.\n\nPA Home Improvement Consumer Protection Act applies statewide for projects over $500.',
            'PENNSYLVANIA 3-DAY RIGHT TO CANCEL (Consumer Protection Law, 73 PS §201-7)\n\nCancel within 3 business days for home solicitations. PA Unfair Trade Practices Act provides consumer protections.',
            'PA Home Improvement Consumer Protection Act: No more than one-third of contract price as initial payment.',
            'Mechanics Lien (49 PS §1301): Must file within 6 months of completion. Preliminary notice required for subcontractors.', null, null
        ],
        VA: [
            'VIRGINIA DEPT OF PROFESSIONAL & OCCUPATIONAL REGULATION (DPOR)\n\nContractor License Required:\n• Class A: Projects over $120,000.\n• Class B: $10,000-$120,000.\n• Class C: $1,000-$10,000.\n\nHVAC falls under HVA specialty. Tradesmen must also hold DPOR tradesman license.\n\nDPOR: (804) 367-8511 | dpor.virginia.gov',
            'VIRGINIA 3-DAY RIGHT TO CANCEL (VA Code §59.1-21.2 – Home Solicitation Sales)\n\nCancel within 3 business days. Virginia Contractor Transaction Recovery Fund provides additional consumer protection.',
            'Virginia does not set a specific deposit cap. Payments should align with work completed.',
            'Mechanics Lien (VA Code §43-1): File memorandum within 90 days of completion. Preliminary notice within 30 days for subcontractors.',
            'Bond: $10,000 (Class C) to $50,000 (Class A). GL required. Workers\' comp required.', null
        ],
        WA: [
            'WASHINGTON STATE DEPT OF LABOR & INDUSTRIES (L&I)\n\nHVAC contractors must hold an Electrical/HVAC specialty license. Registration with L&I required.\n\nL&I: (800) 647-0982 | lni.wa.gov',
            'WASHINGTON 3-DAY RIGHT TO CANCEL (RCW 63.14 – Home Solicitation Sales)\n\nCancel within 3 business days. Washington Consumer Protection Act provides additional rights.',
            'No specific statutory cap. $12,000 surety bond required by L&I.',
            'Mechanics Lien (RCW 60.04): Must serve pre-claim notice within 60 days. File lien within 90 days of completion.', null, null
        ],
        OR: [
            'OREGON CONSTRUCTION CONTRACTORS BOARD (CCB)\n\nAll contractors must be licensed with CCB. HVAC falls under plumbing/mechanical specialty.\n\nCCB: (503) 378-4621 | ccb.oregon.gov',
            'OREGON 3-DAY RIGHT TO CANCEL (Home Solicitation Sales Act, ORS 83.710-83.750)\n\nCancel within 3 business days for home solicitations.',
            'Oregon requires a $20,000 surety bond. No specific deposit cap.',
            'Mechanics Lien (ORS 87.010): Must file within 75 days of completion. Preliminary notice required.',
            'Bond: $20,000. GL and workers\' comp required.', null
        ],
        MI: [
            'MICHIGAN DEPT OF LICENSING & REGULATORY AFFAIRS (LARA)\n\nMechanical Contractor License required for HVAC work.\n\nLARA: (517) 241-9300 | michigan.gov/lara',
            'MICHIGAN 3-DAY RIGHT TO CANCEL (Home Improvement Finance Act, MCL 445.1101)\n\nCancel within 3 business days. Michigan Consumer Protection Act provides additional rights.',
            'No specific statutory deposit cap. Written contract required for work over $600.',
            'Mechanics Lien (MCL 570.1101): Must file within 90 days of last work.', null, null
        ],
        MA: [
            'MASSACHUSETTS: No statewide HVAC license. Home Improvement Contractor Registration (HIC) required.\n\nRegistration: (617) 973-8787 | mass.gov/hic',
            'MASSACHUSETTS 3-DAY RIGHT TO CANCEL (MGL c.93 §48 – Home Solicitation Sales)\n\nCancel within 3 business days. MA Consumer Protection Act (93A) provides additional rights.',
            'MA requires written contract for work over $1,000. One-third deposit limit common practice.',
            'Mechanics Lien (MGL c.254): Must file within 120 days of completion.', null, null
        ],
        TN: [
            'TENNESSEE BOARD FOR LICENSING CONTRACTORS\n\nLicense required for projects exceeding $25,000. HVAC falls under Mechanical-Heating Ventilation classification.\n\nBoard: (615) 741-8307 | tn.gov/commerce/regboards/contractors',
            'TENNESSEE 3-DAY RIGHT TO CANCEL (TCA §47-18-109 – Consumer Protection Act)\n\nCancel within 3 business days for home solicitations.',
            'No specific statutory cap. Bond: $10,000+ required by licensing board.',
            'Mechanics Lien (TCA §66-11): Must file within 90 days of completion.', null, null
        ],
        SC: [
            'SOUTH CAROLINA DEPT OF LABOR, LICENSING & REGULATION (LLR)\n\nMechanical Contractor License required. SC has reciprocity with Texas and Georgia.\n\nLLR: (803) 896-4300 | llr.sc.gov',
            'SOUTH CAROLINA 3-DAY RIGHT TO CANCEL\n\nCancel within 3 business days for home solicitations.',
            'No specific statutory cap. Bond required by LLR.',
            'Mechanics Lien (SC Code §29-5): Must file within 90 days of completion.', null, null
        ],
        LA: [
            'LOUISIANA STATE LICENSING BOARD FOR CONTRACTORS (LSLBC)\n\nMechanical License required for HVAC work over $50,000 (commercial) or residential work.\n\nLSLBC: (225) 765-2301 | lslbc.louisiana.gov',
            'LOUISIANA 3-DAY RIGHT TO CANCEL (RS 51:1401 – Home Solicitation Sales)\n\nCancel within 3 business days. Louisiana Unfair Trade Practices Act provides additional protection.',
            'Bond: $5,000-$15,000. No specific deposit cap.',
            'Mechanics Lien (RS 9:4801): Private Works Act governs. File notice within 30 days.', null, null
        ],
        MD: [
            'MARYLAND HOME IMPROVEMENT COMMISSION (MHIC)\n\nAll home improvement contractors must be licensed by MHIC. HVAC work included.\n\nMHIC: (410) 230-6176 | dllr.maryland.gov/license/mhic',
            'MARYLAND 3-DAY RIGHT TO CANCEL (Commercial Law §14-1301)\n\nCancel within 3 business days for door-to-door sales. MHIC provides Home Improvement Guaranty Fund for consumer protection.',
            'MHIC regulates deposits. Down payment should not exceed one-third of contract price.',
            'Mechanics Lien (Real Property §9-101): Must file within 180 days of completion.', null, null
        ],
        MN: [
            'MINNESOTA DEPT OF LABOR & INDUSTRY (DLI)\n\nHVAC License required. DLI regulates mechanical contractors.\n\nDLI: (651) 284-5005 | dli.mn.gov',
            'MINNESOTA 3-DAY RIGHT TO CANCEL (Statute §325G.06 – Home Solicitation Sales)\n\nCancel within 3 business days.',
            'Bond: $25,000 required. No specific deposit cap.',
            'Mechanics Lien (Statute §514.01): Must file within 120 days of completion.', null, null
        ],
        WI: [
            'WISCONSIN DSPS (Dept of Safety & Professional Services)\n\nHVAC Credential required for HVAC work.\n\nDSPS: (608) 266-2112 | dsps.wi.gov',
            'WISCONSIN 3-DAY RIGHT TO CANCEL (Statute §423.203 – Home Solicitation Sales)\n\nCancel within 3 business days.',
            'No specific statutory cap. Written contract required.',
            'Mechanics Lien (Statute §779.01): Must file within 6 months of completion.', null, null
        ],
        UT: [
            'UTAH DIVISION OF OCCUPATIONAL & PROFESSIONAL LICENSING (DOPL)\n\nS350 HVAC License required. Journeyman and Master designations available.\n\nDOPL: (801) 530-6628 | dopl.utah.gov',
            'UTAH 3-DAY RIGHT TO CANCEL (UCA §70C-5-103 – Home Solicitation Sales)\n\nCancel within 3 business days.',
            'Bond: $15,000 required. No specific deposit cap by law.',
            'Mechanics Lien (UCA §38-1a): Must file preliminary notice within 20 days. Lien within 180 days.', null, null
        ]
    };

    // Build clauses for each state
    for (var st in stateData) {
        var d = stateData[st];
        if (!defaultClausesByState[st]) {
            defaultClausesByState[st] = {
                payment: commonPayment,
                cancel: d[1],
                restock: commonRestock,
                license: d[0],
                downPayment: d[2],
                lien: d[3],
                warranty: commonWarranty,
                epa: d[4] ? commonEpa + '\n\n' + d[4] : commonEpa,
                permits: d[5] || commonPermits,
                insurance: d[4] || commonInsurance,
                privacy: commonPrivacy,
                refuse: _commonRefuse,
                custom: ''
            };
        }
    }

    // States with no specific HVAC license (use generic template)
    var noLicenseStates = ['AL','AK','AR','DE','HI','ID','IN','IA','KS','KY','ME','MS','MO','MT','NE','NH','ND','SD','VT','WV','WY','DC','PR','RI'];
    var noLicenseData = {
        AL: ['Alabama State Board of Heating, Air Conditioning & Refrigeration Contractors (ASBHCE)\nLicense required.\n\nASBHCE: (334) 242-5550', 'Alabama Home Solicitation Act: 3 business days.', 'Bond required. No specific deposit cap.', 'Mechanics Lien: File within 6 months.'],
        AK: ['Alaska: No statewide HVAC contractor license. Local permits may be required.\n\nAlaska Dept of Commerce: commerce.alaska.gov', '3-day cancel for home solicitations per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien (AS §34.35): File within 120 days.'],
        AR: ['Arkansas Contractors Licensing Board: License required for projects >$50,000.\n\n(501) 372-4661 | aclb.arkansas.gov', '3-day cancel per FTC Cooling-Off Rule.', 'No specific deposit cap.', 'Mechanics Lien (ACA §18-44): File within 120 days.'],
        DE: ['Delaware DAPE: License required for HVAC.\n\n(302) 744-4500', '3-day cancel for home solicitations.', 'Bond: $5,000. No specific deposit cap.', 'Mechanics Lien: File within 120 days.'],
        HI: ['Hawaii DCCA: C-16 Specialty License required.\n\n(808) 586-2700 | cca.hawaii.gov', '3-day cancel for home solicitations.', 'Bond: $15,000.', 'Mechanics Lien: File within 90 days.'],
        ID: ['Idaho DBS: HVAC License required.\n\n(208) 334-3950 | dbs.idaho.gov', '3-day cancel per FTC rule.', 'Bond: $2,000.', 'Mechanics Lien: File within 90 days.'],
        IN: ['Indiana: No statewide HVAC license. Local permits required.\n\nIndiana PLA: pla.in.gov', '3-day cancel per FTC rule & Indiana Home Improvement Contracts Act.', 'No specific deposit cap.', 'Mechanics Lien (IC §32-28-3): File within 90 days.'],
        IA: ['Iowa: No statewide HVAC license. Mechanical permits required by municipality.', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 90 days.'],
        KS: ['Kansas: No statewide license. Local jurisdictions vary.\n\nVerify with your city/county building department.', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 5 months.'],
        KY: ['Kentucky DHBC: HVAC License required (Master or Journeyman).\n\n(502) 573-0397 | dhbc.ky.gov', '3-day cancel for home solicitations.', 'No specific deposit cap.', 'Mechanics Lien (KRS §376): File within 6 months.'],
        ME: ['Maine: Oil & Solid Fuel Board for heating. No general HVAC license.\n\nOil Board: (207) 624-8603', '3-day cancel for home solicitations.', 'No specific deposit cap.', 'Mechanics Lien: File within 90 days.'],
        MS: ['Mississippi Board of Contractors: License required for projects >$50,000.\n\n(601) 354-6161 | msboc.us', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 3 months.'],
        MO: ['Missouri: No statewide license. Kansas City and St. Louis require local licenses.\n\nVerify local requirements.', '3-day cancel per Merchandising Practices Act.', 'No specific deposit cap.', 'Mechanics Lien (RSMo §429): File within 6 months.'],
        MT: ['Montana: No statewide HVAC license. Local permits may be required.', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 90 days.'],
        NE: ['Nebraska: No statewide license. Local mechanical permits required.', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 120 days.'],
        NH: ['New Hampshire: No statewide HVAC license. Gas fitter license required for gas work.\n\nNH Fire Marshal: (603) 223-4289', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 120 days.'],
        ND: ['North Dakota: No statewide license. Local permits required.', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 90 days.'],
        SD: ['South Dakota: No statewide license. Local permits required.', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 120 days.'],
        VT: ['Vermont: No statewide license. Local permits required.', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 180 days.'],
        WV: ['West Virginia Division of Labor: HVAC License required.\n\n(304) 558-7890 | labor.wv.gov', '3-day cancel for home solicitations.', 'No specific deposit cap.', 'Mechanics Lien: File within 100 days.'],
        WY: ['Wyoming: No statewide license. Local permits required.', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 150 days.'],
        DC: ['Washington D.C. DCRA: Contractor License required.\n\n(202) 442-4400 | dcra.dc.gov', '3-day cancel per FTC rule.', 'Bond required.', 'Mechanics Lien: File within 90 days.'],
        PR: ['Puerto Rico DACO: Contractor registration required.\n\nDACO: (787) 722-7555', 'Cancellation per PR Consumer Affairs regulations.', 'No specific deposit cap.', 'File claims per PR Property Code.'],
        RI: ['Rhode Island: Contractor Registration required.\n\nContractors\' Board: (401) 462-9500', '3-day cancel for home solicitations.', 'Bond: $10,000.', 'Mechanics Lien: File within 200 days.'],
        NM: ['New Mexico Construction Industries Division (CID): Mechanical license required.\n\nCID: (505) 476-4700 | rld.nm.gov', '3-day cancel per FTC rule.', 'No specific deposit cap.', 'Mechanics Lien: File within 120 days.'],
        OK: ['Oklahoma Construction Industries Board (CIB): Mechanical License required.\n\nCIB: (405) 521-6550 | cib.ok.gov', '3-day cancel per Oklahoma Consumer Protection Act.', 'No specific deposit cap.', 'Mechanics Lien: File within 90 days.'],
        CT: ['Connecticut DCP: Home Improvement Contractor Registration (HIC) required.\n\nDCP: (860) 713-6100 | ct.gov/dcp', 'Connecticut 3-day cancel (Home Solicitation Sales Act).', 'No deposit may exceed one-third of contract.', 'Mechanics Lien: File within 90 days.']
    };

    for (var nst in noLicenseData) {
        if (!defaultClausesByState[nst]) {
            var nd = noLicenseData[nst];
            defaultClausesByState[nst] = {
                payment: commonPayment,
                cancel: nd[1],
                restock: commonRestock,
                license: nd[0],
                downPayment: nd[2],
                lien: nd[3],
                warranty: commonWarranty,
                epa: commonEpa,
                permits: commonPermits,
                insurance: commonInsurance,
                privacy: commonPrivacy,
                refuse: _commonRefuse,
                custom: ''
            };
        }
    }

    // Fallback for any state not explicitly defined
    defaultClausesByState.OTHER = {
        payment: commonPayment,
        cancel: 'FTC COOLING-OFF RULE (Federal)\n\nFor door-to-door sales or sales at temporary locations over $25, you may cancel within 3 business days. Written notice required.\n\nCheck your specific state laws for additional cancellation rights.',
        restock: commonRestock,
        license: 'Contact your state contractor licensing board for specific HVAC contractor requirements in your area.\n\nNot all states require a statewide HVAC license — some regulate at the city or county level.',
        downPayment: 'Check your state laws for specific deposit/down payment limits. Many states do not have a statutory cap but require payments to correspond to work performed.',
        lien: 'Mechanics lien laws vary by state. Contractors may have the right to file a lien on your property for unpaid work. Request lien waivers with each payment.',
        warranty: commonWarranty,
        epa: commonEpa,
        permits: commonPermits,
        insurance: commonInsurance,
        privacy: commonPrivacy,
        refuse: _commonRefuse,
        custom: ''
    };
})();

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
    document.getElementById('clauseEpa').value = defaults.epa || '';
    document.getElementById('clausePermits').value = defaults.permits || '';
    document.getElementById('clauseInsurance').value = defaults.insurance || '';
    document.getElementById('clausePrivacy').value = defaults.privacy;
    document.getElementById('clauseRefuse').value = defaults.refuse || '';
    document.getElementById('clauseCustom').value = defaults.custom || '';
    var summaryEl = document.getElementById('stateRegSummary');
    if (stateRegSummaries[state]) {
        summaryEl.innerHTML = '<strong>' + state + ':</strong> ' + stateRegSummaries[state];
        summaryEl.style.display = 'block';
    } else {
        summaryEl.innerHTML = '<strong>' + state + ':</strong> Selecciona tu estado para ver un resumen de regulaciones HVACR.';
        summaryEl.style.display = 'block';
    }
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
    document.getElementById('clauseEpa').value = clauses.epa || '';
    document.getElementById('clausePermits').value = clauses.permits || '';
    document.getElementById('clauseInsurance').value = clauses.insurance || '';
    document.getElementById('clausePrivacy').value = clauses.privacy || '';
    document.getElementById('clauseRefuse').value = clauses.refuse || '';
    document.getElementById('clauseCustom').value = clauses.custom || '';
    var state = clauses.state || 'CA';
    var summaryEl = document.getElementById('stateRegSummary');
    if (stateRegSummaries[state]) {
        summaryEl.innerHTML = '<strong>' + state + ':</strong> ' + stateRegSummaries[state];
        summaryEl.style.display = 'block';
    }
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
        epa: document.getElementById('clauseEpa').value,
        permits: document.getElementById('clausePermits').value,
        insurance: document.getElementById('clauseInsurance').value,
        privacy: document.getElementById('clausePrivacy').value,
        refuse: document.getElementById('clauseRefuse').value,
        custom: document.getElementById('clauseCustom').value
    };
}

async function saveClauses() {
    if (!companyId) return;
    var clauses = getClausesData();
    await sbClient.from('companies').update({ contract_clauses: clauses }).eq('id', companyId);
    if (window._companyInfo) window._companyInfo.contract_clauses = clauses;
    alert('✅ Cláusulas guardadas para ' + clauses.state + ' exitosamente!');
}

// ===== COMPANY DOCUMENTS MANAGEMENT =====
var companyDocs = {};
var DOC_TYPES = ['workers_comp','general_liability','w9','bond','contractor_license','epa_608','vehicle_insurance','other'];

function uploadCompanyDoc(docType, input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (file.size > 5 * 1024 * 1024) { alert('⚠️ Archivo demasiado grande. Máximo 5MB.'); return; }
    
    var reader = new FileReader();
    reader.onload = function(e) {
        companyDocs[docType] = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result,
            uploadedAt: new Date().toISOString()
        };
        updateDocCardUI(docType, true);
        saveCompanyDocs();
    };
    reader.readAsDataURL(file);
}

function viewCompanyDoc(docType) {
    var doc = companyDocs[docType];
    if (!doc) return;
    var w = window.open('', '_blank');
    if (doc.type && doc.type.startsWith('image/')) {
        w.document.write('<html><head><title>' + doc.name + '</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f1f5f9;"><img src="' + doc.data + '" style="max-width:100%;max-height:95vh;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);"></body></html>');
    } else if (doc.type === 'application/pdf') {
        w.document.write('<html><head><title>' + doc.name + '</title></head><body style="margin:0;"><iframe src="' + doc.data + '" style="width:100%;height:100vh;border:none;"></iframe></body></html>');
    } else {
        w.document.write('<html><body><p>Archivo: ' + doc.name + '</p><a href="' + doc.data + '" download="' + doc.name + '">Descargar</a></body></html>');
    }
    w.document.close();
}

function removeCompanyDoc(docType) {
    if (!confirm('¿Eliminar este documento?')) return;
    delete companyDocs[docType];
    updateDocCardUI(docType, false);
    saveCompanyDocs();
}

function updateDocCardUI(docType, uploaded) {
    var card = document.getElementById('docCard_' + docType);
    var statusEl = document.getElementById('docStatus_' + docType);
    var viewBtn = document.getElementById('docView_' + docType);
    var removeBtn = document.getElementById('docRemove_' + docType);
    if (!card) return;
    
    if (uploaded && companyDocs[docType]) {
        card.classList.add('doc-uploaded');
        statusEl.innerHTML = '<span class="doc-badge doc-uploaded-badge">✅ ' + companyDocs[docType].name + '</span>';
        if (viewBtn) viewBtn.style.display = 'inline-block';
        if (removeBtn) removeBtn.style.display = 'inline-block';
    } else {
        card.classList.remove('doc-uploaded');
        statusEl.innerHTML = '<span class="doc-badge doc-missing">No subido</span>';
        if (viewBtn) viewBtn.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'none';
    }
    
    // Check expiry
    var expiryInput = document.getElementById('docExpiry_' + docType);
    if (expiryInput && expiryInput.value && uploaded) {
        var expDate = new Date(expiryInput.value);
        var now = new Date();
        var daysUntil = Math.floor((expDate - now) / (1000*60*60*24));
        if (daysUntil < 0) {
            statusEl.innerHTML += ' <span class="doc-badge doc-expiring" style="background:#fef2f2;color:#ef4444;border-color:#fca5a5;">⚠️ EXPIRADO</span>';
        } else if (daysUntil < 30) {
            statusEl.innerHTML += ' <span class="doc-badge doc-expiring">⏰ Vence en ' + daysUntil + ' días</span>';
        }
    }
}

function saveDocExpiry(docType) {
    saveCompanyDocs();
    updateDocCardUI(docType, !!companyDocs[docType]);
}

function saveDocSettings() {
    saveCompanyDocs();
}

async function saveCompanyDocs() {
    if (!companyId) return;
    var docMeta = {};
    DOC_TYPES.forEach(function(t) {
        if (companyDocs[t]) {
            docMeta[t] = {
                name: companyDocs[t].name,
                type: companyDocs[t].type,
                size: companyDocs[t].size,
                data: companyDocs[t].data,
                uploadedAt: companyDocs[t].uploadedAt
            };
        }
        var expiryInput = document.getElementById('docExpiry_' + t);
        if (expiryInput && expiryInput.value) {
            if (!docMeta[t]) docMeta[t] = {};
            docMeta[t].expiry = expiryInput.value;
        }
    });
    var includeInEstimates = document.getElementById('includeDocsInEstimates');
    docMeta._settings = { includeInEstimates: includeInEstimates ? includeInEstimates.checked : true };
    
    await sbClient.from('companies').update({ company_documents: docMeta }).eq('id', companyId);
    if (window._companyInfo) window._companyInfo.company_documents = docMeta;
}

function loadCompanyDocs(data) {
    if (!data) return;
    companyDocs = {};
    DOC_TYPES.forEach(function(t) {
        if (data[t] && data[t].data) {
            companyDocs[t] = data[t];
            updateDocCardUI(t, true);
        }
        var expiryInput = document.getElementById('docExpiry_' + t);
        if (expiryInput && data[t] && data[t].expiry) {
            expiryInput.value = data[t].expiry;
            updateDocCardUI(t, !!companyDocs[t]);
        }
    });
    if (data._settings) {
        var cb = document.getElementById('includeDocsInEstimates');
        if (cb) cb.checked = data._settings.includeInEstimates !== false;
    }
}

function getCompanyDocsForEstimate() {
    var cb = document.getElementById('includeDocsInEstimates');
    if (cb && !cb.checked) return [];
    var docs = [];
    var labels = {
        workers_comp: '🛡️ Workers\' Compensation',
        general_liability: '🏢 General Liability Insurance',
        w9: '📋 W-9 Form',
        bond: '💰 Contractor License Bond',
        contractor_license: '🏛️ Contractor License',
        epa_608: '🌿 EPA Section 608 Certification',
        vehicle_insurance: '🚐 Vehicle Insurance',
        other: '📄 Additional Document'
    };
    DOC_TYPES.forEach(function(t) {
        if (companyDocs[t] && companyDocs[t].data) {
            docs.push({ type: t, label: labels[t] || t, name: companyDocs[t].name, data: companyDocs[t].data, fileType: companyDocs[t].type });
        }
    });
    return docs;
}

// ===== TECHNICIAN CREDENTIALS =====
var techCredentials = {};
var currentTechCredId = null;
var TECH_CRED_TYPES = ['drivers_license','epa_608','nate','osha','hvac_excellence','school_cert','nccer','other_cert','vehicle_reg','vehicle_insurance'];

function updateTechCredSelect() {
    var sel = document.getElementById('techCredSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccionar Técnico --</option>';
    techsData.forEach(function(t) { sel.innerHTML += '<option value="' + t.id + '">' + t.name + ' (' + (t.specialty||'') + ')</option>'; });
}

function loadTechCredentials() {
    var sel = document.getElementById('techCredSelect');
    var area = document.getElementById('techCredArea');
    currentTechCredId = sel ? sel.value : '';
    if (!currentTechCredId) { if (area) area.style.display = 'none'; return; }
    if (area) area.style.display = 'block';
    
    var tech = techsData.find(function(t) { return t.id === currentTechCredId; });
    techCredentials = (tech && tech.credentials) ? tech.credentials : {};
    TECH_CRED_TYPES.forEach(function(t) { updateTechCredCardUI(t, !!(techCredentials[t] && techCredentials[t].data)); });

    // Populate profile card
    var nameEl = document.getElementById('techCredName');
    var specEl = document.getElementById('techCredSpecialty');
    var photoEl = document.getElementById('techCredPhoto');
    var vehInfoEl = document.getElementById('techCredVehicleInfo');
    if (nameEl) nameEl.textContent = tech ? tech.name : '—';
    if (specEl) specEl.textContent = tech ? (tech.specialty || '—') + ' | ' + (tech.phone || '') : '—';
    
    // Photo
    if (photoEl) {
        if (tech && tech.photo) {
            photoEl.innerHTML = '<img src="' + tech.photo + '" style="width:100%;height:100%;object-fit:cover;">';
        } else {
            photoEl.innerHTML = '<span style="font-size:40px;">👤</span>';
        }
    }
    
    // Vehicle info display
    var vi = (tech && tech.vehicle_info) ? tech.vehicle_info : {};
    if (vehInfoEl) {
        if (vi.vehicle || vi.plate) {
            vehInfoEl.innerHTML = '<strong>🚐 Vehículo:</strong> ' + (vi.vehicle || 'N/A') + '<br>' +
                '<strong>Placas:</strong> ' + (vi.plate || 'N/A') + 
                (vi.vin ? ' | <strong>VIN:</strong> ' + vi.vin : '') +
                (vi.color ? ' | <strong>Color:</strong> ' + vi.color : '');
        } else {
            vehInfoEl.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">Sin vehículo asignado</span>';
        }
    }
    
    // Fill vehicle edit fields
    var vf = function(id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
    vf('tcVehicle', vi.vehicle);
    vf('tcPlate', vi.plate);
    vf('tcVin', vi.vin);
    vf('tcVehicleColor', vi.color);
}

function uploadTechCred(credType, input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (file.size > 5*1024*1024) { alert('⚠️ Max 5MB'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        techCredentials[credType] = { name: file.name, type: file.type, size: file.size, data: e.target.result, uploadedAt: new Date().toISOString() };
        updateTechCredCardUI(credType, true);
    };
    reader.readAsDataURL(file);
}

function viewTechCred(credType) {
    var doc = techCredentials[credType];
    if (!doc) return;
    var w = window.open('','_blank');
    if (doc.type && doc.type.startsWith('image/')) w.document.write('<html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f1f5f9"><img src="'+doc.data+'" style="max-width:100%;max-height:95vh"></body></html>');
    else w.document.write('<html><body style="margin:0"><iframe src="'+doc.data+'" style="width:100%;height:100vh;border:none"></iframe></body></html>');
    w.document.close();
}

function removeTechCred(credType) {
    if (!confirm('¿Eliminar?')) return;
    delete techCredentials[credType];
    updateTechCredCardUI(credType, false);
}

function updateTechCredCardUI(credType, uploaded) {
    var card = document.getElementById('tcCard_' + credType);
    var status = document.getElementById('tcStatus_' + credType);
    var viewBtn = document.getElementById('tcView_' + credType);
    var removeBtn = document.getElementById('tcRemove_' + credType);
    if (!card) return;
    if (uploaded && techCredentials[credType]) {
        card.classList.add('doc-uploaded');
        status.innerHTML = '<span class="doc-badge doc-uploaded-badge">✅ ' + techCredentials[credType].name + '</span>';
        if (viewBtn) viewBtn.style.display = 'inline-block';
        if (removeBtn) removeBtn.style.display = 'inline-block';
    } else {
        card.classList.remove('doc-uploaded');
        status.innerHTML = '<span class="doc-badge doc-missing">No subido</span>';
        if (viewBtn) viewBtn.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'none';
    }
    var expiryInput = document.getElementById('tcExpiry_' + credType);
    if (expiryInput && expiryInput.value && uploaded) {
        var daysUntil = Math.floor((new Date(expiryInput.value) - new Date()) / (1000*60*60*24));
        if (daysUntil < 0) status.innerHTML += ' <span class="doc-badge" style="background:#fef2f2;color:#ef4444;border:1px solid #fca5a5;">EXPIRADO</span>';
        else if (daysUntil < 30) status.innerHTML += ' <span class="doc-badge doc-expiring">⏰ ' + daysUntil + ' días</span>';
    }
}

function uploadTechPhoto(input) {
    if (!input.files || !input.files[0] || !currentTechCredId) return;
    var file = input.files[0];
    if (file.size > 3*1024*1024) { alert('⚠️ Foto máx 3MB'); return; }
    var reader = new FileReader();
    reader.onload = async function(e) {
        var photoData = e.target.result;
        await sbClient.from('technicians').update({ photo: photoData }).eq('id', currentTechCredId);
        document.getElementById('techCredPhoto').innerHTML = '<img src="' + photoData + '" style="width:100%;height:100%;object-fit:cover;">';
        await loadTechnicians();
        alert('✅ Foto actualizada');
    };
    reader.readAsDataURL(file);
}

function generateTechIDCard() {
    if (!currentTechCredId) return;
    var tech = techsData.find(function(t) { return t.id === currentTechCredId; });
    if (!tech) return;
    var company = (window._companyInfo && window._companyInfo.name) ? window._companyInfo.name : 'Trade Master';
    var companyPhone = (window._companyInfo && window._companyInfo.phone) ? window._companyInfo.phone : '';
    var vi = tech.vehicle_info || {};

    var w = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ID - ' + tech.name + '</title>';
    html += '<style>';
    html += '*{margin:0;padding:0;box-sizing:border-box}body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#e5e7eb;font-family:Arial,sans-serif}';
    html += '.id-card{width:340px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.15)}';
    html += '.id-header{background:linear-gradient(135deg,#1e3a5f,#f47621);color:white;padding:16px;text-align:center}';
    html += '.id-header h2{font-size:18px;margin-bottom:2px}.id-header p{font-size:11px;opacity:0.9}';
    html += '.id-body{padding:16px;display:flex;gap:12px;align-items:flex-start}';
    html += '.id-photo{width:100px;height:120px;border:3px solid #1e3a5f;border-radius:8px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#f3f4f6}';
    html += '.id-photo img{width:100%;height:100%;object-fit:cover}';
    html += '.id-info{flex:1;font-size:12px;line-height:1.8}';
    html += '.id-info strong{color:#1e3a5f}.id-name{font-size:16px;font-weight:bold;color:#1e3a5f;margin-bottom:4px}';
    html += '.id-vehicle{margin-top:8px;padding:8px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;font-size:11px}';
    html += '.id-footer{background:#f3f4f6;padding:10px 16px;text-align:center;font-size:9px;color:#666;border-top:1px solid #e5e7eb}';
    html += '.id-footer strong{color:#f47621}';
    html += '.print-bar{text-align:center;margin:16px;padding:10px}';
    html += '.print-bar button{padding:10px 24px;font-size:14px;font-weight:bold;border:none;border-radius:8px;cursor:pointer;background:#1e3a5f;color:white;margin:0 6px}';
    html += '@media print{.print-bar{display:none}body{background:white}}';
    html += '</style></head><body>';

    html += '<div>';
    html += '<div class="id-card">';
    html += '<div class="id-header"><h2>' + company + '</h2><p>HVACR Contractor | Employee Identification</p></div>';
    html += '<div class="id-body">';
    html += '<div class="id-photo">';
    if (tech.photo) html += '<img src="' + tech.photo + '">';
    else html += '<span style="font-size:36px;">👤</span>';
    html += '</div>';
    html += '<div class="id-info">';
    html += '<div class="id-name">' + tech.name + '</div>';
    html += '<strong>Puesto:</strong> ' + (tech.specialty || 'Técnico') + '<br>';
    if (tech.phone) html += '<strong>Tel:</strong> ' + tech.phone + '<br>';
    html += '<strong>ID:</strong> ' + tech.id.substring(0,8).toUpperCase() + '<br>';
    if (vi.vehicle || vi.plate) {
        html += '<div class="id-vehicle">';
        html += '🚐 <strong>' + (vi.vehicle || '') + '</strong><br>';
        if (vi.plate) html += 'Placas: <strong>' + vi.plate + '</strong>';
        if (vi.color) html += ' | Color: ' + vi.color;
        html += '</div>';
    }
    html += '</div></div>';
    html += '<div class="id-footer"><strong>ESTE IDENTIFICADOR DEBE PORTARSE EN TODO MOMENTO DURANTE HORAS DE TRABAJO</strong><br>This ID must be worn at all times during working hours<br>' + (companyPhone || '') + '</div>';
    html += '</div>';

    html += '<div class="print-bar"><button onclick="window.print()">🖨️ Imprimir ID Card</button></div>';
    html += '</div></body></html>';
    w.document.write(html);
    w.document.close();
}

async function saveTechCredentials() {
    if (!currentTechCredId || !companyId) return;
    var credData = {};
    TECH_CRED_TYPES.forEach(function(t) {
        if (techCredentials[t]) credData[t] = techCredentials[t];
        var exp = document.getElementById('tcExpiry_' + t);
        if (exp && exp.value) { if (!credData[t]) credData[t] = {}; credData[t].expiry = exp.value; }
    });
    
    // Save vehicle info from edit fields
    var vehicleInfo = {
        vehicle: (document.getElementById('tcVehicle') || {}).value || '',
        plate: (document.getElementById('tcPlate') || {}).value || '',
        vin: (document.getElementById('tcVin') || {}).value || '',
        color: (document.getElementById('tcVehicleColor') || {}).value || ''
    };
    
    var res = await sbClient.from('technicians').update({ credentials: credData, vehicle_info: vehicleInfo }).eq('id', currentTechCredId);
    if (res.error) alert('❌ Error: ' + res.error.message);
    else alert('✅ Credenciales y vehículo guardados');
    await loadTechnicians();
    loadTechCredentials(); // Refresh profile card
}

// ===== JOB PERMITS & DOCUMENTS =====
var jobPermitDocs = {};
var currentJobPermitId = null;
var JOB_PERMIT_TYPES = ['building_permit','mechanical_permit','inspection_pass','before_photos','after_photos','other_permit'];

function updateJobPermitSelect() {
    var sel = document.getElementById('jobPermitSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccionar Trabajo --</option>';
    jobsData.forEach(function(j) {
        var label = (j.title || 'Trabajo') + ' - ' + (j.address || '').substring(0,30);
        sel.innerHTML += '<option value="' + j.id + '">' + label + '</option>';
    });
}

function loadJobPermits() {
    var sel = document.getElementById('jobPermitSelect');
    var area = document.getElementById('jobPermitArea');
    currentJobPermitId = sel ? sel.value : '';
    if (!currentJobPermitId) { if (area) area.style.display = 'none'; return; }
    if (area) area.style.display = 'block';
    
    var job = jobsData.find(function(j) { return j.id === currentJobPermitId; });
    jobPermitDocs = (job && job.permits) ? job.permits : {};
    JOB_PERMIT_TYPES.forEach(function(t) { updateJobPermitCardUI(t, !!(jobPermitDocs[t] && jobPermitDocs[t].data)); });
}

function uploadJobPermit(permitType, input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (file.size > 5*1024*1024) { alert('⚠️ Max 5MB'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        jobPermitDocs[permitType] = { name: file.name, type: file.type, size: file.size, data: e.target.result, uploadedAt: new Date().toISOString() };
        updateJobPermitCardUI(permitType, true);
    };
    reader.readAsDataURL(file);
}

function viewJobPermit(permitType) {
    var doc = jobPermitDocs[permitType];
    if (!doc) return;
    var w = window.open('','_blank');
    if (doc.type && doc.type.startsWith('image/')) w.document.write('<html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f1f5f9"><img src="'+doc.data+'" style="max-width:100%;max-height:95vh"></body></html>');
    else w.document.write('<html><body style="margin:0"><iframe src="'+doc.data+'" style="width:100%;height:100vh;border:none"></iframe></body></html>');
    w.document.close();
}

function removeJobPermit(permitType) {
    if (!confirm('¿Eliminar?')) return;
    delete jobPermitDocs[permitType];
    updateJobPermitCardUI(permitType, false);
}

function updateJobPermitCardUI(permitType, uploaded) {
    var card = document.getElementById('jpCard_' + permitType);
    var status = document.getElementById('jpStatus_' + permitType);
    var viewBtn = document.getElementById('jpView_' + permitType);
    var removeBtn = document.getElementById('jpRemove_' + permitType);
    if (!card) return;
    if (uploaded && jobPermitDocs[permitType]) {
        card.classList.add('doc-uploaded');
        status.innerHTML = '<span class="doc-badge doc-uploaded-badge">✅ ' + jobPermitDocs[permitType].name + '</span>';
        if (viewBtn) viewBtn.style.display = 'inline-block';
        if (removeBtn) removeBtn.style.display = 'inline-block';
    } else {
        card.classList.remove('doc-uploaded');
        status.innerHTML = '<span class="doc-badge doc-missing">No subido</span>';
        if (viewBtn) viewBtn.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'none';
    }
}

async function saveJobPermits() {
    if (!currentJobPermitId || !companyId) return;
    var permitData = {};
    JOB_PERMIT_TYPES.forEach(function(t) { if (jobPermitDocs[t]) permitData[t] = jobPermitDocs[t]; });
    var res = await sbClient.from('jobs').update({ permits: permitData }).eq('id', currentJobPermitId);
    if (res.error) alert('❌ Error: ' + res.error.message);
    else alert('✅ Permisos guardados');
    await loadJobs();
}

// ===== GLOBAL SEARCH =====
function globalSearch(query) {
    var results = document.getElementById('globalSearchResults');
    if (!query || query.length < 2) { results.innerHTML = ''; return; }
    var q = query.toLowerCase();
    var items = [];
    
    // Search clients
    (clientsData || []).forEach(function(c) {
        if ((c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q)) {
            items.push({ type: 'Cliente', icon: '👥', name: c.name, sub: c.phone || c.email || '', action: "showSection('clients')" });
        }
    });
    // Search jobs
    (jobsData || []).forEach(function(j) {
        if ((j.title || '').toLowerCase().includes(q) || (j.address || '').toLowerCase().includes(q)) {
            items.push({ type: 'Trabajo', icon: '🔧', name: j.title, sub: j.address || '', action: "showSection('jobs')" });
        }
    });
    // Search leads
    (leadsData || []).forEach(function(l) {
        if ((l.name || '').toLowerCase().includes(q) || (l.phone || '').includes(q)) {
            items.push({ type: 'Lead', icon: '🎯', name: l.name, sub: l.phone || '', action: "showSection('leads')" });
        }
    });
    // Search technicians
    (techsData || []).forEach(function(t) {
        if ((t.name || '').toLowerCase().includes(q)) {
            items.push({ type: 'Técnico', icon: '👷', name: t.name, sub: t.specialty || '', action: "showSection('technicians')" });
        }
    });
    
    if (items.length === 0) {
        results.innerHTML = '<div class="search-result-item" style="color:var(--text-muted);justify-content:center;">Sin resultados para "' + query + '"</div>';
    } else {
        results.innerHTML = items.slice(0, 8).map(function(i) {
            return '<div class="search-result-item" onclick="' + i.action + ';document.getElementById(\'globalSearchInput\').value=\'\';">' +
                '<span>' + i.icon + '</span><span class="search-result-type">' + i.type + '</span>' +
                '<span><strong>' + i.name + '</strong><br><small style="color:var(--text-muted)">' + i.sub + '</small></span></div>';
        }).join('');
    }
}

// ===== QUICK ADD =====
function toggleQuickAdd() {
    var menu = document.getElementById('quickAddMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    // Close on outside click
    if (menu.style.display === 'block') {
        setTimeout(function() {
            document.addEventListener('click', function closeQA(e) {
                if (!e.target.closest('.quick-add-wrap')) { menu.style.display = 'none'; document.removeEventListener('click', closeQA); }
            });
        }, 10);
    }
}

function quickAddAction(type) {
    document.getElementById('quickAddMenu').style.display = 'none';
    switch(type) {
        case 'client': showSection('clients'); setTimeout(function(){ showClientForm(); }, 100); break;
        case 'job': showSection('dispatch'); setTimeout(function(){ showJobForm(); }, 100); break;
        case 'lead': showSection('leads'); setTimeout(function(){ showLeadForm(); }, 100); break;
        case 'appointment': showSection('calendar'); setTimeout(function(){ showApptForm(); }, 100); break;
        case 'invoice': showSection('invoices'); setTimeout(function(){ showInvoiceForm(); }, 100); break;
        case 'estimate': showSection('jobs'); break;
    }
}

// ===== NOTIFICATIONS =====
var notifications = [];

function toggleNotifications() {
    var panel = document.getElementById('notifPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
        setTimeout(function() {
            document.addEventListener('click', function closeN(e) {
                if (!e.target.closest('.notif-wrap')) { panel.style.display = 'none'; document.removeEventListener('click', closeN); }
            });
        }, 10);
    }
}

function generateNotifications() {
    notifications = [];
    var now = new Date();
    
    // Check overdue invoices
    (invoicesData || []).forEach(function(inv) {
        if (inv.status === 'sent' || inv.status === 'partial') {
            var due = inv.due_date ? new Date(inv.due_date) : null;
            if (due && due < now) {
                notifications.push({ icon: '💸', title: 'Factura vencida: ' + (inv.invoice_number || '#'), sub: 'Vence: ' + due.toLocaleDateString('es'), action: "showSection('collections')", unread: true });
            }
        }
    });
    
    // Check upcoming appointments (next 24h)
    var tomorrow = new Date(now.getTime() + 86400000);
    (appointmentsData || []).forEach(function(a) {
        var d = new Date(a.appointment_date);
        if (d >= now && d <= tomorrow) {
            notifications.push({ icon: '📅', title: 'Cita: ' + (a.title || 'Sin título'), sub: d.toLocaleDateString('es') + ' ' + (a.start_time || ''), action: "showSection('calendar')", unread: true });
        }
    });
    
    // Check new leads (last 7 days)
    var weekAgo = new Date(now.getTime() - 7 * 86400000);
    (leadsData || []).forEach(function(l) {
        if (l.created_at && new Date(l.created_at) > weekAgo && l.status === 'new') {
            notifications.push({ icon: '🎯', title: 'Nuevo lead: ' + l.name, sub: l.service || l.phone || '', action: "showSection('leads')", unread: true });
        }
    });
    
    // Check expiring docs
    var docTypes = { workers_comp: 'Workers Comp', general_liability: 'General Liability', bond: 'Bond', contractor_license: 'Licencia', vehicle_insurance: 'Seguro Vehículo' };
    var compDocs = (window._companyInfo && window._companyInfo.company_documents) ? window._companyInfo.company_documents : {};
    Object.keys(docTypes).forEach(function(key) {
        if (compDocs[key] && compDocs[key].expiry) {
            var exp = new Date(compDocs[key].expiry);
            var days = Math.floor((exp - now) / 86400000);
            if (days < 30 && days >= 0) {
                notifications.push({ icon: '⚠️', title: docTypes[key] + ' vence pronto', sub: 'En ' + days + ' días (' + exp.toLocaleDateString('es') + ')', action: "showSection('settings')", unread: true });
            } else if (days < 0) {
                notifications.push({ icon: '🔴', title: docTypes[key] + ' EXPIRADO', sub: 'Venció ' + exp.toLocaleDateString('es'), action: "showSection('settings')", unread: true });
            }
        }
    });
    
    renderNotifications();
}

function renderNotifications() {
    var list = document.getElementById('notifList');
    var badge = document.getElementById('notifBadge');
    var unread = notifications.filter(function(n) { return n.unread; }).length;
    
    if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
    }
    
    if (!list) return;
    if (notifications.length === 0) {
        list.innerHTML = '<p class="empty-msg" style="padding:20px;">✅ Sin notificaciones pendientes</p>';
        return;
    }
    list.innerHTML = notifications.map(function(n) {
        return '<div class="notif-item' + (n.unread ? ' unread' : '') + '" onclick="' + n.action + ';document.getElementById(\'notifPanel\').style.display=\'none\';">' +
            '<span class="notif-icon">' + n.icon + '</span>' +
            '<div class="notif-content"><strong>' + n.title + '</strong><small>' + n.sub + '</small></div></div>';
    }).join('');
}

// ===== ESTIMATE PIPELINE =====
function renderEstimatePipeline() {
    var estimates = [];
    // Pull from saved estimates in localStorage
    try { estimates = JSON.parse(localStorage.getItem('savedEstimates_' + companyId) || '[]'); } catch(e) {}
    
    var openCount = 0, openAmt = 0, approvedCount = 0, approvedAmt = 0;
    estimates.forEach(function(est) {
        var total = parseFloat(est.total) || 0;
        if (est.status === 'approved') { approvedCount++; approvedAmt += total; }
        else { openCount++; openAmt += total; }
    });
    
    // Invoices data
    var invoicedCount = 0, invoicedAmt = 0, paidCount = 0, paidAmt = 0;
    (invoicesData || []).forEach(function(inv) {
        var total = parseFloat(inv.total) || 0;
        if (inv.status === 'paid') { paidCount++; paidAmt += total; }
        else { invoicedCount++; invoicedAmt += total; }
    });
    
    var fmt = function(n) { return '$' + n.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0}); };
    
    var el = function(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; };
    el('pipeOpenCount', openCount);
    el('pipeOpenAmt', fmt(openAmt));
    el('pipeApprovedCount', approvedCount);
    el('pipeApprovedAmt', fmt(approvedAmt));
    el('pipeInvoicedCount', invoicedCount);
    el('pipeInvoicedAmt', fmt(invoicedAmt));
    el('pipePaidCount', paidCount);
    el('pipePaidAmt', fmt(paidAmt));
    
    // Conversion rate
    var totalEst = openCount + approvedCount;
    var rate = totalEst > 0 ? Math.round((approvedCount / totalEst) * 100) : 0;
    var rateEl = document.getElementById('pipeConversionRate');
    if (rateEl) {
        rateEl.innerHTML = '📊 <strong>Tasa de Conversión:</strong> ' + rate + '% de estimados aprobados' +
            (totalEst > 0 ? ' | <strong>Pipeline Total:</strong> ' + fmt(openAmt + approvedAmt + invoicedAmt) : '');
    }
}

// ===== SERVICE PLANS =====
var servicePlansData = [];

function showServicePlanForm() { document.getElementById('servicePlanFormArea').style.display = 'block'; }
function hideServicePlanForm() { document.getElementById('servicePlanFormArea').style.display = 'none'; }

async function createServicePlan(event) {
    event.preventDefault();
    if (!companyId) return;
    var plan = {
        company_id: companyId,
        name: document.getElementById('spName').value,
        price: parseFloat(document.getElementById('spPrice').value) || 0,
        visits_per_year: parseInt(document.getElementById('spVisits').value) || 2,
        repair_discount: parseInt(document.getElementById('spDiscount').value) || 0,
        includes: document.getElementById('spIncludes').value,
        duration: document.getElementById('spDuration').value,
        equipment_type: document.getElementById('spEquipType').value,
        status: 'active',
        enrolled_count: 0
    };
    var res = await sbClient.from('service_plans').insert(plan);
    if (res.error) {
        // Table may not exist yet — save to localStorage
        var plans = JSON.parse(localStorage.getItem('servicePlans_' + companyId) || '[]');
        plan.id = 'sp_' + Date.now();
        plan.created_at = new Date().toISOString();
        plans.push(plan);
        localStorage.setItem('servicePlans_' + companyId, JSON.stringify(plans));
    }
    hideServicePlanForm();
    document.querySelector('#servicePlanFormArea form').reset();
    loadServicePlans();
    alert('✅ Plan de Servicio creado');
}

async function loadServicePlans() {
    if (!companyId) return;
    var res = await sbClient.from('service_plans').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (res.error || !res.data) {
        // Fallback to localStorage
        servicePlansData = JSON.parse(localStorage.getItem('servicePlans_' + companyId) || '[]');
    } else {
        servicePlansData = res.data;
    }
    renderServicePlans();
}

function renderServicePlans() {
    var c = document.getElementById('servicePlansList');
    if (!c) return;
    if (servicePlansData.length === 0) {
        c.innerHTML = '<p class="empty-msg">No hay planes de servicio. Crea tu primer plan de mantenimiento para generar ingresos recurrentes.</p>';
        return;
    }
    var durLabels = { monthly: '/mes', quarterly: '/trimestre', annual: '/año' };
    var equipLabels = { residential_ac: 'AC Residencial', commercial_ac: 'AC Comercial', heating: 'Heating', full_system: 'Sistema Completo', refrigeration: 'Refrigeración' };
    
    c.innerHTML = '<div class="sp-grid">' + servicePlansData.map(function(p) {
        return '<div class="sp-card">' +
            '<div class="sp-card-header"><h4>' + p.name + '</h4><div class="sp-price">$' + (p.price || 0).toFixed(2) + ' <small>' + (durLabels[p.duration] || '/mes') + '</small></div></div>' +
            '<div class="sp-card-body"><div class="sp-detail">' +
            '<strong>Equipo:</strong> ' + (equipLabels[p.equipment_type] || p.equipment_type || '—') + '<br>' +
            '<strong>Visitas/Año:</strong> ' + (p.visits_per_year || 0) + '<br>' +
            '<strong>Descuento:</strong> ' + (p.repair_discount || 0) + '% en reparaciones<br>' +
            (p.includes ? '<strong>Incluye:</strong> ' + p.includes : '') +
            '</div></div>' +
            '<div class="sp-card-footer">' +
            '<span class="sp-enrolled">' + (p.enrolled_count || 0) + ' clientes</span>' +
            '<button class="btn-secondary btn-sm" style="font-size:10px;padding:4px 10px;" onclick="deleteServicePlan(\'' + p.id + '\')">🗑️</button>' +
            '</div></div>';
    }).join('') + '</div>';
}

async function deleteServicePlan(id) {
    if (!confirm('¿Eliminar este plan?')) return;
    var res = await sbClient.from('service_plans').delete().eq('id', id);
    if (res.error) {
        var plans = JSON.parse(localStorage.getItem('servicePlans_' + companyId) || '[]');
        plans = plans.filter(function(p) { return p.id !== id; });
        localStorage.setItem('servicePlans_' + companyId, JSON.stringify(plans));
    }
    loadServicePlans();
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
