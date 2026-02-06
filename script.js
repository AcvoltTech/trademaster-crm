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
    await sbClient.from('work_orders').insert({
        company_id: companyId, title: lead.service + ' - ' + lead.name,
        service_type: lead.service, address: lead.address,
        lat: lead.lat, lng: lead.lng,
        technician_id: lead.technician_id || null,
        notes: 'Lead: ' + lead.name + ' | Tel: ' + lead.phone + (lead.notes ? ' | ' + lead.notes : '')
    });
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
    var h = '<table class="dispatch-table"><thead><tr><th>Trabajo</th><th>Prioridad</th><th>Técnico</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
    jobsData.forEach(function(j) {
        var techName = j.technicians ? j.technicians.name : 'Sin asignar';
        var status = j.status || 'pending';
        h += '<tr><td>' + j.title + '<br><span style="font-size:11px;color:#94a3b8;">' + (j.address || '') + '</span></td>';
        h += '<td><span class="priority-badge ' + j.priority + '">' + j.priority + '</span></td>';
        h += '<td>' + techName + '</td>';
        h += '<td><span class="job-status ' + status + '">' + status + '</span></td>';
        h += '<td><div class="job-actions">';
        if (j.lat && j.lng) h += '<button class="btn-nav" onclick="navigateTo(' + j.lat + ',' + j.lng + ')">🧭 Navegar</button>';
        h += '<button class="btn-danger-sm" onclick="deleteJob(\'' + j.id + '\')">X</button>';
        h += '</div></td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
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

    // Técnicos en azul (solo si NO están offline)
    techsData.forEach(function(t) {
        if (!t.current_lat || !t.current_lng) return;
        if (t.status === 'offline') return;
        var pos = { lat: parseFloat(t.current_lat), lng: parseFloat(t.current_lng) };
        var statusColors = {available:'#3b82f6', busy:'#f59e0b', on_route:'#8b5cf6'};
        var pinColor = statusColors[t.status] || '#3b82f6';
        var m = new google.maps.Marker({ position: pos, map: dispatchMap, title: t.name,
            icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 7, fillColor: pinColor, fillOpacity: 1, strokeColor: 'white', strokeWeight: 2, rotation: 0 } });
        var iw = new google.maps.InfoWindow({ content: '<div style="color:#333;padding:8px;font-size:13px;"><strong>👷 ' + t.name + '</strong><br>📱 ' + (t.phone || '') + '<br>🔧 ' + (t.specialty || '') + '<br>Estado: ' + t.status + '<br><a href="tel:' + (t.phone || '') + '" style="color:#059669;font-weight:bold;">📞 Llamar</a> | <a href="sms:' + (t.phone || '') + '" style="color:#3b82f6;font-weight:bold;">💬 Texto</a></div>' });
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
});
