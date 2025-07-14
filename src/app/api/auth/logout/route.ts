import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { gameCode, userId } = await request.json()
    
    // Se è un ospite, non c'è niente da fare lato server
    if (!userId || userId.startsWith('Guest_')) {
      return NextResponse.json({ success: true })
    }

    const supabase = await createClient()

    // Trova il game_id dal codice
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('code', gameCode)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Partita non trovata' },
        { status: 404 }
      )
    }

    // Rimuovi la sessione di gioco corrente
    const { error: sessionError } = await supabase
      .from('game_sessions')
      .delete()
      .eq('game_id', game.id)
      .eq('user_id', userId)

    if (sessionError) {
      console.error('Errore rimozione sessione:', sessionError)
      // Non bloccare il logout per errori di sessione
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Errore del server durante il logout' },
      { status: 500 }
    )
  }
}
