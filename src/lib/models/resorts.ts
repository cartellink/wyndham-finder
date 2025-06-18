import { supabase, convertObjectKeysToSnakeCase } from '../db'

export interface Resort {
  id: number
  locationId: number
  regionCode: string
  countryCode: string
  areaName: string
  name?: string
  description?: string
  [key: string]: unknown // Allow additional properties from the API
}

export const store = async (resort: Resort): Promise<boolean> => {
  try {
    const transformedResort = convertObjectKeysToSnakeCase(resort)

    const { error } = await supabase
      .from('resorts')
      .upsert(transformedResort)

    if (error) {
      console.error('Error inserting resort:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

export const fetch = async (id: number): Promise<Resort | null> => {
  try {
    const { data, error } = await supabase
      .from('resorts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching resort:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

export const fetchByCountryCode = async (countryCodes: string[]): Promise<Resort[]> => {
  try {
    const { data, error } = await supabase
      .from('resorts')
      .select('*')
      .in('country_code', countryCodes)

    if (error) {
      console.error('Error fetching resorts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
} 