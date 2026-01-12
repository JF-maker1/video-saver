'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface AuthPanelProps {
  onSuccess: () => void
  message?: string
}

export default function AuthPanel({ onSuccess, message }: AuthPanelProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    setInfoMsg('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onSuccess() // Úspěšné přihlášení
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setInfoMsg('Registrace úspěšná! Zkontrolujte prosím svůj email pro potvrzení.')
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Nastala chyba při autentizaci')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100 animate-fade-in mb-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {mode === 'login' ? 'Přihlášení' : 'Registrace'}
        </h2>
        {message && (
          <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">
            ℹ️ {message}
          </p>
        )}
      </div>

      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="vas@email.cz"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heslo</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="******"
          />
        </div>

        {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
        {infoMsg && <div className="text-green-600 text-sm">{infoMsg}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
        >
          {isLoading ? 'Pracuji...' : (mode === 'login' ? 'Přihlásit se' : 'Registrovat se')}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500">
        {mode === 'login' ? 'Ještě nemáte účet?' : 'Již máte účet?'}
        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="ml-2 text-blue-600 hover:underline font-medium"
        >
          {mode === 'login' ? 'Zaregistrujte se' : 'Přihlaste se'}
        </button>
      </div>
    </div>
  )
}