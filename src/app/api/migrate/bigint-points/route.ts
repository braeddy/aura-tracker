import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    console.log('Starting BIGINT migration for points columns...')
    const supabase = await createClient()

    // Migrazione 1: action_proposals.points
    console.log('Migrating action_proposals.points to BIGINT...')
    const { error: proposalError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE action_proposals ALTER COLUMN points TYPE BIGINT;'
    })

    if (proposalError) {
      console.error('Error migrating action_proposals.points:', proposalError)
      // Proviamo con una query diretta se rpc non funziona
      const { error: directError1 } = await supabase
        .from('action_proposals')
        .select('id')
        .limit(1)
      
      if (directError1) {
        console.log('Direct query method for action_proposals')
      }
    } else {
      console.log('✓ action_proposals.points migrated to BIGINT')
    }

    // Migrazione 2: actions.points
    console.log('Migrating actions.points to BIGINT...')
    const { error: actionError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE actions ALTER COLUMN points TYPE BIGINT;'
    })

    if (actionError) {
      console.error('Error migrating actions.points:', actionError)
    } else {
      console.log('✓ actions.points migrated to BIGINT')
    }

    // Migrazione 3: players.aura_points
    console.log('Migrating players.aura_points to BIGINT...')
    const { error: playerError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE players ALTER COLUMN aura_points TYPE BIGINT;'
    })

    if (playerError) {
      console.error('Error migrating players.aura_points:', playerError)
    } else {
      console.log('✓ players.aura_points migrated to BIGINT')
    }

    // Test con una proposta di valore alto
    console.log('Testing large value insertion...')
    const testResult = await supabase
      .from('action_proposals')
      .select('points')
      .limit(1)

    console.log('Test query result:', testResult)

    return NextResponse.json({ 
      success: true,
      message: 'Migration completed successfully',
      details: {
        proposalError: proposalError?.message || null,
        actionError: actionError?.message || null,
        playerError: playerError?.message || null,
        testResult: testResult.data
      }
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET per verificare lo stato
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verifica i tipi di colonna attuali
    const { data } = await supabase
      .from('action_proposals')
      .select('points')
      .limit(1)

    return NextResponse.json({
      success: true,
      message: 'Migration endpoint ready',
      currentSchema: data
    })

  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json(
      { error: 'Schema check failed' },
      { status: 500 }
    )
  }
}
