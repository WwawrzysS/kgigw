const STORAGE_KEY = "kgw-panel-data-v2-clean";
const AUTH_KEY = "kgigw-active-role";
const APP_VERSION = "2026.05.25-12";
const VERSION_KEY = "kgigw-app-version";
const ANNUAL_FEE = 120;
const QUARTER_FEE = 30;
const FEE_YEAR = new Date().getFullYear();
const DOCUMENT_BUCKET = "documents";
const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
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

prepareLocalVersion();
let state = loadState();
let activeView = "dashboard";
let query = "";
let currentRole = sessionStorage.getItem(AUTH_KEY);
let currentUserName = sessionStorage.getItem("kgigw-user-name") || "";
let undoSnapshot = null;
let supabaseClient = null;
let supabaseDataReady = false;

const titles = {
  dashboard: "Pulpit",
  members: "Członkowie",
  fees: "Składki",
  money: "Finanse",
  events: "Wydarzenia",
  rentals: "Wypożyczalnia",
  invoices: "Faktury",
  docs: "Dokumenty i poczta",
  board: "Zarząd",
  administration: "Administracja"
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
  navSubitems: document.querySelectorAll(".nav-subitem"),
  navSubmenus: document.querySelectorAll(".nav-submenu"),
  views: document.querySelectorAll(".view"),
  globalSearch: document.querySelector("#globalSearch"),
  cashBalance: document.querySelector("#cashBalance"),
  memberCount: document.querySelector("#memberCount"),
  lateFees: document.querySelector("#lateFees"),
  rentalCount: document.querySelector("#rentalCount"),
  recentMoney: document.querySelector("#recentMoney"),
  upcomingEvents: document.querySelector("#upcomingEvents"),
  membersList: document.querySelector("#membersList"),
  showInactiveMembers: document.querySelector("#showInactiveMembers"),
  memberFormTitle: document.querySelector("#memberFormTitle"),
  cancelMemberEdit: document.querySelector("#cancelMemberEdit"),
  feesList: document.querySelector("#feesList"),
  sendFeeSms: document.querySelector("#sendFeeSms"),
  moneyEvent: document.querySelector("#moneyEvent"),
  moneyFormTitle: document.querySelector("#moneyFormTitle"),
  cancelMoneyEdit: document.querySelector("#cancelMoneyEdit"),
  docEvent: document.querySelector("#docEvent"),
  moneyList: document.querySelector("#moneyList"),
  eventsList: document.querySelector("#eventsList"),
  inventoryAddForm: document.querySelector("#inventoryAddForm"),
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
  docPanels: document.querySelectorAll("[data-doc-panel]"),
  printSheet: document.querySelector("#printSheet"),
  docsList: document.querySelector("#docsList"),
  storageText: document.querySelector("#storageText"),
  storageBar: document.querySelector("#storageBar"),
  appVersion: document.querySelector("#appVersion"),
  boardList: document.querySelector("#boardList"),
  feeMember: document.querySelector("#feeMember"),
  mailboxInfo: document.querySelector("#mailboxInfo")
};

document.body.classList.toggle("locked", !currentRole);
document.querySelectorAll("#exportData, .import-button").forEach((item) => item.classList.add("admin-only"));
elements.currentRole.textContent = currentUserName ? `${currentUserName} (${roleName(currentRole)})` : roleName(currentRole);
if (elements.appVersion) elements.appVersion.textContent = APP_VERSION;
elements.loginForm.addEventListener("submit", handleLogin);
document.querySelector("#logoutButton").addEventListener("click", logout);
document.querySelector("#memberForm").addEventListener("submit", handleMember);
document.querySelector("#cancelMemberEdit").addEventListener("click", cancelMemberEdit);
document.querySelector("#showInactiveMembers").addEventListener("change", renderMembers);
document.querySelector("#feeForm").addEventListener("submit", handleFee);
document.querySelector("#sendFeeSms").addEventListener("click", sendFeeSmsReminders);
document.querySelector("#moneyForm").addEventListener("submit", handleMoney);
document.querySelector("#cancelMoneyEdit").addEventListener("click", cancelMoneyEdit);
document.querySelector("#printMoneyReport").addEventListener("click", printMoneyReport);
document.querySelector("#eventForm").addEventListener("submit", handleEvent);
document.querySelector("#inventoryAddForm").addEventListener("submit", handleInventoryAdd);
document.querySelector("#rentalForm").addEventListener("submit", handleRental);
document.querySelector("#rentalForm").addEventListener("input", updateRentalSummary);
document.querySelector("#docForm").addEventListener("submit", handleDoc);
document.querySelector("#invoiceForm").addEventListener("submit", handleInvoice);
document.querySelector("#invoiceRental").addEventListener("change", fillInvoiceFromRental);
document.querySelector("#boardForm").addEventListener("submit", handleBoard);
document.querySelector("#exportData").addEventListener("click", exportData);
document.querySelector("#undoButton").addEventListener("click", undoLastChange);
document.querySelector("#importData").addEventListener("change", importData);
document.querySelector("#refreshProgram").addEventListener("click", refreshProgram);
document.querySelector("#sidebarRefreshProgram").addEventListener("click", refreshProgram);
document.querySelector("#showMailboxInfo").addEventListener("click", () => {
  elements.mailboxInfo.classList.toggle("hidden");
});
document.querySelector("#openMailboxWindow").addEventListener("click", openMailboxConfig);

elements.navItems.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.subnav) {
      toggleSubnav(button.dataset.subnav);
      return;
    }
    switchView(button.dataset.view);
  });
});

elements.navSubitems.forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view);
    if (button.dataset.rentalTab) switchRentalTab(button.dataset.rentalTab);
    if (button.dataset.docTab) switchDocTab(button.dataset.docTab);
  });
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
if (currentRole) {
  refreshSupabaseData();
}

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
    await refreshSupabaseData();
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

function canCorrect() {
  return currentRole === "admin" || currentRole === "staff";
}

function applyRole() {
  document.querySelectorAll(".admin-only").forEach((item) => {
    item.classList.toggle("hidden-role", !canCorrect());
  });
  document.querySelectorAll(".admin-role-only").forEach((item) => {
    const show = isAdmin();
    item.classList.toggle("hidden-role", !show);
    item.hidden = !show;
    item.style.display = show ? "" : "none";
  });
  if (!isAdmin() && activeView === "administration") {
    switchView("dashboard");
  }
}

function setupSupabaseClient() {
  const config = window.KGIGW_SUPABASE;
  if (!window.supabase || !config?.url || !config?.anonKey) return;
  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
}

async function refreshSupabaseData() {
  if (!supabaseClient || !currentRole) return;
  const [membersResult, feesResult, inventoryResult, rentalsResult, eventsResult, moneyResult, docsResult, invoicesResult] = await Promise.all([
    supabaseClient
      .from("members")
      .select("id, name, phone, email, status, created_at")
      .order("name", { ascending: true }),
    supabaseClient
      .from("fees")
      .select("id, member_id, year, amount, note, paid_at, created_at")
      .order("paid_at", { ascending: false }),
    supabaseClient
      .from("rental_inventory")
      .select("id, name, quantity, price_per_day")
      .order("name", { ascending: true }),
    supabaseClient
      .from("rentals")
      .select("id, first_name, last_name, phone, date_from, date_to, days, total, status, notes, returned_at, return_notes, damage_cost, rental_lines(id, inventory_id, item_name, quantity, price_per_day, returned, damaged, missing)")
      .order("date_from", { ascending: false })
    ,
    supabaseClient
      .from("events")
      .select("id, name, event_date, place, notes")
      .order("event_date", { ascending: true }),
    supabaseClient
      .from("transactions")
      .select("id, type, title, category, amount, transaction_date, event_id, status, cancelled_at, cancelled_reason")
      .order("transaction_date", { ascending: false })
    ,
    supabaseClient
      .from("documents")
      .select("id, title, sender, category, document_date, notes, file_path, file_name, file_size, mime_type, event_id")
      .order("document_date", { ascending: false })
    ,
    supabaseClient
      .from("invoices")
      .select("id, number, invoice_date, buyer_name, buyer_address, buyer_nip, source, item_name, quantity, unit_price, vat_rate, net, vat, gross, rental_id, notes")
      .order("invoice_date", { ascending: false })
  ]);

  if (membersResult.error) {
    alert(`Nie udało się pobrać członków z Supabase: ${membersResult.error.message}`);
    return;
  }
  if (feesResult.error) {
    alert(`Nie udało się pobrać składek z Supabase: ${feesResult.error.message}`);
    return;
  }
  if (inventoryResult.error) {
    alert(`Nie udało się pobrać magazynu z Supabase: ${inventoryResult.error.message}`);
    return;
  }
  if (rentalsResult.error) {
    alert(`Nie udało się pobrać wypożyczeń z Supabase: ${rentalsResult.error.message}`);
    return;
  }
  if (eventsResult.error) {
    alert(`Nie udało się pobrać wydarzeń z Supabase: ${eventsResult.error.message}`);
    return;
  }
  if (moneyResult.error) {
    alert(`Nie udało się pobrać kasy z Supabase: ${moneyResult.error.message}`);
    return;
  }
  if (docsResult.error) {
    alert(`Nie udało się pobrać dokumentów z Supabase: ${docsResult.error.message}`);
    return;
  }
  if (invoicesResult.error) {
    alert(`Nie udało się pobrać faktur z Supabase: ${invoicesResult.error.message}`);
    return;
  }

  state.members = (membersResult.data || []).map((member) => ({
    id: member.id,
    name: member.name,
    phone: member.phone || "",
    email: member.email || "",
    status: member.status || "Aktywny"
  }));

  state.fees = (feesResult.data || []).map((fee) => {
    const member = state.members.find((entry) => entry.id === fee.member_id);
    return {
      id: fee.id,
      memberId: fee.member_id,
      member: member?.name || "",
      period: String(fee.year || FEE_YEAR),
      year: Number(fee.year || FEE_YEAR),
      dueAmount: ANNUAL_FEE,
      amount: Number(fee.amount || 0),
      status: "Wpłata",
      paidAt: fee.paid_at,
      note: fee.note || ""
    };
  });

  state.rentalInventory = (inventoryResult.data || []).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: Number(item.quantity || 0),
    price: Number(item.price_per_day || 0)
  }));

  state.rentalLoans = (rentalsResult.data || []).map((rental) => {
    const lines = rental.rental_lines || [];
    const items = lines.map((line) => ({
      lineId: line.id,
      id: line.inventory_id,
      name: line.item_name,
      quantity: Number(line.quantity || 0),
      price: Number(line.price_per_day || 0)
    }));
    const returnItems = lines.map((line) => ({
      lineId: line.id,
      id: line.inventory_id,
      name: line.item_name,
      issued: Number(line.quantity || 0),
      returned: Number(line.returned || 0),
      damaged: Number(line.damaged || 0),
      missing: Number(line.missing || 0)
    }));
    return {
      id: rental.id,
      firstName: rental.first_name,
      lastName: rental.last_name,
      phone: rental.phone || "",
      dateFrom: rental.date_from,
      dateTo: rental.date_to,
      days: Number(rental.days || 1),
      total: Number(rental.total || 0),
      status: rental.status || "Wypożyczone",
      notes: rental.notes || "",
      returnedAt: rental.returned_at,
      returnNotes: rental.return_notes || "",
      damageCost: Number(rental.damage_cost || 0),
      items,
      returnItems
    };
  });

  state.events = (eventsResult.data || []).map((event) => ({
    id: event.id,
    name: event.name,
    date: event.event_date || "",
    place: event.place || "",
    notes: event.notes || ""
  }));

  state.money = (moneyResult.data || []).map((entry) => {
    const linkedEvent = state.events.find((event) => event.id === entry.event_id);
    return {
      id: entry.id,
      type: entry.type,
      title: entry.title,
      category: entry.category || "",
      amount: Number(entry.amount || 0),
      date: entry.transaction_date,
      eventId: entry.event_id || "",
      eventName: linkedEvent?.name || "",
      status: entry.status || "active",
      cancelledAt: entry.cancelled_at || "",
      cancelledReason: entry.cancelled_reason || ""
    };
  });

  state.docs = (docsResult.data || []).map((doc) => ({
    id: doc.id,
    title: doc.title,
    sender: doc.sender || "",
    category: doc.category,
    date: doc.document_date,
    notes: doc.notes || "",
    filePath: doc.file_path || "",
    fileName: doc.file_name || "",
    fileSize: Number(doc.file_size || 0),
    mimeType: doc.mime_type || "",
    eventId: doc.event_id || ""
  }));

  state.invoices = (invoicesResult.data || []).map((invoice) => {
    const rental = state.rentalLoans.find((entry) => entry.id === invoice.rental_id);
    return {
      id: invoice.id,
      number: invoice.number,
      date: invoice.invoice_date,
      buyerName: invoice.buyer_name,
      buyerAddress: invoice.buyer_address || "",
      buyerNip: invoice.buyer_nip || "",
      source: invoice.source,
      itemName: invoice.item_name,
      quantity: Number(invoice.quantity || 1),
      unitPrice: Number(invoice.unit_price || 0),
      vatRate: invoice.vat_rate,
      net: Number(invoice.net || 0),
      vat: Number(invoice.vat || 0),
      gross: Number(invoice.gross || 0),
      rentalId: invoice.rental_id || "",
      rentalLabel: rental ? `${rental.firstName} ${rental.lastName} - ${formatDate(rental.dateFrom)}` : "",
      notes: invoice.notes || ""
    };
  });

  supabaseDataReady = true;
  saveState();
  render();
}

function setupRentalShell() {
  const rentalSection = document.querySelector("#rentals");
  const layout = rentalSection?.querySelector(".rentals-layout");
  if (!rentalSection || !layout || rentalSection.querySelector(".subtabs")) return;

  const tabs = document.createElement("div");
  tabs.className = "subtabs hidden";
  tabs.setAttribute("aria-label", "Działy wypożyczalni");
  tabs.innerHTML = `
    <button class="subtab active" data-rental-tab="new">Nowe wypożyczenie</button>
    <button class="subtab" data-rental-tab="returns">Zwroty</button>
    <button class="subtab" data-rental-tab="storage">Magazyn</button>
    <button class="subtab" data-rental-tab="history">Historia</button>
  `;

  const inventoryPanel = layout.querySelector(".panel:not(.rentals-list-panel)");
  const rentalForm = layout.querySelector("#rentalForm");
  const historyPanel = layout.querySelector(".rentals-list-panel");
  inventoryPanel?.classList.add("rental-tab-panel");
  inventoryPanel?.setAttribute("data-rental-panel", "storage");
  historyPanel?.classList.add("rental-tab-panel");
  historyPanel?.setAttribute("data-rental-panel", "history");
  rentalForm?.classList.add("rental-tab-panel", "active-rental-panel");
  rentalForm?.setAttribute("data-rental-panel", "new");

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

function prepareLocalVersion() {
  const savedVersion = localStorage.getItem(VERSION_KEY);
  if (savedVersion !== APP_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }
}

function refreshProgram() {
  const confirmed = confirm("Odświeżyć program i wyczyścić lokalną pamięć tej przeglądarki? Dane w Supabase zostaną bez zmian.");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(VERSION_KEY, APP_VERSION);
  window.location.reload();
}

function openMailboxConfig() {
  const win = window.open("", "kgigw-mail-config", "width=760,height=620");
  if (!win) {
    alert("Przeglądarka zablokowała nowe okno. Zezwól na wyskakujące okna dla tej strony.");
    return;
  }
  win.document.write(`
    <title>Konfiguracja poczty KGiGW</title>
    <body style="font-family:Arial,sans-serif;max-width:720px;margin:24px auto;line-height:1.5;color:#202124">
      <h1>Konfiguracja poczty</h1>
      <p>Najbezpieczniejszy wariant to osobne hasło aplikacji do poczty koła, a nie główne hasło do skrzynki.</p>
      <ol>
        <li>Utwórz adres poczty koła albo wybierz istniejącą skrzynkę.</li>
        <li>Włącz hasło aplikacji u dostawcy poczty, jeśli jest dostępne.</li>
        <li>Dopiero potem podłączymy odbieranie dokumentów do panelu KGiGW.</li>
      </ol>
      <p>Ta część jest przygotowana jako osobne okno, żeby konfiguracja poczty nie mieszała się z codzienną pracą w panelu.</p>
    </body>
  `);
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
  elements.navSubitems.forEach((item) => item.classList.toggle("active", item.dataset.view === view && (item.dataset.rentalTab || item.dataset.docTab)));
  elements.views.forEach((section) => section.classList.toggle("active-view", section.id === view));
  if (view === "rentals") switchRentalTab("new");
  if (view === "docs") switchDocTab("documents");
  render();
}

function toggleSubnav(id) {
  if (!id) return;
  const selected = document.querySelector(`#${id}`);
  const shouldOpen = !selected?.classList.contains("open");
  elements.navSubmenus.forEach((menu) => {
    menu.classList.toggle("open", menu.id === id && shouldOpen);
  });
}

function switchRentalTab(tabName) {
  elements.rentalSubtabs.forEach((item) => item.classList.toggle("active", item.dataset.rentalTab === tabName));
  elements.rentalPanels.forEach((panel) => {
    const active = panel.dataset.rentalPanel === tabName;
    panel.classList.toggle("active-rental-panel", active);
    panel.hidden = !active;
    panel.style.display = active ? "" : "none";
  });
  elements.navSubitems.forEach((item) => {
    if (item.dataset.rentalTab) item.classList.toggle("active", item.dataset.rentalTab === tabName);
  });
}

function switchDocTab(tabName) {
  elements.docPanels.forEach((panel) => panel.classList.toggle("active-doc-panel", panel.dataset.docPanel === tabName));
  elements.navSubitems.forEach((item) => {
    if (item.dataset.docTab) item.classList.toggle("active", item.dataset.docTab === tabName);
  });
}

async function handleMember(event) {
  event.preventDefault();
  const data = formData(event.target);
  const memberId = data.id || "";
  if (supabaseClient && currentRole) {
    const payload = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      status: data.status || "Aktywny"
    };
    const { error } = memberId
      ? await supabaseClient.from("members").update(payload).eq("id", memberId)
      : await supabaseClient.from("members").insert(payload);
    if (error) {
      alert(`Nie udało się zapisać członka w Supabase: ${error.message}`);
      return;
    }
    resetMemberForm(event.target);
    await refreshSupabaseData();
    return;
  }
  if (memberId) {
    const member = state.members.find((entry) => entry.id === memberId);
    if (member) Object.assign(member, data, { id: memberId });
    resetMemberForm(event.target);
    saveState();
    render();
    return;
  }
  delete data.id;
  state.members.push({ id: makeId(), ...data });
  finishForm(event.target);
}

async function handleFee(event) {
  event.preventDefault();
  const data = formData(event.target);
  const member = state.members.find((entry) => entry.id === data.member);
  if (!member) {
    alert("Wybierz członka z listy.");
    return;
  }
  const year = feeYear(data.period);
  const dueAmount = ANNUAL_FEE;
  const paidAmount = Number(data.amount || 0);
  const paidAt = new Date().toISOString().slice(0, 10);
  const moneyTitle = `Składka członkowska ${year} - ${member.name}`;
  if (supabaseClient && currentRole) {
    const { data: savedFee, error } = await supabaseClient.from("fees").insert({
      member_id: member.id,
      year,
      amount: paidAmount,
      paid_at: paidAt
    }).select("id").single();
    if (error) {
      alert(`Nie udało się zapisać składki w Supabase: ${error.message}`);
      return;
    }
    const { error: moneyError } = await supabaseClient.from("transactions").insert({
      type: "income",
      title: moneyTitle,
      category: "Składka członkowska",
      amount: paidAmount,
      transaction_date: paidAt
    });
    if (moneyError) {
      alert(`Składka została zapisana, ale nie udało się dopisać wpływu do Kasy: ${moneyError.message}`);
      return;
    }
    event.target.reset();
    event.target.period.value = FEE_YEAR;
    event.target.dueAmount.value = ANNUAL_FEE;
    await refreshSupabaseData();
    return;
  }
  state.fees.push({
    id: data.id || makeId(),
    ...data,
    memberId: member.id,
    member: member.name,
    year,
    dueAmount,
    amount: paidAmount,
    status: "Wpłata"
  });
  const savedLocalFee = state.fees.at(-1);
  state.money.push({
    id: makeId(),
    type: "income",
    title: moneyTitle,
    category: "Składka członkowska",
    amount: paidAmount,
    date: paidAt,
    sourceType: "fee",
    sourceId: savedLocalFee.id
  });
  finishForm(event.target);
  event.target.period.value = FEE_YEAR;
  event.target.dueAmount.value = ANNUAL_FEE;
}

async function handleMoney(event) {
  event.preventDefault();
  const data = formData(event.target);
  const moneyId = data.id || "";
  const linkedEvent = state.events.find((item) => item.id === data.eventId);
  if (data.type === "donation" && !data.category) {
    data.category = "Darowizny";
  }
  if (supabaseClient && currentRole) {
    const payload = {
      type: data.type,
      title: data.title,
      category: data.category || null,
      amount: Number(data.amount || 0),
      transaction_date: data.date,
      event_id: data.eventId || null
    };
    const { error } = moneyId
      ? await supabaseClient.from("transactions").update(payload).eq("id", moneyId)
      : await supabaseClient.from("transactions").insert(payload);
    if (error) {
      alert(`Nie udało się zapisać operacji w Finansach: ${error.message}`);
      return;
    }
    resetMoneyForm(event.target);
    await refreshSupabaseData();
    return;
  }
  if (moneyId) {
    const entry = state.money.find((item) => item.id === moneyId);
    if (entry) {
      Object.assign(entry, data, {
        id: moneyId,
        eventName: linkedEvent?.name || "",
        amount: Number(data.amount)
      });
    }
    resetMoneyForm(event.target);
    saveState();
    render();
    return;
  }
  delete data.id;
  state.money.push({
      id: makeId(),
      ...data,
      eventName: linkedEvent?.name || "",
      amount: Number(data.amount),
      status: "active"
    });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
}

async function handleEvent(event) {
  event.preventDefault();
  const data = formData(event.target);
  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient.from("events").insert({
      name: data.name,
      event_date: data.date || null,
      place: data.place || null,
      notes: data.notes || null
    });
    if (error) {
      alert(`Nie udało się zapisać wydarzenia w Supabase: ${error.message}`);
      return;
    }
    event.target.reset();
    event.target.date.valueAsDate = new Date();
    await refreshSupabaseData();
    return;
  }
  state.events.push({ id: makeId(), ...data });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
  renderEventOptions();
}

async function handleRental(event) {
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
  const total = rentalTotal(items, days);
  if (supabaseClient && currentRole) {
    const { data: rental, error: rentalError } = await supabaseClient
      .from("rentals")
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
        date_from: data.dateFrom,
        date_to: data.dateTo,
        days,
        total,
        status: "Wypożyczone",
        notes: data.notes || null
      })
      .select("id")
      .single();

    if (rentalError) {
      alert(`Nie udało się zapisać wypożyczenia w Supabase: ${rentalError.message}`);
      return;
    }

    const rentalLines = items.map((item) => ({
      rental_id: rental.id,
      inventory_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price_per_day: item.price
    }));
    const { error: linesError } = await supabaseClient.from("rental_lines").insert(rentalLines);
    if (linesError) {
      alert(`Wypożyczenie zapisane, ale nie udało się zapisać pozycji: ${linesError.message}`);
      return;
    }

    form.reset();
    form.dateFrom.valueAsDate = new Date();
    form.dateTo.valueAsDate = new Date();
    await refreshSupabaseData();
    return;
  }
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
    total,
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
  if (file && file.type !== "application/pdf") {
    alert("Można dodać tylko plik PDF.");
    return;
  }
  if (supabaseClient && currentRole) {
    let filePath = "";
    let fileName = "";
    let fileSize = 0;
    let mimeType = "";
    if (file) {
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
      filePath = `${new Date().getFullYear()}/${makeId()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabaseClient.storage
        .from(DOCUMENT_BUCKET)
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        alert(`Nie udało się wysłać PDF do Supabase Storage: ${uploadError.message}`);
        return;
      }
    }

    const { data: savedDoc, error } = await supabaseClient.from("documents").insert({
      title: data.title,
      sender: data.sender || null,
      category: data.category,
      document_date: data.date,
      notes: data.notes || null,
      file_path: filePath || null,
      file_name: fileName || null,
      file_size: fileSize || null,
      mime_type: mimeType || null,
      event_id: data.eventId || null
    }).select("id").single();
    if (error) {
      alert(`PDF mógł zostać wysłany, ale nie udało się zapisać dokumentu: ${error.message}`);
      return;
    }
    const moneyEntries = docMoneyEntries(data, savedDoc.id);
    if (moneyEntries.length) {
      const { error: moneyError } = await supabaseClient.from("transactions").insert(moneyEntries);
      if (moneyError) {
        alert(`Dokument zapisany, ale nie udało się dopisać pozycji w Finansach: ${moneyError.message}`);
        return;
      }
    }
    event.target.reset();
    event.target.date.valueAsDate = new Date();
    await refreshSupabaseData();
    return;
  }
  const attachment = file ? await readPdfAttachment(file) : null;
  delete data.file;
  const localDocId = makeId();
  state.docs.push({ id: localDocId, ...data, attachment });
  docMoneyEntries(data, localDocId).forEach((entry) => {
    const linkedEvent = state.events.find((item) => item.id === entry.event_id);
    state.money.push({
      id: makeId(),
      type: entry.type,
      title: entry.title,
      category: entry.category,
      amount: Number(entry.amount),
      date: entry.transaction_date,
      eventId: entry.event_id || "",
      eventName: linkedEvent?.name || ""
    });
  });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
}

async function handleInvoice(event) {
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
  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient.from("invoices").insert({
      number: invoice.number,
      invoice_date: invoice.date,
      buyer_name: invoice.buyerName,
      buyer_address: invoice.buyerAddress || null,
      buyer_nip: invoice.buyerNip || null,
      source: invoice.source,
      item_name: invoice.itemName,
      quantity: invoice.quantity,
      unit_price: invoice.unitPrice,
      vat_rate: invoice.vatRate,
      net: invoice.net,
      vat: invoice.vat,
      gross: invoice.gross,
      rental_id: invoice.rentalId || null,
      notes: invoice.notes || null
    });
    if (error) {
      alert(`Nie udało się zapisać faktury w Supabase: ${error.message}`);
      return;
    }
    event.target.reset();
    event.target.date.valueAsDate = new Date();
    await refreshSupabaseData();
    return;
  }
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
  const activeMoney = state.money.filter(isActiveMoney);
  const income = activeMoney.filter((item) => item.type === "income" || item.type === "donation").reduce((sum, item) => sum + item.amount, 0);
  const expenses = activeMoney.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
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
  const showInactive = elements.showInactiveMembers?.checked;
  const visibleMembers = state.members.filter((item) => showInactive || (item.status || "Aktywny") === "Aktywny");
  elements.membersList.innerHTML = rows(filterItems(visibleMembers), (item) => `
    <div>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.phone || "Brak telefonu")} · ${escapeHtml(item.email || "Brak e-maila")} · ${escapeHtml(item.status)}</small>
    </div>
    <div class="row-actions">
      ${canCorrect() ? `<button class="small-button" onclick="editMember('${item.id}')">Edytuj</button>` : ""}
      ${canCorrect() ? `<button class="delete-button" onclick="removeItem('members', '${item.id}')">Usuń</button>` : ""}
    </div>
  `);
}

function editMember(id) {
  if (!canCorrect()) return;
  const member = state.members.find((entry) => entry.id === id);
  const form = document.querySelector("#memberForm");
  if (!member || !form) return;
  form.id.value = member.id;
  form.name.value = member.name || "";
  form.phone.value = member.phone || "";
  form.email.value = member.email || "";
  form.status.value = member.status || "Aktywny";
  elements.memberFormTitle.textContent = "Edytuj członka";
  form.querySelector('button[type="submit"]').textContent = "Zapisz zmiany";
  elements.cancelMemberEdit.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelMemberEdit() {
  resetMemberForm(document.querySelector("#memberForm"));
}

function resetMemberForm(form) {
  if (!form) return;
  form.reset();
  form.id.value = "";
  elements.memberFormTitle.textContent = "Dodaj członka";
  form.querySelector('button[type="submit"]').textContent = "Dodaj";
  elements.cancelMemberEdit.classList.add("hidden");
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
        ${canCorrect() ? `<button class="delete-button" onclick="resetMemberFees('${escapeHtml(item.name)}')">Reset wpłat</button>` : ""}
        ${canCorrect() ? item.fees.map((fee) => `<button class="delete-button" onclick="removeItem('fees', '${fee.id}')">Usuń wpis</button>`).join("") : ""}
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
        <div class="inventory-edit admin-only ${canCorrect() ? "" : "hidden-role"}">
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
  renderStorageInfo();
  elements.docsList.innerHTML = rows(filterItems(state.docs), (item) => `
    <div>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${formatDate(item.date)} · ${escapeHtml(item.sender || "Brak nadawcy")} · <span class="badge neutral">${escapeHtml(item.category)}</span><br>${escapeHtml(item.notes || "")}${docFileName(item) ? `<br>PDF: ${escapeHtml(docFileName(item))} (${formatBytes(docFileSize(item))})` : ""}</small>
    </div>
    <div class="row-actions">
      ${docHasFile(item) ? `<button class="small-button" onclick="openDocumentAttachment('${item.id}')">Otwórz PDF</button>` : ""}
      ${isAdmin() ? `<button class="delete-button" onclick="removeItem('docs', '${item.id}')">Usuń</button>` : ""}
    </div>
  `);
}

function renderStorageInfo() {
  if (!elements.storageText || !elements.storageBar) return;
  const used = state.docs.reduce((sum, doc) => sum + docFileSize(doc), 0);
  const percent = Math.min(100, Math.round((used / STORAGE_LIMIT_BYTES) * 100));
  elements.storageText.textContent = `${formatBytes(used)} / ${formatBytes(STORAGE_LIMIT_BYTES)} (${percent}%)`;
  elements.storageBar.style.width = `${percent}%`;
  elements.storageBar.className = percent >= 90 ? "danger" : percent >= 70 ? "warning" : "";
}

function renderInvoices() {
  elements.invoicesList.innerHTML = rows(filterItems(state.invoices), (invoice) => `
    <div>
      <strong>Faktura ${escapeHtml(invoice.number)} - ${money(invoice.gross)}</strong>
      <small>${formatDate(invoice.date)} - ${escapeHtml(invoice.buyerName)} - ${escapeHtml(invoice.source)}${invoice.rentalLabel ? ` - Wypożyczenie: ${escapeHtml(invoice.rentalLabel)}` : ""}<br>${escapeHtml(invoice.itemName)}: ${invoice.quantity} x ${money(invoice.unitPrice)} netto</small>
    </div>
    <div class="row-actions">
      <button class="small-button" onclick="downloadInvoicePdf('${invoice.id}')">Drukuj / Zapisz PDF</button>
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
  elements.feeMember.innerHTML = state.members.map((member) => `<option value="${escapeHtml(member.id)}">${escapeHtml(member.name)}</option>`).join("");
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
  renderEventSelect(elements.moneyEvent);
  renderEventSelect(elements.docEvent);
}

function renderEventSelect(select) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Bez wydarzenia</option>' + state.events
    .map((event) => `<option value="${escapeHtml(event.id)}">${escapeHtml(event.name)} - ${formatDate(event.date)}</option>`)
    .join("");
  select.value = state.events.some((event) => event.id === current) ? current : "";
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
  const cancelled = !isActiveMoney(item);
  const statusLabel = cancelled ? ' <span class="badge neutral">Anulowany</span>' : "";
  return `
    <div>
      <strong>${escapeHtml(item.title)} · ${money(item.amount)}</strong>
      <small>${formatDate(item.date)} · ${escapeHtml(item.category || "Bez kategorii")} · <span class="badge ${item.type}">${typeLabel}</span>${statusLabel}${eventText}</small>
    </div>
    <div class="row-actions">
      ${canCorrect() ? `<button class="small-button" onclick="editMoney('${item.id}')">Edytuj</button>` : ""}
      ${canCorrect() && !cancelled ? `<button class="delete-button" onclick="removeItem('money', '${item.id}')">Usuń</button>` : ""}
    </div>
  `;
}

function editMoney(id) {
  if (!canCorrect()) return;
  const entry = state.money.find((item) => item.id === id);
  const form = document.querySelector("#moneyForm");
  if (!entry || !form) return;
  form.id.value = entry.id;
  form.type.value = entry.type || "income";
  form.title.value = entry.title || "";
  form.category.value = entry.category || "";
  renderEventOptions();
  form.eventId.value = entry.eventId || "";
  form.amount.value = Number(entry.amount || 0);
  form.date.value = entry.date || new Date().toISOString().slice(0, 10);
  elements.moneyFormTitle.textContent = "Edytuj operację";
  form.querySelector('button[type="submit"]').textContent = "Zapisz zmiany";
  elements.cancelMoneyEdit.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelMoneyEdit() {
  resetMoneyForm(document.querySelector("#moneyForm"));
}

function resetMoneyForm(form) {
  if (!form) return;
  form.reset();
  form.id.value = "";
  form.date.valueAsDate = new Date();
  elements.moneyFormTitle.textContent = "Dodaj wpływ lub wydatek";
  form.querySelector('button[type="submit"]').textContent = "Zapisz";
  elements.cancelMoneyEdit.classList.add("hidden");
  renderEventOptions();
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

function isActiveMoney(item) {
  return (item.status || "active") !== "cancelled";
}

async function addEventNote(id) {
  const event = state.events.find((entry) => entry.id === id);
  const input = document.querySelector(`#eventNote-${id}`);
  const note = input?.value.trim();
  if (!event || !note) return;
  const date = new Intl.DateTimeFormat("pl-PL").format(new Date());
  const updatedNotes = [event.notes, `${date}: ${note}`].filter(Boolean).join("\n");
  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient
      .from("events")
      .update({ notes: updatedNotes })
      .eq("id", id);
    if (error) {
      alert(`Nie udało się dopisać notatki do wydarzenia: ${error.message}`);
      return;
    }
    await refreshSupabaseData();
    return;
  }
  rememberUndo();
  event.notes = updatedNotes;
  saveState();
  renderEvents();
  renderDashboard();
}

async function resetMemberFees(name) {
  if (!canCorrect()) {
    alert("Reset wpłat jest dostępny tylko dla osób z uprawnieniami.");
    return;
  }
  const confirmed = confirm(`Wyzerować wpłaty składek dla: ${name} w roku ${FEE_YEAR}? Członek zostanie na liście, usunięte będą tylko jego wpłaty z tego roku.`);
  if (!confirmed) return;
  const member = state.members.find((entry) => entry.name === name);
  if (supabaseClient && currentRole && member) {
    const { error } = await supabaseClient
      .from("fees")
      .delete()
      .eq("member_id", member.id)
      .eq("year", FEE_YEAR);
    if (error) {
      alert(`Nie udało się wyzerować składek w Supabase: ${error.message}`);
      return;
    }
    await refreshSupabaseData();
    return;
  }
  rememberUndo();
  state.fees = state.fees.filter((fee) => !(fee.member === name && feeYear(fee.year || fee.period) === FEE_YEAR));
  saveState();
  render();
}

function deleteAction(collection, id) {
  if (!canCorrect()) return "";
  return `<div class="row-actions"><button class="delete-button" onclick="removeItem('${collection}', '${id}')">Usuń</button></div>`;
}

async function updateInventory(id, field, value) {
  if (!canCorrect()) return;
  const item = state.rentalInventory.find((entry) => entry.id === id);
  if (!item) return;
  const normalizedValue = field === "quantity" ? Math.max(0, Math.round(Number(value) || 0)) : Math.max(0, Number(value) || 0);
  if (supabaseClient && currentRole) {
    const column = field === "quantity" ? "quantity" : "price_per_day";
    const { error } = await supabaseClient
      .from("rental_inventory")
      .update({ [column]: normalizedValue })
      .eq("id", id);
    if (error) {
      alert(`Nie udało się zmienić magazynu w Supabase: ${error.message}`);
      return;
    }
    await refreshSupabaseData();
    return;
  }
  rememberUndo();
  item[field] = normalizedValue;
  saveState();
  renderRentals();
}

async function handleInventoryAdd(event) {
  event.preventDefault();
  if (!canCorrect()) return;

  const data = formData(event.target);
  const name = String(data.name || "").trim();
  const quantity = Math.max(0, Math.round(Number(data.quantity) || 0));
  const price = Math.max(0, Number(data.price) || 0);

  if (!name) {
    alert("Wpisz nazwę przedmiotu.");
    return;
  }

  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient.from("rental_inventory").insert({
      name,
      quantity,
      price_per_day: price
    });
    if (error) {
      alert(`Nie udało się dodać przedmiotu do magazynu w Supabase: ${error.message}`);
      return;
    }
    event.target.reset();
    await refreshSupabaseData();
    return;
  }

  rememberUndo();
  state.rentalInventory.push({
    id: makeId(),
    name,
    quantity,
    price
  });
  event.target.reset();
  saveState();
  renderRentals();
}

async function returnRental(id) {
  const loan = state.rentalLoans.find((entry) => entry.id === id);
  if (!loan) return;
  const confirmed = confirm("Oznaczyc to wypozyczenie jako zwrocone?");
  if (!confirmed) return;
  const notes = document.querySelector(`#returnNotes-${id}`)?.value || "";
  const damageCost = Number(document.querySelector(`#returnDamage-${id}`)?.value || 0);
  const returnItems = loan.items.map((item, index) => ({
    lineId: item.lineId,
    id: item.id,
    name: item.name,
    issued: item.quantity,
    returned: Number(document.querySelector(`#returnQty-${id}-${index}`)?.value || 0),
    damaged: Number(document.querySelector(`#returnDamaged-${id}-${index}`)?.value || 0),
    missing: Number(document.querySelector(`#returnMissing-${id}-${index}`)?.value || 0)
  }));
  if (supabaseClient && currentRole) {
    const { error: rentalError } = await supabaseClient
      .from("rentals")
      .update({
        status: "Zwrócone",
        returned_at: new Date().toISOString().slice(0, 10),
        return_notes: notes || null,
        damage_cost: damageCost
      })
      .eq("id", id);
    if (rentalError) {
      alert(`Nie udało się zapisać zwrotu w Supabase: ${rentalError.message}`);
      return;
    }

    for (const item of returnItems) {
      if (!item.lineId) continue;
      const { error: lineError } = await supabaseClient
        .from("rental_lines")
        .update({
          returned: item.returned,
          damaged: item.damaged,
          missing: item.missing
        })
        .eq("id", item.lineId);
      if (lineError) {
        alert(`Zwrot zapisany częściowo, ale jedna pozycja ma błąd: ${lineError.message}`);
        return;
      }
    }

    await refreshSupabaseData();
    return;
  }
  rememberUndo();
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
  document.title = `Faktura nr ${invoice.number}`;
  elements.printSheet.innerHTML = invoicePrintHtml(invoice);
  window.print();
}

function downloadInvoicePdf(id) {
  printInvoice(id);
}

async function openDocumentAttachment(id) {
  const doc = state.docs.find((entry) => entry.id === id);
  if (!docHasFile(doc)) return;
  let url = doc.attachment?.dataUrl || "";
  if (!url && supabaseClient && doc.filePath) {
    const { data, error } = await supabaseClient.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(doc.filePath, 60);
    if (error) {
      alert(`Nie udało się otworzyć PDF: ${error.message}`);
      return;
    }
    url = data.signedUrl;
  }
  const win = window.open();
  if (!win) {
    alert("Przeglądarka zablokowała otwarcie PDF. Zezwól na wyskakujące okna dla tej strony.");
    return;
  }
  win.document.write(`<iframe src="${url}" title="${escapeHtml(docFileName(doc))}" style="border:0;width:100%;height:100vh"></iframe>`);
}

async function removeItem(collection, id) {
  if (!canCorrect()) {
    alert("Usuwanie wpisów jest dostępne tylko dla osób z uprawnieniami.");
    return;
  }
  if (collection === "members") {
    const member = state.members.find((entry) => entry.id === id);
    const confirmed = confirm(`Archiwizować członka: ${member?.name || "wybrany członek"}? Rekord zostanie w bazie, a historia składek nie zostanie usunięta.`);
    if (!confirmed) return;
    if (supabaseClient && currentRole) {
      const { error } = await supabaseClient
        .from("members")
        .update({ status: "Nieaktywny" })
        .eq("id", id);
      if (error) {
        alert(`Nie udało się zarchiwizować członka w Supabase: ${error.message}`);
        return;
      }
      await refreshSupabaseData();
      return;
    }
    if (member) {
      rememberUndo();
      member.status = "Nieaktywny";
      saveState();
      render();
    }
    return;
  }
  if (["docs", "invoices"].includes(collection) && !isAdmin()) {
    alert("Dokumenty PDF i faktury może usuwać tylko Administrator.");
    return;
  }
  if (collection === "money") {
    const confirmed = confirm("Anulować ten wpis w Finansach? Wpis zostanie w historii, ale nie będzie liczony do salda.");
    if (!confirmed) return;
    if (supabaseClient && currentRole) {
      const { error } = await supabaseClient
        .from("transactions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_reason: null
        })
        .eq("id", id);
      if (error) {
        alert(`Nie udało się anulować operacji kasowej w Supabase: ${error.message}`);
        return;
      }
      await refreshSupabaseData();
      return;
    }
    const entry = state.money.find((item) => item.id === id);
    if (entry) {
      rememberUndo();
      entry.status = "cancelled";
      entry.cancelledAt = new Date().toISOString();
      entry.cancelledReason = "";
      saveState();
      render();
    }
    return;
  }
  const confirmed = confirm("Czy na pewno usunąć ten wpis? Tej operacji nie da się cofnąć.");
  if (!confirmed) return;
  if (supabaseClient && currentRole && collection === "fees") {
    const { error } = await supabaseClient.from("fees").delete().eq("id", id);
    if (error) {
      alert(`Nie udało się usunąć wpisu w Supabase: ${error.message}`);
      return;
    }
    await refreshSupabaseData();
    return;
  }
  if (supabaseClient && currentRole && collection === "rentalLoans") {
    const { error } = await supabaseClient.from("rentals").delete().eq("id", id);
    if (error) {
      alert(`Nie udało się usunąć wypożyczenia w Supabase: ${error.message}`);
      return;
    }
    await refreshSupabaseData();
    return;
  }
  if (supabaseClient && currentRole && collection === "rentalInventory") {
    const { error } = await supabaseClient.from("rental_inventory").delete().eq("id", id);
    if (error) {
      alert(`Nie udało się usunąć przedmiotu z magazynu w Supabase: ${error.message}`);
      return;
    }
    await refreshSupabaseData();
    return;
  }
  if (supabaseClient && currentRole && collection === "events") {
    const { error } = await supabaseClient.from("events").delete().eq("id", id);
    if (error) {
      alert(`Nie udało się usunąć wydarzenia w Supabase: ${error.message}`);
      return;
    }
    await refreshSupabaseData();
    return;
  }
  if (supabaseClient && currentRole && collection === "docs") {
    const doc = state.docs.find((entry) => entry.id === id);
    if (doc?.filePath) {
      await supabaseClient.storage.from(DOCUMENT_BUCKET).remove([doc.filePath]);
    }
    const { error } = await supabaseClient.from("documents").delete().eq("id", id);
    if (error) {
      alert(`Nie udało się usunąć dokumentu w Supabase: ${error.message}`);
      return;
    }
    await refreshSupabaseData();
    return;
  }
  if (supabaseClient && currentRole && collection === "invoices") {
    const { error } = await supabaseClient.from("invoices").delete().eq("id", id);
    if (error) {
      alert(`Nie udało się usunąć faktury w Supabase: ${error.message}`);
      return;
    }
    await refreshSupabaseData();
    return;
  }
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

function safeFileName(name) {
  return String(name || "dokument.pdf")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "dokument.pdf";
}

function docMoneyEntries(data, documentId) {
  const entries = [];
  const income = Number(data.incomeAmount || 0);
  const expense = Number(data.expenseAmount || 0);
  if (income > 0) {
    entries.push({
      type: "income",
      title: data.title,
      category: data.category || "Dokument",
      amount: income,
      transaction_date: data.date,
      event_id: data.eventId || null,
      document_id: documentId
    });
  }
  if (expense > 0) {
    entries.push({
      type: "expense",
      title: data.title,
      category: data.category || "Dokument",
      amount: expense,
      transaction_date: data.date,
      event_id: data.eventId || null,
      document_id: documentId
    });
  }
  return entries;
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

function docFileName(doc) {
  return doc?.fileName || doc?.attachment?.name || "";
}

function docFileSize(doc) {
  return Number(doc?.fileSize || doc?.attachment?.size || 0);
}

function docHasFile(doc) {
  return Boolean(doc?.filePath || doc?.attachment?.dataUrl);
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
  const activeItems = items.filter(isActiveMoney);
  const income = activeItems.filter((item) => item.type === "income" || item.type === "donation").reduce((sum, item) => sum + item.amount, 0);
  const expenses = activeItems.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const rowsHtml = items.map((item) => {
    const statusText = isActiveMoney(item) ? "" : " (Anulowany)";
    return `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${moneyTypeLabel(item.type)}${statusText}</td>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.category || "Bez kategorii")}</td>
      <td>${escapeHtml(item.eventName || "Bez wydarzenia")}</td>
      <td>${money(item.amount)}</td>
    </tr>
  `;
  }).join("");

  const eventGroups = state.events.map((event) => {
    const eventItems = activeItems.filter((item) => item.eventId === event.id || item.eventName === event.name);
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
    <h2>Zestawienie Finansów</h2>
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
  const invoiceItems = invoiceLineItems(invoice);
  const rowsHtml = invoiceItems.map((item, index) => {
    const vatLabel = invoice.vatRate === "zw" ? "ZW" : `${invoice.vatRate}%`;
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.name)}<br><small>${escapeHtml(invoice.source)}</small></td>
        <td>${item.quantity}</td>
        <td>${money(item.unitPrice)}</td>
        <td>${money(item.net)}</td>
        <td>${vatLabel} / ${money(item.vat)}</td>
        <td>${money(item.gross)}</td>
      </tr>
    `;
  }).join("");
  return `
    <img class="print-logo" src="${escapeHtml(ORGANIZATION.logo)}" alt="Logo KGiGW">
    <h1>Faktura nr ${escapeHtml(invoice.number)}</h1>
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
      <tbody>${rowsHtml}</tbody>
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

function invoiceLineItems(invoice) {
  const rental = state.rentalLoans.find((loan) => loan.id === invoice.rentalId);
  const vatRate = invoice.vatRate === "zw" ? 0 : Number(invoice.vatRate);
  if (rental?.items?.length) {
    return rental.items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.price || 0) * Number(rental.days || 1);
      const net = quantity * unitPrice;
      const vat = invoice.vatRate === "zw" ? 0 : net * vatRate / 100;
      return {
        name: item.name,
        quantity,
        unitPrice,
        net,
        vat,
        gross: net + vat
      };
    });
  }
  return [{
    name: invoice.itemName,
    quantity: Number(invoice.quantity || 1),
    unitPrice: Number(invoice.unitPrice || 0),
    net: Number(invoice.net || 0),
    vat: Number(invoice.vat || 0),
    gross: Number(invoice.gross || 0)
  }];
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
