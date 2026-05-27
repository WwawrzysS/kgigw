const STORAGE_KEY = "kgw-panel-data-v2-clean";
const AUTH_KEY = "kgigw-active-role";
const APP_VERSION = "2026.05.27-05";
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
  fundingSources: [],
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
  board: [],
  auditLogs: []
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
let showFeeContactPanel = false;
let unpaidInvoiceDashboardIndex = 0;
let unpaidInvoiceDashboardTimer = null;
let lateFeeDashboardIndex = 0;
let lateFeeDashboardTimer = null;
let activeRentalDashboardIndex = 0;
let activeRentalDashboardTimer = null;
let selectedFundingSourceId = "";

const titles = {
  dashboard: "Pulpit",
  members: "Członkowie",
  fees: "Składki",
  money: "Finanse",
  funding: "Źródła finansowania",
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
  sidebar: document.querySelector(".sidebar"),
  currentRole: document.querySelector("#currentRole"),
  mobileMenuButton: document.querySelector("#mobileMenuButton"),
  toastContainer: document.querySelector("#toastContainer"),
  viewTitle: document.querySelector("#viewTitle"),
  navItems: document.querySelectorAll(".nav-item"),
  navSubitems: document.querySelectorAll(".nav-subitem"),
  navSubmenus: document.querySelectorAll(".nav-submenu"),
  views: document.querySelectorAll(".view"),
  globalSearch: document.querySelector("#globalSearch"),
  cashBalance: document.querySelector("#cashBalance"),
  unpaidInvoicesSummary: document.querySelector("#unpaidInvoicesSummary"),
  unpaidInvoicesList: document.querySelector("#unpaidInvoicesList"),
  lateFees: document.querySelector("#lateFees"),
  rentalCount: document.querySelector("#rentalCount"),
  recentMoney: document.querySelector("#recentMoney"),
  upcomingEvents: document.querySelector("#upcomingEvents"),
  membersList: document.querySelector("#membersList"),
  memberDetails: document.querySelector("#memberDetails"),
  showInactiveMembers: document.querySelector("#showInactiveMembers"),
  toggleMemberExport: document.querySelector("#toggleMemberExport"),
  memberExportPanel: document.querySelector("#memberExportPanel"),
  downloadMembersCsv: document.querySelector("#downloadMembersCsv"),
  memberFormTitle: document.querySelector("#memberFormTitle"),
  cancelMemberEdit: document.querySelector("#cancelMemberEdit"),
  feesList: document.querySelector("#feesList"),
  sendFeeSms: document.querySelector("#sendFeeSms"),
  moneyEvent: document.querySelector("#moneyEvent"),
  moneyFundingSource: document.querySelector("#moneyFundingSource"),
  moneyFormTitle: document.querySelector("#moneyFormTitle"),
  cancelMoneyEdit: document.querySelector("#cancelMoneyEdit"),
  fundingFormTitle: document.querySelector("#fundingFormTitle"),
  cancelFundingEdit: document.querySelector("#cancelFundingEdit"),
  fundingSourcesList: document.querySelector("#fundingSourcesList"),
  fundingDetailsPanel: document.querySelector("#fundingDetailsPanel"),
  fundingDetails: document.querySelector("#fundingDetails"),
  docEvent: document.querySelector("#docEvent"),
  docFundingSource: document.querySelector("#docFundingSource"),
  docFormTitle: document.querySelector("#docFormTitle"),
  cancelDocEdit: document.querySelector("#cancelDocEdit"),
  moneySummary: document.querySelector("#moneySummary"),
  overdueInvoiceNotice: document.querySelector("#overdueInvoiceNotice"),
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
  mailboxInfo: document.querySelector("#mailboxInfo"),
  adminTabs: document.querySelectorAll("[data-admin-tab]"),
  adminPanels: document.querySelectorAll("[data-admin-panel]"),
  auditLogList: document.querySelector("#auditLogList")
};

document.body.classList.toggle("locked", !currentRole);
document.querySelectorAll("#exportData, .import-button").forEach((item) => item.classList.add("admin-only"));
elements.currentRole.textContent = currentUserName ? `${currentUserName} (${roleName(currentRole)})` : roleName(currentRole);
if (elements.appVersion) elements.appVersion.textContent = APP_VERSION;
elements.loginForm.addEventListener("submit", handleLogin);
document.querySelector("#logoutButton").addEventListener("click", logout);
document.querySelector("#mobileMenuButton").addEventListener("click", toggleMobileMenu);
document.querySelector("#memberForm").addEventListener("submit", handleMember);
document.querySelector("#cancelMemberEdit").addEventListener("click", cancelMemberEdit);
document.querySelector("#showInactiveMembers").addEventListener("change", renderMembers);
document.querySelector("#toggleMemberExport").addEventListener("click", toggleMemberExportPanel);
document.querySelector("#downloadMembersCsv").addEventListener("click", exportMembersCsv);
document.querySelector("#feeForm").addEventListener("submit", handleFee);
document.querySelector("#sendFeeSms").addEventListener("click", sendFeeSmsReminders);
document.querySelector("#moneyForm").addEventListener("submit", handleMoney);
document.querySelector("#cancelMoneyEdit").addEventListener("click", cancelMoneyEdit);
document.querySelector("#fundingForm").addEventListener("submit", handleFundingSource);
document.querySelector("#cancelFundingEdit").addEventListener("click", cancelFundingEdit);
document.querySelector("#printMoneyReport").addEventListener("click", printMoneyReport);
document.querySelector("#eventForm").addEventListener("submit", handleEvent);
document.querySelector("#inventoryAddForm").addEventListener("submit", handleInventoryAdd);
document.querySelector("#rentalForm").addEventListener("submit", handleRental);
document.querySelector("#rentalForm").addEventListener("input", updateRentalSummary);
document.querySelector("#docForm").addEventListener("submit", handleDoc);
document.querySelector("#cancelDocEdit").addEventListener("click", cancelDocEdit);
document.querySelector("#invoiceForm").addEventListener("submit", handleInvoice);
document.querySelector("#invoiceRental").addEventListener("change", fillInvoiceFromRental);
document.querySelectorAll("[data-admin-export]").forEach((button) => {
  button.addEventListener("click", () => exportAdminData(button.dataset.adminExport));
});
document.querySelector("#refreshProgram")?.addEventListener("click", refreshProgram);
document.querySelector("#sidebarRefreshProgram").addEventListener("click", refreshProgram);
document.querySelector("#showMailboxInfo").addEventListener("click", () => {
  elements.mailboxInfo.classList.toggle("hidden");
});
document.querySelector("#openMailboxWindow").addEventListener("click", openMailboxConfig);
document.addEventListener("click", closeMobileMenuFromPage);

elements.navItems.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.subnav) {
      toggleSubnav(button.dataset.subnav);
      return;
    }
    switchView(button.dataset.view);
    closeMobileMenu();
  });
});

elements.navSubitems.forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view);
    if (button.dataset.rentalTab) switchRentalTab(button.dataset.rentalTab);
    if (button.dataset.docTab) switchDocTab(button.dataset.docTab);
    closeMobileMenu();
  });
});

elements.rentalSubtabs.forEach((button) => {
  button.addEventListener("click", () => switchRentalTab(button.dataset.rentalTab));
});

elements.adminTabs.forEach((button) => {
  button.addEventListener("click", () => switchAdminTab(button.dataset.adminTab));
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
document.querySelector('#invoiceForm input[name="paymentDueDate"]').value = dateOffset(new Date().toISOString().slice(0, 10), 7);
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
  closeMobileMenu();
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
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError || !sessionData?.session) {
    console.error("Brak aktywnej sesji Supabase Auth. Dane chronione RLS nie zostaną pobrane.", {
      error: sessionError,
      hasCurrentRole: Boolean(currentRole)
    });
    return;
  }

  let [membersResult, feesResult, inventoryResult, rentalsResult, eventsResult, fundingSourcesResult, moneyResult, docsResult, invoicesResult] = await Promise.all([
    loadSupabaseResult("members", supabaseClient
      .from("members")
      .select("id, name, phone, email, status, board_role, created_at")
      .order("name", { ascending: true })),
    loadSupabaseResult("fees", supabaseClient
      .from("fees")
      .select("id, member_id, year, amount, note, paid_at, created_at")
      .order("paid_at", { ascending: false })),
    loadSupabaseResult("rental_inventory", supabaseClient
      .from("rental_inventory")
      .select("id, name, quantity, price_per_day")
      .order("name", { ascending: true })),
    loadSupabaseResult("rentals", supabaseClient
      .from("rentals")
      .select("id, first_name, last_name, phone, date_from, date_to, days, total, status, notes, returned_at, return_notes, damage_cost, payment_status, payment_method, paid_at, payment_transaction_id, created_at, rental_lines(id, inventory_id, item_name, quantity, price_per_day, returned, damaged, missing)")
      .order("date_from", { ascending: false })),
    loadSupabaseResult("events", supabaseClient
      .from("events")
      .select("id, name, event_date, place, notes")
      .order("event_date", { ascending: true })),
    loadSupabaseResult("funding_sources", supabaseClient
      .from("funding_sources")
      .select("id, name, type, description, planned_amount, date_from, date_to, status, created_at, updated_at")
      .order("created_at", { ascending: false })),
    loadSupabaseResult("transactions", supabaseClient
      .from("transactions")
      .select("id, type, title, category, amount, transaction_date, event_id, funding_source_id, status, cancelled_at, cancelled_reason, source_type, source_id")
      .order("transaction_date", { ascending: false })),
    loadSupabaseResult("documents", supabaseClient
      .from("documents")
      .select("id, title, sender, category, document_date, notes, file_path, file_name, file_size, mime_type, event_id, funding_source_id, transaction_id")
      .order("document_date", { ascending: false })),
    loadSupabaseResult("invoices", supabaseClient
      .from("invoices")
      .select("id, number, invoice_date, buyer_name, buyer_address, buyer_nip, source, item_name, quantity, unit_price, vat_rate, net, vat, gross, rental_id, notes, payment_status, payment_method, paid_at, payment_transaction_id, payment_due_date, bank_account")
      .order("invoice_date", { ascending: false }))
  ]);

  if (rentalsResult.error) {
    console.error("Nie udało się pobrać wypożyczeń z nowymi polami płatności. Próba pobrania podstawowego widoku.", rentalsResult.error);
    const fallbackRentals = await loadSupabaseResult("rentals fallback", supabaseClient
      .from("rentals")
      .select("id, first_name, last_name, phone, date_from, date_to, days, total, status, notes, returned_at, return_notes, damage_cost, created_at, rental_lines(id, inventory_id, item_name, quantity, price_per_day, returned, damaged, missing)")
      .order("date_from", { ascending: false }));
    if (!fallbackRentals.error) rentalsResult = fallbackRentals;
  }

  if (moneyResult.error) {
    console.error("Nie udało się pobrać Finansów z polami źródła. Próba pobrania podstawowego widoku.", moneyResult.error);
    const fallbackMoney = await loadSupabaseResult("transactions fallback", supabaseClient
      .from("transactions")
      .select("id, type, title, category, amount, transaction_date, event_id, status, cancelled_at, cancelled_reason")
      .order("transaction_date", { ascending: false }));
    if (!fallbackMoney.error) moneyResult = fallbackMoney;
  }

  if (invoicesResult.error) {
    console.error("Nie udało się pobrać faktur z polami płatności. Próba pobrania podstawowego widoku.", invoicesResult.error);
    const fallbackInvoices = await loadSupabaseResult("invoices fallback", supabaseClient
      .from("invoices")
      .select("id, number, invoice_date, buyer_name, buyer_address, buyer_nip, source, item_name, quantity, unit_price, vat_rate, net, vat, gross, rental_id, notes")
      .order("invoice_date", { ascending: false }));
    if (!fallbackInvoices.error) invoicesResult = fallbackInvoices;
  }

  logSupabaseLoadError("członków", membersResult.error);
  logSupabaseLoadError("składek", feesResult.error);
  logSupabaseLoadError("magazynu", inventoryResult.error);
  logSupabaseLoadError("wypożyczeń", rentalsResult.error);
  logSupabaseLoadError("wydarzeń", eventsResult.error);
  logSupabaseLoadError("źródeł finansowania", fundingSourcesResult.error);
  if (fundingSourcesResult.error) {
    console.error("Nie udało się pobrać funding_sources. Lista źródeł w Finansach pokaże tylko opcję Bez źródła.", fundingSourcesResult.error);
  }
  logSupabaseLoadError("Finansów", moneyResult.error);
  logSupabaseLoadError("dokumentów", docsResult.error);
  logSupabaseLoadError("faktur", invoicesResult.error);
  if (!membersResult.error) state.members = (membersResult.data || []).map((member) => ({
    id: member.id,
    name: member.name,
    phone: member.phone || "",
    email: member.email || "",
    status: member.status || "Aktywny",
    boardRole: member.board_role || "Brak"
  }));

  if (!feesResult.error) state.fees = (feesResult.data || []).map((fee) => {
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

  if (!inventoryResult.error) state.rentalInventory = (inventoryResult.data || []).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: Number(item.quantity || 0),
    price: Number(item.price_per_day || 0)
  }));

  if (!rentalsResult.error) state.rentalLoans = (rentalsResult.data || []).map((rental) => {
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
      createdAt: rental.created_at || "",
      paymentStatus: rental.payment_status || "unpaid",
      paymentMethod: rental.payment_method || "",
      paidAt: rental.paid_at || "",
      paymentTransactionId: rental.payment_transaction_id || "",
      items,
      returnItems
    };
  });

  if (!eventsResult.error) state.events = (eventsResult.data || []).map((event) => ({
    id: event.id,
    name: event.name,
    date: event.event_date || "",
    place: event.place || "",
    notes: event.notes || ""
  }));

  if (!fundingSourcesResult.error) state.fundingSources = (fundingSourcesResult.data || []).map((source) => ({
    id: source.id,
    name: source.name,
    type: source.type,
    description: source.description || "",
    plannedAmount: Number(source.planned_amount || 0),
    dateFrom: source.date_from || "",
    dateTo: source.date_to || "",
    status: source.status || "aktywne"
  }));

  if (!moneyResult.error) state.money = (moneyResult.data || []).map((entry) => {
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
      fundingSourceId: entry.funding_source_id || "",
      fundingSourceName: fundingSourceName(entry.funding_source_id),
      status: entry.status || "active",
      cancelledAt: entry.cancelled_at || "",
      cancelledReason: entry.cancelled_reason || "",
      sourceType: entry.source_type || "",
      sourceId: entry.source_id || ""
    };
  });

  if (!docsResult.error) state.docs = (docsResult.data || []).map((doc) => ({
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
    eventId: doc.event_id || "",
    fundingSourceId: doc.funding_source_id || "",
    fundingSourceName: fundingSourceName(doc.funding_source_id),
    transactionId: doc.transaction_id || ""
  }));

  if (!invoicesResult.error) state.invoices = (invoicesResult.data || []).map((invoice) => {
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
      notes: invoice.notes || "",
      paymentStatus: invoice.payment_status || "unpaid",
      paymentMethod: invoice.payment_method || "",
      paidAt: invoice.paid_at || "",
      paymentTransactionId: invoice.payment_transaction_id || "",
      paymentDueDate: invoice.payment_due_date || "",
      bankAccount: invoice.bank_account || ""
    };
  });

  supabaseDataReady = true;
  saveState();
  render();
  void refreshAuditLogs();
}

function logSupabaseLoadError(moduleName, error) {
  if (!error) return;
  console.error(`Nie udało się pobrać danych modułu ${moduleName} z Supabase. Pozostałe moduły będą ładowane dalej.`, {
    moduleName,
    error
  });
}

async function loadSupabaseResult(label, query) {
  try {
    const result = await query;
    if (result.error) {
      console.error(`Supabase zwrócił błąd dla zapytania: ${label}.`, {
        label,
        error: result.error
      });
    }
    return result;
  } catch (error) {
    console.error(`Zapytanie Supabase przerwane wyjątkiem: ${label}.`, {
      label,
      error
    });
    return { data: null, error };
  }
}

async function refreshAuditLogs() {
  if (!supabaseClient || !currentRole || !isAdmin()) return;
  const { data: auditRows, error: auditError } = await loadSupabaseResult("audit_log", supabaseClient
    .from("audit_log")
    .select("id, created_at, action, table_name, details")
    .order("created_at", { ascending: false })
    .limit(100));
  if (auditError) return;
  state.auditLogs = (auditRows || []).map((entry) => ({
    id: entry.id,
    date: entry.created_at,
    user: entry.details?.user || "Nieznany użytkownik",
    module: entry.table_name || entry.details?.module || "",
    action: entry.action || "",
    details: entry.details?.summary || ""
  }));
  renderAuditLogs();
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

async function refreshProgram() {
  const confirmed = confirm("Odświeżyć program i wyczyścić lokalną pamięć tej przeglądarki? Dane w Supabase zostaną bez zmian.");
  if (!confirmed) return;
  await logActivity("Program", "Odświeżenie programu", { summary: "Odświeżenie programu" });
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(VERSION_KEY, APP_VERSION);
  window.location.reload();
}

function toggleMobileMenu() {
  const open = document.body.classList.toggle("mobile-menu-open");
  elements.mobileMenuButton.setAttribute("aria-label", open ? "Zamknij menu" : "Otwórz menu");
}

function closeMobileMenu() {
  document.body.classList.remove("mobile-menu-open");
  elements.mobileMenuButton.setAttribute("aria-label", "Otwórz menu");
}

function closeMobileMenuFromPage(event) {
  if (!document.body.classList.contains("mobile-menu-open")) return;
  if (elements.sidebar.contains(event.target) || elements.mobileMenuButton.contains(event.target)) return;
  closeMobileMenu();
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

function switchAdminTab(tabName) {
  elements.adminTabs.forEach((item) => item.classList.toggle("active", item.dataset.adminTab === tabName));
  elements.adminPanels.forEach((panel) => {
    const active = panel.dataset.adminPanel === tabName;
    panel.classList.toggle("active-admin-panel", active);
    panel.hidden = !active;
    panel.style.display = active ? "" : "none";
  });
  if (tabName === "logs") renderAuditLogs();
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
  const memberMessage = memberId ? "Zapisano zmiany członka" : "Zapisano członka";
  if (supabaseClient && currentRole) {
    const payload = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      status: data.status || "Aktywny",
      board_role: data.boardRole || "Brak"
    };
    const { error } = memberId
      ? await supabaseClient.from("members").update(payload).eq("id", memberId)
      : await supabaseClient.from("members").insert(payload);
    if (error) {
      alert(`Nie udało się zapisać członka w Supabase: ${error.message}`);
      return;
    }
    resetMemberForm(event.target);
    await logActivity("Członkowie", memberId ? "Edycja członka" : "Dodanie członka", { summary: data.name });
    await refreshSupabaseData();
    showToast(memberMessage);
    return;
  }
  if (memberId) {
    const member = state.members.find((entry) => entry.id === memberId);
    if (member) Object.assign(member, data, { id: memberId });
    resetMemberForm(event.target);
    saveState();
    render();
    logActivity("Członkowie", "Edycja członka", { summary: data.name });
    showToast(memberMessage);
    return;
  }
  delete data.id;
  state.members.push({ id: makeId(), ...data });
  finishForm(event.target);
  logActivity("Członkowie", "Dodanie członka", { summary: data.name });
  showToast(memberMessage);
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
      alert(`Składka została zapisana, ale nie udało się dopisać wpływu do Finansów: ${moneyError.message}`);
      return;
    }
    event.target.reset();
    event.target.period.value = FEE_YEAR;
    event.target.dueAmount.value = ANNUAL_FEE;
    await logActivity("Składki", "Dodanie składki", { summary: `${member.name} - ${money(paidAmount)} - ${year}` });
    await refreshSupabaseData();
    showToast("Składka zapisana i dodana do Finansów jako wpływ.");
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
  logActivity("Składki", "Dodanie składki", { summary: `${member.name} - ${money(paidAmount)} - ${year}` });
  showToast("Składka zapisana i dodana do Finansów jako wpływ.");
}

async function handleMoney(event) {
  event.preventDefault();
  const data = formData(event.target);
  const moneyId = data.id || "";
  const moneyMessage = moneyId ? "Zapisano zmiany w Finansach" : "Dodano wpis w Finansach";
  const existingMoney = moneyId ? state.money.find((item) => item.id === moneyId) : null;
  const oldFundingName = fundingSourceName(existingMoney?.fundingSourceId);
  const newFundingName = fundingSourceName(data.fundingSourceId);
  const fundingChanged = moneyId && (existingMoney?.fundingSourceId || "") !== (data.fundingSourceId || "");
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
      event_id: data.eventId || null,
      funding_source_id: data.fundingSourceId || null
    };
    const { error } = moneyId
      ? await supabaseClient.from("transactions").update(payload).eq("id", moneyId)
      : await supabaseClient.from("transactions").insert(payload);
    if (error) {
      alert(`Nie udało się zapisać operacji w Finansach: ${error.message}`);
      return;
    }
    resetMoneyForm(event.target);
    if (fundingChanged) {
      await logActivity("Finanse", "Zmiana źródła finansowania", { summary: `${data.title} - z ${oldFundingName} na ${newFundingName}` });
    } else {
      await logActivity("Finanse", moneyId ? "Edycja wpisu" : moneyLogAction(data.type), { summary: moneyLogSummary(data), type: data.type });
    }
    await refreshSupabaseData();
    showToast(moneyMessage);
    return;
  }
  if (moneyId) {
    const entry = state.money.find((item) => item.id === moneyId);
    if (entry) {
      Object.assign(entry, data, {
        id: moneyId,
        eventName: linkedEvent?.name || "",
        amount: Number(data.amount),
        fundingSourceId: data.fundingSourceId || "",
        fundingSourceName: newFundingName
      });
    }
    resetMoneyForm(event.target);
    saveState();
    render();
    if (fundingChanged) {
      logActivity("Finanse", "Zmiana źródła finansowania", { summary: `${data.title} - z ${oldFundingName} na ${newFundingName}` });
    } else {
      logActivity("Finanse", "Edycja wpisu", { summary: moneyLogSummary(data), type: data.type });
    }
    showToast(moneyMessage);
    return;
  }
  delete data.id;
  state.money.push({
      id: makeId(),
      ...data,
      eventName: linkedEvent?.name || "",
      amount: Number(data.amount),
      fundingSourceId: data.fundingSourceId || "",
      fundingSourceName: newFundingName,
      status: "active"
    });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
  logActivity("Finanse", moneyLogAction(data.type), { summary: moneyLogSummary(data), type: data.type });
  showToast(moneyMessage);
}

async function handleFundingSource(event) {
  event.preventDefault();
  if (!canCorrect()) {
    alert("Dodawanie i edycja źródeł finansowania jest dostępna tylko dla osób z uprawnieniami.");
    return;
  }
  const data = formData(event.target);
  const sourceId = data.id || "";
  const payload = {
    name: data.name,
    type: data.type,
    description: data.description || null,
    planned_amount: Number(data.plannedAmount || 0),
    date_from: data.dateFrom || null,
    date_to: data.dateTo || null,
    status: data.status || "aktywne"
  };
  if (supabaseClient && currentRole) {
    const { error } = sourceId
      ? await supabaseClient.from("funding_sources").update(payload).eq("id", sourceId)
      : await supabaseClient.from("funding_sources").insert(payload);
    if (error) {
      alert(`Nie udało się zapisać źródła finansowania w Supabase: ${error.message}`);
      return;
    }
    resetFundingForm(event.target);
    await logActivity("Źródła finansowania", sourceId ? "Edycja źródła finansowania" : "Dodanie źródła finansowania", { summary: data.name });
    await refreshSupabaseData();
    showToast(sourceId ? "Zapisano źródło finansowania" : "Dodano źródło finansowania");
    return;
  }
  if (sourceId) {
    const source = state.fundingSources.find((entry) => entry.id === sourceId);
    if (source) Object.assign(source, {
      id: sourceId,
      name: data.name,
      type: data.type,
      description: data.description || "",
      plannedAmount: Number(data.plannedAmount || 0),
      dateFrom: data.dateFrom || "",
      dateTo: data.dateTo || "",
      status: data.status || "aktywne"
    });
    resetFundingForm(event.target);
    saveState();
    render();
    logActivity("Źródła finansowania", "Edycja źródła finansowania", { summary: data.name });
    showToast("Zapisano źródło finansowania");
    return;
  }
  state.fundingSources.push({
    id: makeId(),
    name: data.name,
    type: data.type,
    description: data.description || "",
    plannedAmount: Number(data.plannedAmount || 0),
    dateFrom: data.dateFrom || "",
    dateTo: data.dateTo || "",
    status: data.status || "aktywne"
  });
  finishForm(event.target);
  logActivity("Źródła finansowania", "Dodanie źródła finansowania", { summary: data.name });
  showToast("Dodano źródło finansowania");
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
    await logActivity("Wydarzenia", "Dodanie wydarzenia", { summary: data.name });
    await refreshSupabaseData();
    return;
  }
  state.events.push({ id: makeId(), ...data });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
  renderEventOptions();
  logActivity("Wydarzenia", "Dodanie wydarzenia", { summary: data.name });
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
  const paymentStatus = data.paymentStatus || "unpaid";
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
        notes: data.notes || null,
        payment_status: paymentStatus,
        payment_method: rentalPaymentMethod(paymentStatus),
        paid_at: isRentalPaid(paymentStatus) ? new Date().toISOString().slice(0, 10) : null
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

    const paymentResult = await addRentalPaymentToSupabase({
      id: rental.id,
      firstName: data.firstName,
      lastName: data.lastName,
      items,
      total
    }, paymentStatus);
    if (!paymentResult.ok) return;

    form.reset();
    form.dateFrom.valueAsDate = new Date();
    form.dateTo.valueAsDate = new Date();
    await logActivity("Wypożyczalnia", "Wypożyczenie przedmiotów", { summary: `${data.firstName} ${data.lastName} - ${money(total)}` });
    await refreshSupabaseData();
    showToast("Wypożyczenie zapisane");
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
    status: "Wypożyczone",
    createdAt: new Date().toISOString(),
    paymentStatus,
    paymentMethod: rentalPaymentMethod(paymentStatus),
    paidAt: isRentalPaid(paymentStatus) ? new Date().toISOString().slice(0, 10) : "",
    paymentTransactionId: ""
  });
  addRentalPaymentLocal(state.rentalLoans.at(-1), paymentStatus);

  finishForm(form);
  form.dateFrom.valueAsDate = new Date();
  form.dateTo.valueAsDate = new Date();
  renderRentalItemInputs();
  updateRentalSummary();
  logActivity("Wypożyczalnia", "Wypożyczenie przedmiotów", { summary: `${data.firstName} ${data.lastName} - ${money(total)}` });
  showToast("Wypożyczenie zapisane");
}

async function handleDoc(event) {
  event.preventDefault();
  const data = formData(event.target);
  const docId = data.id || "";
  const existingDoc = docId ? state.docs.find((item) => item.id === docId) : null;
  const oldFundingName = fundingSourceName(existingDoc?.fundingSourceId);
  const newFundingName = fundingSourceName(data.fundingSourceId);
  const fundingChanged = docId && (existingDoc?.fundingSourceId || "") !== (data.fundingSourceId || "");
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

    const payload = {
      title: data.title,
      sender: data.sender || null,
      category: data.category,
      document_date: data.date,
      notes: data.notes || null,
      event_id: data.eventId || null,
      funding_source_id: data.fundingSourceId || null
    };
    if (file) {
      payload.file_path = filePath || null;
      payload.file_name = fileName || null;
      payload.file_size = fileSize || null;
      payload.mime_type = mimeType || null;
    }

    const { data: savedDoc, error } = docId
      ? await supabaseClient.from("documents").update(payload).eq("id", docId).select("id").single()
      : await supabaseClient.from("documents").insert({
          ...payload,
          file_path: filePath || null,
          file_name: fileName || null,
          file_size: fileSize || null,
          mime_type: mimeType || null
        }).select("id").single();
    if (error) {
      alert(`PDF mógł zostać wysłany, ale nie udało się zapisać dokumentu: ${error.message}`);
      return;
    }
    resetDocForm(event.target);
    if (fundingChanged) {
      await logActivity("Dokumenty", "Zmiana źródła finansowania dokumentu", { summary: `${data.title} - z ${oldFundingName} na ${newFundingName}` });
    } else {
      await logActivity("Dokumenty", docId ? "Edycja dokumentu" : "Dodanie dokumentu", { summary: docLogSummary(data) });
    }
    await refreshSupabaseData();
    showToast("Zapisano dokument");
    return;
  }
  const attachment = file ? await readPdfAttachment(file) : null;
  delete data.file;
  delete data.id;
  if (docId) {
    const doc = state.docs.find((item) => item.id === docId);
    if (doc) Object.assign(doc, {
      ...data,
      id: docId,
      fundingSourceId: data.fundingSourceId || "",
      fundingSourceName: newFundingName,
      attachment: attachment || doc.attachment
    });
    resetDocForm(event.target);
    saveState();
    render();
    if (fundingChanged) {
      logActivity("Dokumenty", "Zmiana źródła finansowania dokumentu", { summary: `${data.title} - z ${oldFundingName} na ${newFundingName}` });
    } else {
      logActivity("Dokumenty", "Edycja dokumentu", { summary: docLogSummary(data) });
    }
    showToast("Zapisano dokument");
    return;
  }
  state.docs.push({ id: makeId(), ...data, fundingSourceId: data.fundingSourceId || "", fundingSourceName: newFundingName, attachment });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
  logActivity("Dokumenty", "Dodanie dokumentu", { summary: docLogSummary(data) });
  showToast("Zapisano dokument");
}

async function handleInvoice(event) {
  event.preventDefault();
  const data = formData(event.target);
  const selectedRental = state.rentalLoans.find((entry) => entry.id === data.rentalId);
  if (data.rentalId && rentalInvoice(data.rentalId)) {
    alert("Do tego wypożyczenia faktura została już wystawiona.");
    return;
  }
  const invoice = makeInvoice({
    id: makeId(),
    ...data,
    rentalLabel: selectedRental ? `${selectedRental.firstName} ${selectedRental.lastName} - ${formatDate(selectedRental.dateFrom)}` : "",
    quantity: Number(data.quantity),
    unitPrice: Number(data.unitPrice),
    paymentStatus: data.paymentStatus || "unpaid",
    paymentMethod: data.paymentMethod || invoicePaymentMethod(data.paymentStatus || "unpaid"),
    paidAt: isInvoicePaid(data.paymentStatus) ? new Date().toISOString().slice(0, 10) : "",
    paymentTransactionId: "",
    paymentDueDate: data.paymentDueDate || "",
    bankAccount: data.bankAccount || ""
  });
  if (supabaseClient && currentRole) {
    const { data: savedInvoice, error } = await supabaseClient.from("invoices").insert({
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
      notes: invoice.notes || null,
      payment_status: invoice.paymentStatus,
      payment_method: invoice.paymentMethod || null,
      paid_at: invoice.paidAt || null,
      payment_due_date: invoice.paymentDueDate || null,
      bank_account: invoice.bankAccount || null
    }).select("id").single();
    if (error) {
      alert(`Nie udało się zapisać faktury w Supabase: ${error.message}`);
      return;
    }
    const paymentResult = await addInvoicePaymentToSupabase({ ...invoice, id: savedInvoice.id });
    if (!paymentResult.ok) return;
    event.target.reset();
    event.target.date.valueAsDate = new Date();
    event.target.paymentDueDate.value = dateOffset(new Date().toISOString().slice(0, 10), 7);
    await logActivity("Faktury", "Wystawienie faktury", { summary: `${invoice.number} - ${invoice.buyerName} - ${money(invoice.gross)}` });
    await refreshSupabaseData();
    showToast("Zapisano fakturę");
    return;
  }
  state.invoices.push(invoice);
  addInvoicePaymentLocal(state.invoices.at(-1));
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
  event.target.paymentDueDate.value = dateOffset(new Date().toISOString().slice(0, 10), 7);
  logActivity("Faktury", "Wystawienie faktury", { summary: `${invoice.number} - ${invoice.buyerName} - ${money(invoice.gross)}` });
  showToast("Zapisano fakturę");
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
  renderFundingSources();
  renderFundingDetails();
  renderEvents();
  renderRentals();
  renderDocs();
  renderInvoices();
  renderBoard();
  renderAuditLogs();
  renderFeeOptions();
  renderEventOptions();
  renderFundingSourceOptions();
  renderInvoiceRentalOptions();
}

function showToast(message, type = "success") {
  if (!elements.toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("toast-hide");
    window.setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function renderAuditLogs() {
  if (!elements.auditLogList) return;
  if (!state.auditLogs.length) {
    elements.auditLogList.innerHTML = '<div class="row"><small>Brak zapisanych logów aktywności.</small></div>';
    return;
  }
  elements.auditLogList.innerHTML = `
    <div class="audit-table">
      <div class="audit-head">Data</div>
      <div class="audit-head">Użytkownik</div>
      <div class="audit-head">Moduł</div>
      <div class="audit-head">Akcja</div>
      <div class="audit-head">Szczegóły</div>
      ${state.auditLogs.map((entry) => `
        <div>${formatDateTime(entry.date)}</div>
        <div>${escapeHtml(entry.user || "Nieznany użytkownik")}</div>
        <div>${escapeHtml(entry.module || "—")}</div>
        <div>${escapeHtml(entry.action || "—")}</div>
        <div>${escapeHtml(entry.details || "—")}</div>
      `).join("")}
    </div>
  `;
}

function logActivity(moduleName, action, details = {}) {
  if (!supabaseClient || !currentRole) return Promise.resolve();
  return (async () => {
    try {
      let logAction = action;
      if (moduleName === "Finanse" && action === "Dodanie wpływu/wydatku") {
        logAction = moneyLogAction(details.type);
      }
      const { data, error: userError } = await supabaseClient.auth.getUser();
      if (userError) {
        console.error("Nie udało się odczytać użytkownika do logu aktywności.", {
          moduleName,
          action: logAction,
          details,
          error: userError
        });
      }
      const payload = {
        user_id: data?.user?.id || null,
        table_name: moduleName,
        action: logAction,
        details: {
          ...details,
          user: currentUserName || roleName(currentRole),
          module: moduleName
        }
      };
      const { error } = await supabaseClient.from("audit_log").insert(payload);
      if (error) {
        console.error("Nie udało się zapisać logu aktywności do public.audit_log.", {
          payload,
          error
        });
      }
    } catch (error) {
      console.error("Nie udało się zapisać logu aktywności do public.audit_log.", {
        moduleName,
        action: moduleName === "Finanse" && action === "Dodanie wpływu/wydatku" ? moneyLogAction(details.type) : action,
        details,
        error
      });
    }
  })();
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderDashboard() {
  const { income, expenses, balance } = financeTotals();
  const lateFeeRows = feeMemberRows().filter((member) => member.isLate);
  const lateFees = lateFeeRows.reduce((sum, member) => sum + member.currentDue, 0);
  const activeRentals = activeRentalRows();
  const unpaidInvoices = unpaidInvoiceRows();
  const unpaidInvoicesTotal = unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.gross || 0), 0);

  elements.cashBalance.textContent = money(balance);
  elements.unpaidInvoicesSummary.textContent = `Nieopłacone faktury: ${money(unpaidInvoicesTotal)}`;
  renderUnpaidInvoiceDashboardLine(unpaidInvoices);
  setupUnpaidInvoiceDashboardRotation(unpaidInvoices);
  renderLateFeeDashboardLine(lateFeeRows, lateFees);
  setupLateFeeDashboardRotation(lateFeeRows, lateFees);
  renderActiveRentalDashboardLine(activeRentals);
  setupActiveRentalDashboardRotation(activeRentals);

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
      <button class="link-button" type="button" onclick="showMemberDetails('${item.id}')">${escapeHtml(item.name)}</button>
      <small>${escapeHtml(item.phone || "Brak telefonu")} · ${escapeHtml(item.email || "Brak e-maila")} · ${escapeHtml(item.status)}${memberBoardRoleText(item)}</small>
    </div>
    <div class="row-actions">
      <button class="small-button" onclick="showMemberDetails('${item.id}')">Szczegóły</button>
      ${canCorrect() ? `<button class="small-button" onclick="editMember('${item.id}')">Edytuj</button>` : ""}
      ${canCorrect() ? `<button class="delete-button" onclick="removeItem('members', '${item.id}')">Usuń</button>` : ""}
    </div>
  `);
}

function showMemberDetails(id) {
  const member = state.members.find((entry) => entry.id === id);
  if (!member) return;

  const feeRow = feeMemberRows().find((row) => row.name === member.name);
  const memberFees = state.fees
    .filter((fee) => fee.memberId === member.id || fee.member === member.name)
    .sort((a, b) => String(b.paidAt || b.date || "").localeCompare(String(a.paidAt || a.date || "")));
  const memberRentals = memberRentalHistory(member);
  const feeStatus = feeRow?.isLate ? "Zaległość" : feeRow?.paid >= ANNUAL_FEE ? "Opłacone do końca roku" : `Opłacone do ${feeRow?.paidUntil || "brak danych"}`;

  elements.memberDetails.innerHTML = `
    <div class="member-details-head">
      <div>
        <h3>${escapeHtml(member.name)}</h3>
        <small>Karta członka</small>
      </div>
      <button class="small-button" type="button" onclick="hideMemberDetails()">Zamknij</button>
    </div>
    <div class="member-details-grid">
      <div><span>Telefon</span><strong>${escapeHtml(member.phone || "Brak telefonu")}</strong></div>
      <div><span>E-mail</span><strong>${escapeHtml(member.email || "Brak e-maila")}</strong></div>
      <div><span>Status</span><strong>${escapeHtml(member.status || "Aktywny")}</strong></div>
      <div><span>Funkcja w kole</span><strong>${escapeHtml(member.boardRole || "Brak")}</strong></div>
      <div><span>Suma wpłat ${FEE_YEAR}</span><strong>${money(feeRow?.paid || 0)}</strong></div>
      <div><span>Status składek</span><strong>${escapeHtml(feeStatus)}</strong></div>
    </div>
    <div class="member-details-section">
      <h4>Składki</h4>
      ${memberFees.length ? memberFees.map((fee) => `
        <div class="member-detail-line">
          <strong>${escapeHtml(fee.year || fee.period || FEE_YEAR)}</strong>
          <span>${money(fee.amount)}${fee.paidAt || fee.date ? ` · ${formatDate(fee.paidAt || fee.date)}` : ""}${fee.note ? ` · ${escapeHtml(fee.note)}` : ""}</span>
        </div>
      `).join("") : '<small>Brak zapisanych składek dla tego członka.</small>'}
    </div>
    <div class="member-details-section">
      <h4>Historia wypożyczeń</h4>
      ${memberRentals.length ? memberRentals.map((loan) => `
        <div class="member-detail-line">
          <strong>${formatDate(loan.dateFrom)} - ${formatDate(loan.dateTo)}</strong>
          <span>${escapeHtml(loan.status)} · ${money(loan.total)} · ${loan.items.map((item) => `${escapeHtml(item.name)}: ${item.quantity} szt.`).join(" · ")}</span>
        </div>
      `).join("") : '<small>Brak powiązanych wypożyczeń.</small>'}
    </div>
  `;
  elements.memberDetails.classList.remove("hidden");
  elements.memberDetails.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideMemberDetails() {
  elements.memberDetails.classList.add("hidden");
  elements.memberDetails.innerHTML = "";
}

function memberRentalHistory(member) {
  const memberName = normalizeText(member.name);
  const memberPhone = normalizePhone(member.phone);
  return state.rentalLoans
    .filter((loan) => {
      const loanName = normalizeText(`${loan.firstName || ""} ${loan.lastName || ""}`);
      const loanPhone = normalizePhone(loan.phone);
      return loanName === memberName || (memberPhone && loanPhone === memberPhone);
    })
    .sort((a, b) => String(b.dateFrom || "").localeCompare(String(a.dateFrom || "")));
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
  form.boardRole.value = member.boardRole || "Brak";
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
  form.boardRole.value = "Brak";
  elements.memberFormTitle.textContent = "Dodaj członka";
  form.querySelector('button[type="submit"]').textContent = "Dodaj";
  elements.cancelMemberEdit.classList.add("hidden");
}

function memberBoardRoleText(member) {
  const role = member.boardRole || "Brak";
  return role === "Brak" ? "" : ` · Funkcja: ${escapeHtml(role)}`;
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
    ${showFeeContactPanel ? feeContactPanel(unpaidRows) : ""}
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
          <br>${feePaymentsHtml(item)}
          ${item.isLate ? feeContactHtml(item) : ""}
        </small>
      </div>
      <div class="row-actions">
        ${canCorrect() ? `<button class="delete-button" onclick="resetMemberFees('${escapeHtml(item.name)}')">Reset wpłat</button>` : ""}
      </div>
    </div>
  `;
}

function renderMoney() {
  const { income, expenses, balance } = financeTotals();
  if (elements.moneySummary) {
    elements.moneySummary.innerHTML = `
      <div>
        <span>Aktualny stan kasy</span>
        <strong>${money(balance)}</strong>
      </div>
      <small>Wpływy: ${money(income)} · Wydatki: ${money(expenses)} · Saldo: ${money(balance)}</small>
    `;
  }
  renderOverdueInvoiceNotice();
  elements.moneyList.innerHTML = rows(filterItems(state.money), moneyRowWithDelete);
}

function financeTotals() {
  const activeMoney = state.money.filter(isActiveMoney);
  const income = activeMoney
    .filter((item) => item.type === "income" || item.type === "donation")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = activeMoney
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { income, expenses, balance: income - expenses };
}

function overdueInvoices() {
  const today = new Date().toISOString().slice(0, 10);
  return state.invoices.filter((invoice) => !isInvoicePaid(invoice.paymentStatus) && invoice.paymentDueDate && invoice.paymentDueDate < today);
}

function unpaidInvoiceRows() {
  return [...state.invoices]
    .filter((invoice) => !isInvoicePaid(invoice.paymentStatus))
    .sort((a, b) => String(a.paymentDueDate || "9999-12-31").localeCompare(String(b.paymentDueDate || "9999-12-31")));
}

function renderUnpaidInvoiceDashboardLine(invoices = unpaidInvoiceRows()) {
  if (!elements.unpaidInvoicesList) return;
  if (!invoices.length) {
    unpaidInvoiceDashboardIndex = 0;
    elements.unpaidInvoicesList.innerHTML = "Brak nieopłaconych faktur";
    return;
  }
  if (unpaidInvoiceDashboardIndex >= invoices.length) unpaidInvoiceDashboardIndex = 0;
  elements.unpaidInvoicesList.innerHTML = unpaidInvoiceDashboardRow(invoices[unpaidInvoiceDashboardIndex]);
  window.requestAnimationFrame(updateUnpaidInvoiceMarquee);
}

function setupUnpaidInvoiceDashboardRotation(invoices = unpaidInvoiceRows()) {
  if (unpaidInvoiceDashboardTimer) {
    window.clearInterval(unpaidInvoiceDashboardTimer);
    unpaidInvoiceDashboardTimer = null;
  }
  if (invoices.length <= 1) return;
  unpaidInvoiceDashboardTimer = window.setInterval(() => {
    const currentInvoices = unpaidInvoiceRows();
    if (currentInvoices.length <= 1) {
      setupUnpaidInvoiceDashboardRotation(currentInvoices);
      renderUnpaidInvoiceDashboardLine(currentInvoices);
      return;
    }
    unpaidInvoiceDashboardIndex = (unpaidInvoiceDashboardIndex + 1) % currentInvoices.length;
    renderUnpaidInvoiceDashboardLine(currentInvoices);
  }, 3000);
}

function unpaidInvoiceDashboardRow(invoice) {
  const overdue = invoice.paymentDueDate && invoice.paymentDueDate < new Date().toISOString().slice(0, 10);
  return `
    <span class="unpaid-invoice-text">${escapeHtml(invoice.buyerName || "Brak nabywcy")} | ${money(invoice.gross)} | ${invoice.paymentDueDate ? formatDate(invoice.paymentDueDate) : "brak terminu"}${overdue ? " | PO TERMINIE" : ""}</span>
  `;
}

function activeRentalRows() {
  return state.rentalLoans.filter((loan) => loan.status !== "Zwrócone");
}

function renderLateFeeDashboardLine(rows = feeMemberRows().filter((member) => member.isLate), total = rows.reduce((sum, member) => sum + member.currentDue, 0)) {
  if (!elements.lateFees) return;
  if (!rows.length) {
    lateFeeDashboardIndex = 0;
    elements.lateFees.innerHTML = dashboardMetricHtml(money(0), "brak zaległości");
    return;
  }
  if (lateFeeDashboardIndex >= rows.length) lateFeeDashboardIndex = 0;
  elements.lateFees.innerHTML = dashboardMetricHtml(money(total), rows[lateFeeDashboardIndex].name);
}

function setupLateFeeDashboardRotation(rows = feeMemberRows().filter((member) => member.isLate), total = rows.reduce((sum, member) => sum + member.currentDue, 0)) {
  if (lateFeeDashboardTimer) {
    window.clearInterval(lateFeeDashboardTimer);
    lateFeeDashboardTimer = null;
  }
  if (rows.length <= 1) return;
  lateFeeDashboardTimer = window.setInterval(() => {
    const currentRows = feeMemberRows().filter((member) => member.isLate);
    const currentTotal = currentRows.reduce((sum, member) => sum + member.currentDue, 0);
    if (currentRows.length <= 1) {
      setupLateFeeDashboardRotation(currentRows, currentTotal);
      renderLateFeeDashboardLine(currentRows, currentTotal);
      return;
    }
    lateFeeDashboardIndex = (lateFeeDashboardIndex + 1) % currentRows.length;
    renderLateFeeDashboardLine(currentRows, currentTotal);
  }, 3000);
}

function renderActiveRentalDashboardLine(rows = activeRentalRows()) {
  if (!elements.rentalCount) return;
  if (!rows.length) {
    activeRentalDashboardIndex = 0;
    elements.rentalCount.innerHTML = dashboardMetricHtml("0", "brak aktywnych");
    return;
  }
  if (activeRentalDashboardIndex >= rows.length) activeRentalDashboardIndex = 0;
  elements.rentalCount.innerHTML = dashboardMetricHtml(String(rows.length), rentalPersonName(rows[activeRentalDashboardIndex]));
}

function setupActiveRentalDashboardRotation(rows = activeRentalRows()) {
  if (activeRentalDashboardTimer) {
    window.clearInterval(activeRentalDashboardTimer);
    activeRentalDashboardTimer = null;
  }
  if (rows.length <= 1) return;
  activeRentalDashboardTimer = window.setInterval(() => {
    const currentRows = activeRentalRows();
    if (currentRows.length <= 1) {
      setupActiveRentalDashboardRotation(currentRows);
      renderActiveRentalDashboardLine(currentRows);
      return;
    }
    activeRentalDashboardIndex = (activeRentalDashboardIndex + 1) % currentRows.length;
    renderActiveRentalDashboardLine(currentRows);
  }, 3000);
}

function dashboardMetricHtml(value, name) {
  return `
    <span class="dashboard-metric-value">${escapeHtml(value)}</span>
    <span class="dashboard-metric-separator">/</span>
    <span class="dashboard-metric-name">${escapeHtml(name)}</span>
  `;
}

function rentalPersonName(loan) {
  const name = `${loan?.firstName || ""} ${loan?.lastName || ""}`.trim();
  return name || "brak danych";
}

function updateUnpaidInvoiceMarquee() {
  const line = elements.unpaidInvoicesList;
  const text = line?.querySelector(".unpaid-invoice-text");
  if (!line || !text) return;
  text.classList.remove("is-scrolling");
  text.style.removeProperty("--marquee-distance");
  const overflow = text.scrollWidth - line.clientWidth;
  if (overflow > 4) {
    text.style.setProperty("--marquee-distance", `-${overflow + 18}px`);
    text.classList.add("is-scrolling");
  }
}

function renderOverdueInvoiceNotice() {
  if (!elements.overdueInvoiceNotice) return;
  const overdue = overdueInvoices();
  elements.overdueInvoiceNotice.classList.toggle("hidden", overdue.length === 0);
  if (!overdue.length) {
    elements.overdueInvoiceNotice.innerHTML = "";
    return;
  }
  elements.overdueInvoiceNotice.innerHTML = `
    <strong>Masz ${overdue.length} ${overdue.length === 1 ? "nieopłaconą fakturę po terminie" : "nieopłacone faktury po terminie"}</strong>
    <div class="overdue-list">
      ${overdue.map((invoice) => `
        <div class="overdue-item">
          <span>Faktura ${escapeHtml(invoice.number)} · ${escapeHtml(invoice.buyerName)} · termin: ${formatDate(invoice.paymentDueDate)} · ${money(invoice.gross)}</span>
          <button class="small-button" type="button" onclick="switchView('invoices')">Przejdź do Faktur</button>
        </div>
      `).join("")}
    </div>
  `;
}

function invoiceDueBadge(invoice) {
  if (isInvoicePaid(invoice.paymentStatus) || !invoice.paymentDueDate) return "";
  const today = new Date().toISOString().slice(0, 10);
  if (invoice.paymentDueDate < today) return '<br><span class="badge due">Po terminie</span>';
  return `<br><span class="badge neutral">Termin: ${formatDate(invoice.paymentDueDate)}</span>`;
}

function renderFundingSources() {
  if (!elements.fundingSourcesList) return;
  const sortedSources = [...filterItems(state.fundingSources || [])].sort((a, b) => {
    const statusOrder = { aktywne: 0, zakończone: 1, archiwalne: 2 };
    return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) || a.name.localeCompare(b.name);
  });
  elements.fundingSourcesList.innerHTML = rows(sortedSources, fundingSourceRow);
}

function fundingSourceRow(source) {
  return `
    <div>
      <strong>${escapeHtml(source.name)}</strong>
      <small>
        ${escapeHtml(source.type || "Inne")} · ${money(source.plannedAmount || 0)} ·
        ${source.dateFrom ? formatDate(source.dateFrom) : "brak daty"} - ${source.dateTo ? formatDate(source.dateTo) : "brak daty"}
        <br>${escapeHtml(source.description || "Bez opisu")}
      </small>
    </div>
    <div class="row-actions">
      <span class="badge ${fundingStatusClass(source.status)}">${escapeHtml(source.status || "aktywne")}</span>
      <button class="small-button" onclick="showFundingSettlement('${source.id}')">Rozliczenie</button>
      ${canCorrect() ? `<button class="small-button" onclick="editFundingSource('${source.id}')">Edytuj</button>` : ""}
      ${canCorrect() && source.status !== "archiwalne" ? `<button class="delete-button" onclick="archiveFundingSource('${source.id}')">Archiwizuj</button>` : ""}
    </div>
  `;
}

function showFundingSettlement(id) {
  selectedFundingSourceId = id;
  renderFundingDetails();
  elements.fundingDetailsPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideFundingSettlement() {
  selectedFundingSourceId = "";
  renderFundingDetails();
}

function renderFundingDetails() {
  if (!elements.fundingDetailsPanel || !elements.fundingDetails) return;
  const source = state.fundingSources.find((entry) => entry.id === selectedFundingSourceId);
  elements.fundingDetailsPanel.classList.toggle("hidden", !source);
  if (!source) {
    elements.fundingDetails.innerHTML = "";
    return;
  }

  const moneyEntries = state.money
    .filter((entry) => entry.fundingSourceId === source.id)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const activeEntries = moneyEntries.filter(isActiveMoney);
  const income = activeEntries
    .filter((entry) => !isExpenseType(entry.type))
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const expenses = activeEntries
    .filter((entry) => isExpenseType(entry.type))
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const docs = state.docs
    .filter((doc) => doc.fundingSourceId === source.id)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  elements.fundingDetails.innerHTML = `
    <div class="funding-details-head">
      <div>
        <h2>${escapeHtml(source.name)}</h2>
        <small>
          Typ: ${escapeHtml(source.type || "Inne")} ·
          Status: ${escapeHtml(source.status || "aktywne")} ·
          Kwota planowana: ${money(source.plannedAmount || 0)} ·
          Okres: ${source.dateFrom ? formatDate(source.dateFrom) : "brak daty"} - ${source.dateTo ? formatDate(source.dateTo) : "brak daty"}
        </small>
      </div>
      <div class="panel-head-actions">
        <button class="small-button" type="button" onclick="printFundingSettlement('${source.id}')">Drukuj rozliczenie</button>
        <button class="small-button" type="button" onclick="hideFundingSettlement()">Wróć do listy</button>
      </div>
    </div>

    <div class="funding-summary-grid">
      <div class="funding-summary-card"><span>Wpływy</span><strong>${money(income)}</strong></div>
      <div class="funding-summary-card"><span>Wydatki</span><strong>${money(expenses)}</strong></div>
      <div class="funding-summary-card"><span>Saldo</span><strong>${money(income - expenses)}</strong></div>
      <div class="funding-summary-card"><span>Dokumenty</span><strong>${docs.length}</strong></div>
    </div>

    <section class="funding-section">
      <h3>Finanse</h3>
      <div class="table">
        ${moneyEntries.length ? moneyEntries.map(fundingMoneyRow).join("") : '<div class="row"><small>Brak wpisów finansowych dla tego źródła.</small></div>'}
      </div>
    </section>

    <section class="funding-section">
      <h3>Dokumenty</h3>
      <div class="table">
        ${docs.length ? docs.map(fundingDocRow).join("") : '<div class="row"><small>Brak dokumentów dla tego źródła.</small></div>'}
      </div>
    </section>
  `;
}

function fundingMoneyRow(entry) {
  const cancelledBadge = isActiveMoney(entry) ? "" : '<span class="badge neutral">Anulowany</span>';
  return `
    <div class="row">
      <div>
        <strong>${formatDate(entry.date)} · ${moneyTypeLabel(entry.type)} · ${money(entry.amount)}</strong>
        <small>${escapeHtml(entry.title || "Bez opisu")} · ${escapeHtml(entry.category || "Bez kategorii")} ${cancelledBadge}</small>
      </div>
    </div>
  `;
}

function fundingDocRow(doc) {
  const amountText = documentAmountText(doc);
  return `
    <div class="row">
      <div>
        <strong>${formatDate(doc.date)} · ${escapeHtml(doc.title)}</strong>
        <small>
          ${escapeHtml(doc.category || "Dokument")} · ${escapeHtml(doc.sender || "Brak nadawcy")}
          ${amountText ? ` · ${amountText}` : ""}
        </small>
      </div>
      <div class="row-actions">
        ${docHasFile(doc) ? `<button class="small-button" onclick="openDocumentAttachment('${doc.id}')">Pobierz PDF</button>` : ""}
      </div>
    </div>
  `;
}

function documentAmountText(doc) {
  const income = Number(doc.incomeAmount || 0);
  const expense = Number(doc.expenseAmount || 0);
  if (income > 0) return `Wpływ: ${money(income)}`;
  if (expense > 0) return `Wydatek: ${money(expense)}`;
  return "";
}

function fundingStatusClass(status) {
  if (status === "aktywne") return "paid";
  if (status === "zakończone") return "returned";
  return "neutral";
}

function editFundingSource(id) {
  if (!canCorrect()) return;
  const source = state.fundingSources.find((entry) => entry.id === id);
  if (!source) return;
  const form = document.querySelector("#fundingForm");
  form.id.value = source.id;
  form.name.value = source.name || "";
  form.type.value = source.type || "Inne";
  form.plannedAmount.value = source.plannedAmount || "";
  form.dateFrom.value = source.dateFrom || "";
  form.dateTo.value = source.dateTo || "";
  form.status.value = source.status || "aktywne";
  form.description.value = source.description || "";
  elements.fundingFormTitle.textContent = "Edytuj źródło finansowania";
  form.querySelector('button[type="submit"]').textContent = "Zapisz zmiany";
  elements.cancelFundingEdit.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelFundingEdit() {
  resetFundingForm(document.querySelector("#fundingForm"));
}

function resetFundingForm(form) {
  if (!form) return;
  form.reset();
  form.id.value = "";
  form.status.value = "aktywne";
  elements.fundingFormTitle.textContent = "Dodaj źródło finansowania";
  form.querySelector('button[type="submit"]').textContent = "Zapisz źródło";
  elements.cancelFundingEdit.classList.add("hidden");
}

async function archiveFundingSource(id) {
  if (!canCorrect()) return;
  const source = state.fundingSources.find((entry) => entry.id === id);
  if (!source) return;
  const confirmed = confirm(`Archiwizować źródło finansowania: ${source.name}? Dane zostaną w bazie.`);
  if (!confirmed) return;
  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient
      .from("funding_sources")
      .update({ status: "archiwalne" })
      .eq("id", id);
    if (error) {
      alert(`Nie udało się zarchiwizować źródła finansowania: ${error.message}`);
      return;
    }
    await logActivity("Źródła finansowania", "Archiwizacja źródła finansowania", { summary: source.name });
    await refreshSupabaseData();
    showToast("Źródło finansowania zostało zarchiwizowane");
    return;
  }
  source.status = "archiwalne";
  saveState();
  render();
  logActivity("Źródła finansowania", "Archiwizacja źródła finansowania", { summary: source.name });
  showToast("Źródło finansowania zostało zarchiwizowane");
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
  const historyLoans = [...filterItems(state.rentalLoans)].sort((a, b) => rentalSortDate(b).localeCompare(rentalSortDate(a)));
  elements.rentalsList.innerHTML = rows(historyLoans, rentalHistoryRow);
}

function rentalSortDate(loan) {
  if (loan.returnedAt) return `${loan.returnedAt}T23:59:59`;
  return loan.createdAt || (loan.dateFrom ? `${loan.dateFrom}T00:00:00` : "");
}

function rentalHistoryRow(loan) {
  const invoice = rentalInvoice(loan.id);
  return `
    <div>
      <details class="return-details">
        <summary>
          <strong>${escapeHtml(loan.firstName)} ${escapeHtml(loan.lastName)} - ${formatDate(loan.dateFrom)}</strong>
          <small>${escapeHtml(loan.status)} - ${money(loan.total)} - ${escapeHtml(rentalPaymentLabel(loan.paymentStatus))}</small>
        </summary>
        <small>
          Okres: ${formatDate(loan.dateFrom)} - ${formatDate(loan.dateTo)} - tel. ${escapeHtml(loan.phone)}<br>
          ${loan.items.map((item) => `${escapeHtml(item.name)}: ${item.quantity} szt.`).join(" - ")}
          ${loan.returnNotes ? `<br>Uwagi zwrotu: ${escapeHtml(loan.returnNotes)}` : ""}
          <br>Faktura: ${invoice ? `wystawiona nr ${escapeHtml(invoice.number)}` : "Brak faktury"}
        </small>
      </details>
    </div>
    <div class="row-actions">
      <button class="small-button" onclick="printRental('${loan.id}')">Druk wydania</button>
      ${loan.status === "Zwrócone" ? `<button class="small-button" onclick="printReturn('${loan.id}')">Druk zwrotu</button>` : ""}
      ${invoice ? `<button class="small-button" onclick="downloadInvoicePdf('${invoice.id}')">Drukuj / Zapisz PDF</button>` : `<button class="small-button" onclick="prepareInvoiceFromRental('${loan.id}')">Wystaw fakturę</button>`}
      ${deleteAction("rentalLoans", loan.id)}
    </div>
  `;
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
          <select id="returnPayment-${loan.id}">
            <option value="unpaid" ${loan.paymentStatus === "unpaid" ? "selected" : ""}>Nieopłacone</option>
            <option value="cash" ${loan.paymentStatus === "cash" ? "selected" : ""}>Opłacone gotówką</option>
            <option value="transfer" ${loan.paymentStatus === "transfer" ? "selected" : ""}>Opłacone przelewem</option>
            <option value="invoice_later" ${loan.paymentStatus === "invoice_later" ? "selected" : ""}>Faktura / płatność później</option>
          </select>
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
      <small>${formatDate(item.date)} · ${escapeHtml(item.sender || "Brak nadawcy")} · <span class="badge neutral">${escapeHtml(item.category)}</span><br>${escapeHtml(item.notes || "")}${item.fundingSourceName ? `<br>Źródło: ${escapeHtml(item.fundingSourceName)}` : ""}${docFileName(item) ? `<br>PDF: ${escapeHtml(docFileName(item))} (${formatBytes(docFileSize(item))})` : ""}</small>
    </div>
    <div class="row-actions">
      ${canCorrect() ? `<button class="small-button" onclick="editDoc('${item.id}')">Edytuj</button>` : ""}
      ${docHasFile(item) ? `<button class="small-button" onclick="openDocumentAttachment('${item.id}')">Otwórz PDF</button>` : ""}
      ${isAdmin() ? `<button class="delete-button" onclick="removeItem('docs', '${item.id}')">Usuń</button>` : ""}
    </div>
  `);
}

function editDoc(id) {
  if (!canCorrect()) return;
  const doc = state.docs.find((item) => item.id === id);
  const form = document.querySelector("#docForm");
  if (!doc || !form) return;
  form.id.value = doc.id;
  form.title.value = doc.title || "";
  form.sender.value = doc.sender || "";
  form.category.value = doc.category || "Pismo";
  form.date.value = doc.date || new Date().toISOString().slice(0, 10);
  form.eventId.value = doc.eventId || "";
  renderFundingSourceOptions(doc.fundingSourceId || "");
  form.fundingSourceId.value = doc.fundingSourceId || "";
  form.incomeAmount.value = "";
  form.expenseAmount.value = "";
  form.notes.value = doc.notes || "";
  elements.docFormTitle.textContent = "Edytuj dokument";
  form.querySelector('button[type="submit"]').textContent = "Zapisz zmiany";
  elements.cancelDocEdit.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelDocEdit() {
  resetDocForm(document.querySelector("#docForm"));
}

function resetDocForm(form) {
  if (!form) return;
  form.reset();
  form.id.value = "";
  form.date.valueAsDate = new Date();
  form.fundingSourceId.value = "";
  elements.docFormTitle.textContent = "Dodaj dokument lub wiadomość";
  form.querySelector('button[type="submit"]').textContent = "Zapisz dokument";
  elements.cancelDocEdit.classList.add("hidden");
  renderEventOptions();
  renderFundingSourceOptions();
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
      <small>
        ${formatDate(invoice.date)} - ${escapeHtml(invoice.buyerName)} - ${escapeHtml(invoice.source)}${invoice.rentalLabel ? ` - Wypożyczenie: ${escapeHtml(invoice.rentalLabel)}` : ""}<br>
        ${escapeHtml(invoice.itemName)}: ${invoice.quantity} x ${money(invoice.unitPrice)} netto<br>
        Płatność: ${escapeHtml(invoicePaymentStatusLabel(invoice.paymentStatus))} - ${escapeHtml(invoicePaymentMethodLabel(invoice.paymentMethod || invoicePaymentMethod(invoice.paymentStatus)))} - termin: ${invoice.paymentDueDate ? formatDate(invoice.paymentDueDate) : "—"}
        ${invoiceDueBadge(invoice)}
      </small>
    </div>
    <div class="row-actions">
      <button class="small-button" onclick="downloadInvoicePdf('${invoice.id}')">Drukuj / Zapisz PDF</button>
      ${invoicePaymentAction(invoice)}
      ${deleteAction("invoices", invoice.id)}
    </div>
  `);
}

function invoicePaymentAction(invoice) {
  if (isInvoicePaid(invoice.paymentStatus)) {
    return `<span class="badge paid">Zapłacono${invoice.paidAt ? `: ${formatDate(invoice.paidAt)}` : ""}</span>`;
  }
  const loan = invoice.rentalId ? state.rentalLoans.find((entry) => entry.id === invoice.rentalId) : null;
  if (rentalAlreadyPaid(loan)) {
    return '<span class="badge neutral">Wypożyczenie już rozliczone</span>';
  }
  return `<button class="small-button" onclick="markInvoicePaid('${invoice.id}')">Oznacz jako opłaconą</button>`;
}

function renderBoard() {
  const boardMembers = state.members.filter((member) => (member.boardRole || "Brak") !== "Brak");
  elements.boardList.innerHTML = rows(filterItems(boardMembers), (item) => `
    <div>
      <strong>${escapeHtml(item.boardRole)}: ${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.phone || "Brak telefonu")} · ${escapeHtml(item.email || "Brak e-maila")} · ${escapeHtml(item.status || "Aktywny")}</small>
    </div>
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
    return { name, phone: member?.phone || "", email: member?.email || "", fees, due, currentDue, paid, paidUntil, currentRequired, required: ANNUAL_FEE, hasDue: due > 0, isLate: currentDue > 0, stages };
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

function feePaymentsHtml(item) {
  if (!item.fees.length) return "Brak wpłat w tym roku";
  return `
    <span class="fee-payment-list">
      ${item.fees.map((fee) => `
        <span class="fee-payment-item">
          Wpłata ${escapeHtml(fee.period)}: ${money(fee.amount)}
          ${canCorrect() ? `<button class="delete-button fee-delete-button" onclick="removeItem('fees', '${fee.id}')">Usuń</button>` : ""}
        </span>
      `).join("")}
    </span>
  `;
}

function feeSmsText(name, due) {
  return `Dzień dobry, przypominamy o zaległej składce członkowskiej KGIGW. Zaległość na dziś: ${money(due)}. Prosimy o uregulowanie wpłaty. Dziękujemy.`;
}

function feeContactPanel(rows) {
  if (!rows.length) {
    return '<div class="notice fee-contact-panel"><strong>Lista kontaktów</strong><br>Brak osób z zaległością na dziś.</div>';
  }
  return `
    <div class="notice fee-contact-panel">
      <strong>Lista kontaktów do osób z zaległością</strong>
      <small>Wiadomości są tylko przygotowane. Program nie wysyła ich automatycznie.</small>
      <div class="fee-contact-list">
        ${rows.map((item) => `
          <div class="fee-contact-entry">
            <span>${escapeHtml(item.name)} · zaległość: ${money(item.currentDue)}</span>
            ${feeContactLinks(item)}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function feeContactHtml(item) {
  return `<span class="fee-contact-links">${feeContactLinks(item)}</span>`;
}

function feeContactLinks(item) {
  const text = feeSmsText(item.name, item.currentDue);
  const smsPhone = normalizeSmsPhone(item.phone);
  const whatsAppPhone = normalizeWhatsAppPhone(item.phone);
  const email = String(item.email || "").trim();
  return `
    ${smsPhone ? `<a class="small-button contact-button" href="sms:${encodeURIComponent(smsPhone)}?body=${encodeURIComponent(text)}">SMS</a>` : '<span class="contact-missing">Brak telefonu</span>'}
    ${whatsAppPhone ? `<a class="small-button contact-button" target="_blank" rel="noopener" href="https://wa.me/${encodeURIComponent(whatsAppPhone)}?text=${encodeURIComponent(text)}">WhatsApp</a>` : '<span class="contact-missing">Brak telefonu</span>'}
    ${email ? `<a class="small-button contact-button" href="mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Przypomnienie o składce")}&body=${encodeURIComponent(text)}">E-mail</a>` : '<span class="contact-missing">Brak e-maila</span>'}
  `;
}

function normalizeSmsPhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 9 ? `48${digits}` : digits;
}

function sendFeeSmsReminders() {
  const overdue = feeMemberRows().filter((item) => item.isLate);
  if (!overdue.length) {
    alert("Brak osób z zaległością na dziś.");
    return;
  }
  showFeeContactPanel = true;
  renderFees();
  showToast("Przygotowano listę kontaktów do osób z zaległością");
}

function renderEventOptions() {
  renderEventSelect(elements.moneyEvent);
  renderEventSelect(elements.docEvent);
}

function renderFundingSourceOptions(selectedId = "") {
  renderFundingSourceSelect(elements.moneyFundingSource, selectedId);
  renderFundingSourceSelect(elements.docFundingSource, selectedId);
}

function renderFundingSourceSelect(select, selectedId = "") {
  if (!select) return;
  const current = selectedId || select.value;
  const activeSources = (state.fundingSources || [])
    .filter((source) => isActiveFundingSource(source) || source.id === current)
    .sort((a, b) => a.name.localeCompare(b.name));
  select.innerHTML = '<option value="">Bez źródła</option>' + activeSources
    .map((source) => `<option value="${escapeHtml(source.id)}">${escapeHtml(source.name)}</option>`)
    .join("");
  select.value = activeSources.some((source) => source.id === current) ? current : "";
}

function fundingStatusValue(status) {
  return normalizeText(status || "aktywne");
}

function isActiveFundingSource(source) {
  const status = fundingStatusValue(source?.status);
  return status === "aktywne";
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
    .filter((loan) => loan.id === current || !rentalInvoice(loan.id))
    .map((loan) => `<option value="${escapeHtml(loan.id)}">${escapeHtml(loan.firstName)} ${escapeHtml(loan.lastName)} - ${formatDate(loan.dateFrom)} - ${money(loan.total)}</option>`)
    .join("");
  elements.invoiceRental.value = state.rentalLoans.some((loan) => loan.id === current) ? current : "";
}

function fillInvoiceFromRental() {
  const loan = state.rentalLoans.find((entry) => entry.id === elements.invoiceRental.value);
  const form = document.querySelector("#invoiceForm");
  if (!loan || !form) return;

  form.buyerName.value = "";
  form.buyerAddress.value = "";
  form.buyerNip.value = "";
  form.source.value = "Wypożyczenie";
  form.itemName.value = `Wypożyczenie: ${loan.items.map((item) => `${item.name} ${item.quantity} szt.`).join(", ")}`;
  form.quantity.value = 1;
  form.unitPrice.value = Number(loan.total || 0).toFixed(2);
  form.vatRate.value = "23";
  form.paymentStatus.value = "unpaid";
  form.paymentMethod.value = "transfer";
  form.paymentDueDate.value = dateOffset(form.date.value || new Date().toISOString().slice(0, 10), 7);
  form.bankAccount.value = "";
  form.notes.value = `Wypożyczenie od ${formatDate(loan.dateFrom)} do ${formatDate(loan.dateTo)}. Telefon: ${loan.phone}.`;
}

document.querySelector('#invoiceForm input[name="date"]').addEventListener("change", (event) => {
  const dueInput = document.querySelector('#invoiceForm input[name="paymentDueDate"]');
  if (dueInput && !dueInput.value) dueInput.value = dateOffset(event.target.value, 7);
});

function rows(items, template) {
  if (!items.length) return '<div class="row"><small>Brak wpisów pasujących do wyszukiwania.</small></div>';
  return items.map((item) => `<div class="row">${template(item)}</div>`).join("");
}

function moneyRow(item) {
  const eventText = item.eventName ? ` - Wydarzenie: ${escapeHtml(item.eventName)}` : "";
  const fundingText = item.fundingSourceName ? ` - Źródło: ${escapeHtml(item.fundingSourceName)}` : "";
  const typeLabel = moneyTypeLabel(item.type);
  return `
    <div class="row">
      <div>
        <strong>${escapeHtml(item.title)} · ${money(item.amount)}</strong>
        <small>${formatDate(item.date)} · ${escapeHtml(item.category || "Bez kategorii")} · <span class="badge ${item.type}">${typeLabel}</span>${eventText}${fundingText}</small>
      </div>
    </div>
  `;
}

function moneyRowWithDelete(item) {
  const eventText = item.eventName ? ` - Wydarzenie: ${escapeHtml(item.eventName)}` : "";
  const fundingText = item.fundingSourceName ? ` - Źródło: ${escapeHtml(item.fundingSourceName)}` : "";
  const typeLabel = moneyTypeLabel(item.type);
  const cancelled = !isActiveMoney(item);
  const statusLabel = cancelled ? ' <span class="badge neutral">Anulowany</span>' : "";
  return `
    <div>
      <strong>${escapeHtml(item.title)} · ${money(item.amount)}</strong>
      <small>${formatDate(item.date)} · ${escapeHtml(item.category || "Bez kategorii")} · <span class="badge ${item.type}">${typeLabel}</span>${statusLabel}${eventText}${fundingText}</small>
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
  renderFundingSourceOptions(entry.fundingSourceId || "");
  form.fundingSourceId.value = entry.fundingSourceId || "";
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
  form.fundingSourceId.value = "";
  elements.moneyFormTitle.textContent = "Dodaj wpływ lub wydatek";
  form.querySelector('button[type="submit"]').textContent = "Zapisz";
  elements.cancelMoneyEdit.classList.add("hidden");
  renderEventOptions();
  renderFundingSourceOptions();
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

function moneyLogAction(type) {
  return isExpenseType(type) ? "Dodanie wydatku" : "Dodanie wpływu";
}

function moneyLogSummary(entry) {
  const sourceName = fundingSourceName(entry.fundingSourceId);
  return `${entry.title || "Wpis finansowy"} - ${money(Number(entry.amount || 0))}${sourceName !== "Bez źródła" ? ` - Źródło: ${sourceName}` : ""}`;
}

function fundingSourceName(id) {
  if (!id) return "Bez źródła";
  return state.fundingSources.find((source) => source.id === id)?.name || "Bez źródła";
}

function isExpenseType(type) {
  return ["expense", "wydatek", "wydatki", "minus", "koszt"].includes(normalizeText(type || ""));
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
    await logActivity("Składki", "Reset wpłat", { summary: `${name} - ${FEE_YEAR}` });
    await refreshSupabaseData();
    return;
  }
  rememberUndo();
  state.fees = state.fees.filter((fee) => !(fee.member === name && feeYear(fee.year || fee.period) === FEE_YEAR));
  saveState();
  render();
  logActivity("Składki", "Reset wpłat", { summary: `${name} - ${FEE_YEAR}` });
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
    await logActivity("Wypożyczalnia", "Dodanie przedmiotu w Magazynie", { summary: `${name} - ${quantity} szt. - ${money(price)}` });
    await refreshSupabaseData();
    showToast("Dodano przedmiot do magazynu");
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
  logActivity("Wypożyczalnia", "Dodanie przedmiotu w Magazynie", { summary: `${name} - ${quantity} szt. - ${money(price)}` });
  showToast("Dodano przedmiot do magazynu");
}

async function returnRental(id) {
  const loan = state.rentalLoans.find((entry) => entry.id === id);
  if (!loan) return;
  const confirmed = confirm("Oznaczyc to wypozyczenie jako zwrocone?");
  if (!confirmed) return;
  const notes = document.querySelector(`#returnNotes-${id}`)?.value || "";
  const damageCost = Number(document.querySelector(`#returnDamage-${id}`)?.value || 0);
  const paymentStatus = document.querySelector(`#returnPayment-${id}`)?.value || loan.paymentStatus || "unpaid";
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
        damage_cost: damageCost,
        payment_status: paymentStatus,
        payment_method: rentalPaymentMethod(paymentStatus),
        paid_at: isRentalPaid(paymentStatus) && !loan.paidAt ? new Date().toISOString().slice(0, 10) : loan.paidAt || null
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

    const paymentResult = await addRentalPaymentToSupabase(loan, paymentStatus);
    if (!paymentResult.ok) return;

    await logActivity("Wypożyczalnia", "Przyjęcie zwrotu", { summary: `${loan.firstName} ${loan.lastName}` });
    await refreshSupabaseData();
    showToast("Przyjęto zwrot");
    return;
  }
  rememberUndo();
  loan.status = "Zwrócone";
  loan.returnedAt = new Date().toISOString().slice(0, 10);
  loan.returnNotes = notes;
  loan.damageCost = damageCost;
  loan.returnItems = returnItems;
  loan.paymentStatus = paymentStatus;
  loan.paymentMethod = rentalPaymentMethod(paymentStatus);
  if (isRentalPaid(paymentStatus) && !loan.paidAt) loan.paidAt = new Date().toISOString().slice(0, 10);
  addRentalPaymentLocal(loan, paymentStatus);
  saveState();
  render();
  logActivity("Wypożyczalnia", "Przyjęcie zwrotu", { summary: `${loan.firstName} ${loan.lastName}` });
  showToast("Przyjęto zwrot");
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

async function printFundingSettlement(id) {
  const source = state.fundingSources.find((entry) => entry.id === id);
  if (!source) return;
  elements.printSheet.innerHTML = fundingSettlementPrintHtml(source);
  await logActivity("Źródła finansowania", "Druk rozliczenia", { summary: source.name });
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

async function markInvoicePaid(id) {
  const invoice = state.invoices.find((entry) => entry.id === id);
  if (!invoice) return;
  if (isInvoicePaid(invoice.paymentStatus)) {
    showToast("Faktura jest już oznaczona jako zapłacona");
    return;
  }
  const loan = invoice.rentalId ? state.rentalLoans.find((entry) => entry.id === invoice.rentalId) : null;
  if (rentalAlreadyPaid(loan)) {
    alert("To wypożyczenie było już rozliczone w Finansach. Faktura nie zostanie zaksięgowana drugi raz.");
    return;
  }

  const choice = prompt("Wybierz płatność:\n1 - Opłacona gotówką\n2 - Opłacona przelewem", "2");
  if (!choice) return;
  const normalizedChoice = choice.trim().toLowerCase();
  let paymentStatus = "";
  if (normalizedChoice === "1" || normalizedChoice.includes("got")) paymentStatus = "cash";
  if (normalizedChoice === "2" || normalizedChoice.includes("przelew")) paymentStatus = "transfer";
  if (!paymentStatus) {
    alert("Wybierz 1 dla gotówki albo 2 dla przelewu.");
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const paidAt = prompt("Data płatności (RRRR-MM-DD):", today);
  if (!paidAt) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) {
    alert("Podaj datę w formacie RRRR-MM-DD, np. 2026-05-26.");
    return;
  }

  const paidInvoice = {
    ...invoice,
    paymentStatus,
    paymentMethod: paymentStatus,
    paidAt
  };

  if (supabaseClient && currentRole) {
    const result = await addInvoicePaymentToSupabase(paidInvoice);
    if (!result.ok) return;
    await logActivity("Faktury", "Oznaczenie faktury jako opłaconej", { summary: `${invoice.number} - ${invoice.buyerName}` });
    await refreshSupabaseData();
    showToast("Faktura oznaczona jako zapłacona i dodana do Finansów");
    return;
  }

  invoice.paymentStatus = paymentStatus;
  invoice.paymentMethod = paymentStatus;
  invoice.paidAt = paidAt;
  addInvoicePaymentLocal(invoice);
  saveState();
  render();
  logActivity("Faktury", "Oznaczenie faktury jako opłaconej", { summary: `${invoice.number} - ${invoice.buyerName}` });
  showToast("Faktura oznaczona jako zapłacona i dodana do Finansów");
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
      await logActivity("Członkowie", "Archiwizacja członka", { summary: member?.name || id });
      await refreshSupabaseData();
      showToast("Członek został zarchiwizowany");
      return;
    }
    if (member) {
      rememberUndo();
      member.status = "Nieaktywny";
      saveState();
      render();
      logActivity("Członkowie", "Archiwizacja członka", { summary: member.name });
      showToast("Członek został zarchiwizowany");
    }
    return;
  }
  if (["docs", "invoices"].includes(collection) && !isAdmin()) {
    alert("Dokumenty PDF i faktury może usuwać tylko Administrator.");
    return;
  }
  if (collection === "money") {
    const entry = state.money.find((item) => item.id === id);
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
      await logActivity("Finanse", "Anulowanie wpisu finansowego", { summary: entry ? moneyLogSummary(entry) : id });
      await refreshSupabaseData();
      showToast("Wpis w Finansach został anulowany");
      return;
    }
    if (entry) {
      rememberUndo();
      entry.status = "cancelled";
      entry.cancelledAt = new Date().toISOString();
      entry.cancelledReason = "";
      saveState();
      render();
      logActivity("Finanse", "Anulowanie wpisu finansowego", { summary: moneyLogSummary(entry) });
      showToast("Wpis w Finansach został anulowany");
    }
    return;
  }
  const feeToDelete = collection === "fees" ? state.fees.find((fee) => fee.id === id) : null;
  const confirmed = collection === "fees"
    ? confirm(`Usunąć tę konkretną wpłatę: ${feeToDelete ? `${feeToDelete.member || "członek"} - ${money(feeToDelete.amount)} (${feeToDelete.period || feeToDelete.year || FEE_YEAR})` : "wybrana wpłata"}?`)
    : confirm("Czy na pewno usunąć ten wpis? Tej operacji nie da się cofnąć.");
  if (!confirmed) return;
  if (supabaseClient && currentRole && collection === "fees") {
    const { error } = await supabaseClient.from("fees").delete().eq("id", id);
    if (error) {
      alert(`Nie udało się usunąć wpisu w Supabase: ${error.message}`);
      return;
    }
    await logActivity("Składki", "Usunięcie wpłaty", { summary: feeToDelete ? `${feeToDelete.member} - ${money(feeToDelete.amount)}` : id });
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

function grossFromNet(net, vatRate = 23) {
  return Number(net || 0) + Number(net || 0) * Number(vatRate || 0) / 100;
}

function isRentalPaid(status) {
  return status === "cash" || status === "transfer";
}

function isInvoicePaid(status) {
  return status === "cash" || status === "transfer";
}

function rentalPaymentMethod(status) {
  if (status === "cash") return "Gotówka";
  if (status === "transfer") return "Przelew";
  if (status === "invoice_later") return "Faktura / płatność później";
  return "";
}

function invoicePaymentMethod(status) {
  if (status === "cash") return "Gotówka";
  if (status === "transfer") return "Przelew";
  return "";
}

function invoicePaymentMethodLabel(method) {
  if (method === "cash" || method === "Gotówka") return "Gotówka";
  if (method === "transfer" || method === "Przelew") return "Przelew";
  if (method === "other") return "Płatność on-line / inna";
  return method || "—";
}

function invoicePaymentStatusLabel(status) {
  if (status === "cash" || status === "transfer") return "Zapłacono";
  return "Nieopłacona";
}

function dateOffset(dateValue, days) {
  const base = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function rentalPaymentLabel(status) {
  if (status === "cash") return "Opłacone gotówką";
  if (status === "transfer") return "Opłacone przelewem";
  if (status === "invoice_later") return "Faktura / płatność później";
  return "Nieopłacone";
}

function rentalPaymentTitle(loan) {
  const items = (loan.items || []).map((item) => `${item.name} ${item.quantity} szt.`).join(", ");
  return `Wypożyczenie - ${loan.firstName} ${loan.lastName} - ${items}`;
}

function rentalAlreadyPaid(loan) {
  if (!loan) return false;
  if (isRentalPaid(loan.paymentStatus)) return true;
  if (loan.paymentTransactionId) return true;
  return state.money.some((entry) =>
    entry.sourceType === "rental_payment"
    && entry.sourceId === loan.id
    && isActiveMoney(entry)
  );
}

async function addRentalPaymentToSupabase(loan, paymentStatus) {
  if (!isRentalPaid(paymentStatus)) return { ok: true };
  if (loan.paymentTransactionId) return { ok: true };

  let existing = state.money.find((entry) =>
    entry.sourceType === "rental_payment"
    && entry.sourceId === loan.id
    && isActiveMoney(entry)
  );
  if (!existing) {
    const { data: existingRows, error: existingError } = await supabaseClient
      .from("transactions")
      .select("id")
      .eq("source_type", "rental_payment")
      .eq("source_id", loan.id)
      .eq("status", "active")
      .limit(1);
    if (existingError) {
      alert(`Nie udało się sprawdzić płatności w Finansach: ${existingError.message}`);
      return { ok: false };
    }
    existing = existingRows?.[0] ? { id: existingRows[0].id } : null;
  }
  if (existing) {
    await supabaseClient
      .from("rentals")
      .update({
        payment_transaction_id: existing.id,
        payment_status: paymentStatus,
        payment_method: rentalPaymentMethod(paymentStatus),
        paid_at: loan.paidAt || new Date().toISOString().slice(0, 10)
      })
      .eq("id", loan.id);
    return { ok: true };
  }

  const paidAt = loan.paidAt || new Date().toISOString().slice(0, 10);
  const { data: savedPayment, error } = await supabaseClient
    .from("transactions")
    .insert({
      type: "income",
      title: rentalPaymentTitle(loan),
      category: "Wypożyczenie",
      amount: grossFromNet(loan.total, 23),
      transaction_date: paidAt,
      source_type: "rental_payment",
      source_id: loan.id
    })
    .select("id")
    .single();
  if (error) {
    alert(`Wypożyczenie zapisane, ale nie udało się dodać wpływu do Finansów: ${error.message}`);
    return { ok: false };
  }

  const { error: updateError } = await supabaseClient
    .from("rentals")
    .update({
      payment_transaction_id: savedPayment.id,
      payment_status: paymentStatus,
      payment_method: rentalPaymentMethod(paymentStatus),
      paid_at: paidAt
    })
    .eq("id", loan.id);
  if (updateError) {
    alert(`Wpływ dodany do Finansów, ale nie udało się powiązać go z wypożyczeniem: ${updateError.message}`);
    return { ok: false };
  }

  return { ok: true };
}

function addRentalPaymentLocal(loan, paymentStatus) {
  if (!isRentalPaid(paymentStatus)) return;
  if (loan.paymentTransactionId) return;
  const existing = state.money.find((entry) => entry.sourceType === "rental_payment" && entry.sourceId === loan.id && isActiveMoney(entry));
  if (existing) {
    loan.paymentTransactionId = existing.id;
    return;
  }
  const paymentId = makeId();
  state.money.push({
    id: paymentId,
    type: "income",
    title: rentalPaymentTitle(loan),
    category: "Wypożyczenie",
    amount: grossFromNet(loan.total, 23),
    date: loan.paidAt || new Date().toISOString().slice(0, 10),
    status: "active",
    sourceType: "rental_payment",
    sourceId: loan.id
  });
  loan.paymentTransactionId = paymentId;
}

async function addInvoicePaymentToSupabase(invoice) {
  if (!isInvoicePaid(invoice.paymentStatus)) return { ok: true };
  if (invoice.rentalId) {
    const loan = state.rentalLoans.find((entry) => entry.id === invoice.rentalId);
    if (rentalAlreadyPaid(loan)) return { ok: true };
  }

  const { data: existingRows, error: existingError } = await supabaseClient
    .from("transactions")
    .select("id")
    .eq("source_type", "invoice_payment")
    .eq("source_id", invoice.id)
    .eq("status", "active")
    .limit(1);
  if (existingError) {
    alert(`Nie udało się sprawdzić płatności faktury w Finansach: ${existingError.message}`);
    return { ok: false };
  }

  const paidAt = invoice.paidAt || new Date().toISOString().slice(0, 10);
  const existingId = invoice.paymentTransactionId || existingRows?.[0]?.id;
  let paymentId = existingId;
  if (!paymentId) {
    const { data: savedPayment, error } = await supabaseClient
      .from("transactions")
      .insert({
        type: "income",
        title: `Faktura ${invoice.number} - ${invoice.buyerName}`,
        category: "Faktura / Wypożyczenie",
        amount: Number(invoice.gross || 0),
        transaction_date: paidAt,
        source_type: "invoice_payment",
        source_id: invoice.id
      })
      .select("id")
      .single();
    if (error) {
      alert(`Faktura zapisana, ale nie udało się dodać wpływu do Finansów: ${error.message}`);
      return { ok: false };
    }
    paymentId = savedPayment.id;
  }

  const { error: updateError } = await supabaseClient
    .from("invoices")
    .update({
      payment_transaction_id: paymentId,
      payment_status: invoice.paymentStatus,
      payment_method: invoice.paymentMethod || invoice.paymentStatus || invoicePaymentMethod(invoice.paymentStatus),
      paid_at: paidAt
    })
    .eq("id", invoice.id);
  if (updateError) {
    alert(`Wpływ dodany do Finansów, ale nie udało się powiązać go z fakturą: ${updateError.message}`);
    return { ok: false };
  }
  return { ok: true };
}

function addInvoicePaymentLocal(invoice) {
  if (!isInvoicePaid(invoice.paymentStatus)) return;
  if (invoice.rentalId) {
    const loan = state.rentalLoans.find((entry) => entry.id === invoice.rentalId);
    if (rentalAlreadyPaid(loan)) return;
  }
  if (invoice.paymentTransactionId) return;
  const existing = state.money.find((entry) => entry.sourceType === "invoice_payment" && entry.sourceId === invoice.id && isActiveMoney(entry));
  if (existing) {
    invoice.paymentTransactionId = existing.id;
    return;
  }
  const paymentId = makeId();
  state.money.push({
    id: paymentId,
    type: "income",
    title: `Faktura ${invoice.number} - ${invoice.buyerName}`,
    category: "Faktura / Wypożyczenie",
    amount: Number(invoice.gross || 0),
    date: invoice.paidAt || new Date().toISOString().slice(0, 10),
    status: "active",
    sourceType: "invoice_payment",
    sourceId: invoice.id
  });
  invoice.paymentTransactionId = paymentId;
}

function rentalInvoice(rentalId) {
  return state.invoices.find((invoice) => invoice.rentalId === rentalId);
}

function prepareInvoiceFromRental(id) {
  const loan = state.rentalLoans.find((entry) => entry.id === id);
  if (!loan) return;
  const existing = rentalInvoice(id);
  if (existing) {
    switchView("invoices");
    showToast(`Faktura ${existing.number} jest już zapisana`);
    return;
  }

  switchView("invoices");
  renderInvoiceRentalOptions();
  const form = document.querySelector("#invoiceForm");
  form.reset();
  form.date.valueAsDate = new Date();
  form.rentalId.value = loan.id;
  fillInvoiceFromRental();
  form.number.value = "";
  form.buyerName.value = "";
  form.buyerAddress.value = "";
  form.buyerNip.value = "";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Przygotowano formularz faktury. Uzupełnij dane i kliknij Zapisz fakturę.");
}

function safeFileName(name) {
  return String(name || "dokument.pdf")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "dokument.pdf";
}

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
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

function docLogSummary(doc) {
  const sourceName = fundingSourceName(doc.fundingSourceId);
  return `${doc.title || "Dokument"}${sourceName !== "Bez źródła" ? ` - Źródło: ${sourceName}` : ""}`;
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
  const net = Number(loan.total || 0);
  const vat = net * 0.23;
  const gross = net + vat;
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
          <th>Cena za dobe netto</th>
          <th>Wartosc netto</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p><strong>Razem netto:</strong> ${money(net)}</p>
    <p><strong>VAT 23%:</strong> ${money(vat)}</p>
    <p><strong>Razem brutto do zaplaty:</strong> ${money(gross)}</p>
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

function fundingSettlementPrintHtml(source) {
  const activeItems = state.money
    .filter((entry) => entry.fundingSourceId === source.id && isActiveMoney(entry))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  const incomeItems = activeItems.filter((entry) => !isExpenseType(entry.type));
  const expenseItems = activeItems.filter((entry) => isExpenseType(entry.type));
  const docs = state.docs
    .filter((doc) => doc.fundingSourceId === source.id)
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  const income = incomeItems.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const expenses = expenseItems.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  return `
    ${organizationHeaderHtml()}
    <h2>Rozliczenie źródła finansowania</h2>
    <p><strong>Nazwa źródła:</strong> ${escapeHtml(source.name)}</p>
    <p><strong>Typ:</strong> ${escapeHtml(source.type || "Inne")} &nbsp; <strong>Status:</strong> ${escapeHtml(source.status || "aktywne")}</p>
    <p><strong>Kwota planowana / przyznana:</strong> ${money(source.plannedAmount || 0)}</p>
    <p><strong>Okres:</strong> ${source.dateFrom ? formatDate(source.dateFrom) : "brak daty"} - ${source.dateTo ? formatDate(source.dateTo) : "brak daty"}</p>
    ${source.description ? `<p><strong>Opis:</strong> ${escapeHtml(source.description)}</p>` : ""}
    <p><strong>Data wydruku:</strong> ${new Intl.DateTimeFormat("pl-PL").format(new Date())}</p>

    <h3>Podsumowanie</h3>
    <table>
      <tbody>
        <tr><th>Suma wpływów</th><td>${money(income)}</td></tr>
        <tr><th>Suma wydatków</th><td>${money(expenses)}</td></tr>
        <tr><th>Saldo</th><td>${money(income - expenses)}</td></tr>
        <tr><th>Liczba dokumentów</th><td>${docs.length}</td></tr>
      </tbody>
    </table>

    <h3>Wpływy</h3>
    ${fundingSettlementMoneyTable(incomeItems, "Brak wpływów dla tego źródła.")}

    <h3>Wydatki</h3>
    ${fundingSettlementMoneyTable(expenseItems, "Brak wydatków dla tego źródła.")}

    <h3>Dokumenty</h3>
    ${fundingSettlementDocsTable(docs)}

    <div class="print-signatures">
      <div class="signature-line">Sporządził/a: ____________________</div>
      <div class="signature-line">Sprawdził/a: ____________________</div>
    </div>
  `;
}

function fundingSettlementMoneyTable(items, emptyText) {
  if (!items.length) return `<p>${emptyText}</p>`;
  return `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Opis</th>
          <th>Kategoria</th>
          <th>Kwota</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((entry) => `
          <tr>
            <td>${formatDate(entry.date)}</td>
            <td>${escapeHtml(entry.title || "Bez opisu")}</td>
            <td>${escapeHtml(entry.category || "Bez kategorii")}</td>
            <td>${money(entry.amount)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function fundingSettlementDocsTable(docs) {
  if (!docs.length) return "<p>Brak dokumentów dla tego źródła.</p>";
  return `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Tytuł</th>
          <th>Typ</th>
          <th>Nadawca</th>
          <th>Kwota</th>
          <th>PDF</th>
        </tr>
      </thead>
      <tbody>
        ${docs.map((doc) => `
          <tr>
            <td>${formatDate(doc.date)}</td>
            <td>${escapeHtml(doc.title || "Bez tytułu")}</td>
            <td>${escapeHtml(doc.category || "Dokument")}</td>
            <td>${escapeHtml(doc.sender || "Brak nadawcy")}</td>
            <td>${escapeHtml(documentAmountText(doc) || "brak")}</td>
            <td>${docHasFile(doc) ? "Tak" : "Nie"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
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
  const paid = isInvoicePaid(invoice.paymentStatus);
  const paymentMethod = invoicePaymentMethodLabel(invoice.paymentMethod || invoicePaymentMethod(invoice.paymentStatus));
  const paidAmount = paid ? Number(invoice.gross || 0) : 0;
  const amountDue = paid ? 0 : Number(invoice.gross || 0);
  const showBankAccount = paymentMethod === "Przelew";
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
    <table>
      <tbody>
        <tr>
          <th colspan="2">Płatność</th>
        </tr>
        <tr>
          <td>Forma płatności</td>
          <td>${escapeHtml(paymentMethod)}</td>
        </tr>
        <tr>
          <td>Termin płatności</td>
          <td>${invoice.paymentDueDate ? formatDate(invoice.paymentDueDate) : "—"}</td>
        </tr>
        <tr>
          <td>Status płatności</td>
          <td>${escapeHtml(invoicePaymentStatusLabel(invoice.paymentStatus))}</td>
        </tr>
        ${showBankAccount ? `
        <tr>
          <td>Numer konta</td>
          <td>${escapeHtml(invoice.bankAccount || "—")}</td>
        </tr>
        ` : ""}
        <tr>
          <td>Kwota opłacona</td>
          <td>${money(paidAmount)}</td>
        </tr>
        <tr>
          <td>Do zapłaty</td>
          <td>${money(amountDue)}</td>
        </tr>
      </tbody>
    </table>
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
  exportAdminData("full-json");
}

function exportAdminData(kind) {
  if (!isAdmin()) return;
  const today = new Date().toISOString().slice(0, 10);
  if (kind === "full-json") {
    const data = {
      exportedAt: new Date().toISOString(),
      members: state.members,
      fees: state.fees,
      transactions: state.money,
      funding_sources: state.fundingSources,
      inventory: state.rentalInventory,
      rentals: state.rentalLoans,
      invoices: state.invoices,
      documents: state.docs,
      events: state.events,
      board: boardMembers()
    };
    downloadTextFile(`kgigw-pelna-kopia-${today}.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
    logActivity("Administracja", "Eksport danych", { summary: "Eksport pełny JSON" });
    return;
  }

  const config = adminExportConfig()[kind];
  if (!config) return;
  const rows = config.rows();
  const header = config.columns.map((column) => excelCellValue(column.label)).join("\t");
  const body = rows.map((row) => config.columns.map((column) => adminExcelValue(column.value(row), column.type)).join("\t"));
  downloadUtf16LeFile(`kgigw-${config.file}-${today}.xls`, [header, ...body].join("\r\n"));
  logActivity("Administracja", "Eksport danych", { summary: config.log });
}

function downloadTextFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadUtf16LeFile(fileName, content) {
  const bytes = utf16LeWithBom(content);
  const blob = new Blob([bytes], { type: "application/vnd.ms-excel;charset=utf-16le" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function utf16LeWithBom(text) {
  const bytes = new Uint8Array(2 + text.length * 2);
  bytes[0] = 0xff;
  bytes[1] = 0xfe;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    bytes[2 + index * 2] = code & 0xff;
    bytes[3 + index * 2] = code >> 8;
  }
  return bytes;
}

function adminExportConfig() {
  return {
    members: {
      file: "czlonkowie",
      log: "Eksport członków CSV",
      rows: () => state.members,
      columns: [
        { label: "Imię i nazwisko", value: (item) => item.name },
        { label: "Telefon", value: (item) => item.phone, type: "phone" },
        { label: "E-mail", value: (item) => item.email },
        { label: "Status", value: (item) => item.status },
        { label: "Funkcja w kole", value: (item) => item.boardRole },
        { label: "ID techniczne", value: (item) => item.id, type: "id" }
      ]
    },
    fees: {
      file: "skladki",
      log: "Eksport składek CSV",
      rows: () => state.fees,
      columns: [
        { label: "Członek", value: (item) => item.member },
        { label: "Rok", value: (item) => item.year || item.period },
        { label: "Kwota", value: (item) => item.amount, type: "money" },
        { label: "Data wpłaty", value: (item) => item.paidAt, type: "date" },
        { label: "Notatka", value: (item) => item.note },
        { label: "ID członka", value: (item) => item.memberId, type: "id" },
        { label: "ID techniczne", value: (item) => item.id, type: "id" }
      ]
    },
    money: {
      file: "finanse",
      log: "Eksport finansów CSV",
      rows: () => state.money,
      columns: [
        { label: "Typ", value: (item) => moneyTypeLabel(item.type) },
        { label: "Opis", value: (item) => item.title },
        { label: "Kategoria", value: (item) => item.category },
        { label: "Kwota", value: (item) => item.amount, type: "money" },
        { label: "Data", value: (item) => item.date, type: "date" },
        { label: "Wydarzenie", value: (item) => item.eventName },
        { label: "Status", value: (item) => isActiveMoney(item) ? "Aktywny" : "Anulowany" },
        { label: "Źródło", value: (item) => item.sourceType },
        { label: "ID źródła", value: (item) => item.sourceId, type: "id" },
        { label: "ID techniczne", value: (item) => item.id, type: "id" }
      ]
    },
    inventory: {
      file: "magazyn",
      log: "Eksport magazynu CSV",
      rows: () => state.rentalInventory,
      columns: [
        { label: "Nazwa", value: (item) => item.name },
        { label: "Stan całkowity", value: (item) => item.quantity },
        { label: "Dostępne", value: (item) => availableQuantity(item.id) },
        { label: "Wypożyczone", value: (item) => borrowedQuantity(item.id) },
        { label: "Zwrócone", value: (item) => returnedQuantity(item.id) },
        { label: "Cena za dobę", value: (item) => item.price, type: "money" },
        { label: "ID techniczne", value: (item) => item.id, type: "id" }
      ]
    },
    rentals: {
      file: "wypozyczenia",
      log: "Eksport wypożyczeń CSV",
      rows: () => state.rentalLoans,
      columns: [
        { label: "Imię", value: (item) => item.firstName },
        { label: "Nazwisko", value: (item) => item.lastName },
        { label: "Telefon", value: (item) => item.phone, type: "phone" },
        { label: "Od", value: (item) => item.dateFrom, type: "date" },
        { label: "Do", value: (item) => item.dateTo, type: "date" },
        { label: "Dni", value: (item) => item.days },
        { label: "Wartość netto", value: (item) => item.total, type: "money" },
        { label: "Wartość brutto", value: (item) => grossFromNet(item.total, 23), type: "money" },
        { label: "Status", value: (item) => item.status },
        { label: "Płatność", value: (item) => rentalPaymentLabel(item.paymentStatus) },
        { label: "Pozycje", value: (item) => rentalItemsText(item.items) },
        { label: "Data zwrotu", value: (item) => item.returnedAt, type: "date" },
        { label: "Uwagi zwrotu", value: (item) => item.returnNotes },
        { label: "ID techniczne", value: (item) => item.id, type: "id" }
      ]
    },
    invoices: {
      file: "faktury",
      log: "Eksport faktur CSV",
      rows: () => state.invoices,
      columns: [
        { label: "Numer faktury", value: (item) => item.number, type: "text-forced" },
        { label: "Data", value: (item) => item.date, type: "date" },
        { label: "Nabywca", value: (item) => item.buyerName },
        { label: "Adres nabywcy", value: (item) => item.buyerAddress },
        { label: "NIP", value: (item) => item.buyerNip, type: "text-forced" },
        { label: "Netto", value: (item) => item.net, type: "money" },
        { label: "VAT", value: (item) => item.vat, type: "money-currency" },
        { label: "Brutto", value: (item) => item.gross, type: "money" },
        { label: "Status płatności", value: (item) => invoicePaymentStatusLabel(item.paymentStatus) },
        { label: "Forma płatności", value: (item) => invoicePaymentMethodLabel(item.paymentMethod) },
        { label: "Termin płatności", value: (item) => item.paymentDueDate, type: "date" },
        { label: "ID wypożyczenia", value: (item) => item.rentalId, type: "id" },
        { label: "Uwagi", value: (item) => item.notes },
        { label: "ID techniczne", value: (item) => item.id, type: "id" }
      ]
    },
    documents: {
      file: "dokumenty",
      log: "Eksport dokumentów CSV",
      rows: () => state.docs,
      columns: [
        { label: "Tytuł", value: (item) => item.title },
        { label: "Nadawca", value: (item) => item.sender },
        { label: "Typ", value: (item) => item.category },
        { label: "Data", value: (item) => item.date, type: "date" },
        { label: "Kwota wpływ", value: (item) => item.incomeAmount, type: "money" },
        { label: "Kwota wydatek", value: (item) => item.expenseAmount, type: "money" },
        { label: "Wydarzenie", value: (item) => item.eventName },
        { label: "Plik", value: (item) => item.fileName },
        { label: "Rozmiar pliku", value: (item) => item.fileSize },
        { label: "Notatka", value: (item) => item.notes },
        { label: "ID techniczne", value: (item) => item.id, type: "id" }
      ]
    },
    events: {
      file: "wydarzenia",
      log: "Eksport wydarzeń CSV",
      rows: () => state.events,
      columns: [
        { label: "Nazwa", value: (item) => item.name },
        { label: "Data", value: (item) => item.date, type: "date" },
        { label: "Miejsce", value: (item) => item.place },
        { label: "Notatki", value: (item) => item.notes },
        { label: "ID techniczne", value: (item) => item.id, type: "id" }
      ]
    }
  };
}

function boardMembers() {
  return state.members.filter((member) => (member.boardRole || "Brak") !== "Brak");
}

function rentalItemsText(items = []) {
  return items.map((item) => `${item.name} x ${item.quantity}`).join(", ");
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

function toggleMemberExportPanel() {
  elements.memberExportPanel.classList.toggle("hidden");
}

function exportMembersCsv() {
  const selectedFields = [...document.querySelectorAll(".member-export-field:checked")].map((input) => input.value);
  if (!selectedFields.length) {
    alert("Zaznacz przynajmniej jedną kolumnę do eksportu.");
    return;
  }

  const includeInactive = document.querySelector('input[name="memberExportScope"]:checked')?.value === "all";
  const feeRowsByName = new Map(feeMemberRows().map((row) => [row.name, row]));
  const columns = memberCsvColumns().filter((column) => selectedFields.includes(column.key));
  const members = state.members
    .filter((member) => includeInactive || (member.status || "Aktywny") === "Aktywny")
    .sort((a, b) => a.name.localeCompare(b.name));
  const rows = members.map((member) => {
    const feeRow = feeRowsByName.get(member.name);
    return columns.map((column) => csvValue(column.value(member, feeRow))).join(";");
  });
  const csv = "\uFEFF" + [columns.map((column) => csvValue(column.label)).join(";"), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "czlonkowie-kgigw.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function memberCsvColumns() {
  return [
    { key: "name", label: "Imię i nazwisko", value: (member) => member.name },
    { key: "phone", label: "Telefon", value: (member) => member.phone },
    { key: "email", label: "E-mail", value: (member) => member.email },
    { key: "status", label: "Status", value: (member) => member.status || "Aktywny" },
    { key: "boardRole", label: "Funkcja w kole", value: (member) => member.boardRole || "Brak" },
    { key: "feePaid", label: "Suma wpłat w bieżącym roku", value: (member, feeRow) => money(feeRow?.paid || 0) },
    { key: "feeStatus", label: "Status składek", value: (member, feeRow) => feeRow?.isLate ? "Zaległość" : "Opłacone" },
    { key: "paidUntil", label: "Opłacone do", value: (member, feeRow) => feeRow?.paid >= ANNUAL_FEE ? "Końca roku" : feeRow?.paidUntil || "Brak wpłat" },
    { key: "currentDue", label: "Zaległość", value: (member, feeRow) => money(feeRow?.currentDue || 0) }
  ];
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function adminExcelValue(value, type = "text") {
  if (["date", "phone", "id", "text-forced"].includes(type)) return excelCellValue(excelForcedText(excelDateOrText(value, type)));
  if (type === "money") return excelCellValue(excelForcedText(excelMoney(value)));
  if (type === "money-currency") return excelCellValue(excelForcedText(`${excelMoney(value)} zł`));
  if (type === "percent") return excelCellValue(excelForcedText(`${excelMoney(value)}%`));
  return excelCellValue(value);
}

function excelCellValue(value) {
  return String(value ?? "")
    .replaceAll("—", "brak")
    .replaceAll("\t", " ")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ")
    .trim();
}

function excelForcedText(value) {
  return `="${excelCellValue(value).replaceAll('"', '""')}"`;
}

function excelMoney(value) {
  const number = Number(value || 0);
  return number.toFixed(2).replace(".", ",");
}

function excelDateOrText(value, type) {
  if (type !== "date") return value ?? "";
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
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
