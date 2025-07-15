import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verifica se le tabelle del sistema di votazione esistono
    const { error: proposalsError } = await supabase
      .from('action_proposals')
      .select('id')
      .limit(1)

    const { error: votesError } = await supabase
      .from('proposal_votes')
      .select('id')
      .limit(1)

    const hasTables = !proposalsError && !votesError

    return NextResponse.json({
      success: true,
      votingSystemReady: hasTables,
      errors: {
        proposals: proposalsError?.message || null,
        votes: votesError?.message || null
      },
      message: hasTables 
        ? 'Sistema di votazione pronto!' 
        : 'Le tabelle del sistema di votazione non sono presenti nel database. Esegui schema-with-auth.sql.'
    })

  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json(
      { error: 'Errore nel controllo del database' },
      { status: 500 }
    )
  }
}
