import { supabase, convertObjectKeysToSnakeCase } from '../db'

export interface Availability {
  roomId: number
  date: string
  availability_status: number
  point: number
  [key: string]: unknown // Allow additional properties from the API
}

export const store = async (availability: Availability): Promise<boolean> => {
  try {
    const transformedAvailability = convertObjectKeysToSnakeCase(availability)

    const { error } = await supabase
      .from('availabilities')
      .upsert(transformedAvailability)

    if (error) {
      console.error('Error inserting availability:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

export const fetch = async (id: number): Promise<Availability | null> => {
  try {
    const { data, error } = await supabase
      .from('availabilities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching availability:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
} 