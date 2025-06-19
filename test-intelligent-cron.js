#!/usr/bin/env node

// Test script for the intelligent cron endpoint
// This demonstrates how the single cron job intelligently determines what to run

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testIntelligentCron() {
  console.log('🤖 Testing Intelligent Cron Job...')
  console.log(`Calling: ${BASE_URL}/api/cron/intelligent-scrape`)
  
  try {
    const response = await fetch(`${BASE_URL}/api/cron/intelligent-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const result = await response.json()
    
    console.log('\n📊 Results:')
    console.log(`Status: ${response.ok ? '✅ Success' : '❌ Failed'}`)
    console.log(`Message: ${result.message}`)
    console.log(`Execution Time: ${result.execution_time_ms}ms`)
    
    if (result.executed_jobs?.length > 0) {
      console.log(`\n🏃 Executed Jobs: ${result.executed_jobs.join(', ')}`)
      for (const job of result.executed_jobs) {
        const jobResult = result.job_results[job]
        if (jobResult?.success) {
          console.log(`  ✅ ${job}: ${jobResult.message}`)
          if (jobResult.data) {
            const data = jobResult.data
            console.log(`     📈 Stats: ${JSON.stringify(data)}`)
          }
        } else {
          console.log(`  ❌ ${job}: ${jobResult?.error || 'Unknown error'}`)
        }
      }
    }
    
    if (result.skipped_jobs?.length > 0) {
      console.log(`\n⏭️  Skipped Jobs: ${result.skipped_jobs.join(', ')}`)
    }
    
    if (result.plan) {
      console.log(`\n📋 Scraping Plan:`)
      console.log(`  Reason: ${result.plan.reason}`)
      console.log(`  Needs Resorts: ${result.plan.needsResorts}`)
      console.log(`  Needs Rooms: ${result.plan.needsRooms}`)
      console.log(`  Needs Availabilities: ${result.plan.needsAvailabilities}`)
    }
    
    if (result.next_scraping) {
      console.log(`\n📅 Next Scheduled:`)
      console.log(`  Resorts: ${result.next_scraping.resorts}`)
      console.log(`  Rooms: ${result.next_scraping.rooms}`)
      console.log(`  Availabilities: ${result.next_scraping.availabilities}`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testIntelligentCron().catch(console.error) 