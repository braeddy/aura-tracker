import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; playerId: string }> }
) {
  try {
    const { code, playerId } = await params
    const { points, description, userId } = await request.json()
    
    if (!code || !playerId) {
      return NextResponse.json(
        { error: 'Codice partita e ID giocatore richiesti' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utente richiesto per effettuare azioni' },
        { status: 400 }
      )
    }

    // Verifica che non sia un ospite
    if (userId.startsWith('Guest_')) {
      return NextResponse.json(
        { error: 'Gli ospiti non possono effettuare azioni. Registrati per partecipare attivamente al gioco.' },
        { status: 403 }
      )
    }

    if (typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Punti devono essere un numero' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Ottieni informazioni dell'utente che effettua l'azione
    let performedByUser = null
    if (!userId.startsWith('Guest_')) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, username, display_name')
        .eq('id', userId)
        .single()
      
      performedByUser = userData
    }

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

    // Registra l'azione con informazioni su chi l'ha effettuata
    const actionData: {
      game_id: string
      player_id: string
      action_type: 'aura_gain' | 'aura_loss'
      points: number
      description: string
      created_at: string
      performed_by_user_id?: string
      performed_by_username?: string
    } = {
      game_id: player.games.id,
      player_id: playerId,
      action_type: points > 0 ? 'aura_gain' : 'aura_loss',
      points,
      description: description || (points > 0 ? 'Aura guadagnata' : 'Aura persa'),
      created_at: new Date().toISOString()
    }

    // Aggiungi informazioni sull'utente che ha effettuato l'azione se disponibili
    if (performedByUser) {
      actionData.performed_by_user_id = performedByUser.id
      actionData.performed_by_username = performedByUser.display_name
    } else if (userId.startsWith('Guest_')) {
      actionData.performed_by_username = 'Ospite'
    }

    console.log('Saving action with data:', actionData)

    const { error: actionError } = await supabase
      .from('actions')
      .insert(actionData)

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
