import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { username, displayName, gameCode } = await request.json()
    
    if (!username || !gameCode) {
      return NextResponse.json(
        { error: 'Username e codice partita sono richiesti' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verifica se username è già preso
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username già in uso. Scegli un username diverso o accedi se è il tuo account.' },
        { status: 409 }
      )
    }

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

    // Crea nuovo utente
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        username: username.trim(),
        display_name: displayName?.trim() || username.trim()
      })
      .select()
      .single()

    if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.json(
        { error: 'Errore nella creazione dell\'account' },
        { status: 500 }
      )
    }

    // Crea sessione di gioco
    await supabase
      .from('game_sessions')
      .insert({
        game_id: game.id,
        user_id: user.id
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
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Errore del server durante la registrazione' },
      { status: 500 }
    )
  }
}
