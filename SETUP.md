# 🚀 Setup Veloce AuraTracker

Segui questi passi per far funzionare AuraTracker in pochi minuti:

## 1. Configura Supabase (GRATUITO)

1. **Vai su [supabase.com](https://supabase.com)** e crea un account gratuito
2. **Crea un nuovo progetto**:
   - Nome: `auratracker` (o quello che preferisci)
   - Password: scegli una password sicura
   - Regione: Europe West (per prestazioni migliori in Italia)

3. **Crea il database**:
   - Vai su **SQL Editor** nella sidebar
   - Copia tutto il contenuto del file `database/schema.sql`
   - Incolla nel SQL Editor e clicca **RUN**

4. **Ottieni le credenziali**:
   - Vai su **Settings > API**
   - Copia:
     - **Project URL** (qualcosa come `https://xxx.supabase.co`)
     - **Anon public key** (una chiave lunga)

## 2. Configura l'App

1. **Crea il file ambiente**:
   ```bash
   cp .env.example .env.local
   ```

2. **Modifica `.env.local`** con i tuoi valori Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=la-tua-chiave-anon
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## 3. Avvia l'App

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) e clicca **Test Connection** per verificare che tutto funzioni!

## 4. Deploy su Vercel (GRATUITO)

1. **Carica su GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Vai su [vercel.com](https://vercel.com)** e connetti il repository

3. **Aggiungi le variabili d'ambiente** nel dashboard Vercel (stesso contenuto del `.env.local`)

4. **Deploy!** - Il tuo AuraTracker sarà online in 2 minuti

## 🎮 Come Usare

1. **Crea una partita** dalla homepage
2. **Condividi il codice** con i tuoi amici  
3. **Ognuno si aggiunge** come giocatore
4. **Traccia l'aura** con i pulsanti +/- o valori personalizzati
5. **Guarda le classifiche** in tempo reale!

## ❓ Problemi?

- **Errore connessione**: Verifica le credenziali Supabase in `.env.local`
- **Tabelle non trovate**: Assicurati di aver eseguito lo script SQL
- **Deploy fallito**: Controlla che le variabili d'ambiente siano corrette su Vercel

## 💡 Tips

- **Codici partita**: Sono univoci e lunghi 6 caratteri
- **Avatar**: Vengono assegnati automaticamente emoji casuali
- **Punti negativi**: Puoi dare punti negativi per "perdere aura"
- **Storico**: Tutte le azioni vengono registrate

Divertiti a tracciare l'aura! 🌟
