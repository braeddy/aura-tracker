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

    // Ottieni le azioni recenti con informazioni su chi le ha effettuate
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

    // Log per debug - controlla se le azioni hanno le info dell'utente
    console.log('Actions from DB:', actions?.map(a => ({
      id: a.id,
      description: a.description,
      performed_by_username: a.performed_by_username,
      performed_by_user_id: a.performed_by_user_id
    })))

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

export async function PATCH(
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

    const body = await request.json()
    const { name, code: newCode } = body

    if (!name && !newCode) {
      return NextResponse.json(
        { error: 'Nome o codice richiesto per l\'aggiornamento' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verifica se la partita esiste
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

    // Prepara i dati da aggiornare
    const updateData: Record<string, string> = {}
    
    if (name && name.trim()) {
      updateData.name = name.trim()
    }
    
    if (newCode && newCode.trim()) {
      const upperNewCode = newCode.trim().toUpperCase()
      
      // Verifica che il nuovo codice non sia già in uso (solo se diverso dal corrente)
      if (upperNewCode !== game.code) {
        const { data: existingGame } = await supabase
          .from('games')
          .select('id')
          .eq('code', upperNewCode)
          .single()

        if (existingGame) {
          return NextResponse.json(
            { error: 'Codice partita già in uso. Scegli un codice diverso.' },
            { status: 409 }
          )
        }
        
        updateData.code = upperNewCode
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessuna modifica da effettuare' },
        { status: 400 }
      )
    }

    // Aggiorna la partita
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', game.id)
      .select()
      .single()

    if (updateError) {
      console.error('Errore nell\'aggiornamento della partita:', updateError)
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento della partita' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Partita aggiornata con successo',
      game: updatedGame,
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Errore nell\'aggiornamento della partita:', error)
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
