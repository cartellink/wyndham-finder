import { NextResponse } from 'next/server'
import { passcodeHandler } from '@/lib/scraper/passcode-handler'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    logger.info('Received passcode webhook:', body)

    // Validate required fields
    if (!body.passcode) {
      return NextResponse.json(
        { success: false, error: 'Missing passcode' },
        { status: 400 }
      )
    }

    let success = false

    if (body.session_id) {
      // Store the passcode in the specific session (legacy/specific session flow)
      success = await passcodeHandler.storePasscode(body.session_id, body.passcode)
      logger.info(`Successfully stored passcode for session ${body.session_id}`)
    } else {
      // Store the passcode in the most recent active session (simplified flow)
      success = await passcodeHandler.storePasscodeInActiveSession(body.passcode)
      logger.info(`Successfully stored passcode in most recent active session`)
    }

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Passcode received and stored' 
      })
    } else {
      logger.error(`Failed to store passcode`)
      return NextResponse.json(
        { success: false, error: 'Failed to store passcode' },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Error processing passcode webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET requests for testing
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const passcode = searchParams.get('passcode')
  const sessionId = searchParams.get('session_id')

  if (!passcode) {
    return NextResponse.json(
      { success: false, error: 'Missing passcode parameter' },
      { status: 400 }
    )
  }

  try {
    let success = false

    if (sessionId) {
      // Specific session flow
      logger.info(`Test webhook: Received passcode ${passcode} for session ${sessionId}`)
      success = await passcodeHandler.storePasscode(sessionId, passcode)
    } else {
      // Simplified flow - store in most recent active session
      logger.info(`Test webhook: Received passcode ${passcode} for active session`)
      success = await passcodeHandler.storePasscodeInActiveSession(passcode)
    }
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: sessionId ? 
          `Passcode ${passcode} stored for session ${sessionId}` :
          `Passcode ${passcode} stored in active session`
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to store passcode' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Error processing test passcode:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 