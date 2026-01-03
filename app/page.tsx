'use client'

import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/save-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Něco se pokazilo')
      }

      setStatus('success')
      setMessage(data.message)
      setUrl('') // Vyčistit pole
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 text-gray-900">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
          VideoSaver v1.0
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              URL Videa
            </label>
            <input
              id="url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status === 'loading'}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors
              ${status === 'loading' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
          >
            {status === 'loading' ? 'Ukládám...' : 'Uložit URL'}
          </button>
        </form>

        {/* Feedback Area */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center text-sm font-medium animate-fade-in
            ${status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
          `}>
            {status === 'success' ? '✅ ' : '❌ '}
            {message}
          </div>
        )}
      </div>
    </main>
  )
}