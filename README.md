# Kairos Living Glory Church App

A separated frontend/backend church web app for livestreaming, community chat, events, Bible/devotionals, prayer requests, giving, and admin management.

## Structure

```text
frontend/   Static app: HTML, CSS, and ES modules
backend/    Node.js API and JSON persistence
firebase.json  Firebase Hosting config for frontend/
```

## Features

- Member sign-in with backend-issued session token
- Custom live-streaming interface
- Community chat stored through the API
- Events and announcements
- Bible/devotional notes
- Prayer request queue with admin approval
- Admin dashboard for sermons, devotionals, events, moderation, and analytics

## Local Development

No npm package installation is required for the current code path.

```bash
npm run check
npm run dev:backend
npm run dev:frontend
```

Open the frontend at `http://localhost:5000`.

## API

The frontend chooses the API URL automatically:

- Localhost frontend: `http://localhost:3001/api`
- Production fallback: `https://klgc.onrender.com/api`
- Override: set `window.KLGC_API_BASE` before `app.js`

Useful endpoint:

```bash
curl http://127.0.0.1:3001/api/health
```

## Firebase Publish

Firebase Hosting is configured for `frontend/`.

```bash
firebase login
firebase use --add
firebase deploy --only hosting
```

Hosting deploys the frontend only. Deploy the backend separately and point the frontend to that deployed API URL.

## Production Notes

Before real church production use:

- Move data from `backend/data.json` to Firestore, PostgreSQL, or another database.
- Use Firebase Auth or another auth provider with real password hashing/admin claims.
- Store sermon/audio/video uploads in Firebase Storage, Cloud Storage, or a media platform.
- Add rate limiting, audit logs, backups, and stricter CORS origins.
