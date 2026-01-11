import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Přečtení dat z požadavku
    const body = await request.json()
    const { url } = body

    // 2. ROBUSTNÍ VALIDACE (FIXED ISSUE-002)
    // Místo regexu použijeme nativní URL konstruktor, který je přesnější
    // a správně zpracuje query parametry (?v=...)
    let isValidUrl = false
    try {
      const parsedUrl = new URL(url)
      // Musí to být http nebo https
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        isValidUrl = true
      }
    } catch (e) {
      isValidUrl = false
    }

    if (!url || typeof url !== 'string') {
       return NextResponse.json(
        { error: 'URL adresa chybí nebo není text.' },
        { status: 400 }
      )
    }

    if (!isValidUrl) {
      return NextResponse.json(
        { error: 'Neplatný formát URL. Ujistěte se, že adresa obsahuje http:// nebo https://' },
        { status: 400 }
      )
    }

    // 3. Vložení do Supabase
    const { data, error } = await supabase
      .from('urls')
      .insert([{ url: url }])
      .select()

    // 4. Obsluha chyb z databáze
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 5. Úspěch
    return NextResponse.json({
      success: true,
      message: 'URL adresa videa úspěšně uložena.',
      data
    })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}