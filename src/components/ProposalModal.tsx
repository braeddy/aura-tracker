import { useState } from 'react'
import { Vote, Plus, Minus, X, ChevronDown } from 'lucide-react'

interface Player {
  id: string
  name: string
  aura_points: number
}

interface ProposalModalProps {
  isOpen: boolean
  onClose: () => void
  players: Player[]
  gameCode: string
  username: string
  onProposalCreated: () => void
}

export default function ProposalModal({
  isOpen,
  onClose,
  players,
  gameCode,
  username,
  onProposalCreated
}: ProposalModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Funzione per formattare i numeri
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const pointsValue = typeof points === 'string' ? 0 : points
    
    if (!selectedPlayerId || !description.trim() || pointsValue === 0) {
      setError('Compila tutti i campi obbligatori')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/games/${gameCode}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: selectedPlayerId,
          description: description.trim(),
          points: pointsValue,
          username
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore nella creazione della proposta')
      }

      // Reset form
      setSelectedPlayerId('')
      setDescription('')
      setPoints('')
      setIsDropdownOpen(false)
      
      onProposalCreated()
      onClose()

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setSelectedPlayerId('')
    setDescription('')
    setPoints('')
    setError('')
    setIsDropdownOpen(false)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsDropdownOpen(false)
        }
      }}
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl max-w-lg w-full border border-white/20 overflow-hidden"
           onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Vote className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Proponi Modifica Aura
                </h2>
                <p className="text-blue-100 text-sm">
                  Sistema di voto democratico
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors text-3xl transform hover:scale-110 duration-300 bg-white/10 hover:bg-white/20 rounded-xl p-2"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selezione Giocatore */}
            <div>
              <label className="block text-lg font-bold text-white mb-3">
                🎯 Giocatore Target
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-5 py-4 bg-gray-800/90 backdrop-blur border border-gray-600 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 font-medium flex items-center justify-between hover:bg-gray-700/90 shadow-lg"
                  disabled={isSubmitting}
                >
                  <span className={selectedPlayerId ? 'text-white font-semibold' : 'text-gray-200'}>
                    {selectedPlayerId 
                      ? `${players.find(p => p.id === selectedPlayerId)?.name} • ${formatAuraValue(players.find(p => p.id === selectedPlayerId)?.aura_points || 0)} ✨ aura`
                      : 'Seleziona un giocatore'
                    }
                  </span>
                  <ChevronDown className={`w-6 h-6 transition-transform duration-200 text-gray-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-lg border border-gray-600 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {players.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlayerId(player.id)
                          setIsDropdownOpen(false)
                        }}
                        className="w-full px-5 py-4 text-left hover:bg-gray-700/80 transition-all duration-200 border-b border-gray-600/50 last:border-b-0 flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-base text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-white text-lg group-hover:text-yellow-300 transition-colors">{player.name}</div>
                          <div className="text-base text-gray-100 font-medium">{formatAuraValue(player.aura_points)} <span className="text-yellow-400">✨</span> aura points</div>
                        </div>
                        <div className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xl">
                          👆
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Punti Aura */}
            <div>
              <label className="block text-lg font-bold text-white mb-3">
                ⚡ Punti Aura
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = typeof points === 'string' ? 0 : points
                    setPoints(currentValue - 1)
                  }}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white p-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  disabled={isSubmitting}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || '')}
                  placeholder="0"
                  className="flex-1 px-4 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white text-center font-bold text-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = typeof points === 'string' ? 0 : points
                    setPoints(currentValue + 1)
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  disabled={isSubmitting}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-3">
                <div className={`text-2xl font-bold ${
                  typeof points === 'string' ? 'text-gray-400' : 
                  points > 0 ? 'text-green-400' : 
                  points < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {typeof points === 'string' ? 'Inserisci un valore' : 
                   `${points > 0 ? '+' : ''}${formatAuraValue(points)}`}
                </div>
                <p className="text-gray-300 text-sm mt-1">
                  💡 Valori positivi aggiungono aura, negativi la sottraggono
                </p>
              </div>
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-lg font-bold text-white mb-3">
                💭 Motivo della Proposta
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Spiega perché proponi questa modifica aura..."
                className="w-full px-4 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none"
                rows={4}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Errore */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-2xl backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 backdrop-blur border border-white/20"
                disabled={isSubmitting}
              >
                🔄 Reset
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                disabled={isSubmitting || !selectedPlayerId || !description.trim() || points === '' || points === 0}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    🗳️ Crea Proposta
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 p-4 rounded-2xl backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <div className="font-bold mb-1">Come funziona il sistema democratico:</div>
                <div className="text-sm text-blue-200">
                  La tua proposta sarà votata da tutti i giocatori. Serve la maggioranza dei voti favorevoli per essere approvata ed eseguita automaticamente.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
