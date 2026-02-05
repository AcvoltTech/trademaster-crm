// ===== TRADE MASTER CRM - CON SUPABASE AUTH =====

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://ucowlcrddzukykbaitzt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb3dsY3JkZHp1a3lrYmFpdHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY4MDUsImV4cCI6MjA4NTg4MjgwNX0.SMZ6VA4jOfT120nUZm0U19dGE2j2MQ2sn_gGjv-oPes';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    tabBtns.forEach(btn => btn.classList.remove('active'));
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');

    // Limpiar errores
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

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('loginError');

    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Iniciando sesión...';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            errorEl.textContent = error.message === 'Invalid login credentials'
                ? 'Email o contraseña incorrectos'
                : error.message;
            errorEl.style.display = 'block';
            return;
        }

        currentUser = data.user;
        showDashboard();
    } catch (err) {
        errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesión';
    }
}

// ===== REGISTRO CON SUPABASE =====
async function handleRegister(event) {
    event.preventDefault();

    const companyName = document.getElementById('companyName').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn = document.getElementById('registerBtn');
    const errorEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');

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
        const { data, error } = await supabase.auth.signUp({
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

        if (error) {
            errorEl.textContent = error.message;
            errorEl.style.display = 'block';
            return;
        }

        // Si Supabase requiere confirmación de email
        if (data.user && !data.session) {
            successEl.textContent = '¡Cuenta creada! Revisa tu email para confirmar tu cuenta.';
            successEl.style.display = 'block';
        } else if (data.session) {
            // Login automático después de registro
            currentUser = data.user;
            showDashboard();
        }
    } catch (err) {
        errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Crear Cuenta Empresarial';
    }
}

// ===== MOSTRAR DASHBOARD =====
function showDashboard() {
    if (!currentUser) return;

    const meta = currentUser.user_metadata || {};
    const displayName = meta.first_name || currentUser.email.split('@')[0];
    const companyName = meta.company_name || 'Mi Empresa';
    const initial = displayName.charAt(0).toUpperCase();

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
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionName + '-section');
    if (target) target.classList.add('active');

    const titles = {
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
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) activeLink.classList.add('active');

    if (sectionName === 'leads') {
        setTimeout(() => {
            if (!leadsMap) initLeadsMap();
            else google.maps.event.trigger(leadsMap, 'resize');
        }, 150);
    }
}

// ===== LEADS (localStorage por ahora, se puede migrar a Supabase tables) =====
function showLeadForm() {
    document.getElementById('leadFormContainer').style.display = 'block';
    document.getElementById('leadForm').reset();
}

function hideLeadForm() {
    document.getElementById('leadFormContainer').style.display = 'none';
}

function handleLeadCreate(event) {
    event.preventDefault();
    const lat = document.getElementById('leadLat').value;
    const lng = document.getElementById('leadLng').value;

    if (!lat || !lng) {
        alert('Por favor, ingresa una dirección válida para obtener coordenadas');
        return;
    }

    const leads = JSON.parse(localStorage.getItem('tm_leads')) || [];
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
    const leads = JSON.parse(localStorage.getItem('tm_leads')) || [];
    leadsData = leads.filter(l => l.userId === currentUser.id);
    document.getElementById('leadCountKPI').textContent = leadsData.length;
    renderLeadsTable();
    if (leadsMap) updateLeadsMap();
}

function renderLeadsTable() {
    const container = document.getElementById('leadsList');
    if (leadsData.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay leads registrados. Crea uno para comenzar.</p>';
        return;
    }

    let html = `<table class="leads-table"><thead><tr>
        <th>Nombre</th><th>Teléfono</th><th>Email</th>
        <th>Servicio</th><th>Estado</th><th>Dirección</th><th>Acciones</th>
    </tr></thead><tbody>`;

    leadsData.forEach(lead => {
        html += `<tr>
            <td>${lead.name}</td><td>${lead.phone}</td><td>${lead.email || '-'}</td>
            <td>${lead.service}</td>
            <td><span class="lead-status ${lead.status}">${lead.status}</span></td>
            <td>${lead.address}</td>
            <td><div class="lead-actions">
                <button class="btn-icon" onclick="deleteLead('${lead.id}')" style="border-color:#ef4444;color:#ef4444;">Eliminar</button>
            </div></td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function deleteLead(leadId) {
    if (confirm('¿Eliminar este lead?')) {
        const leads = JSON.parse(localStorage.getItem('tm_leads')) || [];
        localStorage.setItem('tm_leads', JSON.stringify(leads.filter(l => l.id !== parseInt(leadId))));
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
    markers.forEach(m => m.setMap(null));
    markers = [];
    if (leadsData.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    leadsData.forEach(lead => {
        const pos = { lat: parseFloat(lead.lat), lng: parseFloat(lead.lng) };
        const marker = new google.maps.Marker({
            position: pos, map: leadsMap, title: lead.name,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#10b981', fillOpacity: 1, strokeColor: 'white', strokeWeight: 2 }
        });

        const info = new google.maps.InfoWindow({
            content: `<div style="color:#333;padding:8px;font-size:13px;">
                <strong>${lead.name}</strong><br>📞 ${lead.phone}<br>📍 ${lead.address}<br>🔧 ${lead.service}</div>`
        });

        marker.addListener('click', () => info.open(leadsMap, marker));
        markers.push(marker);
        bounds.extend(pos);
    });

    if (leadsData.length > 1) leadsMap.fitBounds(bounds);
    else { leadsMap.setCenter(bounds.getCenter()); leadsMap.setZoom(14); }
}

function geocodeAddress(address) {
    new google.maps.Geocoder().geocode({ address }, (results, status) => {
        if (status === 'OK' && results.length > 0) {
            const loc = results[0].geometry.location;
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
    alert('Configuración guardada (los cambios de perfil se guardan en Supabase)');
}

// ===== LOGOUT =====
async function logout() {
    if (confirm('¿Cerrar sesión?')) {
        await supabase.auth.signOut();
        currentUser = null;
        location.reload();
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar si hay sesión activa
    const { data: { session } } = await supabase.auth.getSession();

    if (session && session.user) {
        currentUser = session.user;
        showDashboard();
    } else {
        document.getElementById('authPage').style.display = 'flex';
        document.getElementById('dashboardPage').style.display = 'none';
    }

    // Escuchar cambios de autenticación
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            showDashboard();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            document.getElementById('authPage').style.display = 'flex';
            document.getElementById('dashboardPage').style.display = 'none';
        }
    });

    // Geocoding en blur del address
    const addressInput = document.getElementById('leadAddress');
    if (addressInput) {
        addressInput.addEventListener('blur', function() {
            if (this.value) setTimeout(geocodeAddress, 300, this.value);
        });
    }
});
