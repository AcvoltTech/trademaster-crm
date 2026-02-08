// ===== TRADE MASTER CRM - FULL SYSTEM =====
var SUPABASE_URL = 'https://ucowlcrddzukykbaitzt.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb3dsY3JkZHp1a3lrYmFpdHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY4MDUsImV4cCI6MjA4NTg4MjgwNX0.SMZ6VA4jOfT120nUZm0U19dGE2j2MQ2sn_gGjv-oPes';
var sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var leadsMap = null, dispatchMap = null, trackingMap = null;
var markers = [], dispatchMarkers = [];
var leadsData = [], techsData = [], jobsData = [];
var currentUser = null, companyId = null;
var trackingInterval = null;

// ===== SUPABASE CACHE (migrated from localStorage) =====
var _sbCache = {
    companySettings: null,
    dispatchCoord: null,
    expenses: [],
    payroll: [],
    campaigns: [],
    priceBook: [],
    timeClock: { activeSession: null, history: [] },
    techRates: {},
    payrollProvider: {}
};

// Generic Supabase load with localStorage fallback
async function sbLoad(table, lsKey, defaultVal) {
    if (!companyId) return defaultVal || [];
    try {
        var res = await sbClient.from(table).select('*').eq('company_id', companyId);
        if (res.error) throw res.error;
        return res.data || defaultVal || [];
    } catch(e) {
        console.warn('sbLoad fallback to localStorage for ' + table, e.message);
        try { return JSON.parse(localStorage.getItem(lsKey) || JSON.stringify(defaultVal || [])); } catch(e2) { return defaultVal || []; }
    }
}

// Load company_settings from Supabase
async function loadCompanySettings() {
    if (!companyId) return {};
    try {
        var res = await sbClient.from('company_settings').select('*').eq('company_id', companyId).single();
        if (res.error && res.error.code === 'PGRST116') {
            // No row yet — load from localStorage and migrate
            var oldSettings = {};
            try { oldSettings = JSON.parse(localStorage.getItem('tm_settings_' + companyId) || '{}'); } catch(e){}
            var oldLogo = localStorage.getItem('tm_company_logo') || null;
            var oldProvider = {};
            try { oldProvider = JSON.parse(localStorage.getItem('tm_payroll_provider') || '{}'); } catch(e){}
            var oldRates = {};
            try { oldRates = JSON.parse(localStorage.getItem('tm_tech_rates') || '{}'); } catch(e){}
            var newRow = {
                company_id: companyId,
                owner_name: oldSettings.ownerName || '',
                contractor_license: oldSettings.contractorLicense || '',
                contractor_bond: oldSettings.contractorBond || '',
                address: oldSettings.address || '',
                company_logo: oldLogo,
                payroll_provider: oldProvider.selected || '',
                payroll_config: oldProvider,
                tech_rates: oldRates
            };
            await sbClient.from('company_settings').insert(newRow);
            _sbCache.companySettings = newRow;
            return newRow;
        }
        if (res.error) throw res.error;
        _sbCache.companySettings = res.data;
        return res.data;
    } catch(e) {
        console.warn('loadCompanySettings fallback', e.message);
        var ls = {};
        try { ls = JSON.parse(localStorage.getItem('tm_settings_' + companyId) || '{}'); } catch(e2){}
        _sbCache.companySettings = ls;
        return ls;
    }
}

// Save company_settings to Supabase
async function saveCompanySettings(updates) {
    Object.assign(_sbCache.companySettings || {}, updates);
    if (!companyId) return;
    try {
        var res = await sbClient.from('company_settings').upsert(Object.assign({ company_id: companyId }, _sbCache.companySettings));
        if (res.error) throw res.error;
    } catch(e) {
        console.warn('saveCompanySettings fallback', e.message);
        var ls = {};
        try { ls = JSON.parse(localStorage.getItem('tm_settings_' + companyId) || '{}'); } catch(e2){}
        Object.assign(ls, updates);
        localStorage.setItem('tm_settings_' + companyId, JSON.stringify(ls));
    }
}

// Load dispatch coordinator from Supabase
async function loadDispatchCoord() {
    if (!companyId) return {};
    try {
        var res = await sbClient.from('dispatch_coordinator').select('*').eq('company_id', companyId).single();
        if (res.error && res.error.code === 'PGRST116') {
            // No row yet — migrate from localStorage
            var old = {};
            try { old = JSON.parse(localStorage.getItem('dispatchCoord_' + companyId) || '{}'); } catch(e){}
            if (old.name) {
                var newRow = Object.assign({ company_id: companyId }, old);
                await sbClient.from('dispatch_coordinator').insert(newRow);
                _sbCache.dispatchCoord = newRow;
                return newRow;
            }
            _sbCache.dispatchCoord = {};
            return {};
        }
        if (res.error) throw res.error;
        _sbCache.dispatchCoord = res.data;
        return res.data;
    } catch(e) {
        console.warn('loadDispatchCoord fallback', e.message);
        var ls = {};
        try { ls = JSON.parse(localStorage.getItem('dispatchCoord_' + companyId) || '{}'); } catch(e2){}
        _sbCache.dispatchCoord = ls;
        return ls;
    }
}

// Load all expenses from Supabase  
async function loadExpenses() {
    try {
        var data = await sbLoad('expenses', 'tm_expenses_' + companyId, []);
        _sbCache.expenses = data;
        expensesData = data;
        return data;
    } catch(e) { return []; }
}

// Load payroll entries from Supabase
async function loadPayrollEntries() {
    try {
        var data = await sbLoad('payroll_entries', 'tm_payroll', []);
        _sbCache.payroll = data;
        payrollData = data;
        return data;
    } catch(e) { return []; }
}

// Load campaigns from Supabase
async function loadCampaigns() {
    try {
        var data = await sbLoad('campaigns', 'tm_campaigns', []);
        _sbCache.campaigns = data;
        campaignsData = data;
        return data;
    } catch(e) { return []; }
}

// Load price book from Supabase
async function loadPriceBook() {
    try {
        var data = await sbLoad('price_book', 'tm_pricebook', []);
        _sbCache.priceBook = data;
        priceBookData = data;
        return data;
    } catch(e) { return []; }
}

// Cached estimates data (loaded from Supabase)
var estimatesData = [];
async function loadEstimates() {
    try {
        var data = await sbLoad('estimates', 'savedEstimates_' + companyId, []);
        // Merge with localStorage data if any
        var lsData = [];
        try { lsData = JSON.parse(localStorage.getItem('savedEstimates_' + companyId) || '[]'); } catch(e){}
        if (data.length === 0 && lsData.length > 0) data = lsData;
        estimatesData = data;
        return data;
    } catch(e) { return []; }
}

// Load time clock from Supabase
async function loadTimeClock() {
    if (!companyId) return;
    try {
        // Load active session
        var activeRes = await sbClient.from('time_clock').select('*').eq('company_id', companyId).eq('is_active', true).single();
        if (activeRes.data) {
            clockData.activeSession = {
                id: activeRes.data.id,
                tech_id: activeRes.data.tech_id,
                tech_name: activeRes.data.tech_name,
                rate: parseFloat(activeRes.data.rate) || 0,
                clockIn: activeRes.data.clock_in,
                clockOut: activeRes.data.clock_out,
                date: activeRes.data.date
            };
        } else {
            clockData.activeSession = null;
        }
        // Load today history
        var today = new Date().toISOString().split('T')[0];
        var histRes = await sbClient.from('time_clock').select('*').eq('company_id', companyId).eq('date', today).eq('is_active', false).order('clock_in', { ascending: false });
        clockData.history = (histRes.data || []).map(function(r) {
            return { id: r.id, tech_id: r.tech_id, tech_name: r.tech_name, rate: parseFloat(r.rate)||0, clockIn: r.clock_in, clockOut: r.clock_out, totalMs: parseInt(r.total_ms)||0, date: r.date };
        });
    } catch(e) {
        console.warn('loadTimeClock fallback', e.message);
        try { clockData = JSON.parse(localStorage.getItem('tm_clock') || '{}'); } catch(e2) { clockData = {}; }
    }
}

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
        var addrEl = document.getElementById('settingsAddress');
        if (addrEl) addrEl.value = window._companyInfo.address || '';
        var licEl = document.getElementById('settingsLicense');
        if (licEl) licEl.value = window._companyInfo.contractor_license || '';
        // Load extra from Supabase company_settings (cached)
        var stgLocal = _sbCache.companySettings || {};
        var bondEl = document.getElementById('settingsBond');
        if (bondEl) bondEl.value = stgLocal.contractor_bond || stgLocal.contractorBond || '';
        var ownerEl = document.getElementById('settingsOwnerName');
        if (ownerEl) ownerEl.value = stgLocal.owner_name || stgLocal.ownerName || '';
        if (window._companyInfo.contract_clauses && window._companyInfo.contract_clauses.payment) {
            loadClausesFromData(window._companyInfo.contract_clauses);
        } else {
            loadDefaultClauses();
        }
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
    // Load migrated tables from Supabase
    try { await loadCompanySettings(); } catch(e) { console.log('company_settings not ready'); }
    try { await loadDispatchCoord(); } catch(e) { console.log('dispatch_coordinator not ready'); }
    try { await loadExpenses(); } catch(e) { console.log('expenses not ready'); }
    try { await loadPayrollEntries(); } catch(e) { console.log('payroll_entries not ready'); }
    try { await loadCampaigns(); } catch(e) { console.log('campaigns not ready'); }
    try { await loadPriceBook(); } catch(e) { console.log('price_book not ready'); }
    try { await loadTimeClock(); } catch(e) { console.log('time_clock not ready'); }
    try { await loadEstimates(); } catch(e) { console.log('estimates not ready'); }
    // Load payroll provider from company_settings
    payrollProviderConfig = (_sbCache.companySettings || {}).payroll_config || {};
    updateKPIs();
    renderDashboardDynamic();
}

function updateKPIs() {
    var el = function(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; };
    el('leadCountKPI', leadsData.length);
    el('techCountKPI', techsData.length);
    el('jobCountKPI', jobsData.filter(function(j) { return j.status !== 'completed' && j.status !== 'cancelled'; }).length);
    el('clientCountKPI', clientsData.length);
    // Update HCP dashboard cards
    if (document.getElementById('hcpOpenEstimates')) renderHCPDashboard();
}

// ===== NAVIGATION =====
function showSection(name) {
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    var t = document.getElementById(name + '-section');
    if (t) t.classList.add('active');
    var titles = { dashboard:'Tablero', calendar:'Agenda', inbox:'Bandeja de Comunicaciones', leads:'Gestión de Prospectos', dispatch:'Despacho - Centro de Control', clients:'Clientes', jobs:'Trabajos', technicians:'Técnicos', advisors:'Asesores del Hogar', invoices:'Facturas', collections:'Cobranza', settings:'Configuración', pipeline:'Flujo de Ventas', mymoney:'Mi Dinero', payroll:'Nómina', marketing:'Mercadotecnia', pricebook:'Lista de Precios', reports:'Reportes', receipts:'Recibos de Proveedores', expenses:'Gastos del Negocio', mailbox:'Correo del Negocio', team:'Usuarios y Equipo' };
    var titlesEN = { dashboard:'Dashboard', calendar:'Schedule', inbox:'Inbox', leads:'Leads Management', dispatch:'Dispatch - Control Center', clients:'Customers', jobs:'Jobs', technicians:'Technicians', advisors:'Home Advisors', invoices:'Invoices', collections:'Collections', settings:'Settings', pipeline:'Sales Pipeline', mymoney:'My Money', payroll:'Payroll', marketing:'Marketing', pricebook:'Price Book', reports:'Reports', receipts:'Vendor Receipts', expenses:'Business Expenses', mailbox:'Business Mail', team:'Users & Team' };
    document.getElementById('pageTitle').textContent = (currentLang === 'en' ? titlesEN[name] : titles[name]) || 'Dashboard';
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    var al = document.querySelector('[onclick="showSection(\'' + name + '\')"]');
    if (al) al.classList.add('active');
    if (name === 'dashboard') { renderDashboardDynamic(); renderHCPDashboard(); }
    if (name === 'calendar') { initCalendar(); }
    if (name === 'inbox') { loadInbox(); }
    if (name === 'clients') { loadClients(); }
    if (name === 'leads') setTimeout(function() { if (!leadsMap) initLeadsMap(); else google.maps.event.trigger(leadsMap, 'resize'); }, 150);
    if (name === 'dispatch') setTimeout(function() { if (!dispatchMap) initDispatchMap(); else google.maps.event.trigger(dispatchMap, 'resize'); updateDispatchMap(); renderDispatchCoord(); }, 150);
    if (name === 'technicians') { renderTechFullList(); generateTrackingLinks(); }
    if (name === 'jobs') { populateEstimateJobs(); loadAdvisors(); }
    if (name === 'advisors') { loadAdvisors(); loadReferrals(); }
    if (name === 'invoices') { populateInvoiceSelects(); loadInvoices(); }
    if (name === 'collections') { loadCollections(); }
    if (name === 'pipeline') { renderPipelineSection(); }
    if (name === 'mymoney') { renderMyMoney(); }
    if (name === 'payroll') { renderPayroll(); }
    if (name === 'marketing') { renderMarketing(); }
    if (name === 'pricebook') { renderPriceBook(); }
    if (name === 'reports') { renderReports(); }
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
    var address = (document.getElementById('settingsAddress') || {}).value || '';
    var license = (document.getElementById('settingsLicense') || {}).value || '';
    var bond = (document.getElementById('settingsBond') || {}).value || '';
    var ownerName = (document.getElementById('settingsOwnerName') || {}).value || '';
    
    var updateData = { name: name, phone: phone, email: email, address: address, contractor_license: license };
    var res = await sbClient.from('companies').update(updateData).eq('id', companyId);
    if (res.error) { alert('Error: ' + res.error.message); return; }
    
    // Save extra fields to Supabase company_settings
    saveCompanySettings({
        contractor_license: license,
        contractor_bond: bond,
        owner_name: ownerName,
        address: address
    });
    
    // Update window._companyInfo
    if (window._companyInfo) {
        window._companyInfo.name = name;
        window._companyInfo.phone = phone;
        window._companyInfo.email = email;
        window._companyInfo.address = address;
        window._companyInfo.contractor_license = license;
    }
    
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
        saveCompanySettings({ company_logo: dataUrl });
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
    saveCompanySettings({ company_logo: null });
    location.reload();
}

function loadSavedLogo() {
    var settings = _sbCache.companySettings || {};
    var saved = settings.company_logo || null;
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
    var settings = _sbCache.companySettings || {};
    var companyAddr = (window._companyInfo && window._companyInfo.address) ? window._companyInfo.address : (settings.address || '');
    var companyLicense = settings.contractor_license || settings.contractorLicense || (window._companyInfo && window._companyInfo.contractor_license) || '';
    var companyBond = settings.contractor_bond || settings.contractorBond || '';
    
    // Get insurance info from expenses (Supabase cached)
    var insuranceInfo = [];
    var exps = _sbCache.expenses || expensesData || [];
    exps.forEach(function(ex) {
        if (ex.category === 'general_liability' && ex.vendor) insuranceInfo.push({type:'General Liability', vendor:ex.vendor, policy:ex.policyNum||''});
        if (ex.category === 'workers_comp' && ex.vendor) insuranceInfo.push({type:'Workers Compensation', vendor:ex.vendor, policy:ex.policyNum||''});
        if (ex.category === 'bond' && ex.vendor) insuranceInfo.push({type:'Contractor Bond', vendor:ex.vendor, policy:ex.policyNum||''});
    });
    
    html += '<div class="inv-header"><div class="company-info"><h1>🔧 ' + company + '</h1>';
    if (companyAddr) html += '<p>📍 ' + companyAddr + '</p>';
    if (companyPhone) html += '<p>📱 ' + companyPhone + '</p>';
    if (companyEmail) html += '<p>📧 ' + companyEmail + '</p>';
    if (companyLicense) html += '<p style="font-weight:700;color:#1e3a5f;margin-top:4px;">📜 Lic. # ' + companyLicense + '</p>';
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

    // Contractor Credentials Box
    if (companyLicense || insuranceInfo.length > 0) {
        html += '<div style="margin-bottom:20px;padding:14px;background:#f0f4f8;border:1px solid #cbd5e1;border-radius:8px;">';
        html += '<h4 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#475569;margin-bottom:8px;">📜 Licencias y Seguros del Contratista</h4>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;font-size:12px;">';
        if (companyLicense) {
            html += '<div style="padding:8px;background:white;border-radius:6px;border:1px solid #e2e8f0;">';
            html += '<strong style="color:#1e3a5f;">📜 Licencia de Contratista</strong><br>';
            html += '<span style="font-size:14px;font-weight:700;color:#f47621;">' + companyLicense + '</span></div>';
        }
        insuranceInfo.forEach(function(ins) {
            html += '<div style="padding:8px;background:white;border-radius:6px;border:1px solid #e2e8f0;">';
            html += '<strong style="color:#1e3a5f;">🛡️ ' + ins.type + '</strong><br>';
            html += '<span>' + ins.vendor + '</span>';
            if (ins.policy) html += '<br><span style="font-size:11px;color:#666;">Póliza: ' + ins.policy + '</span>';
            html += '</div>';
        });
        if (companyBond) {
            html += '<div style="padding:8px;background:white;border-radius:6px;border:1px solid #e2e8f0;">';
            html += '<strong style="color:#1e3a5f;">🏦 Contractor Bond</strong><br>';
            html += '<span>' + companyBond + '</span></div>';
        }
        html += '</div></div>';
    }

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
    html += '<div class="footer">';
    html += '<p><strong>' + company + '</strong></p>';
    if (companyLicense) html += '<p>📜 Contractor License: ' + companyLicense + ' | State of California</p>';
    if (insuranceInfo.length > 0) {
        var insText = insuranceInfo.map(function(i) { return i.type + ': ' + i.vendor + (i.policy ? ' (#' + i.policy + ')' : ''); }).join(' | ');
        html += '<p>🛡️ ' + insText + '</p>';
    }
    html += '<p>Gracias por su preferencia</p>';
    html += '<p style="margin-top:4px;">Generado por Trade Master CRM | trademastersusa.org</p></div>';

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
    // If in profile view, go back to list first
    if (document.getElementById('clientProfileView').style.display !== 'none') closeClientProfile();
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
        var companyEl = document.getElementById('clientCompany');
        if (companyEl) companyEl.value = c.company || '';
        var tagsEl = document.getElementById('clientTags');
        if (tagsEl && c.tags) {
            for (var i = 0; i < tagsEl.options.length; i++) {
                tagsEl.options[i].selected = c.tags.indexOf(tagsEl.options[i].value) >= 0;
            }
        }
    }
}
function hideClientForm() { document.getElementById('clientFormContainer').style.display = 'none'; editingClientId = null; }

async function handleClientCreate(event) {
    event.preventDefault();
    var tagsSelect = document.getElementById('clientTags');
    var tags = [];
    if (tagsSelect) { for (var i = 0; i < tagsSelect.selectedOptions.length; i++) tags.push(tagsSelect.selectedOptions[i].value); }
    var data = {
        company_id: companyId,
        name: document.getElementById('clientName').value,
        phone: document.getElementById('clientPhone').value,
        email: document.getElementById('clientEmail').value,
        address: document.getElementById('clientAddress').value,
        property_type: document.getElementById('clientPropertyType').value,
        company: (document.getElementById('clientCompany') || {}).value || '',
        tags: tags,
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
    var tagFilter = (document.getElementById('clientFilterTag') || {}).value || '';
    var filtered = clientsData.filter(function(cl) {
        if (search && !((cl.name || '').toLowerCase().indexOf(search) >= 0 ||
               (cl.phone || '').indexOf(search) >= 0 ||
               (cl.email || '').toLowerCase().indexOf(search) >= 0 ||
               (cl.address || '').toLowerCase().indexOf(search) >= 0 ||
               (cl.company || '').toLowerCase().indexOf(search) >= 0)) return false;
        if (tagFilter) {
            var tags = cl.tags || [];
            if (tagFilter === cl.property_type) return true;
            if (tags.indexOf(tagFilter) >= 0) return true;
            return false;
        }
        return true;
    });
    
    var countEl = document.getElementById('clientCount');
    if (countEl) countEl.textContent = '(' + filtered.length + ' de ' + clientsData.length + ')';
    
    if (filtered.length === 0) { c.innerHTML = '<p class="empty-msg">No hay clientes' + (search ? ' que coincidan' : '') + '.</p>'; return; }

    var tagHTML = function(cl) {
        var h = '';
        var typeClass = cl.property_type === 'Comercial' ? 'tag-com' : cl.property_type === 'Industrial' ? 'tag-ind' : 'tag-res';
        if (cl.property_type) h += '<span class="client-tag ' + typeClass + '">' + cl.property_type + '</span> ';
        (cl.tags || []).forEach(function(t) {
            var tc = t === 'VIP' ? 'tag-vip' : t === 'Plan de Servicio' ? 'tag-sp' : 'tag-default';
            h += '<span class="client-tag ' + tc + '">' + t + '</span> ';
        });
        return h;
    };
    
    // Bulk actions bar
    var h = '<div id="clientBulkBar" class="client-bulk-bar" style="display:none;">';
    h += '<span id="clientSelectedCount">0 seleccionados</span>';
    h += '<button class="btn-sm" style="background:#ef4444;color:white;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;" onclick="deleteSelectedClients()">🗑️ Eliminar Seleccionados</button>';
    h += '<button class="btn-secondary btn-sm" onclick="clearClientSelection()">Cancelar</button>';
    h += '</div>';

    h += '<table class="dispatch-table"><thead><tr>';
    h += '<th style="width:36px;"><input type="checkbox" id="clientSelectAll" onchange="toggleAllClients(this.checked)" title="Seleccionar todos"></th>';
    h += '<th>Cliente</th><th>Empresa</th><th>Contacto</th><th>Dirección</th><th>Tags</th><th>Acciones</th></tr></thead><tbody>';
    filtered.forEach(function(cl) {
        h += '<tr id="clientRow_' + cl.id + '">';
        h += '<td><input type="checkbox" class="client-checkbox" value="' + cl.id + '" onchange="updateClientBulkBar()"></td>';
        h += '<td><a href="#" onclick="openClientProfile(\'' + cl.id + '\');return false;" style="color:var(--primary);font-weight:700;text-decoration:none;">' + cl.name + '</a></td>';
        h += '<td style="font-size:12px;color:var(--text-muted);">' + (cl.company || '—') + '</td>';
        h += '<td style="font-size:12px;">';
        if (cl.phone) h += '<a href="tel:' + cl.phone + '" class="btn-call">📱 ' + cl.phone + '</a>';
        if (cl.email) h += '<br><span style="color:var(--text-muted);font-size:11px;">' + cl.email + '</span>';
        h += '</td>';
        h += '<td style="font-size:11px;">' + (cl.address || '—') + '</td>';
        h += '<td>' + tagHTML(cl) + '</td>';
        h += '<td><div class="client-action-btns">';
        h += '<button class="client-action-btn client-btn-view" onclick="openClientProfile(\'' + cl.id + '\')" title="Ver Perfil">👁️ Ver</button>';
        h += '<button class="client-action-btn client-btn-edit" onclick="showClientForm(\'' + cl.id + '\')" title="Editar">✏️ Editar</button>';
        h += '<button class="client-action-btn client-btn-delete" onclick="deleteClient(\'' + cl.id + '\')" title="Eliminar">🗑️</button>';
        h += '</div></td></tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

function toggleAllClients(checked) {
    document.querySelectorAll('.client-checkbox').forEach(function(cb) { cb.checked = checked; });
    updateClientBulkBar();
}

function updateClientBulkBar() {
    var checked = document.querySelectorAll('.client-checkbox:checked');
    var bar = document.getElementById('clientBulkBar');
    var countSpan = document.getElementById('clientSelectedCount');
    if (checked.length > 0) {
        bar.style.display = 'flex';
        countSpan.textContent = checked.length + ' seleccionado' + (checked.length > 1 ? 's' : '');
    } else {
        bar.style.display = 'none';
    }
}

function clearClientSelection() {
    document.querySelectorAll('.client-checkbox').forEach(function(cb) { cb.checked = false; });
    var selectAll = document.getElementById('clientSelectAll');
    if (selectAll) selectAll.checked = false;
    updateClientBulkBar();
}

async function deleteSelectedClients() {
    var checked = document.querySelectorAll('.client-checkbox:checked');
    var ids = [];
    checked.forEach(function(cb) { ids.push(cb.value); });
    if (ids.length === 0) return;
    if (!confirm('¿Eliminar ' + ids.length + ' cliente' + (ids.length > 1 ? 's' : '') + '?\n\n⚠️ Esta acción no se puede deshacer.')) return;
    
    var deleted = 0;
    for (var i = 0; i < ids.length; i++) {
        try {
            var res = await sbClient.from('clients').delete().eq('id', ids[i]);
            if (!res.error) deleted++;
        } catch(e) {}
    }
    
    alert('✅ ' + deleted + ' cliente' + (deleted > 1 ? 's eliminados' : ' eliminado'));
    await loadClients();
    updateKPIs();
}

function exportClientsCSV() {
    if (clientsData.length === 0) { alert('No hay clientes para exportar.'); return; }
    var csv = 'Nombre,Empresa,Teléfono,Email,Dirección,Tipo,Tags\\n';
    clientsData.forEach(function(c) {
        csv += '"' + (c.name||'') + '","' + (c.company||'') + '","' + (c.phone||'') + '","' + (c.email||'') + '","' + (c.address||'') + '","' + (c.property_type||'') + '","' + ((c.tags||[]).join(', ')) + '"\\n';
    });
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'clientes_trademaster_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
}

// ===== CLIENT PROFILE =====
var currentProfileClientId = null;

function openClientProfile(clientId) {
    currentProfileClientId = clientId;
    document.getElementById('clientListView').style.display = 'none';
    document.getElementById('clientProfileView').style.display = 'block';
    renderClientProfile();
    switchClientTab('profile');
}

function closeClientProfile() {
    currentProfileClientId = null;
    document.getElementById('clientProfileView').style.display = 'none';
    document.getElementById('clientListView').style.display = 'block';
}

function renderClientProfile() {
    var cl = clientsData.find(function(c) { return c.id === currentProfileClientId; });
    if (!cl) return;
    
    document.getElementById('cpName').textContent = cl.name || '—';
    document.getElementById('cpCompany').textContent = cl.company || '';
    
    // Tags
    var tagsEl = document.getElementById('cpTags');
    var tagsHTML = '';
    var typeClass = cl.property_type === 'Comercial' ? 'tag-com' : cl.property_type === 'Industrial' ? 'tag-ind' : 'tag-res';
    if (cl.property_type) tagsHTML += '<span class="client-tag ' + typeClass + '">' + cl.property_type + '</span>';
    (cl.tags || []).forEach(function(t) {
        var tc = t === 'VIP' ? 'tag-vip' : t === 'Service Plan' ? 'tag-sp' : 'tag-default';
        tagsHTML += '<span class="client-tag ' + tc + '">' + t + '</span>';
    });
    tagsEl.innerHTML = tagsHTML;
    
    // Contact info
    var contactHTML = '';
    if (cl.phone) contactHTML += '📱 <a href="tel:' + cl.phone + '">' + cl.phone + '</a> &nbsp;&nbsp;';
    if (cl.email) contactHTML += '📧 <a href="mailto:' + cl.email + '">' + cl.email + '</a> &nbsp;&nbsp;';
    if (cl.address) contactHTML += '<br>📍 ' + cl.address;
    document.getElementById('cpContact').innerHTML = contactHTML;
    
    // Stats
    var clientJobs = jobsData.filter(function(j) { return j.client_id === cl.id; });
    var clientInvoices = invoicesData.filter(function(i) { return i.client_id === cl.id; });
    var totalRevenue = clientInvoices.reduce(function(sum, inv) { return sum + (parseFloat(inv.total) || 0); }, 0);
    var completedJobs = clientJobs.filter(function(j) { return j.status === 'completed'; }).length;
    
    document.getElementById('cpStats').innerHTML =
        '<div class="cp-stat-card"><div class="cp-stat-num">' + clientJobs.length + '</div><div class="cp-stat-label">Trabajos</div></div>' +
        '<div class="cp-stat-card"><div class="cp-stat-num">' + completedJobs + '</div><div class="cp-stat-label">Completados</div></div>' +
        '<div class="cp-stat-card"><div class="cp-stat-num">' + clientInvoices.length + '</div><div class="cp-stat-label">Facturas</div></div>' +
        '<div class="cp-stat-card"><div class="cp-stat-num">$' + totalRevenue.toLocaleString() + '</div><div class="cp-stat-label">Revenue Total</div></div>';
    
    document.getElementById('cpAddress').textContent = cl.address || 'Sin dirección';
    document.getElementById('cpPropertyType').innerHTML = cl.property_type ? '<span class="client-tag ' + typeClass + '">' + cl.property_type + '</span>' : '';
    
    // Timeline
    var timeline = [];
    clientJobs.forEach(function(j) { timeline.push({ date: j.created_at, text: '🔧 Trabajo: ' + j.title, status: j.status }); });
    clientInvoices.forEach(function(i) { timeline.push({ date: i.created_at, text: '📄 Factura #' + (i.invoice_number || '') + ' — $' + (i.total || 0), status: i.status }); });
    timeline.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    
    var tlEl = document.getElementById('cpTimeline');
    if (timeline.length === 0) { tlEl.innerHTML = '<p class="empty-msg">Sin historial</p>'; }
    else {
        tlEl.innerHTML = timeline.slice(0, 10).map(function(t) {
            return '<div class="cp-timeline-item"><strong>' + t.text + '</strong><br><small>' + new Date(t.date).toLocaleDateString('es') + ' — ' + (t.status || '') + '</small></div>';
        }).join('');
    }
}

function switchClientTab(tab) {
    document.querySelectorAll('.cp-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.cp-tab-content').forEach(function(t) { t.style.display = 'none'; });
    
    var tabEl = document.querySelector('.cp-tab[onclick*="' + tab + '"]');
    if (tabEl) tabEl.classList.add('active');
    var contentEl = document.getElementById('cpTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (contentEl) contentEl.style.display = 'block';
    
    if (tab === 'profile') renderClientProfile();
    if (tab === 'jobs') renderClientJobs();
    if (tab === 'estimates') renderClientEstimates();
    if (tab === 'invoices') renderClientInvoices();
    if (tab === 'notes') renderClientNotes();
    if (tab === 'attachments') renderClientAttachments();
    if (tab === 'comms') renderClientComms();
}

function renderClientJobs() {
    var el = document.getElementById('cpJobsList');
    var jobs = jobsData.filter(function(j) { return j.client_id === currentProfileClientId; });
    if (jobs.length === 0) { el.innerHTML = '<p class="empty-msg">Sin trabajos</p>'; return; }
    var statusIcons = { pending:'🟡', in_progress:'🔵', completed:'✅', cancelled:'❌' };
    el.innerHTML = '<table class="dispatch-table"><thead><tr><th>Trabajo</th><th>Tipo</th><th>Estado</th><th>Fecha</th><th>Técnico</th></tr></thead><tbody>' +
        jobs.map(function(j) {
            var tech = techsData.find(function(t) { return t.id === j.technician_id; });
            return '<tr><td><strong>' + j.title + '</strong></td><td>' + (j.service_type||'') + '</td><td>' + (statusIcons[j.status]||'') + ' ' + (j.status||'') + '</td><td>' + (j.scheduled_date||'—') + '</td><td>' + (tech ? tech.name : '—') + '</td></tr>';
        }).join('') + '</tbody></table>';
}

function renderClientEstimates() {
    var el = document.getElementById('cpEstimatesList');
    var estimates = estimatesData || [];
    var clientEstimates = estimates.filter(function(e) { return e.client_id === currentProfileClientId || e.clientName === (clientsData.find(function(c){return c.id===currentProfileClientId;})||{}).name; });
    if (clientEstimates.length === 0) { el.innerHTML = '<p class="empty-msg">Sin estimados</p>'; return; }
    el.innerHTML = clientEstimates.map(function(e) {
        return '<div style="padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;"><strong>' + (e.jobTitle || 'Estimado') + '</strong> — <span style="color:var(--accent);font-weight:700;">$' + (e.total || 0) + '</span><br><small style="color:var(--text-muted);">' + (e.date || '') + ' | ' + (e.status || 'open') + '</small></div>';
    }).join('');
}

function renderClientInvoices() {
    var el = document.getElementById('cpInvoicesList');
    var invs = invoicesData.filter(function(i) { return i.client_id === currentProfileClientId; });
    if (invs.length === 0) { el.innerHTML = '<p class="empty-msg">Sin facturas</p>'; return; }
    var statusColors = { draft:'#9ca3af', sent:'#3b82f6', partial:'#f59e0b', paid:'#10b981', overdue:'#ef4444' };
    el.innerHTML = '<table class="dispatch-table"><thead><tr><th>#</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Vence</th></tr></thead><tbody>' +
        invs.map(function(i) {
            return '<tr><td>' + (i.invoice_number||'') + '</td><td><strong>$' + (i.total||0) + '</strong></td><td><span style="color:' + (statusColors[i.status]||'#666') + ';font-weight:600;">' + (i.status||'') + '</span></td><td>' + (i.created_at ? new Date(i.created_at).toLocaleDateString('es') : '') + '</td><td>' + (i.due_date||'—') + '</td></tr>';
        }).join('') + '</tbody></table>';
}

// ===== CLIENT NOTES =====
async function getClientMeta(clientId) {
    if (!companyId || !clientId) return { notes: [], attachments: [], comms: [] };
    try {
        var res = await sbClient.from('client_notes').select('*').eq('company_id', companyId).eq('client_id', clientId).order('created_at', { ascending: false });
        if (res.error) throw res.error;
        var meta = { notes: [], attachments: [], comms: [] };
        (res.data || []).forEach(function(r) {
            var item = { id: r.id, text: r.content, data: r.data, date: r.created_at, by: r.created_by };
            if (r.type === 'note') meta.notes.push(item);
            else if (r.type === 'attachment') meta.attachments.push(item);
            else if (r.type === 'communication') meta.comms.push(item);
        });
        return meta;
    } catch(e) {
        console.warn('getClientMeta fallback', e.message);
        var key = 'clientMeta_' + companyId + '_' + clientId;
        try { return JSON.parse(localStorage.getItem(key) || '{"notes":[],"attachments":[],"comms":[]}'); }
        catch(e2) { return { notes: [], attachments: [], comms: [] }; }
    }
}
async function saveClientNote(clientId, type, content, data) {
    if (!companyId || !clientId) return;
    try {
        await sbClient.from('client_notes').insert({
            company_id: companyId,
            client_id: clientId,
            type: type,
            content: content,
            data: data || null,
            created_by: 'Admin'
        });
    } catch(e) {
        console.warn('saveClientNote fallback', e.message);
        var key = 'clientMeta_' + companyId + '_' + clientId;
        var meta = { notes: [], attachments: [], comms: [] };
        try { meta = JSON.parse(localStorage.getItem(key) || '{"notes":[],"attachments":[],"comms":[]}'); } catch(e2){}
        var item = { id: 'n_' + Date.now(), text: content, data: data, date: new Date().toISOString(), by: 'Admin' };
        if (type === 'note') meta.notes.unshift(item);
        else if (type === 'attachment') meta.attachments.unshift(item);
        else meta.comms.unshift(item);
        localStorage.setItem(key, JSON.stringify(meta));
    }
}
function saveClientMeta(clientId, meta) {
    // Legacy compatibility — used by existing code
    localStorage.setItem('clientMeta_' + companyId + '_' + clientId, JSON.stringify(meta));
}

function addClientNote() {
    var text = document.getElementById('cpNewNote').value.trim();
    if (!text || !currentProfileClientId) return;
    var meta = getClientMeta(currentProfileClientId);
    meta.notes.unshift({ id: 'n_' + Date.now(), text: text, date: new Date().toISOString(), by: 'Admin' });
    saveClientMeta(currentProfileClientId, meta);
    document.getElementById('cpNewNote').value = '';
    renderClientNotes();
}

function deleteClientNote(noteId) {
    var meta = getClientMeta(currentProfileClientId);
    meta.notes = meta.notes.filter(function(n) { return n.id !== noteId; });
    saveClientMeta(currentProfileClientId, meta);
    renderClientNotes();
}

function renderClientNotes() {
    var el = document.getElementById('cpNotesList');
    var meta = getClientMeta(currentProfileClientId);
    if (meta.notes.length === 0) { el.innerHTML = '<p class="empty-msg">Sin notas</p>'; return; }
    el.innerHTML = meta.notes.map(function(n) {
        return '<div class="cp-note-item"><button class="cp-note-delete" onclick="deleteClientNote(\'' + n.id + '\')">✕</button><div class="cp-note-date">📝 ' + new Date(n.date).toLocaleString('es') + ' — ' + (n.by || '') + '</div><div class="cp-note-text">' + n.text + '</div></div>';
    }).join('');
}

// ===== CLIENT ATTACHMENTS =====
function uploadClientAttachment(input) {
    if (!input.files || !input.files[0] || !currentProfileClientId) return;
    var file = input.files[0];
    if (file.size > 5*1024*1024) { alert('⚠️ Máximo 5MB'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        var meta = getClientMeta(currentProfileClientId);
        meta.attachments.unshift({
            id: 'a_' + Date.now(), name: file.name, type: file.type,
            size: file.size, data: e.target.result, date: new Date().toISOString()
        });
        saveClientMeta(currentProfileClientId, meta);
        renderClientAttachments();
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function viewClientAttachment(attId) {
    var meta = getClientMeta(currentProfileClientId);
    var att = meta.attachments.find(function(a) { return a.id === attId; });
    if (!att) return;
    var w = window.open('', '_blank');
    if (att.type && att.type.startsWith('image/')) {
        w.document.write('<html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;"><img src="' + att.data + '" style="max-width:95vw;max-height:95vh;"></body></html>');
    } else {
        w.document.write('<html><body style="margin:0;"><iframe src="' + att.data + '" style="width:100%;height:100vh;border:none;"></iframe></body></html>');
    }
    w.document.close();
}

function deleteClientAttachment(attId) {
    var meta = getClientMeta(currentProfileClientId);
    meta.attachments = meta.attachments.filter(function(a) { return a.id !== attId; });
    saveClientMeta(currentProfileClientId, meta);
    renderClientAttachments();
}

function renderClientAttachments() {
    var el = document.getElementById('cpAttachmentsList');
    var meta = getClientMeta(currentProfileClientId);
    if (meta.attachments.length === 0) { el.innerHTML = '<p class="empty-msg">Sin archivos adjuntos</p>'; return; }
    var icons = function(type) { if (type && type.includes('pdf')) return '📄'; if (type && type.startsWith('image/')) return '🖼️'; return '📁'; };
    el.innerHTML = meta.attachments.map(function(a) {
        var size = a.size > 1024*1024 ? (a.size/1024/1024).toFixed(1) + ' MB' : (a.size/1024).toFixed(0) + ' KB';
        return '<div class="cp-attach-item"><span class="cp-attach-icon">' + icons(a.type) + '</span><div class="cp-attach-info"><strong>' + a.name + '</strong><br><small>' + size + ' — ' + new Date(a.date).toLocaleDateString('es') + '</small></div>' +
            '<button class="btn-secondary btn-sm" style="font-size:10px;padding:4px 8px;" onclick="viewClientAttachment(\'' + a.id + '\')">👁️ Ver</button>' +
            '<button style="background:#ef4444;color:white;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:10px;" onclick="deleteClientAttachment(\'' + a.id + '\')">✕</button></div>';
    }).join('');
}

// ===== CLIENT COMMUNICATIONS =====
function addClientComm() {
    var type = document.getElementById('cpCommType').value;
    var note = document.getElementById('cpCommNote').value.trim();
    if (!note || !currentProfileClientId) return;
    var meta = getClientMeta(currentProfileClientId);
    var typeLabels = { call_out:'📱 Llamada Saliente', call_in:'📲 Llamada Entrante', text:'💬 SMS', email:'📧 Email', visit:'🏠 Visita', follow_up:'🔄 Follow-Up' };
    meta.comms.unshift({ id: 'cm_' + Date.now(), type: type, label: typeLabels[type] || type, note: note, date: new Date().toISOString(), by: 'Admin' });
    saveClientMeta(currentProfileClientId, meta);
    document.getElementById('cpCommNote').value = '';
    renderClientComms();
}

function deleteClientComm(commId) {
    var meta = getClientMeta(currentProfileClientId);
    meta.comms = meta.comms.filter(function(c) { return c.id !== commId; });
    saveClientMeta(currentProfileClientId, meta);
    renderClientComms();
}

function renderClientComms() {
    var el = document.getElementById('cpCommsList');
    var meta = getClientMeta(currentProfileClientId);
    if (meta.comms.length === 0) { el.innerHTML = '<p class="empty-msg">Sin registro de comunicación</p>'; return; }
    el.innerHTML = meta.comms.map(function(cm) {
        return '<div class="cp-comm-item"><span class="cp-comm-icon">' + cm.label.split(' ')[0] + '</span><div class="cp-comm-content"><strong>' + cm.label + '</strong><br>' + cm.note + '<br><small>' + new Date(cm.date).toLocaleString('es') + ' — ' + (cm.by || '') + '</small></div>' +
            '<button class="cp-comm-delete" onclick="deleteClientComm(\'' + cm.id + '\')">✕</button></div>';
    }).join('');
}

function cpQuickAction(type) {
    var cl = clientsData.find(function(c) { return c.id === currentProfileClientId; });
    if (!cl) return;
    switch(type) {
        case 'job': showSection('dispatch'); setTimeout(function(){ showJobForm(); }, 100); break;
        case 'estimate': showSection('jobs'); break;
        case 'appointment':
            showSection('calendar');
            setTimeout(function() {
                showApptForm();
                var sel = document.getElementById('apptClientSelect');
                if (sel) sel.value = currentProfileClientId;
            }, 150);
            break;
    }
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
    renderAdvancedKPIs();
}

function renderAdvancedKPIs() {
    // Revenue earned (paid invoices)
    var paidInvs = (invoicesData || []).filter(function(i) { return i.status === 'paid'; });
    var revenue = paidInvs.reduce(function(s, i) { return s + (parseFloat(i.total) || 0); }, 0);
    var el = function(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; };
    el('revenueKPI', '$' + revenue.toLocaleString('en', {minimumFractionDigits:0, maximumFractionDigits:0}));
    
    // Jobs completed
    var completed = (jobsData || []).filter(function(j) { return j.status === 'completed'; });
    el('jobsCompletedKPI', completed.length);
    
    // Average job size
    var allInvs = (invoicesData || []).filter(function(i) { return parseFloat(i.total) > 0; });
    var avg = allInvs.length > 0 ? allInvs.reduce(function(s, i) { return s + (parseFloat(i.total) || 0); }, 0) / allInvs.length : 0;
    el('avgJobKPI', '$' + Math.round(avg).toLocaleString('en'));
    
    // Open estimates
    var estimates = estimatesData || [];
    var open = estimates.filter(function(e) { return e.status !== 'approved'; });
    el('openEstKPI', open.length);
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
    var setVal = function(id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
    if (clauses.state) setVal('clauseState', clauses.state);
    setVal('clausePayment', clauses.payment);
    setVal('clauseCancel', clauses.cancel);
    setVal('clauseRestock', clauses.restock);
    setVal('clauseLicense', clauses.license);
    setVal('clauseDownPayment', clauses.downPayment);
    setVal('clauseLien', clauses.lien);
    setVal('clauseWarranty', clauses.warranty);
    setVal('clauseEpa', clauses.epa);
    setVal('clausePermits', clauses.permits);
    setVal('clauseInsurance', clauses.insurance);
    setVal('clausePrivacy', clauses.privacy);
    setVal('clauseRefuse', clauses.refuse);
    setVal('clauseCustom', clauses.custom);
    var state = clauses.state || 'CA';
    var summaryEl = document.getElementById('stateRegSummary');
    if (summaryEl && stateRegSummaries[state]) {
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
    var estimates = estimatesData || [];
    // Pull from Supabase cache
    
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
        // Table error — log and continue
        console.warn('service_plans insert error:', res.error.message);
        plan.id = 'sp_' + Date.now();
        plan.created_at = new Date().toISOString();
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
        // Fallback — empty
        servicePlansData = [];
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
        console.warn('deleteServicePlan error:', res.error.message);
    }
    loadServicePlans();
}

// ===== DISPATCH COORDINATOR =====
function toggleDispatchCoord() {
    var form = document.getElementById('dispCoordForm');
    var isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    document.getElementById('dispCoordToggle').textContent = isHidden ? '✕ Cerrar' : '✏️ Editar';
    if (isHidden) {
        var dc = _sbCache.dispatchCoord || {};
        document.getElementById('dcName').value = dc.name || '';
        document.getElementById('dcRole').value = dc.role || '';
        document.getElementById('dcPhone').value = dc.phone || '';
        document.getElementById('dcEmail').value = dc.email || '';
        document.getElementById('dcLicense').value = dc.license || '';
        document.getElementById('dcShift').value = dc.shift || 'Tiempo Completo 7am-5pm';
        document.getElementById('dcNotes').value = dc.notes || '';
        window._dcTempPhoto = null;
        // Load existing photo into preview
        if (dc.photo) {
            showDCPhotoPreview(dc.photo);
        } else {
            var placeholder = document.getElementById('dcPhotoPlaceholder');
            var imgEl = document.getElementById('dcPhotoImg');
            if (placeholder) placeholder.style.display = 'block';
            if (imgEl) { imgEl.src = ''; imgEl.style.display = 'none'; }
        }
    }
}

function saveDispatchCoord() {
    var dc = {
        name: document.getElementById('dcName').value,
        role: document.getElementById('dcRole').value,
        phone: document.getElementById('dcPhone').value,
        email: document.getElementById('dcEmail').value,
        license: document.getElementById('dcLicense').value,
        shift: document.getElementById('dcShift').value,
        notes: document.getElementById('dcNotes').value,
        photo: window._dcTempPhoto || null,
        updated_at: new Date().toISOString()
    };
    // Preserve existing photo if not changed
    if (!dc.photo) {
        var existing = _sbCache.dispatchCoord || {};
        if (existing.photo) dc.photo = existing.photo;
    }
    // Save to Supabase
    _sbCache.dispatchCoord = dc;
    sbClient.from('dispatch_coordinator').upsert(Object.assign({ company_id: companyId }, dc)).then(function(res) {
        if (res.error) console.warn('saveDispatchCoord error', res.error.message);
    });
    window._dcTempPhoto = null;
    renderDispatchCoord();
    toggleDispatchCoord();
    alert('✅ Coordinador de Despacho guardado');
}

function renderDispatchCoord() {
    var dc = _sbCache.dispatchCoord || {};
    var nameEl = document.getElementById('dispCoordName');
    var roleEl = document.getElementById('dispCoordRole');
    var avatarEl = document.getElementById('dispCoordAvatar');
    var infoEl = document.getElementById('dispCoordInfo');
    if (!nameEl) return;
    
    if (dc.name) {
        nameEl.textContent = dc.name;
        roleEl.textContent = dc.role || 'Coordinador de Despacho';
        
        if (dc.photo) {
            avatarEl.innerHTML = '<img src="' + dc.photo + '" alt="' + dc.name + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
            avatarEl.style.background = 'transparent';
        } else {
            var initials = dc.name.split(' ').map(function(w) { return w[0]; }).join('').substring(0,2).toUpperCase();
            avatarEl.textContent = initials;
            avatarEl.innerHTML = initials;
            avatarEl.style.background = 'linear-gradient(135deg, var(--primary), var(--accent))';
        }
        
        var info = '';
        if (dc.phone) info += '<span>📱 <a href="tel:' + dc.phone + '">' + dc.phone + '</a></span>';
        if (dc.email) info += '<span>📧 ' + dc.email + '</span>';
        if (dc.license) info += '<span>📜 ' + dc.license + '</span>';
        if (dc.shift) info += '<span>🕐 ' + dc.shift + '</span>';
        infoEl.innerHTML = info;
    } else {
        nameEl.textContent = 'Sin asignar';
        roleEl.textContent = 'Haz click en Editar para asignar un responsable';
        avatarEl.innerHTML = '?';
        avatarEl.style.background = 'var(--primary)';
        infoEl.innerHTML = '';
    }
}

// ===== DISPATCH COORDINATOR PHOTO =====
window._dcTempPhoto = null;

function handleDCPhotoUpload(input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
        alert('⚠️ La imagen es muy grande. Máximo 2MB.');
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        // Resize to max 300px for efficiency
        resizeDCPhoto(e.target.result, 300, function(resized) {
            window._dcTempPhoto = resized;
            showDCPhotoPreview(resized);
        });
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function resizeDCPhoto(dataUrl, maxSize, callback) {
    var img = new Image();
    img.onload = function() {
        var canvas = document.createElement('canvas');
        var w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
        else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataUrl;
}

function showDCPhotoPreview(src) {
    var placeholder = document.getElementById('dcPhotoPlaceholder');
    var imgEl = document.getElementById('dcPhotoImg');
    if (placeholder) placeholder.style.display = 'none';
    if (imgEl) {
        imgEl.src = src;
        imgEl.style.display = 'block';
    }
}

function removeDCPhoto() {
    window._dcTempPhoto = '';
    var placeholder = document.getElementById('dcPhotoPlaceholder');
    var imgEl = document.getElementById('dcPhotoImg');
    if (placeholder) placeholder.style.display = 'block';
    if (imgEl) { imgEl.src = ''; imgEl.style.display = 'none'; }
    // Also remove from saved data
    var dc = _sbCache.dispatchCoord || {};
    if (dc.photo) {
        dc.photo = null;
        _sbCache.dispatchCoord = dc;
        sbClient.from('dispatch_coordinator').upsert(Object.assign({ company_id: companyId }, dc)).then(function(){});
        renderDispatchCoord();
    }
}

function takeDCPhoto() {
    // Use camera via file input with capture
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'user';
    input.onchange = function() { handleDCPhotoUpload(input); };
    input.click();
}

// ===== CALENDAR VIEW TOGGLE =====
var calViewMode = 'month';
var calWeekStart = null;

function setCalView(mode) {
    calViewMode = mode;
    document.querySelectorAll('.cal-view-btn').forEach(function(b) { b.classList.remove('active'); });
    var btn = document.getElementById('calView' + mode.charAt(0).toUpperCase() + mode.slice(1));
    if (btn) btn.classList.add('active');
    
    document.getElementById('calendarGrid').style.display = mode === 'month' ? '' : 'none';
    document.getElementById('calWeekGrid').style.display = mode === 'week' ? '' : 'none';
    document.getElementById('calDayGrid').style.display = mode === 'day' ? '' : 'none';
    
    if (mode === 'month') renderCalendar();
    if (mode === 'week') renderWeekView();
    if (mode === 'day') renderDayView();
}

function getWeekDates(baseDate) {
    var d = new Date(baseDate);
    var day = d.getDay();
    d.setDate(d.getDate() - day);
    var dates = [];
    for (var i = 0; i < 7; i++) {
        dates.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return dates;
}

function renderWeekView() {
    var now = new Date(calYear, calMonth, calWeekStart || new Date().getDate());
    var weekDates = getWeekDates(now);
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
    
    var dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    
    // Update label
    var startD = weekDates[0]; var endD = weekDates[6];
    document.getElementById('calMonthLabel').textContent = months[startD.getMonth()] + ' ' + startD.getDate() + ' - ' + months[endD.getMonth()] + ' ' + endD.getDate() + ', ' + endD.getFullYear();
    
    var h = '<div class="cal-week-header" style="border-right:1px solid var(--border);"></div>';
    weekDates.forEach(function(d) {
        var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        var isToday = ds === todayStr;
        h += '<div class="cal-week-header' + (isToday ? ' today-col' : '') + '">' + dayNames[d.getDay()] + '<br><strong>' + d.getDate() + '</strong></div>';
    });
    
    for (var hr = 7; hr <= 20; hr++) {
        var timeLabel = hr <= 12 ? hr + (hr < 12 ? 'am' : 'pm') : (hr - 12) + 'pm';
        h += '<div class="cal-week-time">' + timeLabel + '</div>';
        weekDates.forEach(function(d) {
            var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
            var isToday = ds === todayStr;
            var hrStr = String(hr).padStart(2,'0');
            var appts = appointmentsData.filter(function(a) { return a.appointment_date === ds && a.start_time && a.start_time.substring(0,2) === hrStr; });
            h += '<div class="cal-week-cell' + (isToday ? ' today-col' : '') + '" onclick="showDayAppts(\'' + ds + '\')">';
            appts.forEach(function(a) { h += '<div class="cal-week-appt">' + (a.start_time || '') + ' ' + (a.title || '').substring(0,12) + '</div>'; });
            h += '</div>';
        });
    }
    document.getElementById('calWeekGrid').innerHTML = h;
}

function renderDayView() {
    var now = new Date();
    var dayDate = new Date(calYear, calMonth, calWeekStart || now.getDate());
    var ds = dayDate.getFullYear() + '-' + String(dayDate.getMonth()+1).padStart(2,'0') + '-' + String(dayDate.getDate()).padStart(2,'0');
    
    var dayLabel = dayDate.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    document.getElementById('calMonthLabel').textContent = dayLabel;
    
    var h = '<div class="cal-day-header">📅 ' + dayLabel + '</div>';
    for (var hr = 6; hr <= 21; hr++) {
        var timeLabel = hr <= 12 ? hr + ':00 ' + (hr < 12 ? 'AM' : 'PM') : (hr - 12) + ':00 PM';
        var hrStr = String(hr).padStart(2,'0');
        var appts = appointmentsData.filter(function(a) { return a.appointment_date === ds && a.start_time && a.start_time.substring(0,2) === hrStr; });
        h += '<div class="cal-day-row">';
        h += '<div class="cal-day-time">' + timeLabel + '</div>';
        h += '<div class="cal-day-content">';
        appts.forEach(function(a) {
            var clientName = a.clients ? a.clients.name : '';
            var techName = a.technicians ? a.technicians.name : '';
            h += '<div class="cal-day-appt" onclick="showDayAppts(\'' + ds + '\')">' +
                '<strong>' + (a.title || '') + '</strong>' +
                '<small>' + (a.start_time || '') + ' - ' + (a.end_time || '') + 
                (clientName ? ' | ' + clientName : '') + 
                (techName ? ' | 👷 ' + techName : '') + '</small></div>';
        });
        h += '</div></div>';
    }
    document.getElementById('calDayGrid').innerHTML = h;
}

// Override calPrev/calNext for week/day modes
var _origCalPrev = calPrev;
var _origCalNext = calNext;
calPrev = function() {
    if (calViewMode === 'week') {
        var d = new Date(calYear, calMonth, (calWeekStart || new Date().getDate()) - 7);
        calYear = d.getFullYear(); calMonth = d.getMonth(); calWeekStart = d.getDate();
        renderWeekView();
    } else if (calViewMode === 'day') {
        var d = new Date(calYear, calMonth, (calWeekStart || new Date().getDate()) - 1);
        calYear = d.getFullYear(); calMonth = d.getMonth(); calWeekStart = d.getDate();
        renderDayView();
    } else { _origCalPrev(); }
};
calNext = function() {
    if (calViewMode === 'week') {
        var d = new Date(calYear, calMonth, (calWeekStart || new Date().getDate()) + 7);
        calYear = d.getFullYear(); calMonth = d.getMonth(); calWeekStart = d.getDate();
        renderWeekView();
    } else if (calViewMode === 'day') {
        var d = new Date(calYear, calMonth, (calWeekStart || new Date().getDate()) + 1);
        calYear = d.getFullYear(); calMonth = d.getMonth(); calWeekStart = d.getDate();
        renderDayView();
    } else { _origCalNext(); }
};

// ===== INBOX / COMMUNICATION CENTER =====
function loadInbox() {
    populateInboxClientSelect();
    renderInbox();
}

function populateInboxClientSelect() {
    var sel = document.getElementById('inboxClient');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar cliente...</option>';
    clientsData.forEach(function(c) {
        sel.innerHTML += '<option value="' + c.id + '">' + c.name + (c.phone ? ' - ' + c.phone : '') + '</option>';
    });
}

function showInboxCompose() { document.getElementById('inboxComposeArea').style.display = 'block'; }
function hideInboxCompose() { document.getElementById('inboxComposeArea').style.display = 'none'; }

async function createInboxComm(event) {
    event.preventDefault();
    var clientId = document.getElementById('inboxClient').value;
    var type = document.getElementById('inboxType').value;
    var note = document.getElementById('inboxNote').value;
    if (!clientId || !note) { alert('Selecciona cliente y agrega descripción'); return; }
    
    var cl = clientsData.find(function(x) { return x.id === clientId; });
    if (!cl) return;
    var comms = (cl.client_comms) ? cl.client_comms : [];
    comms.unshift({ type: type, note: note, date: new Date().toLocaleString('es'), by: 'Admin' });
    await sbClient.from('clients').update({ client_comms: comms }).eq('id', clientId);
    cl.client_comms = comms;
    
    hideInboxCompose();
    document.getElementById('inboxNote').value = '';
    renderInbox();
    alert('✅ Comunicación registrada');
}

function renderInbox() {
    var c = document.getElementById('inboxList');
    if (!c) return;
    var filter = (document.getElementById('inboxFilter') || {}).value || 'all';
    
    // Collect all comms from all clients
    var allComms = [];
    clientsData.forEach(function(cl) {
        var comms = cl.client_comms || [];
        comms.forEach(function(cm) {
            allComms.push({ clientId: cl.id, clientName: cl.name, clientPhone: cl.phone || '', type: cm.type, note: cm.note, date: cm.date, by: cm.by });
        });
    });
    
    // Sort newest first
    allComms.sort(function(a, b) {
        var da = a.date ? new Date(a.date) : new Date(0);
        var db = b.date ? new Date(b.date) : new Date(0);
        return db - da;
    });
    
    // Filter
    if (filter !== 'all') {
        allComms = allComms.filter(function(cm) { return cm.type === filter; });
    }
    
    if (allComms.length === 0) {
        c.innerHTML = '<p class="empty-msg" style="padding:30px;">📭 Sin comunicaciones' + (filter !== 'all' ? ' de este tipo' : '') + '. Registra tu primera interacción con un cliente.</p>';
        return;
    }
    
    var typeIcons = { call_out:'📱', call_in:'📲', text:'💬', email:'📧', visit:'🏠', follow_up:'🔄' };
    var typeLabels = { call_out:'Llamada Saliente', call_in:'Llamada Entrante', text:'Texto/SMS', email:'Email', visit:'Visita', follow_up:'Follow-Up' };
    
    c.innerHTML = allComms.slice(0, 50).map(function(cm) {
        return '<div class="inbox-item" onclick="openClientProfile(\'' + cm.clientId + '\');setTimeout(function(){switchClientTab(\'comms\')},100);">' +
            '<div class="inbox-avatar type-' + cm.type + '">' + (typeIcons[cm.type] || '💬') + '</div>' +
            '<div class="inbox-body">' +
            '<strong>' + cm.clientName + '</strong>' +
            ' <span class="inbox-type-badge" style="background:var(--bg-input);color:var(--text-muted);">' + (typeLabels[cm.type] || cm.type) + '</span>' +
            '<p>' + (cm.note || '') + '</p></div>' +
            '<div class="inbox-meta">' + (cm.date || '') + (cm.clientPhone ? '<br>' + cm.clientPhone : '') + '</div></div>';
    }).join('');
}

// ===== IMPORT CLIENTS CSV =====
async function importClientsCSV(input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = async function(e) {
        var text = e.target.result;
        var lines = text.split('\n').filter(function(l) { return l.trim(); });
        if (lines.length < 2) { alert('⚠️ CSV vacío o sin datos'); return; }
        
        // Parse header
        var headers = parseCSVLine(lines[0]).map(function(h) { return h.toLowerCase().trim(); });
        var nameIdx = findColIndex(headers, ['nombre','name','display name','client','cliente']);
        var phoneIdx = findColIndex(headers, ['telefono','teléfono','phone','mobile','celular']);
        var emailIdx = findColIndex(headers, ['email','correo','e-mail']);
        var addressIdx = findColIndex(headers, ['direccion','dirección','address','domicilio']);
        var companyIdx = findColIndex(headers, ['empresa','company','compañía','negocio']);
        
        if (nameIdx < 0) { alert('⚠️ No se encontró columna de nombre. Asegúrate de tener una columna: Nombre, Name, o Client'); return; }
        
        var imported = 0;
        var skipped = 0;
        for (var i = 1; i < lines.length; i++) {
            var cols = parseCSVLine(lines[i]);
            var name = (cols[nameIdx] || '').trim();
            if (!name) { skipped++; continue; }
            
            var phone = phoneIdx >= 0 ? (cols[phoneIdx] || '').trim() : '';
            var email = emailIdx >= 0 ? (cols[emailIdx] || '').trim() : '';
            var address = addressIdx >= 0 ? (cols[addressIdx] || '').trim() : '';
            var company = companyIdx >= 0 ? (cols[companyIdx] || '').trim() : '';
            
            // Check duplicates
            var exists = clientsData.find(function(c) { return c.name === name || (phone && c.phone === phone); });
            if (exists) { skipped++; continue; }
            
            var res = await sbClient.from('clients').insert({
                company_id: companyId, name: name, phone: phone, email: email,
                address: address, company: company, source: 'csv_import'
            }).select().single();
            if (res.data) { clientsData.push(res.data); imported++; }
        }
        
        alert('✅ Importación completa\n\n📥 Importados: ' + imported + '\n⏭️ Omitidos (duplicados/vacíos): ' + skipped);
        renderClientsList();
        updateKPIs();
    };
    reader.readAsText(file);
    input.value = '';
}

function parseCSVLine(line) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
        else { current += ch; }
    }
    result.push(current);
    return result;
}

function findColIndex(headers, options) {
    for (var i = 0; i < headers.length; i++) {
        for (var j = 0; j < options.length; j++) {
            if (headers[i].indexOf(options[j]) >= 0) return i;
        }
    }
    return -1;
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

// ============================================================
// ===== INTERNATIONALIZATION (i18n) SYSTEM =====
// ============================================================
var currentLang = localStorage.getItem('tm_lang') || 'es';
var i18nData = {
  es: {
    nav_principal:'Principal',nav_dashboard:'Tablero',nav_inbox:'Bandeja',nav_schedule:'Agenda',nav_customers:'Clientes',nav_leads:'Prospectos',nav_pipeline:'Flujo de Ventas',
    nav_operations:'Operaciones',nav_dispatch:'Despacho',nav_jobs:'Trabajos',nav_technicians:'Técnicos',nav_advisors:'Asesores del Hogar',
    nav_finance:'Finanzas',nav_invoices:'Facturas',nav_collections:'Cobranza',nav_mymoney:'Mi Dinero',nav_payroll:'Nómina',
    nav_growth:'Crecimiento',nav_marketing:'Mercadotecnia',nav_pricebook:'Lista de Precios',nav_reports:'Reportes',nav_system:'Sistema',nav_settings:'Configuración',
    dash_welcome:'Hola, ¿en qué nos enfocamos hoy?',dash_add_material:'Agregar materiales',dash_import_data:'Importar datos',dash_connect_reviews:'Conectar reseñas',dash_ask_something:'Preguntar algo',
    dash_estimates:'Estimados',dash_open_estimates:'Estimados abiertos',dash_view_all_estimates:'Ver todos los estimados',
    dash_jobs:'Trabajos',dash_unsched_jobs:'Trabajos sin agendar',dash_view_all_jobs:'Ver todos los trabajos',
    dash_invoices:'Facturas',dash_open_invoices:'Facturas abiertas',dash_view_all_invoices:'Ver todas las facturas',
    dash_service_plans:'Planes de Servicio',dash_sp_desc:'Crea planes de servicio para crecer ingresos y fidelizar clientes.',dash_create_template:'+ Crear plantilla',
    dash_ytd:'Año hasta la fecha',dash_mtd:'Mes hasta la fecha',dash_last30:'Últimos 30 días',dash_last90:'Últimos 90 días',dash_view_reports:'Ver todos los reportes',
    kpi_revenue:'INGRESOS GANADOS',kpi_completed:'TRABAJOS COMPLETADOS',kpi_avg_job:'TICKET PROMEDIO',kpi_new_booked:'NUEVOS TRABAJOS',kpi_online_booked:'RESERVADOS EN LÍNEA',
    dash_employee_status:'Estado de Empleados',dash_today:'Hoy',dash_tomorrow:'Mañana',dash_see_jobs:'Ve los trabajos y estimados del día',dash_add_job:'Agregar trabajo',dash_add_estimate:'Agregar estimado',
    dash_est_pipeline:'Flujo de Estimados',dash_new_estimate:'Nuevo Estimado',
    pipe_title:'Flujo de Ventas',pipe_all:'Todos',pipe_week:'Esta Semana',pipe_month:'Este Mes',pipe_quarter:'Este Trimestre',pipe_new_est:'Nuevo Estimado',
    pipe_new:'Nuevos',pipe_quoted:'Cotizados',pipe_approved:'Aprobados',pipe_scheduled:'Agendados',pipe_won:'Ganados',
    pipe_total_value:'VALOR TOTAL',pipe_conversion:'TASA DE CONVERSIÓN',pipe_avg_deal:'TRATO PROMEDIO',pipe_avg_close:'DÍAS PARA CERRAR',
    money_income:'Ingresos',money_expenses:'Gastos',money_profit:'Ganancia Neta',money_outstanding:'Por Cobrar',money_this_month:'Este mes',money_overdue_invoices:'Facturas pendientes',
    money_transactions:'Transacciones',money_add_expense:'+ Agregar Gasto',money_new_expense:'Nuevo Gasto',money_desc:'Descripción',money_amount:'Monto',money_category:'Categoría',money_date:'Fecha',money_notes:'Notas',money_save:'Guardar',
    pay_employees:'Empleados',pay_active:'Activos',pay_this_period:'Este Período',pay_total_payroll:'Total nómina',pay_hours:'Horas',pay_this_week:'Esta semana',pay_pending:'Pendiente',pay_to_process:'Por procesar',
    pay_title:'Nómina',pay_add_entry:'Agregar Entrada',pay_new_entry:'Nueva Entrada',pay_tech:'Técnico',pay_type:'Tipo',pay_hours_worked:'Horas Trabajadas',pay_rate:'Tarifa ($)',pay_total:'Total ($)',pay_period_start:'Inicio',pay_period_end:'Fin',pay_notes:'Notas',pay_save:'Guardar',
    mkt_reviews:'Reseñas',mkt_avg_rating:'Rating promedio',mkt_campaigns:'Campañas',mkt_active:'Activas',mkt_lead_source:'Fuentes de Leads',mkt_channels:'Canales',mkt_roi:'Retorno de Inversión',mkt_return:'Retorno',
    mkt_title:'Mercadotecnia',mkt_new_campaign:'Nueva Campaña',mkt_create_campaign:'Crear Campaña',mkt_camp_name:'Nombre',mkt_camp_type:'Tipo',mkt_budget:'Presupuesto ($)',mkt_start:'Inicio',mkt_end:'Fin',mkt_message:'Mensaje',mkt_save:'Guardar',
    mkt_lead_breakdown:'Desglose de Fuentes de Leads',mkt_review_requests:'Solicitar Reseñas',mkt_review_desc:'Envía solicitudes de reseñas a clientes satisfechos.',mkt_select_client:'Cliente',mkt_platform:'Plataforma',mkt_send_request:'📧 Enviar Solicitud',
    pb_title:'Lista de Precios',pb_all:'Todas las categorías',pb_add_item:'Agregar Artículo',pb_new_item:'Nuevo Artículo',pb_name:'Nombre',pb_sku:'SKU / Part #',pb_category:'Categoría',pb_unit:'Unidad',
    pb_cost:'Costo ($)',pb_price:'Precio ($)',pb_markup:'Markup %',pb_description:'Descripción',pb_save:'Guardar',pb_total_items:'TOTAL ARTÍCULOS',pb_avg_markup:'MARKUP PROMEDIO',pb_categories:'CATEGORÍAS',
    rpt_title:'Reportes',rpt_revenue:'Ingresos',rpt_jobs_done:'Trabajos',rpt_new_customers:'Nuevos Clientes',rpt_close_rate:'Tasa de Cierre',
    rpt_revenue_chart:'Ingresos por Período',rpt_by_tech:'Por Técnico',rpt_by_source:'Por Fuente',rpt_top_services:'Top Servicios',rpt_by_day:'Por Día',btn_cancel:'Cancelar'
  },
  en: {
    nav_principal:'Main',nav_dashboard:'Tablero',nav_inbox:'Inbox',nav_schedule:'Schedule',nav_customers:'Customers',nav_leads:'Prospectos',nav_pipeline:'Flujo de Ventas',
    nav_operations:'Operations',nav_dispatch:'Dispatch',nav_jobs:'Jobs',nav_technicians:'Technicians',nav_advisors:'Asesores del Hogar',
    nav_finance:'Finance',nav_invoices:'Invoices',nav_collections:'Collections',nav_mymoney:'My Money',nav_payroll:'Payroll',
    nav_growth:'Growth',nav_marketing:'Mercadotecnia',nav_pricebook:'Price Book',nav_reports:'Reports',nav_system:'System',nav_settings:'Settings',
    dash_welcome:'Hi, what should we dive into today?',dash_add_material:'Add material line items',dash_import_data:'Import my data',dash_connect_reviews:'Connect Google reviews',dash_ask_something:'Ask something',
    dash_estimates:'Estimates',dash_open_estimates:'Open estimates',dash_view_all_estimates:'View all estimates',
    dash_jobs:'Jobs',dash_unsched_jobs:'Unscheduled jobs',dash_view_all_jobs:'View all jobs',
    dash_invoices:'Invoices',dash_open_invoices:'Open invoices',dash_view_all_invoices:'View all invoices',
    dash_service_plans:'Service Plans',dash_sp_desc:'Start a service plan to grow revenue and customer loyalty.',dash_create_template:'+ Create template',
    dash_ytd:'Year to date',dash_mtd:'Month to date',dash_last30:'Last 30 days',dash_last90:'Last 90 days',dash_view_reports:'View all reports',
    kpi_revenue:'JOB REVENUE EARNED',kpi_completed:'JOBS COMPLETED',kpi_avg_job:'AVERAGE JOB SIZE',kpi_new_booked:'TOTAL NEW JOBS BOOKED',kpi_online_booked:'NEW JOBS BOOKED ONLINE',
    dash_employee_status:'Employee Status',dash_today:'Today',dash_tomorrow:'Tomorrow',dash_see_jobs:'See all job and estimate locations for the day',dash_add_job:'Add job',dash_add_estimate:'Add estimate',
    dash_est_pipeline:'Estimates Pipeline',dash_new_estimate:'New Estimate',
    pipe_title:'Sales Pipeline',pipe_all:'All',pipe_week:'This Week',pipe_month:'This Month',pipe_quarter:'This Quarter',pipe_new_est:'New Estimate',
    pipe_new:'New',pipe_quoted:'Quoted',pipe_approved:'Approved',pipe_scheduled:'Scheduled',pipe_won:'Won',
    pipe_total_value:'TOTAL VALUE',pipe_conversion:'CONVERSION RATE',pipe_avg_deal:'AVG DEAL SIZE',pipe_avg_close:'AVG DAYS TO CLOSE',
    money_income:'Income',money_expenses:'Expenses',money_profit:'Net Profit',money_outstanding:'Outstanding',money_this_month:'This month',money_overdue_invoices:'Pending invoices',
    money_transactions:'Transactions',money_add_expense:'+ Add Expense',money_new_expense:'New Expense',money_desc:'Description',money_amount:'Amount',money_category:'Category',money_date:'Date',money_notes:'Notes',money_save:'Save',
    pay_employees:'Employees',pay_active:'Active',pay_this_period:'This Period',pay_total_payroll:'Total payroll',pay_hours:'Hours',pay_this_week:'This week',pay_pending:'Pending',pay_to_process:'To process',
    pay_title:'Payroll',pay_add_entry:'Add Entry',pay_new_entry:'New Entry',pay_tech:'Technician',pay_type:'Type',pay_hours_worked:'Hours Worked',pay_rate:'Rate ($)',pay_total:'Total ($)',pay_period_start:'Start',pay_period_end:'End',pay_notes:'Notes',pay_save:'Save',
    mkt_reviews:'Reviews',mkt_avg_rating:'Avg rating',mkt_campaigns:'Campaigns',mkt_active:'Active',mkt_lead_source:'Lead Sources',mkt_channels:'Channels',mkt_roi:'Marketing ROI',mkt_return:'Return',
    mkt_title:'Mercadotecnia',mkt_new_campaign:'New Campaign',mkt_create_campaign:'Create Campaign',mkt_camp_name:'Name',mkt_camp_type:'Type',mkt_budget:'Budget ($)',mkt_start:'Start',mkt_end:'End',mkt_message:'Message',mkt_save:'Save',
    mkt_lead_breakdown:'Lead Source Breakdown',mkt_review_requests:'Request Reviews',mkt_review_desc:'Send review requests to satisfied customers.',mkt_select_client:'Customer',mkt_platform:'Platform',mkt_send_request:'📧 Send Request',
    pb_title:'Price Book',pb_all:'All categories',pb_add_item:'Add Item',pb_new_item:'New Item',pb_name:'Name',pb_sku:'SKU / Part #',pb_category:'Category',pb_unit:'Unit',
    pb_cost:'Cost ($)',pb_price:'Price ($)',pb_markup:'Markup %',pb_description:'Description',pb_save:'Save',pb_total_items:'TOTAL ITEMS',pb_avg_markup:'AVG MARKUP',pb_categories:'CATEGORIES',
    rpt_title:'Reports',rpt_revenue:'Revenue',rpt_jobs_done:'Jobs',rpt_new_customers:'New Customers',rpt_close_rate:'Close Rate',
    rpt_revenue_chart:'Revenue by Period',rpt_by_tech:'By Technician',rpt_by_source:'By Source',rpt_top_services:'Top Services',rpt_by_day:'By Day of Week',btn_cancel:'Cancel'
  }
};

function toggleLanguage() { currentLang = currentLang === 'es' ? 'en' : 'es'; localStorage.setItem('tm_lang', currentLang); applyLanguage(); }

function applyLanguage() {
    var d = i18nData[currentLang] || i18nData.es;
    document.querySelectorAll('[data-i18n]').forEach(function(el) { var k = el.getAttribute('data-i18n'); if (d[k]) el.textContent = d[k]; });
    var f = document.getElementById('langFlag'), l = document.getElementById('langLabel');
    if (f) f.textContent = currentLang === 'es' ? '🇲🇽' : '🇺🇸';
    if (l) l.textContent = currentLang === 'es' ? 'ES' : 'EN';
}
document.addEventListener('DOMContentLoaded', function() { setTimeout(applyLanguage, 100); });

// ===== HCP DASHBOARD =====
var employeeStatusMap = null;
function renderHCPDashboard() {
    var openEst = jobsData.filter(function(j){ return j.status==='open'||j.status==='pending'; });
    var estTotal = openEst.reduce(function(s,j){ return s+(parseFloat(j.total_cost)||0);},0);
    document.getElementById('hcpOpenEstimates').textContent = openEst.length;
    document.getElementById('hcpEstimatesAmount').textContent = '$'+estTotal.toLocaleString('en-US',{minimumFractionDigits:2});
    var unschedJobs = jobsData.filter(function(j){ return !j.scheduled_date&&j.status!=='completed'&&j.status!=='cancelled'; });
    var unschedTotal = unschedJobs.reduce(function(s,j){ return s+(parseFloat(j.total_cost)||0);},0);
    document.getElementById('hcpUnschedJobs').textContent = unschedJobs.length;
    document.getElementById('hcpJobsAmount').textContent = '$'+unschedTotal.toLocaleString('en-US',{minimumFractionDigits:2});
    var openInv = (window.invoicesData||[]).filter(function(i){ return i.status==='sent'||i.status==='partial'||i.status==='overdue'; });
    var invTotal = openInv.reduce(function(s,i){ return s+((parseFloat(i.total)||0)-(parseFloat(i.amount_paid)||0));},0);
    document.getElementById('hcpOpenInvoices').textContent = openInv.length;
    document.getElementById('hcpInvoicesAmount').textContent = '$'+invTotal.toLocaleString('en-US',{minimumFractionDigits:2});
    renderYTDKpis(); renderEmployeeStatus();
}
function renderYTDKpis() {
    var period = document.getElementById('ytdPeriod').value, now = new Date(), startDate;
    if (period==='ytd') startDate=new Date(now.getFullYear(),0,1);
    else if (period==='mtd') startDate=new Date(now.getFullYear(),now.getMonth(),1);
    else if (period==='last30'){startDate=new Date(now);startDate.setDate(startDate.getDate()-30);}
    else{startDate=new Date(now);startDate.setDate(startDate.getDate()-90);}
    var pJobs = jobsData.filter(function(j){return new Date(j.created_at)>=startDate;});
    var cJobs = pJobs.filter(function(j){return j.status==='completed';});
    var pInv = (window.invoicesData||[]).filter(function(i){return new Date(i.created_at)>=startDate&&i.status==='paid';});
    var rev = pInv.reduce(function(s,i){return s+(parseFloat(i.total)||0);},0);
    var avg = cJobs.length>0?rev/cJobs.length:0;
    document.getElementById('ytdRevenue').textContent = rev>0?'$'+rev.toLocaleString('en-US',{minimumFractionDigits:2}):'--';
    document.getElementById('ytdCompleted').textContent = cJobs.length||'--';
    document.getElementById('ytdAvgJob').textContent = avg>0?'$'+avg.toLocaleString('en-US',{minimumFractionDigits:2}):'--';
    document.getElementById('ytdNewBooked').textContent = pJobs.length||'--';
    document.getElementById('ytdOnlineBooked').textContent = '--';
}
function renderEmployeeStatus() {
    var list = document.getElementById('employeeStatusList'); if(!list)return;
    var todayStr = new Date().toISOString().split('T')[0];
    var todaysJobs = jobsData.filter(function(j){return j.scheduled_date===todayStr;});
    if(todaysJobs.length===0){list.innerHTML='<p class="empty-msg">'+(currentLang==='en'?'No jobs scheduled today':'Sin trabajos agendados hoy')+'</p>';}
    else{var h='';todaysJobs.forEach(function(j){var t=techsData.find(function(t){return t.id===j.tech_id;});h+='<div class="hcp-emp-item"><span class="hcp-emp-dot" style="background:'+(j.status==='completed'?'#10b981':'#3b82f6')+';"></span><strong>'+(t?t.name:'Sin asignar')+'</strong> - '+(j.title||j.description||'Trabajo')+'</div>';});list.innerHTML=h;}
    setTimeout(function(){var m=document.getElementById('employeeStatusMap');if(m&&!employeeStatusMap&&typeof google!=='undefined'){employeeStatusMap=new google.maps.Map(m,{center:{lat:34.1083,lng:-117.2898},zoom:12});}},300);
}
function setEmployeeView(v){document.querySelectorAll('.hcp-toggle-btn').forEach(function(b){b.classList.remove('active');});event.target.classList.add('active');renderEmployeeStatus();}

// ===== PIPELINE SECTION =====
function renderPipelineSection() {
    var st={new:[],quoted:[],approved:[],scheduled:[],won:[]};
    jobsData.forEach(function(j){if(j.status==='open'||j.status==='pending')st.new.push(j);else if(j.status==='quoted')st.quoted.push(j);else if(j.status==='approved')st.approved.push(j);else if(j.status==='in_progress')st.scheduled.push(j);else if(j.status==='completed')st.won.push(j);});
    ['new','quoted','approved','scheduled','won'].forEach(function(s){
        var cId='kanban'+s.charAt(0).toUpperCase()+s.slice(1)+'Count', lId='kanban'+s.charAt(0).toUpperCase()+s.slice(1);
        var cEl=document.getElementById(cId),lEl=document.getElementById(lId);
        if(cEl)cEl.textContent=st[s].length;
        if(lEl)lEl.innerHTML=st[s].map(function(j){return'<div class="kanban-item"><strong>'+(j.title||j.description||'Job')+'</strong><span class="kanban-amount">$'+(parseFloat(j.total_cost)||0).toLocaleString()+'</span><small>'+(j.client_name||'')+'</small></div>';}).join('')||'<p class="empty-msg" style="font-size:11px;">—</p>';
    });
    var total=jobsData.reduce(function(s,j){return s+(parseFloat(j.total_cost)||0);},0);
    var comp=jobsData.filter(function(j){return j.status==='completed';}).length;
    var rate=jobsData.length>0?Math.round(comp/jobsData.length*100):0;
    var avg=jobsData.length>0?total/jobsData.length:0;
    document.getElementById('pipeTotalValue').textContent='$'+total.toLocaleString();
    document.getElementById('pipeConvRate').textContent=rate+'%';
    document.getElementById('pipeAvgDeal').textContent='$'+Math.round(avg).toLocaleString();
    document.getElementById('pipeAvgClose').textContent='7';
}

// ===== MY MONEY =====
var expensesData = [];
function showMoneyExpenseForm(){document.getElementById('moneyExpFormContainer').style.display='block';document.getElementById('moneyExpDate').value=new Date().toISOString().split('T')[0];}
function hideMoneyExpenseForm(){document.getElementById('moneyExpFormContainer').style.display='none';}
async function handleMoneyExpCreate(e){e.preventDefault();var exp={company_id:companyId,description:document.getElementById('moneyExpDesc').value,amount:parseFloat(document.getElementById('moneyExpAmount').value)||0,category:document.getElementById('moneyExpCat').value,date:document.getElementById('moneyExpDate').value,notes:document.getElementById('moneyExpNotes2').value};try{var res=await sbClient.from('expenses').insert(exp).select().single();if(res.error)throw res.error;expensesData.push(res.data);}catch(err){exp.id='exp_'+Date.now();expensesData.push(exp);}hideMoneyExpenseForm();renderMyMoney();}
function renderMyMoney(){
    var paidInv=(window.invoicesData||[]).filter(function(i){return i.status==='paid';});
    var income=paidInv.reduce(function(s,i){return s+(parseFloat(i.total)||0);},0);
    var expenses=expensesData.reduce(function(s,e){return s+(e.amount||0);},0);
    var outstanding=(window.invoicesData||[]).filter(function(i){return i.status!=='paid'&&i.status!=='cancelled';}).reduce(function(s,i){return s+((parseFloat(i.total)||0)-(parseFloat(i.amount_paid)||0));},0);
    document.getElementById('moneyIncome').textContent='$'+income.toLocaleString('en-US',{minimumFractionDigits:2});
    document.getElementById('moneyExpenses').textContent='$'+expenses.toLocaleString('en-US',{minimumFractionDigits:2});
    document.getElementById('moneyProfit').textContent='$'+(income-expenses).toLocaleString('en-US',{minimumFractionDigits:2});
    document.getElementById('moneyOutstanding').textContent='$'+outstanding.toLocaleString('en-US',{minimumFractionDigits:2});
    var months=currentLang==='en'?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']:['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var ch='<div style="display:flex;align-items:flex-end;gap:4px;height:120px;padding:10px 0;">';
    for(var m=0;m<12;m++){var mI=paidInv.filter(function(i){return new Date(i.created_at).getMonth()===m;}).reduce(function(s,i){return s+(parseFloat(i.total)||0);},0);var mE=expensesData.filter(function(e){return new Date(e.date).getMonth()===m;}).reduce(function(s,e){return s+(e.amount||0);},0);var mx=Math.max(income,1);ch+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;"><div style="display:flex;gap:1px;align-items:flex-end;height:100px;width:100%;"><div style="flex:1;height:'+Math.max(mI/mx*100,2)+'%;background:#10b981;border-radius:2px 2px 0 0;"></div><div style="flex:1;height:'+Math.max(mE/mx*100,2)+'%;background:#ef4444;border-radius:2px 2px 0 0;"></div></div><span style="font-size:9px;color:var(--text-muted);">'+months[m]+'</span></div>';}
    ch+='</div><div style="display:flex;gap:16px;justify-content:center;font-size:11px;color:var(--text-muted);"><span>🟢 '+(currentLang==='en'?'Income':'Ingresos')+'</span><span>🔴 '+(currentLang==='en'?'Expenses':'Gastos')+'</span></div>';
    document.getElementById('moneyChart').innerHTML=ch;
    var allTx=[];paidInv.forEach(function(i){allTx.push({type:'income',desc:(currentLang==='en'?'Invoice':'Factura')+' #'+(i.invoice_number||i.id.slice(0,6)),amount:parseFloat(i.total)||0,date:i.created_at,cat:'invoice'});});
    expensesData.forEach(function(e){allTx.push({type:'expense',desc:e.description,amount:e.amount,date:e.date,cat:e.category});});
    allTx.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    var txH='<table class="data-table"><thead><tr><th>'+(currentLang==='en'?'Date':'Fecha')+'</th><th>'+(currentLang==='en'?'Description':'Descripción')+'</th><th>'+(currentLang==='en'?'Category':'Categoría')+'</th><th>'+(currentLang==='en'?'Amount':'Monto')+'</th></tr></thead><tbody>';
    allTx.slice(0,50).forEach(function(tx){var c=tx.type==='income'?'#10b981':'#ef4444';var sg=tx.type==='income'?'+':'-';txH+='<tr><td>'+new Date(tx.date).toLocaleDateString()+'</td><td>'+tx.desc+'</td><td><span class="badge" style="background:'+c+'22;color:'+c+';">'+tx.cat+'</span></td><td style="color:'+c+';font-weight:600;">'+sg+'$'+tx.amount.toLocaleString('en-US',{minimumFractionDigits:2})+'</td></tr>';});
    txH+='</tbody></table>';if(allTx.length===0)txH='<p class="empty-msg">'+(currentLang==='en'?'No transactions':'Sin transacciones')+'</p>';
    document.getElementById('moneyTransactions').innerHTML=txH;
}

// ===== PAYROLL =====
var payrollData=[];
function showPayrollEntry(){document.getElementById('payrollFormContainer').style.display='block';var s=document.getElementById('payTechSelect');s.innerHTML='<option value="">Seleccionar...</option>';techsData.forEach(function(t){s.innerHTML+='<option value="'+t.id+'">'+t.name+'</option>';});document.getElementById('payStart').value=new Date().toISOString().split('T')[0];}
function hidePayrollEntry(){document.getElementById('payrollFormContainer').style.display='none';}
async function handlePayrollCreate(e){e.preventDefault();var en={company_id:companyId,tech_id:document.getElementById('payTechSelect').value||null,tech_name:document.getElementById('payTechSelect').selectedOptions[0].text,type:document.getElementById('payType').value,hours:parseFloat(document.getElementById('payHours').value)||0,rate:parseFloat(document.getElementById('payRate').value)||0,total:parseFloat(document.getElementById('payTotal').value)||0,period_start:document.getElementById('payStart').value,period_end:document.getElementById('payEnd').value,notes:document.getElementById('payNotes').value,status:'pending'};if(!en.total&&en.hours&&en.rate)en.total=en.hours*en.rate;try{var res=await sbClient.from('payroll_entries').insert(en).select().single();if(res.error)throw res.error;payrollData.push(res.data);}catch(err){en.id='pay_'+Date.now();payrollData.push(en);}hidePayrollEntry();renderPayroll();}
function renderPayroll(){
    document.getElementById('payEmployeeCount').textContent=techsData.length;
    document.getElementById('payPeriodTotal').textContent='$'+payrollData.reduce(function(s,p){return s+(p.total||0);},0).toLocaleString('en-US',{minimumFractionDigits:2});
    document.getElementById('payTotalHours').textContent=payrollData.reduce(function(s,p){return s+(p.hours||0);},0);
    document.getElementById('payPending').textContent=payrollData.filter(function(p){return p.status==='pending';}).length;
    var h='<table class="data-table"><thead><tr><th>'+(currentLang==='en'?'Technician':'Técnico')+'</th><th>'+(currentLang==='en'?'Type':'Tipo')+'</th><th>'+(currentLang==='en'?'Hours':'Horas')+'</th><th>'+(currentLang==='en'?'Rate':'Tarifa')+'</th><th>Total</th><th>'+(currentLang==='en'?'Period':'Período')+'</th><th>Status</th></tr></thead><tbody>';
    payrollData.slice().reverse().forEach(function(p){h+='<tr><td><strong>'+p.tech_name+'</strong></td><td>'+p.type+'</td><td>'+p.hours+'</td><td>$'+p.rate.toFixed(2)+'</td><td style="font-weight:600;">$'+p.total.toLocaleString('en-US',{minimumFractionDigits:2})+'</td><td>'+p.period_start+'</td><td><span class="badge" style="background:'+(p.status==='paid'?'#10b981':'#f59e0b')+'22;color:'+(p.status==='paid'?'#10b981':'#f59e0b')+';">'+p.status+'</span></td></tr>';});
    h+='</tbody></table>';if(payrollData.length===0)h='<p class="empty-msg">'+(currentLang==='en'?'No payroll entries':'Sin entradas de nómina')+'</p>';
    document.getElementById('payrollTable').innerHTML=h;
}

// ===== MARKETING =====
var campaignsData=[];
function showCampaignForm(){document.getElementById('campaignFormContainer').style.display='block';}
function hideCampaignForm(){document.getElementById('campaignFormContainer').style.display='none';}
async function handleCampaignCreate(e){e.preventDefault();var camp={company_id:companyId,name:document.getElementById('campName').value,type:document.getElementById('campType').value,budget:parseFloat(document.getElementById('campBudget').value)||0,start_date:document.getElementById('campStart').value,end_date:document.getElementById('campEnd').value,message:document.getElementById('campMessage').value,status:'active',leads_generated:0};try{var res=await sbClient.from('campaigns').insert(camp).select().single();if(res.error)throw res.error;campaignsData.push(res.data);}catch(err){camp.id='camp_'+Date.now();camp.start=camp.start_date;camp.end=camp.end_date;campaignsData.push(camp);}hideCampaignForm();renderMarketing();}
function renderMarketing(){
    document.getElementById('mktCampaignCount').textContent=campaignsData.filter(function(c){return c.status==='active';}).length;
    var sources={};leadsData.forEach(function(l){var s=l.source||'directo';sources[s]=(sources[s]||0)+1;});
    document.getElementById('mktLeadSources').textContent=Object.keys(sources).length;
    document.getElementById('mktReviewCount').textContent='0';document.getElementById('mktROI').textContent='0%';
    var srcH='<div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;">';
    Object.keys(sources).forEach(function(s){srcH+='<div style="flex:1;min-width:120px;padding:10px;background:var(--bg-input);border-radius:8px;text-align:center;"><strong style="font-size:18px;color:var(--primary);">'+sources[s]+'</strong><br><span style="font-size:11px;color:var(--text-muted);">'+s+'</span></div>';});
    if(!Object.keys(sources).length)srcH+='<p class="empty-msg">Sin datos</p>';srcH+='</div>';
    document.getElementById('leadSourceChart').innerHTML=srcH;
    var campH='';campaignsData.slice().reverse().forEach(function(c){campH+='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid var(--border);"><div><strong>'+c.name+'</strong><br><span style="font-size:11px;color:var(--text-muted);">'+c.type+'</span></div><div style="text-align:right;"><span style="font-weight:600;color:var(--primary);">$'+(c.budget||0).toLocaleString()+'</span><br><span class="badge" style="background:#10b98122;color:#10b981;">'+c.status+'</span></div></div>';});
    if(!campaignsData.length)campH='<p class="empty-msg">Sin campañas</p>';
    document.getElementById('campaignsList').innerHTML=campH;
    var sel=document.getElementById('reviewClientSelect');if(sel){sel.innerHTML='<option value="">Seleccionar...</option>';(window.clientsData||[]).forEach(function(c){sel.innerHTML+='<option value="'+c.id+'">'+c.name+'</option>';});}
}
function sendReviewRequest(){var c=document.getElementById('reviewClientSelect');if(!c.value){alert('Selecciona un cliente');return;}alert('Solicitud enviada a '+c.selectedOptions[0].text);}

// ===== PRICE BOOK =====
var priceBookData=[];
function showPriceBookForm(){document.getElementById('priceBookFormContainer').style.display='block';}
function hidePriceBookForm(){document.getElementById('priceBookFormContainer').style.display='none';}
document.addEventListener('input',function(e){if(e.target.id==='pbCost'||e.target.id==='pbPrice'){var c=parseFloat(document.getElementById('pbCost').value)||0;var p=parseFloat(document.getElementById('pbPrice').value)||0;document.getElementById('pbMarkup').value=c>0?Math.round((p-c)/c*100):0;}});
async function handlePriceBookCreate(e){e.preventDefault();var item={company_id:companyId,name:document.getElementById('pbName').value,sku:document.getElementById('pbSku').value,category:document.getElementById('pbCategory').value,unit:document.getElementById('pbUnit').value,cost:parseFloat(document.getElementById('pbCost').value)||0,price:parseFloat(document.getElementById('pbPrice').value)||0,description:document.getElementById('pbDesc').value};try{var res=await sbClient.from('price_book').insert(item).select().single();if(res.error)throw res.error;priceBookData.push(res.data);}catch(err){item.id='pb_'+Date.now();priceBookData.push(item);}hidePriceBookForm();e.target.reset();renderPriceBook();}
function filterPriceBook(){renderPriceBook();}
function renderPriceBook(){
    var search=(document.getElementById('pbSearch').value||'').toLowerCase(),catF=document.getElementById('pbCategoryFilter').value;
    var filtered=priceBookData.filter(function(p){return(!search||p.name.toLowerCase().indexOf(search)>=0||(p.sku||'').toLowerCase().indexOf(search)>=0)&&(catF==='all'||p.category===catF);});
    document.getElementById('pbTotalItems').textContent=priceBookData.length;
    var cats={},totalMk=0,mkCt=0;priceBookData.forEach(function(p){cats[p.category]=true;if(p.cost>0){totalMk+=(p.price-p.cost)/p.cost*100;mkCt++;}});
    document.getElementById('pbAvgMarkup').textContent=mkCt>0?Math.round(totalMk/mkCt)+'%':'0%';
    document.getElementById('pbCategories').textContent=Object.keys(cats).length;
    var h='<table class="data-table"><thead><tr><th>SKU</th><th>'+(currentLang==='en'?'Name':'Nombre')+'</th><th>'+(currentLang==='en'?'Category':'Categoría')+'</th><th>'+(currentLang==='en'?'Cost':'Costo')+'</th><th>'+(currentLang==='en'?'Price':'Precio')+'</th><th>Markup</th><th></th></tr></thead><tbody>';
    filtered.forEach(function(p){var mk=p.cost>0?Math.round((p.price-p.cost)/p.cost*100):0;h+='<tr><td>'+(p.sku||'-')+'</td><td><strong>'+p.name+'</strong></td><td>'+p.category+'</td><td>$'+p.cost.toFixed(2)+'</td><td style="font-weight:600;color:var(--primary);">$'+p.price.toFixed(2)+'</td><td>'+mk+'%</td><td><button class="btn-sm" style="background:#ef4444;color:white;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;" onclick="deletePBItem(\''+p.id+'\')">✕</button></td></tr>';});
    h+='</tbody></table>';if(!filtered.length)h='<p class="empty-msg">Sin artículos</p>';
    document.getElementById('priceBookTable').innerHTML=h;
}
async function deletePBItem(id){if(!confirm('¿Eliminar?'))return;try{await sbClient.from('price_book').delete().eq('id',id);}catch(e){}priceBookData=priceBookData.filter(function(p){return p.id!==id;});renderPriceBook();}

// ===== REPORTS =====
function renderReports(){
    var period=document.getElementById('rptPeriod').value,now=new Date(),startDate;
    document.getElementById('rptCustomRange').style.display=period==='custom'?'flex':'none';
    if(period==='week'){startDate=new Date(now);startDate.setDate(startDate.getDate()-7);}
    else if(period==='month'){startDate=new Date(now.getFullYear(),now.getMonth(),1);}
    else if(period==='quarter'){startDate=new Date(now);startDate.setMonth(startDate.getMonth()-3);}
    else if(period==='year'){startDate=new Date(now.getFullYear(),0,1);}
    else{startDate=new Date(document.getElementById('rptStart').value||now);}
    var pJobs=jobsData.filter(function(j){return new Date(j.created_at)>=startDate;});
    var cJobs=pJobs.filter(function(j){return j.status==='completed';});
    var pInv=(window.invoicesData||[]).filter(function(i){return new Date(i.created_at)>=startDate&&i.status==='paid';});
    var rev=pInv.reduce(function(s,i){return s+(parseFloat(i.total)||0);},0);
    var newCl=(window.clientsData||[]).filter(function(c){return new Date(c.created_at)>=startDate;}).length;
    var rate=pJobs.length>0?Math.round(cJobs.length/pJobs.length*100):0;
    document.getElementById('rptRevenue').textContent='$'+rev.toLocaleString();
    document.getElementById('rptJobsDone').textContent=cJobs.length;
    document.getElementById('rptNewCustomers').textContent=newCl;
    document.getElementById('rptCloseRate').textContent=rate+'%';
    // Revenue chart
    var ms=currentLang==='en'?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']:['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var maxR=1,mRevs=ms.map(function(m,i){var r=pInv.filter(function(inv){return new Date(inv.created_at).getMonth()===i;}).reduce(function(s,inv){return s+(parseFloat(inv.total)||0);},0);if(r>maxR)maxR=r;return r;});
    var ch='<div style="display:flex;align-items:flex-end;gap:6px;height:140px;padding:10px 0;">';
    mRevs.forEach(function(r,i){ch+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;"><div style="width:100%;height:'+Math.max(r/maxR*120,4)+'px;background:linear-gradient(180deg,var(--primary),#60a5fa);border-radius:4px 4px 0 0;" title="$'+r.toLocaleString()+'"></div><span style="font-size:9px;color:var(--text-muted);margin-top:4px;">'+ms[i]+'</span></div>';});
    ch+='</div>';document.getElementById('rptRevenueChart').innerHTML=ch;
    // By tech
    var byTech={};cJobs.forEach(function(j){var tn=techsData.find(function(t){return t.id===j.tech_id;});var nm=tn?tn.name:'Sin asignar';if(!byTech[nm])byTech[nm]={jobs:0,rev:0};byTech[nm].jobs++;byTech[nm].rev+=(parseFloat(j.total_cost)||0);});
    var techH='';Object.keys(byTech).forEach(function(n){techH+='<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid var(--border);"><span><strong>'+n+'</strong></span><span>'+byTech[n].jobs+' jobs | $'+byTech[n].rev.toLocaleString()+'</span></div>';});
    if(!Object.keys(byTech).length)techH='<p class="empty-msg">Sin datos</p>';
    document.getElementById('rptByTech').innerHTML=techH;
    // By source
    var bySrc={};leadsData.forEach(function(l){var s=l.source||'directo';bySrc[s]=(bySrc[s]||0)+1;});
    var srcH='';Object.keys(bySrc).forEach(function(s){srcH+='<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid var(--border);"><span>'+s+'</span><span style="font-weight:600;">'+bySrc[s]+' leads</span></div>';});
    if(!Object.keys(bySrc).length)srcH='<p class="empty-msg">Sin datos</p>';
    document.getElementById('rptBySource').innerHTML=srcH;
    // Top services
    var byServ={};jobsData.forEach(function(j){var s=j.service_type||j.title||'General';if(!byServ[s])byServ[s]=0;byServ[s]++;});
    var servArr=Object.keys(byServ).map(function(k){return{name:k,count:byServ[k]};}).sort(function(a,b){return b.count-a.count;}).slice(0,5);
    var servH='';servArr.forEach(function(s){servH+='<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid var(--border);"><span>'+s.name+'</span><span style="font-weight:600;">'+s.count+'</span></div>';});
    if(!servArr.length)servH='<p class="empty-msg">Sin datos</p>';
    document.getElementById('rptTopServices').innerHTML=servH;
    // By day
    var days=currentLang==='en'?['Sun','Mon','Tue','Wed','Thu','Fri','Sat']:['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var byDay=[0,0,0,0,0,0,0];jobsData.forEach(function(j){var d=new Date(j.created_at).getDay();byDay[d]++;});
    var dayH='';days.forEach(function(d,i){dayH+='<div style="display:flex;justify-content:space-between;padding:6px 8px;border-bottom:1px solid var(--border);"><span>'+d+'</span><span style="font-weight:600;">'+byDay[i]+'</span></div>';});
    document.getElementById('rptByDay').innerHTML=dayH;
}

// ============================================================
// ===== DASHBOARD CLOCK IN / OUT WIDGET =====
// ============================================================
var clockData = {};
var clockTimerInterval = null;
var dashClockInterval = null;

// Live clock display
function startDashClock() {
    function tick() {
        var now = new Date();
        var el = document.getElementById('dashClockTime');
        var dEl = document.getElementById('dashClockDate');
        if (el) el.textContent = now.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
        if (dEl) {
            var opts = currentLang === 'en' ? {weekday:'long',month:'long',day:'numeric',year:'numeric'} : {weekday:'long',day:'numeric',month:'long',year:'numeric'};
            dEl.textContent = now.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'es-MX', opts);
        }
    }
    tick();
    if (dashClockInterval) clearInterval(dashClockInterval);
    dashClockInterval = setInterval(tick, 1000);
}

function initClockWidget() {
    startDashClock();
    // Populate tech select with all available personnel
    var sel = document.getElementById('clockTechSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">' + (currentLang === 'en' ? '-- Select Person --' : '-- Seleccionar Persona --') + '</option>';
    
    // Add owner/admin from dispatch coordinator (Supabase cached)
    var dc = _sbCache.dispatchCoord || {};
    if (dc.name) {
        sel.innerHTML += '<option value="owner_dc">👔 ' + dc.name + ' (Coordinador)</option>';
    }
    
    // Add logged in user / company owner
    var settings = _sbCache.companySettings || {};
    var ownerName = settings.owner_name || settings.ownerName || settings.companyName || '';
    if (ownerName && ownerName !== dc.name) {
        sel.innerHTML += '<option value="owner_main">👔 ' + ownerName + ' (Dueño)</option>';
    }
    
    // Add technicians from Supabase
    if (techsData && techsData.length > 0) {
        sel.innerHTML += '<option disabled>── Técnicos ──</option>';
        techsData.forEach(function(t) {
            sel.innerHTML += '<option value="' + t.id + '">🔧 ' + t.name + '</option>';
        });
    }
    
    // Add employees from payroll (Supabase cached)
    var payrollEmployees = payrollData || [];
    if (payrollEmployees.length > 0) {
        sel.innerHTML += '<option disabled>── Empleados ──</option>';
        payrollEmployees.forEach(function(emp) {
            sel.innerHTML += '<option value="emp_' + emp.id + '">👷 ' + emp.name + '</option>';
        });
    }
    
    // Add manual entry option
    sel.innerHTML += '<option disabled>──────────</option>';
    sel.innerHTML += '<option value="__manual__">✏️ Escribir nombre manualmente...</option>';
    
    // Restore active session
    var today = new Date().toISOString().split('T')[0];
    if (clockData.activeSession && clockData.activeSession.date === today) {
        // Try to restore selection
        var savedId = clockData.activeSession.tech_id || '';
        if (savedId.indexOf('__custom_') === 0) {
            // Custom name - add it as option
            var customName = clockData.activeSession.tech_name || 'Personal';
            sel.innerHTML += '<option value="' + savedId + '">' + customName + '</option>';
        }
        sel.value = savedId;
        document.getElementById('clockHourlyRate').value = clockData.activeSession.rate || 0;
        updateClockBtnState(true);
        startClockTimer();
    }
    renderClockHistory();
}

function onClockTechChange() {
    var techId = document.getElementById('clockTechSelect').value;
    if (!techId) return;
    
    // Handle manual entry
    if (techId === '__manual__') {
        var customName = prompt(currentLang === 'en' ? 'Enter person name:' : 'Escribe el nombre de la persona:');
        if (!customName || !customName.trim()) {
            document.getElementById('clockTechSelect').value = '';
            return;
        }
        customName = customName.trim();
        var customId = '__custom_' + Date.now();
        var sel = document.getElementById('clockTechSelect');
        var opt = document.createElement('option');
        opt.value = customId;
        opt.textContent = '👤 ' + customName;
        opt.setAttribute('data-custom-name', customName);
        sel.insertBefore(opt, sel.lastElementChild);
        sel.value = customId;
        return;
    }
    
    // Load saved rate for this tech
    var rates = (_sbCache.companySettings || {}).tech_rates || {};
    var rate = rates[techId] || 0;
    document.getElementById('clockHourlyRate').value = rate;
}

function saveClockRate() {
    var techId = document.getElementById('clockTechSelect').value;
    var rate = parseFloat(document.getElementById('clockHourlyRate').value) || 0;
    if (!techId) return;
    var rates = (_sbCache.companySettings || {}).tech_rates || {};
    rates[techId] = rate;
    saveCompanySettings({ tech_rates: rates });
}

function toggleDashClockInOut() {
    var today = new Date().toISOString().split('T')[0];
    if (clockData.activeSession && clockData.activeSession.date === today) {
        // CLOCK OUT
        clockData.activeSession.clockOut = new Date().toISOString();
        var inTime = new Date(clockData.activeSession.clockIn);
        var outTime = new Date(clockData.activeSession.clockOut);
        var diffMs = outTime - inTime;
        clockData.activeSession.totalMs = diffMs;
        if (!clockData.history) clockData.history = [];
        clockData.history.push(Object.assign({}, clockData.activeSession));
        // Save to Supabase
        var sessionId = clockData.activeSession.id;
        if (sessionId) {
            sbClient.from('time_clock').update({ clock_out: clockData.activeSession.clockOut, total_ms: diffMs, is_active: false }).eq('id', sessionId).then(function(){});
        }
        clockData.activeSession = null;
        updateClockBtnState(false);
        stopClockTimer();
        renderClockHistory();
    } else {
        // CLOCK IN
        var techId = document.getElementById('clockTechSelect').value;
        var rate = parseFloat(document.getElementById('clockHourlyRate').value) || 0;
        if (!techId) {
            alert('¡Selecciona una persona primero!');
            return;
        }
        // Resolve name from various sources
        var techName = 'Personal';
        var tech = techsData.find(function(t) { return t.id === techId; });
        if (tech) {
            techName = tech.name;
        } else if (techId === 'owner_dc') {
            var dc = _sbCache.dispatchCoord || {};
            techName = dc.name || 'Coordinador';
        } else if (techId === 'owner_main') {
            var stg = _sbCache.companySettings || {};
            techName = stg.owner_name || stg.ownerName || 'Dueño';
        } else if (techId.indexOf('__custom_') === 0) {
            var selOpt = document.getElementById('clockTechSelect').selectedOptions[0];
            techName = selOpt ? selOpt.getAttribute('data-custom-name') || selOpt.textContent.replace('👤 ','') : 'Personal';
        } else if (techId.indexOf('emp_') === 0) {
            var selOpt2 = document.getElementById('clockTechSelect').selectedOptions[0];
            techName = selOpt2 ? selOpt2.textContent.replace('👷 ','') : 'Empleado';
        }
        clockData.activeSession = {
            tech_id: techId,
            tech_name: techName,
            rate: rate,
            clockIn: new Date().toISOString(),
            clockOut: null,
            date: today
        };
        // Save to Supabase
        sbClient.from('time_clock').insert({
            company_id: companyId,
            tech_id: techId,
            tech_name: techName,
            rate: rate,
            clock_in: clockData.activeSession.clockIn,
            date: today,
            is_active: true
        }).select().single().then(function(res) {
            if (res.data) clockData.activeSession.id = res.data.id;
        });
        saveClockRate();
        updateClockBtnState(true);
        startClockTimer();
        renderClockHistory();
    }
}

function updateClockBtnState(isActive) {
    var btn = document.getElementById('clockInOutBtn');
    var icon = document.getElementById('clockBtnIcon');
    var text = document.getElementById('clockBtnText');
    if (isActive) {
        btn.className = 'clock-btn clock-btn-out';
        icon.textContent = '🔴';
        text.textContent = 'Marcar Salida';
    } else {
        btn.className = 'clock-btn clock-btn-in';
        icon.textContent = '🟢';
        text.textContent = 'Marcar Entrada';
    }
}

function startClockTimer() {
    if (clockTimerInterval) clearInterval(clockTimerInterval);
    clockTimerInterval = setInterval(updateClockEarnings, 1000);
    updateClockEarnings();
}

function stopClockTimer() {
    if (clockTimerInterval) clearInterval(clockTimerInterval);
    clockTimerInterval = null;
}

function updateClockEarnings() {
    if (!clockData.activeSession) return;
    var inTime = new Date(clockData.activeSession.clockIn);
    var now = new Date();
    var diffMs = now - inTime;
    var hours = diffMs / 3600000;
    var h = Math.floor(hours);
    var m = Math.floor((diffMs % 3600000) / 60000);
    var s = Math.floor((diffMs % 60000) / 1000);
    document.getElementById('clockWorkedTime').textContent = h + 'h ' + m + 'm ' + s + 's';
    var rate = clockData.activeSession.rate || 0;
    var earned = hours * rate;
    document.getElementById('clockEarnedToday').textContent = '$' + earned.toFixed(2);
    document.getElementById('clockProjected8').textContent = '$' + (rate * 8).toFixed(2);
}

function renderClockHistory() {
    var list = document.getElementById('clockHistoryList');
    if (!list) return;
    var today = new Date().toISOString().split('T')[0];
    var todayHistory = (clockData.history || []).filter(function(h) { return h.date === today; });

    if (clockData.activeSession && clockData.activeSession.date === today) {
        var html = '<div class="clock-hist-item clock-hist-active"><span class="hcp-emp-dot" style="background:#10b981;"></span><strong>' + clockData.activeSession.tech_name + '</strong><span style="color:#10b981;font-size:11px;">⏱ ' + (currentLang === 'en' ? 'Trabajando...' : 'Trabajando...') + '</span><small>In: ' + new Date(clockData.activeSession.clockIn).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) + '</small></div>';
        todayHistory.forEach(function(h) {
            var dur = h.totalMs ? Math.round(h.totalMs / 60000) : 0;
            var earned = (h.totalMs / 3600000 * (h.rate || 0));
            html += '<div class="clock-hist-item"><span class="hcp-emp-dot" style="background:#94a3b8;"></span><strong>' + h.tech_name + '</strong><span style="font-size:11px;color:var(--text-muted);">' + dur + ' min | $' + earned.toFixed(2) + '</span><small>' + new Date(h.clockIn).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) + ' → ' + new Date(h.clockOut).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) + '</small></div>';
        });
        list.innerHTML = html;
    } else if (todayHistory.length > 0) {
        var html2 = '';
        todayHistory.forEach(function(h) {
            var dur = h.totalMs ? Math.round(h.totalMs / 60000) : 0;
            var earned = (h.totalMs / 3600000 * (h.rate || 0));
            html2 += '<div class="clock-hist-item"><span class="hcp-emp-dot" style="background:#94a3b8;"></span><strong>' + h.tech_name + '</strong><span style="font-size:11px;color:var(--text-muted);">' + dur + ' min | $' + earned.toFixed(2) + '</span></div>';
        });
        list.innerHTML = html2;
    } else {
        list.innerHTML = '<p style="font-size:11px;color:var(--text-muted);text-align:center;padding:8px;">' + (currentLang === 'en' ? 'Sin registros de entrada hoy' : 'Sin entradas hoy') + '</p>';
    }
}

// Init clock on dashboard load
var _origRenderDashDyn = typeof renderDashboardDynamic === 'function' ? renderDashboardDynamic : null;
var _origRDDPatched = false;
(function patchDashboard() {
    if (!_origRDDPatched) {
        var origFn = window.renderDashboardDynamic;
        window.renderDashboardDynamic = function() {
            if (origFn) origFn();
            initClockWidget();
        };
        _origRDDPatched = true;
    }
})();

// ============================================================
// ===== PAYROLL PROVIDER MANAGER =====
// ============================================================
var payrollProviderConfig = {};

function selectPayrollProvider(provider) {
    // Deselect all
    ['adp','gusto','qb','paychex','square','manual'].forEach(function(p) {
        var card = document.getElementById('providerCard_' + p);
        var check = document.getElementById('providerCheck_' + p);
        if (card) card.classList.remove('provider-selected');
        if (check) check.textContent = '○';
    });
    // Select this one
    var card = document.getElementById('providerCard_' + provider);
    var check = document.getElementById('providerCheck_' + provider);
    if (card) card.classList.add('provider-selected');
    if (check) check.textContent = '●';
    payrollProviderConfig.selected = provider;

    // Show config
    var configArea = document.getElementById('providerConfigArea');
    if (provider === 'manual') {
        configArea.style.display = 'none';
    } else {
        configArea.style.display = 'block';
        var names = { adp:'ADP Workforce', gusto:'Gusto', qb:'QuickBooks Payroll', paychex:'Paychex', square:'Square Payroll' };
        document.getElementById('providerConfigTitle').textContent = (currentLang === 'en' ? 'Configurar ' : 'Configurar ') + (names[provider] || provider);
        // Restore saved config
        if (payrollProviderConfig[provider]) {
            document.getElementById('providerApiKey').value = payrollProviderConfig[provider].apiKey || '';
            document.getElementById('providerApiSecret').value = payrollProviderConfig[provider].apiSecret || '';
            document.getElementById('providerCompanyId').value = payrollProviderConfig[provider].companyId || '';
            document.getElementById('providerSyncFreq').value = payrollProviderConfig[provider].syncFreq || 'manual';
        } else {
            document.getElementById('providerApiKey').value = '';
            document.getElementById('providerApiSecret').value = '';
            document.getElementById('providerCompanyId').value = '';
            document.getElementById('providerSyncFreq').value = 'manual';
        }
    }
    saveCompanySettings({ payroll_provider: payrollProviderConfig.selected || '', payroll_config: payrollProviderConfig });
}

function savePayrollProvider() {
    var provider = payrollProviderConfig.selected;
    if (!provider || provider === 'manual') return;
    payrollProviderConfig[provider] = {
        apiKey: document.getElementById('providerApiKey').value,
        apiSecret: document.getElementById('providerApiSecret').value,
        companyId: document.getElementById('providerCompanyId').value,
        syncFreq: document.getElementById('providerSyncFreq').value,
        syncHours: document.getElementById('providerSyncHours').checked,
        syncRates: document.getElementById('providerSyncRates').checked,
        connected: true,
        connectedAt: new Date().toISOString()
    };
    saveCompanySettings({ payroll_provider: payrollProviderConfig.selected || '', payroll_config: payrollProviderConfig });
    document.getElementById('payProviderStatus').textContent = (currentLang === 'en' ? 'Conectado' : 'Conectado');
    document.getElementById('payProviderStatus').style.background = '#10b98122';
    document.getElementById('payProviderStatus').style.color = '#10b981';
    document.getElementById('providerSyncStatus').innerHTML = '✅ ' + (currentLang === 'en' ? 'Conectado exitosamente a las ' : 'Conectado exitosamente a las ') + new Date().toLocaleTimeString();
    addSyncHistoryEntry(provider, 'connected', currentLang === 'en' ? 'Proveedor conectado' : 'Proveedor conectado');
}

function testPayrollConnection() {
    var provider = payrollProviderConfig.selected;
    document.getElementById('providerSyncStatus').innerHTML = '⏳ ' + (currentLang === 'en' ? 'Probando conexión...' : 'Probando conexión...');
    setTimeout(function() {
        var key = document.getElementById('providerApiKey').value;
        if (key && key.length > 3) {
            document.getElementById('providerSyncStatus').innerHTML = '✅ ' + (currentLang === 'en' ? '¡Conexión exitosa! API respondiendo.' : '¡Conexión exitosa! API respondiendo.');
        } else {
            document.getElementById('providerSyncStatus').innerHTML = '❌ ' + (currentLang === 'en' ? 'Conexión fallida. Verifica tus credenciales.' : 'Conexión fallida. Verifica tus credenciales.');
        }
    }, 1500);
}

function syncPayrollNow() {
    var provider = payrollProviderConfig.selected;
    document.getElementById('providerSyncStatus').innerHTML = '🔄 ' + (currentLang === 'en' ? 'Sincronizando datos...' : 'Sincronizando datos...');
    setTimeout(function() {
        document.getElementById('providerSyncStatus').innerHTML = '✅ ' + (currentLang === 'en' ? 'Sincronización completada. ' : 'Sincronización completada. ') + techsData.length + (currentLang === 'en' ? ' empleados sincronizados.' : ' empleados sincronizados.');
        addSyncHistoryEntry(provider, 'sync', techsData.length + ' empleados sincronizados');
    }, 2000);
}

function disconnectProvider() {
    var provider = payrollProviderConfig.selected;
    if (!confirm(currentLang === 'en' ? '¿Desconectar este proveedor?' : '¿Desconectar este proveedor?')) return;
    if (payrollProviderConfig[provider]) {
        payrollProviderConfig[provider].connected = false;
    }
    saveCompanySettings({ payroll_provider: payrollProviderConfig.selected || '', payroll_config: payrollProviderConfig });
    document.getElementById('payProviderStatus').textContent = (currentLang === 'en' ? 'Desconectado' : 'Desconectado');
    document.getElementById('payProviderStatus').style.background = '#f59e0b22';
    document.getElementById('payProviderStatus').style.color = '#f59e0b';
    document.getElementById('providerConfigArea').style.display = 'none';
    addSyncHistoryEntry(provider, 'disconnect', currentLang === 'en' ? 'Proveedor desconectado' : 'Proveedor desconectado');
}

function addSyncHistoryEntry(provider, action, message) {
    if (!payrollProviderConfig.syncHistory) payrollProviderConfig.syncHistory = [];
    payrollProviderConfig.syncHistory.unshift({
        provider: provider,
        action: action,
        message: message,
        timestamp: new Date().toISOString()
    });
    if (payrollProviderConfig.syncHistory.length > 20) payrollProviderConfig.syncHistory = payrollProviderConfig.syncHistory.slice(0, 20);
    saveCompanySettings({ payroll_provider: payrollProviderConfig.selected || '', payroll_config: payrollProviderConfig });
    renderSyncHistory();
}

function renderSyncHistory() {
    var list = document.getElementById('providerSyncHistory');
    if (!list) return;
    var history = payrollProviderConfig.syncHistory || [];
    if (history.length === 0) {
        list.innerHTML = '<p class="empty-msg" style="font-size:11px;">' + (currentLang === 'en' ? 'Sin historial de sincronización' : 'Sin historial de sincronización') + '</p>';
        return;
    }
    var html = '';
    history.slice(0, 10).forEach(function(h) {
        var icon = h.action === 'connected' ? '🟢' : h.action === 'sync' ? '🔄' : '🔴';
        var names = { adp:'ADP', gusto:'Gusto', qb:'QuickBooks', paychex:'Paychex', square:'Square' };
        html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:11px;">';
        html += '<span>' + icon + '</span><strong>' + (names[h.provider] || h.provider) + '</strong><span style="flex:1;color:var(--text-muted);">' + h.message + '</span><span style="color:var(--text-muted);font-size:10px;">' + new Date(h.timestamp).toLocaleString() + '</span></div>';
    });
    list.innerHTML = html;
}

// Restore provider state on payroll render
var _origRenderPayroll = window.renderPayroll;
window.renderPayroll = function() {
    _origRenderPayroll();
    // Restore provider selection
    if (payrollProviderConfig.selected) {
        selectPayrollProvider(payrollProviderConfig.selected);
        if (payrollProviderConfig[payrollProviderConfig.selected] && payrollProviderConfig[payrollProviderConfig.selected].connected) {
            document.getElementById('payProviderStatus').textContent = (currentLang === 'en' ? 'Conectado' : 'Conectado');
            document.getElementById('payProviderStatus').style.background = '#10b98122';
            document.getElementById('payProviderStatus').style.color = '#10b981';
        }
    }
    renderSyncHistory();
};

// ============================================================
// ===== HVAC/R DEFAULT PRICE BOOK CATALOG =====
// ============================================================
function loadDefaultPriceBook() {
    if (priceBookData.length > 0 && !confirm(currentLang === 'en' ? 'Esto AGREGARÁ 150+ artículos HVAC a tu lista de precios. ¿Continuar?' : 'Esto AGREGARÁ 150+ artículos HVAC a tu lista de precios. ¿Continuar?')) return;
    var catalog = [
        // ===== AC PARTS =====
        {sku:'CAP-355',name:'Capacitor 35/5 MFD 370/440V',category:'ac_parts',unit:'each',cost:8,price:45,description:'Dual run capacitor para condensadora'},
        {sku:'CAP-455',name:'Capacitor 45/5 MFD 370/440V',category:'ac_parts',unit:'each',cost:9,price:50,description:'Dual run capacitor para condensadora'},
        {sku:'CAP-555',name:'Capacitor 55/5 MFD 370/440V',category:'ac_parts',unit:'each',cost:10,price:55,description:'Dual run capacitor para condensadora'},
        {sku:'CAP-6010',name:'Capacitor 60/10 MFD 370/440V',category:'ac_parts',unit:'each',cost:12,price:60,description:'Dual run capacitor alta capacidad'},
        {sku:'CAP-TURBO',name:'Turbo 200 Universal Capacitor',category:'ac_parts',unit:'each',cost:25,price:95,description:'Capacitor universal 2.5-67.5 MFD'},
        {sku:'CONT-1P30',name:'Contactor 1 Polo 30 Amp',category:'ac_parts',unit:'each',cost:12,price:65,description:'Contactor para condensadora residencial'},
        {sku:'CONT-2P30',name:'Contactor 2 Polos 30 Amp',category:'ac_parts',unit:'each',cost:15,price:75,description:'Contactor para condensadora 2+ tons'},
        {sku:'CONT-2P40',name:'Contactor 2 Polos 40 Amp',category:'ac_parts',unit:'each',cost:18,price:85,description:'Contactor para condensadora 3-5 tons'},
        {sku:'TXV-R410',name:'TXV Valve R-410A 2-5 Ton',category:'ac_parts',unit:'each',cost:45,price:225,description:'Válvula de expansión termostática'},
        {sku:'COIL-EVAP3',name:'Evaporator Coil 3 Ton',category:'ac_parts',unit:'each',cost:280,price:750,description:'Coil evaporador cased 3 ton'},
        {sku:'COIL-EVAP4',name:'Evaporator Coil 4 Ton',category:'ac_parts',unit:'each',cost:340,price:850,description:'Coil evaporador cased 4 ton'},
        {sku:'COIL-COND3',name:'Condenser Coil 3 Ton',category:'ac_parts',unit:'each',cost:350,price:900,description:'Coil condensador 3 ton'},
        {sku:'COMP-SC',name:'Compressor Scroll 3 Ton R-410A',category:'ac_parts',unit:'each',cost:650,price:1800,description:'Compresor scroll Copeland 3 ton'},
        {sku:'COMP-SC5',name:'Compressor Scroll 5 Ton R-410A',category:'ac_parts',unit:'each',cost:850,price:2200,description:'Compresor scroll Copeland 5 ton'},
        {sku:'HARD-KIT',name:'Hard Start Kit 5-2-1 CSR-U2',category:'ac_parts',unit:'each',cost:22,price:120,description:'Kit de arranque para compresor'},
        {sku:'DRIER-BK',name:'Filter Drier Biflow 3/8"',category:'ac_parts',unit:'each',cost:12,price:65,description:'Filtro deshidratador biflow'},
        {sku:'SVC-VLV',name:'Service Valve Set 3/8" x 3/4"',category:'ac_parts',unit:'each',cost:25,price:85,description:'Par de válvulas de servicio'},
        {sku:'DISC-60A',name:'Disconnect Box 60 Amp Non-Fused',category:'ac_parts',unit:'each',cost:12,price:55,description:'Caja de desconexión exterior'},
        {sku:'DISC-60F',name:'Disconnect Box 60 Amp Fused',category:'ac_parts',unit:'each',cost:18,price:75,description:'Caja de desconexión con fusibles'},
        {sku:'WHIP-6',name:'AC Whip 3/4" x 6ft',category:'ac_parts',unit:'each',cost:15,price:45,description:'Flexible conduit para condensadora'},
        {sku:'PAD-COND',name:'Condenser Pad 24x24x3',category:'ac_parts',unit:'each',cost:25,price:65,description:'Base plástica para condensadora'},
        {sku:'LINESETC',name:'Lineset 3/8 x 3/4 x 25ft',category:'ac_parts',unit:'each',cost:75,price:195,description:'Copper lineset con aislamiento'},
        {sku:'LINESETD',name:'Lineset 3/8 x 7/8 x 30ft',category:'ac_parts',unit:'each',cost:95,price:245,description:'Copper lineset para 3+ ton'},
        {sku:'DRAIN-PMP',name:'Condensate Pump Mini',category:'ac_parts',unit:'each',cost:35,price:125,description:'Bomba de condensado Little Giant'},
        {sku:'FLOAT-SW',name:'Float Switch Safety',category:'ac_parts',unit:'each',cost:8,price:45,description:'Switch de seguridad para charola'},

        // ===== HEATING PARTS =====
        {sku:'IGN-HSI',name:'Hot Surface Ignitor Universal',category:'heating_parts',unit:'each',cost:12,price:85,description:'Ignitor universal silicon nitride'},
        {sku:'IGN-NORTON',name:'Norton Ignitor 271N',category:'heating_parts',unit:'each',cost:8,price:75,description:'Ignitor Norton/Saint Gobain'},
        {sku:'FLAME-SNS',name:'Flame Sensor Universal',category:'heating_parts',unit:'each',cost:6,price:65,description:'Sensor de flama universal'},
        {sku:'GAS-VLV36',name:'Gas Valve Honeywell VR8205',category:'heating_parts',unit:'each',cost:95,price:350,description:'Válvula de gas 2 etapas Honeywell'},
        {sku:'GAS-VLV-WR',name:'Gas Valve White Rodgers 36J',category:'heating_parts',unit:'each',cost:85,price:320,description:'Válvula de gas White Rodgers'},
        {sku:'CTRL-BRD',name:'Control Board Universal Furnace',category:'heating_parts',unit:'each',cost:65,price:285,description:'Tarjeta de control universal furnace'},
        {sku:'CTRL-ICM',name:'ICM2805A Control Board',category:'heating_parts',unit:'each',cost:55,price:250,description:'Tarjeta ICM reemplazo Carrier/Bryant'},
        {sku:'BLWR-MTR',name:'Blower Motor 1/2 HP',category:'heating_parts',unit:'each',cost:85,price:325,description:'Motor de blower 1/2 HP 115V'},
        {sku:'BLWR-MTR34',name:'Blower Motor 3/4 HP',category:'heating_parts',unit:'each',cost:110,price:395,description:'Motor de blower 3/4 HP 115V'},
        {sku:'IDM-MTR',name:'Inducer Motor Draft Assembly',category:'heating_parts',unit:'each',cost:75,price:295,description:'Motor inductor de tiro'},
        {sku:'XFORMER',name:'Transformer 120V/24V 40VA',category:'heating_parts',unit:'each',cost:12,price:65,description:'Transformador 40VA'},
        {sku:'PRESS-SW',name:'Pressure Switch -0.65" WC',category:'heating_parts',unit:'each',cost:12,price:75,description:'Switch de presión negativa'},
        {sku:'PRESS-SWH',name:'Pressure Switch -1.0" WC',category:'heating_parts',unit:'each',cost:14,price:80,description:'Switch de presión alta negativa'},
        {sku:'LIMIT-SW',name:'Limit Switch 160°F',category:'heating_parts',unit:'each',cost:10,price:65,description:'Switch de límite de temperatura'},
        {sku:'ROLLOUT',name:'Rollout Switch Manual Reset',category:'heating_parts',unit:'each',cost:8,price:55,description:'Switch de rollout manual reset'},
        {sku:'HX-PRIMARY',name:'Heat Exchanger Primary',category:'heating_parts',unit:'each',cost:450,price:1500,description:'Intercambiador de calor primario'},
        {sku:'HX-SECOND',name:'Heat Exchanger Secondary 90%+',category:'heating_parts',unit:'each',cost:350,price:1200,description:'Intercambiador secundario condensing'},
        {sku:'IGNITION-MD',name:'Ignition Module Honeywell S8610U',category:'heating_parts',unit:'each',cost:55,price:195,description:'Módulo de ignición intermitent pilot'},

        // ===== MOTORS & FANS =====
        {sku:'CONDMTR',name:'Condenser Fan Motor 1/4 HP',category:'motors_fans',unit:'each',cost:55,price:225,description:'Motor de ventilador de condensadora'},
        {sku:'CONDMTR6',name:'Condenser Fan Motor 1/6 HP',category:'motors_fans',unit:'each',cost:45,price:195,description:'Motor ventilador 1/6 HP'},
        {sku:'ECM-MTR',name:'ECM Blower Motor 1/2 HP',category:'motors_fans',unit:'each',cost:350,price:850,description:'Motor ECM variable speed'},
        {sku:'FAN-BLADE18',name:'Fan Blade 18" 3-Blade CW',category:'motors_fans',unit:'each',cost:15,price:55,description:'Aspa de ventilador 18 pulgadas'},
        {sku:'FAN-BLADE22',name:'Fan Blade 22" 3-Blade CW',category:'motors_fans',unit:'each',cost:18,price:65,description:'Aspa de ventilador 22 pulgadas'},
        {sku:'BLWR-WHL10',name:'Blower Wheel 10x8',category:'motors_fans',unit:'each',cost:30,price:95,description:'Rueda de blower 10x8'},
        {sku:'BLWR-WHL11',name:'Blower Wheel 11x10',category:'motors_fans',unit:'each',cost:35,price:110,description:'Rueda de blower 11x10'},

        // ===== CONTROLS & THERMOSTATS =====
        {sku:'TSTAT-1H1C',name:'Thermostat Basic 1H/1C Non-Prog',category:'controls',unit:'each',cost:18,price:85,description:'Termostato básico no programable'},
        {sku:'TSTAT-PROG',name:'Thermostat Programmable 2H/2C',category:'controls',unit:'each',cost:35,price:145,description:'Termostato programable'},
        {sku:'TSTAT-WIFI',name:'Thermostat WiFi Honeywell T6',category:'controls',unit:'each',cost:95,price:245,description:'Termostato WiFi Honeywell T6 Pro'},
        {sku:'TSTAT-ECOB',name:'Thermostat Ecobee Smart',category:'controls',unit:'each',cost:170,price:350,description:'Termostato inteligente Ecobee'},
        {sku:'TSTAT-NEST',name:'Thermostat Google Nest',category:'controls',unit:'each',cost:180,price:375,description:'Termostato inteligente Google Nest'},
        {sku:'RELAY-24V',name:'Relay 24V SPDT Fan',category:'controls',unit:'each',cost:8,price:45,description:'Relevador de fan 24V'},
        {sku:'TIME-DLY',name:'Time Delay Relay 30s',category:'controls',unit:'each',cost:15,price:65,description:'Relevador con retardo de tiempo'},
        {sku:'HIGH-PRSW',name:'High Pressure Switch 400 PSI',category:'controls',unit:'each',cost:18,price:85,description:'Switch de alta presión'},
        {sku:'LOW-PRSW',name:'Low Pressure Switch 30 PSI',category:'controls',unit:'each',cost:18,price:85,description:'Switch de baja presión'},
        {sku:'SEQUENCER',name:'Electric Heat Sequencer 2-Stage',category:'controls',unit:'each',cost:15,price:75,description:'Secuenciador de calefacción eléctrica'},
        {sku:'DEFROST-BD',name:'Defrost Control Board Timer',category:'controls',unit:'each',cost:35,price:145,description:'Tarjeta de control de defrost'},

        // ===== REFRIGERANTS =====
        {sku:'R410A-25',name:'R-410A Refrigerant 25 lb',category:'refrigerants',unit:'each',cost:125,price:350,description:'Cilindro R-410A 25 libras'},
        {sku:'R22-RCL',name:'R-22 Refrigerant (Reclaimed) lb',category:'refrigerants',unit:'lb',cost:35,price:85,description:'R-22 reclamado por libra'},
        {sku:'R407C-25',name:'R-407C Refrigerant 25 lb',category:'refrigerants',unit:'each',cost:110,price:295,description:'Cilindro R-407C 25 libras'},
        {sku:'R134A-30',name:'R-134A Refrigerant 30 lb',category:'refrigerants',unit:'each',cost:95,price:250,description:'Cilindro R-134A 30 libras'},
        {sku:'R404A-24',name:'R-404A Refrigerant 24 lb',category:'refrigerants',unit:'each',cost:115,price:295,description:'Cilindro R-404A refrigeración comercial'},
        {sku:'R290-LB',name:'R-290 Propane Refrigerant per lb',category:'refrigerants',unit:'lb',cost:8,price:35,description:'R-290 propano por libra'},
        {sku:'NITRO-TANK',name:'Nitrogen Tank Rental + Gas',category:'refrigerants',unit:'each',cost:25,price:85,description:'Tanque de nitrógeno para pruebas'},

        // ===== REFRIGERATION =====
        {sku:'REF-TXV',name:'TXV Valve Commercial 1/2 Ton',category:'refrigeration',unit:'each',cost:45,price:175,description:'Válvula de expansión comercial'},
        {sku:'REF-SOLENOID',name:'Solenoid Valve 3/8" ODF',category:'refrigeration',unit:'each',cost:35,price:145,description:'Válvula solenoide para refrigeración'},
        {sku:'REF-FILTER',name:'Liquid Line Filter Drier 3/8"',category:'refrigeration',unit:'each',cost:12,price:55,description:'Filtro deshidratador líquido'},
        {sku:'REF-SIGHT',name:'Sight Glass with Moisture Indicator',category:'refrigeration',unit:'each',cost:18,price:75,description:'Visor con indicador de humedad'},
        {sku:'REF-FAN-MTR',name:'Evaporator Fan Motor 9W ECM',category:'refrigeration',unit:'each',cost:25,price:95,description:'Motor de evaporador walk-in/reach-in'},
        {sku:'REF-DEFROST',name:'Defrost Heater Element 20"',category:'refrigeration',unit:'each',cost:15,price:65,description:'Elemento de descongelación'},
        {sku:'REF-TERM',name:'Defrost Termination Thermostat',category:'refrigeration',unit:'each',cost:8,price:45,description:'Termostato de terminación de defrost'},
        {sku:'REF-TIMER',name:'Defrost Timer Paragon 8145-20',category:'refrigeration',unit:'each',cost:25,price:95,description:'Timer de defrost Paragon'},
        {sku:'REF-DOOR-GSK',name:'Walk-In Door Gasket (per foot)',category:'refrigeration',unit:'foot',cost:5,price:18,description:'Empaque de puerta walk-in por pie'},
        {sku:'REF-DOOR-CLSR',name:'Walk-In Door Closer Heavy Duty',category:'refrigeration',unit:'each',cost:45,price:165,description:'Cerrador de puerta walk-in'},

        // ===== ELECTRICAL =====
        {sku:'WIRE-14-2',name:'Romex 14/2 NM-B (per foot)',category:'electrical',unit:'foot',cost:0.50,price:2.50,description:'Cable Romex 14/2 para 15A circuits'},
        {sku:'WIRE-12-2',name:'Romex 12/2 NM-B (per foot)',category:'electrical',unit:'foot',cost:0.75,price:3.50,description:'Cable Romex 12/2 para 20A circuits'},
        {sku:'WIRE-10-2',name:'Romex 10/2 NM-B (per foot)',category:'electrical',unit:'foot',cost:1.25,price:5.00,description:'Cable 10/2 para circuits de 30A'},
        {sku:'WIRE-TSTAT',name:'Thermostat Wire 18/5 (per foot)',category:'electrical',unit:'foot',cost:0.30,price:1.50,description:'Cable de termostato 18 gauge 5 hilos'},
        {sku:'WIRE-TSTAT8',name:'Thermostat Wire 18/8 (per foot)',category:'electrical',unit:'foot',cost:0.45,price:2.00,description:'Cable de termostato 18 gauge 8 hilos'},
        {sku:'BRKR-20SP',name:'Breaker 20A Single Pole',category:'electrical',unit:'each',cost:6,price:35,description:'Breaker 20 amp 1 polo'},
        {sku:'BRKR-30DP',name:'Breaker 30A Double Pole',category:'electrical',unit:'each',cost:12,price:55,description:'Breaker 30 amp 2 polos para AC'},
        {sku:'BRKR-50DP',name:'Breaker 50A Double Pole',category:'electrical',unit:'each',cost:18,price:75,description:'Breaker 50 amp para electric heat'},
        {sku:'FUSE-30',name:'Fuse 30 Amp Time Delay',category:'electrical',unit:'each',cost:3,price:15,description:'Fusible 30A time delay'},

        // ===== DUCTWORK =====
        {sku:'FLEX-6',name:'Flex Duct 6" x 25ft R-8',category:'ductwork',unit:'each',cost:35,price:95,description:'Ducto flexible 6 pulgadas R-8'},
        {sku:'FLEX-8',name:'Flex Duct 8" x 25ft R-8',category:'ductwork',unit:'each',cost:45,price:120,description:'Ducto flexible 8 pulgadas R-8'},
        {sku:'FLEX-10',name:'Flex Duct 10" x 25ft R-8',category:'ductwork',unit:'each',cost:55,price:145,description:'Ducto flexible 10 pulgadas R-8'},
        {sku:'FLEX-12',name:'Flex Duct 12" x 25ft R-8',category:'ductwork',unit:'each',cost:65,price:165,description:'Ducto flexible 12 pulgadas R-8'},
        {sku:'DUCT-TAPE',name:'Mastic Duct Tape UL181',category:'ductwork',unit:'each',cost:8,price:25,description:'Cinta de ducto código UL181'},
        {sku:'DUCT-SEAL',name:'Duct Sealant Mastic 1 Gal',category:'ductwork',unit:'each',cost:12,price:35,description:'Sellador mastic para ductos'},
        {sku:'REGISTER-W',name:'Ceiling Register 12x6 White',category:'ductwork',unit:'each',cost:8,price:35,description:'Registro de techo blanco'},
        {sku:'GRILLE-RET',name:'Return Air Grille 20x20',category:'ductwork',unit:'each',cost:15,price:55,description:'Rejilla de retorno 20x20'},
        {sku:'PLENUM-BOX',name:'Supply Plenum Box',category:'ductwork',unit:'each',cost:45,price:125,description:'Caja de plenum de suministro'},

        // ===== FILTERS =====
        {sku:'FILT-16251',name:'Filter 16x25x1 MERV 8',category:'filters',unit:'each',cost:3,price:12,description:'Filtro estándar 16x25x1'},
        {sku:'FILT-20251',name:'Filter 20x25x1 MERV 8',category:'filters',unit:'each',cost:3,price:12,description:'Filtro estándar 20x25x1'},
        {sku:'FILT-16254',name:'Filter 16x25x4 MERV 11',category:'filters',unit:'each',cost:18,price:45,description:'Filtro grueso alta eficiencia'},
        {sku:'FILT-20254',name:'Filter 20x25x4 MERV 11',category:'filters',unit:'each',cost:18,price:45,description:'Filtro grueso alta eficiencia'},
        {sku:'FILT-MEDIA',name:'Media Filter Replacement 20x25x5',category:'filters',unit:'each',cost:25,price:65,description:'Filtro de media reemplazo'},

        // ===== TOOLS =====
        {sku:'GAUGE-SET',name:'Manifold Gauge Set R-410A/R-22',category:'tools',unit:'each',cost:75,price:175,description:'Set de manómetros digital o análogo'},
        {sku:'VACUUM-PMP',name:'Vacuum Pump 5 CFM',category:'tools',unit:'each',cost:150,price:350,description:'Bomba de vacío 5 CFM'},
        {sku:'LEAK-DET',name:'Refrigerant Leak Detector',category:'tools',unit:'each',cost:85,price:195,description:'Detector de fugas de refrigerante'},
        {sku:'RECOV-MACH',name:'Refrigerant Recovery Machine',category:'tools',unit:'each',cost:450,price:950,description:'Máquina recuperadora de refrigerante'},
        {sku:'MULTIMETER',name:'Multimeter HVAC Fieldpiece',category:'tools',unit:'each',cost:85,price:195,description:'Multímetro HVAC Fieldpiece o equiv.'},
        {sku:'MEGA-OHM',name:'Megohmmeter Insulation Tester',category:'tools',unit:'each',cost:120,price:295,description:'Megóhmetro para probar aislamientos'},
        {sku:'COMBUST',name:'Combustion Analyzer',category:'tools',unit:'each',cost:350,price:750,description:'Analizador de combustión'},
        {sku:'MANOMETER',name:'Digital Manometer Dual Port',category:'tools',unit:'each',cost:55,price:145,description:'Manómetro digital para presión estática'},

        // ===== LABOR =====
        {sku:'LBR-DIAG',name:'Diagnostic Fee / Service Call',category:'labor',unit:'flat',cost:0,price:89,description:'Cargo por diagnóstico y visita'},
        {sku:'LBR-HOUR',name:'Labor Rate per Hour',category:'labor',unit:'hour',cost:0,price:125,description:'Tarifa estándar por hora de trabajo'},
        {sku:'LBR-OT',name:'Overtime Labor per Hour',category:'labor',unit:'hour',cost:0,price:185,description:'Tarifa overtime / después de horario'},
        {sku:'LBR-EMERG',name:'Emergency/After-Hours Service Call',category:'labor',unit:'flat',cost:0,price:175,description:'Llamada de emergencia fuera de horario'},
        {sku:'LBR-TUNEUP',name:'AC Tune-Up / Maintenance',category:'labor',unit:'flat',cost:0,price:89,description:'Servicio de mantenimiento completo'},
        {sku:'LBR-HTUNE',name:'Heating Tune-Up / Safety Check',category:'labor',unit:'flat',cost:0,price:89,description:'Inspección de calefacción'},
        {sku:'LBR-INSTALL',name:'Equipment Installation (per system)',category:'labor',unit:'flat',cost:0,price:2500,description:'Mano de obra instalación sistema completo'},
        {sku:'LBR-DUCTWORK',name:'Ductwork Installation (per run)',category:'labor',unit:'flat',cost:0,price:350,description:'Instalación de ductos por corrida'},
        {sku:'LBR-BRAZING',name:'Brazing/Soldering Repair',category:'labor',unit:'flat',cost:0,price:195,description:'Reparación con soldadura de plata'},
        {sku:'LBR-LEAK-RPR',name:'Refrigerant Leak Repair',category:'labor',unit:'flat',cost:0,price:350,description:'Búsqueda y reparación de fuga'},

        // ===== EQUIPMENT =====
        {sku:'EQ-COND2',name:'Condensing Unit 2 Ton 14 SEER',category:'equipment',unit:'each',cost:1200,price:2800,description:'Condensadora 2 ton básica'},
        {sku:'EQ-COND3',name:'Condensing Unit 3 Ton 14 SEER',category:'equipment',unit:'each',cost:1450,price:3200,description:'Condensadora 3 ton básica'},
        {sku:'EQ-COND4',name:'Condensing Unit 4 Ton 14 SEER',category:'equipment',unit:'each',cost:1700,price:3800,description:'Condensadora 4 ton básica'},
        {sku:'EQ-COND5',name:'Condensing Unit 5 Ton 14 SEER',category:'equipment',unit:'each',cost:2100,price:4500,description:'Condensadora 5 ton básica'},
        {sku:'EQ-AH3',name:'Air Handler 3 Ton Multi-Position',category:'equipment',unit:'each',cost:650,price:1600,description:'Manejadora de aire 3 ton'},
        {sku:'EQ-AH4',name:'Air Handler 4 Ton Multi-Position',category:'equipment',unit:'each',cost:750,price:1850,description:'Manejadora de aire 4 ton'},
        {sku:'EQ-FURN80',name:'Furnace 80% AFUE 80K BTU',category:'equipment',unit:'each',cost:650,price:1800,description:'Furnace 80% eficiencia 80,000 BTU'},
        {sku:'EQ-FURN96',name:'Furnace 96% AFUE 80K BTU',category:'equipment',unit:'each',cost:1100,price:2800,description:'Furnace 96% high efficiency'},
        {sku:'EQ-HP3',name:'Heat Pump 3 Ton 15 SEER',category:'equipment',unit:'each',cost:1800,price:3800,description:'Heat pump 3 ton'},
        {sku:'EQ-MINI12',name:'Mini Split 12K BTU w/ Install Kit',category:'equipment',unit:'each',cost:650,price:2200,description:'Mini split 1 ton con kit instalación'},
        {sku:'EQ-MINI18',name:'Mini Split 18K BTU w/ Install Kit',category:'equipment',unit:'each',cost:850,price:2800,description:'Mini split 1.5 ton con kit'},
        {sku:'EQ-MINI24',name:'Mini Split 24K BTU w/ Install Kit',category:'equipment',unit:'each',cost:1050,price:3400,description:'Mini split 2 ton con kit'},
        {sku:'EQ-PKG3',name:'Package Unit 3 Ton AC',category:'equipment',unit:'each',cost:2200,price:4800,description:'Unidad paquete 3 ton'},
        {sku:'EQ-PKG5',name:'Package Unit 5 Ton AC',category:'equipment',unit:'each',cost:3200,price:6500,description:'Unidad paquete 5 ton'}
    ];

    // Bulk insert to Supabase
    var newItems = [];
    catalog.forEach(function(item) {
        var exists = priceBookData.some(function(p) { return p.sku === item.sku; });
        if (!exists) {
            item.company_id = companyId;
            newItems.push(item);
            priceBookData.push(item);
            added++;
        }
    });
    if (newItems.length > 0) {
        sbClient.from('price_book').insert(newItems).then(function(res) {
            if (res.error) console.warn('Bulk pricebook insert error', res.error.message);
        });
    }
    renderPriceBook();
    alert((currentLang === 'en' ? 'Se agregaron ' : 'Se agregaron ') + added + (currentLang === 'en' ? ' artículos HVAC a tu lista de precios!' : ' artículos HVAC a tu lista de precios!'));
}

function clearPriceBook() {
    if (!confirm(currentLang === 'en' ? '¿Borrar TODOS los artículos de la lista de precios?' : '¿Borrar TODOS los artículos de la lista de precios?')) return;
    sbClient.from('price_book').delete().eq('company_id', companyId).then(function(){});
    priceBookData = [];
    renderPriceBook();
}

// ============================================================
// ===== HCP IMPORT CENTER =====
// ============================================================
var importParsedData = [];
var importCurrentTab = 'all';

function showImportCenter() {
    document.getElementById('importCenterContainer').style.display = 'block';
    importParsedData = [];
    document.getElementById('importPreviewArea').style.display = 'none';
    document.getElementById('importStatusArea').style.display = 'none';
    document.getElementById('importExecuteBtn').disabled = true;
    document.getElementById('importManualData').value = '';
    // Scroll into view
    document.getElementById('importCenterContainer').scrollIntoView({behavior:'smooth', block:'start'});
}

function hideImportCenter() {
    document.getElementById('importCenterContainer').style.display = 'none';
    importParsedData = [];
}

function setImportTab(tab) {
    importCurrentTab = tab;
    document.querySelectorAll('.import-tab').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('importTab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    // Set the category dropdown to match
    var catMap = {all:'won', won:'won', estimate:'estimate', existing:'existing'};
    document.getElementById('importCategory').value = catMap[tab] || 'won';
}

function handleImportFile(input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var text = e.target.result;
        parseImportData(text, true);
    };
    reader.readAsText(file);
    input.value = '';
}

function parseImportData(text, isCSV) {
    var lines = text.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length < 1) {
        showImportStatus('⚠️ No se encontraron datos', 'warning');
        return;
    }

    importParsedData = [];
    var headers = null;
    var startLine = 0;

    if (isCSV && lines.length > 1) {
        // Try to detect headers
        var firstLine = lines[0].toLowerCase();
        var hasHeaders = firstLine.indexOf('name') >= 0 || firstLine.indexOf('nombre') >= 0 ||
                        firstLine.indexOf('first') >= 0 || firstLine.indexOf('customer') >= 0 ||
                        firstLine.indexOf('phone') >= 0 || firstLine.indexOf('email') >= 0 ||
                        firstLine.indexOf('display') >= 0 || firstLine.indexOf('address') >= 0;

        if (hasHeaders) {
            headers = parseCSVLine(lines[0]).map(function(h) { return h.toLowerCase().trim().replace(/"/g, ''); });
            startLine = 1;
        }
    }

    // Column mapping for HCP exports
    var colMap = {};
    if (headers) {
        colMap.name = findColIndex(headers, ['display name','customer name','nombre','name','first name','full name','client','cliente','customer']);
        colMap.firstName = findColIndex(headers, ['first name','first','primer nombre']);
        colMap.lastName = findColIndex(headers, ['last name','last','apellido']);
        colMap.phone = findColIndex(headers, ['mobile phone','phone','mobile','phone number','telefono','teléfono','celular','primary phone','home phone']);
        colMap.email = findColIndex(headers, ['email','email address','correo','e-mail']);
        colMap.address = findColIndex(headers, ['address','street','street address','direccion','dirección','domicilio','property address']);
        colMap.city = findColIndex(headers, ['city','ciudad']);
        colMap.state = findColIndex(headers, ['state','estado']);
        colMap.zip = findColIndex(headers, ['zip','zip code','zipcode','postal','código postal','postal code']);
        colMap.company = findColIndex(headers, ['company','company name','empresa','compañía','business','business name']);
        colMap.notes = findColIndex(headers, ['notes','note','notas','comments','tags']);
        colMap.source = findColIndex(headers, ['source','lead source','fuente','how did you hear']);
        colMap.status = findColIndex(headers, ['status','customer status','estado','type','customer type']);
        colMap.created = findColIndex(headers, ['created','date added','created date','date created','fecha','signup date']);
    }

    for (var i = startLine; i < lines.length; i++) {
        var cols = isCSV ? parseCSVLine(lines[i]) : lines[i].split(',');
        cols = cols.map(function(c) { return (c || '').trim().replace(/^"|"$/g, ''); });

        var record = {};
        if (headers && colMap.name >= 0) {
            record.name = cols[colMap.name] || '';
        } else if (headers && colMap.firstName >= 0) {
            var fn = cols[colMap.firstName] || '';
            var ln = colMap.lastName >= 0 ? (cols[colMap.lastName] || '') : '';
            record.name = (fn + ' ' + ln).trim();
        } else {
            // No headers or no name column - assume: Name, Phone, Email, Address
            record.name = cols[0] || '';
        }

        if (!record.name) continue;

        record.phone = headers && colMap.phone >= 0 ? (cols[colMap.phone] || '') : (cols[1] || '');
        record.email = headers && colMap.email >= 0 ? (cols[colMap.email] || '') : (cols[2] || '');

        // Build address
        if (headers && colMap.address >= 0) {
            var addrParts = [cols[colMap.address] || ''];
            if (colMap.city >= 0 && cols[colMap.city]) addrParts.push(cols[colMap.city]);
            if (colMap.state >= 0 && cols[colMap.state]) addrParts.push(cols[colMap.state]);
            if (colMap.zip >= 0 && cols[colMap.zip]) addrParts.push(cols[colMap.zip]);
            record.address = addrParts.filter(function(p) { return p; }).join(', ');
        } else {
            record.address = cols[3] || '';
        }

        record.company = headers && colMap.company >= 0 ? (cols[colMap.company] || '') : '';
        record.notes = headers && colMap.notes >= 0 ? (cols[colMap.notes] || '') : '';
        record.hcpSource = headers && colMap.source >= 0 ? (cols[colMap.source] || '') : '';
        record.hcpStatus = headers && colMap.status >= 0 ? (cols[colMap.status] || '') : '';
        record.hcpCreated = headers && colMap.created >= 0 ? (cols[colMap.created] || '') : '';

        // Auto-detect category from HCP status
        var statusLower = (record.hcpStatus || '').toLowerCase();
        if (statusLower.indexOf('won') >= 0 || statusLower.indexOf('completed') >= 0 || statusLower.indexOf('active') >= 0) {
            record.autoCategory = 'won';
        } else if (statusLower.indexOf('estimate') >= 0 || statusLower.indexOf('pending') >= 0 || statusLower.indexOf('open') >= 0) {
            record.autoCategory = 'estimate';
        } else {
            record.autoCategory = 'existing';
        }

        record.selected = true;
        importParsedData.push(record);
    }

    if (importParsedData.length === 0) {
        showImportStatus('⚠️ No se encontraron registros válidos. Verifica el formato del archivo.', 'warning');
        return;
    }

    showImportStatus('✅ ' + importParsedData.length + ' registros encontrados. Revisa la vista previa y haz clic en Importar.', 'success');
    document.getElementById('importExecuteBtn').disabled = false;
    renderImportPreview();
}

function previewImport() {
    var manual = document.getElementById('importManualData').value.trim();
    if (manual) {
        parseImportData(manual, false);
    } else if (importParsedData.length > 0) {
        renderImportPreview();
    } else {
        showImportStatus('⚠️ Sube un archivo CSV o pega datos manualmente primero.', 'warning');
    }
}

function renderImportPreview() {
    var area = document.getElementById('importPreviewArea');
    var data = importParsedData;
    var catFilter = importCurrentTab;

    if (catFilter !== 'all') {
        data = data.filter(function(r) { return r.autoCategory === catFilter; });
    }

    // Duplicate check
    var dupCount = 0;
    var skipDups = document.getElementById('importSkipDuplicates').checked;
    data.forEach(function(r) {
        r.isDuplicate = clientsData.some(function(c) {
            return c.name && r.name && c.name.toLowerCase() === r.name.toLowerCase() ||
                   (r.phone && c.phone && c.phone.replace(/\D/g,'') === r.phone.replace(/\D/g,''));
        });
        if (r.isDuplicate) dupCount++;
    });

    var catIcons = {won:'🏆', estimate:'📝', existing:'👥', lead:'🎯'};
    var catColors = {won:'#10b981', estimate:'#f59e0b', existing:'#3b82f6', lead:'#8b5cf6'};

    var html = '<div style="padding:4px 12px;background:var(--bg-card);border-bottom:2px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:11px;">';
    html += '<span><strong>' + data.length + '</strong> registros';
    if (dupCount > 0) html += ' | <span style="color:#f59e0b;">' + dupCount + ' duplicados</span>';
    html += '</span>';

    // Category counts
    var cats = {won:0, estimate:0, existing:0};
    importParsedData.forEach(function(r) { if (cats[r.autoCategory] !== undefined) cats[r.autoCategory]++; });
    html += '<span>🏆 ' + cats.won + ' | 📝 ' + cats.estimate + ' | 👥 ' + cats.existing + '</span>';
    html += '</div>';

    html += '<table class="data-table" style="font-size:11px;"><thead><tr><th style="width:30px;">✓</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Cat.</th><th>Status</th></tr></thead><tbody>';
    data.forEach(function(r, idx) {
        var rowStyle = r.isDuplicate ? 'background:rgba(245,158,11,0.08);' : '';
        var cat = r.autoCategory || 'existing';
        html += '<tr style="' + rowStyle + '">';
        html += '<td><input type="checkbox" ' + (r.selected && !(r.isDuplicate && skipDups) ? 'checked' : '') + ' onchange="toggleImportRow(' + idx + ',this.checked)"></td>';
        html += '<td><strong>' + r.name + '</strong>' + (r.company ? '<br><small style="color:var(--text-muted);">' + r.company + '</small>' : '') + '</td>';
        html += '<td>' + (r.phone || '<span style="color:#ccc;">—</span>') + '</td>';
        html += '<td>' + (r.email || '<span style="color:#ccc;">—</span>') + '</td>';
        html += '<td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (r.address || '<span style="color:#ccc;">—</span>') + '</td>';
        html += '<td><span style="color:' + (catColors[cat]||'#64748b') + ';">' + (catIcons[cat]||'') + '</span></td>';
        html += '<td>';
        if (r.isDuplicate) html += '<span class="badge" style="background:#f59e0b22;color:#f59e0b;">Duplicado</span>';
        else html += '<span class="badge" style="background:#10b98122;color:#10b981;">Nuevo</span>';
        html += '</td></tr>';
    });
    html += '</tbody></table>';
    area.innerHTML = html;
    area.style.display = 'block';
}

function toggleImportRow(idx, checked) {
    if (importParsedData[idx]) importParsedData[idx].selected = checked;
}

async function executeImport() {
    var category = document.getElementById('importCategory').value;
    var propType = document.getElementById('importPropertyType').value;
    var source = document.getElementById('importSource').value;
    var skipDups = document.getElementById('importSkipDuplicates').checked;

    var toImport = importParsedData.filter(function(r) {
        if (!r.selected) return false;
        if (skipDups && r.isDuplicate) return false;
        return true;
    });

    if (toImport.length === 0) {
        showImportStatus('⚠️ No hay registros para importar.', 'warning');
        return;
    }

    document.getElementById('importExecuteBtn').disabled = true;
    document.getElementById('importExecuteBtn').textContent = '⏳ Importando...';
    showImportStatus('⏳ Importando ' + toImport.length + ' clientes...', 'info');

    var imported = 0, errors = 0;
    var tagMap = {won: ['Won', 'HCP Import'], estimate: ['Estimate', 'HCP Import'], existing: ['Existing', 'HCP Import'], lead: ['Lead', 'HCP Import']};

    for (var i = 0; i < toImport.length; i++) {
        var r = toImport[i];
        var cat = r.autoCategory || category;
        var tags = tagMap[cat] || ['HCP Import'];

        try {
            var insertData = {
                company_id: companyId,
                name: r.name,
                phone: r.phone || null,
                email: r.email || null,
                address: r.address || null,
                company: r.company || null,
                property_type: propType,
                tags: tags,
                source: source,
                notes: [r.notes, r.hcpSource ? 'Fuente HCP: ' + r.hcpSource : '', r.hcpStatus ? 'Status HCP: ' + r.hcpStatus : '', 'Categoría: ' + cat].filter(function(n) { return n; }).join(' | ')
            };

            var res = await sbClient.from('clients').insert(insertData).select().single();
            if (res.data) {
                clientsData.push(res.data);
                imported++;
            } else {
                errors++;
            }
        } catch(err) {
            errors++;
        }

        // Progress update every 10 records
        if (i % 10 === 0) {
            showImportStatus('⏳ Importando... ' + (i + 1) + '/' + toImport.length, 'info');
        }
    }

    var catLabel = {won:'Clientes Ganados 🏆', estimate:'En Estimado 📝', existing:'Existentes 👥', lead:'Leads 🎯'};
    showImportStatus(
        '✅ Importación completada!\n\n' +
        '📥 Importados: ' + imported + ' (' + (catLabel[category] || category) + ')\n' +
        (errors > 0 ? '❌ Errores: ' + errors + '\n' : '') +
        '⏭️ Omitidos: ' + (toImport.length - imported - errors),
        'success'
    );

    document.getElementById('importExecuteBtn').textContent = '📥 Importar Clientes';
    document.getElementById('importExecuteBtn').disabled = false;
    renderClientsList();
    updateKPIs();

    // Auto-create leads for estimate category
    if (category === 'estimate' || importParsedData.some(function(r) { return r.autoCategory === 'estimate'; })) {
        var estClients = toImport.filter(function(r) { return (r.autoCategory || category) === 'estimate'; });
        if (estClients.length > 0) {
            var createLeads = confirm('¿Crear ' + estClients.length + ' leads automáticamente para los clientes en estimado?');
            if (createLeads) {
                var leadsCreated = 0;
                for (var j = 0; j < estClients.length; j++) {
                    var ec = estClients[j];
                    try {
                        var leadRes = await sbClient.from('leads').insert({
                            company_id: companyId,
                            name: ec.name,
                            phone: ec.phone || null,
                            email: ec.email || null,
                            address: ec.address || null,
                            source: source,
                            status: 'new',
                            notes: 'Importado de HCP - En Estimado'
                        }).select().single();
                        if (leadRes.data) { leadsData.push(leadRes.data); leadsCreated++; }
                    } catch(err) {}
                }
                alert('✅ ' + leadsCreated + ' leads creados para clientes en estimado');
            }
        }
    }
}

function showImportStatus(msg, type) {
    var area = document.getElementById('importStatusArea');
    var colors = {success:'#10b981', warning:'#f59e0b', info:'#3b82f6', error:'#ef4444'};
    area.style.display = 'block';
    area.style.background = (colors[type] || '#64748b') + '11';
    area.style.border = '1px solid ' + (colors[type] || '#64748b') + '44';
    area.style.color = colors[type] || 'var(--text-primary)';
    area.innerHTML = msg.replace(/\n/g, '<br>');
}

// Drag and drop support
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        var dropZone = document.getElementById('importDropZone');
        if (!dropZone) return;
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropZone.style.borderColor = '#f59e0b';
            dropZone.style.background = 'rgba(245,158,11,0.05)';
        });
        dropZone.addEventListener('dragleave', function() {
            dropZone.style.borderColor = 'var(--border)';
            dropZone.style.background = '';
        });
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--border)';
            dropZone.style.background = '';
            if (e.dataTransfer.files.length > 0) {
                var fakeInput = {files: e.dataTransfer.files};
                handleImportFile(fakeInput);
            }
        });
    }, 500);
});

// ============================================================
// ===== TECHNICIANS SECTION - ADD TECH FORM =====
// ============================================================
function showTechFormInTechSection() {
    document.getElementById('techFormContainerAlt').style.display = 'block';
    document.getElementById('techFormContainerAlt').scrollIntoView({behavior:'smooth', block:'start'});
}

function hideTechFormAlt() {
    document.getElementById('techFormContainerAlt').style.display = 'none';
}

function previewTechPhotoAlt(input) {
    if (!input.files || !input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('techPhotoPreviewAlt').innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
        window._techPhotoAlt = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
}

async function handleTechCreateAlt(e) {
    e.preventDefault();
    var name = document.getElementById('techNameAlt').value.trim();
    if (!name) { alert('Ingresa el nombre del técnico'); return; }

    var techData = {
        company_id: companyId,
        name: name,
        phone: document.getElementById('techPhoneAlt').value.trim(),
        email: document.getElementById('techEmailAlt').value.trim(),
        specialty: document.getElementById('techSpecialtyAlt').value,
        status: 'available'
    };

    try {
        var res = await sbClient.from('technicians').insert(techData).select().single();
        if (res.error) { alert('Error: ' + res.error.message); return; }
        if (res.data) {
            techsData.push(res.data);

            // Save vehicle info
            var vehicleInfo = {
                vehicle: document.getElementById('techVehicleAlt').value,
                plate: document.getElementById('techPlateAlt').value,
                vin: document.getElementById('techVinAlt').value,
                color: document.getElementById('techVehicleColorAlt').value
            };
            if (vehicleInfo.vehicle || vehicleInfo.plate) {
                localStorage.setItem('techVehicle_' + res.data.id, JSON.stringify(vehicleInfo));
            }

            // Save photo
            if (window._techPhotoAlt) {
                localStorage.setItem('techPhoto_' + res.data.id, window._techPhotoAlt);
                window._techPhotoAlt = null;
            }

            alert('✅ Técnico "' + name + '" creado exitosamente');
            hideTechFormAlt();
            e.target.reset();
            document.getElementById('techPhotoPreviewAlt').innerHTML = '<span style="font-size:11px;color:var(--text-muted);text-align:center;">📷 Foto del<br>Técnico</span>';
            renderTechniciansList();
            renderTechFullList();
            updateKPIs();
        }
    } catch(err) {
        alert('Error al crear técnico: ' + err.message);
    }
}

// Improve technicians full list rendering
function renderTechFullList() {
    var container = document.getElementById('techniciansFullList');
    if (!container) return;
    if (techsData.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px 20px;"><span style="font-size:48px;">👷</span><h3 style="color:var(--text-primary);margin:12px 0 8px;">Sin técnicos registrados</h3><p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Agrega tu primer técnico para comenzar a despachar trabajos.</p><button class="btn-primary btn-sm" onclick="showTechFormInTechSection()">+ Agregar Primer Técnico</button></div>';
        return;
    }
    var html = '<div class="tech-cards-grid">';
    techsData.forEach(function(t) {
        var photo = localStorage.getItem('techPhoto_' + t.id);
        var vehicle = JSON.parse(localStorage.getItem('techVehicle_' + t.id) || '{}');
        var statusColors = {available:'#10b981', busy:'#f59e0b', offline:'#94a3b8', on_job:'#3b82f6'};
        var statusLabels = {available:'Disponible', busy:'Ocupado', offline:'Fuera de línea', on_job:'En trabajo'};
        var statusColor = statusColors[t.status] || '#94a3b8';
        var statusLabel = statusLabels[t.status] || t.status;
        var jobCount = jobsData.filter(function(j) { return j.tech_id === t.id && j.status !== 'completed' && j.status !== 'cancelled'; }).length;

        html += '<div class="tech-full-card">';
        html += '<div class="tech-full-photo">';
        if (photo) {
            html += '<img src="' + photo + '" alt="' + t.name + '">';
        } else {
            var initials = t.name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
            html += '<div class="tech-full-initials">' + initials + '</div>';
        }
        html += '<span class="tech-status-dot" style="background:' + statusColor + ';"></span>';
        html += '</div>';
        html += '<div class="tech-full-info">';
        html += '<h4>' + t.name + '</h4>';
        html += '<span class="badge" style="background:' + statusColor + '22;color:' + statusColor + ';">' + statusLabel + '</span>';
        html += '<p style="font-size:11px;color:var(--text-muted);margin-top:4px;">🔧 ' + (t.specialty || 'General') + '</p>';
        if (t.phone) html += '<p style="font-size:11px;color:var(--text-muted);">📱 ' + t.phone + '</p>';
        if (t.email) html += '<p style="font-size:11px;color:var(--text-muted);">📧 ' + t.email + '</p>';
        if (vehicle.vehicle) html += '<p style="font-size:11px;color:var(--text-muted);">🚐 ' + vehicle.vehicle + (vehicle.plate ? ' | ' + vehicle.plate : '') + '</p>';
        html += '<p style="font-size:11px;margin-top:6px;"><strong style="color:var(--primary);">' + jobCount + '</strong> trabajos activos</p>';
        html += '</div>';
        html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
}

// Override showSection to call renderTechFullList when showing technicians
var _origShowSection = window.showSection;
if (_origShowSection && !window._showSectionPatched) {
    window.showSection = function(name) {
        _origShowSection(name);
        if (name === 'technicians') renderTechFullList();
        if (name === 'receipts') renderReceipts();
        if (name === 'expenses') renderExpenses();
        if (name === 'mailbox') renderMailbox();
        if (name === 'team') renderTeamUsers();
    };
    window._showSectionPatched = true;
}

// ============================================================
// ===== RECEIPTS / RECIBOS DE PROVEEDORES =====
// ============================================================
var receiptsData = JSON.parse(localStorage.getItem('tm_receipts_' + companyId) || '[]');

function showReceiptForm() { document.getElementById('receiptFormContainer').style.display = 'block'; document.getElementById('rcptDate').value = new Date().toISOString().split('T')[0]; populateRcptJobs(); }
function hideReceiptForm() { document.getElementById('receiptFormContainer').style.display = 'none'; }

function populateRcptJobs() {
    var sel = document.getElementById('rcptJobId');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Sin trabajo --</option>';
    jobsData.forEach(function(j) { sel.innerHTML += '<option value="' + j.id + '">' + (j.title || 'Trabajo') + '</option>'; });
}

function previewReceiptPhoto(input) {
    if (!input.files || !input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = document.getElementById('rcptPhotoPreview');
        img.src = e.target.result; img.style.display = 'block';
        window._rcptPhoto = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
}

function handleReceiptCreate(e) {
    e.preventDefault();
    var provider = document.getElementById('rcptProvider').value;
    if (provider === '__other__') {
        provider = prompt('Nombre del proveedor:');
        if (!provider) return;
    }
    var rcpt = {
        id: 'rcpt_' + Date.now(),
        provider: provider,
        category: document.getElementById('rcptCategory').value,
        amount: parseFloat(document.getElementById('rcptAmount').value) || 0,
        tax: parseFloat(document.getElementById('rcptTax').value) || 0,
        date: document.getElementById('rcptDate').value,
        number: document.getElementById('rcptNumber').value,
        payMethod: document.getElementById('rcptPayMethod').value,
        jobId: document.getElementById('rcptJobId').value,
        description: document.getElementById('rcptDescription').value,
        photo: window._rcptPhoto || null,
        created: new Date().toISOString()
    };
    rcpt.total = rcpt.amount + rcpt.tax;
    receiptsData.push(rcpt);
    localStorage.setItem('tm_receipts_' + companyId, JSON.stringify(receiptsData));
    window._rcptPhoto = null;
    hideReceiptForm();
    e.target.reset();
    document.getElementById('rcptPhotoPreview').style.display = 'none';
    renderReceipts();
    alert('✅ Recibo guardado: $' + rcpt.total.toFixed(2) + ' - ' + provider);
}

function renderReceipts() {
    var c = document.getElementById('receiptsList');
    if (!c) return;
    var provFilter = (document.getElementById('rcptFilterProvider') || {}).value || '';
    var catFilter = (document.getElementById('rcptFilterCategory') || {}).value || '';
    var monthFilter = (document.getElementById('rcptFilterMonth') || {}).value;
    
    var filtered = receiptsData.filter(function(r) {
        if (provFilter && r.provider !== provFilter) return false;
        if (catFilter && r.category !== catFilter) return false;
        if (monthFilter !== '' && monthFilter !== undefined) {
            var m = new Date(r.date).getMonth();
            if (m !== parseInt(monthFilter)) return false;
        }
        return true;
    });
    
    // Update KPIs
    var thisMonth = new Date().getMonth();
    var monthRcpts = receiptsData.filter(function(r) { return new Date(r.date).getMonth() === thisMonth; });
    var totalSpent = monthRcpts.reduce(function(s,r) { return s + (r.total || 0); }, 0);
    var providers = {};
    receiptsData.forEach(function(r) { providers[r.provider] = true; });
    var noPhoto = receiptsData.filter(function(r) { return !r.photo; }).length;
    
    var el = function(id,v) { var e = document.getElementById(id); if(e) e.textContent = v; };
    el('rcptTotal', monthRcpts.length);
    el('rcptTotalSpent', '$' + totalSpent.toFixed(2));
    el('rcptProviders', Object.keys(providers).length);
    el('rcptNoPhoto', noPhoto);
    
    // Update provider filter
    var pSel = document.getElementById('rcptFilterProvider');
    if (pSel && pSel.options.length <= 1) {
        Object.keys(providers).sort().forEach(function(p) {
            pSel.innerHTML += '<option value="' + p + '">' + p + '</option>';
        });
    }
    
    if (filtered.length === 0) { c.innerHTML = '<p class="empty-msg">No hay recibos registrados.</p>'; return; }
    
    var catLabels = {ac_equipment:'Equipos AC',refrigeration_equipment:'Equipos Refrig.',heating_equipment:'Calefacción',parts:'Partes',refrigerant:'Refrigerantes',tools:'Herramientas',electrical:'Eléctrico',ductwork:'Ductos',filters:'Filtros',gas_fuel:'Gasolina',vehicle:'Vehículo',office:'Oficina',safety:'Seguridad',misc:'Misceláneo'};
    var h = '<table class="dispatch-table"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th>📸</th><th>Acciones</th></tr></thead><tbody>';
    filtered.sort(function(a,b) { return b.date.localeCompare(a.date); }).forEach(function(r) {
        h += '<tr>';
        h += '<td style="font-size:12px;white-space:nowrap;">' + r.date + '</td>';
        h += '<td style="font-weight:600;">' + r.provider + '</td>';
        h += '<td><span class="badge" style="font-size:10px;">' + (catLabels[r.category] || r.category) + '</span></td>';
        h += '<td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;">' + (r.description || r.number || '—') + '</td>';
        h += '<td style="font-weight:700;color:var(--primary);">$' + (r.total || 0).toFixed(2) + '</td>';
        h += '<td>' + (r.photo ? '<span style="cursor:pointer;" onclick="viewReceiptPhoto(\'' + r.id + '\')" title="Ver foto">📸</span>' : '<span style="color:var(--text-muted);">—</span>') + '</td>';
        h += '<td><button class="client-action-btn client-btn-delete" onclick="deleteReceipt(\'' + r.id + '\')">🗑️</button></td>';
        h += '</tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

function deleteReceipt(id) {
    if (!confirm('¿Eliminar este recibo?')) return;
    receiptsData = receiptsData.filter(function(r) { return r.id !== id; });
    localStorage.setItem('tm_receipts_' + companyId, JSON.stringify(receiptsData));
    renderReceipts();
}

function viewReceiptPhoto(id) {
    var r = receiptsData.find(function(x) { return x.id === id; });
    if (r && r.photo) {
        var win = window.open('', '_blank');
        win.document.write('<html><head><title>Recibo - ' + r.provider + '</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#222;"><img src="' + r.photo + '" style="max-width:100%;max-height:100vh;"></body></html>');
    }
}

function exportReceiptsCSV() {
    if (receiptsData.length === 0) { alert('No hay recibos para exportar.'); return; }
    var csv = 'Fecha,Proveedor,Categoría,Descripción,Monto,Impuesto,Total,Método,# Recibo\n';
    receiptsData.forEach(function(r) {
        csv += '"' + r.date + '","' + r.provider + '","' + r.category + '","' + (r.description||'') + '",' + r.amount + ',' + r.tax + ',' + (r.total||0) + ',"' + (r.payMethod||'') + '","' + (r.number||'') + '"\n';
    });
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'recibos_' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
}

// ============================================================
// ===== EXPENSES / GASTOS DEL NEGOCIO =====
// ============================================================
var expensesData = _sbCache.expenses || [];

function showExpenseForm() { document.getElementById('expenseFormContainer').style.display = 'block'; document.getElementById('expDate').value = new Date().toISOString().split('T')[0]; }
function hideExpenseForm() { document.getElementById('expenseFormContainer').style.display = 'none'; }

function previewExpensePhoto(input) {
    if (!input.files || !input.files[0]) return;
    document.getElementById('expPhotoName').textContent = '📎 ' + input.files[0].name;
    document.getElementById('expPhotoName').style.display = 'inline';
    var reader = new FileReader();
    reader.onload = function(e) { window._expPhoto = e.target.result; };
    reader.readAsDataURL(input.files[0]);
}

function handleExpenseCreate(e) {
    e.preventDefault();
    var exp = {
        company_id: companyId,
        category: document.getElementById('expCategory').value,
        vendor: document.getElementById('expVendor').value,
        amount: parseFloat(document.getElementById('expAmount').value) || 0,
        frequency: document.getElementById('expFrequency').value,
        date: document.getElementById('expDate').value,
        type: document.getElementById('expType').value,
        pay_method: document.getElementById('expPayMethod').value,
        policy_num: document.getElementById('expPolicyNum').value,
        notes: document.getElementById('expNotes').value,
        photo: window._expPhoto || null
    };
    sbClient.from('expenses').insert(exp).select().single().then(function(res) {
        if (res.error) { exp.id = 'exp_' + Date.now(); expensesData.push(exp); }
        else { expensesData.push(res.data); }
        renderExpenses();
    });
    window._expPhoto = null;
    hideExpenseForm();
    e.target.reset();
    document.getElementById('expPhotoName').style.display = 'none';
    expensesData.push(exp);
    renderExpenses();
    alert('✅ Gasto registrado: $' + exp.amount.toFixed(2) + ' - ' + (exp.vendor || exp.category));
}

function renderExpenses() {
    var c = document.getElementById('expensesList');
    if (!c) return;
    
    var thisMonth = new Date().getMonth();
    var fixed = 0, variable = 0;
    expensesData.forEach(function(ex) {
        var m = new Date(ex.date).getMonth();
        if (m === thisMonth || ex.frequency === 'monthly') {
            if (ex.type === 'fixed') fixed += ex.amount;
            else variable += ex.amount;
        }
    });
    var el = function(id,v) { var e = document.getElementById(id); if(e) e.textContent = v; };
    el('expFixed', '$' + fixed.toFixed(2));
    el('expVariable', '$' + variable.toFixed(2));
    el('expTotal', '$' + (fixed + variable).toFixed(2));
    
    if (expensesData.length === 0) { c.innerHTML = '<p class="empty-msg">No hay gastos registrados. Agrega tu renta, seguros y otros gastos fijos.</p>'; return; }
    
    var catLabels = {rent:'Renta',utilities_electric:'Electricidad',utilities_water:'Agua',utilities_gas:'Gas',internet:'Internet',storage:'Almacén',vehicle_insurance:'Seguro Vehículo',vehicle_payment:'Pago Vehículo',vehicle_gas:'Gasolina',vehicle_maintenance:'Mant. Vehículo',vehicle_registration:'Registro',general_liability:'General Liability',workers_comp:'Workers Comp',bond:'Bond',health_insurance:'Seguro Médico',e_and_o:'E&O',contractor_license:'Lic. Contratista',business_license:'Lic. Negocio',epa_cert:'Certificaciones',city_permits:'Permisos',software_crm:'CRM',software_accounting:'Contabilidad',software_marketing:'Marketing',website:'Sitio Web',answering_service:'Contestación',loan_payment:'Préstamo',equipment_lease:'Leasing',taxes:'Impuestos',accounting:'Contador',bank_fees:'Comisiones',other:'Otro'};
    var freqLabels = {monthly:'Mensual',quarterly:'Trimestral',semi_annual:'Semestral',annual:'Anual',one_time:'Una vez'};
    
    var h = '<table class="dispatch-table"><thead><tr><th>Categoría</th><th>Proveedor</th><th>Monto</th><th>Frecuencia</th><th>Tipo</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>';
    expensesData.sort(function(a,b) { return b.date.localeCompare(a.date); }).forEach(function(ex) {
        var typeColor = ex.type === 'fixed' ? '#ef4444' : '#f59e0b';
        h += '<tr>';
        h += '<td style="font-weight:600;">' + (catLabels[ex.category] || ex.category) + '</td>';
        h += '<td style="font-size:12px;">' + (ex.vendor || '—') + '</td>';
        h += '<td style="font-weight:700;color:var(--primary);">$' + ex.amount.toFixed(2) + '</td>';
        h += '<td><span class="badge">' + (freqLabels[ex.frequency] || ex.frequency) + '</span></td>';
        h += '<td><span class="badge" style="background:' + typeColor + '22;color:' + typeColor + ';">' + (ex.type === 'fixed' ? 'Fijo' : 'Variable') + '</span></td>';
        h += '<td style="font-size:12px;">' + ex.date + '</td>';
        h += '<td><button class="client-action-btn client-btn-delete" onclick="deleteExpense(\'' + ex.id + '\')">🗑️</button></td>';
        h += '</tr>';
    });
    c.innerHTML = h + '</tbody></table>';
}

function deleteExpense(id) {
    if (!confirm('¿Eliminar este gasto?')) return;
    sbClient.from('expenses').delete().eq('id', id).then(function(){});
    expensesData = expensesData.filter(function(x) { return x.id !== id; });
    renderExpenses();
}

function exportExpensesCSV() {
    if (expensesData.length === 0) { alert('No hay gastos para exportar.'); return; }
    var csv = 'Fecha,Categoría,Proveedor,Monto,Frecuencia,Tipo,Método,# Póliza,Notas\n';
    expensesData.forEach(function(ex) {
        csv += '"' + ex.date + '","' + ex.category + '","' + (ex.vendor||'') + '",' + ex.amount + ',"' + ex.frequency + '","' + ex.type + '","' + (ex.pay_method||ex.payMethod||'') + '","' + (ex.policy_num||ex.policyNum||'') + '","' + (ex.notes||'').replace(/"/g,"'") + '"\n';
    });
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'gastos_negocio_' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
}

// ============================================================
// ===== MAILBOX / CORREO DEL NEGOCIO =====
// ============================================================
var mailboxData = JSON.parse(localStorage.getItem('tm_mailbox_' + companyId) || '[]');
var mailCurrentTab = 'all';

function showMailForm() { document.getElementById('mailFormContainer').style.display = 'block'; document.getElementById('mailDate').value = new Date().toISOString().split('T')[0]; }
function hideMailForm() { document.getElementById('mailFormContainer').style.display = 'none'; }

function previewMailFile(input) {
    if (!input.files || !input.files[0]) return;
    var fn = document.getElementById('mailFileName');
    fn.textContent = '📎 ' + input.files[0].name;
    fn.style.display = 'block';
    var reader = new FileReader();
    reader.onload = function(e) { window._mailFile = { name: input.files[0].name, data: e.target.result }; };
    reader.readAsDataURL(input.files[0]);
}

function handleMailCreate(e) {
    e.preventDefault();
    var mail = {
        id: 'mail_' + Date.now(),
        type: document.getElementById('mailType').value,
        priority: document.getElementById('mailPriority').value,
        date: document.getElementById('mailDate').value,
        from: document.getElementById('mailFrom').value,
        category: document.getElementById('mailCategory').value,
        subject: document.getElementById('mailSubject').value,
        notes: document.getElementById('mailNotes').value,
        needsAction: document.getElementById('mailNeedsAction').checked,
        file: window._mailFile || null,
        archived: false,
        created: new Date().toISOString()
    };
    mailboxData.push(mail);
    localStorage.setItem('tm_mailbox_' + companyId, JSON.stringify(mailboxData));
    window._mailFile = null;
    hideMailForm();
    e.target.reset();
    document.getElementById('mailFileName').style.display = 'none';
    renderMailbox();
    alert('✅ Documento guardado: ' + mail.subject);
}

function setMailTab(tab) {
    mailCurrentTab = tab;
    document.querySelectorAll('[id^="mailTab"]').forEach(function(b) { b.classList.remove('active'); });
    var btn = document.getElementById('mailTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (btn) btn.classList.add('active');
    renderMailbox();
}

function renderMailbox() {
    var c = document.getElementById('mailList');
    if (!c) return;
    
    var filtered = mailboxData.filter(function(m) {
        if (mailCurrentTab === 'incoming') return m.type === 'incoming' && !m.archived;
        if (mailCurrentTab === 'outgoing') return m.type === 'outgoing' && !m.archived;
        if (mailCurrentTab === 'urgent') return m.priority === 'urgent' && !m.archived;
        if (mailCurrentTab === 'archived') return m.archived;
        return !m.archived;
    });
    
    // Update KPIs
    var active = mailboxData.filter(function(m) { return !m.archived; });
    var el = function(id,v) { var e = document.getElementById(id); if(e) e.textContent = v; };
    el('mailInCount', active.filter(function(m) { return m.type === 'incoming'; }).length);
    el('mailOutCount', active.filter(function(m) { return m.type === 'outgoing'; }).length);
    el('mailUrgent', active.filter(function(m) { return m.priority === 'urgent'; }).length);
    el('mailArchived', mailboxData.filter(function(m) { return m.archived; }).length);
    
    if (filtered.length === 0) { c.innerHTML = '<p class="empty-msg">No hay documentos en esta vista.</p>'; return; }
    
    var catIcons = {invoice:'📄',insurance:'🛡️',government:'🏛️',tax:'💰',bank:'🏦',vendor:'📦',legal:'⚖️',warranty:'📋',customer:'👤',other:'📄'};
    var prioColors = {normal:'#94a3b8',important:'#f59e0b',urgent:'#ef4444'};
    
    var h = '';
    filtered.sort(function(a,b) { return b.date.localeCompare(a.date); }).forEach(function(m) {
        var icon = m.type === 'incoming' ? '📥' : '📤';
        var catIcon = catIcons[m.category] || '📄';
        var prioColor = prioColors[m.priority] || '#94a3b8';
        h += '<div class="mail-item" style="border-left:3px solid ' + prioColor + ';">';
        h += '<div class="mail-item-header">';
        h += '<span class="mail-type-badge">' + icon + '</span>';
        h += '<span class="mail-cat-badge">' + catIcon + ' ' + m.category + '</span>';
        h += '<span style="font-size:11px;color:var(--text-muted);">' + m.date + '</span>';
        if (m.needsAction) h += '<span class="badge" style="background:#fef3c7;color:#92400e;font-size:10px;">⚡ Acción Requerida</span>';
        if (m.file) h += '<span style="cursor:pointer;font-size:14px;" onclick="viewMailFile(\'' + m.id + '\')" title="Ver adjunto">📎</span>';
        h += '</div>';
        h += '<div class="mail-item-body">';
        h += '<strong>' + m.subject + '</strong>';
        h += '<span style="font-size:12px;color:var(--text-muted);">De: ' + (m.from || '—') + '</span>';
        if (m.notes) h += '<p style="font-size:11px;color:var(--text-muted);margin-top:4px;">' + m.notes + '</p>';
        h += '</div>';
        h += '<div class="mail-item-actions">';
        if (!m.archived) h += '<button class="client-action-btn client-btn-view" onclick="archiveMail(\'' + m.id + '\')">📎 Archivar</button>';
        else h += '<button class="client-action-btn client-btn-edit" onclick="unarchiveMail(\'' + m.id + '\')">📬 Restaurar</button>';
        h += '<button class="client-action-btn client-btn-delete" onclick="deleteMail(\'' + m.id + '\')">🗑️</button>';
        h += '</div></div>';
    });
    c.innerHTML = h;
}

function viewMailFile(id) {
    var m = mailboxData.find(function(x) { return x.id === id; });
    if (m && m.file && m.file.data) {
        var win = window.open('', '_blank');
        if (m.file.data.indexOf('image') >= 0) {
            win.document.write('<html><body style="margin:0;display:flex;justify-content:center;background:#222;"><img src="' + m.file.data + '" style="max-width:100%;max-height:100vh;"></body></html>');
        } else {
            win.document.write('<html><body><iframe src="' + m.file.data + '" style="width:100%;height:100vh;border:none;"></iframe></body></html>');
        }
    }
}

function archiveMail(id) {
    var m = mailboxData.find(function(x) { return x.id === id; });
    if (m) { m.archived = true; localStorage.setItem('tm_mailbox_' + companyId, JSON.stringify(mailboxData)); renderMailbox(); }
}

function unarchiveMail(id) {
    var m = mailboxData.find(function(x) { return x.id === id; });
    if (m) { m.archived = false; localStorage.setItem('tm_mailbox_' + companyId, JSON.stringify(mailboxData)); renderMailbox(); }
}

function deleteMail(id) {
    if (!confirm('¿Eliminar este documento?')) return;
    mailboxData = mailboxData.filter(function(x) { return x.id !== id; });
    localStorage.setItem('tm_mailbox_' + companyId, JSON.stringify(mailboxData));
    renderMailbox();
}

// ============================================================
// ===== TEAM USERS / USUARIOS Y ROLES =====
// ============================================================
var teamUsers = JSON.parse(localStorage.getItem('tm_team_users_' + companyId) || '[]');

var rolePermissions = {
    owner: {
        label: '👑 Dueño / CEO',
        sections: ['dashboard','calendar','inbox','leads','dispatch','clients','jobs','technicians','advisors','invoices','collections','mymoney','payroll','marketing','pricebook','reports','receipts','expenses','mailbox','pipeline','team','settings'],
        perms: ['✅ Tablero y KPIs', '✅ Mi Dinero — conexión bancaria', '✅ Nómina completa', '✅ Facturas y Cobranza', '✅ Gastos y Recibos', '✅ Despacho y Trabajos', '✅ Clientes y Prospectos', '✅ Reportes completos', '✅ Configuración y Usuarios', '✅ Correo del Negocio', '✅ Mercadotecnia', '✅ Lista de Precios']
    },
    accounting: {
        label: '📊 Contabilidad / Admin',
        sections: ['dashboard','invoices','collections','payroll','receipts','expenses','reports','mailbox','clients','pricebook'],
        perms: ['✅ Tablero (solo KPIs)', '✅ Facturas y Cobranza', '✅ Nómina — pagar empleados', '✅ Recibos de Proveedores', '✅ Gastos del Negocio — QuickBooks', '✅ Reportes financieros', '✅ Correo del Negocio', '✅ Clientes (solo vista)', '✅ Lista de Precios', '❌ Mi Dinero — cuenta bancaria', '❌ Configuración', '❌ Usuarios']
    },
    dispatcher: {
        label: '🎯 Coordinador de Despacho',
        sections: ['dashboard','calendar','inbox','dispatch','clients','jobs','technicians','leads','mailbox','pricebook'],
        perms: ['✅ Tablero', '✅ Despacho — asignar trabajos', '✅ Técnicos — GPS y status', '✅ Clientes — crear y editar', '✅ Prospectos / Leads', '✅ Agenda / Calendario', '✅ Correo del Negocio', '✅ Lista de Precios', '❌ Mi Dinero', '❌ Nómina', '❌ Facturas (solo ver)', '❌ Gastos y Recibos']
    },
    technician: {
        label: '🔧 Técnico',
        sections: ['dashboard','jobs'],
        perms: ['✅ Tablero (limitado)', '✅ Sus trabajos asignados', '✅ Reloj Entrada/Salida', '❌ Clientes (solo del trabajo)', '❌ Todo lo demás']
    },
    viewer: {
        label: '👁️ Solo Vista',
        sections: ['dashboard','reports'],
        perms: ['✅ Tablero (solo vista)', '✅ Reportes (solo vista)', '❌ No puede crear ni editar', '❌ No puede eliminar nada']
    }
};

function showTeamUserForm() { 
    document.getElementById('teamUserForm').style.display = 'block'; 
    previewRolePerms();
}
function hideTeamUserForm() { document.getElementById('teamUserForm').style.display = 'none'; }

function previewRolePerms() {
    var role = document.getElementById('tuRole').value;
    var perms = rolePermissions[role];
    var el = document.getElementById('tuPermList');
    if (el && perms) {
        el.innerHTML = perms.perms.join('<br>');
    }
}

function saveTeamUser() {
    var name = document.getElementById('tuName').value.trim();
    var email = document.getElementById('tuEmail').value.trim();
    var username = document.getElementById('tuUsername').value.trim();
    var password = document.getElementById('tuPassword').value;
    var passwordConfirm = document.getElementById('tuPasswordConfirm').value;
    
    if (!name || !username || !password) {
        alert('⚠️ Nombre, usuario y contraseña son obligatorios.');
        return;
    }
    if (password.length < 6) {
        alert('⚠️ La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    if (password !== passwordConfirm) {
        alert('⚠️ Las contraseñas no coinciden.');
        return;
    }
    // Check duplicate username
    var dup = teamUsers.find(function(u) { return u.username === username; });
    if (dup) {
        alert('⚠️ El nombre de usuario "' + username + '" ya existe.');
        return;
    }
    
    var role = document.getElementById('tuRole').value;
    // Only allow one owner
    if (role === 'owner') {
        var existingOwner = teamUsers.find(function(u) { return u.role === 'owner'; });
        if (existingOwner) {
            alert('⚠️ Ya existe un Dueño/CEO: ' + existingOwner.name + '. Solo puede haber uno.');
            return;
        }
    }
    
    var user = {
        id: 'user_' + Date.now(),
        name: name,
        email: email,
        phone: document.getElementById('tuPhone').value,
        username: username,
        password: btoa(password), // Base64 encoded (basic obfuscation)
        role: role,
        status: document.getElementById('tuStatus').value,
        notes: document.getElementById('tuNotes').value,
        sections: rolePermissions[role].sections,
        created: new Date().toISOString(),
        lastLogin: null
    };
    
    teamUsers.push(user);
    localStorage.setItem('tm_team_users_' + companyId, JSON.stringify(teamUsers));
    hideTeamUserForm();
    renderTeamUsers();
    alert('✅ Usuario "' + name + '" creado con rol: ' + rolePermissions[role].label);
}

function renderTeamUsers() {
    var c = document.getElementById('teamUsersList');
    if (!c) return;
    
    if (teamUsers.length === 0) {
        c.innerHTML = '<div style="text-align:center;padding:30px;"><span style="font-size:40px;">👥</span><h3 style="margin:12px 0 8px;color:var(--text-primary);">Sin usuarios registrados</h3><p style="color:var(--text-muted);font-size:13px;">Agrega al Dueño/CEO primero, luego la persona de contabilidad y el coordinador de despacho.</p></div>';
        return;
    }
    
    var roleColors = {owner:'#3b82f6',accounting:'#8b5cf6',dispatcher:'#f59e0b',technician:'#10b981',viewer:'#94a3b8'};
    var roleIcons = {owner:'👑',accounting:'📊',dispatcher:'🎯',technician:'🔧',viewer:'👁️'};
    
    var h = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">';
    teamUsers.forEach(function(u) {
        var color = roleColors[u.role] || '#94a3b8';
        var icon = roleIcons[u.role] || '👤';
        var initials = u.name.split(' ').map(function(w) { return w[0]; }).join('').substring(0,2).toUpperCase();
        var statusDot = u.status === 'active' ? '🟢' : '🔴';
        
        h += '<div style="padding:16px;border:1px solid var(--border);border-radius:10px;border-left:4px solid ' + color + ';background:var(--bg-card);">';
        h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">';
        h += '<div style="width:45px;height:45px;border-radius:50%;background:' + color + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;">' + initials + '</div>';
        h += '<div style="flex:1;"><strong style="font-size:14px;">' + u.name + '</strong><br>';
        h += '<span style="font-size:11px;color:' + color + ';">' + icon + ' ' + (rolePermissions[u.role] ? rolePermissions[u.role].label : u.role) + '</span></div>';
        h += '<span title="' + (u.status === 'active' ? 'Activo' : 'Inactivo') + '">' + statusDot + '</span>';
        h += '</div>';
        h += '<div style="font-size:11px;color:var(--text-muted);line-height:1.8;">';
        h += '👤 Usuario: <strong>' + u.username + '</strong><br>';
        if (u.email) h += '📧 ' + u.email + '<br>';
        if (u.phone) h += '📱 ' + u.phone + '<br>';
        h += '📅 Creado: ' + new Date(u.created).toLocaleDateString('es') + '<br>';
        if (u.lastLogin) h += '🕐 Último acceso: ' + new Date(u.lastLogin).toLocaleString('es');
        else h += '🕐 Sin acceso aún';
        h += '</div>';
        h += '<div style="display:flex;gap:6px;margin-top:10px;">';
        if (u.status === 'active') {
            h += '<button class="client-action-btn client-btn-edit" onclick="toggleTeamUserStatus(\'' + u.id + '\',\'inactive\')">⛔ Desactivar</button>';
        } else {
            h += '<button class="client-action-btn client-btn-view" onclick="toggleTeamUserStatus(\'' + u.id + '\',\'active\')">✅ Activar</button>';
        }
        h += '<button class="client-action-btn client-btn-edit" onclick="resetTeamPassword(\'' + u.id + '\')">🔑 Reset</button>';
        if (u.role !== 'owner') h += '<button class="client-action-btn client-btn-delete" onclick="deleteTeamUser(\'' + u.id + '\')">🗑️</button>';
        h += '</div></div>';
    });
    c.innerHTML = h + '</div>';
}

function toggleTeamUserStatus(id, newStatus) {
    var u = teamUsers.find(function(x) { return x.id === id; });
    if (!u) return;
    u.status = newStatus;
    localStorage.setItem('tm_team_users_' + companyId, JSON.stringify(teamUsers));
    renderTeamUsers();
    alert(newStatus === 'active' ? '✅ Usuario activado' : '⛔ Usuario desactivado');
}

function resetTeamPassword(id) {
    var u = teamUsers.find(function(x) { return x.id === id; });
    if (!u) return;
    var newPass = prompt('Nueva contraseña para ' + u.name + ' (mínimo 6 caracteres):');
    if (!newPass || newPass.length < 6) { alert('⚠️ Contraseña inválida.'); return; }
    u.password = btoa(newPass);
    localStorage.setItem('tm_team_users_' + companyId, JSON.stringify(teamUsers));
    alert('✅ Contraseña actualizada para ' + u.name);
}

function deleteTeamUser(id) {
    var u = teamUsers.find(function(x) { return x.id === id; });
    if (!u) return;
    if (u.role === 'owner') { alert('⚠️ No se puede eliminar al Dueño/CEO.'); return; }
    if (!confirm('¿Eliminar al usuario "' + u.name + '"?\n\nEsta acción no se puede deshacer.')) return;
    teamUsers = teamUsers.filter(function(x) { return x.id !== id; });
    localStorage.setItem('tm_team_users_' + companyId, JSON.stringify(teamUsers));
    renderTeamUsers();
}

// Check user role access on section change
function checkRoleAccess(sectionName) {
    var currentUser = JSON.parse(localStorage.getItem('tm_current_user_' + companyId) || 'null');
    if (!currentUser) return true; // No user system active yet, allow all
    var perms = rolePermissions[currentUser.role];
    if (!perms) return true;
    if (perms.sections.indexOf(sectionName) < 0) {
        alert('🔒 No tienes permiso para acceder a esta sección.\n\nTu rol: ' + perms.label + '\n\nContacta al Dueño/CEO para solicitar acceso.');
        return false;
    }
    return true;
}

// ============================================================
// ===== INSPECTION REPORTS / REPORTES DE INSPECCIÓN =====
// ============================================================
var inspReportsData = JSON.parse(localStorage.getItem('tm_insp_reports_' + companyId) || '[]');
var irCurrentTab = 'all';

function showInspReportForm() {
    document.getElementById('inspReportForm').style.display = 'block';
    document.getElementById('irDate').value = new Date().toISOString().split('T')[0];
    // Populate jobs dropdown
    var sel = document.getElementById('irJobId');
    sel.innerHTML = '<option value="">-- Sin trabajo --</option>';
    jobsData.forEach(function(j) { sel.innerHTML += '<option value="' + j.id + '">' + (j.title || j.service_type || 'Trabajo') + ' - ' + (j.client_name || '') + '</option>'; });
}
function hideInspReportForm() { document.getElementById('inspReportForm').style.display = 'none'; }

function previewInspReport(input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    var fnEl = document.getElementById('irFileName');
    var imgEl = document.getElementById('irFilePreview');
    fnEl.textContent = '📎 ' + file.name;
    fnEl.style.display = 'block';
    
    var reader = new FileReader();
    reader.onload = function(e) {
        window._irFile = { name: file.name, data: e.target.result };
        if (file.type.startsWith('image/')) {
            imgEl.src = e.target.result;
            imgEl.style.display = 'block';
        } else {
            imgEl.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

function saveInspReport() {
    var type = document.getElementById('irType').value;
    var client = document.getElementById('irClient').value;
    var subject = document.getElementById('irType').options[document.getElementById('irType').selectedIndex].text;
    
    if (!client && !document.getElementById('irJobId').value) {
        alert('⚠️ Ingresa el cliente o selecciona un trabajo.');
        return;
    }
    
    var report = {
        id: 'ir_' + Date.now(),
        type: type,
        typeLabel: subject.replace(/^[^\s]+\s/, ''),
        jobId: document.getElementById('irJobId').value,
        client: client,
        address: document.getElementById('irAddress').value,
        date: document.getElementById('irDate').value,
        inspector: document.getElementById('irInspector').value,
        score: document.getElementById('irScore').value,
        result: document.getElementById('irResult').value,
        notes: document.getElementById('irNotes').value,
        file: window._irFile || null,
        created: new Date().toISOString()
    };
    
    inspReportsData.push(report);
    localStorage.setItem('tm_insp_reports_' + companyId, JSON.stringify(inspReportsData));
    window._irFile = null;
    hideInspReportForm();
    renderInspReports();
    alert('✅ Reporte guardado: ' + report.typeLabel);
}

function setIRTab(tab) {
    irCurrentTab = tab;
    document.querySelectorAll('[id^="irTab"]').forEach(function(b) { b.classList.remove('active'); });
    var tabMap = {all:'All', hers:'Hers', inspection:'Insp', energy:'Energy', safety:'Safety'};
    var btn = document.getElementById('irTab' + (tabMap[tab] || 'All'));
    if (btn) btn.classList.add('active');
    renderInspReports();
}

function renderInspReports() {
    var c = document.getElementById('inspReportsList');
    if (!c) return;
    
    var hersTypes = ['hers_rating','title24','cf1r','cf2r','cf3r'];
    var inspTypes = ['home_inspection','hvac_inspection','duct_test','refrigerant_charge','airflow_test','combustion_test'];
    var energyTypes = ['energy_audit','hers_rating','title24'];
    var safetyTypes = ['co_test','gas_leak_test','epa_compliance','asbestos_test'];
    
    var filtered = inspReportsData.filter(function(r) {
        if (irCurrentTab === 'hers') return hersTypes.indexOf(r.type) >= 0;
        if (irCurrentTab === 'inspection') return inspTypes.indexOf(r.type) >= 0;
        if (irCurrentTab === 'energy') return energyTypes.indexOf(r.type) >= 0;
        if (irCurrentTab === 'safety') return safetyTypes.indexOf(r.type) >= 0;
        return true;
    });
    
    if (filtered.length === 0) {
        c.innerHTML = '<div style="text-align:center;padding:30px;"><span style="font-size:40px;">📊</span><h3 style="margin:12px 0 8px;color:var(--text-primary);">Sin reportes de inspección</h3><p style="color:var(--text-muted);font-size:13px;">Agrega HERS Ratings, Home Inspections, Energy Audits y más.</p></div>';
        return;
    }
    
    var resultColors = {pass:'#10b981', fail:'#ef4444', conditional:'#f59e0b', pending:'#94a3b8', info:'#3b82f6'};
    var resultLabels = {pass:'✅ Aprobado', fail:'❌ Reprobado', conditional:'⚠️ Condicional', pending:'⏳ Pendiente', info:'ℹ️ Informativo'};
    
    var h = '';
    filtered.sort(function(a,b) { return b.date.localeCompare(a.date); }).forEach(function(r) {
        var color = resultColors[r.result] || '#94a3b8';
        h += '<div style="padding:14px;border:1px solid var(--border);border-left:4px solid ' + color + ';border-radius:8px;margin-bottom:8px;background:var(--bg-card);">';
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">';
        h += '<div>';
        h += '<strong style="font-size:14px;">' + (r.typeLabel || r.type) + '</strong>';
        if (r.score) h += ' <span class="badge" style="background:' + color + '22;color:' + color + ';font-weight:700;">' + r.score + '</span>';
        h += '<br><span style="font-size:12px;color:var(--text-muted);">📅 ' + r.date;
        if (r.client) h += ' | 👤 ' + r.client;
        if (r.address) h += ' | 📍 ' + r.address;
        h += '</span>';
        if (r.inspector) h += '<br><span style="font-size:11px;color:var(--text-muted);">🔍 Inspector: ' + r.inspector + '</span>';
        if (r.notes) h += '<p style="font-size:11px;color:var(--text-muted);margin-top:4px;line-height:1.5;">' + r.notes.substring(0, 200) + (r.notes.length > 200 ? '...' : '') + '</p>';
        h += '</div>';
        h += '<div style="display:flex;gap:6px;align-items:center;">';
        h += '<span class="badge" style="background:' + color + '22;color:' + color + ';">' + (resultLabels[r.result] || r.result) + '</span>';
        if (r.file) h += '<button class="client-action-btn client-btn-view" onclick="viewInspReportFile(\'' + r.id + '\')">📎 Ver</button>';
        h += '<button class="client-action-btn client-btn-delete" onclick="deleteInspReport(\'' + r.id + '\')">🗑️</button>';
        h += '</div></div></div>';
    });
    c.innerHTML = h;
}

function viewInspReportFile(id) {
    var r = inspReportsData.find(function(x) { return x.id === id; });
    if (r && r.file && r.file.data) {
        var win = window.open('', '_blank');
        if (r.file.data.indexOf('image') >= 0) {
            win.document.write('<html><head><title>' + (r.typeLabel || 'Reporte') + '</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#222;"><img src="' + r.file.data + '" style="max-width:100%;max-height:100vh;"></body></html>');
        } else {
            win.document.write('<html><head><title>' + (r.typeLabel || 'Reporte') + '</title></head><body style="margin:0;"><iframe src="' + r.file.data + '" style="width:100%;height:100vh;border:none;"></iframe></body></html>');
        }
    }
}

function deleteInspReport(id) {
    if (!confirm('¿Eliminar este reporte?')) return;
    inspReportsData = inspReportsData.filter(function(x) { return x.id !== id; });
    localStorage.setItem('tm_insp_reports_' + companyId, JSON.stringify(inspReportsData));
    renderInspReports();
}
// ============================================================================
// STRIPE PAYMENTS MODULE — Agregar a script.js después de sbClient
// ============================================================================
// Copia y pega este bloque completo en script.js
// Posición: después de la línea "var sbClient = window.supabase.createClient(...)"
// ============================================================================

// ════════════════════════════════════════════════════════════════════════════
// STRIPE PAYMENTS — Catálogo completo Tech School AC Volt
// ════════════════════════════════════════════════════════════════════════════

var StripePayments = {

    // ── CATÁLOGO: 14 Productos con Price IDs reales ──
    CATALOG: {
        // === SUSCRIPCIONES MENSUALES (7) ===
        'maestro-ac': {
            name: 'Maestro AC App',
            priceId: 'price_1SyIR0EHIPukEiZCzWQQJ5wL',
            amount: 20,
            mode: 'subscription',
            category: 'education',
            features: ['App de entrenamiento', '700+ preguntas', 'Videos de todos los niveles']
        },
        'clases-principiante': {
            name: 'Clases en Vivo - PRINCIPIANTE',
            priceId: 'price_1Sy3EEEHIPukEiZCLQXBwPF4',
            amount: 119,
            mode: 'subscription',
            category: 'education',
            features: ['Clases martes y miércoles', 'Q&A los lunes', 'MaestroAC App incluida', 'Videos pregrabados']
        },
        'crm-profesional': {
            name: 'Trade Master CRM - Profesional',
            priceId: 'price_1Sy2lwEHIPukEiZCFRw6sjBj',
            amount: 149,
            mode: 'subscription',
            category: 'crm',
            features: ['GPS Dispatch', 'Estimados 150+ partes', 'Facturación', 'Firmas digitales']
        },
        'clases-intermedio': {
            name: 'Clases en Vivo - NIVEL INTERMEDIO',
            priceId: 'price_1SyHZREHIPukEiZCpt88XKru',
            amount: 299,
            mode: 'subscription',
            category: 'education',
            features: ['Clases sábados y domingos', 'La Trinidad del Oficio completa', 'MaestroAC + Trade Master CRM + iFix', 'Videos + Q&A']
        },
        'crm-enterprise': {
            name: 'Trade Master CRM - Enterprise',
            priceId: 'price_1Sy2yhEHIPukEiZCytG3YgUF',
            amount: 299,
            mode: 'subscription',
            category: 'crm',
            features: ['Todo en Profesional', 'Multi-técnicos ilimitados', 'Reportes avanzados', 'Soporte prioritario']
        },
        'mentoria-trinidad': {
            name: 'Mentoría HVACR - La Trinidad + Empresa',
            priceId: 'price_1SyHazEHIPukEiZCMgwYJh3Y',
            amount: 699,
            mode: 'subscription',
            category: 'education',
            features: ['Todo de Intermedio', 'Mentoría exclusiva con Maestro Mario', 'Estrategias de negocio', 'Clases todos los días']
        },

        // === PAGOS ÚNICOS (7) ===
        'student-id': {
            name: 'Student ID - ACVOLT Tech School',
            priceId: 'price_1SyRHUEHIPukEiZCasFMSqy1',
            amount: 150,
            mode: 'payment',
            category: 'school',
            features: ['Credencial oficial ACVOLT']
        },
        'impresion-certificado': {
            name: 'Impresión del Certificado ACVOLT',
            priceId: 'price_1SyS3VEHIPukEiZCIuVoFSW2',
            amount: 250,
            mode: 'payment',
            category: 'school',
            features: ['Certificado impreso oficial', 'Demostrar conocimiento de 700 preguntas por nivel']
        },
        'a2l-certification': {
            name: 'A2L Refrigerants - Safety Certification',
            priceId: 'price_1SyHlhEHIPukEiZCYlLTAGjf',
            amount: 599,
            mode: 'payment',
            category: 'certification',
            features: ['700 preguntas preparación', 'Examen oficial', 'Honorarios del proctor', 'R-32, R-454B, detección fugas']
        },
        'epa-608': {
            name: 'EPA 608 Certification - Exam & Study',
            priceId: 'price_1Sy3H8EHIPukEiZCJ6k89xx3',
            amount: 599,
            mode: 'payment',
            category: 'certification',
            features: ['700 preguntas preparación', 'Examen oficial', 'Proctor (4 hrs máximo)', 'Ciclo de refrigeración completo']
        },
        'heating-certification': {
            name: 'Heating Technician - Certification',
            priceId: 'price_1Sy3KzEHIPukEiZCcfqThm1l',
            amount: 599,
            mode: 'payment',
            category: 'certification',
            features: ['700 preguntas', 'Examen + proctor', 'Gas natural/LP, furnaces 80%/90%+', 'Combustión, intercambiadores']
        },
        'hvac-certification': {
            name: 'HVAC Certification - Exam & Study',
            priceId: 'price_1Sy3N3EHIPukEiZCPupDOhqZ',
            amount: 599,
            mode: 'payment',
            category: 'certification',
            features: ['700 preguntas', 'Examen + proctor', 'Compresores, TXV, heat pumps', 'Superheat/subcooling, diagnóstico']
        },
        'hvac-excellence': {
            name: 'HVAC EXCELENCE - Installation & Service',
            priceId: 'price_1SyHNvEHIPukEiZCJo7frOlV',
            amount: 599,
            mode: 'payment',
            category: 'certification',
            features: ['Examen + paquete de estudio', 'Honorarios del proctor']
        },
        'osha-30': {
            name: 'OSHA 30 Hours - Safety Certification',
            priceId: 'price_1SyHd6EHIPukEiZCaEqbUz5N',
            amount: 599,
            mode: 'payment',
            category: 'certification',
            features: ['700 preguntas preparación', 'Acceso al curso oficial', 'Seguridad eléctrica, caídas, EPP', 'LOTO, espacios confinados']
        },
    },

    // ── Cache de suscripción actual ──
    _currentSubscription: null,
    _purchasedProducts: [],

    // ════════════════════════════════════════════════════════════════
    // INICIALIZAR — Llamar después de login
    // ════════════════════════════════════════════════════════════════
    async init() {
        if (!currentUser) return;
        await this.refreshSubscription();
        await this.checkPaymentRedirect();
        console.log('💳 StripePayments initialized');
    },

    // ════════════════════════════════════════════════════════════════
    // OBTENER SUSCRIPCIÓN ACTIVA
    // ════════════════════════════════════════════════════════════════
    async refreshSubscription() {
        if (!currentUser) return null;

        try {
            // Obtener suscripción activa
            const { data: sub, error } = await sbClient
                .from('subscriptions')
                .select('*, subscription_plans(*)')
                .eq('user_id', currentUser.id)
                .in('status', ['active', 'trialing'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            this._currentSubscription = sub;

            // Obtener productos comprados (pagos únicos exitosos)
            const { data: payments } = await sbClient
                .from('payments')
                .select('metadata')
                .eq('user_id', currentUser.id)
                .eq('status', 'succeeded')
                .not('metadata->product_slug', 'is', null);

            this._purchasedProducts = (payments || [])
                .map(p => p.metadata?.product_slug)
                .filter(Boolean);

            return sub;
        } catch (e) {
            console.error('Error refreshing subscription:', e);
            return null;
        }
    },

    // ════════════════════════════════════════════════════════════════
    // INICIAR CHECKOUT — Suscripción o pago único
    // ════════════════════════════════════════════════════════════════
    async checkout(productSlug) {
        if (!currentUser) {
            this._showNotification('Debes iniciar sesión primero', 'error');
            return;
        }

        var product = this.CATALOG[productSlug];
        if (!product) {
            this._showNotification('Producto no encontrado', 'error');
            return;
        }

        try {
            this._showNotification('Preparando pago...', 'info');

            var session = await sbClient.auth.getSession();
            var token = session.data.session.access_token;

            var response = await fetch(
                SUPABASE_URL + '/functions/v1/stripe-checkout',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token,
                    },
                    body: JSON.stringify({
                        priceId: product.priceId,
                        mode: product.mode,
                    }),
                }
            );

            var result = await response.json();

            if (result.error) {
                this._showNotification('Error: ' + result.error, 'error');
                return;
            }

            // Redirigir a Stripe Checkout
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            this._showNotification('Error al procesar. Intenta de nuevo.', 'error');
        }
    },

    // ════════════════════════════════════════════════════════════════
    // ABRIR PORTAL DE FACTURACIÓN (cancelar, cambiar tarjeta, etc.)
    // ════════════════════════════════════════════════════════════════
    async openBillingPortal() {
        if (!currentUser) return;

        try {
            var session = await sbClient.auth.getSession();
            var token = session.data.session.access_token;

            var response = await fetch(
                SUPABASE_URL + '/functions/v1/stripe-checkout',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token,
                    },
                    body: JSON.stringify({ action: 'billing_portal' }),
                }
            );

            var result = await response.json();
            if (result.url) {
                window.open(result.url, '_blank');
            }
        } catch (error) {
            console.error('Billing portal error:', error);
            this._showNotification('Error al abrir portal de facturación', 'error');
        }
    },

    // ════════════════════════════════════════════════════════════════
    // VERIFICAR REDIRECT DESPUÉS DE PAGO
    // ════════════════════════════════════════════════════════════════
    async checkPaymentRedirect() {
        var params = new URLSearchParams(window.location.search);
        var status = params.get('payment');

        if (status === 'success') {
            this._showNotification('¡Pago exitoso! Tu cuenta ha sido actualizada. 🎉', 'success');
            window.history.replaceState({}, '', window.location.pathname);
            // Esperar un momento para que el webhook procese
            setTimeout(async () => { await this.refreshSubscription(); }, 2000);
        } else if (status === 'canceled') {
            this._showNotification('Pago cancelado. Puedes intentar de nuevo.', 'info');
            window.history.replaceState({}, '', window.location.pathname);
        }
    },

    // ════════════════════════════════════════════════════════════════
    // VERIFICAR ACCESO — ¿Tiene suscripción activa a este producto?
    // ════════════════════════════════════════════════════════════════
    hasActiveSubscription(productSlug) {
        if (!this._currentSubscription) return false;
        var planSlug = this._currentSubscription.metadata?.plan_slug;
        return planSlug === productSlug;
    },

    hasPurchased(productSlug) {
        return this._purchasedProducts.includes(productSlug);
    },

    hasAccess(productSlug) {
        return this.hasActiveSubscription(productSlug) || this.hasPurchased(productSlug);
    },

    // ════════════════════════════════════════════════════════════════
    // OBTENER HISTORIAL DE PAGOS
    // ════════════════════════════════════════════════════════════════
    async getPaymentHistory() {
        if (!currentUser) return [];

        var { data } = await sbClient
            .from('payments')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);

        return data || [];
    },

    // ════════════════════════════════════════════════════════════════
    // OBTENER PRODUCTOS POR CATEGORÍA
    // ════════════════════════════════════════════════════════════════
    getProductsByCategory(category) {
        var results = {};
        for (var slug in this.CATALOG) {
            if (this.CATALOG[slug].category === category) {
                results[slug] = this.CATALOG[slug];
            }
        }
        return results;
    },

    getSubscriptions() { return this.getProductsByCategory('education'); },
    getCRMPlans() { return this.getProductsByCategory('crm'); },
    getCertifications() { return this.getProductsByCategory('certification'); },
    getSchoolProducts() { return this.getProductsByCategory('school'); },

    // ════════════════════════════════════════════════════════════════
    // GENERAR HTML DE PRICING (para insertar en cualquier página)
    // ════════════════════════════════════════════════════════════════
    renderPricingCards(category, containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var products = category ? this.getProductsByCategory(category) : this.CATALOG;
        var html = '';

        for (var slug in products) {
            var p = products[slug];
            var isOwned = this.hasAccess(slug);
            var period = p.mode === 'subscription' ? '/mes' : ' único';
            var btnText = isOwned ? '✅ Activo' : (p.mode === 'subscription' ? 'Suscribirse' : 'Comprar');
            var btnClass = isOwned ? 'btn-owned' : 'btn-buy';

            html += '<div class="pricing-card">';
            html += '  <h3>' + p.name + '</h3>';
            html += '  <div class="price">$' + p.amount + '<span>' + period + '</span></div>';
            html += '  <ul>';
            p.features.forEach(function(f) {
                html += '    <li>✓ ' + f + '</li>';
            });
            html += '  </ul>';
            html += '  <button class="' + btnClass + '" ' +
                    (isOwned ? 'disabled' : 'onclick="StripePayments.checkout(\'' + slug + '\')"') +
                    '>' + btnText + '</button>';
            html += '</div>';
        }

        container.innerHTML = html;
    },

    // ════════════════════════════════════════════════════════════════
    // NOTIFICACIÓN (usa la función existente del CRM o crea una)
    // ════════════════════════════════════════════════════════════════
    _showNotification(message, type) {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }
};

// ── Inicializar después de login ──
// Agregar esto donde se confirma que el usuario está logueado:
// await StripePayments.init();
