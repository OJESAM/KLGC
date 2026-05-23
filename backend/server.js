import http from 'http';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './firebaseAdmin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// -------------------- UTILS --------------------

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function sendError(res, status, msg) {
  send(res, status, { error: msg });
}

function routeKey(method, path) {
  return method + ' ' + path;
}

function cleanText(v, max = 1000) {
  return String(v || '').trim().slice(0, max);
}

function nextId() {
  return Date.now();
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getBearer(req) {
  return req.headers.authorization?.replace('Bearer ', '') || '';
}

// -------------------- AUTH --------------------

async function getSession(token) {
  if (!token) return null;

  const snap = await db.collection('sessions')
    .where('token', '==', token)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const session = snap.docs[0].data();
  if (session.expiresAt < Date.now()) return null;

  return session;
}

async function getAdminSession(token) {
  if (!token) return null;

  const snap = await db.collection('adminSessions')
    .where('token', '==', token)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const session = snap.docs[0].data();
  if (session.expiresAt < Date.now()) return null;

  return session;
}

// -------------------- SERVER --------------------

export async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    // ROOT
    if (routeKey(req.method, pathname) === 'GET /') {
      return send(res, 200, {
        status: 'ok',
        service: 'church-api',
      });
    }

    // HEALTH
    if (routeKey(req.method, pathname) === 'GET /api/health') {
      return send(res, 200, { ok: true });
    }

    // ---------------- AUTH ----------------

    if (routeKey(req.method, pathname) === 'POST /api/auth/signin') {
      let body = '';
      for await (const chunk of req) body += chunk;

      const data = JSON.parse(body || '{}');

      const name = cleanText(data.name, 80);
      const email = cleanText(data.email, 160).toLowerCase();
      const password = String(data.password || '');

      if (!email.includes('@')) return sendError(res, 400, 'Invalid email');
      if (password.length < 8) return sendError(res, 400, 'Weak password');

      let userRef = db.collection('users').doc(email);
      let userDoc = await userRef.get();

      let user;

      if (!userDoc.exists) {
        user = {
          id: nextId(),
          name,
          email,
          createdAt: Date.now(),
        };
        await userRef.set(user);
      } else {
        user = userDoc.data();
      }

      const token = createToken();

      await db.collection('sessions').add({
        userId: user.id,
        token,
        expiresAt: Date.now() + 3600000,
      });

      return send(res, 200, { user, token });
    }

    // ---------------- CHAT ----------------

    if (routeKey(req.method, pathname) === 'GET /api/chat') {
      const snap = await db.collection('chat')
        .orderBy('createdAt')
        .limit(50)
        .get();

      const messages = snap.docs.map(d => d.data());

      return send(res, 200, { messages });
    }

    if (routeKey(req.method, pathname) === 'POST /api/chat') {
      const token = getBearer(req);
      const session = await getSession(token);

      if (!session) return sendError(res, 401, 'Unauthorized');

      let body = '';
      for await (const chunk of req) body += chunk;

      const data = JSON.parse(body || '{}');
      const text = cleanText(data.text, 500);

      if (!text) return sendError(res, 400, 'Empty message');

      await db.collection('chat').add({
        id: nextId(),
        name: 'User',
        text,
        createdAt: Date.now(),
      });

      return send(res, 200, { ok: true });
    }

    // ---------------- PRAYERS ----------------

    if (routeKey(req.method, pathname) === 'GET /api/prayers') {
      const snap = await db.collection('prayers').get();
      const prayers = snap.docs.map(d => d.data());
      return send(res, 200, { prayers });
    }

    if (routeKey(req.method, pathname) === 'POST /api/prayers') {
      const token = getBearer(req);
      const session = await getSession(token);

      if (!session) return sendError(res, 401, 'Unauthorized');

      let body = '';
      for await (const chunk of req) body += chunk;

      const data = JSON.parse(body || '{}');
      const request = cleanText(data.request, 1000);

      if (!request) return sendError(res, 400, 'Empty prayer');

      await db.collection('prayers').add({
        id: nextId(),
        userId: session.userId,
        text: request,
        createdAt: Date.now(),
      });

      return send(res, 200, { ok: true });
    }

    // ---------------- SERMONS ----------------

    if (routeKey(req.method, pathname) === 'GET /api/sermons') {
      const snap = await db.collection('sermons').get();
      return send(res, 200, {
        sermons: snap.docs.map(d => d.data()),
      });
    }

    // ---------------- DEVOTIONALS ----------------

    if (routeKey(req.method, pathname) === 'GET /api/devotionals') {
      const snap = await db.collection('devotionals').get();
      return send(res, 200, {
        devotionals: snap.docs.map(d => d.data()),
      });
    }

    // ---------------- EVENTS ----------------

    if (routeKey(req.method, pathname) === 'GET /api/events') {
      const snap = await db.collection('events').get();
      return send(res, 200, {
        events: snap.docs.map(d => d.data()),
      });
    }

    // ---------------- FALLBACK ----------------

    return sendError(res, 404, 'Route not found');

  } catch (err) {
    return sendError(res, 500, err.message);
  }
}

// ---------------- START SERVER ----------------

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`);
});