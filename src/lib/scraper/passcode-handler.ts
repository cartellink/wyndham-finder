// 2FA Passcode Handler for Wyndham Login
import { supabase } from '../supabase'
import { logger } from '../logger'

export interface PasscodeSession {
  id: string
  session_type: 'resort' | 'room' | 'availability' | 'auth'
  status: 'pending' | 'awaiting_passcode' | 'completed' | 'failed'
  passcode_data?: {
    emails?: Record<string, string>
    phones?: Record<string, string>
  }
  passcode_received?: string
  created_at: string
  expires_at: string
  metadata?: unknown
}

export interface PasscodeRequestData {
  emails: Record<string, string>
  phones: Record<string, string>
  status: string
}

class PasscodeHandler {
  private baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''



  // Create a new 2FA session
  async createSession(sessionType: 'resort' | 'room' | 'availability' | 'auth', passcodeData: PasscodeRequestData): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('scraping_sessions')
        .insert({
          session_type: sessionType,
          status: 'awaiting_passcode',
          passcode_data: passcodeData,
          metadata: { 
            created_by: 'wyndham-scraper',
            user_agent: 'Wyndham-Finder-Bot'
          }
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to create passcode session:', error)
        throw new Error('Failed to create passcode session')
      }

      logger.info(`Created 2FA session ${data.id} for ${sessionType}`)
      return data.id
    } catch (error) {
      logger.error('Error creating passcode session:', error)
      throw error
    }
  }

  // Request passcode via email from Wyndham
  async requestPasscode(sessionId: string, passcodeData: PasscodeRequestData, security: string, skipWyndhamRequest: boolean = false): Promise<boolean> {
    try {
      // Extract the first email hash for passcode request
      const emailHashes = Object.keys(passcodeData.emails || {})
      if (emailHashes.length === 0) {
        throw new Error('No email available for passcode request')
      }

      const selectedEmailHash = emailHashes[0]
      const selectedEmail = passcodeData.emails[selectedEmailHash]
      
      if (!skipWyndhamRequest) {
        logger.info(`Requesting passcode for session ${sessionId} via email: ${selectedEmail}`)

        // Call Wyndham API to request passcode
        const response = await fetch('https://clubwyndhamsp.com/wp-admin/admin-ajax.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'generatePasscode',
            memberid: process.env.WYNDHAM_MEMBER_ID || '',
            passcode_mode: 'EMAIL',
            passcode_contact: selectedEmailHash,
            security: security
          })
        })

        const result = await response.json()
        logger.info('Passcode request result:', result)

        if (result.status !== 'SUCCESS') {
          logger.error('Failed to request passcode:', result)
          return false
        }
      } else {
        logger.info(`Using active passcode for session ${sessionId} via email: ${selectedEmail}`)
      }

      // Always call Pipedream to start/continue monitoring for the passcode
      await this.notifyPipedream(sessionId, selectedEmail)
      return true
    } catch (error) {
      logger.error('Error requesting passcode:', error)
      return false
    }
  }

  // Trigger Pipedream to start monitoring email for passcode
  async notifyPipedream(sessionId: string, email: string): Promise<void> {
    try {
      const pipedreamUrl = 'https://eorf4dzw8uiqnxe.m.pipedream.net'
      
      // Simple trigger call - Pipedream will handle email monitoring
      logger.info(`🚀 Triggering Pipedream at ${pipedreamUrl}...`)
      
      const response = await fetch(pipedreamUrl, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`Pipedream trigger failed: ${response.statusText}`)
      }

      logger.info(`✅ Pipedream triggered successfully for email monitoring (session ${sessionId}, email: ${email})`)
    } catch (error) {
      logger.error('Failed to trigger Pipedream:', error)
      throw error
    }
  }

  // Wait for passcode to be received via webhook
  async waitForPasscode(sessionId: string, timeoutMs: number = 300000): Promise<string | null> {
    const startTime = Date.now()
    const pollInterval = 2000 // Poll every 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const { data, error } = await supabase
          .from('scraping_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (error) {
          logger.error('Error checking session status:', error)
          return null
        }

        if (data.passcode_received) {
          logger.info(`Passcode received for session ${sessionId}`)
          return data.passcode_received
        }

        if (data.status === 'failed') {
          logger.error(`Session ${sessionId} failed`)
          return null
        }

        // Check if session expired
        if (new Date(data.expires_at) < new Date()) {
          logger.error(`Session ${sessionId} expired`)
          await this.updateSessionStatus(sessionId, 'failed')
          return null
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      } catch (error) {
        logger.error('Error while waiting for passcode:', error)
        return null
      }
    }

    logger.error(`Timeout waiting for passcode for session ${sessionId}`)
    await this.updateSessionStatus(sessionId, 'failed')
    return null
  }

  // Update session status
  async updateSessionStatus(sessionId: string, status: 'pending' | 'awaiting_passcode' | 'completed' | 'failed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('scraping_sessions')
        .update({ status })
        .eq('id', sessionId)

      if (error) {
        logger.error('Failed to update session status:', error)
      }
    } catch (error) {
      logger.error('Error updating session status:', error)
    }
  }

  // Store received passcode (called by webhook)
  async storePasscode(sessionId: string, passcode: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scraping_sessions')
        .update({ 
          passcode_received: passcode,
          status: 'completed'
        })
        .eq('id', sessionId)

      if (error) {
        logger.error('Failed to store passcode:', error)
        return false
      }

      logger.info(`Stored passcode for session ${sessionId}`)
      return true
    } catch (error) {
      logger.error('Error storing passcode:', error)
      return false
    }
  }

  // Store passcode in the most recent active session (simplified webhook flow)
  async storePasscodeInActiveSession(passcode: string): Promise<boolean> {
    try {
      // Find the most recent session that's awaiting a passcode
      const { data: sessions, error: selectError } = await supabase
        .from('scraping_sessions')
        .select('*')
        .eq('status', 'awaiting_passcode')
        .order('created_at', { ascending: false })
        .limit(1)

      if (selectError || !sessions || sessions.length === 0) {
        logger.error('No active session found to store passcode:', selectError)
        return false
      }

      const session = sessions[0]
      
      // Update the session with the passcode
      const { error: updateError } = await supabase
        .from('scraping_sessions')
        .update({ 
          passcode_received: passcode,
          status: 'completed'
        })
        .eq('id', session.id)

      if (updateError) {
        logger.error('Failed to store passcode in active session:', updateError)
        return false
      }

      logger.info(`Stored passcode in active session ${session.id}`)
      return true
    } catch (error) {
      logger.error('Error storing passcode in active session:', error)
      return false
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const { error } = await supabase
        .from('scraping_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (error) {
        logger.error('Failed to cleanup expired sessions:', error)
      } else {
        logger.info('Cleaned up expired passcode sessions')
      }
    } catch (error) {
      logger.error('Error cleaning up sessions:', error)
    }
  }
}

export const passcodeHandler = new PasscodeHandler()
export { PasscodeHandler } 