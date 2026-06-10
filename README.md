# ⚔ Army Battlefield Monitoring System (BFMS)

> Real-time tactical dashboard — interactive map, troop database, command center, live alerts.

![Angular](https://img.shields.io/badge/Angular-17-red?logo=angular)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)

---

## Features
- **Tactical Map** — Leaflet.js with live troop markers, enemy positions, sector zones, 3D tilt
- **Troop Database** — Filter/sort by status, sector, name; real-time updates
- **Command Center** — Deploy, Extract, Medevac, Reinforce, Airstrike with sector targeting
- **Alerts Panel** — Critical/Warning/Info with acknowledge support
- **War Situation Bar** — Phase, territory control %, KIA, missions
- **WebSocket Support** — Real-time backend push updates

**Color coding:** 🟢 Active · 🔴 Injured · 🟤 Reserve · 🔺 Enemy · ⭐ HQ

---

## Quick Start
```bash
git clone https://github.com/YOUR_USERNAME/army-battlefield-monitor.git
cd army-battlefield-monitor
npm install --legacy-peer-deps
npm start   # http://localhost:4200
```

---

## Connecting Your Database
**Edit only one file:** `src/app/core/services/data.service.ts`

### REST API
```typescript
getTroops(): Observable<Troop[]> {
  return this.http.get<Troop[]>(`${this.API_URL}/troops`);
}
```
Set your URL in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://your-backend.com/api',
  wsUrl:  'wss://your-backend.com/ws',
};
```

### Firebase / Firestore
```bash
npm install @angular/fire firebase --legacy-peer-deps
```
```typescript
getTroops(): Observable<Troop[]> {
  return collectionData(collection(this.firestore, 'troops')) as Observable<Troop[]>;
}
```

### Supabase
```bash
npm install @supabase/supabase-js --legacy-peer-deps
```
```typescript
getTroops(): Observable<Troop[]> {
  return from(supabase.from('troops').select('*').then(r => r.data ?? []));
}
```

### WebSocket (real-time push)
Server sends JSON:
```json
{ "type": "TROOP_UPDATE",      "payload": { "id": "T001", "status": "injured" } }
{ "type": "ALERT",             "payload": { "level": "critical", "message": "..." } }
{ "type": "ENEMY_UPDATE",      "payload": { "id": "E001", "latitude": 28.65 } }
{ "type": "SITUATION_UPDATE",  "payload": { "phase": "defensive" } }
```

---

## Data Models (match these to your DB schema)
```typescript
interface Troop {
  id: string;           // "T001"
  name: string;
  rank: string;
  unit: string;
  status: 'active' | 'injured' | 'reserve';
  sector: 'Alpha' | 'Bravo' | 'Charlie' | 'Delta';
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}
```

---

## Deploy to GitHub Pages

### Auto (GitHub Actions)
1. Push to `main`
2. Settings → Pages → Source → **GitHub Actions**
3. Done — auto-deploys on every push ✓

### Manual
```bash
npm run deploy
```
Live at: `https://YOUR_USERNAME.github.io/army-battlefield-monitor/`

---

## Project Structure
```
src/app/
├── core/
│   ├── models/          → troop, alert, command types
│   └── services/
│       ├── data.service.ts      ← ★ ONLY FILE YOU EDIT for DB
│       ├── troop.service.ts
│       ├── alert.service.ts
│       ├── command.service.ts
│       ├── map.service.ts
│       └── websocket.service.ts
└── features/
    ├── dashboard/
    ├── battlefield-map/
    ├── troop-database/
    ├── command-center/
    └── alerts-panel/
```

## Configure Sector GPS Bounds
Edit `src/app/core/services/map.service.ts`:
```typescript
export const SECTOR_BOUNDS = {
  Alpha:   [[LAT1, LNG1], [LAT2, LNG2]],  // your real coords
  Bravo:   [[LAT1, LNG1], [LAT2, LNG2]],
  Charlie: [[LAT1, LNG1], [LAT2, LNG2]],
  Delta:   [[LAT1, LNG1], [LAT2, LNG2]],
};
```
