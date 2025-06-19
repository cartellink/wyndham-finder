// Intelligent Scraping Scheduler
// Determines what needs to be scraped based on frequency requirements
import { supabase } from '../supabase'
import { logger } from '../logger'

export interface ScrapingPlan {
  needsResorts: boolean
  needsRooms: boolean
  needsAvailabilities: boolean
  lastScrapedResorts?: string
  lastScrapedRooms?: string
  lastScrapedAvailabilities?: string
  reason: string
}

export interface ScrapingFrequencies {
  resorts: number // milliseconds
  rooms: number // milliseconds
  availabilities: number // milliseconds
}

class IntelligentScheduler {
  // Default frequencies
  private frequencies: ScrapingFrequencies = {
    resorts: 30 * 24 * 60 * 60 * 1000, // 30 days
    rooms: 30 * 24 * 60 * 60 * 1000,   // 30 days
    availabilities: 15 * 60 * 1000     // 15 minutes
  }

  constructor(customFrequencies?: Partial<ScrapingFrequencies>) {
    if (customFrequencies) {
      this.frequencies = { ...this.frequencies, ...customFrequencies }
    }
  }

  // Determine what needs to be scraped
  async createScrapingPlan(): Promise<ScrapingPlan> {
    const now = new Date()
    
    try {
      // Check if scraping is needed for each data type
      const [resortsCheck, roomsCheck, availabilitiesCheck] = await Promise.all([
        this.getLastScrapedTime('resorts'),
        this.getLastScrapedTime('rooms'), 
        this.getLastScrapedTime('availabilities')
      ])

      const plan: ScrapingPlan = {
        needsResorts: this.shouldScrape(resortsCheck, this.frequencies.resorts, now),
        needsRooms: this.shouldScrape(roomsCheck, this.frequencies.rooms, now),
        needsAvailabilities: this.shouldScrape(availabilitiesCheck, this.frequencies.availabilities, now),
        lastScrapedResorts: resortsCheck?.toISOString(),
        lastScrapedRooms: roomsCheck?.toISOString(),
        lastScrapedAvailabilities: availabilitiesCheck?.toISOString(),
        reason: ''
      }

      // Generate reason
      const reasons = []
      if (plan.needsResorts) {
        const age = resortsCheck ? Math.round((now.getTime() - resortsCheck.getTime()) / (24 * 60 * 60 * 1000)) : 'never'
        reasons.push(`Resorts (last: ${age} days ago)`)
      }
      if (plan.needsRooms) {
        const age = roomsCheck ? Math.round((now.getTime() - roomsCheck.getTime()) / (24 * 60 * 60 * 1000)) : 'never'
        reasons.push(`Rooms (last: ${age} days ago)`)
      }
      if (plan.needsAvailabilities) {
        const age = availabilitiesCheck ? Math.round((now.getTime() - availabilitiesCheck.getTime()) / (60 * 1000)) : 'never'
        reasons.push(`Availabilities (last: ${age} min ago)`)
      }

      plan.reason = reasons.length > 0 ? reasons.join(', ') : 'No scraping needed'

      logger.info('Scraping plan created:', plan)
      return plan

    } catch (error) {
      logger.error('Error creating scraping plan:', error)
      // Default to scraping everything if we can't determine
      return {
        needsResorts: true,
        needsRooms: true,
        needsAvailabilities: true,
        reason: 'Error determining plan - defaulting to full scrape'
      }
    }
  }

  // Check if data type should be scraped based on frequency
  private shouldScrape(lastScraped: Date | null, frequencyMs: number, now: Date): boolean {
    if (!lastScraped) {
      return true // Never scraped before
    }

    const timeSinceLastScrape = now.getTime() - lastScraped.getTime()
    return timeSinceLastScrape >= frequencyMs
  }

  // Check if any records need scraping based on frequency threshold
  private async getLastScrapedTime(tableName: string): Promise<Date | null> {
    try {
      const now = new Date()
      const frequency = this.frequencies[tableName as keyof ScrapingFrequencies]
      const thresholdTime = new Date(now.getTime() - frequency)
      
      // Check if there are any records older than the frequency threshold
      // or records that have never been scraped
      const { error } = await supabase
        .from(tableName)
        .select('last_scraped_at')
        .or(`last_scraped_at.is.null,last_scraped_at.lt.${thresholdTime.toISOString()}`)
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No outdated records found - check if any records exist at all
          const { data: anyData, error: anyError } = await supabase
            .from(tableName)
            .select('last_scraped_at')
            .limit(1)
            .single()
          
          if (anyError && anyError.code === 'PGRST116') {
            // No records exist at all - needs scraping
            return null
          } else if (anyData) {
            // Records exist and none are outdated - return the most recent
            const { data: recentData, error: recentError } = await supabase
              .from(tableName)
              .select('last_scraped_at')
              .not('last_scraped_at', 'is', null)
              .order('last_scraped_at', { ascending: false })
              .limit(1)
              .single()
            
            if (recentError) {
              return null
            }
            return recentData?.last_scraped_at ? new Date(recentData.last_scraped_at) : null
          }
          return null
        }
        logger.error(`Error getting last scraped time for ${tableName}:`, error)
        return null
      }

      // Found outdated records - return null to indicate scraping is needed
      return null
    } catch (error) {
      logger.error(`Error checking last scraped time for ${tableName}:`, error)
      return null
    }
  }

  // Update last scraped time for a data type
  async updateLastScrapedTime(tableName: string, scrapedAt: Date = new Date()): Promise<boolean> {
    try {
      let query = supabase
        .from(tableName)
        .update({ last_scraped_at: scrapedAt.toISOString() })

      // Handle different table structures
      if (tableName === 'availabilities') {
        // availabilities table uses composite primary key (room_id, date), not id
        query = query.gte('room_id', 0) // Update all records where room_id >= 0
      } else {
        // resorts and rooms tables have id column
        query = query.gte('id', 0) // Update all records where id >= 0
      }

      const { error } = await query

      if (error) {
        logger.error(`Error updating last scraped time for ${tableName}:`, error)
        return false
      }

      logger.info(`Updated last scraped time for ${tableName}`)
      return true
    } catch (error) {
      logger.error(`Error updating last scraped time for ${tableName}:`, error)
      return false
    }
  }

  // Get next scraping times for monitoring
  async getNextScrapingTimes(): Promise<Record<string, string>> {
    const plan = await this.createScrapingPlan()

    const next = {
      resorts: 'Not scheduled',
      rooms: 'Not scheduled', 
      availabilities: 'Not scheduled'
    }

    if (!plan.needsResorts && plan.lastScrapedResorts) {
      const nextResorts = new Date(new Date(plan.lastScrapedResorts).getTime() + this.frequencies.resorts)
      next.resorts = nextResorts.toLocaleString()
    } else if (plan.needsResorts) {
      next.resorts = 'Ready now'
    }

    if (!plan.needsRooms && plan.lastScrapedRooms) {
      const nextRooms = new Date(new Date(plan.lastScrapedRooms).getTime() + this.frequencies.rooms)
      next.rooms = nextRooms.toLocaleString()
    } else if (plan.needsRooms) {
      next.rooms = 'Ready now'
    }

    if (!plan.needsAvailabilities && plan.lastScrapedAvailabilities) {
      const nextAvail = new Date(new Date(plan.lastScrapedAvailabilities).getTime() + this.frequencies.availabilities)
      next.availabilities = nextAvail.toLocaleString()
    } else if (plan.needsAvailabilities) {
      next.availabilities = 'Ready now'
    }

    return next
  }

  // Check if any scraping is needed
  async shouldRunScraping(): Promise<boolean> {
    const plan = await this.createScrapingPlan()
    return plan.needsResorts || plan.needsRooms || plan.needsAvailabilities
  }

  // Get human-readable frequency settings
  getFrequencySettings(): Record<string, string> {
    return {
      resorts: this.formatDuration(this.frequencies.resorts),
      rooms: this.formatDuration(this.frequencies.rooms),
      availabilities: this.formatDuration(this.frequencies.availabilities)
    }
  }

  // Format duration in milliseconds to human readable string
  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / (60 * 1000))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`
    }
  }
}

export const intelligentScheduler = new IntelligentScheduler()
export { IntelligentScheduler } 