import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { intelligentScheduler } from '@/lib/scraper/intelligent-scheduler'
import { syncResorts, syncRooms, syncAvailabilities } from '@/lib/scraper/wyndham-scraper'

export async function POST() {
  const startTime = Date.now()
  
  try {
    logger.info('🤖 Starting intelligent scraping cron job...')
    
    // Create scraping plan
    const plan = await intelligentScheduler.createScrapingPlan()
    logger.info(`📋 Scraping plan: ${plan.reason}`)
    
    const results = {
      executed_jobs: [] as string[],
      skipped_jobs: [] as string[],
      job_results: {} as Record<string, unknown>,
      execution_time_ms: 0,
      plan: plan,
      next_scraping: await intelligentScheduler.getNextScrapingTimes()
    }
    
    // Execute only the jobs that need to be run
    if (plan.needsResorts) {
      logger.info('🏨 Executing resort sync job...')
      try {
        const resortResult = await syncResorts()
        results.executed_jobs.push('sync-resorts')
        results.job_results['sync-resorts'] = resortResult
        await intelligentScheduler.updateLastScrapedTime('resorts')
        logger.info('✅ Resort sync job completed')
      } catch (error) {
        logger.error('❌ Resort sync job failed:', error)
        results.job_results['sync-resorts'] = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    } else {
      results.skipped_jobs.push('sync-resorts')
      logger.info('⏭️ Skipping resort sync (not due)')
    }
    
    if (plan.needsRooms) {
      logger.info('🏠 Executing rooms sync job...')
      try {
        const roomResult = await syncRooms()
        results.executed_jobs.push('sync-rooms')
        results.job_results['sync-rooms'] = roomResult
        await intelligentScheduler.updateLastScrapedTime('rooms')
        logger.info('✅ Rooms sync job completed')
      } catch (error) {
        logger.error('❌ Rooms sync job failed:', error)
        results.job_results['sync-rooms'] = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    } else {
      results.skipped_jobs.push('sync-rooms')
      logger.info('⏭️ Skipping rooms sync (not due)')
    }
    
    if (plan.needsAvailabilities) {
      logger.info('📅 Executing availabilities sync job...')
      try {
        const availabilityResult = await syncAvailabilities()
        results.executed_jobs.push('sync-availabilities')
        results.job_results['sync-availabilities'] = availabilityResult
        await intelligentScheduler.updateLastScrapedTime('availabilities')
        logger.info('✅ Availabilities sync job completed')
      } catch (error) {
        logger.error('❌ Availabilities sync job failed:', error)
        results.job_results['sync-availabilities'] = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    } else {
      results.skipped_jobs.push('sync-availabilities')
      logger.info('⏭️ Skipping availabilities sync (not due)')
    }
    
    results.execution_time_ms = Date.now() - startTime
    
    const summary = `Intelligent cron completed in ${results.execution_time_ms}ms. Executed: [${results.executed_jobs.join(', ') || 'none'}], Skipped: [${results.skipped_jobs.join(', ') || 'none'}]`
    logger.info(`🎯 ${summary}`)
    
    return NextResponse.json({
      success: true,
      message: summary,
      ...results
    })
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('❌ Intelligent cron job failed:', error)
    
    return NextResponse.json({
      success: false,
      message: `Intelligent cron job failed: ${errorMessage}`,
      execution_time_ms: executionTime,
      error: errorMessage
    }, { status: 500 })
  }
} 