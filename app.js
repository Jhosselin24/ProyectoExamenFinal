const app = document.getElementById("app");
const nav = document.getElementById("nav");
const userBadge = document.getElementById("user-badge");
const logoutBtn = document.getElementById("logout-btn");

const API_BASE = "https://back-gestion-de-tickets-jcel.vercel.app/";

const ROUTES = {
  login: renderLogin,
  modulos: renderModulos,
  tecnicos: renderTecnicos,
  clientes: renderClientes,
  tickets: renderTickets,
};

class ApiError extends Error {
  constructor(message, status, authIssue = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.authIssue = authIssue;
  }
}

function getSession() {
  const raw = localStorage.getItem("session");
  return raw ? JSON.parse(raw) : null;
}

function setSession(session) {
  localStorage.setItem("session", JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem("session");
}

function getRoute() {
  const hash = window.location.hash.replace("#/", "");
  return hash || "login";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeDate(rawDate) {
  if (!rawDate) return "";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getEntityId(entity) {
  if (!entity) return "";
  if (typeof entity === "string") return entity;
  return entity._id || "";
}

async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = true } = options;
  const headers = {};
  const session = getSession();

  if (auth) {
    if (!session?.token) {
      throw new ApiError("No hay una sesión activa.", 401, true);
    }
    headers.Authorization = `Bearer ${session.token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError("No se pudo conectar con el backend.", 0, false);
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message = data.msg || `Error HTTP ${response.status}`;
    const authIssue = /token/i.test(message);
    throw new ApiError(message, response.status, authIssue);
  }

  return data;
}

function handleProtectedError(error) {
  if (error instanceof ApiError && (error.authIssue || error.status === 401)) {
    clearSession();
    updateNav();
    window.location.hash = "#/login";
    return "Tu sesión expiró o no es válida.";
  }
  if (error instanceof ApiError) return error.message;
  return "Ocurrió un error inesperado.";
}

function loginErrorMessage(error) {
  if (!(error instanceof ApiError)) return "Usuario o contraseña incorrectos.";
  if (error.status === 404) return "Usuario o contraseña incorrectos.";
  if (error.status === 0) return "No se pudo conectar con el backend.";
  if (/usuario|password|clave|credencial/i.test(error.message)) {
    return "Usuario o contraseña incorrectos.";
  }
  return error.message;
}

function registerErrorMessage(error) {
  if (!(error instanceof ApiError)) return "No se pudo registrar el usuario.";
  if (error.status === 0) return "No se pudo conectar con el backend.";
  return error.message || "No se pudo registrar el usuario.";
}

function updateNav() {
  const session = getSession();
  if (!session) {
    nav.innerHTML = "";
    userBadge.textContent = "";
    logoutBtn.classList.add("hidden");
    return;
  }

  const route = getRoute();
  const links = [
    { href: "#/modulos", label: "Módulos" },
    { href: "#/tecnicos", label: "Técnicos" },
    { href: "#/clientes", label: "Clientes" },
    { href: "#/tickets", label: "Tickets" },
  ];

  nav.innerHTML = links
    .map(
      (link) =>
        `<a href="${link.href}" class="${
          route === link.href.replace("#/", "") ? "active" : ""
        }">${link.label}</a>`
    )
    .join("");

  userBadge.textContent = `Sesión: ${session.name}`;
  logoutBtn.classList.remove("hidden");
}

async function renderRoute() {
  const session = getSession();
  const route = getRoute();

  if (!session && route !== "login") {
    window.location.hash = "#/login";
    return;
  }

  if (session && route === "login") {
    window.location.hash = "#/modulos";
    return;
  }

  updateNav();
  const render = ROUTES[route] || renderLogin;
  await render();
}

async function renderLogin() {
  app.innerHTML = `
    <section class="card login-card">
      <h1 id="auth-title" class="title">Iniciar sesión</h1>
      <p id="auth-subtitle" class="subtitle">Acceso a los módulos del sistema.</p>
      <div class="btn-group">
        <button id="tab-login" class="btn secondary" type="button">Iniciar sesión</button>
        <button id="tab-register" class="btn ghost" type="button">Registrarse</button>
      </div>
      <div id="auth-alert" class="alert hidden"></div>
      <form id="login-form" class="form-grid">
        <div>
          <label>Email</label>
          <input type="email" name="email" placeholder="correo@empresa.com" required />
        </div>
        <div>
          <label>Clave</label>
          <input type="password" name="password" placeholder="********" required />
        </div>
        <div class="btn-group">
          <button id="login-btn" class="btn" type="submit">Ingresar</button>
        </div>
      </form>
      <form id="register-form" class="form-grid hidden">
        <div>
          <label>Nombre</label>
          <input type="text" name="nombre" placeholder="Tu nombre" required />
        </div>
        <div>
          <label>Apellido</label>
          <input type="text" name="apellido" placeholder="Tu apellido" required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" name="email" placeholder="correo@empresa.com" required />
        </div>
        <div>
          <label>Clave</label>
          <input type="password" name="password" placeholder="********" required />
        </div>
        <div>
          <label>Confirmar clave</label>
          <input type="password" name="confirmPassword" placeholder="********" required />
        </div>
        <div class="btn-group">
          <button id="register-btn" class="btn" type="submit">Crear cuenta</button>
        </div>
      </form>
      <p id="auth-hint" class="subtitle">Usa un usuario registrado en el backend.</p>
    </section>
  `;

  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  const hint = document.getElementById("auth-hint");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const alertBox = document.getElementById("auth-alert");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");

  function clearAlert() {
    alertBox.textContent = "";
    alertBox.classList.add("hidden");
    alertBox.classList.remove("ok");
  }

  function showAlert(message, type = "error") {
    alertBox.textContent = message;
    alertBox.classList.remove("hidden");
    alertBox.classList.toggle("ok", type === "ok");
  }

  function setMode(mode) {
    clearAlert();
    const isLogin = mode === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    tabLogin.className = isLogin ? "btn secondary" : "btn ghost";
    tabRegister.className = isLogin ? "btn ghost" : "btn secondary";
    title.textContent = isLogin ? "Iniciar sesión" : "Registrarse";
    subtitle.textContent = isLogin
      ? "Acceso a los módulos del sistema."
      : "Crea un usuario para ingresar al sistema.";
    hint.textContent = isLogin
      ? "Usa un usuario registrado en el backend."
      : "Después del registro podrás iniciar sesión.";
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert();
    loginBtn.disabled = true;

    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value.trim();

    try {
      const data = await apiRequest("/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });

      const fullName = [data.nombre, data.apellido].filter(Boolean).join(" ");
      setSession({
        token: data.token,
        name: fullName || data.email,
        email: data.email,
        userId: data._id,
      });

      loginForm.reset();
      window.location.hash = "#/modulos";
    } catch (error) {
      showAlert(loginErrorMessage(error));
    } finally {
      loginBtn.disabled = false;
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert();
    registerBtn.disabled = true;

    const nombre = registerForm.nombre.value.trim();
    const apellido = registerForm.apellido.value.trim();
    const email = registerForm.email.value.trim().toLowerCase();
    const password = registerForm.password.value.trim();
    const confirmPassword = registerForm.confirmPassword.value.trim();

    if (password !== confirmPassword) {
      showAlert("Las contraseñas no coinciden.");
      registerBtn.disabled = false;
      return;
    }

    try {
      await apiRequest("/registro", {
        method: "POST",
        auth: false,
        body: { nombre, apellido, email, password },
      });

      registerForm.reset();
      setMode("login");
      loginForm.email.value = email;
      showAlert("Usuario registrado correctamente. Ahora inicia sesión.", "ok");
    } catch (error) {
      showAlert(registerErrorMessage(error));
    } finally {
      registerBtn.disabled = false;
    }
  });

  setMode("login");
}

async function renderModulos() {
  const session = getSession();

  app.innerHTML = `
    <section class="card">
      <div class="welcome">Bienvenido - ${escapeHtml(session.name)}</div>
      <h1 class="title">Módulos asignados</h1>
      <p class="subtitle">Seleccione un módulo para iniciar la gestión.</p>
      <div class="grid cols-3">
        <div class="card module-card">
          <h3>Técnicos</h3>
          <p>Registro y control de técnicos.</p>
          <button class="btn secondary" data-go="tecnicos">Entrar</button>
        </div>
        <div class="card module-card">
          <h3>Clientes</h3>
          <p>Administración de clientes.</p>
          <button class="btn secondary" data-go="clientes">Entrar</button>
        </div>
        <div class="card module-card">
          <h3>Tickets</h3>
          <p>Gestión de tickets de asistencia.</p>
          <button class="btn secondary" data-go="tickets">Entrar</button>
        </div>
      </div>
    </section>
  `;

  app.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.hash = `#/${button.dataset.go}`;
    });
  });
}

async function renderTecnicos() {
  const session = getSession();
  let tecnicos = [];
  let globalError = "";

  try {
    const data = await apiRequest("/tecnicos");
    tecnicos = data.tecnicos || [];
  } catch (error) {
    globalError = handleProtectedError(error);
  }

  app.innerHTML = `
    <section class="card">
      <div class="welcome">Bienvenido - ${escapeHtml(session.name)}</div>
      <h1 class="title">Técnicos</h1>
      <p class="subtitle">Gestión CRUD conectada al backend.</p>
      ${globalError ? `<div class="alert">${escapeHtml(globalError)}</div>` : ""}
      <div id="tecnico-form-alert" class="alert hidden"></div>
      <form id="tecnico-form" class="form-grid">
        <input type="hidden" name="id" />
        <div><label>Nombre</label><input name="nombre" required /></div>
        <div><label>Apellido</label><input name="apellido" required /></div>
        <div><label>Cédula</label><input name="cedula" required /></div>
        <div><label>Fecha de nacimiento</label><input type="date" name="fecha_de_nacimiento" required /></div>
        <div>
          <label>Género</label>
          <select name="genero" required>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div><label>Ciudad</label><input name="ciudad" required /></div>
        <div><label>Dirección</label><input name="direccion" required /></div>
        <div><label>Teléfono</label><input name="telefono" required /></div>
        <div><label>Email</label><input type="email" name="email" required /></div>
        <div class="btn-group">
          <button class="btn" type="submit" id="tecnico-save">Guardar técnico</button>
          <button class="btn ghost" type="button" id="tecnico-cancel">Cancelar</button>
        </div>
      </form>
    </section>
    <section class="card">
      <h2 class="title">Listado</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Ciudad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${
            tecnicos.length
              ? tecnicos
                  .map(
                    (item) => `
            <tr>
              <td>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</td>
              <td>${escapeHtml(item.cedula)}</td>
              <td>${escapeHtml(item.email)}</td>
              <td>${escapeHtml(item.telefono)}</td>
              <td>${escapeHtml(item.ciudad)}</td>
              <td class="btn-group">
                <button class="btn secondary" data-edit="${item._id}">Editar</button>
                <button class="btn danger" data-delete="${item._id}">Eliminar</button>
              </td>
            </tr>
          `
                  )
                  .join("")
              : `<tr><td colspan="6">No hay técnicos registrados.</td></tr>`
          }
        </tbody>
      </table>
    </section>
  `;

  const form = document.getElementById("tecnico-form");
  const saveBtn = document.getElementById("tecnico-save");
  const cancelBtn = document.getElementById("tecnico-cancel");
  const formAlert = document.getElementById("tecnico-form-alert");

  if (globalError) {
    saveBtn.disabled = true;
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formAlert.classList.add("hidden");
    saveBtn.disabled = true;

    const payload = {
      nombre: form.nombre.value.trim(),
      apellido: form.apellido.value.trim(),
      cedula: Number(form.cedula.value.trim()),
      fecha_de_nacimiento: form.fecha_de_nacimiento.value,
      fecha_nacimiento: form.fecha_de_nacimiento.value,
      genero: form.genero.value,
      ciudad: form.ciudad.value.trim(),
      direccion: form.direccion.value.trim(),
      telefono: form.telefono.value.trim(),
      email: form.email.value.trim().toLowerCase(),
    };

    const id = form.id.value.trim();

    try {
      if (id) {
        await apiRequest(`/tecnico/${id}`, { method: "PUT", body: payload });
      } else {
        await apiRequest("/tecnico", { method: "POST", body: payload });
      }
      await renderTecnicos();
    } catch (error) {
      formAlert.textContent = handleProtectedError(error);
      formAlert.classList.remove("hidden");
      saveBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener("click", () => {
    form.reset();
    form.id.value = "";
  });

  app.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = tecnicos.find((tecnico) => tecnico._id === button.dataset.edit);
      if (!item) return;
      form.id.value = item._id;
      form.nombre.value = item.nombre || "";
      form.apellido.value = item.apellido || "";
      form.cedula.value = item.cedula || "";
      form.fecha_de_nacimiento.value = normalizeDate(item.fecha_de_nacimiento);
      form.genero.value = item.genero || "Masculino";
      form.ciudad.value = item.ciudad || "";
      form.direccion.value = item.direccion || "";
      form.telefono.value = item.telefono || "";
      form.email.value = item.email || "";
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  app.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest(`/tecnico/${button.dataset.delete}`, { method: "DELETE" });
        await renderTecnicos();
      } catch (error) {
        formAlert.textContent = handleProtectedError(error);
        formAlert.classList.remove("hidden");
      }
    });
  });
}

async function renderClientes() {
  const session = getSession();
  let clientes = [];
  let globalError = "";

  try {
    const data = await apiRequest("/clientes");
    clientes = data.clientes || [];
  } catch (error) {
    globalError = handleProtectedError(error);
  }

  app.innerHTML = `
    <section class="card">
      <div class="welcome">Bienvenido - ${escapeHtml(session.name)}</div>
      <h1 class="title">Clientes</h1>
      <p class="subtitle">Gestión CRUD conectada al backend.</p>
      ${globalError ? `<div class="alert">${escapeHtml(globalError)}</div>` : ""}
      <div id="cliente-form-alert" class="alert hidden"></div>
      <form id="cliente-form" class="form-grid">
        <input type="hidden" name="id" />
        <div><label>Cédula</label><input name="cedula" required /></div>
        <div><label>Nombre</label><input name="nombre" required /></div>
        <div><label>Apellido</label><input name="apellido" required /></div>
        <div><label>Ciudad</label><input name="ciudad" required /></div>
        <div><label>Email</label><input type="email" name="email" required /></div>
        <div><label>Dirección</label><input name="direccion" required /></div>
        <div><label>Teléfono</label><input name="telefono" required /></div>
        <div><label>Fecha de nacimiento</label><input type="date" name="fecha_de_nacimiento" required /></div>
        <div class="btn-group">
          <button class="btn" type="submit" id="cliente-save">Guardar cliente</button>
          <button class="btn ghost" type="button" id="cliente-cancel">Cancelar</button>
        </div>
      </form>
    </section>
    <section class="card">
      <h2 class="title">Listado</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Ciudad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${
            clientes.length
              ? clientes
                  .map(
                    (item) => `
            <tr>
              <td>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</td>
              <td>${escapeHtml(item.cedula)}</td>
              <td>${escapeHtml(item.email)}</td>
              <td>${escapeHtml(item.telefono)}</td>
              <td>${escapeHtml(item.ciudad)}</td>
              <td class="btn-group">
                <button class="btn secondary" data-edit="${item._id}">Editar</button>
                <button class="btn danger" data-delete="${item._id}">Eliminar</button>
              </td>
            </tr>
          `
                  )
                  .join("")
              : `<tr><td colspan="6">No hay clientes registrados.</td></tr>`
          }
        </tbody>
      </table>
    </section>
  `;

  const form = document.getElementById("cliente-form");
  const saveBtn = document.getElementById("cliente-save");
  const cancelBtn = document.getElementById("cliente-cancel");
  const formAlert = document.getElementById("cliente-form-alert");

  if (globalError) {
    saveBtn.disabled = true;
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formAlert.classList.add("hidden");
    saveBtn.disabled = true;

    const payload = {
      cedula: Number(form.cedula.value.trim()),
      nombre: form.nombre.value.trim(),
      apellido: form.apellido.value.trim(),
      ciudad: form.ciudad.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      direccion: form.direccion.value.trim(),
      telefono: form.telefono.value.trim(),
      fecha_de_nacimiento: form.fecha_de_nacimiento.value,
      fecha_nacimiento: form.fecha_de_nacimiento.value,
    };

    const id = form.id.value.trim();

    try {
      if (id) {
        await apiRequest(`/cliente/${id}`, { method: "PUT", body: payload });
      } else {
        await apiRequest("/cliente", { method: "POST", body: payload });
      }
      await renderClientes();
    } catch (error) {
      formAlert.textContent = handleProtectedError(error);
      formAlert.classList.remove("hidden");
      saveBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener("click", () => {
    form.reset();
    form.id.value = "";
  });

  app.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = clientes.find((cliente) => cliente._id === button.dataset.edit);
      if (!item) return;
      form.id.value = item._id;
      form.cedula.value = item.cedula || "";
      form.nombre.value = item.nombre || "";
      form.apellido.value = item.apellido || "";
      form.ciudad.value = item.ciudad || "";
      form.email.value = item.email || "";
      form.direccion.value = item.direccion || "";
      form.telefono.value = item.telefono || "";
      form.fecha_de_nacimiento.value = normalizeDate(item.fecha_de_nacimiento);
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  app.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest(`/cliente/${button.dataset.delete}`, { method: "DELETE" });
        await renderClientes();
      } catch (error) {
        formAlert.textContent = handleProtectedError(error);
        formAlert.classList.remove("hidden");
      }
    });
  });
}

async function renderTickets() {
  const session = getSession();
  let tickets = [];
  let clientes = [];
  let tecnicos = [];
  let globalError = "";

  try {
    const [ticketsRes, clientesRes, tecnicosRes] = await Promise.all([
      apiRequest("/tickets"),
      apiRequest("/clientes"),
      apiRequest("/tecnicos"),
    ]);
    tickets = ticketsRes.tickets || [];
    clientes = clientesRes.clientes || [];
    tecnicos = tecnicosRes.tecnicos || [];
  } catch (error) {
    globalError = handleProtectedError(error);
  }

  const hasData = clientes.length > 0 && tecnicos.length > 0;

  app.innerHTML = `
    <section class="card">
      <div class="welcome">Bienvenido - ${escapeHtml(session.name)}</div>
      <h1 class="title">Tickets</h1>
      <p class="subtitle">Gestión CRUD conectada al backend.</p>
      ${globalError ? `<div class="alert">${escapeHtml(globalError)}</div>` : ""}
      ${
        !globalError && !hasData
          ? `<div class="alert">Para crear tickets necesitas al menos un cliente y un técnico.</div>`
          : ""
      }
      <div id="ticket-form-alert" class="alert hidden"></div>
      <form id="ticket-form" class="form-grid">
        <input type="hidden" name="id" />
        <div><label>Código</label><input name="codigo" required /></div>
        <div>
          <label>Cliente</label>
          <select name="cliente" required>
            <option value="">Selecciona un cliente</option>
            ${clientes
              .map(
                (item) =>
                  `<option value="${item._id}">${escapeHtml(item.nombre)} ${escapeHtml(
                    item.apellido
                  )}</option>`
              )
              .join("")}
          </select>
        </div>
        <div>
          <label>Técnico</label>
          <select name="tecnico" required>
            <option value="">Selecciona un técnico</option>
            ${tecnicos
              .map(
                (item) =>
                  `<option value="${item._id}">${escapeHtml(item.nombre)} ${escapeHtml(
                    item.apellido
                  )}</option>`
              )
              .join("")}
          </select>
        </div>
        <div>
          <label>Descripción</label>
          <textarea name="descripcion" required></textarea>
        </div>
        <div class="btn-group">
          <button class="btn" type="submit" id="ticket-save">Guardar ticket</button>
          <button class="btn ghost" type="button" id="ticket-cancel">Cancelar</button>
        </div>
      </form>
    </section>
    <section class="card">
      <h2 class="title">Listado</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Técnico</th>
            <th>Descripción</th>
            <th>Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${
            tickets.length
              ? tickets
                  .map((ticket) => {
                    const clienteNombre = ticket.cliente
                      ? `${ticket.cliente.nombre || ""} ${ticket.cliente.apellido || ""}`.trim()
                      : "N/D";
                    const tecnicoNombre = ticket.tecnico
                      ? `${ticket.tecnico.nombre || ""} ${ticket.tecnico.apellido || ""}`.trim()
                      : "N/D";
                    return `
                      <tr>
                        <td>${escapeHtml(ticket.codigo)}</td>
                        <td>${escapeHtml(clienteNombre)}</td>
                        <td>${escapeHtml(tecnicoNombre)}</td>
                        <td>${escapeHtml(ticket.descripcion)}</td>
                        <td>${escapeHtml(normalizeDate(ticket.createdAt))}</td>
                        <td class="btn-group">
                          <button class="btn secondary" data-edit="${ticket._id}">Editar</button>
                          <button class="btn danger" data-delete="${ticket._id}">Eliminar</button>
                        </td>
                      </tr>
                    `;
                  })
                  .join("")
              : `<tr><td colspan="6">No hay tickets registrados.</td></tr>`
          }
        </tbody>
      </table>
    </section>
  `;

  const form = document.getElementById("ticket-form");
  const saveBtn = document.getElementById("ticket-save");
  const cancelBtn = document.getElementById("ticket-cancel");
  const formAlert = document.getElementById("ticket-form-alert");

  if (globalError || !hasData) {
    saveBtn.disabled = true;
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formAlert.classList.add("hidden");
    saveBtn.disabled = true;

    const payload = {
      codigo: form.codigo.value.trim(),
      descripcion: form.descripcion.value.trim(),
      cliente: form.cliente.value,
      tecnico: form.tecnico.value,
    };

    const id = form.id.value.trim();

    try {
      if (id) {
        await apiRequest(`/ticket/${id}`, { method: "PUT", body: payload });
      } else {
        await apiRequest("/ticket", { method: "POST", body: payload });
      }
      await renderTickets();
    } catch (error) {
      formAlert.textContent = handleProtectedError(error);
      formAlert.classList.remove("hidden");
      saveBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener("click", () => {
    form.reset();
    form.id.value = "";
  });

  app.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const ticket = tickets.find((item) => item._id === button.dataset.edit);
      if (!ticket) return;

      form.id.value = ticket._id;
      form.codigo.value = ticket.codigo || "";
      form.descripcion.value = ticket.descripcion || "";
      form.cliente.value = getEntityId(ticket.cliente);
      form.tecnico.value = getEntityId(ticket.tecnico);
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  app.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest(`/ticket/${button.dataset.delete}`, { method: "DELETE" });
        await renderTickets();
      } catch (error) {
        formAlert.textContent = handleProtectedError(error);
        formAlert.classList.remove("hidden");
      }
    });
  });
}

logoutBtn.addEventListener("click", () => {
  clearSession();
  updateNav();
  window.location.hash = "#/login";
});

window.addEventListener("hashchange", () => {
  renderRoute();
});

renderRoute();
