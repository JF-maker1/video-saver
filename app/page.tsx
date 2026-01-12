'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import SaveForm from './components/SaveForm'
import AuthPanel from './components/AuthPanel'

// Definice typu pro video záznam
interface Video {
  id: number
  url: string
  created_at: string
  user_id: string | null
}

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState<User | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  
  // UI State - EISBERG CONFIGURATION
  const [isUiLoaded, setIsUiLoaded] = useState(false)
  
  // 1. Panel: Vkládání (Default: TRUE - hlavní účel aplikace)
  const [showSaveForm, setShowSaveForm] = useState(true) 
  
  // 2. Panel: Seznam (Default: FALSE - objevování)
  const [showVideoList, setShowVideoList] = useState(false)
  
  // 3. Panel: Auth/Účet (Default: FALSE - identita na vyžádání)
  const [showAuthSection, setShowAuthSection] = useState(false)

  // Status State
  const [authMessage, setAuthMessage] = useState('')
  // Přidán stav 'info' pro edukační zprávy
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'info'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const supabase = createClient()

  // --- 1. INITIALIZATION & AUTH LISTENER ---
  useEffect(() => {
    // A) Načíst nastavení z localStorage (Persistence)
    const savedSettingList = localStorage.getItem('vs_show_list')
    const savedSettingForm = localStorage.getItem('vs_show_form')
    const savedSettingAuth = localStorage.getItem('vs_show_auth')
    
    // --- DEFAULTNÍ HODNOTY (STRICT DISCOVERY) ---
    
    // 1. VKLÁDÁNÍ VIDEA: Defaultně ZAPNUTO
    if (savedSettingForm !== null) {
      setShowSaveForm(savedSettingForm === 'true')
    } else {
      setShowSaveForm(true) // Explicitní Default ON
    }

    // 2. MŮJ ÚČET: Defaultně VYPNUTO (Eisberg)
    if (savedSettingAuth !== null) {
      setShowAuthSection(savedSettingAuth === 'true')
    } else {
      setShowAuthSection(false) // Explicitní Default OFF
    }

    // 3. SEZNAM VIDEÍ: Defaultně VYPNUTO
    if (savedSettingList !== null) {
      setShowVideoList(savedSettingList === 'true')
    } else {
      setShowVideoList(false) // Explicitní Default OFF
    }

    // B) Získat uživatele
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsUiLoaded(true) 
    }
    getUser()

    // C) Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setAuthMessage('')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // --- 2. DATA FETCHING ---
  useEffect(() => {
    if (showVideoList) {
      fetchVideos()
    }
  }, [showVideoList, user]) 

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/get-urls')
      const result = await response.json()
      if (result.data) {
        setVideos(result.data)
      }
    } catch (error) {
      console.error('Chyba při načítání seznamu:', error)
    }
  }

  // --- 3. THE RECEPTOR (INTERCEPTOR & EDUCATOR) ---
  const handleSaveAttempt = async (url: string) => {
    setStatusMessage('')
    setSaveStatus('loading')

    // A) INTERCEPTION: Pokud není uživatel, pouze edukujeme.
    if (!user) {
      setSaveStatus('info') // Modrá barva
      setStatusMessage('ℹ️ Pro vkládání obsahu nemáte oprávnění. Pro přihlášení si prosím zapněte volbu "Můj Účet / Přihlášení" v nastavení níže.')
      
      // EDUKACE: Nezapínáme sekci automaticky. Uživatel musí jít dolů a zapnout ji sám.
      return 
    }

    // B) EXECUTION (Authenticated)
    try {
      const response = await fetch('/api/save-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
           setUser(null)
           setSaveStatus('error')
           setStatusMessage('⚠️ Vaše přihlášení vypršelo. Prosím přihlaste se znovu v sekci Můj Účet.')
           return
        }
        throw new Error(data.error || 'Něco se pokazilo')
      }

      setSaveStatus('success')
      setStatusMessage('✅ Video úspěšně uloženo!')
      if (showVideoList) fetchVideos()

    } catch (error: any) {
      setSaveStatus('error')
      setStatusMessage(`❌ ${error.message}`)
    }
  }

  // --- 4. DELETE ACTION ---
  const handleDelete = async (id: number) => {
    if (!confirm('Opravdu chcete smazat toto video?')) return

    try {
      const { error } = await supabase.from('urls').delete().eq('id', id)
      if (error) throw error
      setVideos(videos.filter(v => v.id !== id))
      setStatusMessage('🗑️ Video smazáno.')
    } catch (error: any) {
      alert('Chyba: ' + error.message)
    }
  }

  // --- 5. SETTINGS HANDLERS ---
  const toggleSaveForm = (checked: boolean) => {
    setShowSaveForm(checked)
    localStorage.setItem('vs_show_form', String(checked))
  }
  const toggleVideoList = (checked: boolean) => {
    setShowVideoList(checked)
    localStorage.setItem('vs_show_list', String(checked))
  }
  const toggleAuthSection = (checked: boolean) => {
    setShowAuthSection(checked)
    localStorage.setItem('vs_show_auth', String(checked))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setStatusMessage('Byli jste odhlášeni.')
  }

  // --- RENDER ---
  if (!isUiLoaded) return null 

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 text-gray-900">
      
      {/* HEADER: Title + Permanent User Badge */}
      <div className="w-full max-w-xl flex justify-between items-center mb-8 px-2">
         <h1 className="text-2xl font-bold text-blue-600">VideoSaver v1.5</h1>
         
         {/* PERMANENT USER BADGE - Vždy viditelné, pokud je user přihlášen */}
         {user && (
           <div className="flex items-center gap-2" title={`Přihlášen: ${user.email}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-blue-100">
                 {user.email?.charAt(0).toUpperCase()}
              </div>
           </div>
         )}
      </div>

      {/* 1. AUTH SECTION (Eisberg Layer 1) */}
      {showAuthSection && (
        <div className="w-full max-w-xl mb-6 animate-fade-in order-1">
           {user ? (
             // A) Logged In View
             <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 text-center relative">
                <button 
                  onClick={() => toggleAuthSection(false)}
                  className="absolute top-2 right-4 text-gray-300 hover:text-gray-500 text-xl"
                  title="Skrýt sekci"
                >
                  &times;
                </button>
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                   {user.email?.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{user.email}</h3>
                <p className="text-sm text-gray-500 mb-6">Jste přihlášeni jako Editor</p>
                
                <button 
                  onClick={handleLogout}
                  className="w-full py-2 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Odhlásit se
                </button>
             </div>
           ) : (
             // B) Guest View: Full Login Form Directly
             <div className="relative">
                <button 
                  onClick={() => toggleAuthSection(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                  title="Skrýt přihlášení"
                >
                  ✕
                </button>
                <AuthPanel onSuccess={() => {}} message={authMessage} />
             </div>
           )}
        </div>
      )}

      {/* 2. SAVER (Eisberg Layer 2 - Default ON) */}
      {showSaveForm && (
        <div className="w-full max-w-xl order-2">
          <SaveForm onSaveAttempt={handleSaveAttempt} disabled={saveStatus === 'loading'} />
          
          {statusMessage && (
            <div className={`mb-6 p-4 rounded-lg text-center text-sm font-medium animate-fade-in w-full
              ${saveStatus === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : ''}
              ${saveStatus === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : ''}
              ${saveStatus === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
            `}>
              {statusMessage}
            </div>
          )}
        </div>
      )}

      {/* 3. SETTINGS PANEL (The Control Center) */}
      <div className="w-full max-w-xl bg-white border border-gray-200 p-4 rounded-xl mb-6 shadow-sm order-3">
          <div className="flex items-center gap-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-700">Nastavení zobrazení</h3>
          </div>
          
          <div className="space-y-3">
            {/* Toggle: Form */}
            <div className="flex justify-between items-center">
               <span className="text-sm text-gray-600">Vkládání videa</span>
               <Toggle checked={showSaveForm} onChange={toggleSaveForm} />
            </div>

            {/* Toggle: Auth (NEW) */}
            <div className="flex justify-between items-center">
               <span className="text-sm text-gray-600">Můj Účet / Přihlášení</span>
               <Toggle checked={showAuthSection} onChange={toggleAuthSection} />
            </div>

            {/* Toggle: List */}
            <div className="flex justify-between items-center">
               <span className="text-sm text-gray-600">Seznam videí</span>
               <Toggle checked={showVideoList} onChange={toggleVideoList} />
            </div>
          </div>
      </div>

      {/* 4. VIDEO LIST (Eisberg Layer 3) */}
      {showVideoList && (
        <div className="w-full max-w-xl animate-fade-in pb-10 order-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 px-1">
             Uložená videa ({videos.length})
          </h2>
          
          {videos.length > 0 ? (
            <div className="flex flex-col gap-3">
              {videos.map((video) => {
                const isOwner = user && user.id === video.user_id
                return (
                  <div key={video.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center group">
                    <div className="min-w-0 flex-1">
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block font-medium">
                        {video.url}
                      </a>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(video.created_at).toLocaleDateString('cs-CZ')}
                        {isOwner && <span className="ml-2 text-green-600 bg-green-50 px-1 rounded">Moje</span>}
                      </p>
                    </div>
                    {isOwner && (
                      <button 
                        onClick={() => handleDelete(video.id)}
                        className="ml-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Smazat video"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
              Seznam je prázdný.
            </div>
          )}
        </div>
      )}
    </main>
  )
}

// Helper Component for Toggle (Reusable)
function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  )
}