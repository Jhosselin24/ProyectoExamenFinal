const app = document.getElementById("app");
const nav = document.getElementById("nav");
const userBadge = document.getElementById("user-badge");
const logoutBtn = document.getElementById("logout-btn");
const API_BASE = "https://back-gestion-de-tickets-8pwm.vercel.app/";

const USERS = [
  {
    id: 1,
    name: "Administrador",
    email: "admin@soporte.com",
    password: "Admin123",
  },
  {
    id: 2,
    name: "Soporte",
    email: "soporte@soporte.com",
    password: "Soporte123",
  },
];

const STORE_KEYS = {
  tecnicos: "app_tecnicos",
  clientes: "app_clientes",
  tickets: "app_tickets",
};

const DEFAULT_DATA = {
  tecnicos: [
    {
      id: 1,
      nombre: "Carla Mejia",
      email: "cmejia@soporte.com",
      telefono: "099 345 2211",
      especialidad: "Redes",
    },
    {
      id: 2,
      nombre: "Luis Herrera",
      email: "lherrera@soporte.com",
      telefono: "098 445 1177",
      especialidad: "Hardware",
    },
  ],
  clientes: [
    {
      id: 1,
      nombre: "Karla Tapia",
      email: "ktapia@empresa.com",
      telefono: "098 112 3344",
      empresa: "NovaTech",
    },
    {
      id: 2,
      nombre: "Miguel Luna",
      email: "mluna@empresa.com",
      telefono: "097 445 8899",
      empresa: "AndesWare",
    },
  ],
  tickets: [
    {
      id: 1,
      clienteId: 1,
      tecnicoIds: [1, 2],
      asunto: "Conexion intermitente",
      descripcion: "La red de oficina se corta cada hora.",
      prioridad: "Alta",
      estado: "En proceso",
      fecha: "2026-02-20",
    },
  ],
};

const ROUTES = {
  login: renderLogin,
  modulos: renderModulos,
  tecnicos: renderTecnicos,
  clientes: renderClientes,
  tickets: renderTickets,
};

function getSession() {
  const raw = localStorage.getItem("session");
  return raw ? JSON.parse(raw) : null;
}

function setSession(user) {
  localStorage.setItem("session", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("session");
}

function readStore(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function ensureSeedData() {
  Object.keys(STORE_KEYS).forEach((key) => {
    const storeKey = STORE_KEYS[key];
    if (!localStorage.getItem(storeKey)) {
      writeStore(storeKey, DEFAULT_DATA[key]);
    }
  });
}

function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
}

function getRoute() {
  const hash = window.location.hash.replace("#/", "");
  return hash || "login";
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

function renderRoute() {
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
  render();
}

function renderLogin() {
  app.innerHTML = `
    <section class="card login-card">
      <h1 class="title">Iniciar sesión</h1>
      <p class="subtitle">Acceso a los módulos del sistema.</p>
      <div id="login-alert" class="alert hidden"></div>
      <form id="login-form" class="form-grid">
        <div>
          <label>Email</label>
          <input type="email" name="email" placeholder="correo@empresa.com" required />
        </div>
        <div>
          <label>Clave</label>
          <input type="password" name="password" placeholder="••••••••" required />
        </div>
        <div class="btn-group">
          <button class="btn" type="submit">Ingresar</button>
        </div>
      </form>
      <p class="subtitle">Usuario demo: admin@soporte.com · Clave: Admin123</p>
    </section>
  `;

  const form = document.getElementById("login-form");
  const alertBox = document.getElementById("login-alert");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const user = USERS.find(
      (item) =>
        item.email.toLowerCase() === email && item.password === password
    );

    if (!user) {
      alertBox.textContent = "Usuario o contraseña incorrectos.";
      alertBox.classList.remove("hidden");
      return;
    }

    setSession({ name: user.name, email: user.email });
    form.reset();
    window.location.hash = "#/modulos";
  });
}

function renderModulos() {
  const session = getSession();
  app.innerHTML = `
    <section class="card">
      <div class="welcome">Bienvenido - ${session.name}</div>
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
          <p>Administración de clientes y contactos.</p>
          <button class="btn secondary" data-go="clientes">Entrar</button>
        </div>
        <div class="card module-card">
          <h3>Tickets</h3>
          <p>Reservas, asignaciones y seguimiento.</p>
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

function renderTecnicos() {
  const session = getSession();
  const tecnicos = readStore(STORE_KEYS.tecnicos);

  app.innerHTML = `
    <section class="card">
      <div class="welcome">Bienvenido - ${session.name}</div>
      <h1 class="title">Técnicos</h1>
      <p class="subtitle">Gestión CRUD de técnicos registrados.</p>
      <form id="tecnico-form" class="form-grid">
        <input type="hidden" name="id" />
        <div>
          <label>Nombre</label>
          <input name="nombre" required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" name="email" required />
        </div>
        <div>
          <label>Teléfono</label>
          <input name="telefono" required />
        </div>
        <div>
          <label>Especialidad</label>
          <input name="especialidad" required />
        </div>
        <div class="btn-group">
          <button class="btn" type="submit">Guardar técnico</button>
          <button class="btn ghost" type="button" id="tecnico-cancel">Cancelar</button>
        </div>
      </form>
    </section>
    <section class="card">
      <h2 class="title">Listado</h2>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Especialidad</th>
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
              <td>${item.id}</td>
              <td>${item.nombre}</td>
              <td>${item.email}</td>
              <td>${item.telefono}</td>
              <td>${item.especialidad}</td>
              <td class="btn-group">
                <button class="btn secondary" data-edit="${item.id}">Editar</button>
                <button class="btn danger" data-delete="${item.id}">Eliminar</button>
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
  const cancelBtn = document.getElementById("tecnico-cancel");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const id = Number(data.get("id"));
    const payload = {
      id: id || nextId(tecnicos),
      nombre: data.get("nombre").trim(),
      email: data.get("email").trim(),
      telefono: data.get("telefono").trim(),
      especialidad: data.get("especialidad").trim(),
    };

    if (id) {
      const index = tecnicos.findIndex((item) => item.id === id);
      tecnicos[index] = payload;
    } else {
      tecnicos.push(payload);
    }

    writeStore(STORE_KEYS.tecnicos, tecnicos);
    renderTecnicos();
  });

  cancelBtn.addEventListener("click", () => {
    form.reset();
    form.id.value = "";
  });

  app.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.edit);
      const item = tecnicos.find((t) => t.id === id);
      form.id.value = item.id;
      form.nombre.value = item.nombre;
      form.email.value = item.email;
      form.telefono.value = item.telefono;
      form.especialidad.value = item.especialidad;
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  app.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.delete);
      const filtered = tecnicos.filter((item) => item.id !== id);
      writeStore(STORE_KEYS.tecnicos, filtered);
      renderTecnicos();
    });
  });
}

function renderClientes() {
  const session = getSession();
  const clientes = readStore(STORE_KEYS.clientes);

  app.innerHTML = `
    <section class="card">
      <div class="welcome">Bienvenido - ${session.name}</div>
      <h1 class="title">Clientes</h1>
      <p class="subtitle">Gestión CRUD de clientes.</p>
      <form id="cliente-form" class="form-grid">
        <input type="hidden" name="id" />
        <div>
          <label>Nombre</label>
          <input name="nombre" required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" name="email" required />
        </div>
        <div>
          <label>Teléfono</label>
          <input name="telefono" required />
        </div>
        <div>
          <label>Empresa</label>
          <input name="empresa" required />
        </div>
        <div class="btn-group">
          <button class="btn" type="submit">Guardar cliente</button>
          <button class="btn ghost" type="button" id="cliente-cancel">Cancelar</button>
        </div>
      </form>
    </section>
    <section class="card">
      <h2 class="title">Listado</h2>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Empresa</th>
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
              <td>${item.id}</td>
              <td>${item.nombre}</td>
              <td>${item.email}</td>
              <td>${item.telefono}</td>
              <td>${item.empresa}</td>
              <td class="btn-group">
                <button class="btn secondary" data-edit="${item.id}">Editar</button>
                <button class="btn danger" data-delete="${item.id}">Eliminar</button>
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
  const cancelBtn = document.getElementById("cliente-cancel");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const id = Number(data.get("id"));
    const payload = {
      id: id || nextId(clientes),
      nombre: data.get("nombre").trim(),
      email: data.get("email").trim(),
      telefono: data.get("telefono").trim(),
      empresa: data.get("empresa").trim(),
    };

    if (id) {
      const index = clientes.findIndex((item) => item.id === id);
      clientes[index] = payload;
    } else {
      clientes.push(payload);
    }

    writeStore(STORE_KEYS.clientes, clientes);
    renderClientes();
  });

  cancelBtn.addEventListener("click", () => {
    form.reset();
    form.id.value = "";
  });

  app.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.edit);
      const item = clientes.find((c) => c.id === id);
      form.id.value = item.id;
      form.nombre.value = item.nombre;
      form.email.value = item.email;
      form.telefono.value = item.telefono;
      form.empresa.value = item.empresa;
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  app.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.delete);
      const filtered = clientes.filter((item) => item.id !== id);
      writeStore(STORE_KEYS.clientes, filtered);
      renderClientes();
    });
  });
}

function renderTickets() {
  const session = getSession();
  const tickets = readStore(STORE_KEYS.tickets);
  const clientes = readStore(STORE_KEYS.clientes);
  const tecnicos = readStore(STORE_KEYS.tecnicos);

  const hasData = clientes.length && tecnicos.length;
  const techChecklist = tecnicos
    .map(
      (item) => `
        <label>
          <input type="checkbox" name="tecnicos" value="${item.id}" />
          ${item.nombre} · ${item.especialidad}
        </label>
      `
    )
    .join("");

  app.innerHTML = `
    <section class="card">
      <div class="welcome">Bienvenido - ${session.name}</div>
      <h1 class="title">Tickets</h1>
      <p class="subtitle">Gestión de reservas de asistencia.</p>
      ${
        hasData
          ? ""
          : `<div class="alert">Para crear tickets necesitas al menos un cliente y un técnico registrados.</div>`
      }
      <form id="ticket-form" class="form-grid">
        <input type="hidden" name="id" />
        <div>
          <label>Cliente</label>
          <select name="cliente" required>
            <option value="">Selecciona un cliente</option>
            ${clientes
              .map(
                (item) => `<option value="${item.id}">${item.nombre}</option>`
              )
              .join("")}
          </select>
        </div>
        <div>
          <label>Prioridad</label>
          <select name="prioridad" required>
            <option value="Alta">Alta</option>
            <option value="Media" selected>Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>
        <div>
          <label>Estado</label>
          <select name="estado" required>
            <option value="Abierto">Abierto</option>
            <option value="En proceso" selected>En proceso</option>
            <option value="Cerrado">Cerrado</option>
          </select>
        </div>
        <div>
          <label>Asunto</label>
          <input name="asunto" required />
        </div>
        <div>
          <label>Descripción</label>
          <textarea name="descripcion" required></textarea>
        </div>
        <div>
          <label>Técnicos asignados</label>
          <div class="checklist">
            ${techChecklist || "<span>No hay técnicos.</span>"}
          </div>
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
            <th>ID</th>
            <th>Cliente</th>
            <th>Técnicos</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${
            tickets.length
              ? tickets
                  .map((ticket) => {
                    const cliente =
                      clientes.find((c) => c.id === ticket.clienteId) || {};
                    const tecnicosAsignados = ticket.tecnicoIds
                      .map(
                        (id) =>
                          tecnicos.find((t) => t.id === id)?.nombre || "N/D"
                      )
                      .filter(Boolean);
                    return `
                      <tr>
                        <td>${ticket.id}</td>
                        <td>${cliente.nombre || "N/D"}</td>
                        <td>
                          ${tecnicosAsignados
                            .map((name) => `<span class="chip">${name}</span>`)
                            .join("")}
                        </td>
                        <td>${ticket.prioridad}</td>
                        <td>${ticket.estado}</td>
                        <td>${ticket.fecha}</td>
                        <td class="btn-group">
                          <button class="btn secondary" data-edit="${ticket.id}">Editar</button>
                          <button class="btn danger" data-delete="${ticket.id}">Eliminar</button>
                        </td>
                      </tr>
                    `;
                  })
                  .join("")
              : `<tr><td colspan="7">No hay tickets registrados.</td></tr>`
          }
        </tbody>
      </table>
    </section>
  `;

  const form = document.getElementById("ticket-form");
  const cancelBtn = document.getElementById("ticket-cancel");
  const saveBtn = document.getElementById("ticket-save");

  if (!hasData) {
    saveBtn.disabled = true;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasData) return;

    const data = new FormData(form);
    const id = Number(data.get("id"));
    const tecnicoIds = [
      ...form.querySelectorAll("input[name='tecnicos']:checked"),
    ].map((input) => Number(input.value));

    const payload = {
      id: id || nextId(tickets),
      clienteId: Number(data.get("cliente")),
      tecnicoIds,
      asunto: data.get("asunto").trim(),
      descripcion: data.get("descripcion").trim(),
      prioridad: data.get("prioridad"),
      estado: data.get("estado"),
      fecha: new Date().toISOString().slice(0, 10),
    };

    if (id) {
      const index = tickets.findIndex((item) => item.id === id);
      tickets[index] = { ...tickets[index], ...payload };
    } else {
      tickets.push(payload);
    }

    writeStore(STORE_KEYS.tickets, tickets);
    renderTickets();
  });

  cancelBtn.addEventListener("click", () => {
    form.reset();
    form.id.value = "";
    form.querySelectorAll("input[name='tecnicos']").forEach((input) => {
      input.checked = false;
    });
  });

  app.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.edit);
      const ticket = tickets.find((t) => t.id === id);
      if (!ticket) return;
      form.id.value = ticket.id;
      form.cliente.value = String(ticket.clienteId);
      form.prioridad.value = ticket.prioridad;
      form.estado.value = ticket.estado;
      form.asunto.value = ticket.asunto;
      form.descripcion.value = ticket.descripcion;
      form.querySelectorAll("input[name='tecnicos']").forEach((input) => {
        input.checked = ticket.tecnicoIds.includes(Number(input.value));
      });
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  app.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.delete);
      const filtered = tickets.filter((item) => item.id !== id);
      writeStore(STORE_KEYS.tickets, filtered);
      renderTickets();
    });
  });
}

logoutBtn.addEventListener("click", () => {
  clearSession();
  updateNav();
  window.location.hash = "#/login";
});

ensureSeedData();
window.addEventListener("hashchange", renderRoute);
renderRoute();

