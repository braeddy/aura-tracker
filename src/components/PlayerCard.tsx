interface PlayerCardProps {
  player: {
    id: string
    name: string
    avatar: string
    aura_points: number
  }
  rank: number
  onUpdateAura: (playerId: string, points: number, description?: string) => void
  customAuraValue: string
  onCustomAuraChange: (value: string) => void
  onApplyCustomAura: () => void
}

export default function PlayerCard({ 
  player, 
  rank, 
  onUpdateAura,
  customAuraValue,
  onCustomAuraChange,
  onApplyCustomAura
}: PlayerCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
            {player.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{player.name}</span>
              <span className="text-sm text-gray-500">#{rank}</span>
            </div>
            <div className="text-xs text-gray-500">• Clicca per dettagli</div>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-blue-600 mb-1">
          {player.aura_points}
        </div>
        <div className="text-sm font-medium text-gray-600 mb-1">Aura Points</div>
        <div className="text-xs text-gray-500">
          Valore esatto: {player.aura_points}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-center text-sm font-medium text-gray-700">
          Aura Personalizzata
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Inserisci quantità aura..."
            value={customAuraValue}
            onChange={(e) => onCustomAuraChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={onApplyCustomAura}
            disabled={!customAuraValue}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Applica Aura
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdateAura(player.id, 1, 'Aura +1')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
          >
            <span className="text-lg">+</span>
            +1
          </button>
          <button
            onClick={() => onUpdateAura(player.id, -1, 'Aura -1')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
          >
            <span className="text-lg">−</span>
            -1
          </button>
        </div>
      </div>
    </div>
  )
}
