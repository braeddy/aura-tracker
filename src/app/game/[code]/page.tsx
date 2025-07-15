'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserPlus, UserX, ArrowLeft, Trash2, LogOut, User } from 'lucide-react'
import LoginModal from '@/components/LoginModal'
import ProposalModal from '@/components/ProposalModal'

interface Player {
  id: string
  name: string
  aura_points: number
  avatar?: string
  created_at: string
  user_id?: string
}

interface Action {
  id: string
  player_id: string
  points: number
  description: string
  created_at: string
  performed_by_user_id?: string
  performed_by_username?: string
}

interface Comment {
  id: string
  action_id: string
  user_id: string
  username: string
  comment: string
  created_at: string
}

interface Game {
  id: string
  code: string
  name: string
  created_at: string
}

interface Proposal {
  id: string
  game_id: string
  player_id: string
  proposed_by_user_id?: string
  proposed_by_username: string
  description: string
  points: number
  status: 'pending' | 'approved' | 'rejected' | 'executed'
  votes_for: number
  votes_against: number
  total_voters: number
  required_votes: number
  expires_at: string
  created_at: string
  executed_at?: string
  resulting_action_id?: string
  players?: {
    id: string
    name: string
  }
}

interface GameData {
  game: Game
  players: Player[]
  actions: Action[]
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('home')
  const [joiningGame, setJoiningGame] = useState(false)

  // Stati per le impostazioni della partita
  const [editingGameName, setEditingGameName] = useState(false)
  const [editingGameCode, setEditingGameCode] = useState(false)
  const [newGameName, setNewGameName] = useState('')
  const [newGameCode, setNewGameCode] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  // Stati per il sistema di login
  const [currentUser, setCurrentUser] = useState<{
    id: string
    username: string
    displayName: string
    isGuest: boolean
  } | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [authSystemReady, setAuthSystemReady] = useState<boolean | null>(null)

  // Stato per le notifiche integrate
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'reset' | 'delete' | 'deletePlayer' | 'deleteAction' | 'logout' | null
    message: string
    onConfirm: () => void
  }>({
    show: false,
    type: null,
    message: '',
    onConfirm: () => {}
  })

  // Stato per il modal del giocatore
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  // Stati per il modal delle azioni
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)
  const [actionComments, setActionComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  // Stati per il sistema di proposte
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [showProposalModal, setShowProposalModal] = useState(false)

  // Funzione per formattare i numeri in K, M, B
  const formatAuraValue = (value: number): string => {
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    
    if (absValue >= 1000000000) {
      return `${sign}${(absValue / 1000000000).toFixed(1)}B`
    } else if (absValue >= 1000000) {
      return `${sign}${(absValue / 1000000).toFixed(1)}M`
    } else if (absValue >= 1000) {
      return `${sign}${(absValue / 1000).toFixed(1)}K`
    } else {
      return value.toString()
    }
  }

  // Funzione per calcolare statistiche giocatore
  const getPlayerStats = (player: Player) => {
    const playerActions = actions.filter(action => action.player_id === player.id)
    const positiveActions = playerActions.filter(action => action.points > 0)
    const negativeActions = playerActions.filter(action => action.points < 0)
    
    const totalPositive = positiveActions.reduce((sum, action) => sum + action.points, 0)
    const totalNegative = negativeActions.reduce((sum, action) => sum + action.points, 0)
    const totalActions = playerActions.length
    const netAura = totalPositive + totalNegative
    
    // Calcolo giorni attivi
    const actionDates = playerActions.map(action => new Date(action.created_at).toDateString())
    const uniqueDays = new Set(actionDates).size
    
    // Media al giorno
    const averagePerDay = uniqueDays > 0 ? Math.round(netAura / uniqueDays) : 0

    return {
      totalActions,
      positiveActions: positiveActions.length,
      negativeActions: negativeActions.length,
      totalPositive,
      totalNegative,
      netAura,
      uniqueDays,
      averagePerDay
    }
  }

  const fetchGameData = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${code}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Partita non trovata')
        } else {
          setError('Errore nel caricamento della partita')
        }
        return
      }
      
      const data = await response.json()
      setGameData(data)
      
      // Log per debug - controlla se le azioni hanno le info dell'utente
      console.log('Frontend received actions:', data.actions?.map((a: Action) => ({
        id: a.id,
        description: a.description,
        performed_by_username: a.performed_by_username,
        performed_by_user_id: a.performed_by_user_id
      })))
    } catch (error) {
      console.error('Errore nel fetch dei dati:', error)
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    if (code) {
      fetchGameData()
    }
  }, [code, fetchGameData])

  // Controlla se il sistema di autenticazione è configurato
  useEffect(() => {
    const checkAuthSystem = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        setAuthSystemReady(data.hasAuth)
        
        if (!data.hasAuth) {
          console.warn('Sistema di autenticazione non configurato:', data.errors)
        }
      } catch (error) {
        console.error('Errore controllo sistema auth:', error)
        setAuthSystemReady(false)
      }
    }
    
    checkAuthSystem()
  }, [])

  // Controllo se l'utente è loggato
  useEffect(() => {
    if (authSystemReady === null) return // Aspetta il controllo del sistema
    
    const userSession = localStorage.getItem('aura_user_session')
    if (userSession) {
      try {
        const userData = JSON.parse(userSession)
        const user = {
          id: userData.id || userData.username,
          username: userData.username,
          displayName: userData.displayName,
          isGuest: userData.isGuest || userData.username?.startsWith('Guest_') || false
        }
        setCurrentUser(user)
      } catch (error) {
        console.error('Errore nel parsing della sessione utente:', error)
        localStorage.removeItem('aura_user_session')
        setShowLoginModal(true)
      }
    } else {
      setShowLoginModal(true)
    }
  }, [authSystemReady])

  // Funzione per gestire il login
  const handleLogin = (userData: { username: string; displayName: string; isNewUser: boolean; id?: string }) => {
    const isGuest = userData.username.startsWith('Guest_')
    const user = {
      id: userData.id || userData.username, // Usa l'ID vero se disponibile, altrimenti username
      username: userData.username,
      displayName: userData.displayName,
      isGuest
    }
    setCurrentUser(user)
    localStorage.setItem('aura_user_session', JSON.stringify(user))
    setShowLoginModal(false)
  }

  // Funzione per il logout
  const handleLogout = () => {
    setNotification({
      show: true,
      type: 'logout',
      message: 'Sei sicuro di voler uscire dal tuo account? Dovrai effettuare nuovamente il login per accedere alla partita.',
      onConfirm: async () => {
        try {
          // Chiama API per invalidare sessione server-side
          if (currentUser && !currentUser.id.startsWith('Guest_')) {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                gameCode: code,
                userId: currentUser.id 
              })
            })
          }
        } catch (error) {
          console.error('Errore durante logout:', error)
        } finally {
          // Pulisci stato locale indipendentemente dal risultato API
          setCurrentUser(null)
          localStorage.removeItem('aura_user_session')
          setShowLoginModal(true)
          setNotification({ show: false, type: null, message: '', onConfirm: () => {} })
        }
      }
    })
  }

  const joinGame = async () => {
    if (!currentUser || currentUser.isGuest) return

    console.log('Trying to join game with user:', currentUser)
    setJoiningGame(true)
    try {
      const response = await fetch(`/api/games/${code}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      })

      const data = await response.json()
      console.log('Join game response:', { response: response.status, data })
      
      if (response.ok) {
        fetchGameData()
      } else {
        console.error('Join game error:', data.error)
        alert(data.error || 'Errore durante l\'iscrizione al gioco')
      }
    } catch (error) {
      console.error('Errore nell\'iscrizione al gioco:', error)
      alert('Errore di connessione')
    } finally {
      setJoiningGame(false)
    }
  }

  // Funzione per eliminare un giocatore
  const deletePlayer = async (playerId: string, playerName: string) => {
    setNotification({
      show: true,
      type: 'deletePlayer',
      message: `Sei sicuro di voler eliminare definitivamente il giocatore "${playerName}"? Tutti i suoi dati e le sue azioni verranno persi per sempre.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/games/${code}/players/${playerId}`, {
            method: 'DELETE',
          })
          
          if (response.ok) {
            setNotification({ show: false, type: null, message: '', onConfirm: () => {} })
            setSelectedPlayer(null) // Chiude il modal se aperto
            await fetchGameData() // Ricarica i dati
          } else {
            alert('Errore durante l\'eliminazione del giocatore')
          }
        } catch (error) {
          console.error('Errore nell\'eliminazione:', error)
          alert('Errore di connessione durante l\'eliminazione')
        }
      }
    })
  }

  // Funzione per eliminare un'azione
  const deleteAction = async (actionId: string, actionDescription: string) => {
    setNotification({
      show: true,
      type: 'deleteAction',
      message: `Sei sicuro di voler eliminare l'azione "${actionDescription}"? I punti verranno sottratti dal giocatore.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/games/${code}/actions/${actionId}`, {
            method: 'DELETE',
          })
          
          if (response.ok) {
            setNotification({ show: false, type: null, message: '', onConfirm: () => {} })
            await fetchGameData() // Ricarica i dati
          } else {
            alert('Errore durante l\'eliminazione dell\'azione')
          }
        } catch (error) {
          console.error('Errore nell\'eliminazione dell\'azione:', error)
          alert('Errore di connessione durante l\'eliminazione')
        }
      }
    })
  }

  // Funzioni per gestire i commenti delle azioni
  const fetchActionComments = async (actionId: string) => {
    setLoadingComments(true)
    try {
      const response = await fetch(`/api/games/${code}/actions/${actionId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setActionComments(data.comments || [])
      } else {
        console.error('Errore nel caricamento commenti')
      }
    } catch (error) {
      console.error('Errore nel fetch commenti:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const addComment = async (actionId: string, comment: string) => {
    if (!comment.trim() || !currentUser) return

    try {
      const response = await fetch(`/api/games/${code}/actions/${actionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: comment.trim(),
          userId: currentUser.id,
          username: currentUser.displayName
        })
      })

      if (response.ok) {
        setNewComment('')
        await fetchActionComments(actionId) // Ricarica i commenti
      } else {
        alert('Errore nell\'aggiunta del commento')
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta commento:', error)
      alert('Errore di connessione')
    }
  }

  const openActionModal = (action: Action) => {
    setSelectedAction(action)
    fetchActionComments(action.id)
  }

  // Funzioni per il sistema di proposte
  const voteProposal = async (proposalId: string, voteType: 'approve' | 'reject') => {
    if (!currentUser) return
    
    if (currentUser.isGuest) {
      alert('Gli ospiti non possono votare. Registrati per partecipare attivamente al gioco.')
      return
    }

    try {
      const response = await fetch(`/api/games/${code}/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vote: voteType === 'approve' ? 'for' : 'against',
          username: currentUser.displayName
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Ricarica le proposte
        fetchProposals()
        
        // Se la proposta è stata eseguita, ricarica anche i dati del gioco
        if (data.actionResult?.executed) {
          fetchGameData()
        }
      } else {
        alert(data.error || 'Errore nel voto')
      }
    } catch (error) {
      console.error('Errore nel voto:', error)
      alert('Errore di connessione')
    }
  }

  const fetchProposals = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${code}/proposals`)
      const data = await response.json()
      
      if (response.ok) {
        setProposals(data.proposals || [])
      } else {
        console.error('Errore nel caricamento proposte:', data.error)
      }
    } catch (error) {
      console.error('Errore nel fetch proposte:', error)
    }
  }, [code])

  // Funzioni per la gestione delle impostazioni della partita
  const resetGame = async () => {
    setNotification({
      show: true,
      type: 'reset',
      message: 'Sei sicuro di voler resettare la partita? Tutte le azioni e i punti verranno azzerati ma i giocatori rimarranno.',
      onConfirm: async () => {
        setSavingSettings(true)
        try {
          const response = await fetch(`/api/games/${code}/reset`, {
            method: 'POST',
          })
          
          if (response.ok) {
            setNotification({ show: false, type: null, message: '', onConfirm: () => {} })
            await fetchGameData() // Ricarica i dati
          } else {
            alert('Errore durante il reset della partita')
          }
        } catch (error) {
          console.error('Errore nel reset:', error)
          alert('Errore di connessione durante il reset')
        } finally {
          setSavingSettings(false)
        }
      }
    })
  }

  const deleteGame = async () => {
    setNotification({
      show: true,
      type: 'delete',
      message: 'Sei sicuro di voler eliminare definitivamente questa partita? Tutti i dati verranno persi per sempre.',
      onConfirm: async () => {
        setSavingSettings(true)
        try {
          const response = await fetch(`/api/games/${code}`, {
            method: 'DELETE',
          })
          
          if (response.ok) {
            router.push('/')
          } else {
            alert('Errore durante l\'eliminazione della partita')
          }
        } catch (error) {
          console.error('Errore nell\'eliminazione:', error)
          alert('Errore di connessione durante l\'eliminazione')
        } finally {
          setSavingSettings(false)
        }
      }
    })
  }

  const updateGameName = async () => {
    if (!newGameName.trim()) return
    
    setSavingSettings(true)
    try {
      const response = await fetch(`/api/games/${code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newGameName.trim() }),
      })
      
      if (response.ok) {
        await fetchGameData() // Ricarica i dati
        setEditingGameName(false)
        setNewGameName('')
      } else {
        alert('Errore durante l\'aggiornamento del nome della partita')
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error)
      alert('Errore di connessione durante l\'aggiornamento')
    } finally {
      setSavingSettings(false)
    }
  }

  const updateGameCode = async () => {
    if (!newGameCode.trim()) return
    
    setSavingSettings(true)
    try {
      const response = await fetch(`/api/games/${code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: newGameCode.trim() }),
      })
      
      if (response.ok) {
        // Reindirizza alla nuova URL con il nuovo codice
        router.push(`/game/${newGameCode.trim()}`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Errore durante l\'aggiornamento del codice della partita')
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error)
      alert('Errore di connessione durante l\'aggiornamento')
    } finally {
      setSavingSettings(false)
    }
  }

  useEffect(() => {
    if (code) {
      fetchProposals()
    }
  }, [code, fetchProposals])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Caricamento partita...</div>
        </div>
      </div>
    )
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    )
  }

  const { game, players, actions } = gameData

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        gameCode={code}
      />

      {/* Proposal Modal */}
      <ProposalModal
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        players={players}
        gameCode={code}
        username={currentUser?.displayName || ''}
        onProposalCreated={() => {
          setShowProposalModal(false)
          fetchProposals()
        }}
      />

      {/* Notifica Integrata - Fuori dal container principale */}
      {notification.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all border border-white/20">
            <div className="text-center mb-6">
              <div className="text-8xl mb-4">
                {(notification.type === 'delete' || notification.type === 'deletePlayer' || notification.type === 'deleteAction') ? '🗑️' : 
                 notification.type === 'logout' ? '�' : '�🔄'}
              </div>
              <h3 className={`text-3xl font-bold mb-4 ${
                (notification.type === 'delete' || notification.type === 'deletePlayer' || notification.type === 'deleteAction') ? 'text-red-400' : 
                notification.type === 'logout' ? 'text-blue-400' : 'text-orange-400'
              }`}>
                {notification.type === 'delete' ? 'Elimina Partita' : 
                 notification.type === 'deletePlayer' ? 'Elimina Giocatore' :
                 notification.type === 'deleteAction' ? 'Elimina Azione' :
                 notification.type === 'logout' ? 'Logout Account' : 'Reset Partita'}
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                {notification.message}
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setNotification({ show: false, type: null, message: '', onConfirm: () => {} })}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 backdrop-blur"
              >
                Annulla
              </button>
              <button
                onClick={notification.onConfirm}
                className={`flex-1 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                  (notification.type === 'delete' || notification.type === 'deletePlayer' || notification.type === 'deleteAction')
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700' 
                    : notification.type === 'logout'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                }`}
              >
                {notification.type === 'delete' ? '🗑️ Elimina Partita' : 
                 notification.type === 'deletePlayer' ? '🗑️ Elimina Giocatore' :
                 notification.type === 'deleteAction' ? '🗑️ Elimina Azione' :
                 notification.type === 'logout' ? '👋 Logout' : '🔄 Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dettagli Giocatore */}
      {selectedPlayer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20 flex flex-col">
            {(() => {
              const stats = getPlayerStats(selectedPlayer)
              const playerRank = players.sort((a, b) => b.aura_points - a.aura_points).findIndex(p => p.id === selectedPlayer.id) + 1
              return (
                <>
                  {/* Header Fisso */}
                  <div className="flex-shrink-0 bg-white/10 backdrop-blur border-b border-white/20 p-6 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{playerRank === 1 ? '👑' : playerRank === 2 ? '🥈' : playerRank === 3 ? '🥉' : '⭐'}</div>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-14 h-14 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                          {selectedPlayer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white">{selectedPlayer.name}</h2>
                          <p className="text-gray-300">#{playerRank} • 🎮 Giocatore dal {new Date(selectedPlayer.created_at).toLocaleDateString('it-IT')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePlayer(selectedPlayer.id, selectedPlayer.name)
                          }}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg"
                          title="Elimina giocatore"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPlayer(null)
                          }}
                          className="text-gray-400 hover:text-white transition-colors text-3xl transform hover:scale-110 duration-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contenuto Scrollabile */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Aura Points Display */}
                    <div className="text-center">
                      <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 mb-4">
                        {formatAuraValue(selectedPlayer.aura_points)}
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">✨ Aura Points ✨</div>
                      <div className="text-lg text-gray-300">
                        Valore esatto: {selectedPlayer.aura_points.toLocaleString()}
                      </div>
                    </div>

                    {/* Statistiche */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                      <h3 className="text-2xl font-bold text-white mb-8 text-center">
                        ✨ Statistiche
                      </h3>
                      
                      {/* Griglia Statistiche - Layout glassmorphism */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Azioni Totali */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="text-4xl mb-3">📊</div>
                          <div className="text-3xl font-bold text-blue-400 mb-1">{stats.totalActions}</div>
                          <div className="text-sm text-gray-300 font-medium">Azioni Totali</div>
                        </div>

                        {/* Azioni Positive */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="text-4xl mb-3">📈</div>
                          <div className="text-3xl font-bold text-green-400 mb-1">{stats.positiveActions}</div>
                          <div className="text-sm text-gray-300 font-medium">Azioni Positive</div>
                        </div>

                        {/* Azioni Negative */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="text-4xl mb-3">📉</div>
                          <div className="text-3xl font-bold text-red-400 mb-1">{stats.negativeActions}</div>
                          <div className="text-sm text-gray-300 font-medium">Azioni Negative</div>
                        </div>

                        {/* Aura Guadagnata */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="text-4xl mb-3">✨</div>
                          <div className="text-3xl font-bold text-yellow-400 mb-1">+{formatAuraValue(stats.totalPositive)}</div>
                          <div className="text-sm text-gray-300 font-medium">Aura Guadagnata</div>
                        </div>

                        {/* Aura Persa */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="text-4xl mb-3">💔</div>
                          <div className="text-3xl font-bold text-pink-400 mb-1">{formatAuraValue(stats.totalNegative)}</div>
                          <div className="text-sm text-gray-300 font-medium">Aura Persa</div>
                        </div>

                        {/* Aura Netta */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="text-4xl mb-3">⚡</div>
                          <div className={`text-3xl font-bold mb-1 ${stats.netAura >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.netAura >= 0 ? '+' : ''}{formatAuraValue(stats.netAura)}
                          </div>
                          <div className="text-sm text-gray-300 font-medium">Aura Netta</div>
                        </div>

                        {/* Media/Giorno */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="text-4xl mb-3">📅</div>
                          <div className={`text-3xl font-bold mb-1 ${stats.averagePerDay >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.averagePerDay >= 0 ? '+' : ''}{formatAuraValue(stats.averagePerDay)}
                          </div>
                          <div className="text-sm text-gray-300 font-medium">Media/Giorno</div>
                        </div>

                        {/* Giorni Attivo */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="text-4xl mb-3">🎯</div>
                          <div className="text-3xl font-bold text-teal-400 mb-1">{stats.uniqueDays}</div>
                          <div className="text-sm text-gray-300 font-medium">Giorni Attivo</div>
                        </div>
                      </div>
                    </div>

                    {/* Storico Azioni */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                      <h3 className="text-2xl font-bold text-white mb-6 text-center">
                        📋 Storico Azioni
                      </h3>
                      <div className="max-h-60 overflow-y-auto space-y-3">
                        {actions
                          .filter(action => action.player_id === selectedPlayer.id)
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((action) => (
                            <div 
                              key={action.id} 
                              className="flex items-center justify-between p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                              onClick={() => openActionModal(action)}
                              title="Clicca per vedere dettagli e commenti"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                                  action.points > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                                }`}>
                                  {action.points > 0 ? '📈' : '📉'}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{action.description}</div>
                                  {action.performed_by_username && (
                                    <div className="text-xs text-blue-300 flex items-center gap-1 mt-1">
                                      👤 Aggiunto da {action.performed_by_username}
                                    </div>
                                  )}
                                  {!action.performed_by_username && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                      🤖 Azione automatica
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400">
                                    {new Date(action.created_at).toLocaleString('it-IT')}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`font-bold text-lg px-3 py-1 rounded-xl ${
                                  action.points > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                }`}>
                                  {action.points > 0 ? '+' : ''}{formatAuraValue(action.points)}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteAction(action.id, action.description)
                                  }}
                                  className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                                  title="Elimina azione"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {actions.filter(action => action.player_id === selectedPlayer.id).length === 0 && (
                          <div className="text-center py-12">
                            <p className="text-gray-400">🎮 Nessuna azione registrata</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sistema Democratico */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/20">
                      <div className="text-center">
                        <div className="text-4xl mb-4">🗳️</div>
                        <h3 className="text-2xl font-bold text-white mb-4">
                          Sistema di Voto Democratico
                        </h3>
                        <p className="text-gray-300 text-lg mb-6">
                          Le modifiche all&apos;aura richiedono ora l&apos;approvazione della community attraverso il sistema di votazione democratico.
                        </p>
                        <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 p-6 rounded-2xl">
                          <div className="text-lg font-bold mb-2">💡 Come funziona:</div>
                          <div className="text-sm text-blue-200 space-y-2">
                            <p>• Proponi una modifica attraverso il pulsante &quot;Proponi Modifica Aura&quot;</p>
                            <p>• La community voterà sulla tua proposta</p>
                            <p>• Se approvata, l&apos;azione viene eseguita automaticamente</p>
                            <p>• Tutte le azioni vengono tracciate con il tuo nome</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal Dettagli Azione */}
      {selectedAction && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20 flex flex-col">
            {/* Header Fisso */}
            <div className="flex-shrink-0 bg-white/10 backdrop-blur border-b border-white/20 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl ${
                    selectedAction.points > 0 
                      ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30' 
                      : 'bg-gradient-to-r from-red-500/30 to-pink-500/30'
                  } border border-white/30`}>
                    {selectedAction.points > 0 ? '📈' : '📉'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {players.find(p => p.id === selectedAction.player_id)?.name}
                    </h2>
                    <div className="text-sm text-gray-300">
                      {formatAuraValue(selectedAction.points)} punti aura
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="text-gray-400 hover:text-white transition-colors text-3xl transform hover:scale-110 duration-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenuto Scrollabile */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Dettagli Azione */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">📋 Dettagli Azione</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-300 text-sm">Descrizione:</span>
                    <div className="text-white font-medium">{selectedAction.description}</div>
                  </div>
                  <div>
                    <span className="text-gray-300 text-sm">Punti aura:</span>
                    <div className={`font-bold text-lg ${selectedAction.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedAction.points > 0 ? '+' : ''}{formatAuraValue(selectedAction.points)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-300 text-sm">Data:</span>
                    <div className="text-white">{new Date(selectedAction.created_at).toLocaleString('it-IT')}</div>
                  </div>
                  {selectedAction.performed_by_username && (
                    <div>
                      <span className="text-gray-300 text-sm">Aggiunto da:</span>
                      <div className="text-blue-300 font-medium">{selectedAction.performed_by_username}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sezione Commenti */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  💬 Commenti
                  <span className="text-sm text-gray-400">({actionComments.length})</span>
                </h3>

                {/* Lista Commenti */}
                <div className="space-y-4 max-h-60 overflow-y-auto mb-6">
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <div className="text-gray-400">Caricamento commenti...</div>
                    </div>
                  ) : actionComments.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">💬</div>
                      <div className="text-gray-400">Nessun commento ancora</div>
                      <div className="text-sm text-gray-500">Sii il primo a commentare!</div>
                    </div>
                  ) : (
                    actionComments.map((comment) => (
                      <div key={comment.id} className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm text-white">
                            {comment.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{comment.username}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString('it-IT')} alle {new Date(comment.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-gray-200">{comment.comment}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Aggiungi Commento */}
                {currentUser && !currentUser.isGuest ? (
                  <div className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Scrivi un commento..."
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => addComment(selectedAction.id, newComment)}
                      disabled={!newComment.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg"
                    >
                      💬 Aggiungi Commento
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-500/20 backdrop-blur rounded-2xl p-4 border border-amber-500/30 text-center">
                    <div className="text-amber-300 font-medium mb-1">
                      👻 Accedi per commentare
                    </div>
                    <div className="text-amber-200 text-sm">
                      Solo gli utenti registrati possono aggiungere commenti
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden ${notification.show || selectedPlayer || selectedAction ? 'blur-sm' : ''}`}>
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 bg-white/10 backdrop-blur-lg border-b border-white/20">
          {/* Exit Button - Top Left */}
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 rounded-lg sm:rounded-xl text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
              title="Torna alla home"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Esci</span>
            </button>
          </div>

          {/* User Info - Top Right */}
          {currentUser && (
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
              <div className="flex items-center gap-2">
                <div 
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg sm:rounded-xl text-white shadow-lg transition-all duration-300 ${
                    players.some(p => p.user_id === currentUser.id || p.name === currentUser.displayName) 
                      ? 'cursor-pointer hover:bg-white/30 hover:scale-105' 
                      : 'cursor-default'
                  }`}
                  onClick={() => {
                    const userPlayer = players.find(p => p.user_id === currentUser.id || p.name === currentUser.displayName);
                    if (userPlayer) {
                      setSelectedPlayer(userPlayer);
                    }
                  }}
                  title={players.some(p => p.user_id === currentUser.id || p.name === currentUser.displayName) ? "Clicca per vedere i tuoi dettagli" : ""}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    {currentUser.displayName}
                  </span>
                  {players.some(p => p.user_id === currentUser.id || p.name === currentUser.displayName) && (
                    <div className="text-xs text-blue-300 hidden sm:block">
                      🔍
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 sm:p-2 bg-white/20 hover:bg-red-500/30 backdrop-blur border border-white/30 rounded-lg sm:rounded-xl text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
                  title="Logout dal tuo account"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 text-center">
            <div className="flex justify-center mb-2 sm:mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg text-3xl">
                ✨
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 mb-2 sm:mb-3">
              AuraTracker
            </h1>
            <p className="text-base sm:text-lg text-gray-300 mb-1 sm:mb-2">✨ Traccia l&apos;aura dei tuoi amici ✨</p>
            <div className="text-xs sm:text-sm text-gray-400">
              Partita: <span className="font-medium text-white">{game.name}</span> • 
              Codice: <span className="font-mono font-semibold text-yellow-400">{game.code}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="max-w-7xl mx-auto px-2 sm:px-4">
            <div className="flex justify-center items-center space-x-2 sm:space-x-6 pb-4 sm:pb-6 overflow-x-auto py-2">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur whitespace-nowrap ${
                  activeTab === 'home' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-xl border border-white/20' 
                    : 'bg-white/20 text-gray-300 hover:bg-white/30 hover:text-white border border-white/20'
                }`}
              >
                🏠 <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => setActiveTab('players')}
                className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur whitespace-nowrap ${
                  activeTab === 'players' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl border border-white/20' 
                    : 'bg-white/20 text-gray-300 hover:bg-white/30 hover:text-white border border-white/20'
                }`}
              >
                🏆 <span className="hidden sm:inline">Classifica</span>
                <span className="sm:hidden">{players.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur whitespace-nowrap ${
                  activeTab === 'actions' 
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-xl border border-white/20' 
                    : 'bg-white/20 text-gray-300 hover:bg-white/30 hover:text-white border border-white/20'
                }`}
              >
                📚 <span className="hidden sm:inline">Storico Azioni</span>
                <span className="sm:hidden">{actions.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur whitespace-nowrap ${
                  activeTab === 'settings' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl border border-white/20' 
                    : 'bg-white/20 text-gray-300 hover:bg-white/30 hover:text-white border border-white/20'
                }`}
              >
                ⚙️ <span className="hidden sm:inline">Impostazioni</span>
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {activeTab === 'home' && (
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Left Side - Join Game and Players */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-8">
                {/* Warning per sistema di autenticazione non configurato */}
                {authSystemReady === false && (
                  <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-red-500/20 shadow-2xl p-4 sm:p-8 mb-4 sm:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                        <UserX className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white">
                        Sistema di Autenticazione Non Configurato
                      </h2>
                    </div>
                    <div className="space-y-3 sm:space-y-4 text-center">
                      <div className="text-red-300 text-sm sm:text-base">
                        ⚠️ Il database non è ancora configurato per il sistema di login avanzato.
                      </div>
                      <div className="text-gray-300 text-xs sm:text-sm">
                        Esegui lo script SQL dalla cartella database/schema-with-auth.sql su Supabase per abilitare il sistema di registrazione e login.
                      </div>
                    </div>
                  </div>
                )}

                {/* Join Game Section - Solo per utenti registrati */}
                {currentUser && !currentUser.isGuest && !players.some(p => 
                  p.user_id === currentUser.id || p.name === currentUser.displayName
                ) && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-8 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="bg-gradient-to-r from-green-500 to-teal-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                        <UserPlus className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white">
                        Unisciti alla Partita
                      </h2>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="text-center text-gray-300 text-sm sm:text-base">
                        Ciao <span className="font-bold text-white">{currentUser.displayName}</span>!<br />
                        Vuoi unirti a questa partita come giocatore?
                      </div>
                      <button
                        onClick={joinGame}
                        disabled={joiningGame}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg text-base sm:text-lg"
                      >
                        {joiningGame ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white inline-block mr-2"></div>
                            Unendoti alla partita...
                          </>
                        ) : (
                          <>
                            ⭐ Unisciti al Gioco
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Messaggio per gli ospiti */}
                {currentUser && currentUser.isGuest && (
                  <div className="bg-amber-500/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-amber-500/20 shadow-2xl p-4 sm:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                        <User className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white">
                        Modalità Ospite
                      </h2>
                    </div>
                    <div className="space-y-3 sm:space-y-4 text-center">
                      <div className="text-amber-300 text-sm sm:text-base">
                        👻 Stai visualizzando come ospite. Puoi vedere tutti i dati della partita ma non puoi effettuare azioni.
                      </div>
                      <div className="text-gray-300 text-xs sm:text-sm">
                        Per partecipare attivamente, registrati o accedi con il tuo account.
                      </div>
                    </div>
                  </div>
                )}

                {/* Pulsante Proposta Unico */}
                {players.length > 0 && currentUser && !currentUser.isGuest && (
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-blue-500/20 shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                        🗳️ Sistema di Voto Democratico
                      </div>
                      <button
                        onClick={() => setShowProposalModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 sm:py-5 px-8 sm:px-12 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-base sm:text-lg flex items-center justify-center gap-3 mx-auto"
                      >
                        <span className="text-xl sm:text-2xl">🗳️</span>
                        Proponi Modifica Aura
                      </button>
                      <div className="text-center text-xs sm:text-sm text-gray-400 mt-3">
                        💡 Le modifiche all&apos;aura richiedono approvazione democratica dalla community
                      </div>
                    </div>
                  </div>
                )}

                {/* Players Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {players.sort((a, b) => b.aura_points - a.aura_points).map((player, index) => (
                    <div 
                      key={player.id} 
                      className={`bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl p-4 sm:p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                        currentUser && !currentUser.isGuest ? 'cursor-pointer hover:bg-white/20' : 'cursor-default'
                      }`}
                      onClick={() => {
                        if (currentUser && !currentUser.isGuest) {
                          setSelectedPlayer(player)
                        }
                      }}
                    >
                      {/* Player Header */}
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="text-2xl sm:text-3xl">{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}</div>
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-lg sm:text-xl text-white shadow-lg">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-lg sm:text-xl text-white">{player.name}</div>
                            <div className="text-xs sm:text-sm text-gray-300">#{index + 1} • 🔍 Dettagli</div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePlayer(player.id, player.name)
                          }}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white p-2 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg opacity-70 hover:opacity-100"
                          title="Elimina giocatore"
                        >
                          <UserX className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      {/* Aura Points Display */}
                      <div className="text-center mb-6 sm:mb-8">
                        <div className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 mb-2 sm:mb-3">
                          {formatAuraValue(player.aura_points)}
                        </div>
                        <div className="text-base sm:text-lg font-semibold text-gray-200 mb-1">✨ Aura Points ✨</div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          Valore esatto: {player.aura_points.toLocaleString()}
                        </div>
                      </div>

                      {/* Aura Controls */}
                      {currentUser && currentUser.isGuest ? (
                        /* Messaggio per ospiti */
                        <div className="bg-amber-500/20 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-amber-500/30 text-center">
                          <div className="text-amber-300 text-sm sm:text-base font-medium mb-2">
                            👻 Modalità Ospite
                          </div>
                          <div className="text-amber-200 text-xs sm:text-sm">
                            Registrati per effettuare azioni sui giocatori
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {players.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-8xl mb-6">⭐</div>
                    <p className="text-2xl font-bold text-white mb-2">Nessun giocatore ancora aggiunto</p>
                    {currentUser && currentUser.isGuest ? (
                      <p className="text-lg text-gray-300">👻 Gli ospiti possono solo visualizzare. Registrati per unirti alla partita!</p>
                    ) : (
                      <p className="text-lg text-gray-300">✨ Registrati e unisciti alla partita per iniziare! ✨</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side - Proposals and Action History */}
              <div className="lg:col-span-1 mt-8 lg:mt-0 space-y-6">
                {/* Proposte in Corso */}
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-purple-500/20 shadow-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="text-2xl">🗳️</div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Proposte in Corso
                    </h2>
                  </div>
                  
                  {proposals.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-3">🗳️</div>
                      <p className="text-base font-medium text-gray-200 mb-2">Nessuna proposta attiva</p>
                      <p className="text-sm text-gray-400">Le proposte di modifica aura appariranno qui</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {proposals.filter(p => p.status === 'pending').map((proposal) => (
                        <div key={proposal.id} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-white text-sm">
                              {proposal.players?.name || players.find(p => p.id === proposal.player_id)?.name}
                            </div>
                            <div className={`text-lg px-3 py-2 rounded-lg font-bold text-center ${
                              proposal.points > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {proposal.points > 0 ? '+' : ''}{formatAuraValue(proposal.points)} Aura
                            </div>
                          </div>
                          <p className="text-gray-300 text-xs mb-3">{proposal.description}</p>
                          
                          {/* Status Bar del Voto - Versione Migliorata */}
                          <div className="mb-3">
                            {/* Header con progresso generale */}
                            <div className="flex justify-between items-center text-xs mb-2">
                              <span className="text-white font-medium">
                                Progresso Voto
                              </span>
                              <span className="text-gray-300">
                                {proposal.votes_for + proposal.votes_against} di {players.length} voti
                              </span>
                            </div>
                            
                            {/* Barra di Progresso Principale */}
                            <div className="w-full bg-gray-800/60 rounded-xl h-4 overflow-hidden mb-2 border border-gray-600/30">
                              <div className="h-full flex relative">
                                {/* Voti a favore */}
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 flex items-center justify-center"
                                  style={{ 
                                    width: `${(proposal.votes_for / players.length) * 100}%` 
                                  }}
                                >
                                  {proposal.votes_for > 0 && (
                                    <span className="text-white text-xs font-bold">
                                      👍 {proposal.votes_for}
                                    </span>
                                  )}
                                </div>
                                {/* Voti contrari */}
                                <div 
                                  className="bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500 flex items-center justify-center"
                                  style={{ 
                                    width: `${(proposal.votes_against / players.length) * 100}%` 
                                  }}
                                >
                                  {proposal.votes_against > 0 && (
                                    <span className="text-white text-xs font-bold">
                                      👎 {proposal.votes_against}
                                    </span>
                                  )}
                                </div>
                                {/* Spazio rimanente */}
                                <div 
                                  className="bg-gray-700/40 flex items-center justify-center"
                                  style={{ 
                                    width: `${Math.max(0, ((players.length - proposal.votes_for - proposal.votes_against) / players.length) * 100)}%` 
                                  }}
                                >
                                  {(players.length - proposal.votes_for - proposal.votes_against) > 0 && (
                                    <span className="text-gray-400 text-xs">
                                      {players.length - proposal.votes_for - proposal.votes_against} rimasti
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Soglie di decisione */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {(() => {
                                // Calcola le soglie dinamicamente in base al numero di giocatori
                                const totalPlayers = players.length
                                
                                // Per l'approvazione serve la maggioranza assoluta (> 50%)
                                const approvalThreshold = Math.floor(totalPlayers / 2) + 1
                                
                                // Per il rifiuto serve anche la maggioranza assoluta (> 50%)
                                const rejectionThreshold = Math.floor(totalPlayers / 2) + 1
                                
                                return (
                                  <>
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                                      <div className="text-green-400 font-bold">✅ APPROVAZIONE</div>
                                      <div className="text-green-300">
                                        Servono {approvalThreshold} voti favorevoli
                                      </div>
                                        {proposal.votes_for >= approvalThreshold && (
                                          <div className="text-green-200 text-xs mt-1">🎉 Soglia raggiunta!</div>
                                        )}
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                                      <div className="text-red-400 font-bold">❌ RIFIUTO</div>
                                      <div className="text-red-300">
                                        Servono {rejectionThreshold} voti contrari
                                      </div>
                                        {proposal.votes_against >= rejectionThreshold && (
                                          <div className="text-red-200 text-xs mt-1">⛔ Soglia raggiunta!</div>
                                        )}
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs mb-3">
                            <span className="text-purple-300">
                              👤 Proposta di {proposal.proposed_by_username}
                            </span>
                          </div>
                          
                          {/* Pulsanti di voto */}
                          {currentUser && !currentUser.isGuest && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => voteProposal(proposal.id, 'approve')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                              >
                                👍 Approva
                              </button>
                              <button
                                onClick={() => voteProposal(proposal.id, 'reject')}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                              >
                                👎 Rifiuta
                              </button>
                            </div>
                          )}
                          
                          {currentUser && currentUser.isGuest && (
                            <div className="text-center text-xs text-gray-400 py-2">
                              👻 Registrati per votare
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Azioni Recenti */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-8">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="text-2xl">📚</div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Azioni Recenti
                    </h2>
                  </div>
                  {actions.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="text-4xl sm:text-6xl mb-4">📋</div>
                      <p className="text-base sm:text-lg font-medium text-gray-200 mb-2">Nessuna azione ancora registrata</p>
                      <p className="text-sm text-gray-400">🎮 Le azioni appariranno qui quando inizierai a giocare!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actions.slice(0, 3).map((action) => (
                      <div 
                        key={action.id} 
                        className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer hover:shadow-lg min-w-0"
                        onClick={() => openActionModal(action)}
                        title="Clicca per vedere dettagli e commenti"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-white text-sm flex-1 min-w-0 pr-2">
                            {players.find(p => p.id === action.player_id)?.name}
                          </div>
                          <div className={`text-lg px-3 py-2 rounded-lg font-bold text-center flex-shrink-0 ${
                            action.points > 0 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {action.points > 0 ? '+' : ''}{formatAuraValue(action.points)} Aura
                          </div>
                        </div>
                        <p className="text-gray-300 text-xs mb-3 break-words">{action.description}</p>
                        
                        <div className="flex justify-between items-center text-xs mb-3 min-w-0">
                          <div className="flex-1 min-w-0 pr-2">
                            {action.performed_by_username && (
                              <span className="text-blue-300 truncate block">
                                👤 Aggiunto da {action.performed_by_username}
                              </span>
                            )}
                            {!action.performed_by_username && (
                              <span className="text-gray-500">
                                🤖 Azione automatica
                              </span>
                            )}
                          </div>
                          <span className="text-purple-300 flex-shrink-0">
                            💬 Commenti
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center min-w-0">
                          <div className="text-xs text-gray-400 flex items-center gap-1 flex-1 min-w-0">
                            🕐 {new Date(action.created_at).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteAction(action.id, action.description)
                            }}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors flex-shrink-0 ml-2"
                            title="Elimina azione"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {actions.length > 3 && (
                      <div className="pt-3 text-center">
                        <button
                          onClick={() => setActiveTab('actions')}
                          className="text-blue-300 hover:text-blue-200 text-sm font-medium transition-colors underline"
                        >
                          Visualizza tutte le {actions.length} azioni →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-2 rounded-xl">
                <div className="text-2xl">📚</div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Storico Completo Azioni</h2>
              <div className="text-sm text-gray-300 bg-white/10 px-3 py-1 rounded-full">
                {actions.length} {actions.length === 1 ? 'azione' : 'azioni'}
              </div>
            </div>
            
            {actions.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">📋</div>
                <p className="text-xl sm:text-2xl font-bold text-white mb-2">Nessuna azione registrata</p>
                <p className="text-base sm:text-lg text-gray-300">🎮 Lo storico delle azioni apparirà qui quando inizierai a giocare!</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {actions.map((action) => (
                  <div 
                    key={action.id} 
                    className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 sm:p-6 hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer hover:shadow-lg"
                    onClick={() => openActionModal(action)}
                    title="Clicca per vedere dettagli e commenti"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center font-bold text-white shadow-lg">
                          {players.find(p => p.id === action.player_id)?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-base">
                            {players.find(p => p.id === action.player_id)?.name || 'Giocatore sconosciuto'}
                          </div>
                          <div className="text-xs text-gray-400">
                            🕐 {new Date(action.created_at).toLocaleString('it-IT', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className={`text-xl px-4 py-2 rounded-lg font-bold text-center ${
                        action.points > 0 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {action.points > 0 ? '+' : ''}{formatAuraValue(action.points)} Aura
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 bg-white/5 p-3 rounded-lg break-words">
                      &quot;{action.description}&quot;
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-xs">
                        {action.performed_by_username && (
                          <span className="text-blue-300 flex items-center gap-1">
                            👤 Aggiunto da {action.performed_by_username}
                          </span>
                        )}
                        {!action.performed_by_username && (
                          <span className="text-gray-500 flex items-center gap-1">
                            🤖 Azione automatica
                          </span>
                        )}
                        <span className="text-purple-300 flex items-center gap-1">
                          💬 Commenti disponibili
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteAction(action.id, action.description)
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                        title="Elimina azione"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'players' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-xl">
                <div className="text-2xl">🏆</div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Classifica Giocatori</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {players.sort((a, b) => b.aura_points - a.aura_points).map((player, index) => (
                <div 
                  key={player.id} 
                  className="flex items-center justify-between p-4 sm:p-6 bg-white/10 backdrop-blur rounded-xl sm:rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg">
                      {index + 1}
                    </span>
                    <span className="text-2xl sm:text-3xl">{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}</span>
                    <div>
                      <div className="font-bold text-lg sm:text-xl text-white">{player.name}</div>
                      <div className="text-xs sm:text-sm text-gray-300">🔍 Clicca per dettagli</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400">
                      {formatAuraValue(player.aura_points)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300">{player.aura_points.toLocaleString()} punti</div>
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <div className="text-center py-12 sm:py-16">
                  <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">🏆</div>
                  <p className="text-xl sm:text-2xl font-bold text-white mb-2">Nessun giocatore in classifica</p>
                  <p className="text-base sm:text-lg text-gray-300">✨ Aggiungi giocatori per vedere la classifica! ✨</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                <div className="text-2xl">⚙️</div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Impostazioni Partita</h2>
            </div>

            <div className="space-y-6">
              {/* Modifica Nome Partita */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  📝 Nome Partita
                </h3>
                {editingGameName ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={newGameName}
                      onChange={(e) => setNewGameName(e.target.value)}
                      placeholder={game.name}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/40 backdrop-blur"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={updateGameName}
                        disabled={savingSettings || !newGameName.trim()}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                      >
                        {savingSettings ? '💾 Salvando...' : '💾 Salva Nome'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingGameName(false)
                          setNewGameName('')
                        }}
                        disabled={savingSettings}
                        className="flex-1 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                      >
                        ❌ Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium text-lg">{game.name}</div>
                      <div className="text-gray-400 text-sm">Nome corrente della partita</div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingGameName(true)
                        setNewGameName(game.name)
                      }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
                    >
                      ✏️ Modifica
                    </button>
                  </div>
                )}
              </div>

              {/* Modifica Codice Partita */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  🔑 Codice Partita
                </h3>
                {editingGameCode ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={newGameCode}
                      onChange={(e) => setNewGameCode(e.target.value)}
                      placeholder={game.code}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/40 backdrop-blur font-mono"
                    />
                    <div className="text-sm text-yellow-300 bg-yellow-500/10 p-3 rounded-lg">
                      ⚠️ Attenzione: cambiando il codice, l&apos;URL della partita cambierà e dovrai condividere il nuovo link con i giocatori.
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={updateGameCode}
                        disabled={savingSettings || !newGameCode.trim()}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                      >
                        {savingSettings ? '💾 Salvando...' : '💾 Salva Codice'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingGameCode(false)
                          setNewGameCode('')
                        }}
                        disabled={savingSettings}
                        className="flex-1 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                      >
                        ❌ Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium text-lg font-mono">{game.code}</div>
                      <div className="text-gray-400 text-sm">Codice corrente della partita</div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingGameCode(true)
                        setNewGameCode(game.code)
                      }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
                    >
                      ✏️ Modifica
                    </button>
                  </div>
                )}
              </div>

              {/* Azioni Pericolose */}
              <div className="bg-red-500/10 backdrop-blur rounded-2xl p-6 border border-red-500/20">
                <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  ⚠️ Azioni Pericolose
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={resetGame}
                    disabled={savingSettings}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    🔄 Reset Partita
                  </button>
                  <p className="text-sm text-gray-400 text-center">
                    Azzera tutti i punti aura e le azioni, ma mantiene i giocatori
                  </p>
                  
                  <button
                    onClick={deleteGame}
                    disabled={savingSettings}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    🗑️ Elimina Partita
                  </button>
                  <p className="text-sm text-gray-400 text-center">
                    Elimina definitivamente la partita e tutti i suoi dati
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
