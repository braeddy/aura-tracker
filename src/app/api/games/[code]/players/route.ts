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
    const { name } = await request.json()
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Codice partita richiesto' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome giocatore richiesto' },
        { status: 400 }
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

    // Verifica che il nome non sia già in uso
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)
      .eq('name', name.trim())
      .single()

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Nome giocatore già in uso' },
        { status: 400 }
      )
    }

    // Aggiungi il giocatore
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        name: name.trim(),
        avatar: getRandomAvatar(),
        aura_points: 0,
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

    return NextResponse.json({ 
      player,
      message: 'Giocatore aggiunto con successo' 
    })

  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
