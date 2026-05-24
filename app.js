const STORAGE_KEY = "kgw-panel-data-v1";
const AUTH_KEY = "kgwiw-active-role";
const PASSWORDS = {
  admin: "admin123",
  user: "user123"
};

const starterData = {
  members: [
    { id: makeId(), name: "Anna Nowak", phone: "500 100 200", email: "anna@example.pl", status: "Aktywny" },
    { id: makeId(), name: "Jan Kowalski", phone: "501 300 400", email: "jan@example.pl", status: "Aktywny" }
  ],
  fees: [],
  money: [],
  events: [],
  docs: [],
  board: [
    { id: makeId(), role: "Przewodnicząca", name: "Anna Nowak", term: "2026-2028" },
    { id: makeId(), role: "Skarbnik", name: "Jan Kowalski", term: "2026-2028" }
  ]
};

let state = loadState();
let activeView = "dashboard";
let query = "";
let currentRole = sessionStorage.getItem(AUTH_KEY);

const titles = {
  dashboard: "Pulpit",
  members: "Członkowie",
  fees: "Składki",
  money: "Kasa",
  events: "Wydarzenia",
  docs: "Dokumenty i poczta",
  board: "Zarząd"
};

const elements = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginError: document.querySelector("#loginError"),
  currentRole: document.querySelector("#currentRole"),
  viewTitle: document.querySelector("#viewTitle"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  globalSearch: document.querySelector("#globalSearch"),
  cashBalance: document.querySelector("#cashBalance"),
  memberCount: document.querySelector("#memberCount"),
  lateFees: document.querySelector("#lateFees"),
  docCount: document.querySelector("#docCount"),
  recentMoney: document.querySelector("#recentMoney"),
  upcomingEvents: document.querySelector("#upcomingEvents"),
  membersList: document.querySelector("#membersList"),
  feesList: document.querySelector("#feesList"),
  moneyList: document.querySelector("#moneyList"),
  eventsList: document.querySelector("#eventsList"),
  docsList: document.querySelector("#docsList"),
  boardList: document.querySelector("#boardList"),
  feeMember: document.querySelector("#feeMember"),
  mailboxInfo: document.querySelector("#mailboxInfo")
};

document.body.classList.toggle("locked", !currentRole);
document.querySelectorAll("#exportData, .import-button").forEach((item) => item.classList.add("admin-only"));
elements.currentRole.textContent = roleName(currentRole);
elements.loginForm.addEventListener("submit", handleLogin);
document.querySelector("#logoutButton").addEventListener("click", logout);
document.querySelector("#memberForm").addEventListener("submit", handleMember);
document.querySelector("#feeForm").addEventListener("submit", handleFee);
document.querySelector("#moneyForm").addEventListener("submit", handleMoney);
document.querySelector("#eventForm").addEventListener("submit", handleEvent);
document.querySelector("#docForm").addEventListener("submit", handleDoc);
document.querySelector("#boardForm").addEventListener("submit", handleBoard);
document.querySelector("#exportData").addEventListener("click", exportData);
document.querySelector("#importData").addEventListener("change", importData);
document.querySelector("#showMailboxInfo").addEventListener("click", () => {
  elements.mailboxInfo.classList.toggle("hidden");
});

elements.navItems.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

elements.globalSearch.addEventListener("input", (event) => {
  query = event.target.value.trim().toLowerCase();
  render();
});

document.querySelector('input[name="date"]').valueAsDate = new Date();
document.querySelector('#eventForm input[name="date"]').valueAsDate = new Date();
document.querySelector('#docForm input[name="date"]').valueAsDate = new Date();

applyRole();
render();

function handleLogin(event) {
  event.preventDefault();
  const data = formData(event.target);
  if (PASSWORDS[data.role] !== data.password) {
    elements.loginError.textContent = "Nieprawidłowe hasło.";
    return;
  }

  currentRole = data.role;
  sessionStorage.setItem(AUTH_KEY, currentRole);
  elements.currentRole.textContent = roleName(currentRole);
  elements.loginError.textContent = "";
  event.target.reset();
  document.body.classList.remove("locked");
  applyRole();
  render();
}

function logout() {
  currentRole = null;
  sessionStorage.removeItem(AUTH_KEY);
  elements.currentRole.textContent = "-";
  document.body.classList.add("locked");
  applyRole();
}

function roleName(role) {
  if (role === "admin") return "Administrator";
  if (role === "user") return "Użytkownik";
  return "-";
}

function isAdmin() {
  return currentRole === "admin";
}

function applyRole() {
  document.querySelectorAll(".admin-only").forEach((item) => {
    item.classList.toggle("hidden-role", !isAdmin());
  });
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(starterData);
  try {
    return { ...structuredClone(starterData), ...JSON.parse(saved) };
  } catch {
    return structuredClone(starterData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function switchView(view) {
  activeView = view;
  elements.viewTitle.textContent = titles[view];
  elements.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  elements.views.forEach((section) => section.classList.toggle("active-view", section.id === view));
  render();
}

function handleMember(event) {
  event.preventDefault();
  const data = formData(event.target);
  state.members.push({ id: makeId(), ...data });
  finishForm(event.target);
}

function handleFee(event) {
  event.preventDefault();
  const data = formData(event.target);
  state.fees.push({ id: makeId(), ...data, amount: Number(data.amount) });
  finishForm(event.target);
}

function handleMoney(event) {
  event.preventDefault();
  const data = formData(event.target);
  state.money.push({ id: makeId(), ...data, amount: Number(data.amount) });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
}

function handleEvent(event) {
  event.preventDefault();
  state.events.push({ id: makeId(), ...formData(event.target) });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
}

function handleDoc(event) {
  event.preventDefault();
  state.docs.push({ id: makeId(), ...formData(event.target) });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
}

function handleBoard(event) {
  event.preventDefault();
  state.board.push({ id: makeId(), ...formData(event.target) });
  finishForm(event.target);
}

function finishForm(form) {
  saveState();
  form.reset();
  render();
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function render() {
  renderDashboard();
  renderMembers();
  renderFees();
  renderMoney();
  renderEvents();
  renderDocs();
  renderBoard();
  renderFeeOptions();
}

function renderDashboard() {
  const income = state.money.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = state.money.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const lateFees = state.fees.filter((fee) => fee.status === "Do zapłaty").reduce((sum, fee) => sum + fee.amount, 0);

  elements.cashBalance.textContent = money(income - expenses);
  elements.memberCount.textContent = state.members.length;
  elements.lateFees.textContent = money(lateFees);
  elements.docCount.textContent = state.docs.length;

  const recent = [...state.money].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  elements.recentMoney.innerHTML = recent.length ? recent.map(moneyRow).join("") : "Brak wpisów.";

  const upcoming = [...state.events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  elements.upcomingEvents.innerHTML = upcoming.length ? upcoming.map(eventRow).join("") : "Brak wydarzeń.";
}

function renderMembers() {
  elements.membersList.innerHTML = rows(filterItems(state.members), (item) => `
    <div>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.phone || "Brak telefonu")} · ${escapeHtml(item.email || "Brak e-maila")} · ${escapeHtml(item.status)}</small>
    </div>
    ${deleteAction("members", item.id)}
  `);
}

function renderFees() {
  elements.feesList.innerHTML = rows(filterItems(state.fees), (item) => `
    <div>
      <strong>${escapeHtml(item.member)} · ${money(item.amount)}</strong>
      <small>${escapeHtml(item.period)} · <span class="badge ${item.status === "Zapłacona" ? "paid" : "due"}">${escapeHtml(item.status)}</span></small>
    </div>
    ${deleteAction("fees", item.id)}
  `);
}

function renderMoney() {
  elements.moneyList.innerHTML = rows(filterItems(state.money), moneyRowWithDelete);
}

function renderEvents() {
  elements.eventsList.innerHTML = rows(filterItems(state.events), (item) => `
    <div>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${formatDate(item.date)} · ${escapeHtml(item.place || "Brak miejsca")} · ${escapeHtml(item.notes || "Bez notatek")}</small>
    </div>
    ${deleteAction("events", item.id)}
  `);
}

function renderDocs() {
  elements.docsList.innerHTML = rows(filterItems(state.docs), (item) => `
    <div>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${formatDate(item.date)} · ${escapeHtml(item.sender || "Brak nadawcy")} · <span class="badge neutral">${escapeHtml(item.category)}</span><br>${escapeHtml(item.notes || "")}</small>
    </div>
    ${deleteAction("docs", item.id)}
  `);
}

function renderBoard() {
  elements.boardList.innerHTML = rows(filterItems(state.board), (item) => `
    <div>
      <strong>${escapeHtml(item.role)}: ${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.term || "Bez kadencji")}</small>
    </div>
    ${deleteAction("board", item.id)}
  `);
}

function renderFeeOptions() {
  elements.feeMember.innerHTML = state.members.map((member) => `<option>${escapeHtml(member.name)}</option>`).join("");
}

function rows(items, template) {
  if (!items.length) return '<div class="row"><small>Brak wpisów pasujących do wyszukiwania.</small></div>';
  return items.map((item) => `<div class="row">${template(item)}</div>`).join("");
}

function moneyRow(item) {
  return `
    <div class="row">
      <div>
        <strong>${escapeHtml(item.title)} · ${money(item.amount)}</strong>
        <small>${formatDate(item.date)} · ${escapeHtml(item.category || "Bez kategorii")} · <span class="badge ${item.type}">${item.type === "income" ? "Wpływ" : "Wydatek"}</span></small>
      </div>
    </div>
  `;
}

function moneyRowWithDelete(item) {
  return `
    <div>
      <strong>${escapeHtml(item.title)} · ${money(item.amount)}</strong>
      <small>${formatDate(item.date)} · ${escapeHtml(item.category || "Bez kategorii")} · <span class="badge ${item.type}">${item.type === "income" ? "Wpływ" : "Wydatek"}</span></small>
    </div>
    ${deleteAction("money", item.id)}
  `;
}

function eventRow(item) {
  return `
    <div class="row">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${formatDate(item.date)} · ${escapeHtml(item.place || "Brak miejsca")}</small>
      </div>
    </div>
  `;
}

function deleteAction(collection, id) {
  if (!isAdmin()) return "";
  return `<div class="row-actions"><button class="delete-button" onclick="removeItem('${collection}', '${id}')">Usuń</button></div>`;
}

function removeItem(collection, id) {
  if (!isAdmin()) {
    alert("Usuwanie wpisów jest dostępne tylko dla administratora.");
    return;
  }
  state[collection] = state[collection].filter((item) => item.id !== id);
  saveState();
  render();
}

function filterItems(items) {
  if (!query) return items;
  return items.filter((item) => Object.values(item).join(" ").toLowerCase().includes(query));
}

function exportData() {
  if (!isAdmin()) return;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `panel-kgw-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importData(event) {
  if (!isAdmin()) return;
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = { ...structuredClone(starterData), ...JSON.parse(reader.result) };
      saveState();
      render();
    } catch {
      alert("Nie udało się wczytać pliku z danymi.");
    }
  };
  reader.readAsText(file);
}

function money(value) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value || 0);
}

function formatDate(date) {
  if (!date) return "Brak daty";
  return new Intl.DateTimeFormat("pl-PL").format(new Date(`${date}T12:00:00`));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
