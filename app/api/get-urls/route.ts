import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Zakáže cacheování, aby uživatel viděl vždy aktuální data
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Získání dat ze Supabase
    // Seřadíme od nejnovějšího po nejstarší
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .order('created_at', { ascending: false })

    // 2. Obsluha chyb DB
    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Návrat dat
    return NextResponse.json({ data })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}