'use client'

import { useState } from 'react'
import { User, UserPlus, Sparkles } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (userData: { username: string; displayName: string; isNewUser: boolean; id?: string }) => void
  gameCode: string
}

export default function LoginModal({ isOpen, onClose, onLogin, gameCode }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError('')

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          displayName: displayName.trim() || username.trim(),
          gameCode
        })
      })

      const data = await response.json()

      if (response.ok) {
        onLogin({
          username: data.user.username,
          displayName: data.user.display_name,
          isNewUser: !isLogin,
          id: data.user.id
        })
        onClose()
      } else {
        setError(data.error || 'Errore durante l\'autenticazione')
      }
    } catch {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    const guestName = `Guest_${Date.now().toString().slice(-6)}`
    onLogin({ 
      username: guestName, 
      displayName: 'Ospite', 
      isNewUser: true 
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 transform transition-all">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl w-fit mx-auto mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 mb-2">
            {isLogin ? '🎮 Accedi alla Partita' : '✨ Crea Account'}
          </h2>
          <p className="text-gray-300">
            Partita: <span className="font-semibold text-yellow-400 font-mono">{gameCode}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              👤 Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Il tuo username..."
              className="w-full px-6 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-center text-lg"
              required
              maxLength={20}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ✨ Nome da Mostrare
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Come vuoi essere chiamato..."
                className="w-full px-6 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-center text-lg"
                maxLength={30}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm text-center backdrop-blur">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg text-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {isLogin ? 'Accedendo...' : 'Registrando...'}
              </div>
            ) : (
              <>
                {isLogin ? (
                  <>
                    <User className="w-5 h-5 inline mr-2" />
                    🎮 Entra nella Partita
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 inline mr-2" />
                    ✨ Crea Account e Entra
                  </>
                )}
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setUsername('')
                setDisplayName('')
              }}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300 transform hover:scale-105"
            >
              {isLogin ? '✨ Non hai un account? Registrati' : '🎮 Hai già un account? Accedi'}
            </button>
          </div>

          <div className="text-center pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="text-gray-400 hover:text-gray-300 font-medium transition-colors duration-300 text-sm transform hover:scale-105"
            >
              👻 Continua come Ospite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
