// ===== FASE 2: DASHBOARD Y MÓDULOS PRINCIPALES =====
// Sistema de autenticación y dashboard multi-empresa

// ===== DATOS EN localStorage =====
function InitData() {
              if (!localStorage.getItem('companies')) {
                                localStorage.setItem('companies', JSON.stringify([]));
              }
              if (!localStorage.getItem('currentUser')) {
                                localStorage.setItem('currentUser', JSON.stringify(null));
              }
}

InitData();

// ===== TAB SWITCHING EN AUTENTICACIÓN =====
function switchTab(tab) {
              const loginForm = document.getElementById('loginForm');
              const registerForm = document.getElementById('registerForm');
              const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => btn.classList.remove('active'));
              loginForm.classList.remove('active');
              registerForm.classList.remove('active');

    if (tab === 'login') {
                      tabBtns[0].classList.add('active');
                      loginForm.classList.add('active');
    } else {
                      tabBtns[1].classList.add('active');
                      registerForm.classList.add('active');
    }
}

// ===== MANEJO DE LOGIN =====
function handleLogin(event) {
              event.preventDefault();

    const email = document.getElementById('loginEmail').value;
              const password = document.getElementById('loginPassword').value;

    const companies = JSON.parse(localStorage.getItem('companies')) || [];

    for (let company of companies) {
                      for (let user of company.users || []) {
                                            if (user.email === email && user.password === password) {
                                                                      const currentUser = {
                                                                                                    email: user.email,
                                                                                                    name: user.firstName,
                                                                                                    companyId: company.id,
                                                                                                    companyName: company.name
                                                                      };
                                                                      localStorage.setItem('currentUser', JSON.stringify(currentUser));
                                                                      showDashboard();
                                                                      return;
                                            }
                      }
    }

    alert('Email o contraseña incorrectos');
}

// ===== MANEJO DE REGISTRO =====
function handleRegister(event) {
              event.preventDefault();

    const companyName = document.getElementById('companyName').value;
              const firstName = document.getElementById('firstName').value;
              const lastName = document.getElementById('lastName').value;
              const email = document.getElementById('registerEmail').value;
              const phone = document.getElementById('phone').value;
              const password = document.getElementById('registerPassword').value;
              const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
                      alert('Las contraseñas no coinciden');
                      return;
    }

    const companies = JSON.parse(localStorage.getItem('companies')) || [];

    // Verificar si el email ya existe
    for (let company of companies) {
                      for (let user of company.users || []) {
                                            if (user.email === email) {
                                                                      alert('Este email ya está registrado');
                                                                      return;
                                            }
                      }
    }

    // Crear nueva empresa
    const newCompany = {
                      id: Date.now(),
                      name: companyName,
                      phone: phone,
                      users: [
                                {
                                                          email: email,
                                                          firstName: firstName,
                                                          lastName: lastName,
                                                          phone: phone,
                                                          password: password,
                                                          role: 'admin'
                                }
                                        ]
    };

    companies.push(newCompany);
              localStorage.setItem('companies', JSON.stringify(companies));

    // Auto login
    const currentUser = {
                      email: email,
                      name: firstName,
                      companyId: newCompany.id,
                      companyName: newCompany.name
    };
              localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Limpiar formulario
    document.getElementById('registerForm').reset();

    alert('¡Empresa creada exitosamente!');
              showDashboard();
}

// ===== MOSTRAR DASHBOARD =====
function showDashboard() {
              const authPage = document.getElementById('authPage');
              const dashboardPage = document.getElementById('dashboardPage');
              const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
                      return;
    }

    authPage.style.display = 'none';
              dashboardPage.style.display = 'grid';

    // Actualizar información del usuario
    document.getElementById('companyDisplay').textContent = currentUser.companyName;
              document.getElementById('userInitials').textContent = currentUser.name.charAt(0).toUpperCase();
              document.getElementById('pageTitle').textContent = 'Dashboard';

    // Mostrar primera sección (dashboard)
    showSection('dashboard');
}

// ===== MOSTRAR SECCIONES =====
function showSection(sectionName) {
              // Ocultar todas las secciones
    const sections = document.querySelectorAll('.section');
              sections.forEach(section => section.classList.remove('active'));

    // Mostrar sección seleccionada
    const targetSection = document.getElementById(sectionName + '-section');
              if (targetSection) {
                                targetSection.classList.add('active');
              }

    // Actualizar título
    const titles = {
                      'dashboard': 'Dashboard',
                      'clients': 'Gestión de Clientes',
                      'jobs': 'Gestión de Trabajos',
                      'leads': 'Gestión de Leads',
                      'dispatch': 'Dispatch - Asignación de Trabajos',
                      'technicians': 'Gestión de Técnicos',
                      'invoices': 'Gestión de Facturas',
                      'collections': 'Crédito & Cobranza',
                      'settings': 'Configuración'
    };

    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';

    // Actualizar navegación
    const navLinks = document.querySelectorAll('.nav-link');
              navLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
              if (activeLink) {
                                activeLink.classList.add('active');
              }
}

// ===== LOGOUT =====
function logout() {
              if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                                localStorage.setItem('currentUser', JSON.stringify(null));
                                location.reload();
              }
}

// ===== MODAL FUNCTIONS (Para futuras funcionalidades) =====
function showModal(modalId) {
              alert('Función en desarrollo: ' + modalId);
}

// ===== GUARDAR CONFIGURACIÓN =====
function saveSettings() {
              const currentUser = JSON.parse(localStorage.getItem('currentUser'));
              const companies = JSON.parse(localStorage.getItem('companies')) || [];

    const companyName = document.getElementById('settingsCompanyName').value;
              const phone = document.getElementById('settingsPhone').value;
              const email = document.getElementById('settingsEmail').value;

    // Buscar y actualizar la empresa
    for (let company of companies) {
                      if (company.id === currentUser.companyId) {
                                            company.name = companyName;
                                            company.phone = phone;
                                            break;
                      }
    }

    localStorage.setItem('companies', JSON.stringify(companies));

    // Actualizar currentUser
    currentUser.companyName = companyName;
              localStorage.setItem('currentUser', JSON.stringify(currentUser));
              document.getElementById('companyDisplay').textContent = companyName;

    alert('Configuración guardada correctamente');
}

// ===== TOGGLE USER MENU =====
function toggleUserMenu() {
              // Esta función puede expandirse para mostrar un menú desplegable
    console.log('User menu clicked');
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
              const currentUser = JSON.parse(localStorage.getItem('currentUser'));

                              if (currentUser && currentUser.email) {
                                                // Usuario ya está autenticado
                  showDashboard();
                              } else {
                                                // Mostrar página de autenticación
                  document.getElementById('authPage').style.display = 'flex';
                                                document.getElementById('dashboardPage').style.display = 'none';
                              }
});
