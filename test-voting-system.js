// Test script per verificare il sistema di votazione
const BASE_URL = 'http://localhost:3000'

async function testVotingSystem() {
  console.log('🗳️ Test Sistema di Votazione AuraTracker')
  console.log('=====================================')
  
  try {
    // 1. Verifica sistema di votazione
    console.log('\n1. Verifica stato sistema...')
    const checkResponse = await fetch(`${BASE_URL}/api/migrate/check-voting-system`)
    const checkData = await checkResponse.json()
    console.log('✅', checkData.message)
    
    if (!checkData.votingSystemReady) {
      console.log('❌ Sistema di votazione non pronto!')
      return
    }
    
    // 2. Crea una partita di test
    console.log('\n2. Creazione partita di test...')
    const createGameResponse = await fetch(`${BASE_URL}/api/games/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Voting System' })
    })
    const gameData = await createGameResponse.json()
    console.log('✅ Partita creata:', gameData.code)
    
    const gameCode = gameData.code
    
    // Per ora, assumiamo che ci siano già giocatori nel gioco
    console.log('\n3. Verifica giocatori esistenti...')
    const gameResponse = await fetch(`${BASE_URL}/api/games/${gameCode}`)
    const gameInfo = await gameResponse.json()
    console.log(`✅ Giocatori nella partita: ${gameInfo.players.length}`)
    
    if (gameInfo.players.length === 0) {
      console.log('⚠️  Nessun giocatore trovato. Per testare completamente, aggiungi giocatori manualmente.')
      console.log(`🌐 Vai su: ${BASE_URL}/game/${gameCode}`)
      return
    }
    
    const testPlayerId = gameInfo.players[0].id
    
    // 4. Crea una proposta di test
    console.log('\n4. Creazione proposta di test...')
    const proposalResponse = await fetch(`${BASE_URL}/api/games/${gameCode}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: testPlayerId,
        description: 'Ha fatto una cosa fantastica! (Test automatico)',
        points: 1000,
        username: 'TestUser'
      })
    })
    
    if (!proposalResponse.ok) {
      const errorData = await proposalResponse.json()
      console.log('❌ Errore nella creazione della proposta:', errorData.error)
      return
    }
    
    const proposalData = await proposalResponse.json()
    console.log('✅ Proposta creata:', proposalData.message)
    
    const proposalId = proposalData.proposal.id
    
    // 5. Vota sulla proposta
    console.log('\n5. Test votazione...')
    const voteResponse = await fetch(`${BASE_URL}/api/games/${gameCode}/proposals/${proposalId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vote: 'for',
        username: 'VoterTest'
      })
    })
    
    if (!voteResponse.ok) {
      const errorData = await voteResponse.json()
      console.log('❌ Errore nel voto:', errorData.error)
      return
    }
    
    const voteData = await voteResponse.json()
    console.log('✅ Voto registrato:', voteData.message)
    
    // 6. Verifica stato proposte
    console.log('\n6. Verifica proposte attive...')
    const proposalsResponse = await fetch(`${BASE_URL}/api/games/${gameCode}/proposals`)
    const proposalsData = await proposalsResponse.json()
    console.log(`✅ Proposte attive: ${proposalsData.proposals.length}`)
    
    if (proposalsData.proposals.length > 0) {
      const proposal = proposalsData.proposals[0]
      console.log(`   - Stato: ${proposal.status}`)
      console.log(`   - Voti a favore: ${proposal.votes_for}/${proposal.required_votes}`)
    }
    
    console.log('\n🎉 Test completato con successo!')
    console.log(`🌐 Vai su: ${BASE_URL}/game/${gameCode}`)
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message)
  }
}

// Esegui il test
testVotingSystem()
