import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; actionId: string }> }
) {
  try {
    const { code, actionId } = await params
    const supabase = await createClient()

    // Verifica che l'azione esista e appartiene alla partita
    const { data: action, error: actionError } = await supabase
      .from('actions')
      .select(`
        *,
        games!inner (code)
      `)
      .eq('id', actionId)
      .eq('games.code', code.toUpperCase())
      .single()

    if (actionError || !action) {
      return NextResponse.json(
        { error: 'Azione non trovata' },
        { status: 404 }
      )
    }

    // Prima di eliminare l'azione, dobbiamo aggiornare i punti del giocatore
    // sottraendo i punti dell'azione che stiamo eliminando
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('aura_points')
      .eq('id', action.player_id)
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Giocatore non trovato' },
        { status: 404 }
      )
    }

    // Calcola i nuovi punti sottraendo l'azione che stiamo eliminando
    const newAuraPoints = player.aura_points - action.points

    // Aggiorna i punti del giocatore
    const { error: updateError } = await supabase
      .from('players')
      .update({ aura_points: newAuraPoints })
      .eq('id', action.player_id)

    if (updateError) {
      console.error('Errore aggiornamento punti:', updateError)
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento dei punti' },
        { status: 500 }
      )
    }

    // Elimina l'azione
    const { error: deleteError } = await supabase
      .from('actions')
      .delete()
      .eq('id', actionId)

    if (deleteError) {
      console.error('Errore eliminazione azione:', deleteError)
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione dell\'azione' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Azione eliminata con successo',
      newAuraPoints 
    })

  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
