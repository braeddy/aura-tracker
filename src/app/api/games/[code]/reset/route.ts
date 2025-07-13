import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = await createClient()
    const { code } = params

    // Verifica se la partita esiste
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('code', code)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Partita non trovata' },
        { status: 404 }
      )
    }

    // Elimina tutte le azioni della partita
    const { error: actionsError } = await supabase
      .from('actions')
      .delete()
      .eq('game_id', game.id)

    if (actionsError) {
      console.error('Errore nell\'eliminazione delle azioni:', actionsError)
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione delle azioni' },
        { status: 500 }
      )
    }

    // Resetta i punti aura di tutti i giocatori a 1000
    const { error: playersError } = await supabase
      .from('players')
      .update({ aura_points: 1000 })
      .eq('game_id', game.id)

    if (playersError) {
      console.error('Errore nel reset dei giocatori:', playersError)
      return NextResponse.json(
        { error: 'Errore nel reset dei punti aura' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Partita resettata con successo',
      resetAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Errore nel reset della partita:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
