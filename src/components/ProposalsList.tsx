import { useState, useEffect } from 'react'

interface ActionProposal {
  id: string
  description: string
  points: number
  proposed_by_username: string
  votes_for: number
  votes_against: number
  required_votes: number
  total_voters: number
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'expired'
  created_at: string
  expires_at: string
  players: {
    id: string
    name: string
  }
  votes?: Array<{
    username: string
    vote: 'for' | 'against'
    created_at: string
  }>
}

interface ProposalsListProps {
  gameCode: string
  username: string
  onProposalUpdate: () => void
}

export default function ProposalsList({
  gameCode,
  username,
  onProposalUpdate
}: ProposalsListProps) {
  const [proposals, setProposals] = useState<ActionProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [votingProposalId, setVotingProposalId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchProposals = async () => {
    try {
      const response = await fetch(`/api/games/${gameCode}/proposals`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel caricamento delle proposte')
      }

      setProposals(data.proposals || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (proposalId: string, vote: 'for' | 'against') => {
    setVotingProposalId(proposalId)
    setError('')

    try {
      const response = await fetch(`/api/games/${gameCode}/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vote,
          username
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel voto')
      }

      // Mostra messaggio di feedback
      if (data.message) {
        alert(data.message)
      }

      // Ricarica le proposte e notifica il parent component
      await fetchProposals()
      onProposalUpdate()

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setVotingProposalId(null)
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffMs = expires.getTime() - now.getTime()
    
    if (diffMs <= 0) return 'Scaduta'
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m rimanenti`
    }
    return `${minutes}m rimanenti`
  }

  const hasUserVoted = (proposal: ActionProposal) => {
    return proposal.votes?.some(vote => vote.username === username) || false
  }

  const getUserVote = (proposal: ActionProposal) => {
    return proposal.votes?.find(vote => vote.username === username)?.vote
  }

  useEffect(() => {
    fetchProposals()
    
    // Ricarica ogni 30 secondi per aggiornamenti in tempo reale
    const interval = setInterval(fetchProposals, 30000)
    return () => clearInterval(interval)
  }, [gameCode])

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">Caricamento proposte...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4 bg-red-50 rounded-lg">
        {error}
        <button 
          onClick={fetchProposals}
          className="block mx-auto mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Riprova
        </button>
      </div>
    )
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
        <div className="text-4xl mb-2">🗳️</div>
        <p>Nessuna proposta attiva al momento</p>
        <p className="text-sm">Crea una proposta per modificare l'aura di un giocatore!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Proposte Attive ({proposals.length})
        </h3>
        <button
          onClick={fetchProposals}
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          🔄 Aggiorna
        </button>
      </div>

      {proposals.map((proposal) => {
        const userVoted = hasUserVoted(proposal)
        const userVote = getUserVote(proposal)
        const isVoting = votingProposalId === proposal.id
        
        return (
          <div key={proposal.id} className="border rounded-lg p-4 bg-white shadow-sm">
            {/* Header della proposta */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-800">
                    {proposal.players.name}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    proposal.points > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {proposal.points > 0 ? '+' : ''}{proposal.points} aura
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  Proposto da: <strong>{proposal.proposed_by_username}</strong>
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                {formatTimeRemaining(proposal.expires_at)}
              </div>
            </div>

            {/* Descrizione */}
            <p className="text-gray-700 mb-3 p-2 bg-gray-50 rounded">
              "{proposal.description}"
            </p>

            {/* Contatori voti */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <span className="text-green-600">👍</span>
                  <span>{proposal.votes_for}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="text-red-600">👎</span>
                  <span>{proposal.votes_against}</span>
                </span>
                <span className="text-gray-500">
                  (serve: {proposal.required_votes}/{proposal.total_voters})
                </span>
              </div>
              
              {userVoted && (
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                  Hai votato: {userVote === 'for' ? '👍' : '👎'}
                </span>
              )}
            </div>

            {/* Barra di progresso */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (proposal.votes_for / proposal.required_votes) * 100)}%` 
                }}
              ></div>
            </div>

            {/* Pulsanti di voto */}
            {!userVoted && proposal.status === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleVote(proposal.id, 'for')}
                  disabled={isVoting}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <span>👍</span>
                  <span>{isVoting && votingProposalId === proposal.id ? 'Votando...' : 'Favorevole'}</span>
                </button>
                <button
                  onClick={() => handleVote(proposal.id, 'against')}
                  disabled={isVoting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <span>👎</span>
                  <span>{isVoting && votingProposalId === proposal.id ? 'Votando...' : 'Contrario'}</span>
                </button>
              </div>
            )}

            {userVoted && (
              <div className="text-center text-sm text-gray-600 bg-gray-100 py-2 rounded">
                Hai già votato per questa proposta
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
