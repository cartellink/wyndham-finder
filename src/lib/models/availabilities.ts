import { supabase, convertObjectKeysToSnakeCase } from '../db'
import { logger } from '../logger'

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

    // DEBUG: Log what we're about to store
    logger.debug('About to store availability record:', {
      original: availability,
      transformed: transformedAvailability
    })

    const { error } = await supabase
      .from('availabilities')
      .upsert(transformedAvailability)

    if (error) {
      console.error('Error inserting availability:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return false
    }

    logger.debug('Successfully stored availability record')
    return true
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

export const deleteByRoomId = async (roomId: number): Promise<boolean> => {
  try {
    logger.debug(`Deleting all availability records for room ${roomId}`)
    
    const { error } = await supabase
      .from('availabilities')
      .delete()
      .eq('room_id', roomId)

    if (error) {
      console.error(`Error deleting availability records for room ${roomId}:`, error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return false
    }

    logger.debug(`Successfully deleted availability records for room ${roomId}`)
    return true
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

export const fetch = async (roomId: number, date: string): Promise<Availability | null> => {
  try {
    const { data, error } = await supabase
      .from('availabilities')
      .select('*')
      .eq('room_id', roomId)
      .eq('date', date)
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