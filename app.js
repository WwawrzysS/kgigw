const STORAGE_KEY = "kgw-panel-data-v2-clean";
const AUTH_KEY = "kgigw-active-role";
const APP_VERSION = "2026.06.04-22";
const VERSION_KEY = "kgigw-app-version";
const ANNUAL_FEE = 120;
const QUARTER_FEE = 30;
const FEE_YEAR = new Date().getFullYear();
const DOCUMENT_BUCKET = "documents";
const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
const ACCOUNT_EMAILS = {
  admin: "wawrzysdom@gmail.com",
  administrator: "wawrzysdom@gmail.com",
  agata: "agatawawrzynek@go2.pl",
  tomek: "tomasztynski@gmail.com"
};
const ORGANIZATION = {
  name: "Koło Gospodyń i Gospodarzy Wiejskich we Włosani",
  street: "ul. Kamienna 2",
  city: "32-031 Włosań",
  nip: "9442293245",
  regon: "540913923",
  logo: "KGiGW.jpg"
};
const STAND_INVOICE_URL = "https://wwawrzyss.github.io/kgigw/stoisko/";
const STAND_INVOICE_DEFAULTS = {
  enabled: false,
  eventName: "Stoisko",
  contactPhone: "513518769",
  smsTemplate: "Dane do faktury zostaly przyjete. Faktura zostanie przeslana na e-mail: [EMAIL]. KGiGW we Wlosani. Dziekujemy / tel: [PHONE]",
  disabledMessage: "Strona zgłoszeń faktur jest obecnie wyłączona. Skontaktuj się z Administratorem KGiGW."
};
const DOC_SECTION_DEFAULT = "Dokumenty";
const DOC_SECTIONS = ["Dokumenty", "Dokumentacja KGiGW", "Wzory", "Notatki"];
const DOCUMENTATION_KGIGW_TYPES = ["Statut", "Uchwały", "Protokoły", "Sprawozdania", "Lista obecności", "Inne"];
const DOC_SECTION_TABS = {
  documents: "Dokumenty",
  documentation: "Dokumentacja KGiGW",
  templates: "Wzory",
  notes: "Notatki"
};

const starterData = {
  members: [],
  fees: [],
  money: [],
  fundingSources: [],
  events: [],
  kitchenEvents: [],
  rentalInventory: [
    { id: makeId(), name: "Komplet zastawy", quantity: 48, price: 10, replacementValue: null },
    { id: makeId(), name: "Talerz płytki", quantity: 48, price: 2, replacementValue: null },
    { id: makeId(), name: "Talerz głęboki", quantity: 48, price: 2, replacementValue: null },
    { id: makeId(), name: "Kubek", quantity: 48, price: 1, replacementValue: null },
    { id: makeId(), name: "Szklanka", quantity: 48, price: 1, replacementValue: null },
    { id: makeId(), name: "Nóż", quantity: 48, price: 0.5, replacementValue: null },
    { id: makeId(), name: "Widelec", quantity: 48, price: 0.5, replacementValue: null },
    { id: makeId(), name: "Obrus", quantity: 7, price: 5, replacementValue: null }
  ],
  rentalLoans: [],
  docs: [],
  invoices: [],
  invoiceRequests: [],
  board: [],
  auditLogs: [],
  organizationSettings: { ...STAND_INVOICE_DEFAULTS }
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
let editingInvoiceRequestId = "";
let pendingInvoiceRequestId = "";
let selectedKitchenEventId = "";

const titles = {
  dashboard: "Pulpit",
  members: "Członkowie",
  fees: "Składki",
  money: "Finanse",
  funding: "Źródła finansowania",
  events: "Wydarzenia",
  kitchen: "Kulinarne wspomnienia",
  rentals: "Wypożyczalnia",
  invoices: "Faktury",
  docs: "Dokumenty i poczta",
  info: "Informacje",
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
  globalSearchResults: document.querySelector("#globalSearchResults"),
  cashBalance: document.querySelector("#cashBalance"),
  unpaidInvoicesSummary: document.querySelector("#unpaidInvoicesSummary"),
  unpaidInvoicesList: document.querySelector("#unpaidInvoicesList"),
  lateFees: document.querySelector("#lateFees"),
  rentalCount: document.querySelector("#rentalCount"),
  dashboardTodayTitle: document.querySelector("#dashboardTodayTitle"),
  dashboardTodaySummary: document.querySelector("#dashboardTodaySummary"),
  dashboardFocus: document.querySelector("#dashboardFocus"),
  recentMoney: document.querySelector("#recentMoney"),
  upcomingEvents: document.querySelector("#upcomingEvents"),
  membersList: document.querySelector("#membersList"),
  memberDetails: document.querySelector("#memberDetails"),
  showInactiveMembers: document.querySelector("#showInactiveMembers"),
  memberStatusFilter: document.querySelector("#memberStatusFilter"),
  memberTypeFilter: document.querySelector("#memberTypeFilter"),
  memberRoleFilter: document.querySelector("#memberRoleFilter"),
  toggleMemberExport: document.querySelector("#toggleMemberExport"),
  memberExportPanel: document.querySelector("#memberExportPanel"),
  downloadMembersCsv: document.querySelector("#downloadMembersCsv"),
  memberFormTitle: document.querySelector("#memberFormTitle"),
  cancelMemberEdit: document.querySelector("#cancelMemberEdit"),
  feesList: document.querySelector("#feesList"),
  sendFeeSms: document.querySelector("#sendFeeSms"),
  printFees: document.querySelector("#printFees"),
  feePrintModal: document.querySelector("#feePrintModal"),
  feePrintCancel: document.querySelector("#feePrintCancel"),
  feePrintConfirm: document.querySelector("#feePrintConfirm"),
  feeSearch: document.querySelector("#feeSearch"),
  feeSort: document.querySelector("#feeSort"),
  feeStatusFilter: document.querySelector("#feeStatusFilter"),
  feeTypeFilter: document.querySelector("#feeTypeFilter"),
  feeMemberStatusFilter: document.querySelector("#feeMemberStatusFilter"),
  clearFeeFilters: document.querySelector("#clearFeeFilters"),
  moneyEvent: document.querySelector("#moneyEvent"),
  moneyFundingSource: document.querySelector("#moneyFundingSource"),
  moneySearch: document.querySelector("#moneySearch"),
  moneySort: document.querySelector("#moneySort"),
  moneyTypeFilter: document.querySelector("#moneyTypeFilter"),
  moneyStatusFilter: document.querySelector("#moneyStatusFilter"),
  moneyFundingFilter: document.querySelector("#moneyFundingFilter"),
  moneyEventFilter: document.querySelector("#moneyEventFilter"),
  clearMoneyFilters: document.querySelector("#clearMoneyFilters"),
  moneyFormTitle: document.querySelector("#moneyFormTitle"),
  cancelMoneyEdit: document.querySelector("#cancelMoneyEdit"),
  fundingFormTitle: document.querySelector("#fundingFormTitle"),
  cancelFundingEdit: document.querySelector("#cancelFundingEdit"),
  fundingSourcesList: document.querySelector("#fundingSourcesList"),
  fundingSearch: document.querySelector("#fundingSearch"),
  fundingSort: document.querySelector("#fundingSort"),
  fundingStatusFilter: document.querySelector("#fundingStatusFilter"),
  fundingTypeFilter: document.querySelector("#fundingTypeFilter"),
  clearFundingFilters: document.querySelector("#clearFundingFilters"),
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
  eventSearch: document.querySelector("#eventSearch"),
  eventSort: document.querySelector("#eventSort"),
  clearEventFilters: document.querySelector("#clearEventFilters"),
  kitchenListPanel: document.querySelector("#kitchenListPanel"),
  kitchenEventsList: document.querySelector("#kitchenEventsList"),
  kitchenSearch: document.querySelector("#kitchenSearch"),
  kitchenSort: document.querySelector("#kitchenSort"),
  clearKitchenFilters: document.querySelector("#clearKitchenFilters"),
  addKitchenEventButton: document.querySelector("#addKitchenEventButton"),
  kitchenEventFormPanel: document.querySelector("#kitchenEventFormPanel"),
  kitchenEventForm: document.querySelector("#kitchenEventForm"),
  kitchenEventFormTitle: document.querySelector("#kitchenEventFormTitle"),
  cancelKitchenEvent: document.querySelector("#cancelKitchenEvent"),
  kitchenDetailsPanel: document.querySelector("#kitchenDetailsPanel"),
  kitchenDetails: document.querySelector("#kitchenDetails"),
  kitchenItemFormPanel: document.querySelector("#kitchenItemFormPanel"),
  kitchenItemForm: document.querySelector("#kitchenItemForm"),
  kitchenItemFormTitle: document.querySelector("#kitchenItemFormTitle"),
  cancelKitchenItem: document.querySelector("#cancelKitchenItem"),
  inventoryAddForm: document.querySelector("#inventoryAddForm"),
  rentalInventory: document.querySelector("#rentalInventory"),
  rentalItemsForm: document.querySelector("#rentalItemsForm"),
  rentalDays: document.querySelector("#rentalDays"),
  rentalTotal: document.querySelector("#rentalTotal"),
  rentalsList: document.querySelector("#rentalsList"),
  invoiceRental: document.querySelector("#invoiceRental"),
  invoiceSearch: document.querySelector("#invoiceSearch"),
  invoiceSearchButton: document.querySelector("#invoiceSearchButton"),
  invoiceSort: document.querySelector("#invoiceSort"),
  invoicePaymentFilter: document.querySelector("#invoicePaymentFilter"),
  invoiceMethodFilter: document.querySelector("#invoiceMethodFilter"),
  invoiceRentalFilter: document.querySelector("#invoiceRentalFilter"),
  invoiceDateFrom: document.querySelector("#invoiceDateFrom"),
  invoiceDateTo: document.querySelector("#invoiceDateTo"),
  clearInvoiceFilters: document.querySelector("#clearInvoiceFilters"),
  invoicesList: document.querySelector("#invoicesList"),
  rentalReturnsList: document.querySelector("#rentalReturnsList"),
  rentalSubtabs: document.querySelectorAll("[data-rental-tab]"),
  rentalPanels: document.querySelectorAll("[data-rental-panel]"),
  docTabs: document.querySelectorAll("[data-doc-tab]"),
  docPanels: document.querySelectorAll("[data-doc-panel]"),
  infoPanels: document.querySelectorAll("[data-info-panel]"),
  printSheet: document.querySelector("#printSheet"),
  docsList: document.querySelector("#docsList"),
  documentationForm: document.querySelector("#documentationForm"),
  documentationFormTitle: document.querySelector("#documentationFormTitle"),
  clearDocumentationForm: document.querySelector("#clearDocumentationForm"),
  docsDocumentationList: document.querySelector("#docsDocumentationList"),
  documentationSearch: document.querySelector("#documentationSearch"),
  documentationKindFilter: document.querySelector("#documentationKindFilter"),
  documentationSort: document.querySelector("#documentationSort"),
  clearDocumentationFilters: document.querySelector("#clearDocumentationFilters"),
  templateForm: document.querySelector("#templateForm"),
  templateFormTitle: document.querySelector("#templateFormTitle"),
  clearTemplateForm: document.querySelector("#clearTemplateForm"),
  templateSearch: document.querySelector("#templateSearch"),
  templateCategoryFilter: document.querySelector("#templateCategoryFilter"),
  templateSort: document.querySelector("#templateSort"),
  clearTemplateFilters: document.querySelector("#clearTemplateFilters"),
  noteForm: document.querySelector("#noteForm"),
  noteFormTitle: document.querySelector("#noteFormTitle"),
  clearNoteForm: document.querySelector("#clearNoteForm"),
  noteSearch: document.querySelector("#noteSearch"),
  noteSort: document.querySelector("#noteSort"),
  clearNoteFilters: document.querySelector("#clearNoteFilters"),
  docsTemplatesList: document.querySelector("#docsTemplatesList"),
  docsNotesList: document.querySelector("#docsNotesList"),
  storageTexts: document.querySelectorAll("[data-storage-text]"),
  storageBars: document.querySelectorAll("[data-storage-bar]"),
  appVersion: document.querySelector("#appVersion"),
  boardList: document.querySelector("#boardList"),
  feeMember: document.querySelector("#feeMember"),
  mailboxInfo: document.querySelector("#mailboxInfo"),
  adminTabs: document.querySelectorAll("[data-admin-tab]"),
  adminPanels: document.querySelectorAll("[data-admin-panel]"),
  auditLogList: document.querySelector("#auditLogList"),
  standInvoiceForm: document.querySelector("#standInvoiceForm"),
  openStandInvoicePage: document.querySelector("#openStandInvoicePage"),
  standInvoiceUrl: document.querySelector("#standInvoiceUrl")
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
elements.memberStatusFilter?.addEventListener("change", renderMembers);
elements.memberTypeFilter?.addEventListener("change", renderMembers);
elements.memberRoleFilter?.addEventListener("change", renderMembers);
document.querySelector("#toggleMemberExport").addEventListener("click", toggleMemberExportPanel);
document.querySelector("#downloadMembersCsv").addEventListener("click", exportMembersCsv);
document.querySelector("#feeForm").addEventListener("submit", handleFee);
document.querySelector("#sendFeeSms").addEventListener("click", sendFeeSmsReminders);
elements.printFees?.addEventListener("click", openFeePrintModal);
elements.feePrintCancel?.addEventListener("click", closeFeePrintModal);
elements.feePrintModal?.addEventListener("click", (event) => {
  if (event.target === elements.feePrintModal) closeFeePrintModal();
});
elements.feePrintConfirm?.addEventListener("click", printFeesReport);
[
  elements.feeSearch,
  elements.feeSort,
  elements.feeStatusFilter,
  elements.feeTypeFilter,
  elements.feeMemberStatusFilter
].forEach((control) => control?.addEventListener("input", renderFees));
[
  elements.feeSort,
  elements.feeStatusFilter,
  elements.feeTypeFilter,
  elements.feeMemberStatusFilter
].forEach((control) => control?.addEventListener("change", renderFees));
elements.clearFeeFilters?.addEventListener("click", clearFeeFilters);
document.querySelector("#moneyForm").addEventListener("submit", handleMoney);
document.querySelector("#cancelMoneyEdit").addEventListener("click", cancelMoneyEdit);
[
  elements.moneySearch,
  elements.moneySort,
  elements.moneyTypeFilter,
  elements.moneyStatusFilter,
  elements.moneyFundingFilter,
  elements.moneyEventFilter
].forEach((control) => control?.addEventListener("input", renderMoney));
[
  elements.moneySort,
  elements.moneyTypeFilter,
  elements.moneyStatusFilter,
  elements.moneyFundingFilter,
  elements.moneyEventFilter
].forEach((control) => control?.addEventListener("change", renderMoney));
elements.clearMoneyFilters?.addEventListener("click", clearMoneyFilters);
document.querySelector("#fundingForm").addEventListener("submit", handleFundingSource);
document.querySelector("#cancelFundingEdit").addEventListener("click", cancelFundingEdit);
[
  elements.fundingSearch,
  elements.fundingSort,
  elements.fundingStatusFilter,
  elements.fundingTypeFilter
].forEach((control) => control?.addEventListener("input", renderFundingSources));
[
  elements.fundingSort,
  elements.fundingStatusFilter,
  elements.fundingTypeFilter
].forEach((control) => control?.addEventListener("change", renderFundingSources));
elements.clearFundingFilters?.addEventListener("click", clearFundingFilters);
document.querySelector("#printMoneyReport").addEventListener("click", printMoneyReport);
document.querySelector("#eventForm").addEventListener("submit", handleEvent);
[
  elements.eventSearch,
  elements.eventSort
].forEach((control) => control?.addEventListener("input", renderEvents));
elements.eventSort?.addEventListener("change", renderEvents);
elements.clearEventFilters?.addEventListener("click", clearEventFilters);
elements.addKitchenEventButton?.addEventListener("click", () => showKitchenEventForm());
elements.kitchenSearch?.addEventListener("input", renderKitchen);
elements.kitchenSort?.addEventListener("change", renderKitchen);
elements.clearKitchenFilters?.addEventListener("click", clearKitchenFilters);
elements.kitchenEventForm?.addEventListener("submit", handleKitchenEvent);
elements.cancelKitchenEvent?.addEventListener("click", hideKitchenEventForm);
elements.kitchenItemForm?.addEventListener("submit", handleKitchenItem);
elements.cancelKitchenItem?.addEventListener("click", hideKitchenItemForm);
document.querySelector("#inventoryAddForm").addEventListener("submit", handleInventoryAdd);
document.querySelector("#rentalForm").addEventListener("submit", handleRental);
document.querySelector("#rentalForm").addEventListener("input", updateRentalSummary);
document.querySelector("#docForm").addEventListener("submit", handleDoc);
document.querySelector("#cancelDocEdit").addEventListener("click", cancelDocEdit);
elements.documentationForm?.addEventListener("submit", handleDocumentationDoc);
elements.clearDocumentationForm?.addEventListener("click", () => resetDocumentationForm(elements.documentationForm));
[
  elements.documentationSearch,
  elements.documentationKindFilter,
  elements.documentationSort
].forEach((control) => control?.addEventListener("input", renderDocs));
[
  elements.documentationKindFilter,
  elements.documentationSort
].forEach((control) => control?.addEventListener("change", renderDocs));
elements.clearDocumentationFilters?.addEventListener("click", clearDocumentationFilters);
elements.templateForm?.addEventListener("submit", (event) => handleSectionDoc(event, "Wzory"));
elements.clearTemplateForm?.addEventListener("click", () => resetSectionDocForm(elements.templateForm, "Wzory"));
[
  elements.templateSearch,
  elements.templateCategoryFilter,
  elements.templateSort
].forEach((control) => control?.addEventListener("input", renderDocs));
[
  elements.templateCategoryFilter,
  elements.templateSort
].forEach((control) => control?.addEventListener("change", renderDocs));
elements.clearTemplateFilters?.addEventListener("click", () => clearSectionDocFilters("Wzory"));
elements.noteForm?.addEventListener("submit", (event) => handleSectionDoc(event, "Notatki"));
elements.clearNoteForm?.addEventListener("click", () => resetSectionDocForm(elements.noteForm, "Notatki"));
[
  elements.noteSearch,
  elements.noteSort
].forEach((control) => control?.addEventListener("input", renderDocs));
elements.noteSort?.addEventListener("change", renderDocs);
elements.clearNoteFilters?.addEventListener("click", () => clearSectionDocFilters("Notatki"));
document.querySelector("#invoiceForm").addEventListener("submit", handleInvoice);
document.querySelector("#invoiceRental").addEventListener("change", fillInvoiceFromRental);
[
  elements.invoiceSearch,
  elements.invoiceSort,
  elements.invoicePaymentFilter,
  elements.invoiceMethodFilter,
  elements.invoiceRentalFilter,
  elements.invoiceDateFrom,
  elements.invoiceDateTo
].forEach((control) => control?.addEventListener("input", renderInvoices));
elements.invoiceSearch?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    renderInvoices();
  }
});
elements.invoiceSearchButton?.addEventListener("click", renderInvoices);
[
  elements.invoiceSort,
  elements.invoicePaymentFilter,
  elements.invoiceMethodFilter,
  elements.invoiceRentalFilter,
  elements.invoiceDateFrom,
  elements.invoiceDateTo
].forEach((control) => control?.addEventListener("change", renderInvoices));
elements.clearInvoiceFilters?.addEventListener("click", clearInvoiceFilters);
document.querySelectorAll("[data-admin-export]").forEach((button) => {
  button.addEventListener("click", () => exportAdminData(button.dataset.adminExport));
});
elements.standInvoiceForm?.addEventListener("submit", handleStandInvoiceSettings);
elements.openStandInvoicePage?.addEventListener("click", () => window.open(STAND_INVOICE_URL, "_blank", "noopener"));
document.querySelector("#refreshProgram")?.addEventListener("click", refreshProgram);
document.querySelector("#sidebarRefreshProgram").addEventListener("click", refreshProgram);
document.querySelector("#showMailboxInfo").addEventListener("click", () => {
  elements.mailboxInfo.classList.toggle("hidden");
});
document.querySelector("#openMailboxWindow")?.addEventListener("click", openMailboxConfig);
document.addEventListener("click", handleCopyLinkClick);
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
    if (button.dataset.infoTab) switchInfoTab(button.dataset.infoTab);
    closeMobileMenu();
  });
});

elements.rentalSubtabs.forEach((button) => {
  button.addEventListener("click", () => switchRentalTab(button.dataset.rentalTab));
});

elements.docTabs.forEach((button) => {
  button.addEventListener("click", () => switchDocTab(button.dataset.docTab));
});

elements.adminTabs.forEach((button) => {
  button.addEventListener("click", () => switchAdminTab(button.dataset.adminTab));
});

elements.globalSearch.addEventListener("input", (event) => {
  query = normalizeSearchText(event.target.value);
  render();
});
elements.globalSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    query = normalizeSearchText(event.target.value);
    renderGlobalSearchResults();
  }
});
elements.globalSearch.addEventListener("search", (event) => {
  query = normalizeSearchText(event.target.value);
  render();
});

document.querySelector('input[name="date"]').valueAsDate = new Date();
document.querySelector('#feeForm input[name="period"]').value = FEE_YEAR;
document.querySelector('#eventForm input[name="date"]').valueAsDate = new Date();
const kitchenEventDateInput = document.querySelector('#kitchenEventForm input[name="date"]');
if (kitchenEventDateInput) kitchenEventDateInput.valueAsDate = new Date();
document.querySelector('#docForm input[name="date"]').valueAsDate = new Date();
document.querySelector('#documentationForm input[name="date"]').valueAsDate = new Date();
document.querySelector('#templateForm input[name="date"]').valueAsDate = new Date();
document.querySelector('#noteForm input[name="date"]').valueAsDate = new Date();
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
  const login = String(data.role || "").trim();
  const password = String(data.password || "").trim();
  const email = resolveLoginEmail(login);

  if (!supabaseClient || !email || !password) {
    elements.loginError.textContent = "Nie udało się zalogować. Sprawdź login i hasło.";
    return;
  }

  elements.loginError.textContent = "Sprawdzam konto...";
  const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error || !authData?.user) {
    console.error("Nie udało się zalogować przez Supabase Auth.", { login, email, error });
    elements.loginError.textContent = "Nie udało się zalogować. Sprawdź login i hasło.";
    return;
  }

  const profile = await loadAuthenticatedProfile(authData.user);
  if (!profile) {
    await supabaseClient.auth.signOut();
    elements.loginError.textContent = "Brak dostępu do tej strony. Skontaktuj się z administratorem.";
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
}

function normalizeAccountLogin(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

function resolveLoginEmail(value) {
  const login = String(value || "").trim();
  if (login.includes("@")) return login;
  return ACCOUNT_EMAILS[normalizeAccountLogin(login)] || "";
}

async function loadAuthenticatedProfile(user) {
  const userId = user?.id || "";
  const userEmail = user?.email || "";
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Nie udało się pobrać profilu użytkownika po ID.", { userId, userEmail, error });
    return null;
  }
  if (data) return data;

  const { data: emailProfile, error: emailError } = await supabaseClient
    .from("profiles")
    .select("id, display_name, role")
    .eq("email", userEmail)
    .maybeSingle();

  if (emailError) {
    console.error("Nie udało się pobrać profilu użytkownika po e-mailu.", { userId, userEmail, error: emailError });
    return null;
  }
  if (!emailProfile) {
    console.error("Brak profilu użytkownika w public.profiles.", { userId, userEmail });
  }
  return emailProfile || null;
}

async function logout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  clearLocalAuth();
}

function clearLocalAuth() {
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
    clearLocalAuth();
    return;
  }

  const profile = await loadAuthenticatedProfile(sessionData.session.user);
  if (!profile) {
    clearLocalAuth();
    return;
  }
  currentRole = profile.role;
  currentUserName = profile.display_name || roleName(profile.role);
  sessionStorage.setItem(AUTH_KEY, currentRole);
  sessionStorage.setItem("kgigw-user-name", currentUserName);
  elements.currentRole.textContent = `${currentUserName} (${roleName(currentRole)})`;
  document.body.classList.remove("locked");
  applyRole();

  let [membersResult, feesResult, inventoryResult, rentalsResult, eventsResult, kitchenEventsResult, fundingSourcesResult, moneyResult, docsResult, invoicesResult, invoiceRequestsResult, settingsResult] = await Promise.all([
    loadSupabaseResult("members", supabaseClient
      .from("members")
      .select("id, name, phone, email, status, membership_type, board_role, created_at")
      .order("name", { ascending: true })),
    loadSupabaseResult("fees", supabaseClient
      .from("fees")
      .select("id, member_id, year, amount, note, paid_at, created_at")
      .order("paid_at", { ascending: false })),
    loadSupabaseResult("rental_inventory", supabaseClient
      .from("rental_inventory")
      .select("id, name, quantity, price_per_day, replacement_value")
      .order("name", { ascending: true })),
    loadSupabaseResult("rentals", supabaseClient
      .from("rentals")
      .select("id, first_name, last_name, phone, date_from, date_to, days, total, status, notes, returned_at, return_notes, damage_cost, payment_status, payment_method, paid_at, payment_transaction_id, created_at, rental_lines(id, inventory_id, item_name, quantity, price_per_day, returned, damaged, missing)")
      .order("date_from", { ascending: false })),
    loadSupabaseResult("events", supabaseClient
      .from("events")
      .select("id, name, event_date, place, notes")
      .order("event_date", { ascending: true })),
    loadSupabaseResult("kitchen_events", supabaseClient
      .from("kitchen_events")
      .select("id, event_name, event_date, place, notes, created_at, updated_at, kitchen_event_items(id, event_id, item_name, quantity, ingredients, enough_status, notes, created_at, updated_at)")
      .order("event_date", { ascending: false })),
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
      .select("id, title, sender, category, document_section, document_date, notes, file_path, file_name, file_size, mime_type, event_id, funding_source_id, transaction_id")
      .order("document_date", { ascending: false })),
    loadSupabaseResult("invoices", supabaseClient
      .from("invoices")
      .select("id, number, invoice_date, buyer_name, buyer_address, buyer_nip, source, item_name, quantity, unit_price, vat_rate, net, vat, gross, rental_id, notes, payment_status, payment_method, paid_at, payment_transaction_id, payment_due_date, bank_account")
      .order("invoice_date", { ascending: false })),
    loadSupabaseResult("invoice_requests", supabaseClient
      .from("invoice_requests")
      .select("id, created_at, buyer_name, buyer_nip, buyer_address, buyer_email, buyer_phone, item_description, amount_brutto, payment_method, notes, status, source, event_name, created_by")
      .order("created_at", { ascending: false })),
    loadSupabaseResult("organization_settings", supabaseClient
      .from("organization_settings")
      .select("id, stand_invoice_enabled, stand_invoice_event_name, stand_invoice_contact_phone, stand_invoice_sms_template, stand_invoice_disabled_message, updated_at")
      .limit(1)
      .maybeSingle())
  ]);

  if (membersResult.error) {
    console.error("Nie udało się pobrać członków z polem membership_type. Próba pobrania podstawowego widoku.", membersResult.error);
    const fallbackMembers = await loadSupabaseResult("members fallback", supabaseClient
      .from("members")
      .select("id, name, phone, email, status, board_role, created_at")
      .order("name", { ascending: true }));
    if (!fallbackMembers.error) membersResult = fallbackMembers;
  }

  if (rentalsResult.error) {
    console.error("Nie udało się pobrać wypożyczeń z nowymi polami płatności. Próba pobrania podstawowego widoku.", rentalsResult.error);
    const fallbackRentals = await loadSupabaseResult("rentals fallback", supabaseClient
      .from("rentals")
      .select("id, first_name, last_name, phone, date_from, date_to, days, total, status, notes, returned_at, return_notes, damage_cost, created_at, rental_lines(id, inventory_id, item_name, quantity, price_per_day, returned, damaged, missing)")
      .order("date_from", { ascending: false }));
    if (!fallbackRentals.error) rentalsResult = fallbackRentals;
  }

  if (inventoryResult.error) {
    console.error("Nie udało się pobrać magazynu z polem replacement_value. Próba pobrania podstawowego widoku.", inventoryResult.error);
    const fallbackInventory = await loadSupabaseResult("rental_inventory fallback", supabaseClient
      .from("rental_inventory")
      .select("id, name, quantity, price_per_day")
      .order("name", { ascending: true }));
    if (!fallbackInventory.error) inventoryResult = fallbackInventory;
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

  if (docsResult.error) {
    console.error("Nie udało się pobrać dokumentów z polem document_section. Próba pobrania podstawowego widoku.", docsResult.error);
    const fallbackDocs = await loadSupabaseResult("documents fallback", supabaseClient
      .from("documents")
      .select("id, title, sender, category, document_date, notes, file_path, file_name, file_size, mime_type, event_id, funding_source_id, transaction_id")
      .order("document_date", { ascending: false }));
    if (!fallbackDocs.error) docsResult = fallbackDocs;
  }

  logSupabaseLoadError("członków", membersResult.error);
  logSupabaseLoadError("składek", feesResult.error);
  logSupabaseLoadError("magazynu", inventoryResult.error);
  logSupabaseLoadError("wypożyczeń", rentalsResult.error);
  logSupabaseLoadError("wydarzeń", eventsResult.error);
  logSupabaseLoadError("kulinarnych wspomnień", kitchenEventsResult.error);
  logSupabaseLoadError("źródeł finansowania", fundingSourcesResult.error);
  if (fundingSourcesResult.error) {
    console.error("Nie udało się pobrać funding_sources. Lista źródeł w Finansach pokaże tylko opcję Bez źródła.", fundingSourcesResult.error);
  }
  logSupabaseLoadError("Finansów", moneyResult.error);
  logSupabaseLoadError("dokumentów", docsResult.error);
  logSupabaseLoadError("faktur", invoicesResult.error);
  logSupabaseLoadError("zgłoszeń faktur ze stoiska", invoiceRequestsResult.error);
  logSupabaseLoadError("ustawień strony stoiska", settingsResult.error);
  if (invoiceRequestsResult.error) {
    console.error("Nie udało się pobrać zgłoszeń ze stoiska z public.invoice_requests. Faktury będą działały dalej.", invoiceRequestsResult.error);
  }
  if (!membersResult.error) state.members = (membersResult.data || []).map((member) => ({
    id: member.id,
    name: member.name,
    phone: member.phone || "",
    email: member.email || "",
    status: member.status || "Aktywny",
    membershipType: member.membership_type || "Zwyczajny",
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
    price: Number(item.price_per_day || 0),
    replacementValue: item.replacement_value === null || item.replacement_value === undefined ? null : Number(item.replacement_value || 0)
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

  if (!kitchenEventsResult.error) state.kitchenEvents = (kitchenEventsResult.data || []).map(kitchenEventFromSupabase);

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
    section: normalizeDocSection(doc.document_section),
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

  if (!invoiceRequestsResult.error) state.invoiceRequests = (invoiceRequestsResult.data || []).map((request) => ({
    id: request.id,
    createdAt: request.created_at || "",
    date: request.created_at ? request.created_at.slice(0, 10) : "",
    buyerName: request.buyer_name || "",
    buyerNip: request.buyer_nip || "",
    buyerAddress: request.buyer_address || "",
    buyerEmail: request.buyer_email || "",
    buyerPhone: request.buyer_phone || "",
    itemDescription: request.item_description || "",
    gross: Number(request.amount_brutto || 0),
    paymentMethod: request.payment_method || "",
    notes: request.notes || "",
    status: request.status || "do_wystawienia",
    source: request.source || "stoisko",
    eventName: request.event_name || "",
    createdBy: request.created_by || ""
  }));

  if (!settingsResult.error && settingsResult.data) {
    state.organizationSettings = normalizeStandInvoiceSettings(settingsResult.data);
  }

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

function kitchenEventFromSupabase(event) {
  return {
    id: event.id,
    name: event.event_name || "",
    date: event.event_date || "",
    place: event.place || "",
    notes: event.notes || "",
    createdAt: event.created_at || "",
    updatedAt: event.updated_at || "",
    items: (event.kitchen_event_items || []).map(kitchenItemFromSupabase)
  };
}

function kitchenItemFromSupabase(item) {
  return {
    id: item.id,
    eventId: item.event_id,
    itemName: item.item_name || "",
    quantity: item.quantity || "",
    ingredients: item.ingredients || "",
    enoughStatus: item.enough_status || "Nie wiadomo",
    notes: item.notes || "",
    createdAt: item.created_at || "",
    updatedAt: item.updated_at || ""
  };
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

async function handleStandInvoiceSettings(event) {
  event.preventDefault();
  if (!isAdmin()) {
    alert("Te ustawienia może zmieniać tylko Administrator.");
    return;
  }
  if (!supabaseClient || !currentRole) {
    alert("Brak połączenia z Supabase. Nie można zapisać ustawień strony stoiska.");
    return;
  }

  const data = formData(event.target);
  const payload = {
    stand_invoice_enabled: data.enabled === "true",
    stand_invoice_event_name: String(data.eventName || "").trim() || STAND_INVOICE_DEFAULTS.eventName,
    stand_invoice_contact_phone: String(data.contactPhone || "").trim() || STAND_INVOICE_DEFAULTS.contactPhone,
    stand_invoice_sms_template: String(data.smsTemplate || "").trim() || STAND_INVOICE_DEFAULTS.smsTemplate,
    stand_invoice_disabled_message: String(data.disabledMessage || "").trim() || STAND_INVOICE_DEFAULTS.disabledMessage,
    updated_at: new Date().toISOString()
  };

  const settingsId = state.organizationSettings?.id || "";
  const result = settingsId
    ? await supabaseClient.from("organization_settings").update(payload).eq("id", settingsId)
    : await supabaseClient.from("organization_settings").insert(payload).select("id").single();

  if (result.error) {
    console.error("Nie udało się zapisać ustawień strony stoiska w public.organization_settings.", {
      payload,
      error: result.error
    });
    alert(`Nie udało się zapisać ustawień strony stoiska: ${result.error.message}`);
    return;
  }

  state.organizationSettings = normalizeStandInvoiceSettings({
    id: settingsId || result.data?.id || "",
    ...payload
  });
  await logActivity("Administracja", "Zmiana ustawień strony stoiska", {
    summary: `${payload.stand_invoice_enabled ? "aktywna" : "nieaktywna"} - ${payload.stand_invoice_event_name}`
  });
  saveState();
  renderStandInvoiceSettings();
  showToast("Zapisano ustawienia strony stoiska");
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
  if (view === "info") switchInfoTab("board");
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
  if (tabName === "stand-invoice") renderStandInvoiceSettings();
}

function switchDocTab(tabName) {
  elements.docPanels.forEach((panel) => {
    const active = panel.dataset.docPanel === tabName;
    panel.classList.toggle("active-doc-panel", active);
    panel.hidden = !active;
    panel.style.display = active ? "" : "none";
  });
  elements.docTabs.forEach((item) => {
    item.classList.toggle("active", item.dataset.docTab === tabName);
  });
}

function switchInfoTab(tabName) {
  elements.infoPanels.forEach((panel) => {
    const active = panel.dataset.infoPanel === tabName;
    panel.classList.toggle("active-info-panel", active);
    panel.hidden = !active;
    panel.style.display = active ? "" : "none";
  });
  elements.navSubitems.forEach((item) => {
    if (!item.dataset.infoTab) return;
    item.classList.toggle("active", item.dataset.infoTab === tabName);
  });
}

async function handleMember(event) {
  event.preventDefault();
  const data = formData(event.target);
  const memberId = data.id || "";
  data.membershipType = data.membershipType || "Zwyczajny";
  data.boardRole = data.boardRole || "Brak";
  const existingMember = memberId ? state.members.find((entry) => entry.id === memberId) : null;
  const memberMessage = memberId ? "Zapisano zmiany członka" : "Zapisano członka";
  if (supabaseClient && currentRole) {
    const payload = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      status: data.status || "Aktywny",
      membership_type: data.membershipType || "Zwyczajny",
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
    await logMemberChanges(existingMember, data, memberId);
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
    logMemberChanges(existingMember, data, memberId);
    showToast(memberMessage);
    return;
  }
  delete data.id;
  state.members.push({ id: makeId(), ...data });
  finishForm(event.target);
  logMemberChanges(null, data, "");
  showToast(memberMessage);
}

async function logMemberChanges(previous, data, memberId) {
  const summary = `${data.name} - typ: ${data.membershipType || "Zwyczajny"} - funkcja: ${data.boardRole || "Brak"}`;
  if (!memberId) {
    await logActivity("Członkowie", "Dodanie członka z typem członkostwa i funkcją", { summary });
    return;
  }
  await logActivity("Członkowie", "Edycja członka", { summary: data.name });
  if (previous && (previous.membershipType || "Zwyczajny") !== (data.membershipType || "Zwyczajny")) {
    await logActivity("Członkowie", "Zmiana typu członkostwa", { summary: `${data.name} - z ${previous.membershipType || "Zwyczajny"} na ${data.membershipType || "Zwyczajny"}` });
  }
  if (previous && (previous.boardRole || "Brak") !== (data.boardRole || "Brak")) {
    await logActivity("Członkowie", "Zmiana funkcji w kole", { summary: `${data.name} - z ${previous.boardRole || "Brak"} na ${data.boardRole || "Brak"}` });
  }
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
  const paidAmount = Number(data.amount);
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
    alert("Wpisz kwotę wpłaty większą niż 0 zł.");
    return;
  }
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

async function handleKitchenEvent(event) {
  event.preventDefault();
  if (!canCorrect()) return;
  const form = event.target;
  const data = formData(form);
  const eventId = data.id || "";
  const payload = {
    event_name: data.name,
    event_date: data.date || null,
    place: data.place || null,
    notes: data.notes || null,
    updated_at: new Date().toISOString()
  };

  if (supabaseClient && currentRole) {
    if (eventId) {
      const { error } = await supabaseClient.from("kitchen_events").update(payload).eq("id", eventId);
      if (error) {
        alert(`Nie udało się zapisać imprezy w Supabase: ${error.message}`);
        return;
      }
      await logActivity("Kulinarne wspomnienia", "Edycja imprezy kulinarnej", { summary: data.name });
    } else {
      const { error } = await supabaseClient.from("kitchen_events").insert(payload);
      if (error) {
        alert(`Nie udało się dodać imprezy w Supabase: ${error.message}`);
        return;
      }
      await logActivity("Kulinarne wspomnienia", "Dodanie imprezy kulinarnej", { summary: data.name });
    }
    hideKitchenEventForm();
    await refreshSupabaseData();
    showToast(eventId ? "Zapisano imprezę" : "Dodano imprezę");
    return;
  }

  if (eventId) {
    const item = state.kitchenEvents.find((entry) => entry.id === eventId);
    if (item) Object.assign(item, {
      name: data.name,
      date: data.date || "",
      place: data.place || "",
      notes: data.notes || "",
      updatedAt: new Date().toISOString()
    });
    logActivity("Kulinarne wspomnienia", "Edycja imprezy kulinarnej", { summary: data.name });
  } else {
    state.kitchenEvents.push({
      id: makeId(),
      name: data.name,
      date: data.date || "",
      place: data.place || "",
      notes: data.notes || "",
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    logActivity("Kulinarne wspomnienia", "Dodanie imprezy kulinarnej", { summary: data.name });
  }
  hideKitchenEventForm();
  saveState();
  renderKitchen();
  showToast(eventId ? "Zapisano imprezę" : "Dodano imprezę");
}

async function handleKitchenItem(event) {
  event.preventDefault();
  if (!canCorrect()) return;
  const form = event.target;
  const data = formData(form);
  const eventId = data.eventId || selectedKitchenEventId;
  const parent = state.kitchenEvents.find((entry) => entry.id === eventId);
  if (!parent) return;
  const itemId = data.id || "";
  const payload = {
    event_id: eventId,
    item_name: data.itemName,
    quantity: data.quantity || null,
    ingredients: data.ingredients || null,
    enough_status: data.enoughStatus || "Nie wiadomo",
    notes: data.notes || null,
    updated_at: new Date().toISOString()
  };

  if (supabaseClient && currentRole) {
    if (itemId) {
      const { error } = await supabaseClient.from("kitchen_event_items").update(payload).eq("id", itemId);
      if (error) {
        alert(`Nie udało się zapisać potrawy w Supabase: ${error.message}`);
        return;
      }
      await logActivity("Kulinarne wspomnienia", "Edycja potrawy", { summary: `${parent.name} - ${data.itemName}` });
    } else {
      const { error } = await supabaseClient.from("kitchen_event_items").insert(payload);
      if (error) {
        alert(`Nie udało się dodać potrawy w Supabase: ${error.message}`);
        return;
      }
      await logActivity("Kulinarne wspomnienia", "Dodanie potrawy", { summary: `${parent.name} - ${data.itemName}` });
    }
    hideKitchenItemForm();
    await refreshSupabaseData();
    selectedKitchenEventId = eventId;
    renderKitchenDetails();
    showToast(itemId ? "Zapisano potrawę" : "Dodano potrawę");
    return;
  }

  if (itemId) {
    const item = parent.items.find((entry) => entry.id === itemId);
    if (item) Object.assign(item, {
      itemName: data.itemName,
      quantity: data.quantity || "",
      ingredients: data.ingredients || "",
      enoughStatus: data.enoughStatus || "Nie wiadomo",
      notes: data.notes || "",
      updatedAt: new Date().toISOString()
    });
    logActivity("Kulinarne wspomnienia", "Edycja potrawy", { summary: `${parent.name} - ${data.itemName}` });
  } else {
    parent.items.push({
      id: makeId(),
      eventId,
      itemName: data.itemName,
      quantity: data.quantity || "",
      ingredients: data.ingredients || "",
      enoughStatus: data.enoughStatus || "Nie wiadomo",
      notes: data.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    logActivity("Kulinarne wspomnienia", "Dodanie potrawy", { summary: `${parent.name} - ${data.itemName}` });
  }
  hideKitchenItemForm();
  saveState();
  renderKitchen();
  renderKitchenDetails();
  showToast(itemId ? "Zapisano potrawę" : "Dodano potrawę");
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
  data.section = normalizeDocSection(data.section);
  const oldFundingName = fundingSourceName(existingDoc?.fundingSourceId);
  const newFundingName = fundingSourceName(data.fundingSourceId);
  const fundingChanged = docId && (existingDoc?.fundingSourceId || "") !== (data.fundingSourceId || "");
  const oldDocSection = normalizeDocSection(existingDoc?.section);
  const sectionChanged = docId && oldDocSection !== data.section;
  const shouldAddExpense = !docId && data.documentMoneyAction === "add_expense";
  const documentExpenseAmount = Number(data.expenseAmount || 0);
  const file = event.target.file.files[0];
  if (file && file.type !== "application/pdf") {
    alert("Można dodać tylko plik PDF.");
    return;
  }
  if (shouldAddExpense && documentExpenseAmount <= 0) {
    alert("Wpisz kwotę większą niż 0 w polu Kwota - wydatek, żeby dodać wydatek do Finansów.");
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
      document_section: data.section,
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
    if (shouldAddExpense) {
      const { data: savedExpense, error: expenseError } = await supabaseClient
        .from("transactions")
        .insert({
          type: "expense",
          title: data.title,
          category: data.category || "Dokument",
          amount: documentExpenseAmount,
          transaction_date: data.date,
          event_id: data.eventId || null,
          funding_source_id: data.fundingSourceId || null,
          source_type: "document_expense",
          source_id: savedDoc.id
        })
        .select("id")
        .single();
      if (expenseError) {
        alert(`Dokument zapisano, ale nie udało się dodać wydatku do Finansów: ${expenseError.message}`);
        await logActivity("Dokumenty", "Dodanie dokumentu z sekcją/kategorią", { summary: docLogSummary(data) });
        await refreshSupabaseData();
        return;
      }
      const { error: linkError } = await supabaseClient
        .from("documents")
        .update({ transaction_id: savedExpense.id })
        .eq("id", savedDoc.id);
      if (linkError) {
        alert(`Wydatek dodano do Finansów, ale nie udało się powiązać go z dokumentem: ${linkError.message}`);
        await logActivity("Dokumenty", "Dodanie wydatku z dokumentu", { summary: `${data.title} - ${money(documentExpenseAmount)}` });
        await refreshSupabaseData();
        return;
      }
      await logActivity("Finanse", "Dodanie wydatku z dokumentu", { summary: `${data.title} - ${money(documentExpenseAmount)}${newFundingName !== "Bez źródła" ? ` - Źródło: ${newFundingName}` : ""}` });
      await logActivity("Dokumenty", "Powiązanie dokumentu z wpisem Finansów", { summary: `${data.title} - ${money(documentExpenseAmount)}` });
    }
    resetDocForm(event.target);
    if (fundingChanged) {
      await logActivity("Dokumenty", "Zmiana źródła finansowania dokumentu", { summary: `${data.title} - z ${oldFundingName} na ${newFundingName}` });
    }
    if (sectionChanged) {
      await logActivity("Dokumenty", "Zmiana sekcji/kategorii dokumentu", { summary: `${data.title} - z ${oldDocSection} na ${data.section}` });
    }
    if (!fundingChanged && !sectionChanged) {
      await logActivity("Dokumenty", docId ? "Edycja dokumentu" : "Dodanie dokumentu z sekcją/kategorią", { summary: docLogSummary(data) });
    }
    await refreshSupabaseData();
    showToast(shouldAddExpense ? "Zapisano dokument i dodano wydatek do Finansów" : "Zapisano dokument");
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
      section: data.section,
      fundingSourceId: data.fundingSourceId || "",
      fundingSourceName: newFundingName,
      attachment: attachment || doc.attachment
    });
    resetDocForm(event.target);
    saveState();
    render();
    if (fundingChanged) {
      logActivity("Dokumenty", "Zmiana źródła finansowania dokumentu", { summary: `${data.title} - z ${oldFundingName} na ${newFundingName}` });
    }
    if (sectionChanged) {
      logActivity("Dokumenty", "Zmiana sekcji/kategorii dokumentu", { summary: `${data.title} - z ${oldDocSection} na ${data.section}` });
    }
    if (!fundingChanged && !sectionChanged) {
      logActivity("Dokumenty", "Edycja dokumentu", { summary: docLogSummary(data) });
    }
    showToast("Zapisano dokument");
    return;
  }
  const localDocId = makeId();
  let transactionId = "";
  if (shouldAddExpense) {
    transactionId = makeId();
    state.money.push({
      id: transactionId,
      type: "expense",
      title: data.title,
      category: data.category || "Dokument",
      amount: documentExpenseAmount,
      date: data.date,
      eventId: data.eventId || "",
      eventName: state.events.find((eventItem) => eventItem.id === data.eventId)?.name || "",
      fundingSourceId: data.fundingSourceId || "",
      fundingSourceName: newFundingName,
      status: "active",
      sourceType: "document_expense",
      sourceId: localDocId
    });
    logActivity("Finanse", "Dodanie wydatku z dokumentu", { summary: `${data.title} - ${money(documentExpenseAmount)}${newFundingName !== "Bez źródła" ? ` - Źródło: ${newFundingName}` : ""}` });
    logActivity("Dokumenty", "Powiązanie dokumentu z wpisem Finansów", { summary: `${data.title} - ${money(documentExpenseAmount)}` });
  }
  state.docs.push({ id: localDocId, ...data, section: data.section, fundingSourceId: data.fundingSourceId || "", fundingSourceName: newFundingName, transactionId, attachment });
  finishForm(event.target);
  event.target.date.valueAsDate = new Date();
  logActivity("Dokumenty", "Dodanie dokumentu z sekcją/kategorią", { summary: docLogSummary(data) });
  showToast(shouldAddExpense ? "Zapisano dokument i dodano wydatek do Finansów" : "Zapisano dokument");
}

async function handleDocumentationDoc(event) {
  event.preventDefault();
  if (!canCorrect()) {
    alert("Dodawanie i edycja dokumentacji jest dostępna tylko dla osób z uprawnieniami.");
    return;
  }
  const form = event.target;
  const data = formData(form);
  const docId = data.id || "";
  const file = form.file.files[0];
  if (file && file.type !== "application/pdf") {
    alert("Można dodać tylko plik PDF.");
    return;
  }
  const kind = DOCUMENTATION_KGIGW_TYPES.includes(data.kind) ? data.kind : "Statut";
  let filePath = "";
  let fileName = "";
  let fileSize = 0;
  let mimeType = "";

  if (supabaseClient && currentRole) {
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
      sender: "KGiGW",
      category: kind,
      document_section: "Dokumentacja KGiGW",
      document_date: data.date,
      notes: data.notes || null
    };
    if (file) {
      payload.file_path = filePath || null;
      payload.file_name = fileName || null;
      payload.file_size = fileSize || null;
      payload.mime_type = mimeType || null;
    }
    const { error } = docId
      ? await supabaseClient.from("documents").update(payload).eq("id", docId)
      : await supabaseClient.from("documents").insert(payload);
    if (error) {
      alert(`Nie udało się zapisać dokumentacji KGiGW: ${error.message}`);
      return;
    }
    await logActivity("Dokumenty", docId ? "Edycja dokumentacji KGiGW" : "Dodanie dokumentacji KGiGW", {
      summary: `${data.title} - ${kind}`
    });
    resetDocumentationForm(form);
    await refreshSupabaseData();
    showToast(docId ? "Zapisano zmiany dokumentacji" : "Zapisano dokumentację KGiGW");
    return;
  }

  const attachment = file ? await readPdfAttachment(file) : null;
  if (docId) {
    const doc = state.docs.find((item) => item.id === docId);
    if (doc) Object.assign(doc, {
      title: data.title,
      sender: "KGiGW",
      category: kind,
      section: "Dokumentacja KGiGW",
      date: data.date,
      notes: data.notes || "",
      attachment: attachment || doc.attachment
    });
  } else {
    state.docs.push({
      id: makeId(),
      title: data.title,
      sender: "KGiGW",
      category: kind,
      section: "Dokumentacja KGiGW",
      date: data.date,
      notes: data.notes || "",
      attachment
    });
  }
  saveState();
  resetDocumentationForm(form);
  renderDocs();
  logActivity("Dokumenty", docId ? "Edycja dokumentacji KGiGW" : "Dodanie dokumentacji KGiGW", {
    summary: `${data.title} - ${kind}`
  });
  showToast(docId ? "Zapisano zmiany dokumentacji" : "Zapisano dokumentację KGiGW");
}

async function handleSectionDoc(event, sectionName) {
  event.preventDefault();
  if (!canCorrect()) {
    alert("Dodawanie i edycja dokumentów jest dostępna tylko dla osób z uprawnieniami.");
    return;
  }
  const form = event.target;
  const data = formData(form);
  const docId = data.id || "";
  const file = form.file.files[0];
  if (file && file.type !== "application/pdf") {
    alert("Można dodać tylko plik PDF.");
    return;
  }
  const category = data.category || (sectionName === "Notatki" ? "Notatka" : "Inne");
  const singular = sectionName === "Wzory" ? "wzór" : "notatkę";
  const singularTitle = sectionName === "Wzory" ? "wzoru" : "notatki";
  let filePath = "";
  let fileName = "";
  let fileSize = 0;
  let mimeType = "";

  if (supabaseClient && currentRole) {
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
      sender: "KGiGW",
      category,
      document_section: sectionName,
      document_date: data.date,
      notes: data.notes || null
    };
    if (file) {
      payload.file_path = filePath || null;
      payload.file_name = fileName || null;
      payload.file_size = fileSize || null;
      payload.mime_type = mimeType || null;
    }
    const { error } = docId
      ? await supabaseClient.from("documents").update(payload).eq("id", docId)
      : await supabaseClient.from("documents").insert(payload);
    if (error) {
      alert(`Nie udało się zapisać ${singularTitle}: ${error.message}`);
      return;
    }
    await logActivity("Dokumenty", docId ? `Edycja ${singularTitle}` : `Dodanie ${singularTitle}`, {
      summary: `${data.title} - ${category}`
    });
    resetSectionDocForm(form, sectionName);
    await refreshSupabaseData();
    showToast(docId ? `Zapisano zmiany ${singularTitle}` : `Zapisano ${singular}`);
    return;
  }

  const attachment = file ? await readPdfAttachment(file) : null;
  if (docId) {
    const doc = state.docs.find((item) => item.id === docId);
    if (doc) Object.assign(doc, {
      title: data.title,
      sender: "KGiGW",
      category,
      section: sectionName,
      date: data.date,
      notes: data.notes || "",
      attachment: attachment || doc.attachment
    });
  } else {
    state.docs.push({
      id: makeId(),
      title: data.title,
      sender: "KGiGW",
      category,
      section: sectionName,
      date: data.date,
      notes: data.notes || "",
      attachment
    });
  }
  saveState();
  resetSectionDocForm(form, sectionName);
  renderDocs();
  logActivity("Dokumenty", docId ? `Edycja ${singularTitle}` : `Dodanie ${singularTitle}`, {
    summary: `${data.title} - ${category}`
  });
  showToast(docId ? `Zapisano zmiany ${singularTitle}` : `Zapisano ${singular}`);
}

async function handleInvoice(event) {
  event.preventDefault();
  const data = formData(event.target);
  const sourceRequest = pendingInvoiceRequestId ? state.invoiceRequests.find((entry) => entry.id === pendingInvoiceRequestId) : null;
  if (sourceRequest?.status === "wystawiona") {
    alert("Z tego zgłoszenia faktura została już przygotowana. Nie można utworzyć drugiej faktury z tego samego zgłoszenia.");
    pendingInvoiceRequestId = "";
    return;
  }
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
    if (sourceRequest) {
      const requestUpdate = await supabaseClient
        .from("invoice_requests")
        .update({ status: "wystawiona" })
        .eq("id", sourceRequest.id);
      if (requestUpdate.error) {
        console.error("Faktura została zapisana, ale nie udało się oznaczyć zgłoszenia jako wystawione.", requestUpdate.error);
        showToast("Faktura zapisana, ale zgłoszenie nie zmieniło statusu", "error");
      } else {
        await logActivity("Faktury", "Utworzenie faktury ze zgłoszenia", { summary: `${sourceRequest.buyerName || "Brak nabywcy"} - ${money(invoice.gross)}` });
        await logActivity("Faktury", "Zmiana statusu zgłoszenia ze stoiska", { summary: `${sourceRequest.buyerName || "Brak nabywcy"} - Wystawiona` });
      }
      pendingInvoiceRequestId = "";
    }
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
  if (sourceRequest) {
    sourceRequest.status = "wystawiona";
    logActivity("Faktury", "Utworzenie faktury ze zgłoszenia", { summary: `${sourceRequest.buyerName || "Brak nabywcy"} - ${money(invoice.gross)}` });
    logActivity("Faktury", "Zmiana statusu zgłoszenia ze stoiska", { summary: `${sourceRequest.buyerName || "Brak nabywcy"} - Wystawiona` });
    pendingInvoiceRequestId = "";
  }
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

function normalizeStandInvoiceSettings(row = {}) {
  return {
    id: row.id || "",
    enabled: Boolean(row.stand_invoice_enabled),
    eventName: row.stand_invoice_event_name || STAND_INVOICE_DEFAULTS.eventName,
    contactPhone: row.stand_invoice_contact_phone || STAND_INVOICE_DEFAULTS.contactPhone,
    smsTemplate: row.stand_invoice_sms_template || STAND_INVOICE_DEFAULTS.smsTemplate,
    disabledMessage: row.stand_invoice_disabled_message || STAND_INVOICE_DEFAULTS.disabledMessage
  };
}

function currentStandInvoiceSettings() {
  return {
    ...STAND_INVOICE_DEFAULTS,
    ...(state.organizationSettings || {})
  };
}

function render() {
  renderDashboard();
  renderMembers();
  renderFees();
  renderMoney();
  renderFundingSources();
  renderFundingDetails();
  renderEvents();
  renderKitchen();
  renderRentals();
  renderDocs();
  renderInvoices();
  renderBoard();
  renderAuditLogs();
  renderStandInvoiceSettings();
  renderFeeOptions();
  renderEventOptions();
  renderFundingSourceOptions();
  renderInvoiceRentalOptions();
  renderGlobalSearchResults();
}

function renderStandInvoiceSettings() {
  if (!elements.standInvoiceForm) return;
  const settings = currentStandInvoiceSettings();
  const form = elements.standInvoiceForm;
  form.elements.enabled.value = settings.enabled ? "true" : "false";
  form.elements.eventName.value = settings.eventName || "";
  form.elements.contactPhone.value = settings.contactPhone || "";
  form.elements.smsTemplate.value = settings.smsTemplate || "";
  form.elements.disabledMessage.value = settings.disabledMessage || "";
  if (elements.standInvoiceUrl) {
    elements.standInvoiceUrl.href = STAND_INVOICE_URL;
    elements.standInvoiceUrl.textContent = STAND_INVOICE_URL;
  }
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

async function handleCopyLinkClick(event) {
  const button = event.target.closest("[data-copy-link]");
  if (!button) return;
  const link = button.dataset.copyLink || "";
  if (!link) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast("Skopiowano link.");
  } catch (error) {
    console.warn("Nie udało się skopiować linku", error);
    showToast("Nie udało się skopiować linku.", "error");
  }
}

function renderGlobalSearchResults() {
  if (!elements.globalSearchResults) return;
  const search = normalizeSearchText(elements.globalSearch?.value || query);
  if (!search) {
    elements.globalSearchResults.classList.add("hidden");
    elements.globalSearchResults.innerHTML = "";
    return;
  }
  const results = globalSearchResults(search).slice(0, 30);
  elements.globalSearchResults.classList.remove("hidden");
  elements.globalSearchResults.innerHTML = `
    <strong>Wyniki wyszukiwania</strong>
    <div class="global-search-list">
      ${results.length ? results.map(globalSearchResultRow).join("") : '<div class="global-search-empty">Brak wyników wyszukiwania.</div>'}
    </div>
  `;
}

function globalSearchResultRow(result) {
  return `
    <button class="global-search-result" type="button" onclick="openGlobalSearchResult('${result.view}', '${result.tab || ""}')">
      <span>${escapeHtml(result.module)}</span>
      <strong>${escapeHtml(result.title)}</strong>
      <small>${escapeHtml(result.detail || "")}</small>
    </button>
  `;
}

function openGlobalSearchResult(view, tab = "") {
  switchView(view);
  if (view === "rentals" && tab) switchRentalTab(tab);
  if (view === "docs" && tab) switchDocTab(tab);
  if (view === "info" && tab) switchInfoTab(tab);
  elements.globalSearchResults?.classList.add("hidden");
}

function globalSearchResults(search) {
  const results = [];
  const addResult = (module, view, title, detail, values, tab = "") => {
    if (globalSearchMatches(values, search)) results.push({ module, view, title, detail, tab });
  };

  state.members.forEach((member) => addResult(
    "Członkowie",
    "members",
    member.name || "Członek",
    [member.phone, member.email, member.status, member.membershipType, member.boardRole].filter(Boolean).join(" · "),
    [member.name, member.phone, member.email, member.status, member.membershipType, member.boardRole]
  ));

  state.fees.forEach((fee) => addResult(
    "Składki",
    "fees",
    fee.member || "Składka",
    `${fee.year || fee.period || FEE_YEAR} · ${money(fee.amount)} · ${fee.note || ""}`,
    [fee.member, fee.year, fee.period, fee.amount, money(fee.amount), fee.note]
  ));

  state.money.forEach((entry) => addResult(
    "Finanse",
    "money",
    entry.title || "Wpis finansowy",
    `${formatDate(entry.date)} · ${entry.category || "Bez kategorii"} · ${money(entry.amount)}${entry.fundingSourceName ? ` · ${entry.fundingSourceName}` : ""}`,
    [entry.title, entry.category, entry.amount, money(entry.amount), entry.eventName, entry.fundingSourceName, moneyTypeLabel(entry.type)]
  ));

  state.invoices.forEach((invoice) => addResult(
    "Faktury",
    "invoices",
    `Faktura ${invoice.number}`,
    `${invoice.buyerName || "Brak nabywcy"} · ${money(invoice.gross)} · ${invoicePaymentStatusLabel(invoice.paymentStatus)}`,
    [invoice.number, `faktura ${invoice.number}`, invoice.buyerName, invoice.buyerAddress, invoice.buyerNip, invoice.gross, money(invoice.gross), invoicePaymentStatusLabel(invoice.paymentStatus), invoicePaymentMethodLabel(invoice.paymentMethod || invoicePaymentMethod(invoice.paymentStatus)), invoice.rentalLabel, invoice.notes]
  ));

  state.invoiceRequests.forEach((request) => addResult(
    "Faktury",
    "invoices",
    `Zgłoszenie ze stoiska - ${request.buyerName || "Brak nabywcy"}`,
    `${formatDate(request.date)} · ${money(request.gross)} · ${invoiceRequestStatusLabel(request.status)}`,
    [request.buyerName, request.buyerNip, request.buyerAddress, request.buyerEmail, request.buyerPhone, request.itemDescription, request.gross, money(request.gross), invoiceRequestPaymentLabel(request.paymentMethod), invoiceRequestStatusLabel(request.status), request.eventName, request.notes]
  ));

  state.rentalLoans.forEach((loan) => addResult(
    "Wypożyczalnia",
    "rentals",
    `${loan.firstName || ""} ${loan.lastName || ""}`.trim() || "Wypożyczenie",
    `${formatDate(loan.dateFrom)} - ${formatDate(loan.dateTo)} · ${money(loan.total)} · ${loan.status}`,
    [loan.firstName, loan.lastName, loan.phone, loan.status, loan.total, money(loan.total), rentalItemsText(loan.items), loan.notes, loan.returnNotes],
    "history"
  ));

  state.docs.forEach((doc) => addResult(
    "Dokumenty",
    "docs",
    doc.title || "Dokument",
    `${formatDate(doc.date)} · ${doc.category || "Dokument"} · ${normalizeDocSection(doc.section)} · ${doc.sender || "Brak nadawcy"}${doc.fundingSourceName ? ` · ${doc.fundingSourceName}` : ""}`,
    [doc.title, doc.sender, doc.category, normalizeDocSection(doc.section), doc.date, doc.notes, doc.fileName, doc.eventName, doc.fundingSourceName],
    docTabForSection(doc.section)
  ));

  state.events.forEach((event) => addResult(
    "Wydarzenia",
    "events",
    event.name || "Wydarzenie",
    `${formatDate(event.date)} · ${event.place || "Brak miejsca"}`,
    [event.name, event.date, event.place, event.notes]
  ));

  state.kitchenEvents.forEach((event) => addResult(
    "Kulinarne wspomnienia",
    "kitchen",
    event.name || "Impreza",
    `${formatDate(event.date)} · ${event.place || "Brak miejsca"} · ${kitchenItemsSummary(event.items)}`,
    [
      event.name,
      event.date,
      event.place,
      event.notes,
      ...(event.items || []).flatMap((item) => [item.itemName, item.quantity, item.ingredients, item.enoughStatus, item.notes])
    ]
  ));

  state.fundingSources.forEach((source) => addResult(
    "Źródła finansowania",
    "funding",
    source.name || "Źródło finansowania",
    `${source.type || "Inne"} · ${source.status || "aktywne"} · ${money(source.plannedAmount)}`,
    [source.name, source.type, source.status, source.description, source.plannedAmount, money(source.plannedAmount)]
  ));

  return results;
}

function globalSearchMatches(values, search) {
  const haystack = values.map(normalizeSearchText).join(" ");
  const expanded = `${haystack} ${haystack.replace(/[^a-z0-9ąćęłńóśźż]+/gi, " ")}`;
  return search.split(" ").filter(Boolean).every((term) => expanded.includes(term));
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
  renderDashboardFocus(lateFeeRows, lateFees, activeRentals, unpaidInvoices, unpaidInvoicesTotal, balance);

  const recent = [...state.money].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  elements.recentMoney.innerHTML = recent.length ? recent.map(moneyRow).join("") : `<div class="dashboard-empty-state"><strong>Brak wpisów</strong><small>Po dodaniu pierwszej operacji zobaczysz ją tutaj.</small></div>`;

  const upcoming = [...state.events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  elements.upcomingEvents.innerHTML = upcoming.length ? upcoming.map(eventRow).join("") : `<div class="dashboard-empty-state"><strong>Brak zaplanowanych wydarzeń</strong><small>Dodaj wydarzenie, aby pojawiło się na pulpicie.</small></div>`;
}

function renderDashboardFocus(lateFeeRows, lateFees, activeRentals, unpaidInvoices, unpaidInvoicesTotal, balance) {
  if (!elements.dashboardFocus) return;

  const standInvoiceRequests = (state.invoiceRequests || []).filter((item) => {
    const status = String(item.status || '').toLowerCase();
    return !status || status === 'do wystawienia' || status === 'w trakcie' || status === 'zgłoszenie';
  });
  const nextEvent = [...state.events].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))[0] || null;

  const focusItems = [
    {
      kind: lateFeeRows.length ? 'danger' : 'ok',
      title: lateFeeRows.length ? `Zaległe składki: ${lateFeeRows.length} osób` : 'Składki są pod kontrolą',
      detail: lateFeeRows.length ? `Łączna zaległość na dziś: ${money(lateFees)}.` : 'Obecnie brak osób z zaległością na dziś.'
    },
    {
      kind: unpaidInvoices.length ? 'warning' : 'ok',
      title: unpaidInvoices.length ? `Nieopłacone faktury: ${unpaidInvoices.length}` : 'Brak nieopłaconych faktur',
      detail: unpaidInvoices.length ? `Do rozliczenia pozostało ${money(unpaidInvoicesTotal)}.` : 'Wszystkie faktury są obecnie opłacone.'
    },
    {
      kind: activeRentals.length ? 'info' : 'ok',
      title: activeRentals.length ? `Aktywne wypożyczenia: ${activeRentals.length}` : 'Brak aktywnych wypożyczeń',
      detail: activeRentals.length ? `Aktualnie aktywne wypożyczenia wymagają kontroli terminów.` : 'Magazyn jest obecnie wolny od aktywnych wypożyczeń.'
    },
    {
      kind: standInvoiceRequests.length ? 'warning' : 'ok',
      title: standInvoiceRequests.length ? `Zgłoszenia ze stoiska: ${standInvoiceRequests.length}` : 'Brak zgłoszeń ze stoiska',
      detail: standInvoiceRequests.length ? 'Sprawdź moduł Faktury i dokończ wystawianie dokumentów.' : 'Nie ma nowych zgłoszeń oczekujących na wystawienie.'
    },
    {
      kind: nextEvent ? 'info' : 'neutral',
      title: nextEvent ? `Najbliższe wydarzenie: ${nextEvent.name}` : 'Brak najbliższego wydarzenia',
      detail: nextEvent ? `${formatDate(nextEvent.date)} · ${nextEvent.place || 'Brak miejsca'}` : 'Dodaj wydarzenie, jeśli chcesz widzieć je na pulpicie.'
    },
    {
      kind: balance < 0 ? 'danger' : 'ok',
      title: balance < 0 ? 'Uwaga na saldo kasy' : 'Saldo kasy wygląda dobrze',
      detail: balance < 0 ? `Stan kasy wynosi ${money(balance)}.` : `Aktualne saldo to ${money(balance)}.`
    }
  ];

  elements.dashboardFocus.innerHTML = focusItems.map((item) => `
    <div class="dashboard-focus-item dashboard-focus-${item.kind}">
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </div>
  `).join('');

  if (elements.dashboardTodayTitle) {
    if (lateFeeRows.length) {
      elements.dashboardTodayTitle.textContent = `${lateFeeRows.length} osób ma zaległości`;
      elements.dashboardTodaySummary.textContent = `Na dziś do sprawdzenia jest ${money(lateFees)} zaległych składek.`;
    } else if (unpaidInvoices.length) {
      elements.dashboardTodayTitle.textContent = `${unpaidInvoices.length} faktur czeka na opłacenie`;
      elements.dashboardTodaySummary.textContent = `Łączna kwota nieopłaconych faktur: ${money(unpaidInvoicesTotal)}.`;
    } else if (standInvoiceRequests.length) {
      elements.dashboardTodayTitle.textContent = `${standInvoiceRequests.length} zgłoszeń ze stoiska do sprawdzenia`;
      elements.dashboardTodaySummary.textContent = 'W module Faktury możesz od razu dokończyć wystawienie dokumentów.';
    } else {
      elements.dashboardTodayTitle.textContent = 'Program gotowy do pracy';
      elements.dashboardTodaySummary.textContent = nextEvent
        ? `Najbliższe wydarzenie: ${nextEvent.name} — ${formatDate(nextEvent.date)}.`
        : 'Najważniejsze moduły są gotowe do codziennej pracy.';
    }
  }
}

function renderMembers() {
  const showInactive = elements.showInactiveMembers?.checked;
  const statusFilter = elements.memberStatusFilter?.value || "all";
  const typeFilter = elements.memberTypeFilter?.value || "all";
  const roleFilter = elements.memberRoleFilter?.value || "all";
  const visibleMembers = state.members
    .filter((item) => showInactive || statusFilter !== "all" || (item.status || "Aktywny") === "Aktywny")
    .filter((item) => {
      if (statusFilter === "all") return true;
      const active = (item.status || "Aktywny") === "Aktywny";
      return statusFilter === "active" ? active : !active;
    })
    .filter((item) => typeFilter === "all" || (item.membershipType || "Zwyczajny") === typeFilter)
    .filter((item) => memberMatchesRoleFilter(item, roleFilter));
  elements.membersList.innerHTML = rows(filterItems(visibleMembers), (item) => `
    <div>
      <button class="link-button" type="button" onclick="showMemberDetails('${item.id}')">${escapeHtml(item.name)}</button>
      <small>${escapeHtml(item.phone || "Brak telefonu")} · ${escapeHtml(item.email || "Brak e-maila")} · ${escapeHtml(item.status || "Aktywny")} · Typ: ${escapeHtml(item.membershipType || "Zwyczajny")}${memberBoardRoleText(item)}</small>
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
      <div><span>Typ członkostwa</span><strong>${escapeHtml(member.membershipType || "Zwyczajny")}</strong></div>
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
  form.membershipType.value = member.membershipType || "Zwyczajny";
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
  form.membershipType.value = "Zwyczajny";
  form.boardRole.value = "Brak";
  elements.memberFormTitle.textContent = "Dodaj członka";
  form.querySelector('button[type="submit"]').textContent = "Dodaj";
  elements.cancelMemberEdit.classList.add("hidden");
}

function memberBoardRoleText(member) {
  const role = member.boardRole || "Brak";
  return role === "Brak" ? "" : ` · Funkcja: ${escapeHtml(role)}`;
}

function isBoardRole(role) {
  return ["Przewodnicząca", "Wiceprzewodnicząca", "Członek zarządu"].includes(role || "Brak");
}

function memberMatchesRoleFilter(member, filter) {
  const role = member.boardRole || "Brak";
  if (filter === "all") return true;
  if (filter === "none") return role === "Brak";
  if (filter === "board") return isBoardRole(role);
  return role === filter;
}

function renderFees() {
  const visibleRows = visibleFeeRows();
  if (!visibleRows.length) {
    elements.feesList.innerHTML = '<div class="row"><small>Brak składek pasujących do filtrów.</small></div>';
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

function visibleFeeRows() {
  const search = normalizeSearchText(elements.feeSearch?.value || "");
  const status = feeFilterValue(elements.feeStatusFilter?.value, ["all", "late", "paid"], "all");
  const type = feeFilterValue(elements.feeTypeFilter?.value, ["all", "zwyczajny", "wspierający"], "all");
  const memberStatus = feeFilterValue(elements.feeMemberStatusFilter?.value, ["all", "active", "inactive"], "all");
  const sort = feeFilterValue(elements.feeSort?.value, [
    "status_late_first",
    "status_paid_first",
    "name_asc",
    "name_desc",
    "due_desc",
    "due_asc",
    "paid_desc",
    "paid_asc"
  ], "status_late_first");

  return feeMemberRows()
    .filter((item) => feeMatchesSearch(item, search))
    .filter((item) => {
      if (status === "all") return true;
      return status === "late" ? item.isLate : !item.isLate;
    })
    .filter((item) => type === "all" || feeMembershipTypeValue(item.membershipType) === type)
    .filter((item) => {
      if (memberStatus === "all") return true;
      const isActive = feeMemberIsActive(item.memberStatus);
      return memberStatus === "active" ? isActive : !isActive;
    })
    .sort(feeSortComparator(sort));
}

function feeFilterValue(value, allowed, fallback) {
  const normalized = normalizeSearchText(value || "");
  return allowed.includes(normalized) ? normalized : fallback;
}

function feeMembershipTypeValue(value) {
  const normalized = normalizeSearchText(value || "Zwyczajny");
  if (normalized.includes("wspier")) return "wspierający";
  return "zwyczajny";
}

function feeMemberIsActive(status) {
  const normalized = normalizeSearchText(status || "");
  if (!normalized) return true;
  return !["nieaktywny", "nieaktywna", "zarchiwizowany", "archiwalny", "archiwalne"].includes(normalized);
}

function feeMatchesSearch(item, search) {
  if (!search) return true;
  const statusText = item.isLate ? "zaległe zaległość" : "opłacone";
  const haystack = [
    item.name,
    item.phone,
    item.email,
    item.membershipType,
    item.memberStatus,
    statusText,
    FEE_YEAR,
    item.paid,
    item.currentDue,
    item.required,
    money(item.paid),
    money(item.currentDue),
    item.paidUntil
  ].map(normalizeSearchText).join(" ");
  return haystack.includes(search);
}

function feeSortComparator(sort) {
  const collator = new Intl.Collator("pl", { sensitivity: "base", numeric: true });
  const byName = (a, b) => collator.compare(feeSurnameKey(a.name), feeSurnameKey(b.name));
  const byDue = (a, b) => Number(a.currentDue || 0) - Number(b.currentDue || 0);
  const byPaid = (a, b) => Number(a.paid || 0) - Number(b.paid || 0);
  const byStatusLate = (a, b) => {
    if (a.isLate !== b.isLate) return a.isLate ? -1 : 1;
    return byName(a, b);
  };
  const byStatusPaid = (a, b) => {
    if (a.isLate !== b.isLate) return a.isLate ? 1 : -1;
    return byName(a, b);
  };
  if (sort === "name_asc") return byName;
  if (sort === "name_desc") return (a, b) => byName(b, a);
  if (sort === "due_desc") return (a, b) => byDue(b, a) || byName(a, b);
  if (sort === "due_asc") return (a, b) => byDue(a, b) || byName(a, b);
  if (sort === "paid_desc") return (a, b) => byPaid(b, a) || byName(a, b);
  if (sort === "paid_asc") return (a, b) => byPaid(a, b) || byName(a, b);
  if (sort === "status_paid_first") return byStatusPaid;
  return byStatusLate;
}

function feeSurnameKey(name) {
  const cleanName = String(name || "")
    .replace(/\s*-\s*/g, "-")
    .replace(/[.,;:()]/g, " ")
    .trim();
  const parts = cleanName.split(/\s+/).filter((part) => part && part !== "-");
  if (!parts.length) return "";
  const firstName = parts[0] || "";
  const surname = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
  return `${surname} ${firstName} ${parts.join(" ")}`;
}

function clearFeeFilters() {
  if (elements.feeSearch) elements.feeSearch.value = "";
  if (elements.feeSort) elements.feeSort.value = "status_late_first";
  if (elements.feeStatusFilter) elements.feeStatusFilter.value = "all";
  if (elements.feeTypeFilter) elements.feeTypeFilter.value = "all";
  if (elements.feeMemberStatusFilter) elements.feeMemberStatusFilter.value = "all";
  renderFees();
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
  renderMoneyFilterOptions();
  elements.moneyList.innerHTML = rows(filteredMoneyItems(), moneyRowWithDelete);
}

function renderMoneyFilterOptions() {
  renderMoneyFilterSelect(elements.moneyFundingFilter, [
    { value: "all", label: "Źródło: wszystkie" },
    { value: "none", label: "Bez źródła" },
    ...state.fundingSources.map((source) => ({ value: source.id, label: source.name }))
  ]);
  renderMoneyFilterSelect(elements.moneyEventFilter, [
    { value: "all", label: "Wydarzenie: wszystkie" },
    { value: "none", label: "Bez wydarzenia" },
    ...state.events.map((event) => ({ value: event.id, label: event.name }))
  ]);
}

function renderMoneyFilterSelect(select, options) {
  if (!select) return;
  const current = select.value || "all";
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");
  select.value = options.some((option) => option.value === current) ? current : "all";
}

function filteredMoneyItems() {
  const search = normalizeText(elements.moneySearch?.value || "");
  const type = elements.moneyTypeFilter?.value || "all";
  const status = elements.moneyStatusFilter?.value || "active";
  const funding = elements.moneyFundingFilter?.value || "all";
  const event = elements.moneyEventFilter?.value || "all";
  const sort = elements.moneySort?.value || "date_desc";
  return [...state.money]
    .filter((item) => moneyMatchesSearch(item, search))
    .filter((item) => type === "all" || item.type === type)
    .filter((item) => {
      if (status === "all") return true;
      return status === "active" ? isActiveMoney(item) : !isActiveMoney(item);
    })
    .filter((item) => {
      if (funding === "all") return true;
      if (funding === "none") return !item.fundingSourceId;
      return item.fundingSourceId === funding;
    })
    .filter((item) => {
      if (event === "all") return true;
      if (event === "none") return !item.eventId && !item.eventName;
      return item.eventId === event;
    })
    .sort(moneySortComparator(sort));
}

function moneyMatchesSearch(item, search) {
  if (!search) return true;
  const haystack = [
    item.title,
    item.category,
    item.fundingSourceName,
    item.eventName,
    money(item.amount),
    String(item.amount || "")
  ].map(normalizeText).join(" ");
  return haystack.includes(search);
}

function moneySortComparator(sort) {
  const byName = (a, b) => String(a.title || "").localeCompare(String(b.title || ""), "pl");
  const byAmount = (a, b) => Number(a.amount || 0) - Number(b.amount || 0);
  const byDate = (a, b) => String(a.date || "").localeCompare(String(b.date || ""));
  if (sort === "date_asc") return byDate;
  if (sort === "amount_desc") return (a, b) => byAmount(b, a);
  if (sort === "amount_asc") return byAmount;
  if (sort === "name_asc") return byName;
  if (sort === "name_desc") return (a, b) => byName(b, a);
  return (a, b) => byDate(b, a);
}

function clearMoneyFilters() {
  if (elements.moneySearch) elements.moneySearch.value = "";
  if (elements.moneySort) elements.moneySort.value = "date_desc";
  if (elements.moneyTypeFilter) elements.moneyTypeFilter.value = "all";
  if (elements.moneyStatusFilter) elements.moneyStatusFilter.value = "active";
  if (elements.moneyFundingFilter) elements.moneyFundingFilter.value = "all";
  if (elements.moneyEventFilter) elements.moneyEventFilter.value = "all";
  renderMoney();
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
  const sources = filteredFundingSources();
  elements.fundingSourcesList.innerHTML = sources.length
    ? sources.map((source) => `<div class="row">${fundingSourceRow(source)}</div>`).join("")
    : '<div class="row"><small>Brak źródeł finansowania pasujących do filtrów.</small></div>';
}

function filteredFundingSources() {
  const search = normalizeSearchText(elements.fundingSearch?.value || "");
  const sort = elements.fundingSort?.value || "date_desc";
  const statusFilter = elements.fundingStatusFilter?.value || "all";
  const typeFilter = elements.fundingTypeFilter?.value || "all";
  return [...(state.fundingSources || [])]
    .filter((source) => statusFilter === "all" || fundingStatusValue(source.status) === normalizeText(statusFilter))
    .filter((source) => typeFilter === "all" || (source.type || "Inne") === typeFilter)
    .filter((source) => {
      if (!search) return true;
      return [
        source.name,
        source.type,
        source.plannedAmount,
        money(source.plannedAmount || 0),
        source.status,
        source.dateFrom,
        source.dateTo,
        formatDate(source.dateFrom),
        formatDate(source.dateTo),
        source.description
      ].map(normalizeSearchText).join(" ").includes(search);
    })
    .sort(fundingSourceSortComparator(sort));
}

function fundingSourceSortComparator(sort) {
  const byDate = (a, b) => String(a.dateFrom || a.dateTo || "").localeCompare(String(b.dateFrom || b.dateTo || ""));
  const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pl");
  const byAmount = (a, b) => Number(a.plannedAmount || 0) - Number(b.plannedAmount || 0);
  const byStatus = (a, b) => {
    const statusOrder = { aktywne: 0, zakończone: 1, archiwalne: 2 };
    return (statusOrder[fundingStatusValue(a.status)] ?? 9) - (statusOrder[fundingStatusValue(b.status)] ?? 9) || byName(a, b);
  };
  if (sort === "date_asc") return byDate;
  if (sort === "name_asc") return byName;
  if (sort === "name_desc") return (a, b) => byName(b, a);
  if (sort === "amount_desc") return (a, b) => byAmount(b, a);
  if (sort === "amount_asc") return byAmount;
  if (sort === "status_asc") return byStatus;
  return (a, b) => byDate(b, a) || byName(a, b);
}

function clearFundingFilters() {
  if (elements.fundingSearch) elements.fundingSearch.value = "";
  if (elements.fundingSort) elements.fundingSort.value = "date_desc";
  if (elements.fundingStatusFilter) elements.fundingStatusFilter.value = "all";
  if (elements.fundingTypeFilter) elements.fundingTypeFilter.value = "all";
  renderFundingSources();
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
      ${isAdmin() ? `<button class="delete-button" onclick="deleteFundingSource('${source.id}')">Usuń</button>` : ""}
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
  const linkedTransaction = doc.transactionId ? state.money.find((entry) => entry.id === doc.transactionId) : null;
  if (linkedTransaction) return `${moneyTypeLabel(linkedTransaction.type)}: ${money(linkedTransaction.amount)}`;
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

async function deleteFundingSource(id) {
  if (!isAdmin()) {
    alert("Usuwanie źródeł finansowania jest dostępne tylko dla Administratora.");
    return;
  }
  const source = state.fundingSources.find((entry) => entry.id === id);
  if (!source) return;
  const linkedMoney = state.money.some((entry) => entry.fundingSourceId === id);
  const linkedDocs = state.docs.some((doc) => doc.fundingSourceId === id);
  if (linkedMoney || linkedDocs) {
    alert("Tego źródła nie można bezpiecznie usunąć, ponieważ jest powiązane z finansami lub dokumentami. Użyj opcji Archiwizuj albo najpierw odłącz wpisy.");
    return;
  }
  const confirmed = confirm("Czy na pewno usunąć źródło finansowania? Tej operacji nie można cofnąć.");
  if (!confirmed) return;

  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient
      .from("funding_sources")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Nie udało się usunąć źródła finansowania.", { id, source, error });
      alert("Nie udało się usunąć źródła finansowania. Sprawdź uprawnienia Administratora.");
      return;
    }
    await logActivity("Źródła finansowania", "Usunięcie źródła finansowania", { summary: source.name });
    if (selectedFundingSourceId === id) selectedFundingSourceId = "";
    await refreshSupabaseData();
    showToast("Źródło finansowania zostało usunięte");
    return;
  }

  state.fundingSources = state.fundingSources.filter((entry) => entry.id !== id);
  if (selectedFundingSourceId === id) selectedFundingSourceId = "";
  saveState();
  render();
  await logActivity("Źródła finansowania", "Usunięcie źródła finansowania", { summary: source.name });
  showToast("Źródło finansowania zostało usunięte");
}

function renderEvents() {
  const events = filteredEvents();
  elements.eventsList.innerHTML = events.length ? events.map((item) => `<div class="row">
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
  </div>`).join("") : '<div class="row"><small>Brak wydarzeń pasujących do wyszukiwania.</small></div>';
}

function filteredEvents() {
  const search = normalizeSearchText(elements.eventSearch?.value || "");
  const sort = elements.eventSort?.value || "date_desc";
  return [...state.events]
    .filter((eventItem) => {
      if (!search) return true;
      return [
        eventItem.name,
        eventItem.place,
        eventItem.date,
        formatDate(eventItem.date),
        eventItem.notes
      ].map(normalizeSearchText).join(" ").includes(search);
    })
    .sort(eventSortComparator(sort));
}

function eventSortComparator(sort) {
  const byDate = (a, b) => String(a.date || "").localeCompare(String(b.date || ""));
  const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pl");
  const byPlace = (a, b) => String(a.place || "").localeCompare(String(b.place || ""), "pl") || byName(a, b);
  if (sort === "date_asc") return byDate;
  if (sort === "name_asc") return byName;
  if (sort === "name_desc") return (a, b) => byName(b, a);
  if (sort === "place_asc") return byPlace;
  return (a, b) => byDate(b, a) || byName(a, b);
}

function clearEventFilters() {
  if (elements.eventSearch) elements.eventSearch.value = "";
  if (elements.eventSort) elements.eventSort.value = "date_desc";
  renderEvents();
}

function renderKitchen() {
  if (!elements.kitchenEventsList) return;
  const events = filteredKitchenEvents();
  const allEvents = state.kitchenEvents || [];
  const kitchenEventsCount = document.querySelector("#kitchenEventsCount");
  const kitchenDishesCount = document.querySelector("#kitchenDishesCount");
  if (kitchenEventsCount) kitchenEventsCount.textContent = allEvents.length;
  if (kitchenDishesCount) kitchenDishesCount.textContent = allEvents.reduce((sum, event) => sum + (event.items || []).length, 0);
  elements.kitchenListPanel?.classList.toggle("hidden", Boolean(selectedKitchenEventId));
  elements.kitchenEventsList.innerHTML = events.length
    ? events.map(kitchenEventCard).join("")
    : '<div class="kitchen-empty">Brak imprez pasujących do wyszukiwania.</div>';
  renderKitchenDetails();
}

function filteredKitchenEvents() {
  const search = normalizeSearchText(elements.kitchenSearch?.value || "");
  const sort = elements.kitchenSort?.value || "date_desc";
  return [...(state.kitchenEvents || [])]
    .filter((event) => {
      if (!search) return true;
      const values = [
        event.name,
        event.date,
        formatDate(event.date),
        event.place,
        event.notes,
        ...(event.items || []).flatMap((item) => [item.itemName, item.quantity, item.ingredients, item.enoughStatus, item.notes])
      ];
      return values.map(normalizeSearchText).join(" ").includes(search);
    })
    .sort(kitchenSortComparator(sort));
}

function kitchenSortComparator(sort) {
  const byDate = (a, b) => String(a.date || a.createdAt || "").localeCompare(String(b.date || b.createdAt || ""));
  const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pl");
  const byPlace = (a, b) => String(a.place || "").localeCompare(String(b.place || ""), "pl") || byName(a, b);
  if (sort === "date_asc") return byDate;
  if (sort === "name_asc") return byName;
  if (sort === "name_desc") return (a, b) => byName(b, a);
  if (sort === "place_asc") return byPlace;
  return (a, b) => byDate(b, a) || byName(a, b);
}

function clearKitchenFilters() {
  if (elements.kitchenSearch) elements.kitchenSearch.value = "";
  if (elements.kitchenSort) elements.kitchenSort.value = "date_desc";
  renderKitchen();
}

function kitchenEventCard(event) {
  const items = event.items || [];
  const hasNotes = Boolean(String(event.notes || "").trim());
  return `
    <article class="kitchen-event-card">
      <div class="kitchen-event-date-block">
        <strong>${formatDate(event.date)}</strong>
        <small>${escapeHtml(event.place || "Brak miejsca")}</small>
      </div>
      <div class="kitchen-event-main">
        <p class="kitchen-card-eyebrow">Impreza kulinarna</p>
        <strong>${escapeHtml(event.name || "Impreza bez nazwy")}</strong>
        <div class="kitchen-event-badges">
          <span>🍲 Potrawy: ${items.length}</span>
          ${hasNotes ? "<span>📝 Uwagi: są</span>" : "<span>📝 Uwagi: brak</span>"}
        </div>
        <p class="kitchen-items-preview">${escapeHtml(kitchenItemsSummary(items))}</p>
      </div>
      <div class="kitchen-card-actions">
        <button class="small-button kitchen-open-button" type="button" onclick="openKitchenEvent('${event.id}')">Otwórz</button>
        ${canCorrect() ? `<button class="small-button secondary-button" type="button" onclick="showKitchenEventForm('${event.id}')">Edytuj</button>` : ""}
        <button class="small-button secondary-button" type="button" onclick="printKitchenEvent('${event.id}')">Drukuj</button>
        ${canCorrect() ? `<button class="delete-button" type="button" onclick="deleteKitchenEvent('${event.id}')">Usuń</button>` : ""}
      </div>
    </article>
  `;
}

function kitchenItemsSummary(items = []) {
  if (!items.length) return "Brak potraw";
  const summary = items.slice(0, 5).map((item) => [item.itemName, item.quantity].filter(Boolean).join(" ")).join(" • ");
  return items.length > 5 ? `${summary} • ...` : summary;
}

function openKitchenEvent(id) {
  selectedKitchenEventId = id;
  hideKitchenEventForm(false);
  hideKitchenItemForm(false);
  renderKitchen();
  elements.kitchenDetailsPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeKitchenEvent() {
  selectedKitchenEventId = "";
  hideKitchenEventForm(false);
  hideKitchenItemForm(false);
  renderKitchen();
}

function renderKitchenDetails() {
  if (!elements.kitchenDetailsPanel || !elements.kitchenDetails) return;
  const event = state.kitchenEvents.find((entry) => entry.id === selectedKitchenEventId);
  elements.kitchenDetailsPanel.classList.toggle("hidden", !event);
  if (!event) {
    elements.kitchenDetails.innerHTML = "";
    return;
  }
  elements.kitchenDetails.innerHTML = `
    <div class="kitchen-details-head kitchen-details-hero">
      <div>
        <p class="eyebrow">Szczegóły imprezy</p>
        <h2>${escapeHtml(event.name || "Impreza")}</h2>
        <small>${formatDate(event.date)} · ${escapeHtml(event.place || "Brak miejsca")} · Potrawy: ${(event.items || []).length}</small>
      </div>
      <div class="kitchen-details-actions">
        ${canCorrect() ? `<button class="small-button kitchen-open-button" type="button" onclick="showKitchenItemForm('${event.id}')">+ Dodaj potrawę</button>` : ""}
        <button class="small-button secondary-button" type="button" onclick="printKitchenEvent('${event.id}')">Drukuj imprezę</button>
        ${canCorrect() ? `<button class="small-button secondary-button" type="button" onclick="showKitchenEventForm('${event.id}')">Edytuj imprezę</button>` : ""}
        <button class="small-button secondary-button" type="button" onclick="closeKitchenEvent()">Wróć do imprez</button>
      </div>
    </div>
    ${event.notes ? `<div class="kitchen-notes-box"><strong>Uwagi ogólne</strong><p>${escapeHtml(event.notes)}</p></div>` : ""}
    <div class="kitchen-section-head">
      <strong>Potrawy i produkty</strong>
      <small>Co przygotowano, ile było i co warto zapamiętać na kolejną imprezę.</small>
    </div>
    <div class="kitchen-item-grid">
      ${(event.items || []).length ? event.items.map((item) => kitchenItemCard(event, item)).join("") : '<div class="kitchen-empty">Brak potraw w tej imprezie.</div>'}
    </div>
  `;
}

function kitchenItemCard(event, item) {
  return `
    <article class="kitchen-item-card">
      <div>
        <strong>${escapeHtml(item.itemName || "Potrawa")}</strong>
        <small>Ilość: ${escapeHtml(item.quantity || "brak danych")} · Czy wystarczyło: ${escapeHtml(item.enoughStatus || "Nie wiadomo")}</small>
      </div>
      ${item.ingredients ? `<p><span>Wykonane z / składniki:</span> ${escapeHtml(item.ingredients)}</p>` : ""}
      ${item.notes ? `<p><span>Uwagi na przyszłość:</span> ${escapeHtml(item.notes)}</p>` : ""}
      ${canCorrect() ? `
        <div class="kitchen-card-actions">
          <button class="small-button" type="button" onclick="showKitchenItemForm('${event.id}', '${item.id}')">Edytuj</button>
          <button class="delete-button" type="button" onclick="deleteKitchenItem('${event.id}', '${item.id}')">Usuń</button>
        </div>
      ` : ""}
    </article>
  `;
}

function showKitchenEventForm(id = "") {
  if (!canCorrect()) return;
  const form = elements.kitchenEventForm;
  if (!form) return;
  const event = id ? state.kitchenEvents.find((entry) => entry.id === id) : null;
  form.reset();
  form.id.value = event?.id || "";
  form.name.value = event?.name || "";
  form.date.value = event?.date || "";
  form.place.value = event?.place || "";
  form.notes.value = event?.notes || "";
  if (!event) form.date.valueAsDate = new Date();
  elements.kitchenEventFormTitle.textContent = event ? "Edytuj imprezę" : "Dodaj imprezę";
  elements.kitchenEventFormPanel?.classList.remove("hidden");
  elements.kitchenEventFormPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideKitchenEventForm(reset = true) {
  if (reset) elements.kitchenEventForm?.reset();
  elements.kitchenEventFormPanel?.classList.add("hidden");
  if (elements.kitchenEventFormTitle) elements.kitchenEventFormTitle.textContent = "Dodaj imprezę";
}

function showKitchenItemForm(eventId, itemId = "") {
  if (!canCorrect()) return;
  const form = elements.kitchenItemForm;
  const event = state.kitchenEvents.find((entry) => entry.id === eventId);
  if (!form || !event) return;
  const item = itemId ? event.items.find((entry) => entry.id === itemId) : null;
  form.reset();
  form.id.value = item?.id || "";
  form.eventId.value = eventId;
  form.itemName.value = item?.itemName || "";
  form.quantity.value = item?.quantity || "";
  form.ingredients.value = item?.ingredients || "";
  form.enoughStatus.value = item?.enoughStatus || "Nie wiadomo";
  form.notes.value = item?.notes || "";
  elements.kitchenItemFormTitle.textContent = item ? "Edytuj potrawę" : "Dodaj potrawę";
  elements.kitchenItemFormPanel?.classList.remove("hidden");
  elements.kitchenItemFormPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideKitchenItemForm(reset = true) {
  if (reset) elements.kitchenItemForm?.reset();
  elements.kitchenItemFormPanel?.classList.add("hidden");
  if (elements.kitchenItemFormTitle) elements.kitchenItemFormTitle.textContent = "Dodaj potrawę";
}

async function deleteKitchenEvent(id) {
  if (!canCorrect()) return;
  const event = state.kitchenEvents.find((entry) => entry.id === id);
  if (!event) return;
  const confirmed = confirm(`Usunąć imprezę: ${event.name}? Usunięte zostaną też jej potrawy.`);
  if (!confirmed) return;
  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient.from("kitchen_events").delete().eq("id", id);
    if (error) {
      alert(`Nie udało się usunąć imprezy w Supabase: ${error.message}`);
      return;
    }
    await logActivity("Kulinarne wspomnienia", "Usunięcie imprezy kulinarnej", { summary: event.name });
    if (selectedKitchenEventId === id) selectedKitchenEventId = "";
    await refreshSupabaseData();
    showToast("Usunięto imprezę");
    return;
  }
  state.kitchenEvents = state.kitchenEvents.filter((entry) => entry.id !== id);
  if (selectedKitchenEventId === id) selectedKitchenEventId = "";
  saveState();
  renderKitchen();
  logActivity("Kulinarne wspomnienia", "Usunięcie imprezy kulinarnej", { summary: event.name });
  showToast("Usunięto imprezę");
}

async function deleteKitchenItem(eventId, itemId) {
  if (!canCorrect()) return;
  const event = state.kitchenEvents.find((entry) => entry.id === eventId);
  const item = event?.items.find((entry) => entry.id === itemId);
  if (!event || !item) return;
  const confirmed = confirm(`Usunąć potrawę: ${item.itemName}?`);
  if (!confirmed) return;
  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient.from("kitchen_event_items").delete().eq("id", itemId);
    if (error) {
      alert(`Nie udało się usunąć potrawy w Supabase: ${error.message}`);
      return;
    }
    await logActivity("Kulinarne wspomnienia", "Usunięcie potrawy", { summary: `${event.name} - ${item.itemName}` });
    await refreshSupabaseData();
    selectedKitchenEventId = eventId;
    renderKitchenDetails();
    showToast("Usunięto potrawę");
    return;
  }
  event.items = event.items.filter((entry) => entry.id !== itemId);
  saveState();
  renderKitchenDetails();
  logActivity("Kulinarne wspomnienia", "Usunięcie potrawy", { summary: `${event.name} - ${item.itemName}` });
  showToast("Usunięto potrawę");
}

function printKitchenEvent(id) {
  const event = state.kitchenEvents.find((entry) => entry.id === id);
  if (!event) return;
  elements.printSheet.innerHTML = kitchenPrintHtml(event);
  window.print();
}

function kitchenPrintHtml(event) {
  const items = event.items || [];
  return `
    <div class="kitchen-print-document">
      <h1>KGiGW we Włosani</h1>
      <h2>Kulinarne wspomnienia</h2>
      <p><strong>Impreza:</strong> ${escapeHtml(event.name || "Impreza")}</p>
      <p><strong>Data:</strong> ${formatDate(event.date)} &nbsp; <strong>Miejsce:</strong> ${escapeHtml(event.place || "Brak miejsca")}</p>
      ${event.notes ? `<p><strong>Uwagi ogólne:</strong> ${escapeHtml(event.notes)}</p>` : ""}
      <table>
        <thead>
          <tr>
            <th>Lp.</th>
            <th>Potrawa / produkt</th>
            <th>Ilość</th>
            <th>Składniki</th>
            <th>Czy wystarczyło</th>
            <th>Uwagi na przyszłość</th>
          </tr>
        </thead>
        <tbody>
          ${items.length ? items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.itemName || "")}</td>
              <td>${escapeHtml(item.quantity || "")}</td>
              <td>${escapeHtml(item.ingredients || "")}</td>
              <td>${escapeHtml(item.enoughStatus || "Nie wiadomo")}</td>
              <td>${escapeHtml(item.notes || "")}</td>
            </tr>
          `).join("") : '<tr><td colspan="6">Brak potraw w tej imprezie.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
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
  const status = rentalLifecycleStatus(loan);
  return `
    <div>
      <details class="return-details">
        <summary>
          <span class="return-summary-title">
            <strong>${escapeHtml(loan.firstName)} ${escapeHtml(loan.lastName)} - ${formatDate(loan.dateFrom)}</strong>
            <span class="badge ${status.className}">${status.label}</span>
          </span>
          <small>${escapeHtml(loan.status)} - ${money(loan.total)} - ${escapeHtml(rentalPaymentLabel(loan.paymentStatus))}</small>
        </summary>
        <small>
          Okres: ${formatDate(loan.dateFrom)} - ${formatDate(loan.dateTo)} - tel. ${escapeHtml(loan.phone)}<br>
          ${loan.items.map((item) => `${escapeHtml(item.name)}: ${item.quantity} szt.`).join(" - ")}
          ${loan.returnNotes ? `<br>Uwagi zwrotu: ${escapeHtml(loan.returnNotes)}` : ""}
          <br>Faktura: ${invoice ? `wystawiona nr ${escapeHtml(invoice.number)}` : "Brak faktury"}
        </small>
        ${loan.returnedAt ? rentalSettlementHtml(loan) : ""}
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

function rentalLifecycleStatus(loan) {
  if (loan.status !== "Zwrócone" && !loan.returnedAt) {
    const plannedDate = parseDateOnly(loan.dateTo);
    const todayDate = parseDateOnly(new Date().toISOString().slice(0, 10));
    if (!plannedDate || !todayDate || plannedDate >= todayDate) {
      return { label: "W terminie", className: "return-on-time" };
    }
    const daysLate = Math.max(1, Math.round((todayDate - plannedDate) / 86400000));
    return { label: `Po terminie: ${daysLate} ${daysLate === 1 ? "dzień" : "dni"}`, className: "return-overdue" };
  }
  if (rentalReturnedWithIssues(loan)) {
    return { label: "Zwrócone uszkodzone", className: "rental-damaged" };
  }
  return { label: "Zwrócone", className: "rental-ok" };
}

function rentalReturnedWithIssues(loan) {
  if (Number(loan.damageCost || 0) > 0) return true;
  const notes = String(loan.returnNotes || "").trim();
  if (!notes) return false;
  const normalized = normalizeText(notes);
  if (normalized.includes("stan po zwrocie uszkodzony")) return true;
  if (normalized.includes("stan po zwrocie brak elementow")) return true;
  if (normalized.includes("stan po zwrocie inne")) return true;
  const withoutOkState = normalized.replace(/^stan po zwrocie ok\s*-?\s*/, "").trim();
  if (!withoutOkState) return false;
  return true;
}

function renderRentalReturns() {
  const activeLoans = state.rentalLoans.filter((loan) => loan.status !== "Zwrócone");
  elements.rentalReturnsList.innerHTML = rows(filterItems(activeLoans), (loan) => `
    <div>
      <details class="return-details">
        <summary>
          <span class="return-summary-title">
            <strong>${escapeHtml(loan.firstName)} ${escapeHtml(loan.lastName)}</strong>
            ${rentalReturnStatusBadge(loan)}
          </span>
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

function rentalReturnStatusBadge(loan) {
  const plannedDate = parseDateOnly(loan.dateTo);
  const todayDate = parseDateOnly(new Date().toISOString().slice(0, 10));
  if (!plannedDate || !todayDate || plannedDate >= todayDate) {
    return `<span class="badge return-on-time">W terminie</span>`;
  }
  const daysLate = Math.max(1, Math.round((todayDate - plannedDate) / 86400000));
  return `<span class="badge return-overdue">Po terminie: ${daysLate} ${daysLate === 1 ? "dzień" : "dni"}</span>`;
}

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function renderRentalInventory() {
  elements.rentalInventory.innerHTML = state.rentalInventory.map((item) => {
    const available = availableQuantity(item.id);
    const borrowed = borrowedQuantity(item.id);
    const returned = returnedQuantity(item.id);
    const replacementText = Number(item.replacementValue || 0) > 0 ? `${money(item.replacementValue)} / szt.` : "—";
    return `
      <article class="inventory-card">
        <strong>${escapeHtml(item.name)}</strong>
        <small>Stan magazynu: ${available} szt. - Wypożyczone: ${borrowed} szt. - Zwrócone łącznie: ${returned} szt. - Stan całkowity: ${item.quantity} szt. - ${money(item.price)} / doba</small>
        <small>Wartość odtworzeniowa: ${replacementText}</small>
        <div class="inventory-edit admin-only ${canCorrect() ? "" : "hidden-role"}">
          <input type="number" min="0" step="1" value="${item.quantity}" aria-label="Ilosc ${escapeHtml(item.name)}" onchange="updateInventory('${item.id}', 'quantity', this.value)" />
          <input type="number" min="0" step="0.01" value="${item.price}" aria-label="Cena ${escapeHtml(item.name)}" onchange="updateInventory('${item.id}', 'price', this.value)" />
          <input type="number" min="0" step="0.01" value="${item.replacementValue ?? ""}" aria-label="Wartość odtworzeniowa ${escapeHtml(item.name)}" placeholder="Wartość odtworzeniowa" onchange="updateInventory('${item.id}', 'replacementValue', this.value)" />
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
  renderDocSectionList(elements.docsList, "Dokumenty");
  renderDocumentationDocs();
  renderSectionDocs("Wzory");
  renderSectionDocs("Notatki");
}

function renderDocumentationDocs() {
  if (!elements.docsDocumentationList) return;
  const docs = filteredDocumentationDocs();
  elements.docsDocumentationList.innerHTML = docs.length
    ? docs.map((item) => `<div class="row documentation-row">${documentationRowHtml(item)}</div>`).join("")
    : '<div class="row"><small>Brak dokumentów w tej sekcji.</small></div>';
}

function filteredDocumentationDocs() {
  const search = normalizeSearchText(elements.documentationSearch?.value || "");
  const kind = elements.documentationKindFilter?.value || "all";
  const sort = elements.documentationSort?.value || "date_desc";
  return state.docs
    .filter((item) => normalizeDocSection(item.section) === "Dokumentacja KGiGW")
    .filter((item) => kind === "all" || item.category === kind)
    .filter((item) => {
      if (!search) return true;
      return [item.title, item.category, item.date, item.notes, docFileName(item)]
        .map(normalizeSearchText)
        .join(" ")
        .includes(search);
    })
    .sort(documentationSortComparator(sort));
}

function documentationSortComparator(sort) {
  const byDate = (a, b) => String(a.date || "").localeCompare(String(b.date || ""));
  const byTitle = (a, b) => String(a.title || "").localeCompare(String(b.title || ""), "pl");
  const byKind = (a, b) => String(a.category || "").localeCompare(String(b.category || ""), "pl") || byTitle(a, b);
  if (sort === "date_asc") return byDate;
  if (sort === "title_asc") return byTitle;
  if (sort === "title_desc") return (a, b) => byTitle(b, a);
  if (sort === "kind_asc") return byKind;
  return (a, b) => byDate(b, a);
}

function documentationRowHtml(item) {
  return `
    <div>
      <strong>${escapeHtml(item.category || "Dokumentacja")} - ${escapeHtml(item.title)}</strong>
      <small>
        ${formatDate(item.date)}<br>
        ${escapeHtml(item.notes || "")}
        ${docFileName(item) ? `<br>Plik: ${escapeHtml(docFileName(item))}` : ""}
      </small>
    </div>
    <div class="row-actions">
      ${docHasFile(item) ? `<button class="small-button" onclick="openDocumentAttachment('${item.id}')">Otwórz / Pobierz</button>` : ""}
      ${canCorrect() ? `<button class="small-button" onclick="editDocumentationDoc('${item.id}')">Edytuj</button>` : ""}
      ${isAdmin() ? `<button class="delete-button" onclick="deleteDocumentationDoc('${item.id}')">Usuń</button>` : ""}
    </div>
  `;
}

function renderSectionDocs(sectionName) {
  const container = sectionName === "Wzory" ? elements.docsTemplatesList : elements.docsNotesList;
  if (!container) return;
  const docs = filteredSectionDocs(sectionName);
  const emptyText = sectionName === "Wzory" ? "Brak wzorów w tej sekcji." : "Brak notatek w tej sekcji.";
  container.innerHTML = docs.length
    ? docs.map((item) => `<div class="row section-doc-row">${sectionDocRowHtml(item, sectionName)}</div>`).join("")
    : `<div class="row"><small>${emptyText}</small></div>`;
}

function filteredSectionDocs(sectionName) {
  const isTemplate = sectionName === "Wzory";
  const search = normalizeSearchText(isTemplate ? elements.templateSearch?.value || "" : elements.noteSearch?.value || "");
  const category = isTemplate ? elements.templateCategoryFilter?.value || "all" : "all";
  const sort = isTemplate ? elements.templateSort?.value || "date_desc" : elements.noteSort?.value || "date_desc";
  return state.docs
    .filter((item) => normalizeDocSection(item.section) === sectionName)
    .filter((item) => category === "all" || item.category === category)
    .filter((item) => {
      if (!search) return true;
      return [item.title, item.category, item.date, item.notes, docFileName(item)]
        .map(normalizeSearchText)
        .join(" ")
        .includes(search);
    })
    .sort(sectionDocSortComparator(sort));
}

function sectionDocSortComparator(sort) {
  const byDate = (a, b) => String(a.date || "").localeCompare(String(b.date || ""));
  const byTitle = (a, b) => String(a.title || "").localeCompare(String(b.title || ""), "pl");
  if (sort === "date_asc") return byDate;
  if (sort === "title_asc") return byTitle;
  if (sort === "title_desc") return (a, b) => byTitle(b, a);
  return (a, b) => byDate(b, a);
}

function sectionDocRowHtml(item, sectionName) {
  const fileName = docFileName(item);
  const openText = sectionName === "Wzory" ? "Otwórz PDF" : "Otwórz plik";
  return `
    <div>
      <strong>${escapeHtml(item.title)}</strong>
      <small>
        ${formatDate(item.date)}${sectionName === "Wzory" ? ` · <span class="badge neutral">${escapeHtml(item.category || "Wzór")}</span>` : ""}<br>
        ${escapeHtml(item.notes || "")}
        ${fileName ? `<br>PDF: ${escapeHtml(fileName)} (${formatBytes(docFileSize(item))})` : ""}
      </small>
    </div>
    <div class="row-actions">
      ${canCorrect() ? `<button class="small-button" onclick="${sectionName === "Wzory" ? "editTemplateDoc" : "editNoteDoc"}('${item.id}')">Edytuj</button>` : ""}
      ${docHasFile(item) ? `<button class="small-button" onclick="openDocumentAttachment('${item.id}')">${openText}</button>` : ""}
      ${isAdmin() ? `<button class="delete-button" onclick="removeItem('docs', '${item.id}')">Usuń</button>` : ""}
    </div>
  `;
}

function renderDocSectionList(container, sectionName) {
  if (!container) return;
  const docs = filterItems(state.docs.filter((item) => normalizeDocSection(item.section) === sectionName));
  container.innerHTML = docs.length ? docs.map((item) => `<div class="row">${docRowHtml(item)}</div>`).join("") : '<div class="row"><small>Brak dokumentów w tej sekcji.</small></div>';
}

function docRowHtml(item) {
  return `
    <div>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${formatDate(item.date)} · ${escapeHtml(item.sender || "Brak nadawcy")} · <span class="badge neutral">${escapeHtml(item.category)}</span> · Sekcja: ${escapeHtml(normalizeDocSection(item.section))}<br>${escapeHtml(item.notes || "")}${item.fundingSourceName ? `<br>Źródło: ${escapeHtml(item.fundingSourceName)}` : ""}${item.transactionId ? "<br>Finanse: wydatek powiązany" : ""}${docFileName(item) ? `<br>PDF: ${escapeHtml(docFileName(item))} (${formatBytes(docFileSize(item))})` : ""}</small>
    </div>
    <div class="row-actions">
      ${canCorrect() ? `<button class="small-button" onclick="editDoc('${item.id}')">Edytuj</button>` : ""}
      ${docHasFile(item) ? `<button class="small-button" onclick="openDocumentAttachment('${item.id}')">Otwórz PDF</button>` : ""}
      ${isAdmin() ? `<button class="delete-button" onclick="removeItem('docs', '${item.id}')">Usuń</button>` : ""}
    </div>
  `;
}

function normalizeDocSection(value) {
  const normalized = String(value || "").trim();
  if (normalized === "Dokumentacja") return "Dokumentacja KGiGW";
  return DOC_SECTIONS.includes(normalized) ? normalized : DOC_SECTION_DEFAULT;
}

function docTabForSection(section) {
  const normalized = normalizeDocSection(section);
  return Object.entries(DOC_SECTION_TABS).find(([, label]) => label === normalized)?.[0] || "documents";
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
  form.section.value = normalizeDocSection(doc.section);
  form.date.value = doc.date || new Date().toISOString().slice(0, 10);
  form.eventId.value = doc.eventId || "";
  renderFundingSourceOptions(doc.fundingSourceId || "");
  form.fundingSourceId.value = doc.fundingSourceId || "";
  form.incomeAmount.value = "";
  form.expenseAmount.value = "";
  form.documentMoneyAction.value = "save_only";
  form.notes.value = doc.notes || "";
  elements.docFormTitle.textContent = "Edytuj dokument";
  form.querySelector('button[type="submit"]').textContent = "Zapisz zmiany";
  elements.cancelDocEdit.classList.remove("hidden");
  switchDocTab("documents");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function editDocumentationDoc(id) {
  if (!canCorrect()) return;
  const doc = state.docs.find((item) => item.id === id);
  const form = elements.documentationForm;
  if (!doc || !form) return;
  switchDocTab("documentation");
  form.id.value = doc.id;
  form.title.value = doc.title || "";
  form.kind.value = DOCUMENTATION_KGIGW_TYPES.includes(doc.category) ? doc.category : "Statut";
  form.date.value = doc.date || new Date().toISOString().slice(0, 10);
  form.notes.value = doc.notes || "";
  form.file.value = "";
  if (elements.documentationFormTitle) elements.documentationFormTitle.textContent = "Edytuj dokumentację KGiGW";
  form.querySelector('button[type="submit"]').textContent = "Zapisz zmiany";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function editTemplateDoc(id) {
  editSectionDoc(id, "Wzory");
}

function editNoteDoc(id) {
  editSectionDoc(id, "Notatki");
}

function editSectionDoc(id, sectionName) {
  if (!canCorrect()) return;
  const doc = state.docs.find((item) => item.id === id);
  const form = sectionName === "Wzory" ? elements.templateForm : elements.noteForm;
  if (!doc || !form) return;
  switchDocTab(sectionName === "Wzory" ? "templates" : "notes");
  form.id.value = doc.id;
  form.title.value = doc.title || "";
  if (sectionName === "Wzory") {
    form.category.value = doc.category || "Formularz";
  }
  form.date.value = doc.date || new Date().toISOString().slice(0, 10);
  form.notes.value = doc.notes || "";
  form.file.value = "";
  const titleElement = sectionName === "Wzory" ? elements.templateFormTitle : elements.noteFormTitle;
  if (titleElement) titleElement.textContent = sectionName === "Wzory" ? "Edytuj wzór" : "Edytuj notatkę";
  form.querySelector('button[type="submit"]').textContent = sectionName === "Wzory" ? "Zapisz zmiany" : "Zapisz zmiany";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetDocumentationForm(form) {
  if (!form) return;
  form.reset();
  form.id.value = "";
  form.date.valueAsDate = new Date();
  if (elements.documentationFormTitle) elements.documentationFormTitle.textContent = "Dodaj dokumentację KGiGW";
  form.querySelector('button[type="submit"]').textContent = "Zapisz dokumentację";
}

function clearDocumentationFilters() {
  if (elements.documentationSearch) elements.documentationSearch.value = "";
  if (elements.documentationKindFilter) elements.documentationKindFilter.value = "all";
  if (elements.documentationSort) elements.documentationSort.value = "date_desc";
  renderDocs();
}

function resetSectionDocForm(form, sectionName) {
  if (!form) return;
  form.reset();
  form.id.value = "";
  form.date.valueAsDate = new Date();
  if (sectionName === "Notatki" && form.category) form.category.value = "Notatka";
  const titleElement = sectionName === "Wzory" ? elements.templateFormTitle : elements.noteFormTitle;
  if (titleElement) titleElement.textContent = sectionName === "Wzory" ? "Dodaj wzór" : "Dodaj notatkę";
  form.querySelector('button[type="submit"]').textContent = sectionName === "Wzory" ? "Zapisz wzór" : "Zapisz notatkę";
}

function clearSectionDocFilters(sectionName) {
  if (sectionName === "Wzory") {
    if (elements.templateSearch) elements.templateSearch.value = "";
    if (elements.templateCategoryFilter) elements.templateCategoryFilter.value = "all";
    if (elements.templateSort) elements.templateSort.value = "date_desc";
  } else {
    if (elements.noteSearch) elements.noteSearch.value = "";
    if (elements.noteSort) elements.noteSort.value = "date_desc";
  }
  renderDocs();
}

async function deleteDocumentationDoc(id) {
  const doc = state.docs.find((entry) => entry.id === id);
  if (!doc) return;
  if (!isAdmin()) {
    alert("Dokumentację KGiGW może usuwać tylko Administrator.");
    return;
  }
  const confirmed = confirm(`Usunąć dokumentację KGiGW: ${doc.title || "wybrany wpis"}? Tej operacji nie da się cofnąć.`);
  if (!confirmed) return;

  if (supabaseClient && currentRole) {
    if (doc.filePath) {
      await supabaseClient.storage.from(DOCUMENT_BUCKET).remove([doc.filePath]);
    }
    const { error } = await supabaseClient.from("documents").delete().eq("id", id);
    if (error) {
      alert(`Nie udało się usunąć dokumentacji KGiGW w Supabase: ${error.message}`);
      return;
    }
    await logActivity("Dokumenty", "Usunięcie dokumentacji KGiGW", {
      summary: `${doc.title || id} - ${doc.category || "Dokumentacja KGiGW"}`
    });
    await refreshSupabaseData();
    showToast("Usunięto dokumentację KGiGW");
    return;
  }

  rememberUndo();
  state.docs = state.docs.filter((entry) => entry.id !== id);
  saveState();
  renderDocs();
  renderStorageInfo();
  await logActivity("Dokumenty", "Usunięcie dokumentacji KGiGW", {
    summary: `${doc.title || id} - ${doc.category || "Dokumentacja KGiGW"}`
  });
  showToast("Usunięto dokumentację KGiGW");
}

function cancelDocEdit() {
  resetDocForm(document.querySelector("#docForm"));
}

function resetDocForm(form) {
  if (!form) return;
  form.reset();
  form.id.value = "";
  form.section.value = DOC_SECTION_DEFAULT;
  form.date.valueAsDate = new Date();
  form.fundingSourceId.value = "";
  form.documentMoneyAction.value = "save_only";
  elements.docFormTitle.textContent = "Dodaj dokument lub wiadomość";
  form.querySelector('button[type="submit"]').textContent = "Zapisz dokument";
  elements.cancelDocEdit.classList.add("hidden");
  renderEventOptions();
  renderFundingSourceOptions();
}

function renderStorageInfo() {
  if (!elements.storageTexts?.length || !elements.storageBars?.length) return;
  const used = state.docs.reduce((sum, doc) => sum + docFileSize(doc), 0);
  const percent = Math.min(100, Math.round((used / STORAGE_LIMIT_BYTES) * 100));
  elements.storageTexts.forEach((item) => {
    item.textContent = `${formatBytes(used)} / ${formatBytes(STORAGE_LIMIT_BYTES)} (${percent}%)`;
  });
  elements.storageBars.forEach((item) => {
    item.style.width = `${percent}%`;
    item.className = percent >= 90 ? "danger" : percent >= 70 ? "warning" : "";
  });
}

function renderInvoices() {
  const invoices = filteredInvoices();
  elements.invoicesList.innerHTML = invoices.length ? invoices.map((invoice) => `<div class="row ${invoice.rowType === "request" ? "invoice-request-row" : ""}">${invoice.rowType === "request" ? invoiceRequestRow(invoice) : invoiceRow(invoice)}</div>`).join("") : '<div class="row"><small>Brak faktur pasujących do filtrów.</small></div>';
}

function invoiceRow(invoice) {
  return `
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
  `;
}

function filteredInvoices() {
  const search = normalizeSearchText(elements.invoiceSearch?.value || "");
  const payment = elements.invoicePaymentFilter?.value || "all";
  const method = elements.invoiceMethodFilter?.value || "all";
  const rental = elements.invoiceRentalFilter?.value || "all";
  const dateFrom = elements.invoiceDateFrom?.value || "";
  const dateTo = elements.invoiceDateTo?.value || "";
  const sort = elements.invoiceSort?.value || "date_desc";
  return [
    ...state.invoices.map((invoice) => ({ ...invoice, rowType: "invoice" })),
    ...state.invoiceRequests.map((request) => ({ ...request, rowType: "request" }))
  ]
    .filter((invoice) => invoiceMatchesSearch(invoice, search))
    .filter((invoice) => {
      if (invoice.rowType === "request") return invoiceRequestMatchesPaymentFilter(invoice, payment);
      if (payment === "all") return true;
      if (payment === "paid") return isInvoicePaid(invoice.paymentStatus);
      if (payment === "unpaid") return !isInvoicePaid(invoice.paymentStatus);
      return isInvoiceOverdue(invoice);
    })
    .filter((invoice) => {
      if (invoice.rowType === "request") return invoiceRequestMatchesMethodFilter(invoice, method);
      const invoiceMethod = invoicePaymentMethodCode(invoice);
      if (method === "all") return true;
      if (method === "none") return !invoiceMethod;
      return invoiceMethod === method;
    })
    .filter((invoice) => {
      if (rental === "all") return true;
      if (invoice.rowType === "request") return rental === "no_rental";
      return rental === "rental" ? Boolean(invoice.rentalId) : !invoice.rentalId;
    })
    .filter((invoice) => !dateFrom || String(invoice.date || "") >= dateFrom)
    .filter((invoice) => !dateTo || String(invoice.date || "") <= dateTo)
    .sort(invoiceSortComparator(sort));
}

function invoiceMatchesSearch(invoice, search) {
  if (invoice.rowType === "request") return invoiceRequestMatchesSearch(invoice, search);
  if (!search) return true;
  const plainAmount = String(invoice.gross || "").replace(".", ",");
  const compactNip = String(invoice.buyerNip || "").replace(/\D/g, "");
  const haystack = [
    invoice.number,
    `faktura ${invoice.number || ""}`,
    invoice.buyerName,
    invoice.buyerAddress,
    invoice.buyerNip,
    compactNip,
    money(invoice.gross),
    String(invoice.gross || ""),
    plainAmount,
    invoicePaymentStatusLabel(invoice.paymentStatus),
    invoicePaymentMethodLabel(invoice.paymentMethod || invoicePaymentMethod(invoice.paymentStatus)),
    invoice.source,
    invoice.itemName,
    invoice.rentalLabel,
    invoice.notes
  ].map(normalizeSearchText).join(" ");
  const searchable = `${haystack} ${haystack.replace(/[^a-z0-9ąćęłńóśźż]+/gi, " ")}`;
  return search.split(" ").filter(Boolean).every((term) => searchable.includes(term));
}

function invoiceRequestRow(request) {
  const statusLabel = invoiceRequestStatusLabel(request.status);
  if (editingInvoiceRequestId === request.id) return invoiceRequestEditForm(request);
  return `
    <div>
      <strong>ZGŁOSZENIE ZE STOISKA - ${escapeHtml(request.buyerName || "Brak nabywcy")} - ${money(request.gross)}</strong>
      <small>
        ${formatDate(request.date)} - NIP: ${escapeHtml(request.buyerNip || "brak")} - E-mail: ${escapeHtml(request.buyerEmail || "brak")}<br>
        Telefon: ${escapeHtml(request.buyerPhone || "brak")} - Płatność: ${escapeHtml(invoiceRequestPaymentLabel(request.paymentMethod))}<br>
        Adres: ${escapeHtml(request.buyerAddress || "brak adresu")}<br>
        Opis: ${escapeHtml(request.itemDescription || "brak opisu")}<br>
        Status: <span class="badge ${invoiceRequestStatusClass(request.status)}">${escapeHtml(statusLabel)}</span>
        <span class="badge neutral">Zgłoszenie</span>
        ${request.notes ? `<br>Uwagi: ${escapeHtml(request.notes)}` : ""}
      </small>
    </div>
    <div class="row-actions">
      ${request.status !== "wystawiona" ? `<button class="small-button" onclick="prepareInvoiceFromRequest('${request.id}')">Utwórz fakturę</button>` : '<span class="badge paid">Faktura wystawiona</span>'}
      <button class="small-button" onclick="editInvoiceRequest('${request.id}')">Edytuj</button>
      <button class="small-button" onclick="prepareInvoiceRequestEmail('${request.id}')">Przygotuj e-mail</button>
      ${request.status !== "w_trakcie" ? `<button class="small-button" onclick="updateInvoiceRequestStatus('${request.id}', 'w_trakcie')">Oznacz jako w trakcie</button>` : ""}
      <button class="small-button" onclick="printInvoiceRequest('${request.id}')">Drukuj zgłoszenie</button>
      ${request.status !== "anulowana" ? `<button class="delete-button" onclick="updateInvoiceRequestStatus('${request.id}', 'anulowana')">Anuluj zgłoszenie</button>` : ""}
    </div>
  `;
}

function invoiceRequestEditForm(request) {
  return `
    <form class="invoice-request-edit" onsubmit="saveInvoiceRequestEdit(event, '${request.id}')">
      <h3>Edytuj zgłoszenie ze stoiska</h3>
      <div class="form-grid">
        <input name="buyerName" required placeholder="Nabywca" value="${escapeHtml(request.buyerName || "")}" />
        <input name="buyerNip" placeholder="NIP" value="${escapeHtml(request.buyerNip || "")}" />
        <input name="buyerEmail" type="email" placeholder="E-mail" value="${escapeHtml(request.buyerEmail || "")}" />
        <input name="buyerPhone" placeholder="Telefon" value="${escapeHtml(request.buyerPhone || "")}" />
        <input name="gross" type="number" min="0" step="0.01" placeholder="Kwota brutto" value="${Number(request.gross || 0)}" />
        <select name="paymentMethod">
          <option value="">Forma płatności: brak</option>
          <option value="cash" ${invoiceRequestPaymentCode(request.paymentMethod) === "cash" ? "selected" : ""}>Gotówka</option>
          <option value="transfer" ${invoiceRequestPaymentCode(request.paymentMethod) === "transfer" ? "selected" : ""}>Przelew</option>
          <option value="other" ${invoiceRequestPaymentCode(request.paymentMethod) === "other" ? "selected" : ""}>Płatność on-line / inna</option>
        </select>
        <select name="status">
          <option value="do_wystawienia" ${request.status === "do_wystawienia" ? "selected" : ""}>Do wystawienia</option>
          <option value="w_trakcie" ${request.status === "w_trakcie" ? "selected" : ""}>W trakcie</option>
          <option value="wystawiona" ${request.status === "wystawiona" ? "selected" : ""}>Wystawiona</option>
          <option value="anulowana" ${request.status === "anulowana" ? "selected" : ""}>Anulowana</option>
        </select>
      </div>
      <input name="buyerAddress" placeholder="Adres" value="${escapeHtml(request.buyerAddress || "")}" />
      <textarea name="itemDescription" placeholder="Opis zakupu">${escapeHtml(request.itemDescription || "")}</textarea>
      <textarea name="notes" placeholder="Uwagi">${escapeHtml(request.notes || "")}</textarea>
      <div class="row-actions">
        <button class="small-button" type="submit">Zapisz zmiany</button>
        <button class="small-button secondary-button" type="button" onclick="cancelInvoiceRequestEdit()">Anuluj</button>
      </div>
    </form>
  `;
}

function invoiceRequestMatchesSearch(request, search) {
  if (!search) return true;
  const plainAmount = String(request.gross || "").replace(".", ",");
  const compactNip = String(request.buyerNip || "").replace(/\D/g, "");
  const haystack = [
    "zgłoszenie ze stoiska",
    "zgloszenie ze stoiska",
    request.buyerName,
    request.buyerAddress,
    request.buyerNip,
    compactNip,
    request.buyerEmail,
    request.buyerPhone,
    request.itemDescription,
    money(request.gross),
    String(request.gross || ""),
    plainAmount,
    invoiceRequestPaymentLabel(request.paymentMethod),
    invoiceRequestStatusLabel(request.status),
    request.eventName,
    request.notes
  ].map(normalizeSearchText).join(" ");
  const searchable = `${haystack} ${haystack.replace(/[^a-z0-9ąćęłńóśźż]+/gi, " ")}`;
  return search.split(" ").filter(Boolean).every((term) => searchable.includes(term));
}

function invoiceRequestMatchesPaymentFilter(request, filter) {
  if (filter === "all") return request.status !== "anulowana";
  if (filter === "paid") return request.status === "wystawiona";
  if (filter === "unpaid") return request.status === "do_wystawienia" || request.status === "w_trakcie";
  return false;
}

function invoiceRequestMatchesMethodFilter(request, filter) {
  const method = invoiceRequestPaymentCode(request.paymentMethod);
  if (filter === "all") return true;
  if (filter === "none") return !method;
  return method === filter;
}

function invoiceSortComparator(sort) {
  const byDate = (a, b) => String(a.date || "").localeCompare(String(b.date || ""));
  const byAmount = (a, b) => Number(a.gross || 0) - Number(b.gross || 0);
  const byNumber = (a, b) => String(a.number || "").localeCompare(String(b.number || ""), "pl", { numeric: true });
  const byBuyer = (a, b) => String(a.buyerName || "").localeCompare(String(b.buyerName || ""), "pl");
  if (sort === "date_asc") return byDate;
  if (sort === "amount_desc") return (a, b) => byAmount(b, a);
  if (sort === "amount_asc") return byAmount;
  if (sort === "number_asc") return byNumber;
  if (sort === "number_desc") return (a, b) => byNumber(b, a);
  if (sort === "buyer_asc") return byBuyer;
  if (sort === "buyer_desc") return (a, b) => byBuyer(b, a);
  return (a, b) => byDate(b, a);
}

function clearInvoiceFilters() {
  if (elements.invoiceSearch) elements.invoiceSearch.value = "";
  if (elements.invoiceSort) elements.invoiceSort.value = "date_desc";
  if (elements.invoicePaymentFilter) elements.invoicePaymentFilter.value = "all";
  if (elements.invoiceMethodFilter) elements.invoiceMethodFilter.value = "all";
  if (elements.invoiceRentalFilter) elements.invoiceRentalFilter.value = "all";
  if (elements.invoiceDateFrom) elements.invoiceDateFrom.value = "";
  if (elements.invoiceDateTo) elements.invoiceDateTo.value = "";
  renderInvoices();
}

function invoicePaymentMethodCode(invoice) {
  const value = normalizeText(invoice.paymentMethod || invoicePaymentMethod(invoice.paymentStatus));
  if (value === "cash" || value === "gotówka") return "cash";
  if (value === "transfer" || value === "przelew") return "transfer";
  if (value === "other" || value.includes("inna") || value.includes("online") || value.includes("on-line")) return "other";
  return "";
}

function invoiceRequestStatusLabel(status) {
  const labels = {
    do_wystawienia: "Do wystawienia",
    w_trakcie: "W trakcie",
    wystawiona: "Wystawiona",
    anulowana: "Anulowana"
  };
  return labels[status] || status || "Do wystawienia";
}

function invoiceRequestStatusClass(status) {
  if (status === "wystawiona") return "paid";
  if (status === "anulowana") return "due";
  if (status === "w_trakcie") return "returned";
  return "neutral";
}

function invoiceRequestPaymentCode(method) {
  const value = normalizeText(method);
  if (value === "cash" || value.includes("got")) return "cash";
  if (value === "transfer" || value.includes("przelew")) return "transfer";
  if (value === "other" || value.includes("inna") || value.includes("online") || value.includes("on-line")) return "other";
  return "";
}

function invoiceRequestPaymentLabel(method) {
  const code = invoiceRequestPaymentCode(method);
  if (code === "cash") return "Gotówka";
  if (code === "transfer") return "Przelew";
  if (code === "other") return "Płatność on-line / inna";
  return method || "brak";
}

function isInvoiceOverdue(invoice) {
  const today = new Date().toISOString().slice(0, 10);
  return !isInvoicePaid(invoice.paymentStatus) && Boolean(invoice.paymentDueDate) && invoice.paymentDueDate < today;
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
  const boardMembers = state.members.filter((member) => isBoardRole(member.boardRole));
  if (!boardMembers.length) {
    elements.boardList.innerHTML = `
      <div class="notice">Zarząd jest tworzony automatycznie na podstawie funkcji ustawionej w module Członkowie.</div>
      <div class="row"><small>Brak osób z przypisaną funkcją w zarządzie. Funkcję można nadać w module Członkowie.</small></div>
    `;
    return;
  }
  elements.boardList.innerHTML = `
    <div class="notice">Zarząd jest tworzony automatycznie na podstawie funkcji ustawionej w module Członkowie.</div>
    ${rows(filterItems(boardMembers), (item) => `
    <div>
      <strong>${escapeHtml(item.boardRole)}: ${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.phone || "Brak telefonu")} · ${escapeHtml(item.email || "Brak e-maila")} · ${escapeHtml(item.status || "Aktywny")}</small>
    </div>
  `)}
  `;
}

function renderFeeOptions() {
  elements.feeMember.innerHTML = state.members.map((member) => `<option value="${escapeHtml(member.id)}">${escapeHtml(member.name)}</option>`).join("");
}

function feeMemberRows() {
  const memberRows = state.members.map((member) => feeMemberRowData(member));
  const knownNames = new Set(state.members.map((member) => normalizeSearchText(member.name)));
  const feeOnlyNames = state.fees
    .map((fee) => fee.member)
    .filter((name) => name && !knownNames.has(normalizeSearchText(name)));
  const legacyRows = [...new Set(feeOnlyNames)].map((name) => feeMemberRowData({
    id: "",
    name,
    phone: "",
    email: "",
    membershipType: "Zwyczajny",
    status: "Aktywny"
  }));
  return [...memberRows, ...legacyRows].sort(feeSortComparator("status_late_first"));
}

function feeMemberRowData(member) {
  const name = member?.name || "Bez nazwy";
  const fees = state.fees.filter((fee) => {
    const feeYearMatches = feeYear(fee.year || fee.period) === FEE_YEAR;
    if (!feeYearMatches) return false;
    if (member?.id && fee.memberId) return fee.memberId === member.id;
    return normalizeSearchText(fee.member) === normalizeSearchText(name);
  });
    const paid = fees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    const due = Math.max(0, ANNUAL_FEE - paid);
    const stages = feeStages(paid);
    const currentRequired = requiredFeeToday();
    const currentDue = Math.max(0, currentRequired - paid);
    const paidUntil = paidUntilLabel(paid);
    const latestPaymentDate = fees
      .map((fee) => fee.paidAt || fee.date || "")
      .filter(Boolean)
      .sort((a, b) => String(b).localeCompare(String(a)))[0] || "";
  return {
    name,
    phone: member?.phone || "",
    email: member?.email || "",
    membershipType: member?.membershipType || "Zwyczajny",
    memberStatus: member?.status || "Aktywny",
    fees,
    due,
    currentDue,
    paid,
    paidUntil,
    currentRequired,
    required: ANNUAL_FEE,
    latestPaymentDate,
    hasDue: due > 0,
    isLate: currentDue > 0,
    stages
  };
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
            <span class="fee-contact-name">${escapeHtml(item.name)}</span>
            <span class="fee-contact-due">zaległość: ${money(item.currentDue)}</span>
            <span class="fee-contact-actions">${feeContactLinks(item)}</span>
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
  showFeeContactPanel = !showFeeContactPanel;
  renderFees();
  showToast(showFeeContactPanel ? "Pokazano listę kontaktów do osób z zaległością" : "Schowano listę kontaktów");
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
  const normalizedValue = field === "quantity"
    ? Math.max(0, Math.round(Number(value) || 0))
    : field === "replacementValue" && String(value).trim() === ""
      ? null
      : Math.max(0, Number(value) || 0);
  if (supabaseClient && currentRole) {
    const columnMap = {
      quantity: "quantity",
      price: "price_per_day",
      replacementValue: "replacement_value"
    };
    const column = columnMap[field] || "price_per_day";
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
  const replacementValue = String(data.replacementValue || "").trim() === "" ? null : Math.max(0, Number(data.replacementValue) || 0);

  if (!name) {
    alert("Wpisz nazwę przedmiotu.");
    return;
  }

  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient.from("rental_inventory").insert({
      name,
      quantity,
      price_per_day: price,
      replacement_value: replacementValue
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
    price,
    replacementValue
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

function openFeePrintModal() {
  elements.feePrintModal?.classList.remove("hidden");
}

function closeFeePrintModal() {
  elements.feePrintModal?.classList.add("hidden");
}

async function printFeesReport() {
  const scopes = {
    all: { key: "all", label: "Wszystkie składki" },
    late: { key: "late", label: "Tylko zaległe" },
    paid: { key: "paid", label: "Tylko opłacone" },
    visible: { key: "visible", label: "Aktualnie widoczna lista" }
  };
  const selected = document.querySelector('input[name="feePrintScope"]:checked')?.value || "all";
  const scope = scopes[selected] || scopes.all;
  const rows = feeRowsForPrint(scope.key);
  elements.printSheet.innerHTML = feesReportHtml(rows, scope.label);
  closeFeePrintModal();
  await logActivity("Składki", "Druk listy składek", { summary: scope.label });
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

async function editInvoiceRequest(id) {
  const request = state.invoiceRequests.find((entry) => entry.id === id);
  if (!request) return;
  editingInvoiceRequestId = id;
  renderInvoices();
  return;
  const statusOptions = "do_wystawienia, w_trakcie, wystawiona, anulowana";
  const updated = {
    buyerName: prompt("Nabywca:", request.buyerName || "") ?? request.buyerName,
    buyerNip: prompt("NIP:", request.buyerNip || "") ?? request.buyerNip,
    buyerAddress: prompt("Adres:", request.buyerAddress || "") ?? request.buyerAddress,
    buyerEmail: prompt("E-mail:", request.buyerEmail || "") ?? request.buyerEmail,
    buyerPhone: prompt("Telefon:", request.buyerPhone || "") ?? request.buyerPhone,
    itemDescription: prompt("Opis zakupu:", request.itemDescription || "") ?? request.itemDescription,
    gross: request.gross,
    paymentMethod: prompt("Forma płatności:", request.paymentMethod || "") ?? request.paymentMethod,
    notes: prompt("Uwagi:", request.notes || "") ?? request.notes,
    status: prompt(`Status (${statusOptions}):`, request.status || "do_wystawienia") ?? request.status
  };
  const amountInput = prompt("Kwota brutto:", String(request.gross || 0).replace(".", ","));
  if (amountInput !== null) {
    const amount = Number(String(amountInput).replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) {
      alert("Podaj poprawną kwotę brutto.");
      return;
    }
    updated.gross = amount;
  }
  if (!["do_wystawienia", "w_trakcie", "wystawiona", "anulowana"].includes(updated.status)) {
    alert(`Status musi mieć jedną z wartości: ${statusOptions}.`);
    return;
  }

  const payload = {
    buyer_name: updated.buyerName || "",
    buyer_nip: updated.buyerNip || "",
    buyer_address: updated.buyerAddress || "",
    buyer_email: updated.buyerEmail || "",
    buyer_phone: updated.buyerPhone || "",
    item_description: updated.itemDescription || "",
    amount_brutto: updated.gross || 0,
    payment_method: updated.paymentMethod || "",
    notes: updated.notes || "",
    status: updated.status || "do_wystawienia"
  };

  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient
      .from("invoice_requests")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("Nie udało się edytować zgłoszenia ze stoiska.", { id, payload, error });
      alert(`Nie udało się zapisać zmian: ${error.message}`);
      return;
    }
    await logActivity("Faktury", "Edycja zgłoszenia ze stoiska", { summary: `${updated.buyerName || "Brak nabywcy"} - ${money(updated.gross)}` });
    await refreshSupabaseData();
    showToast("Zapisano zmiany w zgłoszeniu");
    return;
  }

  Object.assign(request, updated);
  saveState();
  render();
  await logActivity("Faktury", "Edycja zgłoszenia ze stoiska", { summary: `${updated.buyerName || "Brak nabywcy"} - ${money(updated.gross)}` });
  showToast("Zapisano zmiany w zgłoszeniu");
}

function cancelInvoiceRequestEdit() {
  editingInvoiceRequestId = "";
  renderInvoices();
}

async function saveInvoiceRequestEdit(event, id) {
  event.preventDefault();
  const request = state.invoiceRequests.find((entry) => entry.id === id);
  if (!request) return;
  const data = formData(event.target);
  const amount = Number(String(data.gross || 0).replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) {
    alert("Podaj poprawną kwotę brutto.");
    return;
  }
  const updated = {
    buyerName: data.buyerName || "",
    buyerNip: data.buyerNip || "",
    buyerAddress: data.buyerAddress || "",
    buyerEmail: data.buyerEmail || "",
    buyerPhone: data.buyerPhone || "",
    itemDescription: data.itemDescription || "",
    gross: amount,
    paymentMethod: data.paymentMethod || "",
    notes: data.notes || "",
    status: data.status || "do_wystawienia"
  };
  const payload = {
    buyer_name: updated.buyerName,
    buyer_nip: updated.buyerNip,
    buyer_address: updated.buyerAddress,
    buyer_email: updated.buyerEmail,
    buyer_phone: updated.buyerPhone,
    item_description: updated.itemDescription,
    amount_brutto: updated.gross,
    payment_method: updated.paymentMethod,
    notes: updated.notes,
    status: updated.status
  };

  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient
      .from("invoice_requests")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("Nie udało się edytować zgłoszenia ze stoiska.", { id, payload, error });
      alert(`Nie udało się zapisać zmian: ${error.message}`);
      return;
    }
    editingInvoiceRequestId = "";
    await logActivity("Faktury", "Edycja zgłoszenia ze stoiska", { summary: `${updated.buyerName || "Brak nabywcy"} - ${money(updated.gross)}` });
    await refreshSupabaseData();
    showToast("Zapisano zmiany w zgłoszeniu");
    return;
  }

  Object.assign(request, updated);
  editingInvoiceRequestId = "";
  saveState();
  render();
  await logActivity("Faktury", "Edycja zgłoszenia ze stoiska", { summary: `${updated.buyerName || "Brak nabywcy"} - ${money(updated.gross)}` });
  showToast("Zapisano zmiany w zgłoszeniu");
}

function prepareInvoiceFromRequest(id) {
  const request = state.invoiceRequests.find((entry) => entry.id === id);
  if (!request) return;
  if (request.status === "wystawiona") {
    alert("To zgłoszenie jest już oznaczone jako wystawione. Nie można utworzyć drugiej faktury z tego samego zgłoszenia.");
    return;
  }
  const form = document.querySelector("#invoiceForm");
  if (!form) return;
  const gross = Number(request.gross || 0);
  const vatRate = 23;
  const net = gross / (1 + vatRate / 100);
  pendingInvoiceRequestId = id;
  switchView("invoices");
  form.rentalId.value = "";
  form.number.value = "";
  form.date.valueAsDate = new Date();
  form.buyerName.value = request.buyerName || "";
  form.buyerAddress.value = request.buyerAddress || "";
  form.buyerNip.value = request.buyerNip || "";
  form.source.value = "Sprzedaż";
  form.itemName.value = request.itemDescription || "Sprzedaż ze stoiska";
  form.quantity.value = 1;
  form.unitPrice.value = net.toFixed(2);
  form.vatRate.value = String(vatRate);
  form.paymentStatus.value = "unpaid";
  form.paymentMethod.value = invoiceRequestPaymentCode(request.paymentMethod) || "cash";
  form.paymentDueDate.value = dateOffset(new Date().toISOString().slice(0, 10), 7);
  form.notes.value = [
    request.buyerEmail ? `E-mail: ${request.buyerEmail}` : "",
    request.buyerPhone ? `Telefon: ${request.buyerPhone}` : "",
    request.notes ? `Uwagi zgłoszenia: ${request.notes}` : ""
  ].filter(Boolean).join("\n");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  form.number.focus();
  showToast("Uzupełniono formularz faktury danymi ze zgłoszenia");
}

async function printInvoiceRequest(id) {
  const request = state.invoiceRequests.find((entry) => entry.id === id);
  if (!request) return;
  document.title = "Zgłoszenie danych do faktury";
  elements.printSheet.innerHTML = invoiceRequestPrintHtml(request);
  await logActivity("Faktury", "Druk zgłoszenia ze stoiska", { summary: `${request.buyerName || "Brak nabywcy"} - ${money(request.gross)}` });
  window.print();
}

async function prepareInvoiceRequestEmail(id) {
  const request = state.invoiceRequests.find((entry) => entry.id === id);
  if (!request) return;
  if (!request.buyerEmail) {
    alert("Brak adresu e-mail w zgłoszeniu.");
    return;
  }
  const subject = "Przyjęcie danych do faktury - KGiGW we Włosani";
  const body = [
    "Dzień dobry,",
    "potwierdzamy przyjęcie danych do wystawienia faktury.",
    "Faktura zostanie przygotowana po sprawdzeniu danych.",
    "",
    "KGiGW we Włosani"
  ].join("\n");
  await logActivity("Faktury", "Przygotowanie e-maila do zgłoszenia", { summary: `${request.buyerName || "Brak nabywcy"} - ${money(request.gross)}` });
  window.location.href = `mailto:${encodeURIComponent(request.buyerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

async function updateInvoiceRequestStatus(id, status) {
  const request = state.invoiceRequests.find((entry) => entry.id === id);
  if (!request) return;
  const label = invoiceRequestStatusLabel(status);
  if (status === "anulowana") {
    const confirmed = confirm("Anulować to zgłoszenie ze stoiska?");
    if (!confirmed) return;
  }

  if (supabaseClient && currentRole) {
    const { error } = await supabaseClient
      .from("invoice_requests")
      .update({ status })
      .eq("id", id);
    if (error) {
      console.error("Nie udało się zmienić statusu zgłoszenia ze stoiska.", { id, status, error });
      alert(`Nie udało się zmienić statusu zgłoszenia: ${error.message}`);
      return;
    }
    await logActivity("Faktury", "Zmiana statusu zgłoszenia ze stoiska", { summary: `${request.buyerName || "Brak nabywcy"} - ${label}` });
    await refreshSupabaseData();
    showToast(`Zmieniono status zgłoszenia: ${label}`);
    return;
  }

  request.status = status;
  saveState();
  render();
  await logActivity("Faktury", "Zmiana statusu zgłoszenia ze stoiska", { summary: `${request.buyerName || "Brak nabywcy"} - ${label}` });
  showToast(`Zmieniono status zgłoszenia: ${label}`);
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

function rentalLateDays(dateTo, returnedAt) {
  if (!dateTo || !returnedAt) return 0;
  const planned = new Date(`${dateTo}T12:00:00`);
  const returned = new Date(`${returnedAt}T12:00:00`);
  if (Number.isNaN(planned.getTime()) || Number.isNaN(returned.getTime()) || returned <= planned) return 0;
  return Math.ceil((returned - planned) / 86400000);
}

function rentalPerDayTotal(loan) {
  return (loan.items || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
}

function rentalSettlementTotals(loan, returnedAt = loan.returnedAt || "") {
  const perDay = rentalPerDayTotal(loan);
  const plannedDays = Number(loan.days || rentalDays(loan.dateFrom, loan.dateTo) || 1);
  const plannedCost = Number(loan.total || perDay * plannedDays || 0);
  const lateDays = rentalLateDays(loan.dateTo, returnedAt);
  const lateFee = lateDays * perDay;
  const damageCost = Number(loan.damageCost || 0);
  const damage = Number.isFinite(damageCost) && damageCost > 0 ? damageCost : 0;
  return {
    plannedCost,
    perDay,
    lateDays,
    lateFee,
    damage,
    total: plannedCost + lateFee + damage
  };
}

function rentalSettlementHtml(loan) {
  const settlement = rentalSettlementTotals(loan);
  return `
    <div class="finance-summary">
      <strong>Rozliczenie</strong>
      <small>Koszt za planowany okres: ${money(settlement.plannedCost)}</small>
      <small>Dodatkowe doby po terminie: ${settlement.lateDays}</small>
      <small>Dopłata za opóźnienie: ${money(settlement.lateFee)}</small>
      <small>Dopłata za braki/uszkodzenia: ${money(settlement.damage)}</small>
      <small>Razem do rozliczenia: ${money(settlement.total)}</small>
    </div>
  `;
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

function normalizeSearchText(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00a0/g, " ");
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
  return `${doc.title || "Dokument"} - Sekcja: ${normalizeDocSection(doc.section)}${sourceName !== "Bez źródła" ? ` - Źródło: ${sourceName}` : ""}`;
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
  const replacementValues = rentalReplacementValuesText(loan.items || []);
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
    <section style="margin-top: 8mm;">
      <h3>Oświadczenie</h3>
      <p>Wypożyczający potwierdza odbiór sprzętu w stanie kompletnym i zobowiązuje się do zwrotu w stanie niepogorszonym. W przypadku uszkodzenia, braku lub niezwrócenia sprzętu może zostać obciążony kosztem odtworzenia według poniższych wartości.</p>
      <p>W przypadku zwrotu sprzętu po ustalonym terminie zostanie naliczona opłata za każdą rozpoczętą dodatkową dobę według stawek wypożyczenia sprzętu.</p>
      <p><strong>Wartości odtworzeniowe wypożyczonego sprzętu:</strong><br>${replacementValues}</p>
    </section>
    <div class="print-signatures">
      <div class="signature-line">Podpis wypozyczajacego</div>
      <div class="signature-line">Podpis wydajacego</div>
    </div>
  `;
}

function rentalReplacementValuesText(items = []) {
  const values = items.map((item) => {
    const inventoryItem = state.rentalInventory.find((entry) => entry.id === item.id);
    const replacementValue = item.replacementValue ?? inventoryItem?.replacementValue;
    const valueText = Number(replacementValue || 0) > 0 ? `${money(replacementValue)} / szt.` : "—";
    return `${escapeHtml(item.name)}: ${valueText}`;
  });
  return values.join(" | ") || "—";
}

function returnPrintHtml(loan) {
  const settlement = rentalSettlementTotals(loan);
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
    <section>
      <h3>Rozliczenie zwrotu</h3>
      <p><strong>Planowany termin zwrotu:</strong> ${formatDate(loan.dateTo)}</p>
      <p><strong>Rzeczywista data zwrotu:</strong> ${formatDate(loan.returnedAt)}</p>
      <p><strong>Koszt za planowany okres:</strong> ${money(settlement.plannedCost)}</p>
      <p><strong>Dodatkowe doby po terminie:</strong> ${settlement.lateDays}</p>
      <p><strong>Dopłata za opóźnienie:</strong> ${money(settlement.lateFee)}</p>
      <p><strong>Dopłata za braki/uszkodzenia:</strong> ${money(settlement.damage)}</p>
      <p><strong>Razem do rozliczenia:</strong> ${money(settlement.total)}</p>
    </section>
    <p><strong>Uwagi do zwrotu:</strong> ${escapeHtml(loan.returnNotes || "Brak")}</p>
    <div class="print-signatures">
      <div class="signature-line">Podpis zwracajacego</div>
      <div class="signature-line">Podpis przyjmujacego zwrot</div>
    </div>
  `;
}

function moneyReportHtml(items = filteredMoneyItems()) {
  items = [...items];
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

function feeRowsForPrint(scope) {
  const rows = scope === "visible" ? visibleFeeRows() : feeMemberRows();
  if (scope === "late") return rows.filter((item) => item.isLate);
  if (scope === "paid") return rows.filter((item) => !item.isLate);
  return rows;
}

function feesReportHtml(rows, scopeLabel) {
  const totals = rows.reduce((summary, row) => ({
    due: summary.due + Number(row.required || 0),
    paid: summary.paid + Number(row.paid || 0),
    late: summary.late + Number(row.currentDue || 0)
  }), { due: 0, paid: 0, late: 0 });
  const rowsHtml = rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.membershipType || "Zwyczajny")}</td>
      <td>${money(row.required || ANNUAL_FEE)}</td>
      <td>${money(row.paid || 0)}</td>
      <td>${money(row.currentDue || 0)}</td>
      <td>${row.latestPaymentDate ? formatDate(row.latestPaymentDate) : "—"}</td>
      <td>${row.currentDue > 0 ? "Zaległość" : "Opłacone"}</td>
    </tr>
  `).join("");

  return `
    <div class="fees-print-document">
    <h1>KGiGW we Włosani</h1>
    <h2>Lista składek członkowskich</h2>
    <p><strong>Data wydruku:</strong> ${new Intl.DateTimeFormat("pl-PL").format(new Date())}</p>
    <p><strong>Zakres wydruku:</strong> ${escapeHtml(scopeLabel)}</p>
    <table>
      <thead>
        <tr>
          <th>Lp.</th>
          <th>Członek</th>
          <th>Typ</th>
          <th>Należne</th>
          <th>Zapłacono</th>
          <th>Zaległość</th>
          <th>Data wpłaty</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rowsHtml || '<tr><td colspan="8">Brak pozycji w wybranym zakresie.</td></tr>'}</tbody>
    </table>
    <h3>Podsumowanie</h3>
    <p><strong>Liczba pozycji:</strong> ${rows.length}</p>
    <p><strong>Suma należna:</strong> ${money(totals.due)}</p>
    <p><strong>Suma zapłacono:</strong> ${money(totals.paid)}</p>
    <p><strong>Suma zaległości:</strong> ${money(totals.late)}</p>
    <div class="print-signatures">
      <div class="signature-line">Sporządził/a</div>
      <div class="signature-line">Sprawdził/a</div>
    </div>
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
    <p>${escapeHtml(ORGANIZATION.street)}<br>${escapeHtml(ORGANIZATION.city)}<br>NIP: ${escapeHtml(ORGANIZATION.nip)} · REGON: ${escapeHtml(ORGANIZATION.regon)}</p>
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
            NIP: ${escapeHtml(ORGANIZATION.nip)}<br>
            REGON: ${escapeHtml(ORGANIZATION.regon)}
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

function invoiceRequestPrintHtml(request) {
  return `
    ${organizationHeaderHtml()}
    <h1>Zgłoszenie danych do faktury ze stoiska</h1>
    <p><strong>To jest zgłoszenie danych do faktury, a nie faktura.</strong></p>
    <table>
      <tbody>
        <tr><th>Data zgłoszenia</th><td>${formatDate(request.date)}</td></tr>
        <tr><th>Nabywca</th><td>${escapeHtml(request.buyerName || "brak")}</td></tr>
        <tr><th>NIP</th><td>${escapeHtml(request.buyerNip || "brak")}</td></tr>
        <tr><th>Adres</th><td>${escapeHtml(request.buyerAddress || "brak")}</td></tr>
        <tr><th>E-mail</th><td>${escapeHtml(request.buyerEmail || "brak")}</td></tr>
        <tr><th>Telefon</th><td>${escapeHtml(request.buyerPhone || "brak")}</td></tr>
        <tr><th>Opis zakupu</th><td>${escapeHtml(request.itemDescription || "brak")}</td></tr>
        <tr><th>Kwota brutto</th><td>${money(request.gross)}</td></tr>
        <tr><th>Forma płatności</th><td>${escapeHtml(invoiceRequestPaymentLabel(request.paymentMethod))}</td></tr>
        <tr><th>Status</th><td>${escapeHtml(invoiceRequestStatusLabel(request.status))}</td></tr>
        <tr><th>Uwagi</th><td>${escapeHtml(request.notes || "brak")}</td></tr>
      </tbody>
    </table>
    <div class="print-signatures">
      <div class="signature-line">Podpis / zgłaszający</div>
      <div class="signature-line">Sprawdził/a</div>
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
  return items.filter((item) => normalizeSearchText(Object.values(item).join(" ")).includes(query));
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
      invoice_requests: state.invoiceRequests,
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
        { label: "Typ członkostwa", value: (item) => item.membershipType || "Zwyczajny" },
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
        { label: "Wartość odtworzeniowa", value: (item) => item.replacementValue, type: "money" },
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
        { label: "Sekcja", value: (item) => normalizeDocSection(item.section) },
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
  return state.members.filter((member) => isBoardRole(member.boardRole));
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
    { key: "membershipType", label: "Typ członkostwa", value: (member) => member.membershipType || "Zwyczajny" },
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
