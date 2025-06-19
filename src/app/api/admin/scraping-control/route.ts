import { NextResponse } from 'next/server'
import { scrapeWyndhamInventory, syncResorts, syncRooms } from '@/lib/scraper/wyndham-scraper'
import { intelligentScheduler } from '@/lib/scraper/intelligent-scheduler'
import { passcodeHandler } from '@/lib/scraper/passcode-handler'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // Get current scraping plan and scheduling info
    const plan = await intelligentScheduler.createScrapingPlan()
    const nextTimes = await intelligentScheduler.getNextScrapingTimes()
    const frequencies = intelligentScheduler.getFrequencySettings()
    
    return NextResponse.json({
      success: true,
      scraping_plan: plan,
      next_scraping_times: nextTimes,
      frequency_settings: frequencies,
      should_run_scraping: await intelligentScheduler.shouldRunScraping()
    })
  } catch (error) {
    logger.error('Error getting scraping control info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get scraping info' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, force = false } = body
    
    logger.info(`Scraping control action: ${action}`, { force })
    
    switch (action) {
      case 'intelligent_scrape':
        // Run intelligent scraping based on frequencies
        const result = await scrapeWyndhamInventory()
        return NextResponse.json({
          success: true,
          message: 'Intelligent scraping completed',
          data: result
        })
        
      case 'force_resorts':
        // Force resort scraping regardless of frequency
        const resortResult = await syncResorts()
        await intelligentScheduler.updateLastScrapedTime('resorts')
        return NextResponse.json({
          success: true,
          message: 'Resort scraping completed',
          data: resortResult
        })
        
      case 'force_rooms':
        // Force room scraping regardless of frequency
        const roomResult = await syncRooms()
        await intelligentScheduler.updateLastScrapedTime('rooms')
        await intelligentScheduler.updateLastScrapedTime('availabilities')
        return NextResponse.json({
          success: true,
          message: 'Room and availability scraping completed',
          data: roomResult
        })
        
      case 'cleanup_sessions':
        // Clean up expired 2FA sessions
        await passcodeHandler.cleanupExpiredSessions()
        return NextResponse.json({
          success: true,
          message: 'Expired sessions cleaned up'
        })
        
      case 'check_plan':
        // Just return the current scraping plan
        const currentPlan = await intelligentScheduler.createScrapingPlan()
        return NextResponse.json({
          success: true,
          plan: currentPlan,
          should_scrape: currentPlan.needsResorts || currentPlan.needsRooms || currentPlan.needsAvailabilities
        })
        
      case 'check_sessions':
        // Check active 2FA sessions
        const { supabase } = await import('@/lib/supabase')
        const { data: sessions } = await supabase
          .from('scraping_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
        
        return NextResponse.json({
          success: true,
          sessions: sessions || []
        })
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    logger.error('Error in scraping control:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Scraping control failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 