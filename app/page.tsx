'use client'

import { useState, useEffect } from 'react'

// Definice typu pro video záznam
interface Video {
  id: number
  url: string
  created_at: string
}

export default function Home() {
  // State pro formulář
  const [inputUrl, setInputUrl] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')

  // State pro seznam videí (FR-004)
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)

  // Funkce pro načtení seznamu videí
  const fetchVideos = async () => {
    setIsLoadingList(true)
    try {
      const response = await fetch('/api/get-urls')
      const result = await response.json()
      
      if (result.data) {
        setVideos(result.data)
      }
    } catch (error) {
      console.error('Chyba při načítání seznamu:', error)
    } finally {
      setIsLoadingList(false)
    }
  }

  // Načíst videa při prvním zobrazení stránky
  useEffect(() => {
    fetchVideos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus('loading')
    setSaveMessage('')

    try {
      const response = await fetch('/api/save-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Něco se pokazilo')
      }

      setSaveStatus('success')
      setSaveMessage(data.message)
      setInputUrl('') // Vyčistit pole
      
      // FR-004.1: Auto-update seznamu po úspěšném uložení
      fetchVideos()

    } catch (error: any) {
      setSaveStatus('error')
      setSaveMessage(error.message)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 text-gray-900">
      
      {/* Hlavní karta formuláře */}
      <div className="w-full max-w-xl bg-white p-8 rounded-xl shadow-lg mb-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
          VideoSaver v1.1
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              URL Videa
            </label>
            <input
              id="url"
              type="text" // Změněno na text pro lepší kontrolu validace na backendu
              placeholder="https://www.youtube.com/watch?v=..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={saveStatus === 'loading'}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={saveStatus === 'loading'}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors
              ${saveStatus === 'loading' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
          >
            {saveStatus === 'loading' ? 'Ukládám...' : 'Uložit Video'}
          </button>
        </form>

        {/* Feedback Area */}
        {saveMessage && (
          <div className={`mt-6 p-4 rounded-lg text-center text-sm font-medium animate-fade-in
            ${saveStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
          `}>
            {saveStatus === 'success' ? '✅ ' : '❌ '}
            {saveMessage}
          </div>
        )}
      </div>

      {/* SEKCE: Seznam videí (FR-004) */}
      <div className="w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          📚 Uložená videa
          <span className="text-sm font-normal text-gray-400 ml-auto">
            {videos.length} položek
          </span>
        </h2>

        {isLoadingList ? (
          // NFR-005: Loading Skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {videos.map((video) => (
              <div 
                key={video.id} 
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-2 overflow-hidden"
              >
                <div className="flex-1 min-w-0">
                   <a 
                    href={video.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate block font-medium"
                   >
                    {video.url}
                   </a>
                   <p className="text-xs text-gray-400 mt-1">
                    Přidáno: {new Date(video.created_at).toLocaleString('cs-CZ')}
                   </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            Zatím zde nejsou žádná videa. <br/> Buďte první a nějaké přidejte!
          </div>
        )}
      </div>

    </main>
  )
}