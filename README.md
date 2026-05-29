# Support CRM

A lightweight customer support CRM built with Node.js, Express, SQLite, React (Vite), and Tailwind CSS.  
It helps support teams create, track, and update tickets with searchable lists, status management, and ticket notes.

## Tech Stack

- Backend: Node.js, Express, better-sqlite3
- Frontend: React (Vite), React Router, Axios
- Styling: Tailwind CSS
- Database: **PostgreSQL (Supabase)** for production; SQLite removed from deploy path
- Deployment (recommended): **Supabase + Railway + Vercel** — see `docs/DEPLOY_SUPABASE_RAILWAY.md`
- Alternative: **Single app** (Fly.io + SQLite) — see `docs/DEPLOY_SINGLE.md`

## Folder Structure

```text
support-crm/
├── backend/
│   ├── index.js
│   ├── db.js
│   ├── routes/
│   │   └── tickets.js
│   ├── data/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
├── README.md
└── .gitignore
```

## Local Setup

1. Clone the repo:
   - `git clone <your-repo-url>`
   - `cd support-crm`
2. Setup backend:
   - `cd backend`
   - `npm install`
   - Copy `.env.example` to `.env` and adjust values if needed
   - `npm run dev` (or `npm start`)
3. Setup frontend:
   - `cd ../frontend`
   - `npm install`
   - Copy `.env.example` to `.env`
   - `npm run dev`
4. Open `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)

- `PORT=3001`
- `CORS_ORIGIN=http://localhost:5173`
- `NODE_ENV=development`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=200`
- `BODY_LIMIT=100kb`
- `LOG_LEVEL=dev`

### Frontend (`frontend/.env`)

- `VITE_API_URL=http://localhost:3001`

## API Documentation

Base URL: `http://localhost:3001/api`

### 1) Create Ticket

- Method: `POST`
- Endpoint: `/tickets`
- Request body:

```json
{
  "customer_name": "John",
  "customer_email": "john@test.com",
  "subject": "Can't login",
  "description": "Password reset not working"
}
```

- Success response (`201`):

```json
{
  "ticket_id": "TKT-001-ABC123",
  "customer_name": "John",
  "customer_email": "john@test.com",
  "subject": "Can't login",
  "description": "Password reset not working",
  "status": "Open",
  "created_at": "2026-05-28 10:30:00",
  "updated_at": "2026-05-28 10:30:00"
}
```

### 2) List Tickets (with optional filters)

- Method: `GET`
- Endpoint: `/tickets`
- Query params:
  - `status=Open|In Progress|Closed`
  - `search=<text>`
  - `page=<number>`
  - `limit=<number>`
- Example:
  - `/tickets?status=Open&search=login&page=1&limit=25`
- Success response (`200`):

```json
{
  "items": [
    {
      "ticket_id": "TKT-0001-ABCD",
      "customer_name": "John",
      "customer_email": "john@test.com",
      "subject": "Can't login",
      "description": "Password reset not working",
      "status": "Open",
      "created_at": "2026-05-28 10:30:00",
      "updated_at": "2026-05-28 10:30:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1,
    "totalPages": 1
  }
}
```

### 3) Get Ticket Detail (+ Notes)

- Method: `GET`
- Endpoint: `/tickets/:ticket_id`
- Example:
  - `/tickets/TKT-001-ABC123`
- Success response (`200`):

```json
{
  "ticket_id": "TKT-001-ABC123",
  "customer_name": "John",
  "customer_email": "john@test.com",
  "subject": "Can't login",
  "description": "Password reset not working",
  "status": "In Progress",
  "created_at": "2026-05-28 10:30:00",
  "updated_at": "2026-05-28 10:40:00",
  "notes": [
    {
      "id": 1,
      "ticket_id": "TKT-001-ABC123",
      "note_text": "Asked customer to clear browser cache.",
      "created_at": "2026-05-28 10:35:00"
    }
  ]
}
```

### 4) Update Ticket Status and/or Add Note

- Method: `PUT`
- Endpoint: `/tickets/:ticket_id`
- Request body (both optional, at least one required):

```json
{
  "status": "Closed",
  "note_text": "Issue resolved after password reset."
}
```

- Success response (`200`): updated ticket object including latest notes

## Deployment (recommended: Supabase + Railway + Vercel)

See **`docs/DEPLOY_SUPABASE_RAILWAY.md`** for full step-by-step instructions (persistent free Postgres).

## Deployment (alternative: single app + SQLite)

See **`docs/DEPLOY_SINGLE.md`** for Fly.io steps (one URL, persistent SQLite on a volume).

Quick local production test:

```bash
npm run install:all
npm run build
cd backend && NODE_ENV=production node index.js
```

Open `http://localhost:3001`.

### Legacy: split deploy (optional)

### Backend to Render

1. Push repository to GitHub.
2. Create a Render Web Service for `backend`.
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add env var: `NODE_ENV=production`
6. Add a Render Disk mounted at `/opt/render/project/src/data`
7. Redeploy.

### Frontend to Vercel

1. Import `frontend` as a project in Vercel.
2. Add env var:
   - `VITE_API_URL=https://your-render-backend-url.onrender.com`
3. Deploy.

## Useful Scripts

### Backend

- `npm run dev` - start backend with nodemon
- `npm start` - start backend with node

### Frontend

- `npm run dev` - start Vite dev server
- `npm run build` - create production build
- `npm run preview` - preview production build

## Interview Prep

- A complete interview explainer is available at `docs/INTERVIEW_GUIDE.md`.
