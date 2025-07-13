'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserPlus, BarChart3, TrendingUp, TrendingDown, Sparkles, Heart, Zap, Calendar, Activity, Clock, Trophy, UserX, ArrowLeft } from 'lucide-react'

interface Player {
  id: string
  name: string
  aura_points: number
  avatar?: string
  created_at: string
}

interface Action {
  id: string
  player_id: string
  points: number
  description: string
  created_at: string
}

interface Game {
  id: string
  code: string
  name: string
  created_at: string
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
  const [newPlayerName, setNewPlayerName] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [customAura, setCustomAura] = useState<{[key: string]: string}>({})
  const [customMotivo, setCustomMotivo] = useState<{[key: string]: string}>({})

  // Stato per le notifiche integrate
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'reset' | 'delete' | null
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
  const [playerModalCustomAura, setPlayerModalCustomAura] = useState('')
  const [playerModalMotivo, setPlayerModalMotivo] = useState('')

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

  const addPlayer = async () => {
    if (!newPlayerName.trim()) return

    setAddingPlayer(true)
    try {
      const response = await fetch(`/api/games/${code}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      })

      if (response.ok) {
        setNewPlayerName('')
        fetchGameData()
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta del giocatore:', error)
    } finally {
      setAddingPlayer(false)
    }
  }

  const updateAura = async (playerId: string, points: number, description: string) => {
    try {
      const response = await fetch(`/api/games/${code}/players/${playerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points, description })
      })

      if (response.ok) {
        setCustomAura({...customAura, [playerId]: ''})
        setCustomMotivo({...customMotivo, [playerId]: ''})
        fetchGameData()
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento aura:', error)
    }
  }

  // Funzione per eliminare un giocatore
  const deletePlayer = async (playerId: string, playerName: string) => {
    setNotification({
      show: true,
      type: 'delete',
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

  // Funzione per resettare la partita
  const resetGame = () => {
    setNotification({
      show: true,
      type: 'reset',
      message: 'Sei sicuro di voler resettare la partita? Tutti i punti aura e le azioni verranno eliminate, ma i giocatori rimarranno.',
      onConfirm: async () => {
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
        }
      }
    })
  }

  // Funzione per eliminare la partita
  const deleteGame = () => {
    setNotification({
      show: true,
      type: 'delete',
      message: 'Sei sicuro di voler eliminare definitivamente questa partita? Tutti i dati verranno persi per sempre.',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/games/${code}`, {
            method: 'DELETE',
          })
          
          if (response.ok) {
            router.push('/') // Reindirizza alla home page
          } else {
            alert('Errore durante l\'eliminazione della partita')
          }
        } catch (error) {
          console.error('Errore nell\'eliminazione:', error)
          alert('Errore di connessione durante l\'eliminazione')
        }
      }
    })
  }

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
      {/* Notifica Integrata - Fuori dal container principale */}
      {notification.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all border border-white/20">
            <div className="text-center mb-6">
              <div className="text-8xl mb-4">
                {notification.type === 'delete' ? '🗑️' : '🔄'}
              </div>
              <h3 className={`text-3xl font-bold mb-4 ${
                notification.type === 'delete' ? 'text-red-400' : 'text-orange-400'
              }`}>
                {notification.type === 'delete' ? 'Elimina Partita' : 'Reset Partita'}
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
                  notification.type === 'delete' 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                }`}
              >
                {notification.type === 'delete' ? '🗑️ Elimina' : '🔄 Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dettagli Giocatore */}
      {selectedPlayer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            {(() => {
              const stats = getPlayerStats(selectedPlayer)
              const playerRank = players.sort((a, b) => b.aura_points - a.aura_points).findIndex(p => p.id === selectedPlayer.id) + 1
              return (
                <>
                  {/* Header */}
                  <div className="sticky top-0 bg-white/10 backdrop-blur border-b border-white/20 p-6 rounded-t-3xl">
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
                            setPlayerModalCustomAura('')
                            setPlayerModalMotivo('')
                          }}
                          className="text-gray-400 hover:text-white transition-colors text-3xl transform hover:scale-110 duration-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-8">
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
                      <h3 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
                        <BarChart3 className="w-6 h-6" />
                        ✨ Statistiche
                      </h3>
                      
                      {/* Griglia Statistiche - Layout glassmorphism */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Azioni Totali */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <BarChart3 className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-blue-400 mb-1">{stats.totalActions}</div>
                          <div className="text-sm text-gray-300 font-medium">Azioni Totali</div>
                        </div>

                        {/* Azioni Positive */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-green-400 mb-1">{stats.positiveActions}</div>
                          <div className="text-sm text-gray-300 font-medium">Azioni Positive</div>
                        </div>

                        {/* Azioni Negative */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <TrendingDown className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-red-400 mb-1">{stats.negativeActions}</div>
                          <div className="text-sm text-gray-300 font-medium">Azioni Negative</div>
                        </div>

                        {/* Aura Guadagnata */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Sparkles className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-yellow-400 mb-1">+{formatAuraValue(stats.totalPositive)}</div>
                          <div className="text-sm text-gray-300 font-medium">Aura Guadagnata</div>
                        </div>

                        {/* Aura Persa */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Heart className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-pink-400 mb-1">{formatAuraValue(stats.totalNegative)}</div>
                          <div className="text-sm text-gray-300 font-medium">Aura Persa</div>
                        </div>

                        {/* Aura Netta */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Zap className="w-7 h-7 text-white" />
                          </div>
                          <div className={`text-3xl font-bold mb-1 ${stats.netAura >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.netAura >= 0 ? '+' : ''}{formatAuraValue(stats.netAura)}
                          </div>
                          <div className="text-sm text-gray-300 font-medium">Aura Netta</div>
                        </div>

                        {/* Media/Giorno */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Calendar className="w-7 h-7 text-white" />
                          </div>
                          <div className={`text-3xl font-bold mb-1 ${stats.averagePerDay >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.averagePerDay >= 0 ? '+' : ''}{formatAuraValue(stats.averagePerDay)}
                          </div>
                          <div className="text-sm text-gray-300 font-medium">Media/Giorno</div>
                        </div>

                        {/* Giorni Attivo */}
                        <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Activity className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-teal-400 mb-1">{stats.uniqueDays}</div>
                          <div className="text-sm text-gray-300 font-medium">Giorni Attivo</div>
                        </div>
                      </div>
                    </div>

                    {/* Storico Azioni */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                        <Clock className="w-6 h-6" />
                        📋 Storico Azioni
                      </h3>
                      <div className="max-h-60 overflow-y-auto space-y-3">
                        {actions
                          .filter(action => action.player_id === selectedPlayer.id)
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((action, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${action.points > 0 ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                                <div>
                                  <div className="font-bold text-white">{action.description}</div>
                                  <div className="text-xs text-gray-400">
                                    {new Date(action.created_at).toLocaleString('it-IT')}
                                  </div>
                                </div>
                              </div>
                              <div className={`font-bold text-lg px-3 py-1 rounded-xl ${action.points > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'}`}>
                                {action.points > 0 ? '+' : ''}{formatAuraValue(action.points)}
                              </div>
                            </div>
                          ))}
                        {actions.filter(action => action.player_id === selectedPlayer.id).length === 0 && (
                          <div className="text-center py-12">
                            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                            <p className="text-gray-400">🎮 Nessuna azione registrata</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controlli Aura */}
                    <div className="space-y-8">
                      <h3 className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
                        <Zap className="w-6 h-6" />
                        ⚙️ Modifica Aura
                      </h3>
                      
                      {/* Custom Aura Section */}
                      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                        <div className="text-center text-xl font-bold text-white mb-6">
                          🎯 Aura Personalizzata
                        </div>
                        <div className="space-y-4">
                          <input
                            type="number"
                            placeholder="Inserisci quantità aura..."
                            value={playerModalCustomAura}
                            onChange={(e) => setPlayerModalCustomAura(e.target.value)}
                            className="w-full px-6 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-center text-lg"
                          />
                          <input
                            type="text"
                            placeholder="💭 Motivo (opzionale)..."
                            value={playerModalMotivo}
                            onChange={(e) => setPlayerModalMotivo(e.target.value)}
                            className="w-full px-6 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-center text-lg"
                          />
                          <button
                            onClick={() => {
                              updateAura(selectedPlayer.id, parseInt(playerModalCustomAura) || 0, playerModalMotivo || 'Aura personalizzata')
                              setSelectedPlayer(null)
                              setPlayerModalCustomAura('')
                              setPlayerModalMotivo('')
                            }}
                            disabled={!playerModalCustomAura}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100 text-lg shadow-lg"
                          >
                            ⚡ Applica Aura
                          </button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div>
                        <div className="text-center text-xl font-bold text-white mb-6">
                          ⚡ Modifiche Rapide (K)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              updateAura(selectedPlayer.id, 1000, 'Aura +1K')
                              setSelectedPlayer(null)
                            }}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                          >
                            +1K
                          </button>
                          <button
                            onClick={() => {
                              updateAura(selectedPlayer.id, 5000, 'Aura +5K')
                              setSelectedPlayer(null)
                            }}
                            className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                          >
                            +5K
                          </button>
                          <button
                            onClick={() => {
                              updateAura(selectedPlayer.id, -1000, 'Aura -1K')
                              setSelectedPlayer(null)
                            }}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                          >
                            -1K
                          </button>
                          <button
                            onClick={() => {
                              updateAura(selectedPlayer.id, -5000, 'Aura -5K')
                              setSelectedPlayer(null)
                            }}
                            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                          >
                            -5K
                          </button>
                        </div>
                      </div>

                      {/* Extreme Values */}
                      <div>
                        <div className="text-center text-xl font-bold text-white mb-6">
                          🔥 Valori Estremi (M)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              updateAura(selectedPlayer.id, 100000, 'Aura +100K')
                              setSelectedPlayer(null)
                            }}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                          >
                            +100K
                          </button>
                          <button
                            onClick={() => {
                              updateAura(selectedPlayer.id, 1000000, 'Aura +1M')
                              setSelectedPlayer(null)
                            }}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                          >
                            +1M
                          </button>
                          <button
                            onClick={() => {
                              updateAura(selectedPlayer.id, -100000, 'Aura -100K')
                              setSelectedPlayer(null)
                            }}
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                          >
                            -100K
                          </button>
                          <button
                            onClick={() => {
                              updateAura(selectedPlayer.id, -1000000, 'Aura -1M')
                              setSelectedPlayer(null)
                            }}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                          >
                            -1M
                          </button>
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

      <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden ${notification.show || selectedPlayer ? 'blur-sm' : ''}`}>
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
              title="Esci dalla partita"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Esci</span>
            </button>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 text-center">
            <div className="flex justify-center mb-2 sm:mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-pulse" />
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
            <div className="flex justify-center items-center space-x-2 sm:space-x-6 pb-4 sm:pb-6 overflow-x-auto">
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
                👥 <span className="hidden sm:inline">{players.length} Giocatori</span>
                <span className="sm:hidden">{players.length}</span>
              </button>
              
              {/* Action Buttons */}
              <button
                onClick={resetGame}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-xl backdrop-blur border border-white/20 whitespace-nowrap"
              >
                🔄 <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={deleteGame}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-xl backdrop-blur border border-white/20 whitespace-nowrap"
              >
                🗑️ <span className="hidden sm:inline">Elimina</span>
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
              {/* Left Side - Add Player and Players */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-8">
                {/* Add Player Section */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-8 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                      <UserPlus className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white">
                      Aggiungi Giocatore
                    </h2>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <input
                      type="text"
                      placeholder="Nome del giocatore..."
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/20 backdrop-blur border border-white/30 rounded-xl sm:rounded-2xl text-white placeholder-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-center text-base sm:text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                    />
                    <button
                      onClick={addPlayer}
                      disabled={!newPlayerName.trim() || addingPlayer}
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg text-base sm:text-lg"
                    >
                      {addingPlayer ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white inline-block mr-2"></div>
                          Aggiungendo...
                        </>
                      ) : (
                        <>
                          ⭐ Aggiungi al Gioco
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Players Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {players.sort((a, b) => b.aura_points - a.aura_points).map((player, index) => (
                    <div 
                      key={player.id} 
                      className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl p-4 sm:p-6 cursor-pointer hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      {/* Player Header */}
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="text-2xl sm:text-3xl">{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}</div>
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-lg sm:text-xl text-white shadow-lg">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg sm:text-xl">{player.name}</div>
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
                      <div className="space-y-4 sm:space-y-6">
                        {/* Custom Aura Section */}
                        <div className="bg-white/10 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
                          <div className="text-center text-sm sm:text-base font-semibold text-gray-200 mb-3 sm:mb-4">
                            🎯 Aura Personalizzata
                          </div>
                          <input
                            type="number"
                            placeholder="Inserisci quantità aura..."
                            value={customAura[player.id] || ''}
                            onChange={(e) => setCustomAura(prev => ({ ...prev, [player.id]: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-4 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white placeholder-gray-300 text-center mb-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateAura(player.id, parseInt(customAura[player.id]) || 0, customMotivo[player.id] || 'Aura personalizzata')
                            }}
                            disabled={!customAura[player.id]}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-2.5 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100 text-sm sm:text-base"
                          >
                            ⚡ Applica Aura
                          </button>
                        </div>

                        {/* Optional Reason */}
                        <input
                          type="text"
                          placeholder="💭 Motivo (opzionale)..."
                          value={customMotivo[player.id] || ''}
                          onChange={(e) => setCustomMotivo(prev => ({ ...prev, [player.id]: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white placeholder-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                        />

                        {/* Quick Modifications (K) */}
                        <div>
                          <div className="text-center text-sm sm:text-base font-semibold text-gray-200 mb-2 sm:mb-3">
                            ⚡ Modifiche Rapide (K)
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateAura(player.id, 1000, 'Aura +1K')
                              }}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                            >
                              +1K
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateAura(player.id, 5000, 'Aura +5K')
                              }}
                              className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                            >
                              +5K
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateAura(player.id, -1000, 'Aura -1K')
                              }}
                              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                            >
                              -1K
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateAura(player.id, -5000, 'Aura -5K')
                              }}
                              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                            >
                              -5K
                            </button>
                          </div>
                        </div>

                        {/* Extreme Values (M) */}
                        <div>
                          <div className="text-center text-sm sm:text-base font-semibold text-gray-200 mb-2 sm:mb-3">
                            🔥 Valori Estremi (M)
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateAura(player.id, 100000, 'Aura +100K')
                              }}
                              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                            >
                            +100K
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateAura(player.id, 1000000, 'Aura +1M')
                              }}
                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                            >
                              +1M
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateAura(player.id, -100000, 'Aura -100K')
                              }}
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                            >
                              -100K
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateAura(player.id, -1000000, 'Aura -1M')
                              }}
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                            >
                              -1M
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {players.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-8xl mb-6">⭐</div>
                    <p className="text-2xl font-bold text-white mb-2">Nessun giocatore ancora aggiunto</p>
                    <p className="text-lg text-gray-300">✨ Aggiungi il primo giocatore per iniziare! ✨</p>
                  </div>
                )}
              </div>

              {/* Right Side - Action History */}
              <div className="lg:col-span-1 mt-8 lg:mt-0">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-8 lg:sticky lg:top-8">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Storico Azioni
                    </h2>
                  </div>
                  {actions.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="text-4xl sm:text-6xl mb-4">📋</div>
                      <p className="text-base sm:text-lg font-medium text-gray-200 mb-2">Nessuna azione ancora registrata</p>
                      <p className="text-sm text-gray-400">🎮 Le azioni appariranno qui quando inizierai a giocare!</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                    {actions.map((action) => (
                      <div key={action.id} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-white/10 backdrop-blur border border-white/20 rounded-xl sm:rounded-2xl hover:bg-white/20 transition-all duration-300">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-bold backdrop-blur border border-white/30 ${
                            action.points > 0 
                              ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300' 
                              : 'bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-300'
                          }`}>
                            {action.points > 0 ? '+' : ''}{formatAuraValue(action.points)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-base sm:text-lg">
                            {players.find(p => p.id === action.player_id)?.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-300 truncate mt-1">
                            {action.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(action.created_at).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-xl">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">🏆 Classifica Giocatori</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {players.sort((a, b) => b.aura_points - a.aura_points).map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-4 sm:p-6 bg-white/10 backdrop-blur rounded-xl sm:rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg shadow-lg">
                      {index + 1}
                    </span>
                    <span className="text-2xl sm:text-3xl">{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}</span>
                    <span className="font-bold text-lg sm:text-xl text-white">{player.name}</span>
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
      </div>
    </div>
    </>
  )
}
