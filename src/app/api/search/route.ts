import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const dateStart = searchParams.get('date_start')
    const dateEnd = searchParams.get('date_end')
    const regionId = searchParams.get('region_id')
    const stayMin = searchParams.get('stay_min')
    const stayMax = searchParams.get('stay_max')
    const guestMin = searchParams.get('guest_min')
    const maxCredits = searchParams.get('max_credits')

    // Validate required parameters
    if (!dateStart || !dateEnd) {
      return NextResponse.json({ error: 'date_start and date_end are required' }, { status: 400 })
    }

    // Call the database function
    const { data, error } = await supabaseAdmin.rpc('get_filtered_rooms', {
      date_start: dateStart,
      date_end: dateEnd,
      region_id: regionId ? parseInt(regionId) : null,
      stay_min: stayMin ? parseInt(stayMin) : 3,
      stay_max: stayMax ? parseInt(stayMax) : null,
      guest_min: guestMin ? parseInt(guestMin) : 1,
      max_credits: maxCredits ? parseInt(maxCredits) : null
    })
    console.log(data)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    return NextResponse.json({ results: data })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 