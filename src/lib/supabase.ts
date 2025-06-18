import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that need elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Types for database tables (you'll need to update these based on your schema)
export interface Resort {
  id: string
  name: string
  location: string
  description?: string
  amenities: string[]
  image_url?: string
  rating?: number
  created_at: string
  updated_at: string
}

export interface RoomInventory {
  id: string
  resort_id: string
  room_type: string
  max_guests: number
  credits_required: number
  available_dates: string[]
  check_in_date: string
  check_out_date: string
  status: 'available' | 'waitlist' | 'unavailable'
  scraped_at: string
  created_at: string
  updated_at: string
} 