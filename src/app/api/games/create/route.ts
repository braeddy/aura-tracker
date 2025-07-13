import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome partita richiesto' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Genera un codice univoco
    let code = generateGameCode()
    let isUnique = false
    let attempts = 0
    
    while (!isUnique && attempts < 10) {
      const { data } = await supabase
        .from('games')
        .select('id')
        .eq('code', code)
        .single()
      
      if (!data) {
        isUnique = true
      } else {
        code = generateGameCode()
        attempts++
      }
    }
    
    if (!isUnique) {
      return NextResponse.json(
        { error: 'Impossibile generare un codice univoco' },
        { status: 500 }
      )
    }

    // Crea la partita
    const { data: game, error } = await supabase
      .from('games')
      .insert({
        name: name.trim(),
        code,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Errore creazione partita:', error)
      return NextResponse.json(
        { error: 'Errore nella creazione della partita' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      game,
      code: game.code,
      message: 'Partita creata con successo' 
    })

  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
