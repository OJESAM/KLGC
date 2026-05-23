import { authAPI, prayerAPI, chatAPI, notesAPI, sermonAPI, devotionalAPI, eventAPI, adminAPI, apiStore } from './api.js';

// DOM elements
const boot = document.querySelector("#boot");
const authForm = document.querySelector("#authForm");
const authState = document.querySelector("#authState");
const welcomeTitle = document.querySelector("#welcomeTitle");
const prayerForm = document.querySelector("#prayerForm");
const prayerInput = document.querySelector("#prayerInput");
const prayerWall = document.querySelector("#prayerWall");
const mobileNav = document.querySelector("#mobileNav");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatMessages = document.querySelector("#chatMessages");
const onlineCount = document.querySelector("#onlineCount");
const eventState = document.querySelector("#eventState");
const audioState = document.querySelector("#audioState");
const notesForm = document.querySelector("#notesForm");
const noteInput = document.querySelector("#noteInput");
const savedNotes = document.querySelector("#savedNotes");
const sermonAdminForm = document.querySelector("#sermonAdminForm");
const devotionalAdminForm = document.querySelector("#devotionalAdminForm");
const eventAdminForm = document.querySelector("#eventAdminForm");
const sermonList = document.querySelector("#sermonList");
const devotionalList = document.querySelector("#devotionalList");
const createdEventList = document.querySelector("#createdEventList");
const prayerQueue = document.querySelector("#prayerQueue");
const chatModerationList = document.querySelector("#chatModerationList");
const metricPrayers = document.querySelector("#metricPrayers");
const metricChats = document.querySelector("#metricChats");
const metricViewers = document.querySelector("#metricViewers");
const adminDashboard = document.querySelector("#admin");
const adminLoginForm = document.querySelector("#adminLoginForm");
const adminAuthState = document.querySelector("#adminAuthState");
const adminSessionLabel = document.querySelector("#adminSessionLabel");

// App state
let appState = {
  prayers: [],
  chat: [],
  notes: [],
  sermons: [],
  devotionals: [],
  events: [],
};

function hideBoot() {
  boot.classList.add("is-hidden");
}

async function renderUser() {
  const user = apiStore.user;
  if (!user) return;
  welcomeTitle.textContent = `Welcome home, ${user.name}.`;
  authState.textContent = `Secure session active for ${user.email}`;
}

function isAdminActive() {
  return Boolean(apiStore.adminToken);
}

function renderAdminAuth() {
  const isActive = isAdminActive();
  adminDashboard.classList.toggle("is-locked", !isActive);
  adminAuthState.textContent = isActive ? "Admin dashboard unlocked" : "Admin dashboard locked";
  adminSessionLabel.textContent = isActive ? "Admin signed in" : "Admin signed out";
}

function requireAdmin() {
  if (isAdminActive()) return true;
  adminAuthState.textContent = "Sign in as admin before making dashboard changes.";
  location.hash = "admin";
  renderAdminAuth();
  return false;
}

async function renderPrayers() {
  try {
    const data = await prayerAPI.getAll();
    appState.prayers = data.prayers;
    prayerWall.innerHTML = "";
    renderAdmin();

    if (appState.prayers.length === 0) {
      const empty = document.createElement("div");
      empty.className = "prayer-item";
      empty.textContent = "No requests yet.";
      prayerWall.append(empty);
      return;
    }

    appState.prayers.forEach((prayer) => {
      const item = document.createElement("div");
      item.className = "prayer-item";
      item.textContent = prayer.text;
      prayerWall.append(item);
    });
  } catch (error) {
    console.error('Error rendering prayers:', error);
  }
}

async function renderChat() {
  try {
    const data = await chatAPI.getAll();
    appState.chat = data.messages;
    chatMessages.innerHTML = "";

    appState.chat.forEach((message) => {
      const item = document.createElement("div");
      const name = document.createElement("strong");
      const text = document.createElement("span");

      item.className = "chat-message";
      name.textContent = message.name;
      text.textContent = message.text;

      item.append(name, text);
      chatMessages.append(item);
    });

    onlineCount.textContent = String(128 + appState.chat.length);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (error) {
    console.error('Error rendering chat:', error);
  }
}

async function renderNotes() {
  try {
    const data = await notesAPI.getAll();
    appState.notes = data.notes;
    savedNotes.innerHTML = "";

    if (appState.notes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "note-item";
      empty.textContent = "No saved notes yet.";
      savedNotes.append(empty);
      return;
    }

    appState.notes.forEach((note) => {
      const item = document.createElement("div");
      item.className = "note-item";
      item.textContent = note.text;
      savedNotes.append(item);
    });
  } catch (error) {
    console.error('Error rendering notes:', error);
  }
}

function makeAdminItem(title, detail, actions = []) {
  const item = document.createElement("div");
  const strong = document.createElement("strong");
  const span = document.createElement("span");

  item.className = "admin-item";
  strong.textContent = title;
  span.textContent = detail;
  item.append(strong, span);

  if (actions.length > 0) {
    const actionRow = document.createElement("div");
    actionRow.className = "admin-actions";
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = action.danger ? "mini-button danger" : "mini-button";
      button.type = "button";
      button.dataset.action = action.action;
      button.dataset.id = String(action.id);
      button.textContent = action.label;
      actionRow.append(button);
    });
    item.append(actionRow);
  }

  return item;
}

function renderList(target, items, emptyText, formatter) {
  target.innerHTML = "";
  if (items.length === 0) {
    target.append(makeAdminItem(emptyText, "Waiting for new activity."));
    return;
  }
  items.forEach((item) => target.append(formatter(item)));
}

async function renderAdmin() {
  if (!sermonList) return;
  renderAdminAuth();

  try {
    const [sermons, devotionals, events] = await Promise.all([
      sermonAPI.getAll(),
      devotionalAPI.getAll(),
      eventAPI.getAll(),
    ]);

    appState.sermons = sermons.sermons;
    appState.devotionals = devotionals.devotionals;
    appState.events = events.events;

    renderList(sermonList, appState.sermons, "No sermons uploaded", (sermon) =>
      makeAdminItem(sermon.title, `${sermon.speaker} - ${sermon.file || "Media attached later"}`),
    );

    renderList(devotionalList, appState.devotionals, "No devotionals published", (devotional) =>
      makeAdminItem(devotional.title, `${devotional.verse} - ${devotional.body.slice(0, 72)}`),
    );

    renderList(createdEventList, appState.events, "No admin events created", (event) =>
      makeAdminItem(event.name, `${event.date} - ${event.venue}`),
    );

    renderList(prayerQueue, appState.prayers, "No pending prayer requests", (prayer) =>
      makeAdminItem("Pending prayer", prayer.text, [
        { label: "Approve", action: "approve-prayer", id: prayer.id },
        { label: "Decline", action: "decline-prayer", id: prayer.id, danger: true },
      ]),
    );

    renderList(chatModerationList, appState.chat, "No chat messages", (message) =>
      makeAdminItem(message.name, message.text, [
        { label: "Keep", action: "keep-chat", id: message.id },
        { label: "Remove", action: "remove-chat", id: message.id, danger: true },
      ]),
    );

    const stats = await adminAPI.getStats();
    metricPrayers.textContent = String(stats.prayerCount);
    metricChats.textContent = String(stats.chatCount);
    metricViewers.textContent = String(stats.viewers);
  } catch (error) {
    console.error('Error rendering admin:', error);
  }
}

window.addEventListener("load", async () => {
  renderUser();
  await renderPrayers();
  await renderChat();
  await renderNotes();
  await renderAdmin();
});

boot.addEventListener("click", hideBoot);

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const form = new FormData(authForm);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));

    if (password.length < 8) {
      authState.textContent = "Use at least 8 characters for sign in.";
      return;
    }

    await authAPI.signin(name, email, password);
    renderUser();
    authState.textContent = "Secure member session started";
    authForm.reset();
  } catch (error) {
    authState.textContent = `Sign in failed: ${error.message}`;
  }
});

prayerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const request = prayerInput.value.trim();
    if (!request) return;

    await prayerAPI.create(request);
    prayerInput.value = "";
    await renderPrayers();
  } catch (error) {
    console.error('Error submitting prayer:', error);
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const text = chatInput.value.trim();
    if (!text) return;

    await chatAPI.send(text);
    chatInput.value = "";
    await renderChat();
    await renderAdmin();
  } catch (error) {
    console.error('Error sending message:', error);
  }
});

notesForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const note = noteInput.value.trim();
    if (!note) return;

    await notesAPI.create(note);
    noteInput.value = "";
    await renderNotes();
  } catch (error) {
    console.error('Error saving note:', error);
  }
});

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const form = new FormData(adminLoginForm);
    const email = String(form.get("adminEmail")).trim().toLowerCase();
    const passcode = String(form.get("adminPasscode"));
    const remember = form.get("rememberAdmin") === "on";

    if (passcode.length < 10) {
      adminAuthState.textContent = "Use at least 10 characters for the admin passcode.";
      return;
    }

    await adminAPI.signin(email, passcode, remember);
    adminLoginForm.reset();
    await renderAdmin();
  } catch (error) {
    adminAuthState.textContent = `Admin sign in failed: ${error.message}`;
  }
});

sermonAdminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (!requireAdmin()) return;
    const form = new FormData(sermonAdminForm);
    const file = form.get("sermonFile");
    
    await sermonAPI.create(
      String(form.get("sermonTitle")).trim(),
      String(form.get("sermonSpeaker")).trim(),
      file?.name || ""
    );
    
    sermonAdminForm.reset();
    await renderAdmin();
  } catch (error) {
    console.error('Error publishing sermon:', error);
  }
});

devotionalAdminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (!requireAdmin()) return;
    const form = new FormData(devotionalAdminForm);
    
    await devotionalAPI.create(
      String(form.get("devotionalTitle")).trim(),
      String(form.get("devotionalVerse")).trim(),
      String(form.get("devotionalBody")).trim()
    );
    
    devotionalAdminForm.reset();
    await renderAdmin();
  } catch (error) {
    console.error('Error publishing devotional:', error);
  }
});

eventAdminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (!requireAdmin()) return;
    const form = new FormData(eventAdminForm);
    
    await eventAPI.create(
      String(form.get("eventName")).trim(),
      String(form.get("eventDate")).trim(),
      String(form.get("eventVenue")).trim()
    );
    
    eventAdminForm.reset();
    await renderAdmin();
  } catch (error) {
    console.error('Error creating event:', error);
  }
});

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action], [data-amount]");
  if (!target) return;

  if (target.dataset.action === "toggle-menu") {
    mobileNav.classList.toggle("is-open");
  }

  if (target.dataset.action === "play") {
    target.setAttribute("aria-label", "Latest service is playing");
    target.classList.add("is-selected");
  }

  if (target.dataset.action === "save-sermon") {
    target.textContent = "Stream saved";
  }

  if (target.dataset.action === "add-calendar") {
    eventState.textContent = "Added to your I AM calendar.";
    target.textContent = "Added";
  }

  if (target.dataset.action === "rsvp-event") {
    eventState.textContent = "RSVP received. We saved your place.";
    target.textContent = "Registered";
  }

  if (target.dataset.action === "play-audio") {
    audioState.textContent = "Audio Bible playing";
    target.textContent = "Pause audio";
  }

  if (target.dataset.action === "save-devotional") {
    target.textContent = "Article saved";
  }

  if (target.dataset.action === "approve-prayer") {
    if (!requireAdmin()) return;
    try {
      const prayerId = Number(target.dataset.id);
      await prayerAPI.approve(prayerId);
      await renderPrayers();
      await renderAdmin();
    } catch (error) {
      console.error('Error approving prayer:', error);
    }
  }

  if (target.dataset.action === "decline-prayer") {
    if (!requireAdmin()) return;
    try {
      const prayerId = Number(target.dataset.id);
      await prayerAPI.decline(prayerId);
      await renderPrayers();
      await renderAdmin();
    } catch (error) {
      console.error('Error declining prayer:', error);
    }
  }

  if (target.dataset.action === "remove-chat") {
    if (!requireAdmin()) return;
    try {
      const messageId = Number(target.dataset.id);
      await chatAPI.remove(messageId);
      await renderChat();
      await renderAdmin();
    } catch (error) {
      console.error('Error removing chat:', error);
    }
  }

  if (target.dataset.action === "keep-chat") {
    if (!requireAdmin()) return;
    target.textContent = "Kept";
  }

  if (target.dataset.action === "admin-logout") {
    adminAPI.logout();
    await renderAdmin();
  }

  if (target.dataset.amount) {
    document.querySelectorAll("[data-amount]").forEach((button) => button.classList.remove("is-selected"));
    target.classList.add("is-selected");
  }
});
