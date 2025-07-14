import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AVATAR_EMOJIS = ['👑', '🏆', '⚡', '🔥', '💎', '🌟', '🎯', '🚀', '💫', '🎭', '🎪', '🎨', '🎵', '🎮', '🎲']

function getRandomAvatar(): string {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { userId } = await request.json()
    
    console.log('Add player request:', { code, userId })
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Codice partita richiesto' },
        { status: 400 }
      )
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'ID utente richiesto. Solo gli utenti registrati possono essere aggiunti come giocatori.' },
        { status: 400 }
      )
    }

    // Verifica che non sia un ospite
    if (userId.startsWith('Guest_')) {
      return NextResponse.json(
        { error: 'Gli ospiti non possono essere aggiunti come giocatori. Registrati per partecipare attivamente al gioco.' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Verifica che la partita esista
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('code', code.toUpperCase())
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Partita non trovata' },
        { status: 404 }
      )
    }

    // Verifica che l'utente esista nel database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utente non trovato. Effettua nuovamente il login.' },
        { status: 404 }
      )
    }

    // Verifica che l'utente non sia già un giocatore in questa partita
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)
      .eq('user_id', userId)
      .single()

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Sei già un giocatore di questa partita' },
        { status: 400 }
      )
    }

    // Aggiungi il giocatore collegando l'utente registrato
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        user_id: userId,
        name: user.display_name,
        avatar: user.avatar_url || getRandomAvatar(),
        aura_points: 0,
        is_guest: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Errore aggiunta giocatore:', error)
      return NextResponse.json(
        { error: 'Errore nell\'aggiunta del giocatore' },
        { status: 500 }
      )
    }

    // Crea/aggiorna la sessione di gioco
    await supabase
      .from('game_sessions')
      .upsert({
        game_id: game.id,
        user_id: userId,
        last_active: new Date().toISOString()
      })

    return NextResponse.json({ 
      player,
      message: 'Ti sei unito alla partita con successo!' 
    })

  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
