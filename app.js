const STORAGE_KEY = "kgw-panel-data-v2-clean";
const AUTH_KEY = "kgigw-active-role";
const ANNUAL_FEE = 120;
const QUARTER_FEE = 30;
const FEE_YEAR = new Date().getFullYear();
const PASSWORDS = {
  admin: "admin123",
  user: "user123",
  agata: "AgatA3539",
  tomek: "SołtyS2025"
};
const ACCOUNT_EMAILS = {
  admin: "wawrzysdom@gmail.com",
  agata: "agatawawrzynek@go2.pl",
  tomek: "tomasztynski@gmail.com"
};
const ORGANIZATION = {
  name: "Koło Gospodyń i Gospodarzy Wiejskich we Włosani",
  street: "Królowej Polski 49",
  city: "32-031 Włosań",
  nip: "0000000000",
  logo: "KGiGW.jpg"
};

const starterData = {
  members: [],
  fees: [],
  money: [],
  events: [],
  rentalInventory: [
    { id: makeId(), name: "Komplet zastawy", quantity: 48, price: 10 },
    { id: makeId(), name: "Talerz płytki", quantity: 48, price: 2 },
    { id: makeId(), name: "Talerz głęboki", quantity: 48, price: 2 },
    { id: makeId(), name: "Kubek", quantity: 48, price: 1 },
    { id: makeId(), name: "Szklanka", quantity: 48, price: 1 },
    { id: makeId(), name: "Nóż", quantity: 48, price: 0.5 },
    { id: makeId(), name: "Widelec", quantity: 48, price: 0.5 },
    { id: makeId(), name: "Obrus", quantity: 7, price: 5 }
  ],
  rentalLoans: [],
  docs: [],
  invoices: [],
  board: []
};

let state = loadState();
let activeView = "dashboard";
let query = "";
let currentRole = sessionStorage.getItem(AUTH_KEY);
let currentUserName = sessionStorage.getItem("kgigw-user-name") || "";
let undoSnapshot = null;
let supabaseClient = null;

const titles = {
  dashboard: "Pulpit",
  members: "Członkowie",
  fees: "Składki",
  money: "Kasa",
  events: "Wydarzenia",
  rentals: "Wypożyczalnia",
  invoices: "Faktury",
  docs: "Dokumenty i poczta",
  board: "Zarząd"
};

setupRentalShell();
setupSupabaseClient();

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
  rentalCount: document.querySelector("#rentalCount"),
  recentMoney: document.querySelector("#recentMoney"),
  upcomingEvents: document.querySelector("#upcomingEvents"),
  membersList: document.querySelector("#membersList"),
  feesList: document.querySelector("#feesList"),
  sendFeeSms: document.querySelector("#sendFeeSms"),
  moneyEvent: document.querySelector("#moneyEvent"),
  moneyList: document.querySelector("#moneyList"),
  eventsList: document.querySelector("#eventsList"),
  rentalInventory: document.querySelector("#rentalInventory"),
  rentalItemsForm: document.querySelector("#rentalItemsForm"),
  rentalDays: document.querySelector("#rentalDays"),
  rentalTotal: document.querySelector("#rentalTotal"),
  rentalsList: document.querySelector("#rentalsList"),
  invoiceRental: document.querySelector("#invoiceRental"),
  invoicesList: document.querySelector("#invoicesList"),
  rentalReturnsList: document.querySelector("#rentalReturnsList"),
  rentalSubtabs: document.querySelectorAll("[data-rental-tab]"),
  rentalPanels: document.querySelectorAll("[data-rental-panel]"),
  printSheet: document.querySelector("#printSheet"),
  docsList: document.querySelector("#docsList"),
  boardList: document.querySelector("#boardList"),
  feeMember: document.querySelector("#feeMember"),
  mailboxInfo: document.querySelector("#mailboxInfo")
};

document.body.classList.toggle("locked", !currentRole);
document.querySelectorAll("#exportData, .import-button").forEach((item) => item.classList.add("admin-only"));
elements.currentRole.textContent = currentUserName ? `${currentUserName} (${roleName(currentRole)})` : roleName(currentRole);
elements.loginForm.addEventListener("submit", handleLogin);
document.querySelector("#logoutButton").addEventListener("click", logout);
document.querySelector("#memberForm").addEventListener("submit", handleMember);
document.querySelector("#feeForm").addEventListener("submit", handleFee);
document.querySelector("#sendFeeSms").addEventListener("click", sendFeeSmsReminders);
document.querySelector("#moneyForm").addEventListener("submit", handleMoney);
document.querySelector("#printMoneyReport").addEventListener("click", printMoneyReport);
document.querySelector("#eventForm").addEventListener("submit", handleEvent);
document.querySelector("#rentalForm").addEventListener("submit", handleRental);
document.querySelector("#rentalForm").addEventListener("input", updateRentalSummary);
document.querySelector("#docForm").addEventListener("submit", handleDoc);
document.querySelector("#invoiceForm").addEventListener("submit", handleInvoice);
document.querySelector("#invoiceRental").addEventListener("change", fillInvoiceFromRental);
document.querySelector("#boardForm").addEventListener("submit", handleBoard);
document.querySelector("#exportData").addEventListener("click", exportData);
document.querySelector("#undoButton").addEventListener("click", undoLastChange);
document.querySelector("#importData").addEventListener("change", importData);
document.querySelector("#showMailboxInfo").addEventListener("click", () => {
  elements.mailboxInfo.classList.toggle("hidden");
});

elements.navItems.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

elements.rentalSubtabs.forEach((button) => {
  button.addEventListener("click", () => switchRentalTab(button.dataset.rentalTab));
});

elements.globalSearch.addEventListener("input", (event) => {
  query = event.target.value.trim().toLowerCase();
  render();
});

document.querySelector('input[name="date"]').valueAsDate = new Date();
document.querySelector('#feeForm input[name="period"]').value = FEE_YEAR;
document.querySelector('#eventForm input[name="date"]').valueAsDate = new Date();
document.querySelector('#docForm input[name="date"]').valueAsDate = new Date();
document.querySelector('#invoiceForm input[name="date"]').valueAsDate = new Date();
document.querySelector('#rentalForm input[name="dateFrom"]').valueAsDate = new Date();
document.querySelector('#rentalForm input[name="dateTo"]').valueAsDate = new Date();

applyRole();
render();

async function handleLogin(event) {
  event.preventDefault();
  const data = formData(event.target);
  const role = String(data.role || "").trim();
  const password = String(data.password || "").trim();

  if (supabaseClient && ACCOUNT_EMAILS[role]) {
    elements.loginError.textContent = "Sprawdzam konto...";
    const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
      email: ACCOUNT_EMAILS[role],
      password
    });

    if (error) {
      elements.loginError.textContent = `Supabase: ${error.message || "nie udało się zalogować."}`;
      return;
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("display_name, role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      elements.loginError.textContent = "Konto działa, ale brakuje profilu w tabeli profiles.";
      return;
    }

    currentRole = profile.role;
    currentUserName = profile.display_name || roleName(profile.role);
    sessionStorage.setItem(AUTH_KEY, currentRole);
    sessionStorage.setItem("kgigw-user-name", currentUserName);
    elements.currentRole.textContent = `${currentUserName} (${roleName(currentRole)})`;
    elements.loginError.textContent = "";
    event.target.reset();
    document.body.classList.remove("locked");
    applyRole();
    render();
    return;
  }

  if (PASSWORDS[role] !== password) {
    elements.loginError.textContent = "Nieprawidłowe hasło.";
    return;
  }

  currentRole = role;
  currentUserName = roleName(role);
  sessionStorage.setItem(AUTH_KEY, currentRole);
  sessionStorage.setItem("kgigw-user-name", currentUserName);
  elements.currentRole.textContent = `${currentUserName} (${roleName(currentRole)})`;
  elements.loginError.textContent = "";
  event.target.reset();
  document.body.classList.remove("locked");
  applyRole();
  render();
}

async function logout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  currentRole = null;
  currentUserName = "";
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem("kgigw-user-name");
  elements.currentRole.textContent = "-";
  document.body.classList.add("locked");
  applyRole();
}

function roleName(role) {
  if (role === "admin") return "Administrator";
  if (role === "staff") return "Pracownik";
  if (role === "readonly") return "Tylko odczyt";
  if (role === "user") return "Użytkownik";
  if (role === "agata") return "Agata";
  if (role === "tomek") return "Tomek";
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

function setupSupabaseClient() {
  const config = window.KGIGW_SUPABASE;
  if (!window.supabase || !config?.url || !config?.anonKey) return;
  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
}

function setupRentalShell() {
  const rentalSection = document.querySelector("#rentals");
  const layout = rentalSection?.querySelector(".rentals-layout");
  if (!rentalSection || !layout || rentalSection.querySelector(".subtabs")) return;

  const tabs = document.createElement("div");
  tabs.className = "subtabs";
  tabs.setAttribute("aria-label", "Działy wypożyczalni");
  tabs.innerHTML = `
    <button class="subtab active" data-rental-tab="returns">Zwroty</button>
    <button class="subtab" data-rental-tab="inventory">Magazyn</button>
    <button class="subtab" data-rental-tab="history">Historia</button>
  `;

  const inventoryPanel = layout.querySelector(".panel:not(.rentals-list-panel)");
  const rentalForm = layout.querySelector("#rentalForm");
  const historyPanel = layout.querySelector(".rentals-list-panel");
  inventoryPanel?.classList.add("rental-tab-panel");
  inventoryPanel?.setAttribute("data-rental-panel", "inventory");
  historyPanel?.classList.add("rental-tab-panel");
  historyPanel?.setAttribute("data-rental-panel", "history");

  const returnsPanel = document.createElement("section");
  returnsPanel.className = "panel rentals-list-panel rental-tab-panel";
  returnsPanel.setAttribute("data-rental-panel", "returns");
  returnsPanel.innerHTML = `
    <div class="panel-head">
      <h2>Zwroty</h2>
    </div>
    <div id="rentalReturnsList" class="table"></div>
  `;
  layout.insertBefore(returnsPanel, historyPanel);
  layout.insertBefore(tabs, returnsPanel);
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

function rememberUndo() {
  undoSnapshot = JSON.stringify(state);
}

function undoLastChange() {
  if (!undoSnapshot) {
    alert("Nie ma ostatniej zmiany do cofnięcia.");
    return;
  }
  const confirmed = confirm("Cofnąć ostatnią zmianę?");
  if (!confirmed) return;
  state = JSON.parse(undoSnapshot);
  undoSnapshot = null;
  saveState();
  render();
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
  if (view === "rentals") switchRentalTab("returns");
  render();
}

function switchRentalTab(tabName) {
  elements.rentalSubtabs.forEach((item) => item.classList.toggle("active", item.dataset.rentalTab === tabName));
  elements.rentalPanels.forEach((panel) => panel.classList.toggle("active-rental-panel", panel.dataset.rentalPanel === tabName));
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
  const year = feeYear(data.period);
  const dueAmount = ANNUAL_FEE;
  const paidAmount = Number(data.amount || 0);
  state.fees.push({
    id: makeId(),
    ...data,
    year,
    dueAmount,
    amount: paidAmount,
    status: "Wpłata"
  });
  finishForm(event.target);
  event.target.period.value = FEE_YEAR;
  event.target.dueAmount.value = ANNUAL_FEE;
}

function handleMoney(event) {
  event.preventDefault();
  const data = formData(event.target);
  const linkedEvent = state.events.find((item) => item.id === data.eventId);
  if (data.type === "donation" && !data.category) {
    data.category = "Darowizny";
  }
  state.money.push({
    id: makeId(),
    ...data,
    eventName: linkedEvent?.name || "",
    amount: Number(data.amount)
  });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
}

function handleEvent(event) {
  event.preventDefault();
  state.events.push({ id: makeId(), ...formData(event.target) });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
  renderEventOptions();
}

function handleRental(event) {
  event.preventDefault();
  const form = event.target;
  const data = formData(form);
  const items = state.rentalInventory
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: Number(data[`item-${item.id}`] || 0),
      price: Number(item.price)
    }))
    .filter((item) => item.quantity > 0);

  if (!items.length) {
    alert("Wybierz przynajmniej jeden przedmiot do wypozyczenia.");
    return;
  }

  const unavailable = items.find((item) => item.quantity > availableQuantity(item.id));
  if (unavailable) {
    alert(`Brak wystarczajacej ilosci: ${unavailable.name}.`);
    return;
  }

  const days = rentalDays(data.dateFrom, data.dateTo);
  state.rentalLoans.push({
    id: makeId(),
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    dateFrom: data.dateFrom,
    dateTo: data.dateTo,
    notes: data.notes,
    days,
    items,
    total: rentalTotal(items, days),
    status: "Wypożyczone"
  });

  finishForm(form);
  form.dateFrom.valueAsDate = new Date();
  form.dateTo.valueAsDate = new Date();
  renderRentalItemInputs();
  updateRentalSummary();
}

async function handleDoc(event) {
  event.preventDefault();
  const data = formData(event.target);
  const file = event.target.file.files[0];
  const attachment = file ? await readPdfAttachment(file) : null;
  delete data.file;
  state.docs.push({ id: makeId(), ...data, attachment });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
}

function handleInvoice(event) {
  event.preventDefault();
  const data = formData(event.target);
  const selectedRental = state.rentalLoans.find((entry) => entry.id === data.rentalId);
  const invoice = makeInvoice({
    id: makeId(),
    ...data,
    rentalLabel: selectedRental ? `${selectedRental.firstName} ${selectedRental.lastName} - ${formatDate(selectedRental.dateFrom)}` : "",
    quantity: Number(data.quantity),
    unitPrice: Number(data.unitPrice)
  });
  state.invoices.push(invoice);
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
}

function handleBoard(event) {
  event.preventDefault();
  state.board.push({ id: makeId(), ...formData(event.target) });
  finishForm(event.target);
}

function finishForm(form) {
  rememberUndo();
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
  renderRentals();
  renderDocs();
  renderInvoices();
  renderBoard();
  renderFeeOptions();
  renderEventOptions();
  renderInvoiceRentalOptions();
}

function renderDashboard() {
  const income = state.money.filter((item) => item.type === "income" || item.type === "donation").reduce((sum, item) => sum + item.amount, 0);
  const expenses = state.money.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const lateFees = feeMemberRows().reduce((sum, member) => sum + member.currentDue, 0);

  elements.cashBalance.textContent = money(income - expenses);
  elements.memberCount.textContent = state.members.length;
  elements.lateFees.textContent = money(lateFees);
  elements.rentalCount.textContent = state.rentalLoans.filter((loan) => loan.status !== "Zwrócone").length;

  const recent = [...state.money].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  elements.recentMoney.innerHTML = recent.length ? recent.map(moneyRow).join("") : "Brak wpisów.";

  const upcoming = [...state.events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
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
  const visibleRows = filterItems(feeMemberRows());
  if (!visibleRows.length) {
    elements.feesList.innerHTML = '<div class="row"><small>Brak wpisów pasujących do wyszukiwania.</small></div>';
    return;
  }

  const unpaidRows = visibleRows.filter((item) => item.isLate);
  const paidRows = visibleRows.filter((item) => !item.isLate);

  elements.feesList.innerHTML = `
    <section class="fee-group fee-group-due">
      <h3>1. Osoby, które mają zaległość na dziś</h3>
      ${unpaidRows.length ? unpaidRows.map(feeMemberRowHtml).join("") : '<div class="row"><small>Brak osób z zaległością.</small></div>'}
    </section>
    <section class="fee-group fee-group-paid">
      <h3>2. Osoby opłacone na dziś</h3>
      ${paidRows.length ? paidRows.map(feeMemberRowHtml).join("") : '<div class="row"><small>Brak osób z opłaconą składką.</small></div>'}
    </section>
  `;
}

function feeMemberRowHtml(item) {
  return `
    <div class="row fee-row ${item.isLate ? "fee-row-due" : "fee-row-paid"}">
      <div>
        <strong>${escapeHtml(item.name)} · ${FEE_YEAR} · zaległość na dziś: ${money(item.currentDue)}</strong>
        <small>
          Telefon: ${escapeHtml(item.phone || "brak telefonu")}
          · Wymagane na dziś: ${money(item.currentRequired)}
          · Rocznie: ${money(item.required)}
          · Zapłacono: ${money(item.paid)}
          · <span class="badge ${item.isLate ? "due" : "paid"}">${item.isLate ? "Zaległość" : item.paid >= ANNUAL_FEE ? "Opłacone do końca roku" : `Opłacone do ${escapeHtml(item.paidUntil)}`}</span><br>
          <span class="fee-stages">${item.stages.map(feeStageHtml).join("")}</span>
          <br>${item.fees.length ? item.fees.map((fee) => `Wpłata ${escapeHtml(fee.period)}: ${money(fee.amount)}`).join(" · ") : "Brak wpłat w tym roku"}
        </small>
      </div>
      <div class="row-actions">
        ${item.isLate && item.phone ? `<button class="small-button" onclick="sendSingleFeeSms('${escapeHtml(item.phone)}', '${escapeHtml(item.name)}', ${item.currentDue})">SMS</button>` : ""}
        ${isAdmin() ? `<button class="delete-button" onclick="resetMemberFees('${escapeHtml(item.name)}')">Reset wpłat</button>` : ""}
        ${isAdmin() ? item.fees.map((fee) => `<button class="delete-button" onclick="removeItem('fees', '${fee.id}')">Usuń wpis</button>`).join("") : ""}
      </div>
    </div>
  `;
}

function renderMoney() {
  elements.moneyList.innerHTML = rows(filterItems(state.money), moneyRowWithDelete);
}

function renderEvents() {
  elements.eventsList.innerHTML = rows(filterItems(state.events), (item) => `
    <div>
      <details class="event-details">
        <summary>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${formatDate(item.date)} · ${escapeHtml(item.place || "Brak miejsca")}</small>
        </summary>
        <small>${escapeHtml(item.notes || "Bez notatek")}</small>
        <div class="event-note-form">
          <textarea id="eventNote-${item.id}" placeholder="Dopisz notatkę do wydarzenia"></textarea>
          <button class="small-button" onclick="addEventNote('${item.id}')">Dodaj notatkę</button>
        </div>
      </details>
    </div>
    ${deleteAction("events", item.id)}
  `);
}

function renderRentals() {
  renderRentalInventory();
  renderRentalItemInputs();
  updateRentalSummary();
  renderRentalReturns();
  const historyLoans = [...filterItems(state.rentalLoans)].sort((a, b) => (b.dateFrom || "").localeCompare(a.dateFrom || ""));
  elements.rentalsList.innerHTML = rows(historyLoans, (loan) => `
    <div>
      <details class="return-details">
        <summary>
          <strong>${escapeHtml(loan.firstName)} ${escapeHtml(loan.lastName)} - ${formatDate(loan.dateFrom)}</strong>
          <small>${escapeHtml(loan.status)} - ${money(loan.total)}</small>
        </summary>
        <small>
          Okres: ${formatDate(loan.dateFrom)} - ${formatDate(loan.dateTo)} - tel. ${escapeHtml(loan.phone)}<br>
          ${loan.items.map((item) => `${escapeHtml(item.name)}: ${item.quantity} szt.`).join(" - ")}
          ${loan.returnNotes ? `<br>Uwagi zwrotu: ${escapeHtml(loan.returnNotes)}` : ""}
        </small>
      </details>
    </div>
    <div class="row-actions">
      <button class="small-button" onclick="printRental('${loan.id}')">Druk wydania</button>
      ${loan.status === "Zwrócone" ? `<button class="small-button" onclick="printReturn('${loan.id}')">Druk zwrotu</button>` : ""}
      ${deleteAction("rentalLoans", loan.id)}
    </div>
  `);
}

function renderRentalReturns() {
  const activeLoans = state.rentalLoans.filter((loan) => loan.status !== "Zwrócone");
  elements.rentalReturnsList.innerHTML = rows(filterItems(activeLoans), (loan) => `
    <div>
      <details class="return-details">
        <summary>
          <strong>${escapeHtml(loan.firstName)} ${escapeHtml(loan.lastName)}</strong>
          <small>${formatDate(loan.dateFrom)} - ${formatDate(loan.dateTo)} - ${escapeHtml(loan.phone)}</small>
        </summary>
        <div class="return-check">
          <div class="return-check-head">
            <span>Przedmiot</span>
            <span>Wydano</span>
            <span>Wróciło</span>
            <span>Uszk.</span>
            <span>Brak</span>
          </div>
          ${loan.items.map((item, index) => `
            <div class="return-check-row">
              <strong>${escapeHtml(item.name)}</strong>
              <span>${item.quantity}</span>
              <input id="returnQty-${loan.id}-${index}" type="number" min="0" step="1" value="${item.quantity}" />
              <input id="returnDamaged-${loan.id}-${index}" type="number" min="0" step="1" value="0" />
              <input id="returnMissing-${loan.id}-${index}" type="number" min="0" step="1" value="0" />
            </div>
          `).join("")}
        </div>
        <div class="return-form">
          <input id="returnDamage-${loan.id}" type="number" min="0" step="0.01" placeholder="Dopłata za braki/uszkodzenia" />
          <textarea id="returnNotes-${loan.id}" placeholder="Uwagi do zwrotu, np. uszkodzone, brakuje sztuk, zabrudzone obrusy"></textarea>
        </div>
      </details>
    </div>
    <div class="row-actions">
      <button class="small-button" onclick="returnRental('${loan.id}')">Zapisz zwrot</button>
      <button class="small-button" onclick="printRental('${loan.id}')">Druk wydania</button>
    </div>
  `);
}

function renderRentalInventory() {
  elements.rentalInventory.innerHTML = state.rentalInventory.map((item) => {
    const available = availableQuantity(item.id);
    const borrowed = borrowedQuantity(item.id);
    const returned = returnedQuantity(item.id);
    return `
      <article class="inventory-card">
        <strong>${escapeHtml(item.name)}</strong>
        <small>Stan magazynu: ${available} szt. - Wypożyczone: ${borrowed} szt. - Zwrócone łącznie: ${returned} szt. - Stan całkowity: ${item.quantity} szt. - ${money(item.price)} / doba</small>
        <div class="inventory-edit admin-only ${isAdmin() ? "" : "hidden-role"}">
          <input type="number" min="0" step="1" value="${item.quantity}" aria-label="Ilosc ${escapeHtml(item.name)}" onchange="updateInventory('${item.id}', 'quantity', this.value)" />
          <input type="number" min="0" step="0.01" value="${item.price}" aria-label="Cena ${escapeHtml(item.name)}" onchange="updateInventory('${item.id}', 'price', this.value)" />
        </div>
      </article>
    `;
  }).join("");
}

function renderRentalItemInputs() {
  const currentValues = Object.fromEntries([...document.querySelectorAll("#rentalItemsForm input")].map((input) => [input.name, input.value]));
  elements.rentalItemsForm.innerHTML = state.rentalInventory.map((item) => {
    const available = availableQuantity(item.id);
    const name = `item-${item.id}`;
    return `
      <label class="rental-item-line">
        <span>
          <strong>${escapeHtml(item.name)}</strong>
          <small>Dostepne: ${available} szt. - ${money(item.price)} / doba</small>
        </span>
        <input name="${name}" type="number" min="0" max="${available}" step="1" value="${currentValues[name] || ""}" placeholder="0" />
      </label>
    `;
  }).join("");
}

function renderDocs() {
  elements.docsList.innerHTML = rows(filterItems(state.docs), (item) => `
    <div>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${formatDate(item.date)} · ${escapeHtml(item.sender || "Brak nadawcy")} · <span class="badge neutral">${escapeHtml(item.category)}</span><br>${escapeHtml(item.notes || "")}${item.attachment ? `<br>PDF: ${escapeHtml(item.attachment.name)}` : ""}</small>
    </div>
    <div class="row-actions">
      ${item.attachment ? `<button class="small-button" onclick="openDocumentAttachment('${item.id}')">Otwórz PDF</button>` : ""}
      ${isAdmin() ? `<button class="delete-button" onclick="removeItem('docs', '${item.id}')">Usuń</button>` : ""}
    </div>
  `);
}

function renderInvoices() {
  elements.invoicesList.innerHTML = rows(filterItems(state.invoices), (invoice) => `
    <div>
      <strong>Faktura ${escapeHtml(invoice.number)} - ${money(invoice.gross)}</strong>
      <small>${formatDate(invoice.date)} - ${escapeHtml(invoice.buyerName)} - ${escapeHtml(invoice.source)}${invoice.rentalLabel ? ` - Wypożyczenie: ${escapeHtml(invoice.rentalLabel)}` : ""}<br>${escapeHtml(invoice.itemName)}: ${invoice.quantity} x ${money(invoice.unitPrice)} netto</small>
    </div>
    <div class="row-actions">
      <button class="small-button" onclick="printInvoice('${invoice.id}')">Druk</button>
      ${deleteAction("invoices", invoice.id)}
    </div>
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

function feeMemberRows() {
  const knownNames = new Set(state.members.map((member) => member.name));
  const feeOnlyNames = state.fees.map((fee) => fee.member).filter((name) => !knownNames.has(name));
  const memberNames = [...state.members.map((member) => member.name), ...new Set(feeOnlyNames)];
  return memberNames.map((name) => {
    const member = state.members.find((entry) => entry.name === name);
    const fees = state.fees.filter((fee) => fee.member === name && feeYear(fee.year || fee.period) === FEE_YEAR);
    const paid = fees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    const due = Math.max(0, ANNUAL_FEE - paid);
    const stages = feeStages(paid);
    const currentRequired = requiredFeeToday();
    const currentDue = Math.max(0, currentRequired - paid);
    const paidUntil = paidUntilLabel(paid);
    return { name, phone: member?.phone || "", fees, due, currentDue, paid, paidUntil, currentRequired, required: ANNUAL_FEE, hasDue: due > 0, isLate: currentDue > 0, stages };
  }).sort((a, b) => {
    if (a.isLate !== b.isLate) return a.isLate ? -1 : 1;
    if (b.currentDue !== a.currentDue) return b.currentDue - a.currentDue;
    return a.name.localeCompare(b.name);
  });
}

function feeDueAmount(fee) {
  return Number(fee.dueAmount ?? ANNUAL_FEE);
}

function feeBalance(fee) {
  return Math.max(0, feeDueAmount(fee) - Number(fee.amount || 0));
}

function feeYear(value) {
  const match = String(value || "").match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : FEE_YEAR;
}

function feeStages(paid) {
  return [
    { label: "I kwartał", deadline: "do końca marca", amount: QUARTER_FEE, ok: paid >= 30 },
    { label: "II kwartał", deadline: "do końca czerwca", amount: QUARTER_FEE, ok: paid >= 60 },
    { label: "III kwartał", deadline: "do końca września", amount: QUARTER_FEE, ok: paid >= 90 },
    { label: "IV kwartał", deadline: "do końca grudnia", amount: QUARTER_FEE, ok: paid >= 120 }
  ];
}

function requiredFeeToday(date = new Date()) {
  const month = date.getMonth() + 1;
  if (month <= 3) return QUARTER_FEE;
  if (month <= 6) return QUARTER_FEE * 2;
  if (month <= 9) return QUARTER_FEE * 3;
  return ANNUAL_FEE;
}

function paidUntilLabel(paid) {
  if (paid >= ANNUAL_FEE) return "końca roku";
  if (paid >= 90) return "końca września";
  if (paid >= 60) return "końca czerwca";
  if (paid >= 30) return "końca marca";
  return "brak opłaconego kwartału";
}

function feeStageHtml(stage) {
  return `<span class="fee-stage ${stage.ok ? "fee-stage-ok" : "fee-stage-due"}">${stage.label}: ${stage.ok ? "OK" : "brak"} (${stage.deadline})</span>`;
}

function feeSmsText(name, due) {
  return `Przypomnienie KGiGW: prosimy o uregulowanie zaległej składki. Zaległość: ${money(due)}. Dziękujemy.`;
}

function sendSingleFeeSms(phone, name, due) {
  const cleanedPhone = String(phone || "").replace(/\s+/g, "");
  if (!cleanedPhone) {
    alert("Ten członek nie ma wpisanego numeru telefonu.");
    return;
  }
  window.location.href = `sms:${encodeURIComponent(cleanedPhone)}?&body=${encodeURIComponent(feeSmsText(name, due))}`;
}

function sendFeeSmsReminders() {
  const overdue = feeMemberRows().filter((item) => item.hasDue && item.phone);
  if (!overdue.length) {
    alert("Brak zaległych członków z wpisanym numerem telefonu.");
    return;
  }

  const confirmed = confirm(`Przygotować SMS do ${overdue.length} osób z zaległością? Na komputerze może otworzyć się aplikacja SMS albo nic się nie stanie, zależnie od systemu.`);
  if (!confirmed) return;

  const phones = overdue.map((item) => String(item.phone).replace(/\s+/g, "")).join(",");
  const totalDue = overdue.reduce((sum, item) => sum + item.due, 0);
  const text = `Przypomnienie KGiGW: prosimy o uregulowanie zaległej składki. Łączna zaległość na liście: ${money(totalDue)}. Dziękujemy.`;
  window.location.href = `sms:${encodeURIComponent(phones)}?&body=${encodeURIComponent(text)}`;
}

function renderEventOptions() {
  const current = elements.moneyEvent.value;
  elements.moneyEvent.innerHTML = '<option value="">Bez wydarzenia</option>' + state.events
    .map((event) => `<option value="${escapeHtml(event.id)}">${escapeHtml(event.name)} - ${formatDate(event.date)}</option>`)
    .join("");
  elements.moneyEvent.value = state.events.some((event) => event.id === current) ? current : "";
}

function renderInvoiceRentalOptions() {
  const current = elements.invoiceRental.value;
  elements.invoiceRental.innerHTML = '<option value="">Bez wypożyczenia</option>' + state.rentalLoans
    .map((loan) => `<option value="${escapeHtml(loan.id)}">${escapeHtml(loan.firstName)} ${escapeHtml(loan.lastName)} - ${formatDate(loan.dateFrom)} - ${money(loan.total)}</option>`)
    .join("");
  elements.invoiceRental.value = state.rentalLoans.some((loan) => loan.id === current) ? current : "";
}

function fillInvoiceFromRental() {
  const loan = state.rentalLoans.find((entry) => entry.id === elements.invoiceRental.value);
  const form = document.querySelector("#invoiceForm");
  if (!loan || !form) return;

  form.buyerName.value = `${loan.firstName} ${loan.lastName}`;
  form.buyerAddress.value = "";
  form.source.value = "Wypożyczenie";
  form.itemName.value = `Wypożyczenie: ${loan.items.map((item) => `${item.name} ${item.quantity} szt.`).join(", ")}`;
  form.quantity.value = 1;
  form.unitPrice.value = Number(loan.total || 0).toFixed(2);
  form.notes.value = `Wypożyczenie od ${formatDate(loan.dateFrom)} do ${formatDate(loan.dateTo)}. Telefon: ${loan.phone}.`;
}

function rows(items, template) {
  if (!items.length) return '<div class="row"><small>Brak wpisów pasujących do wyszukiwania.</small></div>';
  return items.map((item) => `<div class="row">${template(item)}</div>`).join("");
}

function moneyRow(item) {
  const eventText = item.eventName ? ` - Wydarzenie: ${escapeHtml(item.eventName)}` : "";
  const typeLabel = moneyTypeLabel(item.type);
  return `
    <div class="row">
      <div>
        <strong>${escapeHtml(item.title)} · ${money(item.amount)}</strong>
        <small>${formatDate(item.date)} · ${escapeHtml(item.category || "Bez kategorii")} · <span class="badge ${item.type}">${typeLabel}</span>${eventText}</small>
      </div>
    </div>
  `;
}

function moneyRowWithDelete(item) {
  const eventText = item.eventName ? ` - Wydarzenie: ${escapeHtml(item.eventName)}` : "";
  const typeLabel = moneyTypeLabel(item.type);
  return `
    <div>
      <strong>${escapeHtml(item.title)} · ${money(item.amount)}</strong>
      <small>${formatDate(item.date)} · ${escapeHtml(item.category || "Bez kategorii")} · <span class="badge ${item.type}">${typeLabel}</span>${eventText}</small>
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

function moneyTypeLabel(type) {
  if (type === "income") return "Wpływ";
  if (type === "donation") return "Darowizna";
  return "Wydatek";
}

function addEventNote(id) {
  const event = state.events.find((entry) => entry.id === id);
  const input = document.querySelector(`#eventNote-${id}`);
  const note = input?.value.trim();
  if (!event || !note) return;
  rememberUndo();
  const date = new Intl.DateTimeFormat("pl-PL").format(new Date());
  event.notes = [event.notes, `${date}: ${note}`].filter(Boolean).join("\n");
  saveState();
  renderEvents();
  renderDashboard();
}

function resetMemberFees(name) {
  if (!isAdmin()) {
    alert("Reset wpłat jest dostępny tylko dla administratora.");
    return;
  }
  const confirmed = confirm(`Wyzerować wpłaty składek dla: ${name} w roku ${FEE_YEAR}? Członek zostanie na liście, usunięte będą tylko jego wpłaty z tego roku.`);
  if (!confirmed) return;
  rememberUndo();
  state.fees = state.fees.filter((fee) => !(fee.member === name && feeYear(fee.year || fee.period) === FEE_YEAR));
  saveState();
  render();
}

function deleteAction(collection, id) {
  if (!isAdmin()) return "";
  return `<div class="row-actions"><button class="delete-button" onclick="removeItem('${collection}', '${id}')">Usuń</button></div>`;
}

function updateInventory(id, field, value) {
  if (!isAdmin()) return;
  const item = state.rentalInventory.find((entry) => entry.id === id);
  if (!item) return;
  rememberUndo();
  item[field] = field === "quantity" ? Math.max(0, Math.round(Number(value) || 0)) : Math.max(0, Number(value) || 0);
  saveState();
  renderRentals();
}

function returnRental(id) {
  const loan = state.rentalLoans.find((entry) => entry.id === id);
  if (!loan) return;
  const confirmed = confirm("Oznaczyc to wypozyczenie jako zwrocone?");
  if (!confirmed) return;
  rememberUndo();
  const notes = document.querySelector(`#returnNotes-${id}`)?.value || "";
  const damageCost = Number(document.querySelector(`#returnDamage-${id}`)?.value || 0);
  const returnItems = loan.items.map((item, index) => ({
    id: item.id,
    name: item.name,
    issued: item.quantity,
    returned: Number(document.querySelector(`#returnQty-${id}-${index}`)?.value || 0),
    damaged: Number(document.querySelector(`#returnDamaged-${id}-${index}`)?.value || 0),
    missing: Number(document.querySelector(`#returnMissing-${id}-${index}`)?.value || 0)
  }));
  loan.status = "Zwrócone";
  loan.returnedAt = new Date().toISOString().slice(0, 10);
  loan.returnNotes = notes;
  loan.damageCost = damageCost;
  loan.returnItems = returnItems;
  saveState();
  render();
}

function printRental(id) {
  const loan = state.rentalLoans.find((entry) => entry.id === id);
  if (!loan) return;
  elements.printSheet.innerHTML = rentalPrintHtml(loan);
  window.print();
}

function printReturn(id) {
  const loan = state.rentalLoans.find((entry) => entry.id === id);
  if (!loan) return;
  elements.printSheet.innerHTML = returnPrintHtml(loan);
  window.print();
}

function printMoneyReport() {
  elements.printSheet.innerHTML = moneyReportHtml();
  window.print();
}

function printInvoice(id) {
  const invoice = state.invoices.find((entry) => entry.id === id);
  if (!invoice) return;
  elements.printSheet.innerHTML = invoicePrintHtml(invoice);
  window.print();
}

function openDocumentAttachment(id) {
  const doc = state.docs.find((entry) => entry.id === id);
  if (!doc?.attachment?.dataUrl) return;
  const win = window.open();
  if (!win) {
    alert("Przeglądarka zablokowała otwarcie PDF. Zezwól na wyskakujące okna dla tej strony.");
    return;
  }
  win.document.write(`<iframe src="${doc.attachment.dataUrl}" title="${escapeHtml(doc.attachment.name)}" style="border:0;width:100%;height:100vh"></iframe>`);
}

function removeItem(collection, id) {
  if (!isAdmin()) {
    alert("Usuwanie wpisów jest dostępne tylko dla administratora.");
    return;
  }
  const confirmed = confirm("Czy na pewno usunąć ten wpis? Tej operacji nie da się cofnąć.");
  if (!confirmed) return;
  rememberUndo();
  state[collection] = state[collection].filter((item) => item.id !== id);
  saveState();
  render();
}

function availableQuantity(itemId) {
  const item = state.rentalInventory.find((entry) => entry.id === itemId);
  const total = Number(item?.quantity || 0);
  return Math.max(0, total - borrowedQuantity(itemId));
}

function borrowedQuantity(itemId) {
  return state.rentalLoans
    .filter((loan) => loan.status !== "Zwrócone")
    .flatMap((loan) => loan.items)
    .filter((entry) => entry.id === itemId)
    .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
}

function returnedQuantity(itemId) {
  return state.rentalLoans
    .filter((loan) => loan.status === "Zwrócone")
    .flatMap((loan) => loan.returnItems || loan.items.map((item) => ({ id: item.id, returned: item.quantity })))
    .filter((entry) => entry.id === itemId)
    .reduce((sum, entry) => sum + Number(entry.returned || 0), 0);
}

function updateRentalSummary() {
  const form = document.querySelector("#rentalForm");
  const data = formData(form);
  const days = rentalDays(data.dateFrom, data.dateTo);
  const items = state.rentalInventory.map((item) => ({
    quantity: Number(data[`item-${item.id}`] || 0),
    price: Number(item.price)
  }));
  elements.rentalDays.textContent = days;
  elements.rentalTotal.textContent = money(rentalTotal(items, days));
}

function rentalDays(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return 1;
  const start = new Date(`${dateFrom}T12:00:00`);
  const end = new Date(`${dateTo}T12:00:00`);
  const diff = Math.ceil((end - start) / 86400000) + 1;
  return Math.max(1, diff);
}

function rentalTotal(items, days) {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0) * days, 0);
}

function readPdfAttachment(file) {
  return new Promise((resolve, reject) => {
    if (file.type !== "application/pdf") {
      alert("Można dodać tylko plik PDF.");
      resolve(null);
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      const ok = confirm("Ten PDF ma ponad 3 MB. Zapis w przeglądarce może działać wolniej. Dodać mimo to?");
      if (!ok) {
        resolve(null);
        return;
      }
    }
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function rentalPrintHtml(loan) {
  const rows = loan.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${item.quantity} szt.</td>
      <td>${money(item.price)}</td>
      <td>${money(item.price * item.quantity * loan.days)}</td>
    </tr>
  `).join("");

  return `
    ${organizationHeaderHtml()}
    <h2>Protokół wypożyczenia</h2>
    <p><strong>Wypozyczajacy:</strong> ${escapeHtml(loan.firstName)} ${escapeHtml(loan.lastName)}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(loan.phone)}</p>
    <p><strong>Okres:</strong> ${formatDate(loan.dateFrom)} - ${formatDate(loan.dateTo)} (${loan.days} dni)</p>
    <table>
      <thead>
        <tr>
          <th>Przedmiot</th>
          <th>Ilosc</th>
          <th>Cena za dobe</th>
          <th>Wartosc</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p><strong>Razem do zaplaty:</strong> ${money(loan.total)}</p>
    <p><strong>Uwagi:</strong> ${escapeHtml(loan.notes || "Brak")}</p>
    <p>Potwierdzam odbior wymienionych przedmiotow i zobowiazuje sie do ich zwrotu w ustalonym terminie.</p>
    <div class="print-signatures">
      <div class="signature-line">Podpis wypozyczajacego</div>
      <div class="signature-line">Podpis wydajacego</div>
    </div>
  `;
}

function returnPrintHtml(loan) {
  const rows = (loan.returnItems || loan.items.map((item) => ({
    name: item.name,
    issued: item.quantity,
    returned: item.quantity,
    damaged: 0,
    missing: 0
  }))).map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${item.issued} szt.</td>
      <td>${item.returned} szt.</td>
      <td>${item.damaged} szt.</td>
      <td>${item.missing} szt.</td>
    </tr>
  `).join("");

  return `
    ${organizationHeaderHtml()}
    <h2>Protokół zwrotu</h2>
    <p><strong>Wypozyczajacy:</strong> ${escapeHtml(loan.firstName)} ${escapeHtml(loan.lastName)}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(loan.phone)}</p>
    <p><strong>Okres wypozyczenia:</strong> ${formatDate(loan.dateFrom)} - ${formatDate(loan.dateTo)}</p>
    <p><strong>Data zwrotu:</strong> ${formatDate(loan.returnedAt)}</p>
    <table>
      <thead>
        <tr>
          <th>Przedmiot</th>
          <th>Wydano</th>
          <th>Wróciło</th>
          <th>Uszkodzone</th>
          <th>Brak</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p><strong>Doplata za braki/uszkodzenia:</strong> ${money(loan.damageCost || 0)}</p>
    <p><strong>Uwagi do zwrotu:</strong> ${escapeHtml(loan.returnNotes || "Brak")}</p>
    <div class="print-signatures">
      <div class="signature-line">Podpis zwracajacego</div>
      <div class="signature-line">Podpis przyjmujacego zwrot</div>
    </div>
  `;
}

function moneyReportHtml() {
  const items = [...state.money].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const income = items.filter((item) => item.type === "income" || item.type === "donation").reduce((sum, item) => sum + item.amount, 0);
  const expenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const rowsHtml = items.map((item) => `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${moneyTypeLabel(item.type)}</td>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.category || "Bez kategorii")}</td>
      <td>${escapeHtml(item.eventName || "Bez wydarzenia")}</td>
      <td>${money(item.amount)}</td>
    </tr>
  `).join("");

  const eventGroups = state.events.map((event) => {
    const eventItems = items.filter((item) => item.eventId === event.id || item.eventName === event.name);
    const eventIncome = eventItems.filter((item) => item.type === "income" || item.type === "donation").reduce((sum, item) => sum + item.amount, 0);
    const eventExpenses = eventItems.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    return { event, eventItems, eventIncome, eventExpenses };
  }).filter((group) => group.eventItems.length);

  const eventRows = eventGroups.map((group) => `
    <tr>
      <td>${escapeHtml(group.event.name)}</td>
      <td>${formatDate(group.event.date)}</td>
      <td>${money(group.eventIncome)}</td>
      <td>${money(group.eventExpenses)}</td>
      <td>${money(group.eventIncome - group.eventExpenses)}</td>
    </tr>
  `).join("");

  return `
    ${organizationHeaderHtml()}
    <h2>Zestawienie kasy</h2>
    <p><strong>Wpływy:</strong> ${money(income)} &nbsp; <strong>Wydatki:</strong> ${money(expenses)} &nbsp; <strong>Stan:</strong> ${money(income - expenses)}</p>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Typ</th>
          <th>Opis</th>
          <th>Kategoria</th>
          <th>Wydarzenie</th>
          <th>Kwota</th>
        </tr>
      </thead>
      <tbody>${rowsHtml || '<tr><td colspan="6">Brak wpisów</td></tr>'}</tbody>
    </table>
    <h2>Podsumowanie według wydarzeń</h2>
    <table>
      <thead>
        <tr>
          <th>Wydarzenie</th>
          <th>Data</th>
          <th>Wpływy</th>
          <th>Wydatki</th>
          <th>Bilans</th>
        </tr>
      </thead>
      <tbody>${eventRows || '<tr><td colspan="5">Brak wpisów przypisanych do wydarzeń</td></tr>'}</tbody>
    </table>
    <div class="print-signatures">
      <div class="signature-line">Sporządził/a</div>
      <div class="signature-line">Zatwierdził/a</div>
    </div>
  `;
}

function organizationHeaderHtml() {
  return `
    <img class="print-logo" src="${escapeHtml(ORGANIZATION.logo)}" alt="Logo KGiGW">
    <h1>${escapeHtml(ORGANIZATION.name)}</h1>
    <p>${escapeHtml(ORGANIZATION.street)}<br>${escapeHtml(ORGANIZATION.city)}</p>
  `;
}

function makeInvoice(data) {
  const net = data.quantity * data.unitPrice;
  const vatRate = data.vatRate === "zw" ? 0 : Number(data.vatRate);
  const vat = data.vatRate === "zw" ? 0 : net * vatRate / 100;
  return {
    ...data,
    net,
    vat,
    gross: net + vat
  };
}

function invoicePrintHtml(invoice) {
  return `
    <img class="print-logo" src="${escapeHtml(ORGANIZATION.logo)}" alt="Logo KGiGW">
    <h1>Faktura VAT ${escapeHtml(invoice.number)}</h1>
    <p><strong>Data wystawienia:</strong> ${formatDate(invoice.date)}</p>
    <table>
      <tbody>
        <tr>
          <th>Sprzedawca</th>
          <th>Nabywca</th>
        </tr>
        <tr>
          <td>
            ${escapeHtml(ORGANIZATION.name)}<br>
            ${escapeHtml(ORGANIZATION.street)}<br>
            ${escapeHtml(ORGANIZATION.city)}<br>
            NIP: ${escapeHtml(ORGANIZATION.nip)}
          </td>
          <td>
            ${escapeHtml(invoice.buyerName)}<br>
            ${escapeHtml(invoice.buyerAddress || "")}<br>
            ${invoice.buyerNip ? `NIP: ${escapeHtml(invoice.buyerNip)}` : ""}
          </td>
        </tr>
      </tbody>
    </table>
    <table>
      <thead>
        <tr>
          <th>Lp.</th>
          <th>Nazwa</th>
          <th>Ilość</th>
          <th>Cena netto</th>
          <th>Netto</th>
          <th>VAT</th>
          <th>Brutto</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>${escapeHtml(invoice.itemName)}<br><small>${escapeHtml(invoice.source)}</small></td>
          <td>${invoice.quantity}</td>
          <td>${money(invoice.unitPrice)}</td>
          <td>${money(invoice.net)}</td>
          <td>${invoice.vatRate === "zw" ? "ZW" : `${invoice.vatRate}%`} / ${money(invoice.vat)}</td>
          <td>${money(invoice.gross)}</td>
        </tr>
      </tbody>
    </table>
    <p><strong>Razem netto:</strong> ${money(invoice.net)} &nbsp; <strong>VAT:</strong> ${money(invoice.vat)} &nbsp; <strong>Razem brutto:</strong> ${money(invoice.gross)}</p>
    ${invoice.rentalLabel ? `<p><strong>Powiązane wypożyczenie:</strong> ${escapeHtml(invoice.rentalLabel)}</p>` : ""}
    <p><strong>Uwagi:</strong> ${escapeHtml(invoice.notes || "Brak")}</p>
    <div class="print-signatures">
      <div class="signature-line">Wystawił/a</div>
      <div class="signature-line">Odebrał/a</div>
    </div>
  `;
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
      rememberUndo();
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
