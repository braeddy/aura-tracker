import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Recupera i commenti di un'azione
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; actionId: string }> }
) {
  try {
    const { code, actionId } = await params
    const supabase = await createClient()

    // Verifica che la partita esista
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('code', code)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Partita non trovata' }, { status: 404 })
    }

    // Verifica che l'azione esista e appartenga alla partita
    const { data: action, error: actionError } = await supabase
      .from('actions')
      .select('id')
      .eq('id', actionId)
      .eq('game_id', game.id)
      .single()

    if (actionError || !action) {
      return NextResponse.json({ error: 'Azione non trovata' }, { status: 404 })
    }

    // Recupera i commenti dell'azione
    const { data: comments, error: commentsError } = await supabase
      .from('action_comments')
      .select('*')
      .eq('action_id', actionId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Errore recupero commenti:', commentsError)
      return NextResponse.json({ error: 'Errore nel recupero dei commenti' }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('Errore nel recupero commenti:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// POST - Aggiunge un nuovo commento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; actionId: string }> }
) {
  try {
    const { code, actionId } = await params
    const supabase = await createClient()
    
    const body = await request.json()
    const { comment, userId, username } = body

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: 'Commento richiesto' }, { status: 400 })
    }

    if (!userId || !username) {
      return NextResponse.json({ error: 'Informazioni utente richieste' }, { status: 400 })
    }

    // Verifica che la partita esista
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('code', code)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Partita non trovata' }, { status: 404 })
    }

    // Verifica che l'azione esista e appartenga alla partita
    const { data: action, error: actionError } = await supabase
      .from('actions')
      .select('id')
      .eq('id', actionId)
      .eq('game_id', game.id)
      .single()

    if (actionError || !action) {
      return NextResponse.json({ error: 'Azione non trovata' }, { status: 404 })
    }

    // Inserisce il nuovo commento
    const { data: newComment, error: insertError } = await supabase
      .from('action_comments')
      .insert({
        action_id: actionId,
        user_id: userId,
        username: username,
        comment: comment.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Errore inserimento commento:', insertError)
      return NextResponse.json({ error: 'Errore nell\'aggiunta del commento' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Commento aggiunto con successo',
      comment: newComment 
    })
  } catch (error) {
    console.error('Errore nell\'aggiunta commento:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
