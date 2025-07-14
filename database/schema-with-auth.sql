-- Schema aggiornato per il sistema di login AuraTracker

-- Tabella utenti
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggiorna tabella players per collegare agli utenti
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Aggiorna tabella actions per tracciare chi effettua l'azione
ALTER TABLE actions
ADD COLUMN IF NOT EXISTS performed_by_user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS performed_by_username VARCHAR(100);

-- Tabella per sessioni di gioco
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Tabella per commenti alle azioni
CREATE TABLE IF NOT EXISTS action_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_performed_by ON actions(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_user ON game_sessions(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_last_active ON game_sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_action_comments_action_id ON action_comments(action_id);
CREATE INDEX IF NOT EXISTS idx_action_comments_created_at ON action_comments(created_at);
