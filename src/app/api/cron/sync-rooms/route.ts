import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('🏠 Starting rooms/availability sync cron job...')
    
    // Import the scraper functions dynamically to avoid import issues
    const { syncRooms } = await import('@/lib/scraper/wyndham-scraper')
    const result = await syncRooms()
    
    console.log('✅ Rooms sync completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Rooms and availability sync completed successfully',
      data: result.data
    })
    
  } catch (error) {
    console.error('❌ Rooms sync failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Rooms sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Manual trigger
export async function POST(request: Request) {
  try {
    // Try to parse JSON body, but don't fail if there isn't one
    let body = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      // No body or invalid JSON, use empty object
    }
    
    console.log('🔄 Manual rooms sync triggered:', body)
    
    const { syncRooms } = await import('@/lib/scraper/wyndham-scraper')
    const result = await syncRooms()
    
    return NextResponse.json({
      success: true,
      message: 'Manual rooms sync completed successfully',
      data: result.data
    })
    
  } catch (error) {
    console.error('❌ Manual rooms sync failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger manual rooms sync' },
      { status: 500 }
    )
  }
} 