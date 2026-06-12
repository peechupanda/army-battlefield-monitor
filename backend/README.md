# ⚔ BFMS Backend — Express + PostgreSQL + WebSocket

REST API + real-time WebSocket server for the Army Battlefield Monitoring System.

---

## Tech Stack
- **Node.js + Express** — REST API
- **PostgreSQL** — database
- **WebSocket (ws)** — real-time push to Angular
- **dotenv** — environment config

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Server health check |
| GET | `/api/troops` | Get all troops |
| GET | `/api/troops?status=active&sector=Alpha` | Filter troops |
| GET | `/api/troops/:id` | Get single troop |
| POST | `/api/troops` | Add troop |
| PATCH | `/api/troops/:id` | Update troop (status, position…) |
| DELETE | `/api/troops/:id` | Remove troop |
| GET | `/api/troops/stats/summary` | Stats per sector |
| GET | `/api/alerts` | Get alerts |
| POST | `/api/alerts` | Create alert |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| GET | `/api/enemies` | Get enemy positions |
| POST | `/api/enemies` | Add/update enemy |
| DELETE | `/api/enemies/:id` | Remove enemy |
| GET | `/api/situation` | Get war situation |
| PUT | `/api/situation` | Update war situation |
| GET | `/api/missions` | Get missions |
| POST | `/api/missions` | Create mission |
| PATCH | `/api/missions/:id` | Update mission status |
| GET | `/api/commands` | Get command log |
| POST | `/api/commands` | Issue command |

---

## Quick Setup

### 1. Install PostgreSQL
Download: https://www.postgresql.org/download/windows/

### 2. Create database
```sql
CREATE DATABASE army_bfms;
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 4. Install dependencies
```bash
npm install
```

### 5. Create tables
```bash
npm run db:init
```

### 6. Start server
```bash
npm run dev      # development (auto-restart)
npm start        # production
```

Server runs at: `http://localhost:3000`

---

## WebSocket Events (Server → Angular)

| Event | When triggered |
|---|---|
| `TROOP_UPDATE` | Any troop status/position change |
| `ALERT` | New alert created |
| `ENEMY_UPDATE` | Enemy position added/updated |
| `SITUATION_UPDATE` | War situation updated |
| `COMMAND_UPDATE` | Command issued |
| `MISSION_UPDATE` | Mission status changed |

---

## Deploy Options

### Railway (recommended — free tier)
1. Push to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set environment variables
5. Done — public URL auto-generated

### Render
1. New Web Service → connect GitHub repo
2. Add PostgreSQL database
3. Set env vars → Deploy

### Your own VPS
```bash
npm install -g pm2
pm2 start server.js --name bfms-backend
pm2 save
```

---

## Connecting to Angular

In `army-battlefield-monitor/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl:  'ws://localhost:3000',
};
```

For production (`environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend.railway.app/api',
  wsUrl:  'wss://your-backend.railway.app',
};
```
