# Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### Prerequisites
- Node.js 16+ installed
- Python 3 installed (for frontend server)
- Two terminal windows

### Step 1: Install Dependencies

Open a terminal in the project root:

```bash
npm run install-all
```

This installs dependencies for:
- Root project (concurrently)
- Backend (express, cors)
- Frontend (no runtime dependencies)

### Step 2: Start Backend

In **Terminal 1**:

```bash
npm run dev:backend
```

You should see:
```
Backend server running on http://localhost:3001
```

### Step 3: Start Frontend

In **Terminal 2**:

```bash
npm run dev:frontend
```

You should see:
```
Serving HTTP on 0.0.0.0 port 5000
```

### Step 4: Access the App

Open your browser and go to:
```
http://localhost:5000
```

## 🧪 Testing the App

### Member Functions
1. **Sign In:** Use any email and password (8+ chars)
2. **Add Prayer:** Submit a prayer request
3. **Chat:** Send messages in the live chat
4. **Notes:** Save notes from the sermon

### Admin Functions
1. **Sign In to Admin:** 
   - Email: any email
   - Passcode: any 10+ character string
   - First sign-in creates the credentials
2. **Upload Sermon:** Add a sermon title/speaker
3. **Publish Devotional:** Add a devotional with verse and text
4. **Create Event:** Add an event with date and venue
5. **Moderate:** Approve/decline prayers, remove chat messages

## 📁 Project Structure After Setup

```
2026-05-14/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js (ES module)
│   ├── api.js (API client)
│   ├── package.json
│   └── node_modules/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── data.json (created on first run)
│   └── node_modules/
│
├── package.json (root)
├── README.md
└── SETUP.md (this file)
```

## 🔗 How They Connect

```
Browser (localhost:5000)
         ↓
    Frontend (HTML/CSS/JS)
         ↓
    API Client (api.js)
         ↓
    Backend API (localhost:3001)
         ↓
    data.json (persistent storage)
```

## ⚙️ API Configuration

The frontend is configured to connect to `http://localhost:3001/api` by default.

To change this, edit [frontend/api.js](frontend/api.js):

```javascript
const API_BASE = 'http://localhost:3001/api';  // Change this line
```

## 📱 Key Differences from Original

| Original | New |
|----------|-----|
| Everything in one folder | Frontend/Backend separated |
| localStorage only | Backend API + data.json |
| No server needed | Express backend required |
| No data persistence | Persistent server data |

## 🐛 Troubleshooting

**Error: "Cannot find module 'express'"**
- Run `npm run install-all` in the root directory

**Error: "Port 3001 already in use"**
- Another process is using that port. Kill it or use a different port.
- To change the backend port: `PORT=3002 npm run dev:backend`

**Error: "API unreachable"**
- Make sure the backend is running (check Terminal 1)
- Check that the API_BASE URL in [frontend/api.js](frontend/api.js) is correct

**CORS errors in browser console**
- This shouldn't happen with the current setup
- If it does, the backend or frontend server might not be running

## 🚀 Running Both Together

To run both frontend and backend with one command:

```bash
npm run dev
```

This uses `concurrently` to run both in the same terminal.

## 🛑 Stopping the Servers

Press `Ctrl+C` in each terminal window.

## 📚 Next Steps

1. ✅ Verify both servers are running
2. ✅ Test member sign-in and basic features
3. ✅ Test admin features (prayer approval, sermon upload)
4. 📦 Ready for database migration or deployment

---

Questions? Check [README.md](README.md) for architecture details.
