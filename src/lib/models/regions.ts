import { supabase } from '../supabase'
import { convertObjectKeysToSnakeCase, convertObjectKeysToCamelCase } from '../db'

export interface Region {
  id: number
  irisId: number
  name: string
  continentCode: string
  countryCode?: string
  subRegion?: string
  parentRegionId?: number
  createdAt?: string
  updatedAt?: string
}

export interface RegionWithParent extends Region {
  parentRegion?: Region
}

export const store = async (region: Region): Promise<boolean> => {
  try {
    const transformedRegion = convertObjectKeysToSnakeCase(region)

    const { error } = await supabase
      .from('regions')
      .upsert(transformedRegion)

    if (error) {
      console.error('Error inserting region:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

export const fetch = async (id: number): Promise<Region | null> => {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching region:', error)
      return null
    }

    return convertObjectKeysToCamelCase(data) as Region
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

export const fetchByIrisId = async (irisId: number): Promise<Region | null> => {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('iris_id', irisId)
      .single()

    if (error) {
      console.error('Error fetching region by iris_id:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

export const fetchByContinent = async (continentCode: string): Promise<Region[]> => {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('continent_code', continentCode)
      .order('name')

    if (error) {
      console.error('Error fetching regions by continent:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

export const fetchByCountry = async (countryCode: string): Promise<Region[]> => {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('country_code', countryCode)
      .order('name')

    if (error) {
      console.error('Error fetching regions by country:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

export const fetchParentRegions = async (): Promise<Region[]> => {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .is('parent_region_id', null)
      .order('continent_code')
      .order('name')

    if (error) {
      console.error('Error fetching parent regions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

export const fetchSubRegions = async (parentRegionId: number): Promise<Region[]> => {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('parent_region_id', parentRegionId)
      .order('name')

    if (error) {
      console.error('Error fetching sub regions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

export const getAllRegions = async (): Promise<Region[]> => {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('continent_code')
      .order('country_code')
      .order('name')

    if (error) {
      console.error('Error fetching all regions:', error)
      return []
    }

    return convertObjectKeysToCamelCase(data || []) as Region[]
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

export const getRegionsForSelect = async (): Promise<{ value: string; label: string }[]> => {
  try {
    const regions = await getAllRegions()
    
    return regions.map(region => ({
      value: region.irisId.toString(),
      label: `${region.continentCode}-(${region.countryCode}) ${region.name}`
    }))
  } catch (error) {
    console.error('Error getting regions for select:', error)
    return []
  }
} 