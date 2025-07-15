import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Ottieni i dettagli di una proposta specifica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; proposalId: string }> }
) {
  try {
    const { code, proposalId } = await params
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

    // Ottieni la proposta con i dettagli del giocatore
    const { data: proposal, error: proposalError } = await supabase
      .from('action_proposals')
      .select(`
        *,
        players!inner (
          id,
          name
        )
      `)
      .eq('id', proposalId)
      .eq('game_id', game.id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposta non trovata' }, { status: 404 })
    }

    // Ottieni i voti per questa proposta
    const { data: votes, error: votesError } = await supabase
      .from('proposal_votes')
      .select('username, vote, created_at')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true })

    if (votesError) {
      console.error('Error fetching votes:', votesError)
      return NextResponse.json({ error: 'Errore nel recuperare i voti' }, { status: 500 })
    }

    // Converti i voti boolean in stringhe per il frontend
    const votesWithStringValues = votes?.map(vote => ({
      ...vote,
      vote: vote.vote ? 'for' : 'against'
    })) || []

    return NextResponse.json({ 
      proposal: {
        ...proposal,
        votes: votesWithStringValues
      }
    })

  } catch (error) {
    console.error('Proposal details fetch error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
