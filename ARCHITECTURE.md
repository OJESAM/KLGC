# Frontend-Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                             │
│                   (localhost:5000)                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Frontend Application                               │    │
│  │  ┌────────────────────────────────────────────────┐ │    │
│  │  │ HTML/CSS UI (index.html, styles.css)           │ │    │
│  │  └────────────────────────────────────────────────┘ │    │
│  │  ┌────────────────────────────────────────────────┐ │    │
│  │  │ app.js (DOM manipulation, event handling)      │ │    │
│  │  │ - render functions                            │ │    │
│  │  │ - form submissions                            │ │    │
│  │  │ - click handlers                              │ │    │
│  │  └────────────────────────────────────────────────┘ │    │
│  │  ┌────────────────────────────────────────────────┐ │    │
│  │  │ api.js (API client & store)                    │ │    │
│  │  │ - authAPI                                      │ │    │
│  │  │ - prayerAPI, chatAPI, notesAPI                │ │    │
│  │  │ - sermonAPI, devotionalAPI, eventAPI          │ │    │
│  │  │ - adminAPI                                    │ │    │
│  │  │ - Session token management                    │ │    │
│  │  └────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│           ↓                                                  │
│        HTTP Fetch Requests (JSON)                           │
│           ↓                                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend API Server                         │
│               (Node.js + Express 3001)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ server.js (Express Router)                          │    │
│  │ ┌─────────────────────────────────────────────────┐ │    │
│  │ │ Middleware                                      │ │    │
│  │ │ - CORS enabled                                 │ │    │
│  │ │ - JSON body parser                            │ │    │
│  │ │ - Authentication (token validation)           │ │    │
│  │ └─────────────────────────────────────────────────┘ │    │
│  │ ┌─────────────────────────────────────────────────┐ │    │
│  │ │ API Routes                                      │ │    │
│  │ │ POST   /api/auth/signin                        │ │    │
│  │ │ GET    /api/auth/me                            │ │    │
│  │ │ GET    /api/prayers                            │ │    │
│  │ │ POST   /api/prayers                            │ │    │
│  │ │ POST   /api/prayers/:id/approve (admin)        │ │    │
│  │ │ DELETE /api/prayers/:id (admin)                │ │    │
│  │ │ GET    /api/chat                               │ │    │
│  │ │ POST   /api/chat                               │ │    │
│  │ │ DELETE /api/chat/:id (admin)                   │ │    │
│  │ │ ... and more for notes, sermons, etc           │ │    │
│  │ └─────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│           ↓                                                  │
│        Data Operations (JSON-based CRUD)                    │
│           ↓                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ data.json (Persistent Storage)                      │    │
│  │ {                                                   │    │
│  │   "users": [...],                                   │    │
│  │   "sessions": [...],                               │    │
│  │   "prayers": [...],                                │    │
│  │   "chat": [...],                                   │    │
│  │   "notes": [...],                                  │    │
│  │   "sermons": [...],                                │    │
│  │   "devotionals": [...],                            │    │
│  │   "adminEvents": [...],                            │    │
│  │   "adminCredentials": [...],                       │    │
│  │   "adminSessions": [...]                           │    │
│  │ }                                                   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: User Sign-In

```
Frontend                           Backend
────────                           ───────
User fills form
User submits form
     ↓
authAPI.signin() 
     ↓
POST /api/auth/signin
(name, email, password)
     ────────────────→ Validate input
                       Create/find user
                       Create session
                       Hash password
                       ← Return: { user, token }
Store token in 
sessionStorage
Update UI (welcome message)
```

### Example 2: Submit Prayer Request

```
Frontend                           Backend
────────                           ───────
User enters prayer
User submits form
     ↓
prayerAPI.create(text)
(with Bearer token)
     ↓
POST /api/prayers
(Authorization header)
     ────────────────→ Check token validity
                       Create prayer record
                       Add to prayers array
                       Save data.json
                       ← Return: { prayer }
Refresh prayers list
Display prayer on wall
```

### Example 3: Admin Approves Prayer

```
Frontend                           Backend
────────                           ───────
Admin clicks "Approve"
     ↓
prayerAPI.approve(prayerId)
(with admin Bearer token)
     ↓
POST /api/prayers/:id/approve
     ────────────────→ Check admin token
                       Find prayer by ID
                       Move to approvedPrayers
                       Remove from prayers queue
                       Save data.json
                       ← Return: { approved }
Update prayer list view
Update admin stats
```

## Authentication Flow

### Member Authentication
```
Sign-In Form
     ↓
POST /api/auth/signin { name, email, password }
     ↓
Backend creates user if new
Backend creates session with token
Backend returns token
     ↓
Frontend stores token in sessionStorage
Frontend uses token for subsequent requests:
Authorization: Bearer <token>
```

### Admin Authentication
```
Admin Login Form
     ↓
POST /api/admin/signin { email, passcode, remember }
     ↓
Backend hashes email:passcode
If first time: creates admin credential in data.json
If returning: validates against stored hash
     ↓
Backend creates admin session
Returns admin token
     ↓
Frontend stores in sessionStorage
Uses for admin-only operations
```

## API Response Format

All endpoints follow this pattern:

### Success (200)
```json
{
  "user": { "id": 123, "name": "John", "email": "john@example.com" },
  "token": "abc123xyz..."
}
```

### Error (400/401/500)
```json
{
  "error": "User-friendly error message"
}
```

## Key Technologies

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with variables
- **Vanilla JavaScript** - ES6 modules, async/await, fetch API
- **Python http.server** - Simple static file server

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **JSON** - Data persistence (future: migrate to database)
- **Crypto API** - SHA-256 hashing

## File Size Reference

| Component | Size | Notes |
|-----------|------|-------|
| index.html | ~15KB | Full page markup |
| styles.css | ~45KB | Responsive design |
| app.js (frontend) | ~18KB | Logic & event handlers |
| api.js | ~8KB | API client library |
| server.js (backend) | ~22KB | All routes & handlers |

## Deployment Readiness

This architecture is ready for production with these steps:

1. **Database Migration**: Replace `data.json` with MongoDB/PostgreSQL
2. **Authentication**: Integrate Firebase Auth or Auth0
3. **Backend Hosting**: Deploy Express server to AWS/Heroku/DigitalOcean
4. **Frontend Hosting**: Deploy to Netlify/Vercel/GitHub Pages
5. **Environment Config**: Use .env files for API URLs and secrets
6. **API Security**: Add rate limiting, input validation, HTTPS
7. **Monitoring**: Add logging and error tracking

## Testing Checklist

- [ ] Frontend connects to backend on startup
- [ ] User can sign in (creates new user)
- [ ] User can submit prayers
- [ ] User can send chat messages
- [ ] User can save notes
- [ ] Admin can sign in (first time creates credential)
- [ ] Admin can upload sermons
- [ ] Admin can publish devotionals
- [ ] Admin can create events
- [ ] Admin can approve/decline prayers
- [ ] Admin can remove chat messages
- [ ] Data persists in backend/data.json
- [ ] Session tokens expire correctly
- [ ] API errors display user-friendly messages
