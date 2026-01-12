'use client'

import { useState } from 'react'

interface SaveFormProps {
  onSaveAttempt: (url: string) => void
  disabled?: boolean
}

export default function SaveForm({ onSaveAttempt, disabled }: SaveFormProps) {
  const [inputUrl, setInputUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputUrl.trim()) {
      onSaveAttempt(inputUrl)
      setInputUrl('') // Vyčistit po odeslání
    }
  }

  return (
    <div className="w-full max-w-xl bg-white p-8 rounded-xl shadow-lg mb-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
        VideoSaver v1.4
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL Videa
          </label>
          <input
            id="url"
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            disabled={disabled}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Uložit Video
        </button>
      </form>
    </div>
  )
}