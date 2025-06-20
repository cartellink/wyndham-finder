import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps region data from the scraper to a region ID in the database
 * @param regionCode - The region code from the scraper (iris_id)
 * @param countryCode - The country code
 * @param state - The state/province
 * @param areaName - The area name
 * @returns The region ID or null if no match found
 */
export async function mapRegionToId(
  regionCode?: string,
  countryCode?: string,
  state?: string,
  areaName?: string
): Promise<number | null> {
  try {
    const { supabase } = await import('./db')
    
    // Try to match by iris_id first (most reliable)
    if (regionCode) {
      const { data: regionByIris } = await supabase
        .from('regions')
        .select('id')
        .eq('iris_id', parseInt(regionCode))
        .single()
      
      if (regionByIris) {
        return regionByIris.id
      }
    }
    
    // Try to match by country and state
    if (countryCode && state) {
      const { data: regionByState } = await supabase
        .from('regions')
        .select('id')
        .eq('country_code', countryCode)
        .eq('sub_region', state)
        .single()
      
      if (regionByState) {
        return regionByState.id
      }
    }
    
    // Try to match by country only (parent region)
    if (countryCode) {
      const { data: regionByCountry } = await supabase
        .from('regions')
        .select('id')
        .eq('country_code', countryCode)
        .is('sub_region', null)
        .single()
      
      if (regionByCountry) {
        return regionByCountry.id
      }
    }
    
    // Try to match by area name
    if (areaName) {
      const { data: regionByName } = await supabase
        .from('regions')
        .select('id')
        .or(`name.ilike.%${areaName}%,name.ilike.${areaName}%`)
        .single()
      
      if (regionByName) {
        return regionByName.id
      }
    }
    
    return null
  } catch (error) {
    console.error('Error mapping region:', error)
    return null
  }
}

/**
 * Gets a formatted region name for display
 * @param region - The region object
 * @returns Formatted region name
 */
export function formatRegionName(region: {
  name: string
  continentCode: string
  countryCode?: string
  subRegion?: string
}): string {
  if (region.subRegion) {
    return `${region.name} (${region.subRegion})`
  }
  return region.name
}

/**
 * Gets a hierarchical region path
 * @param region - The region object
 * @param parentRegion - The parent region object
 * @returns Hierarchical region path
 */
export function getRegionPath(
  region: { name: string; continentCode: string; countryCode?: string },
  parentRegion?: { name: string }
): string {
  if (parentRegion) {
    return `${parentRegion.name} > ${region.name}`
  }
  return region.name
}
