import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data storage file
const dataFile = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
function initializeData() {
  if (!fs.existsSync(dataFile)) {
    const initialData = {
      users: [],
      sessions: [],
      prayers: [],
      approvedPrayers: [],
      chat: [
        { name: "Care Team", text: "Welcome to I AM Live. Share prayer requests and greetings here." },
        { name: "Miriam", text: "Good morning church family. Grateful to worship together." },
        { name: "David", text: "Please pray for peace and strength this week." },
      ],
      notes: [],
      sermons: [],
      devotionals: [],
      adminEvents: [],
      adminCredentials: [],
      adminSessions: [],
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
  }
}

function readData() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Hash function (simple - use bcrypt in production)
async function hashText(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Auth middleware
function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const data = readData();
  const session = data.sessions.find(s => s.token === token && s.expiresAt > Date.now());
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = session;
  next();
}

function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const data = readData();
  const session = data.adminSessions.find(s => s.token === token && s.expiresAt > Date.now());
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }

  req.admin = session;
  next();
}

// ===== USER ROUTES =====

// Member sign-in/register
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const data = readData();
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find or create user
    let user = data.users.find(u => u.email === normalizedEmail);
    if (!user) {
      user = { id: Date.now(), name, email: normalizedEmail };
      data.users.push(user);
    }

    // Create session
    const token = await hashText(`${normalizedEmail}:${Date.now()}:${password.length}`);
    const session = {
      userId: user.id,
      email: normalizedEmail,
      token,
      expiresAt: Date.now() + (1000 * 60 * 60), // 1 hour
    };
    data.sessions.push(session);
    writeData(data);

    res.json({ 
      user: { id: user.id, name: user.name, email: user.email },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user session
app.get('/api/auth/me', authenticateUser, (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.user.userId);
  res.json({ user });
});

// ===== PRAYER ROUTES =====

app.get('/api/prayers', (req, res) => {
  const data = readData();
  res.json({ prayers: data.prayers });
});

app.post('/api/prayers', authenticateUser, (req, res) => {
  try {
    const { request } = req.body;
    if (!request?.trim()) {
      return res.status(400).json({ error: 'Prayer request cannot be empty' });
    }

    const data = readData();
    const prayer = {
      id: Date.now(),
      userId: req.user.userId,
      text: request.trim(),
      createdAt: Date.now(),
    };
    data.prayers = [prayer, ...data.prayers].slice(0, 6);
    writeData(data);

    res.json({ prayer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve prayer (admin)
app.post('/api/prayers/:id/approve', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    
    const prayerIndex = data.prayers.findIndex(p => p.id === Number(id));
    if (prayerIndex === -1) {
      return res.status(404).json({ error: 'Prayer not found' });
    }

    const [approved] = data.prayers.splice(prayerIndex, 1);
    data.approvedPrayers = [approved, ...data.approvedPrayers].slice(0, 12);
    writeData(data);

    res.json({ approved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decline prayer (admin)
app.delete('/api/prayers/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    
    const prayerIndex = data.prayers.findIndex(p => p.id === Number(id));
    if (prayerIndex === -1) {
      return res.status(404).json({ error: 'Prayer not found' });
    }

    data.prayers.splice(prayerIndex, 1);
    writeData(data);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CHAT ROUTES =====

app.get('/api/chat', (req, res) => {
  const data = readData();
  res.json({ messages: data.chat });
});

app.post('/api/chat', authenticateUser, (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const data = readData();
    const user = data.users.find(u => u.id === req.user.userId);
    
    const message = {
      id: Date.now(),
      name: user?.name || 'Guest',
      text: text.trim(),
      createdAt: Date.now(),
    };
    data.chat = [...data.chat, message].slice(-12);
    writeData(data);

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove chat message (admin)
app.delete('/api/chat/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    
    const messageIndex = data.chat.findIndex(m => m.id === Number(id));
    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    data.chat.splice(messageIndex, 1);
    writeData(data);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== NOTES ROUTES =====

app.get('/api/notes', authenticateUser, (req, res) => {
  const data = readData();
  const userNotes = data.notes.filter(n => n.userId === req.user.userId);
  res.json({ notes: userNotes });
});

app.post('/api/notes', authenticateUser, (req, res) => {
  try {
    const { note } = req.body;
    if (!note?.trim()) {
      return res.status(400).json({ error: 'Note cannot be empty' });
    }

    const data = readData();
    const newNote = {
      id: Date.now(),
      userId: req.user.userId,
      text: note.trim(),
      createdAt: Date.now(),
    };
    data.notes = [newNote, ...data.notes.filter(n => n.userId === req.user.userId)].slice(0, 5);
    writeData(data);

    res.json({ note: newNote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SERMON ROUTES =====

app.get('/api/sermons', (req, res) => {
  const data = readData();
  res.json({ sermons: data.sermons });
});

app.post('/api/sermons', authenticateAdmin, (req, res) => {
  try {
    const { title, speaker, file } = req.body;
    
    if (!title?.trim() || !speaker?.trim()) {
      return res.status(400).json({ error: 'Title and speaker are required' });
    }

    const data = readData();
    const sermon = {
      id: Date.now(),
      title: title.trim(),
      speaker: speaker.trim(),
      file: file || '',
      createdAt: Date.now(),
    };
    data.sermons = [sermon, ...data.sermons].slice(0, 5);
    writeData(data);

    res.json({ sermon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== DEVOTIONAL ROUTES =====

app.get('/api/devotionals', (req, res) => {
  const data = readData();
  res.json({ devotionals: data.devotionals });
});

app.post('/api/devotionals', authenticateAdmin, (req, res) => {
  try {
    const { title, verse, body } = req.body;
    
    if (!title?.trim() || !verse?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Title, verse, and body are required' });
    }

    const data = readData();
    const devotional = {
      id: Date.now(),
      title: title.trim(),
      verse: verse.trim(),
      body: body.trim(),
      createdAt: Date.now(),
    };
    data.devotionals = [devotional, ...data.devotionals].slice(0, 5);
    writeData(data);

    res.json({ devotional });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== EVENT ROUTES =====

app.get('/api/events', (req, res) => {
  const data = readData();
  res.json({ events: data.adminEvents });
});

app.post('/api/events', authenticateAdmin, (req, res) => {
  try {
    const { name, date, venue } = req.body;
    
    if (!name?.trim() || !date?.trim() || !venue?.trim()) {
      return res.status(400).json({ error: 'Name, date, and venue are required' });
    }

    const data = readData();
    const event = {
      id: Date.now(),
      name: name.trim(),
      date: date.trim(),
      venue: venue.trim(),
      createdAt: Date.now(),
    };
    data.adminEvents = [event, ...data.adminEvents].slice(0, 5);
    writeData(data);

    res.json({ event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ADMIN AUTH ROUTES =====

app.post('/api/admin/signin', async (req, res) => {
  try {
    const { email, passcode, remember } = req.body;
    
    if (passcode.length < 10) {
      return res.status(400).json({ error: 'Passcode must be at least 10 characters' });
    }

    const data = readData();
    const normalizedEmail = email.trim().toLowerCase();
    const hash = await hashText(`${normalizedEmail}:${passcode}`);

    let credential = data.adminCredentials.find(c => c.email === normalizedEmail);
    
    if (!credential) {
      credential = { email: normalizedEmail, hash, createdAt: Date.now() };
      data.adminCredentials.push(credential);
    } else if (credential.hash !== hash) {
      return res.status(401).json({ error: 'Admin email or passcode is incorrect' });
    }

    const token = await hashText(`admin:${normalizedEmail}:${Date.now()}`);
    const adminSession = {
      email: normalizedEmail,
      token,
      expiresAt: Date.now() + (remember ? 1000 * 60 * 60 * 8 : 1000 * 60 * 30),
    };
    data.adminSessions.push(adminSession);
    writeData(data);

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const data = readData();
  res.json({
    prayerCount: data.prayers.length,
    chatCount: data.chat.length,
    viewers: 248 + data.chat.length + data.approvedPrayers.length,
  });
});

// ===== DATA ROUTES =====

app.get('/api/data', (req, res) => {
  const data = readData();
  res.json({
    prayers: data.prayers,
    approvedPrayers: data.approvedPrayers,
    chat: data.chat,
    sermons: data.sermons,
    devotionals: data.devotionals,
    events: data.adminEvents,
  });
});

// Initialize and start server
initializeData();
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
