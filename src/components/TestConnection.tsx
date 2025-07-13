'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestConnection() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const testConnection = async () => {
    setStatus('testing')
    setMessage('Testing connection...')
    
    try {
      const supabase = createClient()
      
      // Test basic connection
      const { data, error } = await supabase
        .from('games')
        .select('count')
        .limit(1)

      if (error) {
        throw error
      }

      setStatus('success')
      setMessage('✅ Connessione a Supabase riuscita!')
    } catch (error: any) {
      setStatus('error')
      setMessage(`❌ Errore connessione: ${error.message}`)
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
      <h3 className="text-lg font-semibold mb-2">Test Connessione Database</h3>
      
      <div className="flex gap-2 items-center mb-2">
        <button
          onClick={testConnection}
          disabled={status === 'testing'}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
        >
          {status === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>
        
        {status !== 'idle' && (
          <div className={`px-3 py-1 rounded text-sm font-medium ${
            status === 'success' 
              ? 'bg-green-100 text-green-800' 
              : status === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {status === 'error' && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-medium text-yellow-800 mb-1">Hai configurato Supabase?</p>
          <ol className="text-yellow-700 list-decimal list-inside space-y-1">
            <li>Crea un progetto su <a href="https://supabase.com" className="underline" target="_blank">Supabase</a></li>
            <li>Esegui lo script SQL in <code>database/schema.sql</code></li>
            <li>Copia URL e chiave nel file <code>.env.local</code></li>
          </ol>
        </div>
      )}
    </div>
  )
}
