import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '127.0.0.1';
const dataFile = path.join(__dirname, 'data.json');
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5000,http://127.0.0.1:5000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultChat = [
  { id: 1, name: 'Care Team', text: 'Welcome to I AM Live. Share prayer requests and greetings here.', createdAt: Date.now() },
  { id: 2, name: 'Miriam', text: 'Good morning church family. Grateful to worship together.', createdAt: Date.now() },
  { id: 3, name: 'David', text: 'Please pray for peace and strength this week.', createdAt: Date.now() },
];

const defaultData = {
  users: [], sessions: [], prayers: [], approvedPrayers: [], chat: defaultChat,
  notes: [], sermons: [], devotionals: [], adminEvents: [], adminCredentials: [], adminSessions: [],
};

function initializeData() {
  if (!fs.existsSync(dataFile)) writeData(defaultData);
}
function readData() {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  return { ...defaultData, ...data };
}
function writeData(data) { fs.writeFileSync(dataFile, JSON.stringify(data, null, 2)); }
function cleanExpiredSessions(data) {
  const now = Date.now();
  data.sessions = data.sessions.filter((session) => session.expiresAt > now);
  data.adminSessions = data.adminSessions.filter((session) => session.expiresAt > now);
}
function nextId() { return Date.now() + Math.floor(Math.random() * 1000); }
function createToken() { return crypto.randomBytes(32).toString('hex'); }
function hashText(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function cleanText(value, max = 1000) { return String(value || '').trim().slice(0, max); }
function routeKey(method, pathname) { return method + ' ' + pathname; }

function send(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...headers,
  });
  res.end(body);
}
function sendError(res, status, message) { send(res, status, { error: message }); }
function setCors(req, res) {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Setup-Key');
}
async function parseJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error('Request body too large');
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))); 
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function getBearer(req) { return req.headers.authorization?.replace('Bearer ', '') || ''; }
function authenticateUser(req) {
  const token = getBearer(req);
  if (!token) return null;
  const data = readData();
  cleanExpiredSessions(data); writeData(data);
  return data.sessions.find((session) => session.token === token && session.expiresAt > Date.now()) || null;
}
function authenticateAdmin(req) {
  const token = getBearer(req);
  if (!token) return null;
  const data = readData();
  cleanExpiredSessions(data); writeData(data);
  return data.adminSessions.find((session) => session.token === token && session.expiresAt > Date.now()) || null;
}

export async function handleRequest(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, 'http://' + req.headers.host);
  const pathname = url.pathname;

  try {
    if (routeKey(req.method, pathname) === 'GET /api/health') {
      send(res, 200, { ok: true, service: 'klgc-api', time: new Date().toISOString() }); return;
    }
    if (routeKey(req.method, pathname) === 'POST /api/auth/signin') {
      const body = await parseJson(req);
      const name = cleanText(body.name, 80);
      const email = cleanText(body.email, 160).toLowerCase();
      const password = String(body.password || '');
      if (!name || !email.includes('@')) return sendError(res, 400, 'Name and valid email are required');
      if (password.length < 8) return sendError(res, 400, 'Password must be at least 8 characters');
      const data = readData(); cleanExpiredSessions(data);
      let user = data.users.find((entry) => entry.email === email);
      if (!user) { user = { id: nextId(), name, email, createdAt: Date.now() }; data.users.push(user); }
      const token = createToken();
      data.sessions.push({ userId: user.id, email, token, expiresAt: Date.now() + 1000 * 60 * 60 });
      writeData(data); send(res, 200, { user: { id: user.id, name: user.name, email: user.email }, token }); return;
    }
    if (routeKey(req.method, pathname) === 'GET /api/auth/me') {
      const session = authenticateUser(req); if (!session) return sendError(res, 401, 'Invalid or expired token');
      const data = readData(); send(res, 200, { user: data.users.find((user) => user.id === session.userId) || null }); return;
    }
    if (routeKey(req.method, pathname) === 'GET /api/prayers') { send(res, 200, { prayers: readData().prayers }); return; }
    if (routeKey(req.method, pathname) === 'POST /api/prayers') {
      const session = authenticateUser(req); if (!session) return sendError(res, 401, 'Sign in before adding a prayer request');
      const request = cleanText((await parseJson(req)).request, 1200); if (!request) return sendError(res, 400, 'Prayer request cannot be empty');
      const data = readData(); const prayer = { id: nextId(), userId: session.userId, text: request, createdAt: Date.now() };
      data.prayers = [prayer, ...data.prayers].slice(0, 20); writeData(data); send(res, 200, { prayer }); return;
    }
    const prayerApprove = pathname.match(/^\/api\/prayers\/(\d+)\/approve$/);
    if (req.method === 'POST' && prayerApprove) {
      if (!authenticateAdmin(req)) return sendError(res, 401, 'Invalid or expired admin token');
      const data = readData(); const index = data.prayers.findIndex((prayer) => prayer.id === Number(prayerApprove[1]));
      if (index === -1) return sendError(res, 404, 'Prayer not found');
      const [approved] = data.prayers.splice(index, 1); data.approvedPrayers = [approved, ...data.approvedPrayers].slice(0, 20);
      writeData(data); send(res, 200, { approved }); return;
    }
    const prayerDelete = pathname.match(/^\/api\/prayers\/(\d+)$/);
    if (req.method === 'DELETE' && prayerDelete) {
      if (!authenticateAdmin(req)) return sendError(res, 401, 'Invalid or expired admin token');
      const data = readData(); const index = data.prayers.findIndex((prayer) => prayer.id === Number(prayerDelete[1]));
      if (index === -1) return sendError(res, 404, 'Prayer not found');
      data.prayers.splice(index, 1); writeData(data); send(res, 200, { success: true }); return;
    }
    if (routeKey(req.method, pathname) === 'GET /api/chat') { send(res, 200, { messages: readData().chat }); return; }
    if (routeKey(req.method, pathname) === 'POST /api/chat') {
      const session = authenticateUser(req); if (!session) return sendError(res, 401, 'Sign in before sending chat messages');
      const text = cleanText((await parseJson(req)).text, 500); if (!text) return sendError(res, 400, 'Message cannot be empty');
      const data = readData(); const user = data.users.find((entry) => entry.id === session.userId);
      const message = { id: nextId(), name: user?.name || 'Guest', text, createdAt: Date.now() };
      data.chat = [...data.chat, message].slice(-50); writeData(data); send(res, 200, { message }); return;
    }
    const chatDelete = pathname.match(/^\/api\/chat\/(\d+)$/);
    if (req.method === 'DELETE' && chatDelete) {
      if (!authenticateAdmin(req)) return sendError(res, 401, 'Invalid or expired admin token');
      const data = readData(); const index = data.chat.findIndex((message) => message.id === Number(chatDelete[1]));
      if (index === -1) return sendError(res, 404, 'Message not found');
      data.chat.splice(index, 1); writeData(data); send(res, 200, { success: true }); return;
    }
    if (routeKey(req.method, pathname) === 'GET /api/notes') {
      const session = authenticateUser(req); if (!session) return sendError(res, 401, 'Sign in before viewing notes');
      const data = readData(); send(res, 200, { notes: data.notes.filter((note) => note.userId === session.userId) }); return;
    }
    if (routeKey(req.method, pathname) === 'POST /api/notes') {
      const session = authenticateUser(req); if (!session) return sendError(res, 401, 'Sign in before saving notes');
      const text = cleanText((await parseJson(req)).note, 2000); if (!text) return sendError(res, 400, 'Note cannot be empty');
      const data = readData(); const note = { id: nextId(), userId: session.userId, text, createdAt: Date.now() };
      const otherNotes = data.notes.filter((entry) => entry.userId !== session.userId);
      const userNotes = [note, ...data.notes.filter((entry) => entry.userId === session.userId)].slice(0, 10);
      data.notes = [...userNotes, ...otherNotes]; writeData(data); send(res, 200, { note }); return;
    }
    if (routeKey(req.method, pathname) === 'GET /api/sermons') return send(res, 200, { sermons: readData().sermons });
    if (routeKey(req.method, pathname) === 'GET /api/devotionals') return send(res, 200, { devotionals: readData().devotionals });
    if (routeKey(req.method, pathname) === 'GET /api/events') return send(res, 200, { events: readData().adminEvents });
    if (routeKey(req.method, pathname) === 'POST /api/sermons') {
      if (!authenticateAdmin(req)) return sendError(res, 401, 'Invalid or expired admin token');
      const body = await parseJson(req); const title = cleanText(body.title, 160); const speaker = cleanText(body.speaker, 120); const file = cleanText(body.file, 240);
      if (!title || !speaker) return sendError(res, 400, 'Title and speaker are required');
      const data = readData(); const sermon = { id: nextId(), title, speaker, file, createdAt: Date.now() };
      data.sermons = [sermon, ...data.sermons].slice(0, 20); writeData(data); send(res, 200, { sermon }); return;
    }
    if (routeKey(req.method, pathname) === 'POST /api/devotionals') {
      if (!authenticateAdmin(req)) return sendError(res, 401, 'Invalid or expired admin token');
      const body = await parseJson(req); const title = cleanText(body.title, 160); const verse = cleanText(body.verse, 120); const text = cleanText(body.body, 3000);
      if (!title || !verse || !text) return sendError(res, 400, 'Title, verse, and body are required');
      const data = readData(); const devotional = { id: nextId(), title, verse, body: text, createdAt: Date.now() };
      data.devotionals = [devotional, ...data.devotionals].slice(0, 20); writeData(data); send(res, 200, { devotional }); return;
    }
    if (routeKey(req.method, pathname) === 'POST /api/events') {
      if (!authenticateAdmin(req)) return sendError(res, 401, 'Invalid or expired admin token');
      const body = await parseJson(req); const name = cleanText(body.name, 160); const date = cleanText(body.date, 120); const venue = cleanText(body.venue, 160);
      if (!name || !date || !venue) return sendError(res, 400, 'Name, date, and venue are required');
      const data = readData(); const event = { id: nextId(), name, date, venue, createdAt: Date.now() };
      data.adminEvents = [event, ...data.adminEvents].slice(0, 20); writeData(data); send(res, 200, { event }); return;
    }
    if (routeKey(req.method, pathname) === 'POST /api/admin/signin') {
      const body = await parseJson(req); const email = cleanText(body.email, 160).toLowerCase(); const passcode = String(body.passcode || ''); const remember = Boolean(body.remember);
      if (!email.includes('@')) return sendError(res, 400, 'Valid admin email is required');
      if (passcode.length < 10) return sendError(res, 400, 'Passcode must be at least 10 characters');
      const data = readData(); cleanExpiredSessions(data); const hash = hashText(email + ':' + passcode);
      let credential = data.adminCredentials.find((entry) => entry.email === email);
      if (!credential) {
        if (process.env.NODE_ENV === 'production' && process.env.ADMIN_SETUP_KEY && req.headers['x-admin-setup-key'] !== process.env.ADMIN_SETUP_KEY) {
          return sendError(res, 403, 'Admin setup key is required for first production setup');
        }
        credential = { email, hash, createdAt: Date.now() }; data.adminCredentials.push(credential);
      } else if (credential.hash !== hash) return sendError(res, 401, 'Admin email or passcode is incorrect');
      const token = createToken(); data.adminSessions.push({ email, token, expiresAt: Date.now() + (remember ? 1000 * 60 * 60 * 8 : 1000 * 60 * 30) });
      writeData(data); send(res, 200, { token }); return;
    }
    if (routeKey(req.method, pathname) === 'GET /api/admin/stats') {
      if (!authenticateAdmin(req)) return sendError(res, 401, 'Invalid or expired admin token');
      const data = readData(); send(res, 200, { prayerCount: data.prayers.length, chatCount: data.chat.length, viewers: 248 + data.chat.length + data.approvedPrayers.length }); return;
    }
    if (routeKey(req.method, pathname) === 'GET /api/data') {
      const data = readData(); send(res, 200, { prayers: data.prayers, approvedPrayers: data.approvedPrayers, chat: data.chat, sermons: data.sermons, devotionals: data.devotionals, events: data.adminEvents }); return;
    }
    sendError(res, 404, 'Route not found');
  } catch (error) {
    if (error instanceof SyntaxError) return sendError(res, 400, 'Invalid JSON body');
    sendError(res, 500, error.message);
  }
}

initializeData();

if (process.env.NODE_ENV !== 'test') {
  const server = http.createServer(handleRequest);
  server.on('error', (error) => {
    console.error('Backend failed to start:', error.message);
    process.exitCode = 1;
  });
  server.listen(PORT, HOST, () => {
    console.log('Backend server running on http://' + HOST + ':' + PORT);
  });
}
