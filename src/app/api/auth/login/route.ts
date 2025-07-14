import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { username, gameCode } = await request.json()
    
    if (!username || !gameCode) {
      return NextResponse.json(
        { error: 'Username e codice partita sono richiesti' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verifica se l'utente esiste
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .single()

    if (userError) {
      console.error('Login error - checking user:', userError)
      if (userError.code === 'PGRST116') {
        // Tabella users non esiste ancora
        return NextResponse.json(
          { error: 'Sistema di autenticazione non ancora configurato. Configura prima il database con lo schema di autenticazione.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Username non trovato. Registrati per creare un nuovo account.' },
        { status: 404 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Username non trovato. Registrati per creare un nuovo account.' },
        { status: 404 }
      )
    }

    // Aggiorna last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Verifica se la partita esiste
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('code', gameCode)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Partita non trovata' },
        { status: 404 }
      )
    }

    // Crea o aggiorna sessione di gioco
    await supabase
      .from('game_sessions')
      .upsert({
        game_id: game.id,
        user_id: user.id,
        last_active: new Date().toISOString()
      }, {
        onConflict: 'game_id,user_id'
      })

    return NextResponse.json({ 
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Errore del server durante il login' },
      { status: 500 }
    )
  }
}
