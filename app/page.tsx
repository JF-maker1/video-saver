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
  const [isLoadingList, setIsLoadingList] = useState(false) // Default false, protože seznam je skrytý

  // --- CYCLE 3 IMPLEMENTATION: ICEBERG CONTEXT UI ---
  // State pro nastavení zobrazení (Default: false = Focus Mode)
  const [showVideoList, setShowVideoList] = useState(false)
  // Flag pro ověření, že jsme na klientovi (řešení Hydration Erroru)
  const [isUiLoaded, setIsUiLoaded] = useState(false)

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

  // Načíst nastavení z localStorage a případně data (Persistence Logic)
  useEffect(() => {
    // 1. Zkusit načíst uložené nastavení
    const savedSetting = localStorage.getItem('vs_show_list')
    const shouldShow = savedSetting === 'true'

    // 2. Nastavit state
    if (shouldShow) {
      setShowVideoList(true)
      // Pokud má uživatel zapnutý seznam, rovnou načteme data (Lazy Loading optimalizace)
      fetchVideos()
    }

    // 3. Označit UI jako načtené (povolí renderování závislé na klientovi)
    setIsUiLoaded(true)
  }, [])

  // Handler pro přepínač zobrazení
  const toggleVideoList = (isChecked: boolean) => {
    setShowVideoList(isChecked)
    localStorage.setItem('vs_show_list', String(isChecked))

    // Pokud uživatel zapíná seznam a data ještě nemáme, načteme je
    if (isChecked && videos.length === 0) {
      fetchVideos()
    }
  }

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
      
      // Auto-update seznamu pouze pokud je zobrazen
      if (showVideoList) {
        fetchVideos()
      }

    } catch (error: any) {
      setSaveStatus('error')
      setSaveMessage(error.message)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 text-gray-900">
      
      {/* Hlavní karta formuláře */}
      <div className="w-full max-w-xl bg-white p-8 rounded-xl shadow-lg mb-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
          VideoSaver v1.3
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

      {/* --- CYCLE 3: PERSISTENT SETTINGS PANEL --- */}
      {/* Zobrazíme až po načtení UI, aby checkbox neblikal */}
      {isUiLoaded && (
        <div className="w-full max-w-xl bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500">
              {/* Simple Settings Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Zobrazení</h3>
              <p className="text-xs text-gray-500">Upravte si pracovní plochu</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={showVideoList}
              onChange={(e) => toggleVideoList(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">Seznam videí</span>
          </label>
        </div>
      )}

      {/* SEKCE: Seznam videí (Podmíněně renderováno) */}
      {/* Renderujeme pouze pokud je UI načteno A uživatel si to přeje */}
      {isUiLoaded && showVideoList && (
        <div className="w-full max-w-xl animate-fade-in">
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
      )}

    </main>
  )
}