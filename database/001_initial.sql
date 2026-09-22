CREATE TABLE IF NOT EXISTS users (
 id bigint PRIMARY KEY, name text NOT NULL, username text, avatar text,
 created_at timestamptz NOT NULL DEFAULT now(), last_seen timestamptz NOT NULL DEFAULT now(),
 xp integer NOT NULL DEFAULT 0 CHECK(xp>=0), shards integer NOT NULL DEFAULT 0 CHECK(shards>=0),
 streak integer NOT NULL DEFAULT 1, login_day date NOT NULL DEFAULT CURRENT_DATE,
 progress integer NOT NULL DEFAULT 1, pity integer NOT NULL DEFAULT 0,
 stats jsonb NOT NULL DEFAULT '{}', equipped jsonb NOT NULL DEFAULT '{}', banned boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS auth_sessions(token_hash text PRIMARY KEY, user_id bigint NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS auth_user ON auth_sessions(user_id);
CREATE TABLE IF NOT EXISTS game_sessions (
 id uuid PRIMARY KEY, user_id bigint NOT NULL REFERENCES users(id), game text NOT NULL,
 seed text NOT NULL, level integer NOT NULL DEFAULT 1, daily date, state jsonb NOT NULL,
 version integer NOT NULL DEFAULT 0, started_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 result jsonb, excluded boolean NOT NULL DEFAULT false, suspicious text
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_session ON game_sessions(user_id) WHERE finished_at IS NULL;
CREATE INDEX IF NOT EXISTS score_lookup ON game_sessions(game,finished_at,user_id) WHERE finished_at IS NOT NULL;
CREATE TABLE IF NOT EXISTS inventory(user_id bigint REFERENCES users(id), item text NOT NULL, quantity integer NOT NULL CHECK(quantity>=0), PRIMARY KEY(user_id,item));
CREATE TABLE IF NOT EXISTS user_skins(user_id bigint REFERENCES users(id), skin text NOT NULL, acquired_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,skin));
CREATE TABLE IF NOT EXISTS user_achievements(user_id bigint REFERENCES users(id), achievement text NOT NULL, acquired_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,achievement));
CREATE TABLE IF NOT EXISTS user_secrets(user_id bigint REFERENCES users(id), secret text NOT NULL, acquired_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,secret));
CREATE TABLE IF NOT EXISTS challenge_progress(user_id bigint REFERENCES users(id), challenge text NOT NULL, period date NOT NULL, value integer NOT NULL DEFAULT 0, claimed boolean NOT NULL DEFAULT false, PRIMARY KEY(user_id,challenge,period));
CREATE TABLE IF NOT EXISTS loot_drops(id uuid PRIMARY KEY, user_id bigint REFERENCES users(id), box text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS loot_user ON loot_drops(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS settings(key text PRIMARY KEY,value jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS admin_audit(id bigserial PRIMARY KEY,user_id bigint REFERENCES users(id),action text NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS daily_mazes(day date PRIMARY KEY,seed text NOT NULL);
CREATE TABLE IF NOT EXISTS bot_updates(id bigint PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now());
