// Authentication Session Manager for Wyndham
// Handles persistent login sessions and 2FA only when needed
import { supabase } from '../supabase'
import { logger } from '../logger'
import { passcodeHandler, PasscodeRequestData } from './passcode-handler'
import type { AxiosInstance } from 'axios'
import type { CookieJar } from 'tough-cookie'

// Monitoring interface (copied from wyndham-scraper to avoid circular dependency)


export interface AuthSession {
  id: string
  cookies: string // Serialized cookie jar
  expires_at: string
  created_at: string
  last_used_at: string
  is_valid: boolean
  user_agent?: string
}

export interface LoginResponse {
  status: 'SUCCESS' | 'PASSCODE_REQUIRED' | 'PASSCODE_REQUIRED_ACTIVE' | string
  passcode_data?: PasscodeRequestData
  [key: string]: unknown
}

class AuthSessionManager {
  private static instance: AuthSessionManager
  private currentSession: AuthSession | null = null
  private cookieJar: CookieJar | null = null // Will store the axios cookie jar

  private constructor() {}

  private async log(level: 'info' | 'error' | 'success' | 'warning', message: string, details?: unknown) {
    const loggerMethod = level === 'success' ? 'info' : level === 'warning' ? 'warn' : level
    logger[loggerMethod](message, details)
  }

  static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager()
    }
    return AuthSessionManager.instance
  }

  // Check if we have a valid existing session
  async hasValidSession(): Promise<boolean> {
    try {
      // Try to load session from database
      const session = await this.loadSessionFromDB()
      
      if (!session) {
        logger.info('No existing auth session found')
        return false
      }

      // Check if session is expired
      if (new Date(session.expires_at) <= new Date()) {
        logger.info('Auth session expired, will need to re-authenticate')
        await this.invalidateSession(session.id)
        return false
      }

      // Load cookies into current session
      this.currentSession = session
      if (session.cookies) {
        try {
          // Restore cookie jar from stored data
          const { CookieJar } = await import('tough-cookie')
          this.cookieJar = new CookieJar()
          const cookieData = JSON.parse(session.cookies) as string[]
          
          logger.info(`Attempting to restore ${cookieData.length} cookies from session`)
          
          // Restore cookies to jar
          let restoredCount = 0
          for (const cookie of cookieData) {
            try {
              await this.cookieJar.setCookie(cookie, 'https://clubwyndhamsp.com')
              restoredCount++
            } catch (cookieError) {
              logger.warn(`Failed to restore cookie: ${cookie.substring(0, 50)}...`, cookieError)
            }
          }
          
          logger.info(`Restored auth session ${session.id} with ${restoredCount}/${cookieData.length} cookies, expires in ${Math.round((new Date(session.expires_at).getTime() - Date.now()) / (60 * 60 * 1000))} hours`)
          return restoredCount > 0
        } catch (error) {
          logger.error('Failed to restore cookie jar:', error)
          await this.invalidateSession(session.id)
          return false
        }
      } else {
        logger.warn('Session found but no cookies stored')
        await this.invalidateSession(session.id)
        return false
      }

      return false
    } catch (error) {
      logger.error('Error checking session validity:', error)
      return false
    }
  }

  // Get the current cookie jar for making authenticated requests
  getCookieJar(): CookieJar | null {
    return this.cookieJar
  }

  // Perform login with 2FA support (only when needed)
  async ensureAuthenticated(axiosClient: AxiosInstance): Promise<boolean> {
    try {
      // First check if we have a valid session
      if (await this.hasValidSession()) {
        // Make sure the axios client uses our cookie jar
        if (this.cookieJar) {
          axiosClient.defaults.jar = this.cookieJar
          await this.log('info', '🍪 Assigned saved cookie jar to axios client')
        }
        await this.updateLastUsed()
        await this.log('success', '✅ Using existing valid authentication session')
        return true
      }

      await this.log('info', '🔐 No valid session found, performing authentication...')

      // Get security nonce
      const security = await this.getSecurity(axiosClient)
      
      // Attempt login
      const loginResponse = await this.performLogin(axiosClient, security)

              if (loginResponse.status === "SUCCESS") {
          // Login successful, save session
          if (axiosClient.defaults.jar) {
            await this.saveSession(axiosClient.defaults.jar as CookieJar)
          }
          await this.log('success', '✅ Authentication successful, session saved')
          return true
          
        } else if (loginResponse.status === "PASSCODE_REQUIRED" || loginResponse.status === "PASSCODE_REQUIRED_ACTIVE") {
          const isActivePasscode = loginResponse.status === "PASSCODE_REQUIRED_ACTIVE"
          await this.log('warning', `🔑 2FA required ${isActivePasscode ? '(active passcode)' : ''}, handling passcode flow...`)
          
          // Handle 2FA - skip Wyndham API call if passcode is already active
          const success = await this.handle2FA(axiosClient, loginResponse, security, isActivePasscode)
          if (success && axiosClient.defaults.jar) {
            await this.saveSession(axiosClient.defaults.jar as CookieJar)
            await this.log('success', '✅ 2FA authentication successful, session saved')
            return true
          }
          
          return false
        } else {
          await this.log('error', '❌ Authentication failed', loginResponse)
          return false
        }
    } catch (error) {
      logger.error('❌ Authentication error:', error)
      return false
    }
  }

  // Get security nonce
  private async getSecurity(axiosClient: AxiosInstance): Promise<string> {
    const url = 'http://clubwyndhamsp.com'
    const startTime = Date.now()
    
    try {
      const response = await axiosClient.get(url)
      const duration = Date.now() - startTime
      logger.info(`Security nonce API call: ${response.status} (${duration}ms)`)
      
      const cheerio = await import('cheerio')
      const $ = cheerio.load(response.data)
      const text = $('#custom-js-extra').html()
      
      if (!text) {
        throw new Error('Could not find security nonce')
      }
      
      const findAndClean = (target: string, variable: string): string => {
        const chopFront = target.substring(target.search(variable) + variable.length, target.length)
        const result = chopFront.substring(0, chopFront.search(';'))
        return result
      }
      
      const findAndClean2 = findAndClean(text, 'var ajax_object =')
      const ajaxObject = JSON.parse(findAndClean2) as { ajax_nonce: string }
      
      return ajaxObject.ajax_nonce
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Security nonce API call failed: ${errorMessage} (${duration}ms)`)
      throw error
    }
  }

  // Perform basic login attempt
  private async performLogin(axiosClient: AxiosInstance, security: string): Promise<LoginResponse> {
    const url = 'https://clubwyndhamsp.com/wp-admin/admin-ajax.php'
    const startTime = Date.now()
    
    const params = new URLSearchParams({
      action: 'whpp_login',
      memberid: process.env.WYNDHAM_MEMBER_ID || '',
      password: process.env.WYNDHAM_PASSWORD || '',
      security
    })

    // Create payload for logging (with redacted password)
    const logPayload = {
      action: 'whpp_login',
      memberid: process.env.WYNDHAM_MEMBER_ID || '',
      password: '***REDACTED***',
      security
    }

    try {
      const response = await axiosClient.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      })

      const duration = Date.now() - startTime
      logger.info(`Login API call: ${response.status} (${duration}ms)`, logPayload)

      return response.data as LoginResponse
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Login API call failed: ${errorMessage} (${duration}ms)`, logPayload)
      throw error
    }
  }

  // Handle 2FA flow for active passcodes (no email selection needed)


  // Handle 2FA flow
  private async handle2FA(axiosClient: AxiosInstance, loginResponse: LoginResponse, security: string, skipPasscodeRequest: boolean = false): Promise<boolean> {
    try {
      let passcodeData = loginResponse.passcode_data as PasscodeRequestData
      
      // For active passcodes, the response might not include passcode_data
      // In this case, try to get it from a recent session
      if (!passcodeData && skipPasscodeRequest) {
        await this.log('info', '🔍 No passcode data in response, checking recent sessions...')
        
        const { supabase } = await import('../supabase')
        const { data: recentSessions } = await supabase
          .from('scraping_sessions')
          .select('*')
          .eq('session_type', 'auth')
          .not('passcode_data', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (recentSessions && recentSessions.length > 0) {
          passcodeData = recentSessions[0].passcode_data as PasscodeRequestData
          await this.log('info', '✅ Found passcode data from recent session')
        } else {
          throw new Error('No passcode data available for active passcode')
        }
      }
      
      const sessionId = await passcodeHandler.createSession('auth', passcodeData)
      
      if (!skipPasscodeRequest) {
        // Request passcode via email
        const requestSuccess = await passcodeHandler.requestPasscode(sessionId, passcodeData, security, false)
        
        if (!requestSuccess) {
          throw new Error('Failed to request passcode')
        }
        
        await this.log('info', '📧 Passcode requested via email, waiting for response...')
      } else {
        // Use existing active passcode - just start monitoring
        const requestSuccess = await passcodeHandler.requestPasscode(sessionId, passcodeData, security, true)
        
        if (!requestSuccess) {
          throw new Error('Failed to start monitoring for active passcode')
        }
        
        await this.log('info', '📧 Using active passcode, waiting for response...')
      }
      
      // Wait for passcode (5 minute timeout)
      const passcode = await passcodeHandler.waitForPasscode(sessionId, 300000)
      
      if (!passcode) {
        await this.log('error', '❌ Failed to receive passcode within timeout')
        throw new Error('Failed to receive passcode within timeout')
      }
      
      await this.log('success', '✅ Passcode received, completing authentication...')
      
      // Complete login with passcode
      const finalUrl = 'https://clubwyndhamsp.com/wp-admin/admin-ajax.php'
      const finalStartTime = Date.now()
      
      const memberid = process.env.WYNDHAM_MEMBER_ID || '00201212050'
      
      const finalPayload = {
        action: 'validatePasscode',
        memberid: memberid,
        passcode: passcode,
        security
      }

      const finalParams = new URLSearchParams(finalPayload)

      try {
        const finalResponse = await axiosClient.post(finalUrl, finalParams, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        })
        
        const finalDuration = Date.now() - finalStartTime
        logger.info(`2FA validation API call: ${finalResponse.status} (${finalDuration}ms)`)
        
        const finalResult = finalResponse.data
      
        // Check for success - validatePasscode returns {status: true} on success
        if (finalResult.status === true || finalResult.status === "SUCCESS") {
          await this.log('success', '✅ 2FA verification successful')
          return true
        } else {
          await this.log('error', '❌ 2FA verification failed', finalResult)
          return false
        }
      } catch (error) {
        const finalDuration = Date.now() - finalStartTime
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`2FA validation API call failed: ${errorMessage} (${finalDuration}ms)`)
        await this.log('error', '❌ 2FA verification API call failed', error)
        return false
      }
    } catch (error) {
      logger.error('❌ 2FA handling failed:', error)
      return false
    }
  }

  // Save current session to database
  private async saveSession(cookieJar: CookieJar): Promise<void> {
    try {
      // Serialize cookies
      const cookies = await cookieJar.getSetCookieStrings('https://clubwyndhamsp.com')
      const cookiesJson = JSON.stringify(cookies)

      // Calculate expiration (24 hours from now)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      const { data, error } = await supabase
        .from('auth_sessions')
        .upsert({
          id: 'wyndham-auth', // Single session ID
          cookies: cookiesJson,
          expires_at: expiresAt.toISOString(),
          last_used_at: new Date().toISOString(),
          is_valid: true,
          user_agent: 'Wyndham-Finder-Bot'
        }, {
          onConflict: 'id'
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to save auth session:', error)
        return
      }

      this.currentSession = data
      this.cookieJar = cookieJar
      logger.info(`Auth session saved, expires at ${expiresAt.toISOString()}`)
    } catch (error) {
      logger.error('Error saving auth session:', error)
    }
  }

  // Load session from database
  private async loadSessionFromDB(): Promise<AuthSession | null> {
    try {
      const { data, error } = await supabase
        .from('auth_sessions')
        .select('*')
        .eq('id', 'wyndham-auth')
        .eq('is_valid', true)
        .single()

      if (error || !data) {
        return null
      }

      return data as AuthSession
    } catch (error) {
      logger.error('Error loading auth session:', error)
      return null
    }
  }

  // Update last used timestamp
  private async updateLastUsed(): Promise<void> {
    if (!this.currentSession) return

    try {
      await supabase
        .from('auth_sessions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', this.currentSession.id)
    } catch (error) {
      logger.error('Error updating last used:', error)
    }
  }

  // Invalidate session
  private async invalidateSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('auth_sessions')
        .update({ is_valid: false })
        .eq('id', sessionId)

      this.currentSession = null
      this.cookieJar = null
      logger.info('Auth session invalidated')
    } catch (error) {
      logger.error('Error invalidating session:', error)
    }
  }

  // Get session info for monitoring
  async getSessionInfo(): Promise<{ hasSession: boolean; expiresAt?: string; lastUsed?: string }> {
    if (!this.currentSession) {
      const session = await this.loadSessionFromDB()
      if (!session) {
        return { hasSession: false }
      }
      this.currentSession = session
    }

    return {
      hasSession: true,
      expiresAt: this.currentSession.expires_at,
      lastUsed: this.currentSession.last_used_at
    }
  }
}

export const authSessionManager = AuthSessionManager.getInstance()
export { AuthSessionManager } 