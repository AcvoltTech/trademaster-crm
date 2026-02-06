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
    var res = await sbClient.from('companies').select('id').eq('created_by', currentUser.id).single();
    if (res.data) companyId = res.data.id;
}

// ===== DASHBOARD =====
function showDashboard() {
    if (!currentUser) return;
    var meta = currentUser.user_metadata || {};
    var name = meta.first_name || currentUser.email.split('@')[0];
    var company = meta.company_name || 'Mi Empresa';
    var ini = name.charAt(0).toUpperCase();
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'grid';
    document.getElementById('companyDisplay').textContent = company;
    document.getElementById('userInitials').textContent = ini;
    document.getElementById('sidebarInitials').textContent = ini;
    document.getElementById('sidebarUserName').textContent = name;
    showSection('dashboard');
    loadAllData();
}

async function loadAllData() {
    await loadTechnicians();
    await loadLeadsData();
    await loadJobs();
    updateKPIs();
}

function updateKPIs() {
    document.getElementById('leadCountKPI').textContent = leadsData.length;
    document.getElementById('techCountKPI').textContent = techsData.length;
    document.getElementById('jobCountKPI').textContent = jobsData.filter(function(j) { return j.status !== 'completed'; }).length;
    document.getElementById('clientCountKPI').textContent = '0';
}

// ===== NAVIGATION =====
function showSection(name) {
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    var t = document.getElementById(name + '-section');
    if (t) t.classList.add('active');
    var titles = { dashboard:'Dashboard', leads:'Gestión de Leads', dispatch:'Dispatch - Centro de Control', clients:'Clientes', jobs:'Trabajos', technicians:'Técnicos', invoices:'Facturas', collections:'Cobranza', settings:'Configuración' };
    document.getElementById('pageTitle').textContent = titles[name] || 'Dashboard';
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    var al = document.querySelector('[onclick="showSection(\'' + name + '\')"]');
    if (al) al.classList.add('active');
    if (name === 'leads') setTimeout(function() { if (!leadsMap) initLeadsMap(); else google.maps.event.trigger(leadsMap, 'resize'); }, 150);
    if (name === 'dispatch') setTimeout(function() { if (!dispatchMap) initDispatchMap(); else google.maps.event.trigger(dispatchMap, 'resize'); updateDispatchMap(); }, 150);
    if (name === 'technicians') { renderTechFullList(); generateTrackingLinks(); }
    if (name === 'jobs') { populateEstimateJobs(); }
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
    alert('¡Lead convertido a trabajo! Ve a Dispatch para verlo.');
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
function saveSettings() { alert('Configuración guardada'); }

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
    var jobSel = document.getElementById('estJobSelect');
    var job = jobsData.find(function(j) { return j.id === jobSel.value; });
    var model = document.getElementById('estModelNum').value;
    var serial = document.getElementById('estSerialNum').value;
    var brand = document.getElementById('estBrand').value;
    var age = document.getElementById('estEquipAge').value;
    var equipType = currentEquipType ? componentCatalog[currentEquipType].label : 'N/A';

    var msg = '🏠 REFERENCIA PARA REEMPLAZO DE EQUIPO\n\n';
    msg += 'Cliente: ' + (job ? job.title : 'N/A') + '\n';
    msg += 'Dirección: ' + (job ? job.address : 'N/A') + '\n';
    msg += 'Equipo: ' + equipType + '\n';
    msg += 'Marca: ' + (brand || 'N/A') + '\n';
    msg += 'Modelo: ' + (model || 'N/A') + '\n';
    msg += 'Serial: ' + (serial || 'N/A') + '\n';
    msg += 'Edad: ' + (age || '?') + ' años\n';
    msg += 'Razón: Equipo viejo - cliente quiere reemplazo\n';

    // Open Home Advisor / generate referral
    if (confirm('¿Referir este trabajo a Home Advisor para reemplazo?\n\n' + msg)) {
        // Copy to clipboard
        navigator.clipboard.writeText(msg).then(function() {
            alert('✅ Información copiada al portapapeles.\n\nAbre Home Advisor o envía por email/texto al advisor de tu empresa.');
        });
        // Open Home Advisor
        window.open('https://www.homeadvisor.com/', '_blank');
    }
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

    // If client declines, only charge service call
    if (decision === 'no') { grandTotal = scFee; }

    var h = '<div class="totals-grid">';
    h += '<div class="total-row sc-row"><span>🚐 Service Call:</span><span>$' + scFee.toFixed(2) + '</span></div>';
    if (decision !== 'no') {
        h += '<div class="total-row"><span>Partes:</span><span>$' + partsTotal.toFixed(2) + '</span></div>';
        h += '<div class="total-row"><span>Labor:</span><span>$' + laborTotal.toFixed(2) + '</span></div>';
        h += '<div class="total-row"><span>Subtotal:</span><span>$' + subtotal.toFixed(2) + '</span></div>';
        if (discount > 0) h += '<div class="total-row discount"><span>Descuento (' + discount + '%):</span><span>-$' + discountAmt.toFixed(2) + '</span></div>';
        h += '<div class="total-row"><span>Tax (' + taxRate + '%):</span><span>$' + taxAmt.toFixed(2) + '</span></div>';
    }
    if (decision === 'no') {
        h += '<div class="total-row" style="color:var(--warning);"><span>⚠️ Cliente declinó reparación</span><span></span></div>';
    }
    h += '<div class="total-row grand"><span>TOTAL:</span><span>$' + grandTotal.toFixed(2) + '</span></div>';
    h += '</div>';
    document.getElementById('estimateTotals').innerHTML = h;
}

    var h = '<div class="totals-grid">';
    h += '<div class="total-row"><span>Partes:</span><span>$' + partsTotal.toFixed(2) + '</span></div>';
    h += '<div class="total-row"><span>Labor:</span><span>$' + laborTotal.toFixed(2) + '</span></div>';
    h += '<div class="total-row"><span>Subtotal:</span><span>$' + subtotal.toFixed(2) + '</span></div>';
    if (discount > 0) h += '<div class="total-row discount"><span>Descuento (' + discount + '%):</span><span>-$' + discountAmt.toFixed(2) + '</span></div>';
    h += '<div class="total-row"><span>Tax (' + taxRate + '%):</span><span>$' + taxAmt.toFixed(2) + '</span></div>';
    h += '<div class="total-row grand"><span>TOTAL:</span><span>$' + total.toFixed(2) + '</span></div>';
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
    if (selectedEstItems.length === 0) { alert('Agrega componentes primero'); return; }
    var equip = componentCatalog[currentEquipType];
    var discount = parseFloat(document.getElementById('estDiscount').value) || 0;
    var taxRate = parseFloat(document.getElementById('estTax').value) || 0;
    var subtotal = 0;
    selectedEstItems.forEach(function(i) { subtotal += (i.price + i.labor) * i.qty; });
    var discountAmt = subtotal * (discount / 100);
    var afterDiscount = subtotal - discountAmt;
    var taxAmt = afterDiscount * (taxRate / 100);
    var total = afterDiscount + taxAmt;

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
    html += '<div class="header"><h1>🔧 Trade Master</h1><p>Estimado de Servicio</p><p style="margin-top:8px;">' + equip.label + '</p></div>';

    // Table
    html += '<table><thead><tr><th>Componente</th><th>Cant</th><th>Parte</th><th>Labor</th><th>Total</th></tr></thead><tbody>';
    selectedEstItems.forEach(function(i) {
        html += '<tr><td>' + i.name + '</td><td>' + i.qty + '</td><td>$' + (i.price*i.qty).toFixed(2) + '</td><td>$' + (i.labor*i.qty).toFixed(2) + '</td><td><strong>$' + ((i.price+i.labor)*i.qty).toFixed(2) + '</strong></td></tr>';
    });
    html += '</tbody></table>';

    // Totals
    html += '<div class="total-section"><div class="total-line"><span>Subtotal:</span><span>$' + subtotal.toFixed(2) + '</span></div>';
    if (discount > 0) html += '<div class="total-line"><span>Descuento (' + discount + '%):</span><span>-$' + discountAmt.toFixed(2) + '</span></div>';
    html += '<div class="total-line"><span>Tax (' + taxRate + '%):</span><span>$' + taxAmt.toFixed(2) + '</span></div>';
    html += '<div class="total-line grand"><span>TOTAL:</span><span>$' + total.toFixed(2) + '</span></div></div>';

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
