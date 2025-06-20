import { supabase, convertObjectKeysToSnakeCase } from '../db'
import { Region } from './regions'

export interface Resort {
  id: number
  locationId: number
  regionCode: string
  countryCode: string
  areaName: string
  name?: string
  description?: string
  regionId?: number
  region?: Region
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

export async function getResortAreas() {
  const { data, error } = await supabase
    .from("resorts")
    .select("country_code, area_name")
    .order("country_code")
    .order("area_name")

  if (error) {
    console.error("Error fetching resort areas:", error)
    return []
  }

  // Create a Set to store unique combinations
  const uniqueAreas = new Set<string>()
  data.forEach(item => {
    uniqueAreas.add(`(${item.country_code}) - ${item.area_name}`);
  });

  // Convert the Set back to an array of objects
  return Array.from(uniqueAreas).map(area => ({
    value: area,
    label: area,
  }))
}

export const fetchWithRegion = async (id: number): Promise<Resort | null> => {
  try {
    const { data, error } = await supabase
      .from('resorts')
      .select(`
        *,
        region:regions(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching resort with region:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

export const fetchByRegion = async (regionId: number): Promise<Resort[]> => {
  try {
    const { data, error } = await supabase
      .from('resorts')
      .select(`
        *,
        region:regions(*)
      `)
      .eq('region_id', regionId)

    if (error) {
      console.error('Error fetching resorts by region:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

export const fetchByIrisRegionId = async (irisRegionId: number): Promise<Resort[]> => {
  try {
    const { data, error } = await supabase
      .from('resorts')
      .select(`
        *,
        region:regions(*)
      `)
      .eq('regions.iris_id', irisRegionId)

    if (error) {
      console.error('Error fetching resorts by iris region id:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
} 