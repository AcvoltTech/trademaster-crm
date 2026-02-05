// ===== FASE 1: SISTEMA DE AUTENTICACIÓN MULTI-EMPRESA =====
// Almacenamiento de datos en localStorage (para FASE 2 usaremos Supabase)

// Inicializar datos si no existen
function initData() {
          if (!localStorage.getItem('companies')) {
                        localStorage.setItem('companies', JSON.stringify([]));
          }
          if (!localStorage.getItem('currentUser')) {
                        localStorage.setItem('currentUser', JSON.stringify(null));
          }
}

initData();

// ===== TAB SWITCHING =====
function switchTab(tab) {
          // Cambiar formularios activos
    const loginForm = document.getElementById('loginForm');
          const registerForm = document.getElementById('registerForm');
          const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tab === 'login') {
                  loginForm.classList.add('active');
                  registerForm.classList.remove('active');
                  tabBtns[0].classList.add('active');
    } else {
                  loginForm.classList.remove('active');
                  registerForm.classList.add('active');
                  tabBtns[1].classList.add('active');
    }
}

// ===== REGISTRO DE EMPRESA =====
function handleRegister() {
          const companyName = document.getElementById('regCompanyName').value.trim();
          const firstName = document.getElementById('regFirstName').value.trim();
          const lastName = document.getElementById('regLastName').value.trim();
          const email = document.getElementById('regEmail').value.trim();
          const phone = document.getElementById('regPhone').value.trim();
          const password = document.getElementById('regPassword').value;
          const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Validaciones
    if (!companyName || !firstName || !lastName || !email || !phone || !password || !confirmPassword) {
                  alert('Por favor completa todos los campos');
                  return;
    }

    if (password !== confirmPassword) {
                  alert('Las contraseñas no coinciden');
                  return;
    }

    if (password.length < 6) {
                  alert('La contraseña debe tener al menos 6 caracteres');
                  return;
    }

    // Verificar si el email ya existe
    const companies = JSON.parse(localStorage.getItem('companies')) || [];
          if (companies.find(c => c.admin.email === email)) {
                        alert('Este email ya está registrado');
                        return;
          }

    // Crear nueva empresa
    const newCompany = {
                  id: Date.now(),
                  name: companyName,
                  admin: {
                                    firstName: firstName,
                                    lastName: lastName,
                                    email: email,
                                    phone: phone,
                                    password: password // ⚠️ En FASE 2 HASHEAREMOS esto
                  },
                  createdAt: new Date().toLocaleDateString('es-ES'),
                  users: [],
                  modules: {
                                    dashboard: true,
                                    dispatch: false,
                                    sales: false,
                                    installation: false,
                                    service: false,
                                    contracts: false,
                                    leads: false,
                                    technicians: false,
                                    creditAndCollections: false
                  }
    };

    // Guardar empresa
    companies.push(newCompany);
          localStorage.setItem('companies', JSON.stringify(companies));

    // Login automático después de registro
    const currentUser = {
                  companyId: newCompany.id,
                  companyName: newCompany.name,
                  email: email,
                  firstName: firstName,
                  role: 'admin'
    };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Mostrar dashboard
    showDashboard(currentUser);
          alert('¡Empresa creada exitosamente! Bienvenido ' + firstName);
}

// ===== LOGIN =====
function handleLogin() {
          const email = document.getElementById('loginEmail').value.trim();
          const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
                  alert('Por favor completa email y contraseña');
                  return;
    }

    const companies = JSON.parse(localStorage.getItem('companies')) || [];
          const company = companies.find(c => c.admin.email === email && c.admin.password === password);

    if (!company) {
                  alert('Email o contraseña incorrectos');
                  return;
    }

    // Crear sesión del usuario
    const currentUser = {
                  companyId: company.id,
                  companyName: company.name,
                  email: email,
                  firstName: company.admin.firstName,
                  role: 'admin'
    };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Mostrar dashboard
    showDashboard(currentUser);
}

// ===== MOSTRAR DASHBOARD =====
function showDashboard(user) {
          const authPage = document.getElementById('authPage');
          const dashboardPage = document.getElementById('dashboardPage');
          const companyNameBadge = document.getElementById('companyName');

    authPage.style.display = 'none';
          dashboardPage.style.display = 'flex';
          companyNameBadge.textContent = user.companyName;

    // Mensaje de bienvenida
    console.log(`Bienvenido ${user.firstName} a ${user.companyName}`);
}

// ===== LOGOUT =====
function handleLogout() {
          if (confirm('¿Seguro que deseas cerrar sesión?')) {
                        localStorage.setItem('currentUser', JSON.stringify(null));
                        location.reload();
          }
}

// ===== CHECK SESIÓN AL CARGAR =====
window.addEventListener('DOMContentLoaded', function() {
          const currentUser = JSON.parse(localStorage.getItem('currentUser'));

                            if (currentUser && currentUser.email) {
                                          showDashboard(currentUser);
                            }
});

// ===== PRÓXIMAS FASES =====
// FASE 2: Integración con Supabase para autenticación y base de datos
// FASE 3: Dashboard con métricos
// FASE 4: Sistema de Leads con Google Maps
// ... y más módulos
