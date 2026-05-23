# Kairos Living Glory Church App - Separated Frontend & Backend

This project has been split into a proper **frontend** and **backend** architecture.

## Project Structure

```
.
├── frontend/              # React-free frontend (HTML, CSS, JS)
│   ├── index.html        # Main HTML file
│   ├── styles.css        # Styles
│   ├── app.js            # Frontend application logic
│   ├── api.js            # API client library
│   └── package.json
│
├── backend/              # Express.js backend API
│   ├── server.js         # Express server with all routes
│   ├── data.json         # Persistent data storage
│   └── package.json
│
└── package.json          # Root package with scripts
```

## Architecture

### Backend (Node.js + Express)
- **Port:** 3001
- **Data Storage:** JSON file (`data.json`)
- **Responsibilities:**
  - User authentication (member and admin)
  - Prayer requests management
  - Chat message handling
  - Notes storage
  - Sermon, devotional, and event management
  - Admin moderation and analytics

**API Endpoints:**
- `POST /api/auth/signin` - Member sign-in
- `GET /api/auth/me` - Get current user
- `GET/POST /api/prayers` - Prayer requests
- `GET/POST /api/chat` - Chat messages
- `GET/POST /api/notes` - User notes
- `GET/POST /api/sermons` - Sermon management
- `GET/POST /api/devotionals` - Devotional management
- `GET/POST /api/events` - Event management
- `POST /api/admin/signin` - Admin authentication
- `GET /api/admin/stats` - Admin analytics

### Frontend (Vanilla JavaScript)
- **Port:** 5000+ (via local dev server)
- **Dependencies:** None (no frameworks, pure HTML/CSS/JS)
- **Responsibilities:**
  - User interface and interactions
  - API calls to backend
  - Session management
  - Local storage for tokens

**Key Files:**
- `api.js` - Centralized API client with helper functions
- `app.js` - Main application logic with DOM manipulation

## Getting Started

### Setup

1. **Install dependencies for both frontend and backend:**
   ```bash
   npm run install-all
   ```

2. **Start both servers (from root directory):**
   ```bash
   npm run dev
   ```

   Or start them individually:
   ```bash
   npm run dev:backend    # Terminal 1 - Backend on port 3001
   npm run dev:frontend   # Terminal 2 - Frontend local server
   ```

### First Time Admin Setup

When you access the admin dashboard for the first time:
1. Click "Unlock dashboard"
2. Enter an admin email and passcode (min 10 characters)
3. This creates a local credential that's stored in `backend/data.json`
4. On subsequent visits, use the same credentials to sign in

## Data Persistence

- **Backend Data:** Stored in `backend/data.json`
- **User Sessions:** Stored in `data.json` and expire based on set duration
- **Frontend Tokens:** Stored in `sessionStorage` (cleared when browser closes)

## Key Changes from Original

| Original | New |
|----------|-----|
| All data in localStorage | Data in backend/data.json |
| No server needed | Express.js backend required |
| Single HTML file | Separated frontend/backend files |
| No API, pure client-side | Full REST API |
| Local admin passcode | Server-validated credentials |
| No data persistence between sessions | Persistent server data |

## Development Notes

- Backend uses ES modules (`import`/`export`)
- Frontend is vanilla JavaScript with ES modules
- CORS is enabled for local development
- Token-based authentication with Bearer tokens
- All data is validated on the backend

## Future Improvements

Before production deployment:
1. Replace JSON file storage with a proper database (MongoDB, PostgreSQL)
2. Add proper user authentication (Firebase, Auth0)
3. Implement password hashing with bcrypt
4. Add HTTPS and secure cookie handling
5. Add input validation and rate limiting
6. Deploy backend and frontend to separate servers
7. Update CORS configuration for production domain
