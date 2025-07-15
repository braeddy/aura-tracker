import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Ottieni tutte le proposte attive per un gioco
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()

    // Trova il gioco
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('code', code)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Gioco non trovato' }, { status: 404 })
    }

    // Ottieni le proposte attive con le informazioni dei giocatori
    const { data: proposals, error: proposalsError } = await supabase
      .from('action_proposals')
      .select(`
        *,
        players!inner (
          id,
          name
        )
      `)
      .eq('game_id', game.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (proposalsError) {
      console.error('Error fetching proposals:', proposalsError)
      return NextResponse.json({ error: 'Errore nel recuperare le proposte' }, { status: 500 })
    }

    return NextResponse.json({ proposals: proposals || [] })

  } catch (error) {
    console.error('Proposals fetch error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// POST - Crea una nuova proposta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { playerId, description, points, username } = await request.json()

    if (!playerId || !description || points === undefined || !username) {
      return NextResponse.json({ error: 'Dati proposta incompleti' }, { status: 400 })
    }

    const supabase = await createClient()

    // Trova il gioco
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('code', code)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Gioco non trovato' }, { status: 404 })
    }

    // Conta il numero di giocatori per calcolare la maggioranza
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)

    if (playersError) {
      return NextResponse.json({ error: 'Errore nel contare i giocatori' }, { status: 500 })
    }

    const totalPlayers = players?.length || 1
    const requiredVotes = Math.floor(totalPlayers / 2) + 1 // Maggioranza assoluta (metà + 1)

    // Crea la proposta
    const { data: proposal, error: insertError } = await supabase
      .from('action_proposals')
      .insert({
        game_id: game.id,
        player_id: playerId,
        proposed_by_username: username,
        description,
        points,
        required_votes: requiredVotes,
        total_voters: totalPlayers
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating proposal:', insertError)
      return NextResponse.json({ error: 'Errore nella creazione della proposta' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      proposal,
      message: `Proposta creata! Servono ${requiredVotes} voti favorevoli su ${totalPlayers} giocatori.`
    })

  } catch (error) {
    console.error('Proposal creation error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
