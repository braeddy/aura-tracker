import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Codice partita richiesto' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Ottieni la partita
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Partita non trovata' },
        { status: 404 }
      )
    }

    // Ottieni i giocatori
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .order('aura_points', { ascending: false })

    if (playersError) {
      console.error('Errore caricamento giocatori:', playersError)
      return NextResponse.json(
        { error: 'Errore nel caricamento dei giocatori' },
        { status: 500 }
      )
    }

    // Ottieni le azioni recenti
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select(`
        *,
        players!inner (
          name
        )
      `)
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (actionsError) {
      console.error('Errore caricamento azioni:', actionsError)
    }

    return NextResponse.json({
      game,
      players: players || [],
      actions: actions || []
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
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Codice partita richiesto' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verifica se la partita esiste
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

    // Elimina tutte le azioni della partita (deve essere fatto prima per via delle foreign key)
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

    // Elimina tutti i giocatori della partita
    const { error: playersError } = await supabase
      .from('players')
      .delete()
      .eq('game_id', game.id)

    if (playersError) {
      console.error('Errore nell\'eliminazione dei giocatori:', playersError)
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione dei giocatori' },
        { status: 500 }
      )
    }

    // Elimina la partita
    const { error: gameDeleteError } = await supabase
      .from('games')
      .delete()
      .eq('id', game.id)

    if (gameDeleteError) {
      console.error('Errore nell\'eliminazione della partita:', gameDeleteError)
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione della partita' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Partita eliminata con successo',
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Errore nell\'eliminazione della partita:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
