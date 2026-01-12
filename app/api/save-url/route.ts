import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Inicializace Supabase Server Clienta (pro Auth check)
    // Toto je klíčová změna - používáme cookies pro ověření session
    const supabase = await createClient()

    // 2. AUTH GUARD (Gatekeeper)
    // Získáme uživatele ze session. Pokud neexistuje, vracíme 401.
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Pro uložení videa se musíte přihlásit.' },
        { status: 401 }
      )
    }

    // 3. Přečtení dat z požadavku
    const body = await request.json()
    const { url } = body

    // 4. Validace URL
    let isValidUrl = false
    try {
      const parsedUrl = new URL(url)
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        isValidUrl = true
      }
    } catch (e) {
      isValidUrl = false
    }

    if (!url || typeof url !== 'string' || !isValidUrl) {
      return NextResponse.json(
        { error: 'Neplatný formát URL.' },
        { status: 400 }
      )
    }

    // 5. Vložení do Supabase s user_id
    // Nyní explicitně přidáváme user_id, aby RLS politika "Auth Insert" prošla.
    const { data, error } = await supabase
      .from('urls')
      .insert([
        { 
          url: url,
          user_id: user.id // Připojíme vlastníka
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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