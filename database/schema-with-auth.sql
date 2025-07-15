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

-- ====== SISTEMA DI VOTAZIONE ======
-- Tabella per proposte di azioni (richiede votazione)
CREATE TABLE IF NOT EXISTS action_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  proposed_by_user_id UUID REFERENCES users(id),
  proposed_by_username VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  total_voters INTEGER DEFAULT 0,
  required_votes INTEGER NOT NULL, -- Maggioranza necessaria
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  resulting_action_id UUID REFERENCES actions(id)
);

-- Tabella per i voti sulle proposte
CREATE TABLE IF NOT EXISTS proposal_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES action_proposals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  vote BOOLEAN NOT NULL, -- true = favorevole, false = contrario
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, user_id) -- Un voto per utente per proposta
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_performed_by ON actions(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_user ON game_sessions(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_last_active ON game_sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_action_comments_action_id ON action_comments(action_id);
CREATE INDEX IF NOT EXISTS idx_action_comments_created_at ON action_comments(created_at);
-- Indici per performance del sistema di votazione
CREATE INDEX IF NOT EXISTS idx_action_proposals_game_id ON action_proposals(game_id);
CREATE INDEX IF NOT EXISTS idx_action_proposals_status ON action_proposals(status);
CREATE INDEX IF NOT EXISTS idx_action_proposals_expires_at ON action_proposals(expires_at);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal_id ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_user_id ON proposal_votes(user_id);
