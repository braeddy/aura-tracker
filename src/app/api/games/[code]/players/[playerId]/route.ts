import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; playerId: string }> }
) {
  try {
    const { code, playerId } = await params
    const { points, description } = await request.json()
    
    if (!code || !playerId) {
      return NextResponse.json(
        { error: 'Codice partita e ID giocatore richiesti' },
        { status: 400 }
      )
    }

    if (typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Punti devono essere un numero' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verifica che la partita e il giocatore esistano
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select(`
        *,
        games!inner (
          id,
          code
        )
      `)
      .eq('id', playerId)
      .eq('games.code', code.toUpperCase())
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Giocatore non trovato' },
        { status: 404 }
      )
    }

    const newAuraPoints = player.aura_points + points

    // Aggiorna i punti del giocatore
    const { data: updatedPlayer, error: updateError } = await supabase
      .from('players')
      .update({ 
        aura_points: newAuraPoints,
      })
      .eq('id', playerId)
      .select()
      .single()

    if (updateError) {
      console.error('Errore aggiornamento punti:', updateError)
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento dei punti' },
        { status: 500 }
      )
    }

    // Registra l'azione
    const { error: actionError } = await supabase
      .from('actions')
      .insert({
        game_id: player.games.id,
        player_id: playerId,
        action_type: points > 0 ? 'aura_gain' : 'aura_loss',
        points,
        description: description || (points > 0 ? 'Aura guadagnata' : 'Aura persa'),
        created_at: new Date().toISOString()
      })

    if (actionError) {
      console.error('Errore registrazione azione:', actionError)
    }

    return NextResponse.json({ 
      player: updatedPlayer,
      message: 'Punti aggiornati con successo' 
    })

  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; playerId: string }> }
) {
  try {
    const { code, playerId } = await params
    
    if (!code || !playerId) {
      return NextResponse.json(
        { error: 'Codice partita e ID giocatore richiesti' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verifica che la partita e il giocatore esistano
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select(`
        *,
        games!inner (
          id,
          code
        )
      `)
      .eq('id', playerId)
      .eq('games.code', code.toUpperCase())
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Giocatore non trovato' },
        { status: 404 }
      )
    }

    // Elimina prima tutte le azioni del giocatore
    const { error: actionsError } = await supabase
      .from('actions')
      .delete()
      .eq('player_id', playerId)

    if (actionsError) {
      console.error('Errore eliminazione azioni:', actionsError)
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione delle azioni del giocatore' },
        { status: 500 }
      )
    }

    // Elimina il giocatore
    const { error: deleteError } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId)

    if (deleteError) {
      console.error('Errore eliminazione giocatore:', deleteError)
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione del giocatore' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Giocatore eliminato con successo' 
    })

  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
