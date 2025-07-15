import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Vota su una proposta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; proposalId: string }> }
) {
  try {
    const { code, proposalId } = await params
    const { vote, username } = await request.json()

    if (!vote || !username || (vote !== 'for' && vote !== 'against')) {
      return NextResponse.json({ error: 'Voto o username non valido' }, { status: 400 })
    }

    // Converti il voto in boolean per il database
    const voteBoolean = vote === 'for'

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

    // Verifica che la proposta esista ed è ancora attiva
    const { data: proposal, error: proposalError } = await supabase
      .from('action_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('game_id', game.id)
      .eq('status', 'pending')
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposta non trovata o non più attiva' }, { status: 404 })
    }

    // Verifica se la proposta è scaduta
    const now = new Date()
    const expiresAt = new Date(proposal.expires_at)
    if (now > expiresAt) {
      // Aggiorna lo status a scaduta
      await supabase
        .from('action_proposals')
        .update({ status: 'expired' })
        .eq('id', proposalId)

      return NextResponse.json({ error: 'Proposta scaduta' }, { status: 400 })
    }

    // Verifica se l'utente ha già votato
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('proposal_votes')
      .select('id')
      .eq('proposal_id', proposalId)
      .eq('username', username)
      .single()

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Errore nel verificare i voti precedenti' }, { status: 500 })
    }

    if (existingVote) {
      return NextResponse.json({ error: 'Hai già votato per questa proposta' }, { status: 400 })
    }

    // Registra il voto
    const { error: voteInsertError } = await supabase
      .from('proposal_votes')
      .insert({
        proposal_id: proposalId,
        username,
        vote: voteBoolean
      })

    if (voteInsertError) {
      console.error('Error inserting vote:', voteInsertError)
      return NextResponse.json({ error: 'Errore nel registrare il voto' }, { status: 500 })
    }

    // Aggiorna i contatori dei voti
    const voteIncrement = voteBoolean ? 1 : 0
    const againstIncrement = voteBoolean ? 0 : 1

    const { data: updatedProposal, error: updateError } = await supabase
      .from('action_proposals')
      .update({
        votes_for: proposal.votes_for + voteIncrement,
        votes_against: proposal.votes_against + againstIncrement
      })
      .eq('id', proposalId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating vote counts:', updateError)
      return NextResponse.json({ error: 'Errore nell\'aggiornamento dei voti' }, { status: 500 })
    }

    // Verifica se la proposta ha raggiunto la maggioranza
    const totalVotes = updatedProposal.votes_for + updatedProposal.votes_against
    const proposalApproved = updatedProposal.votes_for >= updatedProposal.required_votes
    const proposalRejected = updatedProposal.votes_against >= (Math.floor(updatedProposal.total_voters / 2) + 1)

    let status = 'pending'
    let shouldExecute = false

    if (proposalApproved) {
      status = 'approved'
      shouldExecute = true
    } else if (proposalRejected || totalVotes >= updatedProposal.total_voters) {
      status = 'rejected'
    }

    // Aggiorna lo status se necessario
    if (status !== 'pending') {
      await supabase
        .from('action_proposals')
        .update({ status })
        .eq('id', proposalId)
    }

    // Se la proposta è approvata, esegui l'azione
    let actionResult = null
    if (shouldExecute) {
      // Prima ottieni l'aura attuale del giocatore
      const { data: currentPlayer, error: fetchError } = await supabase
        .from('players')
        .select('aura_points')
        .eq('id', proposal.player_id)
        .single()

      if (fetchError) {
        console.error('Error fetching current player aura:', fetchError)
      } else {
        // Calcola la nuova aura
        const newAura = currentPlayer.aura_points + proposal.points

        // Aggiorna l'aura del giocatore
        const { data: player, error: playerUpdateError } = await supabase
          .from('players')
          .update({ aura_points: newAura })
          .eq('id', proposal.player_id)
          .select()
          .single()

        if (playerUpdateError) {
          console.error('Error updating player aura:', playerUpdateError)
        } else {
          // Registra l'azione nel log
          const { error: actionLogError } = await supabase
            .from('actions')
            .insert({
              game_id: proposal.game_id,
              player_id: proposal.player_id,
              action_type: proposal.points > 0 ? 'add' : 'subtract',
              points: Math.abs(proposal.points),
              description: `Proposta approvata: ${proposal.description}`,
              performed_by_username: proposal.proposed_by_username
            })

          if (actionLogError) {
            console.error('Error logging action:', actionLogError)
          }

          // Aggiorna lo status a eseguita
          await supabase
            .from('action_proposals')
            .update({ status: 'executed' })
            .eq('id', proposalId)

          actionResult = { executed: true, newAura: player?.aura_points }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      vote,
      proposal: {
        ...updatedProposal,
        status
      },
      actionResult,
      message: status === 'approved' ? 'Proposta approvata ed eseguita!' :
               status === 'rejected' ? 'Proposta respinta' :
               `Voto registrato (${updatedProposal.votes_for}/${updatedProposal.required_votes} voti favorevoli)`
    })

  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
