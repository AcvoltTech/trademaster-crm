
// ===== TRADE MASTER CRM - CON SUPABASE AUTH =====

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://ucowlcrddzukykbaitzt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb3dsY3JkZHp1a3lrYmFpdHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY4MDUsImV4cCI6MjA4NTg4MjgwNX0.SMZ6VA4jOfT120nUZm0U19dGE2j2MQ2sn_gGjv-oPes';

const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== VARIABLES GLOBALES =====
let leadsMap = null;
let markers = [];
let leadsData = [];
let currentUser = null;

// ===== TABS DE AUTENTICACIÓN =====
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(function(btn) { btn.classList.remove('active'); });
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');

    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';

    if (tab === 'login') {
        tabBtns[0].classList.add('active');
        loginForm.classList.add('active');
    } else {
        tabBtns[1].classList.add('active');
        registerForm.classList.add('active');
    }
}

// ===== LOGIN CON SUPABASE =====
async function handleLogin(event) {
    event.preventDefault();

    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    var errorEl = document.getElementById('loginError');

    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Iniciando sesión...';

    try {
        var result = await sbClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (result.error) {
            errorEl.textContent = result.error.message === 'Invalid login credentials'
                ? 'Email o contraseña incorrectos'
                : result.error.message;
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Iniciar Sesión';
            return;
        }

        currentUser = result.data.user;
        showDashboard();
    } catch (err) {
        errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
        errorEl.style.display = 'block';
    }

    btn.disabled = false;
    btn.textContent = 'Iniciar Sesión';
}

// ===== REGISTRO CON SUPABASE =====
async function handleRegister(event) {
    event.preventDefault();

    var companyName = document.getElementById('companyName').value;
    var firstName = document.getElementById('firstName').value;
    var lastName = document.getElementById('lastName').value;
    var email = document.getElementById('registerEmail').value;
    var phone = document.getElementById('phone').value;
    var password = document.getElementById('registerPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;
    var btn = document.getElementById('registerBtn');
    var errorEl = document.getElementById('registerError');
    var successEl = document.getElementById('registerSuccess');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (password !== confirmPassword) {
        errorEl.textContent = 'Las contraseñas no coinciden';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'La contraseña debe tener mínimo 6 caracteres';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';

    try {
        var result = await sbClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    company_name: companyName,
                    phone: phone
                }
            }
        });

        if (result.error) {
            errorEl.textContent = result.error.message;
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Crear Cuenta Empresarial';
            return;
        }

        if (result.data.user && !result.data.session) {
            successEl.textContent = '¡Cuenta creada! Revisa tu email para confirmar tu cuenta.';
            successEl.style.display = 'block';
        } else if (result.data.session) {
            currentUser = result.data.user;
            showDashboard();
        }
    } catch (err) {
        errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
        errorEl.style.display = 'block';
    }

    btn.disabled = false;
    btn.textContent = 'Crear Cuenta Empresarial';
}

// ===== MOSTRAR DASHBOARD =====
function showDashboard() {
    if (!currentUser) return;

    var meta = currentUser.user_metadata || {};
    var displayName = meta.first_name || currentUser.email.split('@')[0];
    var companyName = meta.company_name || 'Mi Empresa';
    var initial = displayName.charAt(0).toUpperCase();

    document.getElementById('authPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'grid';
    document.getElementById('companyDisplay').textContent = companyName;
    document.getElementById('userInitials').textContent = initial;
    document.getElementById('sidebarInitials').textContent = initial;
    document.getElementById('sidebarUserName').textContent = displayName;
    document.getElementById('pageTitle').textContent = 'Dashboard';

    showSection('dashboard');
    loadLeadsData();
}

// ===== NAVEGACIÓN =====
function showSection(sectionName) {
    var sections = document.querySelectorAll('.section');
    sections.forEach(function(s) { s.classList.remove('active'); });

    var target = document.getElementById(sectionName + '-section');
    if (target) target.classList.add('active');

    var titles = {
        'dashboard': 'Dashboard',
        'clients': 'Gestión de Clientes',
        'jobs': 'Gestión de Trabajos',
        'leads': 'Gestión de Leads',
        'dispatch': 'Dispatch',
        'technicians': 'Gestión de Técnicos',
        'invoices': 'Facturas',
        'collections': 'Cobranza',
        'settings': 'Configuración'
    };

    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(l) { l.classList.remove('active'); });

    var activeLink = document.querySelector('[onclick="showSection(\'' + sectionName + '\')"]');
    if (activeLink) activeLink.classList.add('active');

    if (sectionName === 'leads') {
        setTimeout(function() {
            if (!leadsMap) initLeadsMap();
            else google.maps.event.trigger(leadsMap, 'resize');
        }, 150);
    }
}

// ===== LEADS =====
function showLeadForm() {
    document.getElementById('leadFormContainer').style.display = 'block';
    document.getElementById('leadForm').reset();
}

function hideLeadForm() {
    document.getElementById('leadFormContainer').style.display = 'none';
}

function handleLeadCreate(event) {
    event.preventDefault();
    var lat = document.getElementById('leadLat').value;
    var lng = document.getElementById('leadLng').value;

    if (!lat || !lng) {
        alert('Por favor, ingresa una dirección válida para obtener coordenadas');
        return;
    }

    var leads = JSON.parse(localStorage.getItem('tm_leads')) || [];
    leads.push({
        id: Date.now(),
        userId: currentUser.id,
        name: document.getElementById('leadName').value,
        phone: document.getElementById('leadPhone').value,
        email: document.getElementById('leadEmail').value,
        service: document.getElementById('leadService').value,
        address: document.getElementById('leadAddress').value,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        notes: document.getElementById('leadNotes').value,
        status: 'new',
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('tm_leads', JSON.stringify(leads));
    hideLeadForm();
    loadLeadsData();
    alert('¡Lead creado exitosamente!');
}

function loadLeadsData() {
    var leads = JSON.parse(localStorage.getItem('tm_leads')) || [];
    leadsData = leads.filter(function(l) { return l.userId === currentUser.id; });
    document.getElementById('leadCountKPI').textContent = leadsData.length;
    renderLeadsTable();
    if (leadsMap) updateLeadsMap();
}

function renderLeadsTable() {
    var container = document.getElementById('leadsList');
    if (leadsData.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay leads registrados. Crea uno para comenzar.</p>';
        return;
    }

    var html = '<table class="leads-table"><thead><tr>';
    html += '<th>Nombre</th><th>Teléfono</th><th>Email</th>';
    html += '<th>Servicio</th><th>Estado</th><th>Dirección</th><th>Acciones</th>';
    html += '</tr></thead><tbody>';

    leadsData.forEach(function(lead) {
        html += '<tr>';
        html += '<td>' + lead.name + '</td>';
        html += '<td>' + lead.phone + '</td>';
        html += '<td>' + (lead.email || '-') + '</td>';
        html += '<td>' + lead.service + '</td>';
        html += '<td><span class="lead-status ' + lead.status + '">' + lead.status + '</span></td>';
        html += '<td>' + lead.address + '</td>';
        html += '<td><div class="lead-actions">';
        html += '<button class="btn-icon" onclick="deleteLead(\'' + lead.id + '\')" style="border-color:#ef4444;color:#ef4444;">Eliminar</button>';
        html += '</div></td>';
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function deleteLead(leadId) {
    if (confirm('¿Eliminar este lead?')) {
        var leads = JSON.parse(localStorage.getItem('tm_leads')) || [];
        localStorage.setItem('tm_leads', JSON.stringify(leads.filter(function(l) { return l.id !== parseInt(leadId); })));
        loadLeadsData();
    }
}

// ===== GOOGLE MAPS =====
function initLeadsMap() {
    leadsMap = new google.maps.Map(document.getElementById('leadsMap'), {
        zoom: 11,
        center: { lat: 34.1083, lng: -117.2898 },
        styles: [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] }
        ],
        mapTypeControl: true,
        fullscreenControl: true
    });
    updateLeadsMap();
}

function updateLeadsMap() {
    markers.forEach(function(m) { m.setMap(null); });
    markers = [];
    if (leadsData.length === 0) return;

    var bounds = new google.maps.LatLngBounds();
    leadsData.forEach(function(lead) {
        var pos = { lat: parseFloat(lead.lat), lng: parseFloat(lead.lng) };
        var marker = new google.maps.Marker({
            position: pos, map: leadsMap, title: lead.name,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#10b981', fillOpacity: 1, strokeColor: 'white', strokeWeight: 2 }
        });

        var infoContent = '<div style="color:#333;padding:8px;font-size:13px;">';
        infoContent += '<strong>' + lead.name + '</strong><br>';
        infoContent += '📞 ' + lead.phone + '<br>📍 ' + lead.address + '<br>🔧 ' + lead.service;
        infoContent += '</div>';

        var info = new google.maps.InfoWindow({ content: infoContent });
        marker.addListener('click', function() { info.open(leadsMap, marker); });
        markers.push(marker);
        bounds.extend(pos);
    });

    if (leadsData.length > 1) leadsMap.fitBounds(bounds);
    else { leadsMap.setCenter(bounds.getCenter()); leadsMap.setZoom(14); }
}

function geocodeAddress(address) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, function(results, status) {
        if (status === 'OK' && results.length > 0) {
            var loc = results[0].geometry.location;
            document.getElementById('leadLat').value = loc.lat().toFixed(6);
            document.getElementById('leadLng').value = loc.lng().toFixed(6);
            if (leadsMap) { leadsMap.setCenter(loc); leadsMap.setZoom(14); }
        } else {
            alert('No se pudo encontrar la dirección');
        }
    });
}

// ===== CONFIGURACIÓN =====
function saveSettings() {
    alert('Configuración guardada');
}

// ===== LOGOUT =====
async function logout() {
    if (confirm('¿Cerrar sesión?')) {
        await sbClient.auth.signOut();
        currentUser = null;
        location.reload();
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async function() {
    var sessionResult = await sbClient.auth.getSession();

    if (sessionResult.data.session && sessionResult.data.session.user) {
        currentUser = sessionResult.data.session.user;
        showDashboard();
    } else {
        document.getElementById('authPage').style.display = 'flex';
        document.getElementById('dashboardPage').style.display = 'none';
    }

    sbClient.auth.onAuthStateChange(function(event, session) {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            showDashboard();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            document.getElementById('authPage').style.display = 'flex';
            document.getElementById('dashboardPage').style.display = 'none';
        }
    });

    var addressInput = document.getElementById('leadAddress');
    if (addressInput) {
        addressInput.addEventListener('blur', function() {
            if (this.value) setTimeout(geocodeAddress, 300, this.value);
        });
    }
});
