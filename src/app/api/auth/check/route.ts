import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Controlla se le tabelle necessarie esistono
    const { error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })

    const { error: gameSessionsError } = await supabase
      .from('game_sessions')
      .select('count', { count: 'exact', head: true })

    const hasAuth = !usersError && !gameSessionsError

    return NextResponse.json({ 
      hasAuth,
      errors: {
        users: usersError?.message || null,
        gameSessions: gameSessionsError?.message || null
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { hasAuth: false, error: 'Errore controllo sistema di autenticazione' },
      { status: 500 }
    )
  }
}
