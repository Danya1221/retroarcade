CREATE TABLE IF NOT EXISTS multiplayer_rooms (
 id uuid PRIMARY KEY,
 code text NOT NULL UNIQUE,
 game text NOT NULL CHECK(game IN ('racer','tanks')),
 mode text NOT NULL CHECK(mode IN ('online','mixed')),
 host_id bigint NOT NULL REFERENCES users(id),
 status text NOT NULL DEFAULT 'lobby' CHECK(status IN ('lobby','playing','finished')),
 max_players integer NOT NULL DEFAULT 4 CHECK(max_players BETWEEN 2 AND 4),
 seed text NOT NULL,
 started_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS multiplayer_players (
 room_id uuid NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
 user_id bigint NOT NULL REFERENCES users(id),
 name text NOT NULL,
 ready boolean NOT NULL DEFAULT false,
 slot integer NOT NULL,
 input integer NOT NULL DEFAULT 0,
 seq integer NOT NULL DEFAULT 0,
 last_seen timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(room_id,user_id),
 UNIQUE(room_id,slot)
);
CREATE INDEX IF NOT EXISTS multiplayer_room_status ON multiplayer_rooms(game,status,created_at DESC);

ALTER TABLE multiplayer_players ADD COLUMN IF NOT EXISTS state jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE multiplayer_players ADD COLUMN IF NOT EXISTS finished boolean NOT NULL DEFAULT false;
ALTER TABLE multiplayer_players ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0;
ALTER TABLE multiplayer_players ADD COLUMN IF NOT EXISTS finish_position integer;
