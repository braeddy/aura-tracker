'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users, Trophy, Zap, Star, Sparkles, Play } from 'lucide-react'

export default function HomePage() {
  const [gameCode, setGameCode] = useState('')
  const [gameName, setGameName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const createGame = async () => {
    if (!gameName.trim()) return
    
    setIsCreating(true)
    try {
      const response = await fetch('/api/games/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: gameName })
      })
      
      if (response.ok) {
        const { code } = await response.json()
        router.push(`/game/${code}`)
      }
    } catch (error) {
      console.error('Errore nella creazione della partita:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const joinGame = () => {
    if (gameCode.trim()) {
      router.push(`/game/${gameCode.toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Sparkles className="h-12 w-12 text-white animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
              </div>
            </div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 mb-4 animate-fade-in">
              AuraTracker
            </h1>
            <p className="text-xl text-gray-300 mb-2 animate-fade-in-delay">Traccia l'aura dei tuoi amici</p>
            <p className="text-sm text-gray-400 animate-fade-in-delay-2">✨ Il modo più divertente per competere ✨</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-6 py-8">
            <div className="text-center group">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl mx-auto mb-3 w-fit transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm text-gray-300 font-medium">Multigiocatore</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-2xl mx-auto mb-3 w-fit transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm text-gray-300 font-medium">Classifiche</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-2xl mx-auto mb-3 w-fit transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm text-gray-300 font-medium">Tempo Reale</p>
            </div>
          </div>

          {/* Create Game */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Crea Partita</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome della partita..."
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full px-6 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-lg"
              />
              <button
                onClick={createGame}
                disabled={!gameName.trim() || isCreating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg transform hover:scale-105 disabled:scale-100"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creazione...
                  </>
                ) : (
                  <>
                    <Star className="h-5 w-5 animate-pulse" />
                    Crea Partita
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Join Game */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-xl">
                <Play className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Unisciti</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Codice partita (es. ABC123)"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full px-6 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg tracking-wider"
              />
              <button
                onClick={joinGame}
                disabled={!gameCode.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 text-lg shadow-lg transform hover:scale-105 disabled:scale-100"
              >
                🚀 Entra in Partita
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">✨ Crea partite uniche con codici condivisibili ✨</p>
            <div className="flex justify-center gap-4 text-xs text-gray-500">
              <span>🎮 Divertimento garantito</span>
              <span>•</span>
              <span>⚡ Veloce e facile</span>
              <span>•</span>
              <span>🏆 Competitive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
