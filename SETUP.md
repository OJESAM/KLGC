# Quick Start Guide

## Run the Split Church App

This project now runs without external npm packages. The frontend is static HTML/CSS/JS and the backend is a Node.js API using built-in modules.

### Start the backend

```bash
npm run dev:backend
```

Backend URL:

```text
http://127.0.0.1:3001/api
```

Health check:

```bash
curl http://127.0.0.1:3001/api/health
```

### Start the frontend

In a second terminal:

```bash
npm run dev:frontend
```

Open:

```text
http://localhost:5000
```

### Run checks

```bash
npm run check
```

## Authentication

Members sign in with name, email, and a password of at least 8 characters. The backend creates a one-hour bearer-token session.

Admin sign-in uses email and a passcode of at least 10 characters. The first admin sign-in creates the local admin credential in `backend/data.json`; later sign-ins must use the same email/passcode. Admin sessions last 30 minutes by default or 8 hours when remembered.

For production, replace this local JSON credential flow with Firebase Auth admin claims or another managed auth provider.

## Firebase Hosting Publish

This repo has `firebase.json` configured to deploy the `frontend/` folder.

1. Log in:

```bash
firebase login
```

2. Select or attach a Firebase project:

```bash
firebase use --add
```

3. Deploy only hosting:

```bash
firebase deploy --only hosting
```

If you already know the project id:

```bash
firebase deploy --only hosting --project YOUR_PROJECT_ID
```

Important: Firebase Hosting only publishes the frontend. The backend must be deployed separately, for example to Render, Cloud Run, or Firebase Cloud Functions. After backend deploy, set the production API URL in `frontend/api.js` or inject `window.KLGC_API_BASE` before loading `app.js`.
