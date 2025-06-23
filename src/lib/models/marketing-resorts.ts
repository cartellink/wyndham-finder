import { supabase } from '../supabase'
import { logger } from '../logger'

// Interface for marketing resort data
export interface MarketingResort {
  id?: number
  name: string
  url: string
  image_urls?: string[] // Array of gallery image URLs
  hero_image_url?: string
  excerpt?: string
  resort_id?: string
  slug?: string
  matched_resort_id?: number
  match_method?: 'resortId' | 'name' | 'slug' | 'none'
  match_confidence?: number
  meta_description?: string
  og_title?: string
  og_description?: string
  additional_info?: Record<string, unknown>
  created_at?: string
  updated_at?: string

}

// Store or update a marketing resort
export const store = async (marketingResort: MarketingResort): Promise<boolean> => {
  try {
    // Try to find existing resort by URL first
    const { data: existing } = await supabase
      .from('marketing_resorts')
      .select('id')
      .eq('url', marketingResort.url)
      .single()

    let result
    if (existing) {
      // Update existing record
      result = await supabase
        .from('marketing_resorts')
        .update({
          ...marketingResort
        })
        .eq('id', existing.id)
    } else {
      // Insert new record
      result = await supabase
        .from('marketing_resorts')
        .insert([{
          ...marketingResort
        }])
    }

    if (result.error) {
      logger.error('Failed to store marketing resort', {
        error: result.error,
        resort: marketingResort.name
      })
      return false
    }

    logger.info(`Successfully ${existing ? 'updated' : 'stored'} marketing resort: ${marketingResort.name}`)
    return true

  } catch (error) {
    logger.error('Error storing marketing resort', {
      error,
      resort: marketingResort.name
    })
    return false
  }
}

// Store multiple marketing resorts
export const storeMultiple = async (marketingResorts: MarketingResort[]): Promise<number> => {
  let successCount = 0
  
  for (const resort of marketingResorts) {
    const success = await store(resort)
    if (success) {
      successCount++
    }
  }
  
  return successCount
}

// Get all marketing resorts
export const fetchAll = async (): Promise<MarketingResort[]> => {
  try {
    const { data, error } = await supabase
      .from('marketing_resorts')
      .select('*')
      .order('name')

    if (error) {
      logger.error('Failed to fetch marketing resorts', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error fetching marketing resorts', error)
    return []
  }
}

// Get marketing resorts with their matched database resorts
export const fetchWithMatches = async (): Promise<Array<MarketingResort & { matched_resort?: unknown }>> => {
  try {
    const { data, error } = await supabase
      .from('marketing_resorts')
      .select(`
        *,
        matched_resort:resorts(*)
      `)
      .order('name')

    if (error) {
      logger.error('Failed to fetch marketing resorts with matches', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error fetching marketing resorts with matches', error)
    return []
  }
}

// Get unmatched marketing resorts
export const fetchUnmatched = async (): Promise<MarketingResort[]> => {
  try {
    const { data, error } = await supabase
      .from('marketing_resorts')
      .select('*')
      .is('matched_resort_id', null)
      .order('name')

    if (error) {
      logger.error('Failed to fetch unmatched marketing resorts', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error fetching unmatched marketing resorts', error)
    return []
  }
}

// Update match information for a marketing resort
export const updateMatch = async (
  marketingResortId: number, 
  matchedResortId: number | null, 
  matchMethod: 'resortId' | 'name' | 'slug' | 'none',
  confidence: number = 1.0
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('marketing_resorts')
      .update({
        matched_resort_id: matchedResortId,
        match_method: matchMethod,
        match_confidence: confidence
      })
      .eq('id', marketingResortId)

    if (error) {
      logger.error('Failed to update marketing resort match', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error updating marketing resort match', error)
    return false
  }
}

// Get marketing resort by resort_id (for matching)
export const fetchByResortId = async (resortId: string): Promise<MarketingResort | null> => {
  try {
    const { data, error } = await supabase
      .from('marketing_resorts')
      .select('*')
      .eq('resort_id', resortId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      logger.error('Failed to fetch marketing resort by resort_id', error)
      return null
    }

    return data || null
  } catch (error) {
    logger.error('Error fetching marketing resort by resort_id', error)
    return null
  }
}

// Search marketing resorts by name
export const searchByName = async (searchTerm: string): Promise<MarketingResort[]> => {
  try {
    const { data, error } = await supabase
      .from('marketing_resorts')
      .select('*')
      .textSearch('name', searchTerm)
      .order('name')

    if (error) {
      logger.error('Failed to search marketing resorts by name', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error searching marketing resorts by name', error)
    return []
  }
}

// Get statistics about marketing resorts
export const getStats = async (): Promise<{
  total: number
  matched: number
  unmatched: number
}> => {
  try {
    const [totalResult, matchedResult] = await Promise.all([
      supabase
        .from('marketing_resorts')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('marketing_resorts')
        .select('id', { count: 'exact', head: true })
        .not('matched_resort_id', 'is', null)
    ])

    const total = totalResult.count || 0
    const matched = matchedResult.count || 0
    const unmatched = total - matched

    return {
      total,
      matched,
      unmatched
    }
  } catch (error) {
    logger.error('Error getting marketing resorts stats', error)
    return {
      total: 0,
      matched: 0,
      unmatched: 0
    }
  }
} 