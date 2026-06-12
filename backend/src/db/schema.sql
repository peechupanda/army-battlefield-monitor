-- ══════════════════════════════════════════════════════
--  ARMY BATTLEFIELD MONITORING SYSTEM
--  PostgreSQL Schema
--  Run: psql -U postgres -d army_bfms -f schema.sql
-- ══════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TROOPS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS troops (
  id           VARCHAR(20)  PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  rank         VARCHAR(20)  NOT NULL,
  unit         VARCHAR(100) NOT NULL,
  status       VARCHAR(10)  NOT NULL CHECK (status IN ('active','injured','reserve')),
  sector       VARCHAR(20)  NOT NULL CHECK (sector IN ('Alpha','Bravo','Charlie','Delta')),
  latitude     DECIMAL(10,6) NOT NULL DEFAULT 0,
  longitude    DECIMAL(10,6) NOT NULL DEFAULT 0,
  age          INT,
  blood_group  VARCHAR(5),
  contact      VARCHAR(20),
  notes        TEXT,
  last_updated TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_troops_status ON troops(status);
CREATE INDEX IF NOT EXISTS idx_troops_sector ON troops(sector);

-- ── ALERTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  level        VARCHAR(10)  NOT NULL CHECK (level IN ('critical','warning','info')),
  message      TEXT         NOT NULL,
  sector       VARCHAR(20)  CHECK (sector IN ('Alpha','Bravo','Charlie','Delta')),
  source       VARCHAR(100),
  acknowledged BOOLEAN      NOT NULL DEFAULT FALSE,
  timestamp    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_level        ON alerts(level);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp    ON alerts(timestamp DESC);

-- ── ENEMIES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enemies (
  id          VARCHAR(20)   PRIMARY KEY,
  latitude    DECIMAL(10,6) NOT NULL,
  longitude   DECIMAL(10,6) NOT NULL,
  strength    INT           NOT NULL DEFAULT 0,
  type        VARCHAR(30),
  confirmed   BOOLEAN       NOT NULL DEFAULT FALSE,
  last_seen   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── MISSIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS missions (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  sector      VARCHAR(20)  NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','failed')),
  type        VARCHAR(20)  NOT NULL CHECK (type IN ('offensive','defensive','recon','medevac','supply')),
  start_time  TIMESTAMPTZ,
  end_time    TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── WAR SITUATION ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS war_situation (
  id                    SERIAL PRIMARY KEY,
  phase                 VARCHAR(20) NOT NULL DEFAULT 'holding' CHECK (phase IN ('offensive','defensive','holding','advance','withdrawal')),
  territory_control_pct INT         NOT NULL DEFAULT 50,
  kia_today             INT         NOT NULL DEFAULT 0,
  wia_today             INT         NOT NULL DEFAULT 0,
  missions_completed    INT         NOT NULL DEFAULT 0,
  missions_total        INT         NOT NULL DEFAULT 0,
  threat_level          VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (threat_level IN ('low','medium','high','critical')),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── COMMANDS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commands (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        VARCHAR(20)  NOT NULL,
  sector      VARCHAR(20)  NOT NULL,
  troop_type  VARCHAR(20),
  count       INT,
  issued_by   VARCHAR(50)  NOT NULL DEFAULT 'CMD-1',
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','acknowledged','completed','failed')),
  notes       TEXT,
  issued_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commands_issued_at ON commands(issued_at DESC);

-- ── SEED: initial war situation row ───────────────────
INSERT INTO war_situation (phase, territory_control_pct, kia_today, wia_today, missions_completed, missions_total, threat_level)
VALUES ('offensive', 62, 0, 0, 3, 8, 'high')
ON CONFLICT DO NOTHING;
