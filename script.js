<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trade Master - CRM HVACR</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCkHcL1QcgKzxABmI4IJeEmjjvnZz_Xtys"></script>
  </head>
  <body>

    <!-- ==================== AUTH PAGE ==================== -->
    <div id="authPage" class="auth-container">
      <div class="auth-card">
        <div class="auth-left">
          <div class="auth-brand">
            <div class="brand-icon">🔧</div>
            <h1>Trade Master</h1>
            <p class="brand-subtitle">CRM HVACR - Sistema Multi-Empresa</p>
            <ul class="feature-list">
              <li><span class="check">✅</span> Gestión completa de clientes y trabajos</li>
              <li><span class="check">✅</span> Despacho de técnicos con GPS</li>
              <li><span class="check">✅</span> Facturación y cobranza integrada</li>
              <li><span class="check">✅</span> Seguimiento de leads con Google Maps</li>
            </ul>
          </div>
        </div>
        <div class="auth-right">
          <div class="auth-tabs">
            <button class="tab-btn active" onclick="switchTab('login')">Iniciar Sesión</button>
            <button class="tab-btn" onclick="switchTab('register')">Registrar Empresa</button>
          </div>
          <div id="loginForm" class="auth-form active">
            <h2>Bienvenido</h2>
            <div id="loginError" class="error-msg" style="display:none;"></div>
            <form onsubmit="handleLogin(event)">
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="loginEmail" placeholder="tu@email.com" required>
              </div>
              <div class="form-group">
                <label>Contraseña</label>
                <input type="password" id="loginPassword" placeholder="Contraseña" required>
              </div>
              <button type="submit" class="btn-primary" id="loginBtn">Iniciar Sesión</button>
            </form>
            <p class="auth-link">¿No tienes cuenta? <a href="#" onclick="switchTab('register')">Regístrate aquí</a></p>
          </div>
          <div id="registerForm" class="auth-form">
            <h2>Crear Cuenta Empresarial</h2>
            <div id="registerError" class="error-msg" style="display:none;"></div>
            <div id="registerSuccess" class="success-msg" style="display:none;"></div>
            <form onsubmit="handleRegister(event)">
              <div class="form-group">
                <label>Nombre de la Empresa</label>
                <input type="text" id="companyName" placeholder="Nombre de la Empresa" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre</label>
                  <input type="text" id="firstName" placeholder="Nombre" required>
                </div>
                <div class="form-group">
                  <label>Apellido</label>
                  <input type="text" id="lastName" placeholder="Apellido" required>
                </div>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="registerEmail" placeholder="tu@email.com" required>
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" id="phone" placeholder="(555) 123-4567" required>
              </div>
              <div class="form-group">
                <label>Contraseña</label>
                <input type="password" id="registerPassword" placeholder="Mínimo 6 caracteres" required>
              </div>
              <div class="form-group">
                <label>Confirmar Contraseña</label>
                <input type="password" id="confirmPassword" placeholder="Confirmar Contraseña" required>
              </div>
              <button type="submit" class="btn-primary" id="registerBtn">Crear Cuenta Empresarial</button>
            </form>
            <p class="auth-link">¿Ya tienes cuenta? <a href="#" onclick="switchTab('login')">Inicia sesión</a></p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== DASHBOARD PAGE ==================== -->
    <div id="dashboardPage" class="dashboard-container" style="display:none;">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-logo" id="companyLogo">
            <svg viewBox="0 0 60 60" width="44" height="44">
              <!-- Blue gauge (low pressure) -->
              <circle cx="18" cy="22" r="14" fill="none" stroke="#3b82f6" stroke-width="2.5"/>
              <circle cx="18" cy="22" r="11" fill="#1e293b"/>
              <path d="M18 22 L12 15" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
              <text x="18" y="34" text-anchor="middle" fill="#3b82f6" font-size="4" font-weight="bold">LO</text>
              <!-- Red gauge (high pressure) -->
              <circle cx="42" cy="22" r="14" fill="none" stroke="#ef4444" stroke-width="2.5"/>
              <circle cx="42" cy="22" r="11" fill="#1e293b"/>
              <path d="M42 22 L48 15" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              <text x="42" y="34" text-anchor="middle" fill="#ef4444" font-size="4" font-weight="bold">HI</text>
              <!-- Amp clamp meter -->
              <rect x="22" y="42" width="16" height="14" rx="2" fill="#f59e0b" stroke="#ca8a04" stroke-width="1"/>
              <text x="30" y="51" text-anchor="middle" fill="#1e293b" font-size="5" font-weight="bold">A</text>
              <path d="M26 42 L26 38 Q26 36 28 36 L32 36 Q34 36 34 38 L34 42" fill="none" stroke="#f59e0b" stroke-width="2"/>
              <!-- Connection hoses -->
              <line x1="18" y1="36" x2="18" y2="44" stroke="#3b82f6" stroke-width="1.5"/>
              <line x1="42" y1="36" x2="42" y2="44" stroke="#ef4444" stroke-width="1.5"/>
            </svg>
          </div>
          <h2>Trade Master</h2>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-group">
            <span class="nav-group-title">Principal</span>
            <a href="#" onclick="showSection('dashboard')" class="nav-link active"><span>📊</span> Dashboard</a>
            <a href="#" onclick="showSection('calendar')" class="nav-link"><span>📅</span> Calendario</a>
            <a href="#" onclick="showSection('leads')" class="nav-link"><span>🎯</span> Leads</a>
            <a href="#" onclick="showSection('dispatch')" class="nav-link"><span>🚚</span> Dispatch</a>
          </div>
          <div class="nav-group">
            <span class="nav-group-title">Gestión</span>
            <a href="#" onclick="showSection('clients')" class="nav-link"><span>👥</span> Clientes</a>
            <a href="#" onclick="showSection('jobs')" class="nav-link"><span>🔧</span> Trabajos</a>
            <a href="#" onclick="showSection('technicians')" class="nav-link"><span>👷</span> Técnicos</a>
            <a href="#" onclick="showSection('advisors')" class="nav-link"><span>🏠</span> Home Advisors</a>
          </div>
          <div class="nav-group">
            <span class="nav-group-title">Finanzas</span>
            <a href="#" onclick="showSection('invoices')" class="nav-link"><span>📄</span> Facturas</a>
            <a href="#" onclick="showSection('collections')" class="nav-link"><span>💰</span> Cobranza</a>
          </div>
          <div class="nav-group">
            <span class="nav-group-title">Sistema</span>
            <a href="#" onclick="showSection('settings')" class="nav-link"><span>⚙️</span> Configuración</a>
          </div>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar-sm" id="sidebarInitials">M</div>
            <span id="sidebarUserName" class="user-name-text">Usuario</span>
          </div>
          <button onclick="logout()" class="btn-logout">Cerrar Sesión</button>
        </div>
      </aside>

      <main class="main-content">
        <header class="top-bar">
          <h1 id="pageTitle">Dashboard</h1>
          <div class="top-bar-right">
            <span id="companyDisplay" class="company-name"></span>
            <div id="userInitials" class="user-avatar">M</div>
          </div>
        </header>

        <div class="content-area">

          <!-- ===== DASHBOARD ===== -->
          <div id="dashboard-section" class="section active">
            <div class="kpi-grid">
              <div class="kpi-card"><span class="kpi-label">Leads</span><span class="kpi-value" id="leadCountKPI">0</span><span class="kpi-sub">Total de leads</span></div>
              <div class="kpi-card"><span class="kpi-label">Trabajos Activos</span><span class="kpi-value" id="jobCountKPI">0</span><span class="kpi-sub">En progreso</span></div>
              <div class="kpi-card"><span class="kpi-label">Técnicos</span><span class="kpi-value" id="techCountKPI">0</span><span class="kpi-sub">Registrados</span></div>
              <div class="kpi-card"><span class="kpi-label">Clientes</span><span class="kpi-value" id="clientCountKPI">0</span><span class="kpi-sub">Clientes activos</span></div>
            </div>

            <!-- Revenue Pipeline -->
            <div class="card" style="margin-bottom:16px;">
              <div class="card-top">
                <h3>💰 Pipeline / Cashflow</h3>
                <select id="pipelineYear" class="inline-select" onchange="renderPipeline()" style="padding:8px 12px;">
                </select>
              </div>
              <div id="pipelineChart" class="pipeline-chart"></div>
              <div id="pipelineStats" class="pipeline-stats"></div>
            </div>

            <div class="cards-row">
              <!-- Recent Jobs -->
              <div class="card">
                <h3>🔧 Trabajos Recientes</h3>
                <div id="dashRecentJobs"></div>
              </div>
              <!-- Upcoming Appointments -->
              <div class="card">
                <h3>📅 Próximas Citas</h3>
                <div id="dashUpcomingAppts"></div>
              </div>
            </div>

            <!-- Overdue Invoices Alert -->
            <div id="dashOverdueAlert" style="display:none;" class="card">
              <h3>🔴 Facturas Vencidas</h3>
              <div id="dashOverdueList"></div>
            </div>
          </div>

          <!-- ===== CALENDAR / SCHEDULE ===== -->
          <div id="calendar-section" class="section">
            <div class="card">
              <div class="card-top">
                <h3>📅 Calendario de Citas</h3>
                <div style="display:flex;gap:8px;align-items:center;">
                  <button class="btn-secondary btn-sm" onclick="calPrev()" style="padding:6px 12px;">◀</button>
                  <span id="calMonthLabel" style="font-weight:700;font-size:15px;color:var(--primary);min-width:160px;text-align:center;"></span>
                  <button class="btn-secondary btn-sm" onclick="calNext()" style="padding:6px 12px;">▶</button>
                  <button class="btn-secondary btn-sm" onclick="calToday()" style="margin-left:8px;">Hoy</button>
                  <button class="btn-primary btn-sm" onclick="showApptForm()">+ Nueva Cita</button>
                </div>
              </div>

              <!-- Appointment Form -->
              <div id="apptFormContainer" style="display:none;margin:16px 0;padding:20px;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;">
                <h4 style="margin-bottom:16px;color:var(--primary);" id="apptFormTitle">📅 Nueva Cita</h4>
                <form id="apptForm" onsubmit="handleApptCreate(event)">
                  <div class="form-row">
                    <div class="form-group"><label>Título / Servicio</label><input type="text" id="apptTitle" required placeholder="Ej: Tune-Up AC, Reparación Furnace..."></div>
                    <div class="form-group"><label>Cliente</label>
                      <select id="apptClientSelect" onchange="loadApptClientInfo()">
                        <option value="">Seleccionar o crear...</option>
                        <option value="__new__">➕ Nuevo Cliente</option>
                      </select>
                    </div>
                  </div>
                  <!-- New client fields (hidden by default) -->
                  <div id="apptNewClientFields" style="display:none;">
                    <div class="form-row">
                      <div class="form-group"><label>Nombre del Cliente</label><input type="text" id="apptNewClientName" placeholder="Nombre completo"></div>
                      <div class="form-group"><label>Teléfono</label><input type="tel" id="apptNewClientPhone" placeholder="(555) 123-4567"></div>
                    </div>
                    <div class="form-group"><label>Email</label><input type="email" id="apptNewClientEmail" placeholder="email@cliente.com"></div>
                  </div>
                  <div class="form-row">
                    <div class="form-group"><label>Fecha</label><input type="date" id="apptDate" required></div>
                    <div class="form-group"><label>Hora Inicio</label><input type="time" id="apptStartTime" value="09:00"></div>
                    <div class="form-group"><label>Hora Fin</label><input type="time" id="apptEndTime" value="10:00"></div>
                  </div>
                  <div class="form-row">
                    <div class="form-group"><label>Técnico</label>
                      <select id="apptTechSelect"><option value="">Sin asignar</option></select>
                    </div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="apptAddress" placeholder="Dirección del servicio"></div>
                  </div>
                  <div class="form-group"><label>Notas</label><textarea id="apptNotes" rows="2" placeholder="Detalles adicionales..."></textarea></div>
                  <div class="form-actions">
                    <button type="submit" class="btn-primary btn-sm" id="apptSubmitBtn">💾 Crear Cita</button>
                    <button type="button" class="btn-secondary btn-sm" onclick="hideApptForm()">Cancelar</button>
                  </div>
                </form>
              </div>

              <!-- Calendar Grid -->
              <div id="calendarGrid" class="calendar-grid"></div>
            </div>

            <!-- Day Detail -->
            <div class="card" style="margin-top:16px;">
              <h3 id="calDayTitle">📋 Citas del Día</h3>
              <div id="calDayAppts"></div>
            </div>
          </div>

          <!-- ===== LEADS ===== -->
          <div id="leads-section" class="section">
            <div class="card">
              <div class="card-top"><h3>Leads Registrados</h3><button class="btn-primary btn-sm" onclick="showLeadForm()">+ Nuevo Lead</button></div>
              <div id="leadFormContainer" style="display:none; margin-bottom:20px;">
                <form id="leadForm" onsubmit="handleLeadCreate(event)">
                  <div class="form-row">
                    <div class="form-group"><label>Nombre</label><input type="text" id="leadName" placeholder="Nombre del cliente" required></div>
                    <div class="form-group"><label>Teléfono</label><input type="tel" id="leadPhone" placeholder="Teléfono" required></div>
                  </div>
                  <div class="form-row">
                    <div class="form-group"><label>Email</label><input type="email" id="leadEmail" placeholder="Email"></div>
                    <div class="form-group">
                      <label>Servicio</label>
                      <select id="leadService" required>
                        <option value="">Seleccionar</option>
                        <option value="Instalación AC">Instalación AC</option>
                        <option value="Reparación AC">Reparación AC</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Calefacción">Calefacción</option>
                        <option value="Refrigeración">Refrigeración</option>
                        <option value="Ductos">Ductos</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Tipo de Propiedad</label>
                      <select id="leadPropertyType">
                        <option value="residential">🏠 Residencial</option>
                        <option value="commercial">🏢 Comercial</option>
                        <option value="industrial">🏭 Industrial</option>
                        <option value="restaurant">🍽️ Restaurante</option>
                      </select>
                    </div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="leadAddress" placeholder="Dirección completa" required><input type="hidden" id="leadLat"><input type="hidden" id="leadLng"></div>
                  </div>
                  <div class="form-group"><label>Notas</label><textarea id="leadNotes" rows="3" placeholder="Notas adicionales"></textarea></div>
                  <div class="form-actions">
                    <button type="submit" class="btn-primary btn-sm">Guardar Lead</button>
                    <button type="button" class="btn-secondary btn-sm" onclick="hideLeadForm()">Cancelar</button>
                  </div>
                </form>
              </div>
              <div id="leadsList"></div>
            </div>
            <div class="card"><h3>Mapa de Leads</h3><div id="leadsMap" style="width:100%;height:500px;border-radius:8px;"></div></div>
          </div>

          <!-- ===== DISPATCH ===== -->
          <div id="dispatch-section" class="section">
            <div class="card">
              <div class="card-top">
                <h3>🗺️ Mapa de Dispatch en Tiempo Real</h3>
                <div class="dispatch-legend">
                  <span class="legend-item"><span style="color:#3b82f6;">🚐</span> Disponible</span>
                  <span class="legend-item"><span style="color:#f59e0b;">🚐</span> Ocupado</span>
                  <span class="legend-item"><span style="color:#8b5cf6;">🚐</span> En Ruta</span>
                  <span class="legend-item"><span class="legend-dot job-dot"></span> Trabajos</span>
                  <span class="legend-item"><span class="legend-dot client-dot"></span> Clientes</span>
                </div>
              </div>
              <div id="dispatchMap" style="width:100%;height:500px;border-radius:8px;"></div>
            </div>
            <div class="dispatch-panels">
              <div class="card">
                <div class="card-top"><h3>👷 Técnicos</h3><button class="btn-primary btn-sm" onclick="showTechForm()">+ Agregar Técnico</button></div>
                <div id="techFormContainer" style="display:none; margin-bottom:16px;">
                  <form id="techForm" onsubmit="handleTechCreate(event)">
                    <div class="form-row">
                      <div class="form-group"><label>Nombre</label><input type="text" id="techName" required placeholder="Nombre completo"></div>
                      <div class="form-group"><label>Teléfono</label><input type="tel" id="techPhone" placeholder="Teléfono"></div>
                    </div>
                    <div class="form-row">
                      <div class="form-group"><label>Email</label><input type="email" id="techEmail" placeholder="Email"></div>
                      <div class="form-group">
                        <label>Especialidad</label>
                        <select id="techSpecialty">
                          <option value="HVAC">HVAC</option>
                          <option value="Refrigeración">Refrigeración</option>
                          <option value="Eléctrico">Eléctrico</option>
                          <option value="Plomería">Plomería</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                    </div>
                    <div class="form-actions">
                      <button type="submit" class="btn-primary btn-sm">Guardar</button>
                      <button type="button" class="btn-secondary btn-sm" onclick="hideTechForm()">Cancelar</button>
                    </div>
                  </form>
                </div>
                <div id="techniciansList"></div>
              </div>
              <div class="card">
                <div class="card-top"><h3>📋 Trabajos Pendientes</h3><button class="btn-primary btn-sm" onclick="showJobForm()">+ Nuevo Trabajo</button></div>
                <div id="jobFormContainer" style="display:none; margin-bottom:16px;">
                  <form id="jobForm" onsubmit="handleJobCreate(event)">
                    <div class="form-group"><label>Título</label><input type="text" id="jobTitle" required placeholder="Descripción del trabajo"></div>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Tipo de Servicio</label>
                        <select id="jobServiceType">
                          <option value="Instalación">Instalación</option>
                          <option value="Reparación">Reparación</option>
                          <option value="Mantenimiento">Mantenimiento</option>
                          <option value="Emergencia">Emergencia</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Prioridad</label>
                        <select id="jobPriority">
                          <option value="normal">Normal</option>
                          <option value="high">Alta</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      </div>
                    </div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="jobAddress" required placeholder="Dirección del trabajo"><input type="hidden" id="jobLat"><input type="hidden" id="jobLng"></div>
                    <div class="form-row">
                      <div class="form-group"><label>Fecha</label><input type="date" id="jobDate"></div>
                      <div class="form-group">
                        <label>Asignar Técnico</label>
                        <select id="jobTechId"><option value="">Sin asignar</option></select>
                      </div>
                    </div>
                    <div class="form-group"><label>Notas</label><textarea id="jobNotes" rows="2" placeholder="Notas"></textarea></div>
                    <div class="form-actions">
                      <button type="submit" class="btn-primary btn-sm">Crear Trabajo</button>
                      <button type="button" class="btn-secondary btn-sm" onclick="hideJobForm()">Cancelar</button>
                    </div>
                  </form>
                </div>
                <div id="jobsList"></div>
              </div>
            </div>
          </div>

          <!-- ===== TÉCNICOS ===== -->
          <div id="technicians-section" class="section">
            <div class="card">
              <div class="card-top"><h3>Gestión de Técnicos</h3><button class="btn-primary btn-sm" onclick="showSection('dispatch')">Ir a Dispatch</button></div>
              <div id="techniciansFullList"></div>
            </div>
            <div class="card">
              <h3>📱 Link de Tracking para Técnicos</h3>
              <p style="color:var(--text-light);font-size:14px;margin-bottom:12px;">Comparte este link con tus técnicos para que reporten su ubicación en tiempo real desde su celular:</p>
              <div id="trackingLinkContainer" class="tracking-link-box"></div>
            </div>
          </div>

          <!-- ===== OTHER SECTIONS ===== -->
          <!-- ===== CLIENTS ===== -->
          <div id="clients-section" class="section">
            <div class="card">
              <div class="card-top">
                <h3>👥 Clientes</h3>
                <div style="display:flex;gap:8px;align-items:center;">
                  <input type="text" id="clientSearchInput" placeholder="🔍 Buscar cliente..." oninput="renderClientsList()" style="padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:12px;width:200px;">
                  <button class="btn-primary btn-sm" onclick="showClientForm()">+ Nuevo Cliente</button>
                </div>
              </div>

              <!-- Client Form -->
              <div id="clientFormContainer" style="display:none;margin:16px 0;padding:20px;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;">
                <h4 style="margin-bottom:16px;color:var(--primary);" id="clientFormTitle">👥 Nuevo Cliente</h4>
                <form id="clientForm" onsubmit="handleClientCreate(event)">
                  <div class="form-row">
                    <div class="form-group"><label>Nombre</label><input type="text" id="clientName" required placeholder="Nombre completo"></div>
                    <div class="form-group"><label>Teléfono</label><input type="tel" id="clientPhone" placeholder="(555) 123-4567"></div>
                  </div>
                  <div class="form-row">
                    <div class="form-group"><label>Email</label><input type="email" id="clientEmail" placeholder="email@cliente.com"></div>
                    <div class="form-group"><label>Tipo de Propiedad</label>
                      <select id="clientPropertyType">
                        <option value="Residencial">Residencial</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Industrial">Industrial</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group"><label>Dirección</label><input type="text" id="clientAddress" placeholder="Dirección completa"></div>
                  <div class="form-group"><label>Notas</label><textarea id="clientNotes" rows="2" placeholder="Notas sobre el cliente..."></textarea></div>
                  <div class="form-actions">
                    <button type="submit" class="btn-primary btn-sm" id="clientSubmitBtn">💾 Guardar</button>
                    <button type="button" class="btn-secondary btn-sm" onclick="hideClientForm()">Cancelar</button>
                  </div>
                </form>
              </div>

              <div id="clientsList"></div>
            </div>
          </div>
          <div id="jobs-section" class="section">
            <div class="card">
              <div class="card-top"><h3>💰 Crear Estimado / Presentación</h3></div>
              <div id="estimateBuilder">
                <!-- Step 1: Select Job -->
                <div class="estimate-step">
                  <h4>1. Seleccionar Trabajo</h4>
                  <select id="estJobSelect" class="form-select" onchange="loadEstimateJob()">
                    <option value="">Seleccionar trabajo...</option>
                  </select>
                  <div id="estJobInfo" style="display:none;" class="est-job-info"></div>
                </div>

                <!-- Step 2: Equipment Info -->
                <div class="estimate-step">
                  <h4>2. Información del Equipo</h4>
                  <div class="equip-grid">
                    <button class="equip-btn" onclick="selectEquipType('ac_single')">❄️<br>AC Single Stage</button>
                    <button class="equip-btn" onclick="selectEquipType('heat_pump')">🔄<br>Heat Pump Single Stage</button>
                    <button class="equip-btn" onclick="selectEquipType('furnace_80')">🔥<br>Furnace 80% AFUE<br><small>Cat I - Induced Draft</small></button>
                    <button class="equip-btn" onclick="selectEquipType('furnace_90')">🔥<br>Furnace 90%+ AFUE<br><small>Cat IV - Condensing</small></button>
                    <button class="equip-btn" onclick="selectEquipType('mini_split')">🌬️<br>Mini Split</button>
                    <button class="equip-btn" onclick="selectEquipType('package_unit')">📦<br>Package Unit</button>
                  </div>
                  <div class="equip-details" style="margin-top:16px;">
                    <div class="form-row">
                      <div class="form-group"><label>Modelo #</label><input type="text" id="estModelNum" placeholder="Ej: GSX140361"></div>
                      <div class="form-group"><label>Serial #</label><input type="text" id="estSerialNum" placeholder="Ej: 1234567890"></div>
                    </div>
                    <div class="form-row">
                      <div class="form-group"><label>Marca</label>
                        <select id="estBrand"><option value="">Seleccionar...</option><option>Goodman</option><option>Carrier</option><option>Trane</option><option>Lennox</option><option>Rheem</option><option>Ruud</option><option>York</option><option>Bryant</option><option>Amana</option><option>Daikin</option><option>Mitsubishi</option><option>Fujitsu</option><option>Bosch</option><option>American Standard</option><option>Otra</option></select>
                      </div>
                      <div class="form-group"><label>Edad Aprox (años)</label><input type="number" id="estEquipAge" placeholder="Ej: 15" min="0" max="50"></div>
                    </div>
                    <div class="form-group">
                      <label>📷 Fotos del Equipo (modelo, serial, data plate, condición)</label>
                      <input type="file" id="estPhotos" multiple accept="image/*" onchange="handleEquipPhotos(event)">
                      <div id="photoPreviewGrid" class="photo-grid"></div>
                    </div>
                    <div id="equipAgeWarning" style="display:none;" class="age-warning">
                      ⚠️ Equipo con más de 15 años — considerar reemplazo
                      <button class="btn-warning-sm" onclick="referToAdvisor()">🏠 Referir a Home Advisor para Reemplazo</button>
                    </div>
                  </div>
                </div>

                <!-- Step 3: Service Call Fee -->
                <div class="estimate-step">
                  <h4>3. Llamada de Servicio (Service Call)</h4>
                  <p style="color:var(--text-muted);font-size:12px;margin-bottom:10px;">⚡ La llamada de servicio SIEMPRE se cobra — si el cliente decide hacer el trabajo, se cobra ADICIONAL a labor + partes.</p>
                  <div class="service-call-options">
                    <label class="sc-option" onclick="selectServiceCall(70)">
                      <input type="radio" name="serviceCall" value="70">
                      <div class="sc-card"><span class="sc-price">$70</span><span class="sc-desc">0-10 millas</span></div>
                    </label>
                    <label class="sc-option" onclick="selectServiceCall(120)">
                      <input type="radio" name="serviceCall" value="120">
                      <div class="sc-card"><span class="sc-price">$120</span><span class="sc-desc">10-20 millas</span></div>
                    </label>
                    <label class="sc-option" onclick="selectServiceCall(200)">
                      <input type="radio" name="serviceCall" value="200">
                      <div class="sc-card"><span class="sc-price">$200</span><span class="sc-desc">20+ millas</span></div>
                    </label>
                    <label class="sc-option" onclick="selectServiceCall(-1)">
                      <input type="radio" name="serviceCall" value="custom">
                      <div class="sc-card"><span class="sc-price">$?</span><span class="sc-desc">Custom</span></div>
                    </label>
                  </div>
                  <div id="customServiceCall" style="display:none;margin-top:8px;">
                    <div class="form-group"><label>Monto personalizado</label><input type="number" id="customSCAmount" placeholder="$" onchange="selectServiceCall(parseFloat(this.value))"></div>
                  </div>
                  <div class="form-row" style="margin-top:12px;">
                    <div class="form-group">
                      <label>¿Cliente aprueba el trabajo?</label>
                      <select id="estClientDecision" onchange="handleClientDecision()">
                        <option value="">Pendiente...</option>
                        <option value="yes">✅ SÍ — Hacer reparación</option>
                        <option value="no">❌ NO — Solo cobrar service call</option>
                        <option value="replace">🔄 Quiere equipo nuevo (referir)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Horas de labor</label>
                      <input type="number" id="estLaborHours" value="1" min="0.5" step="0.5" onchange="updateEstimateTotals()">
                    </div>
                  </div>
                  <div id="advisorReferralBox" style="display:none;margin-top:12px;">
                    <div class="referral-box">
                      <h5>🏠 Referir a Home Advisor</h5>
                      <div class="form-row">
                        <div class="form-group">
                          <label>Seleccionar Advisor</label>
                          <select id="estAdvisorSelect"><option value="">Seleccionar...</option></select>
                        </div>
                        <div class="form-group">
                          <label>Urgencia</label>
                          <select id="referralUrgency">
                            <option value="normal">Normal</option>
                            <option value="urgente">Urgente</option>
                            <option value="programar">Programar visita</option>
                          </select>
                        </div>
                      </div>
                      <div class="form-group"><label>Notas para el Advisor</label><textarea id="referralNotes" rows="2" placeholder="Estado del equipo, lo que necesita el cliente..."></textarea></div>
                      <button class="btn-primary btn-sm" onclick="sendReferralToAdvisor()">📩 Enviar Referencia al Advisor</button>
                    </div>
                  </div>
                </div>

                <!-- Step 4: Select Components (only if approved) -->
                <div class="estimate-step" id="componentsStep">
                  <h4>4. Componentes y Reparaciones</h4>
                  <div id="componentsList"></div>
                </div>

                <!-- Step 5: Summary -->
                <div class="estimate-step">
                  <h4>5. Resumen del Estimado</h4>
                  <div id="estimateSummary"></div>
                  <div class="form-row" style="margin-top:12px;">
                    <div class="form-group"><label>Descuento (%)</label><input type="number" id="estDiscount" value="0" min="0" max="100" onchange="updateEstimateTotals()"></div>
                    <div class="form-group"><label>Tax (%)</label><input type="number" id="estTax" value="8.75" step="0.25" onchange="updateEstimateTotals()"></div>
                  </div>
                  <div id="estimateTotals" class="est-totals"></div>
                  <div class="form-group" style="margin-top:12px;"><label>Notas para el cliente</label><textarea id="estNotes" rows="3" placeholder="Garantía, condiciones, recomendaciones..."></textarea></div>
                  <div class="form-actions" style="margin-top:16px;">
                    <button class="btn-primary" onclick="generateEstimatePDF()">📄 Generar Estimado PDF</button>
                    <button class="btn-secondary" onclick="presentEstimateToClient()">📱 Presentar al Cliente</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="card">
              <h3>📋 Estimados Guardados</h3>
              <div id="savedEstimates"><p class="empty-msg">No hay estimados guardados</p></div>
            </div>
          </div>
          <!-- ===== HOME ADVISORS (Vendedores) ===== -->
          <div id="advisors-section" class="section">
            <div class="card">
              <div class="card-top"><h3>🏠 Home Advisors (Vendedores)</h3><button class="btn-primary btn-sm" onclick="showAdvisorForm()">+ Nuevo Advisor</button></div>
              <div id="advisorFormContainer" style="display:none;margin-bottom:16px;">
                <form id="advisorForm" onsubmit="handleAdvisorCreate(event)">
                  <div class="form-row">
                    <div class="form-group"><label>Nombre</label><input type="text" id="advisorName" required placeholder="Nombre completo"></div>
                    <div class="form-group"><label>Teléfono</label><input type="tel" id="advisorPhone" required placeholder="(555) 123-4567"></div>
                  </div>
                  <div class="form-row">
                    <div class="form-group"><label>Email</label><input type="email" id="advisorEmail" placeholder="email@empresa.com"></div>
                    <div class="form-group"><label>Especialidad</label>
                      <select id="advisorSpecialty">
                        <option value="Residencial">Residencial</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Residencial y Comercial">Residencial y Comercial</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group"><label>Zona de cobertura</label><input type="text" id="advisorZone" placeholder="Ej: Inland Empire, San Bernardino, Riverside"></div>
                  <div class="form-actions">
                    <button type="submit" class="btn-primary btn-sm">Guardar</button>
                    <button type="button" class="btn-secondary btn-sm" onclick="hideAdvisorForm()">Cancelar</button>
                  </div>
                </form>
              </div>
              <div id="advisorsList"></div>
            </div>
            <div class="card">
              <div class="card-top"><h3>📋 Órdenes Referidas</h3></div>
              <p style="color:var(--text-muted);font-size:12px;margin-bottom:12px;">Trabajos referidos por técnicos para reemplazo de equipo</p>
              <div id="referralsList"></div>
            </div>
          </div>

          <!-- ===== INVOICES (Facturas) ===== -->
          <div id="invoices-section" class="section">
            <div class="card">
              <div class="card-top">
                <h3>📄 Facturas</h3>
                <div style="display:flex;gap:8px;align-items:center;">
                  <select id="invoiceFilterStatus" class="inline-select" onchange="renderInvoicesTable()" style="padding:8px 12px;font-size:12px;">
                    <option value="all">Todas</option>
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviadas</option>
                    <option value="paid">Pagadas</option>
                    <option value="partial">Pago Parcial</option>
                    <option value="overdue">Vencidas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                  <button class="btn-primary btn-sm" onclick="showInvoiceForm()">+ Nueva Factura</button>
                </div>
              </div>

              <!-- Invoice KPIs -->
              <div class="invoice-kpis" id="invoiceKPIs"></div>

              <!-- Invoice Form -->
              <div id="invoiceFormContainer" style="display:none;margin:16px 0;padding:20px;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;">
                <h4 style="margin-bottom:16px;color:var(--primary);">📄 Nueva Factura</h4>
                <form id="invoiceForm" onsubmit="handleInvoiceCreate(event)">
                  <!-- Source: from job or manual -->
                  <div class="form-group">
                    <label>Crear desde Trabajo (opcional)</label>
                    <select id="invJobSelect" onchange="loadInvoiceFromJob()">
                      <option value="">— Factura manual —</option>
                    </select>
                  </div>

                  <div class="form-row">
                    <div class="form-group"><label>Nombre del Cliente</label><input type="text" id="invClientName" required placeholder="Nombre completo"></div>
                    <div class="form-group"><label>Teléfono</label><input type="tel" id="invClientPhone" placeholder="(555) 123-4567"></div>
                  </div>
                  <div class="form-row">
                    <div class="form-group"><label>Email</label><input type="email" id="invClientEmail" placeholder="email@cliente.com"></div>
                    <div class="form-group"><label>Dirección</label><input type="text" id="invClientAddress" placeholder="Dirección del servicio"></div>
                  </div>
                  <div class="form-row">
                    <div class="form-group"><label>Técnico</label>
                      <select id="invTechSelect"><option value="">Seleccionar...</option></select>
                    </div>
                    <div class="form-group"><label>Fecha de Vencimiento</label><input type="date" id="invDueDate"></div>
                  </div>

                  <!-- Line Items -->
                  <div style="margin:16px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                      <label style="font-weight:600;font-size:13px;color:var(--primary);">Líneas de Factura</label>
                      <button type="button" class="btn-secondary btn-sm" onclick="addInvoiceLine()" style="padding:6px 12px;font-size:11px;">+ Agregar Línea</button>
                    </div>
                    <div id="invoiceLines"></div>
                  </div>

                  <!-- Service Call -->
                  <div class="form-row">
                    <div class="form-group"><label>Service Call Fee ($)</label><input type="number" id="invServiceCall" value="0" min="0" step="0.01" onchange="calcInvoiceTotals()"></div>
                    <div class="form-group"><label>Descuento (%)</label><input type="number" id="invDiscount" value="0" min="0" max="100" onchange="calcInvoiceTotals()"></div>
                    <div class="form-group"><label>Tax (%)</label><input type="number" id="invTax" value="8.75" step="0.25" onchange="calcInvoiceTotals()"></div>
                  </div>

                  <!-- Totals Preview -->
                  <div id="invoiceTotalsPreview" class="est-totals" style="margin:12px 0;padding:12px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;"></div>

                  <div class="form-group"><label>Notas para el Cliente</label><textarea id="invNotes" rows="2" placeholder="Garantía, términos, condiciones..."></textarea></div>
                  <div class="form-group"><label>Notas Internas (no se muestran al cliente)</label><textarea id="invInternalNotes" rows="2" placeholder="Notas internas..."></textarea></div>

                  <div class="form-actions" style="margin-top:12px;">
                    <button type="submit" class="btn-primary btn-sm">💾 Guardar Factura</button>
                    <button type="button" class="btn-secondary btn-sm" onclick="hideInvoiceForm()">Cancelar</button>
                  </div>
                </form>
              </div>

              <!-- Invoice Table -->
              <div id="invoicesTable"></div>
            </div>

            <!-- Invoice Detail Modal -->
            <div id="invoiceDetailModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;overflow-y:auto;">
              <div style="max-width:700px;margin:40px auto;background:var(--bg-card);border-radius:12px;padding:30px;position:relative;">
                <button onclick="closeInvoiceDetail()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">✕</button>
                <div id="invoiceDetailContent"></div>
              </div>
            </div>
          </div>
          <!-- ===== COLLECTIONS (Cobranza) ===== -->
          <div id="collections-section" class="section">
            <div class="card">
              <div class="card-top">
                <h3>💰 Cobranza</h3>
                <select id="collectionsFilter" class="inline-select" onchange="renderCollections()" style="padding:8px 12px;font-size:12px;">
                  <option value="all_due">Todas con Balance</option>
                  <option value="overdue">Vencidas</option>
                  <option value="partial">Pago Parcial</option>
                  <option value="sent">Enviadas (sin pago)</option>
                  <option value="recent_paid">Recién Pagadas</option>
                </select>
              </div>

              <!-- Collections KPIs -->
              <div id="collectionsKPIs" class="invoice-kpi-row"></div>

              <!-- Collections Table -->
              <div id="collectionsTable"></div>
            </div>

            <!-- Payment History -->
            <div class="card" style="margin-top:16px;">
              <h3>📋 Historial de Pagos</h3>
              <div id="paymentsHistory"></div>
            </div>
          </div>
          <div id="settings-section" class="section">
            <div class="card">
              <h3>Configuración de la Empresa</h3>
              <div class="settings-form">
                <div class="form-group">
                  <label>Logo de la Empresa</label>
                  <div class="logo-upload-area">
                    <div id="logoPreview" class="logo-preview">
                      <span>Haz clic para subir logo</span>
                    </div>
                    <input type="file" id="logoFileInput" accept="image/*" onchange="handleLogoUpload(event)" style="display:none;">
                    <button class="btn-secondary btn-sm" onclick="document.getElementById('logoFileInput').click()">📷 Cambiar Logo</button>
                    <button class="btn-secondary btn-sm" onclick="resetLogo()">↩️ Logo Default</button>
                  </div>
                </div>
                <div class="form-group"><label>Nombre de la Empresa</label><input type="text" id="settingsCompanyName" placeholder="Nombre"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="settingsPhone" placeholder="Teléfono"></div>
                <div class="form-group"><label>Email</label><input type="email" id="settingsEmail" placeholder="Email"></div>
                <button class="btn-primary btn-sm" onclick="saveSettings()">Guardar Configuración</button>
                
                <hr style="margin:20px 0;border-color:var(--border);">
                <h4 style="color:var(--primary);margin-bottom:4px;">📋 Cláusulas del Contrato / Invoice</h4>
                <p style="font-size:11px;color:var(--text-muted);margin-bottom:16px;">Personaliza los términos legales que aparecen en tus facturas e invoices. Edita según las leyes de tu estado.</p>
                
                <div class="form-group">
                  <label>Estado / State</label>
                  <select id="clauseState" onchange="loadDefaultClauses()" style="max-width:300px;">
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="AZ">Arizona</option>
                    <option value="NV">Nevada</option>
                    <option value="FL">Florida</option>
                    <option value="NY">New York</option>
                    <option value="OTHER">Otro Estado</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>💰 Términos de Pago / Payment Terms</label>
                  <textarea id="clausePayment" rows="4" style="font-size:12px;"></textarea>
                </div>
                <div class="form-group">
                  <label>⚠️ Derecho de Cancelación / Right to Cancel</label>
                  <textarea id="clauseCancel" rows="5" style="font-size:12px;"></textarea>
                </div>
                <div class="form-group">
                  <label>🔄 Cancelación & Restocking Fee</label>
                  <textarea id="clauseRestock" rows="5" style="font-size:12px;"></textarea>
                </div>
                <div class="form-group">
                  <label>🏛️ Aviso de Licencia del Contratista (CSLB / State Board)</label>
                  <textarea id="clauseLicense" rows="4" style="font-size:12px;"></textarea>
                </div>
                <div class="form-group">
                  <label>💵 Enganche / Down Payment Limit</label>
                  <textarea id="clauseDownPayment" rows="3" style="font-size:12px;"></textarea>
                </div>
                <div class="form-group">
                  <label>🔗 Aviso de Liens / Mechanics Lien Warning</label>
                  <textarea id="clauseLien" rows="3" style="font-size:12px;"></textarea>
                </div>
                <div class="form-group">
                  <label>🛡️ Garantía / Warranty</label>
                  <textarea id="clauseWarranty" rows="3" style="font-size:12px;"></textarea>
                </div>
                <div class="form-group">
                  <label>🔒 Política de Privacidad / Privacy Policy</label>
                  <textarea id="clausePrivacy" rows="3" style="font-size:12px;"></textarea>
                </div>
                <div class="form-group">
                  <label>📝 Cláusula Adicional (Opcional)</label>
                  <textarea id="clauseCustom" rows="3" style="font-size:12px;" placeholder="Agrega cualquier término adicional aquí..."></textarea>
                </div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button class="btn-primary btn-sm" onclick="saveClauses()">💾 Guardar Cláusulas</button>
                  <button class="btn-secondary btn-sm" onclick="loadDefaultClauses()">🔄 Restaurar Defaults</button>
                </div>

                <hr style="margin:20px 0;border-color:var(--border);">
                <h4 style="color:var(--primary);margin-bottom:12px;">🧪 Datos de Demostración</h4>
                <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Crea técnicos, clientes, leads y citas de ejemplo para probar el sistema.</p>
                <button class="btn-secondary btn-sm" onclick="seedDemoData()">🎲 Crear Datos Demo</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>

    <!-- ==================== TECH TRACKING PAGE (separate URL) ==================== -->
    <div id="techTrackingPage" style="display:none;">
      <div class="tracking-container">
        <div class="tracking-header">
          <span>🔧</span>
          <h2>Trade Master - GPS Tracking</h2>
        </div>
        <h3 id="trackingTechName" style="text-align:center;color:var(--primary);margin-bottom:12px;">Técnico</h3>
        <div id="trackingStatus" class="tracking-status">Conectando...</div>
        <div id="trackingMap" style="width:100%;height:350px;border-radius:8px;margin:16px 0;"></div>
        <button id="clockInBtn" class="btn-primary" onclick="toggleClockIn()">🟢 Iniciar Jornada (Clock In)</button>
        <button id="trackingBtn" class="btn-primary" onclick="toggleTracking()" style="display:none;margin-top:10px;">⏸️ Pausar Tracking GPS</button>
        <p id="trackingInfo" style="color:#94a3b8;font-size:13px;text-align:center;margin-top:12px;"></p>
        <div class="tracking-hours-info">
          <p>📍 Tu ubicación se envía cada 30 segundos mientras estés en servicio</p>
          <p>🔴 Al terminar tu jornada, haz Clock Out para dejar de compartir ubicación</p>
        </div>
      </div>
    </div>

    <script src="script.js"></script>
  </body>
</html>
