// ===== FASE 3: LEADS MODULE CON GOOGLE MAPS =====
// Sistema completo de autenticación, dashboard, y leads con geolocalización

// ===== VARIABLES GLOBALES =====
let leadsMap = null;
let markers = [];
let leadsData = [];

// ===== DATOS EN localStorage =====
function InitData() {
      if (!localStorage.getItem('companies')) {
                localStorage.setItem('companies', JSON.stringify([]));
      }
      if (!localStorage.getItem('currentUser')) {
                localStorage.setItem('currentUser', JSON.stringify(null));
      }
      if (!localStorage.getItem('leads')) {
                localStorage.setItem('leads', JSON.stringify([]));
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

    for (let company of companies) {
              for (let user of company.users || []) {
                            if (user.email === email) {
                                              alert('Este email ya está registrado');
                                              return;
                            }
              }
    }

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

    const currentUser = {
              email: email,
              name: firstName,
              companyId: newCompany.id,
              companyName: newCompany.name
    };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

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

    document.getElementById('companyDisplay').textContent = currentUser.companyName;
      document.getElementById('userInitials').textContent = currentUser.name.charAt(0).toUpperCase();
      document.getElementById('pageTitle').textContent = 'Dashboard';

    showSection('dashboard');
      loadLeadsData();
}

// ===== MOSTRAR SECCIONES =====
function showSection(sectionName) {
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => section.classList.remove('active'));

    const targetSection = document.getElementById(sectionName + '-section');
      if (targetSection) {
                targetSection.classList.add('active');
      }

    const titles = {
              'dashboard': 'Dashboard',
              'clients': 'Gestión de Clientes',
              'jobs': 'Gestión de Trabajos',
              'leads': 'Gestión de Leads - Mapa de Ubicaciones',
              'dispatch': 'Dispatch - Asignación de Trabajos',
              'technicians': 'Gestión de Técnicos',
              'invoices': 'Gestión de Facturas',
              'collections': 'Crédito & Cobranza',
              'settings': 'Configuración'
    };

    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';

    const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
      if (activeLink) {
                activeLink.classList.add('active');
      }

    // Inicializar mapa si es la sección de leads
    if (sectionName === 'leads') {
              setTimeout(() => {
                            if (!leadsMap) {
                                              initLeadsMap();
                            } else {
                                              google.maps.event.trigger(leadsMap, 'resize');
                            }
              }, 100);
    }
}

// ===== LEADS MODULE FUNCTIONS =====
function showLeadForm() {
      document.getElementById('leadFormContainer').style.display = 'block';
      document.getElementById('leadForm').reset();
}

function hideLeadForm() {
      document.getElementById('leadFormContainer').style.display = 'none';
}

function handleLeadCreate(event) {
      event.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const name = document.getElementById('leadName').value;
      const phone = document.getElementById('leadPhone').value;
      const email = document.getElementById('leadEmail').value;
      const service = document.getElementById('leadService').value;
      const address = document.getElementById('leadAddress').value;
      const lat = document.getElementById('leadLat').value;
      const lng = document.getElementById('leadLng').value;
      const notes = document.getElementById('leadNotes').value;

    if (!lat || !lng) {
              alert('Por favor, ingresa una dirección válida para obtener coordenadas');
              return;
    }

    const leads = JSON.parse(localStorage.getItem('leads')) || [];

    const newLead = {
              id: Date.now(),
              companyId: currentUser.companyId,
              name: name,
              phone: phone,
              email: email,
              service: service,
              address: address,
              lat: parseFloat(lat),
              lng: parseFloat(lng),
              notes: notes,
              status: 'new',
              createdAt: new Date().toISOString()
    };

    leads.push(newLead);
      localStorage.setItem('leads', JSON.stringify(leads));

    hideLeadForm();
      loadLeadsData();
      alert('¡Lead creado exitosamente!');
}

function loadLeadsData() {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const leads = JSON.parse(localStorage.getItem('leads')) || [];

    leadsData = leads.filter(lead => lead.companyId === currentUser.companyId);

    // Actualizar KPI
    document.getElementById('leadCountKPI').textContent = leadsData.length;

    // Mostrar lista
    renderLeadsTable();

    // Actualizar mapa
    if (leadsMap) {
              updateLeadsMap();
    }
}

function renderLeadsTable() {
      const listContainer = document.getElementById('leadsList');

    if (leadsData.length === 0) {
              listContainer.innerHTML = '<div class="empty-state">No hay leads registrados. Crea uno para comenzar.</div>';
              return;
    }

    let html = `<table class="leads-table">
            <thead>
                        <tr>
                                        <th>Nombre</th>
                                                        <th>Teléfono</th>
                                                                        <th>Email</th>
                                                                                        <th>Servicio</th>
                                                                                                        <th>Estado</th>
                                                                                                                        <th>Dirección</th>
                                                                                                                                        <th>Acciones</th>
                                                                                                                                                    </tr>
                                                                                                                                                            </thead>
                                                                                                                                                                    <tbody>`;

    leadsData.forEach(lead => {
              html += `<tr>
                          <td>${lead.name}</td>
                                      <td>${lead.phone}</td>
                                                  <td>${lead.email || '-'}</td>
                                                              <td>${lead.service}</td>
                                                                          <td><span class="lead-status ${lead.status}">${lead.status}</span></td>
                                                                                      <td>${lead.address}</td>
                                                                                                  <td>
                                                                                                                  <div class="lead-actions">
                                                                                                                                      <button class="btn-icon" onclick="editLead('${lead.id}')">Editar</button>
                                                                                                                                                          <button class="btn-icon" onclick="deleteLead('${lead.id}')" style="border-color: #ef4444; color: #ef4444;">Eliminar</button>
                                                                                                                                                                          </div>
                                                                                                                                                                                      </td>
                                                                                                                                                                                              </tr>`;
    });

    html += `</tbody></table>`;
      listContainer.innerHTML = html;
}

function editLead(leadId) {
      alert('Función de edición en desarrollo');
}

function deleteLead(leadId) {
      if (confirm('¿Estás seguro de que deseas eliminar este lead?')) {
                const leads = JSON.parse(localStorage.getItem('leads')) || [];
                const updatedLeads = leads.filter(lead => lead.id !== parseInt(leadId));
                localStorage.setItem('leads', JSON.stringify(updatedLeads));
                loadLeadsData();
      }
}

// ===== GOOGLE MAPS INTEGRATION =====
function initLeadsMap() {
      const mapElement = document.getElementById('leadsMap');

    leadsMap = new google.maps.Map(mapElement, {
              zoom: 11,
              center: { lat: 37.7749, lng: -122.4194 }, // San Francisco por defecto
              styles: [
                { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                {
                                  featureType: 'administrative.locality',
                                  elementType: 'labels.text.fill',
                                  stylers: [{ color: '#d59563' }],
                },
                        ],
              mapTypeControl: true,
              fullscreenControl: true
    });

    updateLeadsMap();
}

function updateLeadsMap() {
      // Limpiar marcadores anteriores
    markers.forEach(marker => marker.setMap(null));
      markers = [];

    if (leadsData.length === 0) return;

    // Crear bounds para centrar el mapa
    const bounds = new google.maps.LatLngBounds();

    leadsData.forEach(lead => {
              const position = { lat: parseFloat(lead.lat), lng: parseFloat(lead.lng) };

                              const marker = new google.maps.Marker({
                                            position: position,
                                            map: leadsMap,
                                            title: lead.name,
                                            icon: {
                                                              path: google.maps.SymbolPath.CIRCLE,
                                                              scale: 10,
                                                              fillColor: '#10b981',
                                                              fillOpacity: 1,
                                                              strokeColor: 'white',
                                                              strokeWeight: 2,
                                            }
                              });

                              // Info window
                              const infoWindow = new google.maps.InfoWindow({
                                            content: `<div style="color: #333; padding: 10px; font-size: 12px;">
                                                            <strong>${lead.name}</strong><br/>
                                                                            📞 ${lead.phone}<br/>
                                                                                            📍 ${lead.address}<br/>
                                                                                                            🔧 ${lead.service}
                                                                                                                        </div>`
                              });

                              marker.addListener('click', () => {
                                            infoWindow.open(leadsMap, marker);
                              });

                              markers.push(marker);
              bounds.extend(position);
    });

    // Centrar mapa en todos los marcadores
    if (leadsData.length > 1) {
              leadsMap.fitBounds(bounds);
    } else if (leadsData.length === 1) {
              leadsMap.setCenter(bounds.getCenter());
              leadsMap.setZoom(14);
    }
}

// Geocoding para obtener coordenadas de dirección
function geocodeAddress(address) {
      const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: address }, (results, status) => {
              if (status === 'OK' && results.length > 0) {
                            const location = results[0].geometry.location;
                            document.getElementById('leadLat').value = location.lat().toFixed(6);
                            document.getElementById('leadLng').value = location.lng().toFixed(6);
                            leadsMap.setCenter(location);
                            leadsMap.setZoom(14);
              } else {
                            alert('No se pudo encontrar la dirección: ' + status);
              }
    });
}

// Detectar cambios en dirección y geocodificar
document.addEventListener('DOMContentLoaded', function() {
      const addressInput = document.getElementById('leadAddress');
      if (addressInput) {
                addressInput.addEventListener('blur', function() {
                              if (this.value && document.getElementById('leadsMap')) {
                                                setTimeout(geocodeAddress, 500, this.value);
                              }
                });
      }
});

// ===== LOGOUT =====
function logout() {
      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                localStorage.setItem('currentUser', JSON.stringify(null));
                location.reload();
      }
}

// ===== MODAL FUNCTIONS =====
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

    for (let company of companies) {
              if (company.id === currentUser.companyId) {
                            company.name = companyName;
                            company.phone = phone;
                            break;
              }
    }

    localStorage.setItem('companies', JSON.stringify(companies));

    currentUser.companyName = companyName;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      document.getElementById('companyDisplay').textContent = companyName;

    alert('Configuración guardada correctamente');
}

// ===== TOGGLE USER MENU =====
function toggleUserMenu() {
      console.log('User menu clicked');
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));

                              if (currentUser && currentUser.email) {
                                        showDashboard();
                              } else {
                                        document.getElementById('authPage').style.display = 'flex';
                                        document.getElementById('dashboardPage').style.display = 'none';
                              }
});
