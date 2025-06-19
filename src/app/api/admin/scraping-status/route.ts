import { NextResponse } from 'next/server'

// In-memory store for scraping status (in production, use Redis or database)
const scrapingStatus = {
  isRunning: false,
  currentStep: 'Idle',
  progress: {
    resorts: { processed: 0, total: 0 },
    rooms: { processed: 0, total: 0 },
    availability: { processed: 0, total: 0 }
  },
  logs: [] as Array<{
    timestamp: string
    level: 'info' | 'error' | 'success' | 'warning'
    message: string
    details?: unknown
  }>,
  stats: {
    startTime: undefined as string | undefined,
    totalRequests: 0,
    successfulRequests: 0,
    errors: 0
  },
  apiCalls: [] as Array<{
    timestamp: string
    url: string
    method: string
    status: number
    duration: number
    payload?: unknown
    response?: unknown
    error?: boolean
  }>,
  currentUrl: undefined as string | undefined
}

export async function GET() {
  return NextResponse.json(scrapingStatus)
}

export async function POST(request: Request) {
  try {
    const update = await request.json()
    
    // Update status based on the incoming data
    if (update.isRunning !== undefined) {
      scrapingStatus.isRunning = update.isRunning
    }
    
    if (update.currentStep) {
      scrapingStatus.currentStep = update.currentStep
    }
    
    if (update.progress) {
      scrapingStatus.progress = { ...scrapingStatus.progress, ...update.progress }
    }
    
    if (update.log) {
      scrapingStatus.logs.push({
        timestamp: new Date().toISOString(),
        level: update.log.level || 'info',
        message: update.log.message,
        details: update.log.details
      })
      
      // Keep only last 100 logs
      if (scrapingStatus.logs.length > 100) {
        scrapingStatus.logs = scrapingStatus.logs.slice(-100)
      }
    }
    
    if (update.stats) {
      scrapingStatus.stats = { ...scrapingStatus.stats, ...update.stats }
    }
    
    if (update.apiCall) {
      scrapingStatus.apiCalls.push(update.apiCall)
      
      // Keep only last 50 API calls
      if (scrapingStatus.apiCalls.length > 50) {
        scrapingStatus.apiCalls = scrapingStatus.apiCalls.slice(-50)
      }
    }
    
    if (update.currentUrl) {
      scrapingStatus.currentUrl = update.currentUrl
    }
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    )
  }
}

// Export the status object so it can be used by the scraper
export { scrapingStatus } 