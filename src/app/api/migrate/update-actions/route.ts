import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Aggiorna tutte le azioni esistenti che non hanno performed_by_username
    const { data: actions, error: fetchError } = await supabase
      .from('actions')
      .select('id')
      .is('performed_by_username', null)

    if (fetchError) {
      console.error('Error fetching actions:', fetchError)
      return NextResponse.json(
        { error: 'Errore nel recupero delle azioni' },
        { status: 500 }
      )
    }

    if (!actions || actions.length === 0) {
      return NextResponse.json({ 
        message: 'Nessuna azione da aggiornare',
        updated: 0 
      })
    }

    // Aggiorna le azioni per impostare un valore di default
    const { error: updateError } = await supabase
      .from('actions')
      .update({ performed_by_username: 'Sistema (pre-tracking)' })
      .is('performed_by_username', null)

    if (updateError) {
      console.error('Error updating actions:', updateError)
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento delle azioni' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Azioni aggiornate con successo',
      updated: actions.length 
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
