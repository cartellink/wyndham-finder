import { supabase, convertObjectKeysToSnakeCase } from '../db'

export interface Room {
  id: number
  name?: string
  type?: string
  description?: string
  [key: string]: unknown // Allow additional properties from the API
}

export const store = async (room: Room): Promise<boolean> => {
  try {
    const transformedRoom = convertObjectKeysToSnakeCase(room)

    const { error } = await supabase
      .from('rooms')
      .upsert(transformedRoom)

    if (error) {
      console.error('Error inserting room:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

export const fetch = async (id: number): Promise<Room | null> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching room:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
} 