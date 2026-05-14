# Development Setup

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker Desktop

## Clone and bootstrap

```bash
git clone https://github.com/TrusynAI/trusyn-ai.git
cd trusyn-ai
```

## Backend setup

```bash
cd backend
cp .env.example .env
docker compose up --build
```

Backend API:
- `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

## Frontend setup

### Landing page
```bash
cd frontend/landing-page
npm install
npm run dev
```

### User app
```bash
cd frontend/web-app
npm install
npm run dev
```

### Super admin panel
```bash
cd frontend/admin_panel
npm install
npm run dev
```

## Common contributor flow

1. Create branch from `develop`
2. Implement change + tests
3. Run local validation
4. Open PR with template completed

## Local validation checklist

- Backend:
  - `python -m compileall backend/app`
  - `pytest backend/tests -q`
- Frontend apps:
  - `npm run build` per app
