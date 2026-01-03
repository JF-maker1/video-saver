import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Přečtení dat z požadavku
    const body = await request.json()
    const { url } = body

    // 2. Jednoduchá validace
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Neplatná URL adresa. Musí začínat http:// nebo https://' },
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
      message: 'URL adresa videa uložena do databáze aplikace',
      data
    })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}