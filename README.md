# AuraTracker 🌟

Una webapp moderna per tracciare l'aura dei giocatori in partite competitive. Crea partite uniche, invita amici con codici condivisibili e gestisci classifiche in tempo reale.

![AuraTracker](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-green?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel)

## 🎮 **[DEMO LIVE](https://aura-tracker.vercel.app)**

## ✨ Caratteristiche

- 🎮 **Partite multiple**: Crea partite uniche con codici condivisibili
- 👥 **Multigiocatore**: Aggiungi giocatori con avatar personalizzati  
- 🏆 **Classifiche**: Sistema di punti aura in tempo reale
- 📱 **Mobile-first**: UI responsive e moderna con design glassmorphism
- ⚡ **Tempo reale**: Aggiornamenti istantanei per tutti i giocatori
- 🔒 **Gratuito**: Hostato gratuitamente su Vercel con Supabase
- 🎨 **UI Moderna**: Design glassmorphism con animazioni fluide

## 🚀 Setup Rapido

### 1. Clona il repository
```bash
git clone <your-repo-url>
cd auratracker
npm install
```

### 2. Configura Supabase

1. Crea un account su [Supabase](https://supabase.com)
2. Crea un nuovo progetto
3. Vai su **SQL Editor** e esegui questo script per creare le tabelle:

```sql
-- Crea la tabella games
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea la tabella players
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(10) NOT NULL,
  aura_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, name)
);

-- Crea la tabella actions
CREATE TABLE actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea indici per performance
CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_actions_game_id ON actions(game_id);
CREATE INDEX idx_actions_created_at ON actions(created_at DESC);
```

4. Vai su **Settings > API** e copia:
   - Project URL
   - Anon public key

### 3. Configura variabili d'ambiente

Copia `.env.example` in `.env.local` e sostituisci i valori:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## 🎯 Come Usare

1. **Crea una partita**: Inserisci un nome e ottieni un codice univoco
2. **Condividi il codice**: I tuoi amici possono unirsi con il codice
3. **Aggiungi giocatori**: Ogni giocatore inserisce il proprio nome
4. **Traccia l'aura**: Usa i pulsanti +/- o inserisci valori personalizzati
5. **Visualizza classifiche**: Controlla le posizioni in tempo reale

## 🏗️ Architettura

### Frontend
- **Next.js 14+** con App Router
- **TypeScript** per type safety
- **Tailwind CSS** per styling
- **Lucide React** per icone

### Backend
- **Next.js API Routes** per logica server
- **Supabase** come database PostgreSQL
- **SSR Support** per performance

### Deployment
- **Vercel** per hosting frontend
- **Supabase** per database (piano gratuito)

## 📊 Database Schema

```
games
├── id (UUID, PK)
├── code (VARCHAR(6), UNIQUE)
├── name (VARCHAR(255))
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

players
├── id (UUID, PK)
├── game_id (UUID, FK → games.id)
├── name (VARCHAR(100))
├── avatar (VARCHAR(10))
├── aura_points (INTEGER)
└── created_at (TIMESTAMP)

actions
├── id (UUID, PK)
├── game_id (UUID, FK → games.id)
├── player_id (UUID, FK → players.id)
├── action_type (VARCHAR(50))
├── points (INTEGER)
├── description (TEXT)
└── created_at (TIMESTAMP)
```

## 🚢 Deploy su Vercel

1. Connetti il repository a Vercel
2. Aggiungi le variabili d'ambiente nel dashboard Vercel
3. Deploy automatico!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=your-repo-url)

## 🔧 Configurazione Avanzata

### RLS (Row Level Security) in Supabase

Per sicurezza aggiuntiva, abilita RLS:

```sql
-- Abilita RLS per tutte le tabelle
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Policy per accesso pubblico (per demo)
CREATE POLICY "Allow all operations" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON actions FOR ALL USING (true);
```

### Realtime Updates (Opzionale)

Abilita realtime in Supabase per aggiornamenti live:

```sql
-- Abilita realtime per le tabelle
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE actions;
```

## 🤝 Contribuire

1. Fork il progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 🙏 Ringraziamenti

- [Next.js](https://nextjs.org/) per il framework
- [Supabase](https://supabase.com/) per il backend
- [Tailwind CSS](https://tailwindcss.com/) per lo styling
- [Lucide](https://lucide.dev/) per le icone
