// This file will contain your existing scraping logic
// You mentioned you have a raw script from 1 year ago that scrapes the API

export interface ScrapingResult {
  scraped_at: string
  resorts_updated: number
  total_rooms_found: number
  available_rooms: number
  new_availability: number
  errors?: string[]
}

// Type definitions

interface Location {
  id: string
  regionCode: string
  countryCode: string
  areaName: string
}

interface ScraperResort {
  id: number
  locationId: number
  regionCode: string
  countryCode: string
  areaName: string
  irisId: string
  name?: string
  [key: string]: unknown
}

interface Room {
  id: number
  [key: string]: unknown
}

interface AvailabilityRoom {
  AvailArray: string[]
  PointArray: string[]
}

interface Availability {
  FromDate: string
  ToDate: string
  Room: AvailabilityRoom[]
}

interface RoomAvailabilityData {
  room: Room
  availability: Availability
}

interface AvailabilityRecord {
  roomId: number
  date: string
  availability_status: number
  point: number
  [key: string]: unknown // Add index signature to match the model's Availability interface
}

interface ApiPayload {
  [key: string]: string | number | null | undefined
}

// Monitoring interface
interface MonitoringUpdate {
  isRunning?: boolean
  currentStep?: string
  progress?: {
    resorts?: { processed: number; total: number }
    rooms?: { processed: number; total: number }
    availability?: { processed: number; total: number }
  }
  log?: {
    level: 'info' | 'error' | 'success' | 'warning'
    message: string
    details?: unknown
  }
  apiCall?: {
    timestamp: string
    url: string
    method: string
    status: number
    duration: number
    payload?: unknown
    response?: unknown
    error?: boolean
  }
  stats?: {
    totalRequests?: number
    successfulRequests?: number
    errors?: number
  }
}

import * as cheerio from 'cheerio'
import axios, { AxiosInstance } from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

import { logger } from '../logger'
import * as dbResorts from '../models/resorts'
import * as dbRooms from '../models/rooms'  
import * as dbAvailabilities from '../models/availabilities'
import '../promiseAllConcurrent'
import { intelligentScheduler } from './intelligent-scheduler'
import { authSessionManager } from './auth-session-manager'
import { supabase } from '../supabase'

// Configure axios with cookie support - like request.jar()
const jar = new CookieJar()
const client: AxiosInstance = wrapper(axios.create({ jar, timeout: 30000 }))

const baseUrl = 'http://clubwyndhamsp.com'



// Monitoring helper
class ScrapingMonitor {
  private baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
    
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    errors: 0
  }

  async updateStatus(update: MonitoringUpdate) {
    try {
      if (!this.baseUrl) return
      
      await fetch(`${this.baseUrl}/api/admin/scraping-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      })
    } catch {
      // Silently fail - don't interrupt scraping for monitoring issues
    }
  }

  async logApiCall(url: string, method: string, status: number, duration: number, payload?: unknown, response?: unknown, fullResponseData?: unknown) {
    this.stats.totalRequests++
    if (status >= 200 && status < 400) {
      this.stats.successfulRequests++
    } else {
      this.stats.errors++
    }

    // For errors or important responses, capture full details
    let responseForLogging = response
    if (status === 0 || status >= 400 || (fullResponseData && typeof fullResponseData === 'object')) {
      // Keep full response data for errors or structured responses
      responseForLogging = fullResponseData || response
    } else if (typeof response === 'string' && response.length > 200) {
      // Only truncate long string responses for successful calls
      responseForLogging = response.substring(0, 200) + '...'
    }

    await this.updateStatus({
      apiCall: {
        timestamp: new Date().toISOString(),
        url,
        method,
        status,
        duration,
        payload,
        response: responseForLogging,
        error: status === 0 || status >= 400 ? true : undefined
      },
      stats: this.stats
    })
  }

  async log(level: 'info' | 'error' | 'success' | 'warning', message: string, details?: unknown) {
    const loggerMethod = level === 'success' ? 'info' : level === 'warning' ? 'warn' : level
    logger[loggerMethod](message, details)
    await this.updateStatus({
      log: { level, message, details }
    })
  }

  async setStep(step: string) {
    await this.updateStatus({ currentStep: step })
  }

  async setRunning(isRunning: boolean) {
    await this.updateStatus({ isRunning })
  }

  async updateProgress(type: 'resorts' | 'rooms' | 'availability', processed: number, total: number) {
    await this.updateStatus({
      progress: {
        [type]: { processed, total }
      }
    })
  }
}

// Global monitor instance
const monitor = new ScrapingMonitor()

// Helper function to extract JavaScript variables from HTML
const findTextAndReturnRemainder = (target: string, variable: string): string => {
  const chopFront = target.substring(target.search(variable) + variable.length, target.length)
  const result = chopFront.substring(0, chopFront.search(';'))
  return result
}

// Make API calls to Club Wyndham with monitoring and session recovery
const callApi = async (payload: ApiPayload, retryCount: number = 0): Promise<unknown> => {
  const url = 'https://clubwyndhamsp.com/wp-admin/admin-ajax.php'
  const startTime = Date.now()
  
  try {
    logger.info('callApi start')
    
    // Extract sensitive data for logging purposes, but don't log them
    const { memberid, password, ...rest } = payload
    void memberid // Suppress unused variable warning
    void password // Suppress unused variable warning
    logger.info(JSON.stringify(rest, null, 2))
    
    // Use form data directly like the request-promise example
    const response = await client.post(url, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })

    const duration = Date.now() - startTime
    
    // Check for session expiration indicators in response
    if (response.data === "0" || response.data === "-1" || 
        (typeof response.data === 'string' && response.data.includes('login'))) {
      
      // Possible session expiration - try to re-authenticate once
      if (retryCount === 0) {
        await monitor.log('warning', '⚠️ API call returned session-expired response, attempting re-authentication...')
        
        const reAuthSuccess = await ensureAuthenticated()
        if (reAuthSuccess) {
          await monitor.log('info', '🔄 Re-authentication successful, retrying API call...')
          return await callApi(payload, retryCount + 1) // Retry with re-auth
        } else {
          await monitor.log('error', '❌ Re-authentication failed')
          throw new Error('Session expired and re-authentication failed')
        }
      } else {
        await monitor.log('error', '❌ API call failed even after re-authentication')
        throw new Error('API call failed after re-authentication attempt')
      }
    }
    
    // Log full response data for better debugging
    await monitor.logApiCall(url, 'POST', response.status, duration, rest, 'Success', response.data)

    logger.info('callApi end')
    return response.data
    
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Extract sensitive data for logging purposes, but don't log them
    const { memberid, password, ...restForError } = payload
    void memberid // Suppress unused variable warning
    void password // Suppress unused variable warning
    
    const errorDetails = {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      axiosError: error && typeof error === 'object' && 'response' in error ? {
        status: (error as unknown as { response?: { status?: number } }).response?.status,
        statusText: (error as unknown as { response?: { statusText?: string } }).response?.statusText,
        data: (error as unknown as { response?: { data?: unknown } }).response?.data,
        headers: (error as unknown as { response?: { headers?: unknown } }).response?.headers
      } : undefined
    }
    
    await monitor.logApiCall(url, 'POST', 0, duration, restForError, errorMessage, errorDetails)
    throw error
  }
}

// Test if current session is valid by making a simple API call
const testSessionValidity = async (security: string): Promise<boolean> => {
  try {
    await monitor.log('info', '🧪 Testing session validity...')
    
    // Make a simple API call that requires authentication
    const payload: ApiPayload = {
      action: 'filter_resort_by_region',
      iris_region: '690', // Use a known region ID for testing
      security
    }

    const response = await callApi(payload)
    
    // If we get a valid response (not "0" or "-1"), session is good
    if (response && response !== "0" && response !== "-1" && Array.isArray(response)) {
      await monitor.log('success', `✅ Session is valid - got ${(response as unknown[]).length} resorts`)
      return true
    } else {
      await monitor.log('warning', `⚠️ Session may be invalid - response: ${JSON.stringify(response).substring(0, 100)}`)
      return false
    }
  } catch (error) {
    await monitor.log('warning', '⚠️ Session validity test failed, may need re-authentication', error)
    return false
  }
}

// Get security nonce from the main page
const getSecurity = async (): Promise<string> => {
  const startTime = Date.now()
  
  try {
    const response = await client.get(baseUrl)
    const $ = cheerio.load(response.data)
    const text = $('#custom-js-extra').html()
    
    if (!text) {
      throw new Error('Could not find security nonce')
    }
    
    const findAndClean = findTextAndReturnRemainder(text, 'var ajax_object =')
    const ajaxObject = JSON.parse(findAndClean) as { ajax_nonce: string }
    
    const duration = Date.now() - startTime
    await monitor.logApiCall(baseUrl, 'GET', response.status, duration, undefined, 'Security nonce extracted', { nonce: ajaxObject.ajax_nonce })
    
    return ajaxObject.ajax_nonce
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      possibleCause: 'Failed to extract security nonce from page'
    }
    await monitor.logApiCall(baseUrl, 'GET', 0, duration, undefined, errorMessage, errorDetails)
    throw error
  }
}

// Simple authentication that just loads PHPSESSID from database
const ensureAuthenticated = async (): Promise<boolean> => {
  await monitor.log('info', '🔐 Loading authentication session...')
  
  try {
    // Try to load existing session from database
    const { data: session, error } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('id', 'wyndham-auth')
      .eq('is_valid', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (session && !error) {
      await monitor.log('info', '🍪 Found valid session in database, extracting PHPSESSID...')
      
      try {
        // Parse the stored cookies to find PHPSESSID
        const cookies = JSON.parse(session.cookies) as string[]
        let phpSessionId = null
        
        for (const cookieStr of cookies) {
          if (cookieStr.includes('PHPSESSID=')) {
            // Extract PHPSESSID value from cookie string
            const match = cookieStr.match(/PHPSESSID=([^;]+)/)
            if (match) {
              phpSessionId = match[1]
              break
            }
          }
        }
        
        if (phpSessionId) {
          await monitor.log('info', `🍪 Found PHPSESSID in database: ${phpSessionId.substring(0, 8)}...`)
          
          // Set the PHPSESSID directly on our cookie jar
          const manualCookie = `PHPSESSID=${phpSessionId}; Path=/; Domain=clubwyndhamsp.com`
          await jar.setCookie(manualCookie, baseUrl)

          // also add this cookies
          const wordpressLoggedInCookie = 'wordpress_logged_in_abcdef123456789=test'
          await jar.setCookie(wordpressLoggedInCookie, baseUrl)

          client.defaults.jar = jar
          
          // Test if it works with a simple API call
          const security = await getSecurity()
          const sessionIsValid = await testSessionValidity(security)
          
          if (sessionIsValid) {
            await monitor.log('success', '✅ Database session is working perfectly!')
            
            // Update last_used_at timestamp
            await supabase
              .from('auth_sessions')
              .update({ last_used_at: new Date().toISOString() })
              .eq('id', 'wyndham-auth')
            
            return true
          } else {
            await monitor.log('warning', '⚠️ Database session exists but not working, will re-authenticate')
          }
        } else {
          await monitor.log('warning', '⚠️ Session found but no PHPSESSID in cookies')
        }
      } catch (parseError) {
        await monitor.log('warning', '⚠️ Failed to parse stored cookies', parseError)
      }
    } else {
      await monitor.log('info', '📝 No valid session found in database')
    }

    // If we get here, we need to do full authentication
    await monitor.log('info', '🔐 Performing full authentication with 2FA...')
    const fullAuthSuccess = await authSessionManager.ensureAuthenticated(client)
    
    if (fullAuthSuccess) {
      await monitor.log('success', '✅ Full authentication successful')
      return true
    } else {
      await monitor.log('error', '❌ Full authentication failed')
      return false
    }
    
  } catch (error) {
    await monitor.log('error', '❌ Authentication error', error)
    return false
  }
}

// Get all location regions
const getLocations = async (): Promise<Record<string, Location>> => {
  await monitor.log('info', '🌍 Fetching location regions...')
  const url = 'https://clubwyndhamsp.com/book-now-new-with-calendar/'
  const startTime = Date.now()
  
  try {
    const response = await client.get(url)
    const $ = cheerio.load(response.data)

    const selectElement = $('#iris_region')
    await monitor.log('info', `Select element found: ${selectElement.length > 0}`)
    
    if (selectElement.length > 0) {
      await monitor.log('info', `Select element HTML: ${selectElement.html()?.substring(0, 200)}...`)
    } else {
      // Try to find any select elements with "region" in their attributes
      const regionSelects = $('select[name*="region"], select[id*="region"]')
      await monitor.log('info', `Alternative region selects found: ${regionSelects.length}`)
      
      // Log some of the page content to see what we're working with  
      const bodyContent = $('body').html()
      const contentPreview = bodyContent?.substring(0, 1000) || 'No body content'
      await monitor.log('info', `Page body content (first 1000 chars): ${contentPreview}`)
    }
    
    const regionOptions = $('#iris_region option')
    const locations: Record<string, Location> = {}

    const duration = Date.now() - startTime
    await monitor.logApiCall(url, 'GET', response.status, duration, undefined, `Found ${regionOptions.length} regions`)

    // If we didn't find options, try some alternative approaches
    if (regionOptions.length === 0) {
      await monitor.log('warning', 'No options found with standard selector, trying alternatives...')
      
      // Try different selectors
      const alternatives = [
        'select#iris_region option',
        '[id="iris_region"] option',
        'select[name="iris_region"] option',
        'option[value]'  // Find all options with values, then filter
      ]
      
      for (const selector of alternatives) {
        const altOptions = $(selector)
        await monitor.log('info', `Selector "${selector}" found ${altOptions.length} elements`)
                 if (altOptions.length > 0) {
           // Log the first few for debugging
           altOptions.slice(0, 3).each((i, el) => {
             const $el = $(el)
             const value = 'attribs' in el ? el.attribs.value : ''
             logger.info(`Option ${i}: value="${value}" text="${$el.text()}"`)
           })
         }
      }
      
      // Check if there's a form containing region-related inputs
      const forms = $('form')
      await monitor.log('info', `Found ${forms.length} forms on the page`)
      
      // Look for any elements containing "region" in the HTML
      const regionElements = $('*:contains("Select Region")')
      await monitor.log('info', `Found ${regionElements.length} elements containing "Select Region"`)
    }

    regionOptions.each((key, el) => {
      const $el = $(el)
      if ($el.text() !== '--Select Region--') {
        const id = el.attribs.value
        const text = $el.text()
        const regex = /(.*)-\((.*)\) (.*)/
        const matches = text.match(regex)

        if (matches && matches.length > 3) {
          const regionCode = matches[1]
          const countryCode = matches[2]
          const areaName = matches[3]
          locations[id] = {
            id,
            regionCode,
            countryCode,
            areaName
          }
          logger.info(`Parsed location: ${regionCode}-${countryCode} ${areaName}`)
        } else {
          logger.error(`Unable to parse location: ${text}`)
          logger.warn(`Failed to parse location text: "${text}"`)
        }
      }
    })

    await monitor.log('success', `✅ Found ${Object.keys(locations).length} locations`)
    return locations
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await monitor.logApiCall(url, 'GET', 0, duration, undefined, errorMessage)
    throw error
  }
}

// Get resorts by location
const getResortsByLocation = async (location: Location, security: string): Promise<ScraperResort[]> => {
  const payload: ApiPayload = {
    action: 'filter_resort_by_region',
    iris_region: location.id,
    security
  }

  const resorts = await callApi(payload) as ScraperResort[]

  return resorts.map((resort: ScraperResort) => ({
    ...resort,
    id: parseInt(resort.irisId),
    locationId: parseInt(location.id),
    regionCode: location.regionCode,
    countryCode: location.countryCode,
    areaName: location.areaName
  }))
}

// Get all resorts from all locations
const getAllResorts = async (locations: Record<string, Location>, security: string): Promise<Record<string, ScraperResort>> => {
  await monitor.log('info', '🏨 Fetching resorts from all locations...')
  const resorts: Record<string, ScraperResort> = {}

  const results = await Promise.allConcurrent(1)(Object.keys(locations).map(locationId => async () => {
    const location = locations[locationId]
    logger.info('getResortsByLocation ' + locationId)
    return getResortsByLocation(location, security)
  }))

  results.flat().forEach(result => {
    if (!Object.keys(resorts).includes(result.id.toString())) {
      resorts[result.id] = result
    }
  })

  await monitor.log('success', `✅ Found ${Object.keys(resorts).length} unique resorts`)
  return resorts
}

// Get rooms for a resort
const getRooms = async (resort: ScraperResort, security: string): Promise<Room[]> => {
  const payload: ApiPayload = {
    action: 'filter_rooms_by_resort',
    irisresort: resort.id,
    iris_resort: resort.id,
    security
  }

  const rooms = await callApi(payload) as Room[]
  return rooms
}

// Get availability for a specific room over a date range
const getAvailabilityByRoom = async (
  resort: ScraperResort, 
  room: Room, 
  monthStart: number, 
  monthEnd: number, 
  security: string
): Promise<Availability> => {
  const payload: ApiPayload = {
    action: 'get_four_months_availability',
    iris_resort: resort.id,
    iris_region: resort.locationId,
    room_type: room.id,
    scrool_action: null,
    calendar_start: monthStart,
    calendar_end: monthEnd,
    security
  }

  let monthTotalArray: string[] = []
  let monthTotalPointsArray: string[] = []
  
  const response = await callApi(payload)
  
  if (response === "0") {
    logger.info('getAvailabilityByRoom-fallback start')
    const url = 'https://clubwyndhamsp.com/book-now-new-with-calendar/'
    const startTime = Date.now()
    
    try {
      const pageResponse = await client.get(url)
      const $ = cheerio.load(pageResponse.data)

      const duration = Date.now() - startTime
      await monitor.logApiCall(url, 'GET', pageResponse.status, duration, undefined, 'Fallback calendar page')

      $('.calendars script').each((key, el) => {
        const scriptContent = $(el).html()
        if (!scriptContent) return

        // Regular expressions to find the arrays
        const monthArrayRegex = /var monthArray(\d+) = (\[.*?\]);/g
        const monthPointArrayRegex = /var monthPointArray(\d+) = (\[.*?\]);/g

        let match
        while ((match = monthArrayRegex.exec(scriptContent)) !== null) {
          const monthArray = JSON.parse(match[2]) as string[]
          monthTotalArray = [...monthTotalArray, ...monthArray]
        }

        while ((match = monthPointArrayRegex.exec(scriptContent)) !== null) {
          const monthPointArray = JSON.parse(match[2]) as string[]
          monthTotalPointsArray = [...monthTotalPointsArray, ...monthPointArray]
        }
      })
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await monitor.logApiCall(url, 'GET', 0, duration, undefined, errorMessage)
      throw error
    }

    logger.info('getAvailabilityByRoom-fallback end')
  }

  // Calculate date range
  const baseDate = new Date()
  baseDate.setDate(1)

  const startDate = new Date(baseDate)
  startDate.setMonth(baseDate.getMonth() + monthStart)
  const FromDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`

  const endDate = new Date(baseDate)
  endDate.setMonth(baseDate.getMonth() + monthEnd)
  endDate.setDate(0)
  const ToDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`

  return {
    FromDate,
    ToDate,
    Room: [{
      AvailArray: monthTotalArray,
      PointArray: monthTotalPointsArray
    }]
  }
}

// Get availability for all rooms in a resort
const getAvailability = async (resort: ScraperResort, security: string): Promise<RoomAvailabilityData[] | null> => {
  const rooms = await getRooms(resort, security)
  if (rooms.length === 0) {
    return null
  }

  const availabilities = await Promise.allConcurrent(1)(rooms.map(room => async () => {
    const availabilityQ1 = await getAvailabilityByRoom(resort, room, 0, 8, security)
    const availabilityQ2 = await getAvailabilityByRoom(resort, room, 8, 16, security)
    
    logger.info(`Availability dates: ${availabilityQ1.ToDate} - ${availabilityQ2.ToDate}`)
    
    return {
      room,
      availability: {
        FromDate: availabilityQ1.FromDate,
        ToDate: availabilityQ2.ToDate,
        Room: [{
          AvailArray: [
            ...availabilityQ1.Room[0].AvailArray,
            ...availabilityQ2.Room[0].AvailArray,
          ],
          PointArray: [
            ...availabilityQ1.Room[0].PointArray,
            ...availabilityQ2.Room[0].PointArray,
          ]
        }]
      }
    }
  }))

  return availabilities
}

// Normalize availability data for database storage
const normalizeAvailabilityData = (availability: Availability, roomId: number): AvailabilityRecord[] => {
  const fromDate = new Date(availability.FromDate)
  const toDate = new Date(availability.ToDate)
  const roomData = availability.Room[0]
  const normalizedData: AvailabilityRecord[] = []

  const loopDate = new Date(fromDate)

  for (; loopDate <= toDate; loopDate.setDate(loopDate.getDate() + 1)) {
    const index = Math.floor((loopDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))

    normalizedData.push({
      roomId,
      date: loopDate.toISOString().split('T')[0],
      availability_status: parseInt(roomData.AvailArray[index], 10),
      point: parseInt(roomData.PointArray[index], 10)
    })
  }

  return normalizedData
}

// Delay utility
const delay = (duration: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, duration))
}

// Type for sync function return values
interface SyncResult {
  success: boolean
  message: string
  data?: {
    totalResorts?: number
    storedResorts?: number
    processedResorts?: number
    totalRooms?: number
    totalAvailabilities?: number
  }
}

// Main scraping functions
export const syncResorts = async (): Promise<SyncResult> => {
  try {
    await monitor.setStep('Syncing Resorts')
    await monitor.log('info', '🏨 Starting resort sync...')
    
    const authenticated = await ensureAuthenticated()
    if (!authenticated) {
      throw new Error('Authentication failed')
    }
    const security = await getSecurity()
    const locations = await getLocations()
    const resorts = await getAllResorts(locations, security)

    let successCount = 0
    const totalResorts = Object.keys(resorts).length
    
    for (const resort of Object.values(resorts)) {
      const success = await dbResorts.store(resort)
      if (success) successCount++
      await monitor.updateProgress('resorts', successCount, totalResorts)
    }

    await monitor.log('success', `✅ Resort sync completed: ${successCount}/${totalResorts} resorts stored`)
    
    return {
      success: true,
      message: 'Resort sync completed successfully',
      data: {
        totalResorts,
        storedResorts: successCount
      }
    }
  } catch (error) {
    await monitor.log('error', '❌ Resort sync failed', error)
    throw error
  }
}

export const syncRooms = async (): Promise<SyncResult> => {
  try {
    await monitor.setStep('Syncing Rooms & Availability')
    await monitor.log('info', '🏠 Starting rooms/availability sync...')
    
    const authenticated = await ensureAuthenticated()
    if (!authenticated) {
      throw new Error('Authentication failed')
    }
    const security = await getSecurity()

    const resorts = await dbResorts.fetchByCountryCode(["AUS"])
    await monitor.log('info', `Fetching availability for ${resorts.length} resorts`)
    
    let processedResorts = 0
    let totalRooms = 0
    let totalAvailabilities = 0

    await Promise.allConcurrent(1)(resorts.map(resort => async () => {
      processedResorts++
      await monitor.log('info', `Getting resort #${processedResorts}: ${resort.name || resort.id}`)
      await monitor.updateProgress('rooms', processedResorts, resorts.length)
      
      const results = await getAvailability(resort as unknown as ScraperResort, security)
      if (!results) {
        await monitor.log('info', 'No valid availabilities found')
        return
      }

      for (const data of results) {
        const room = data.room
        const availability = data.availability
        
        await dbRooms.store(room)
        totalRooms++

        const normalizedAvailability = normalizeAvailabilityData(availability, room.id)
        for (const availabilityData of normalizedAvailability) {
          await dbAvailabilities.store(availabilityData)
          totalAvailabilities++
        }
      }

      await monitor.updateProgress('availability', totalAvailabilities, totalAvailabilities)
      await delay(5000) // 5 second delay between resorts
    }))

    await monitor.log('success', `✅ Rooms/availability sync completed: ${processedResorts} resorts, ${totalRooms} rooms, ${totalAvailabilities} availability records`)
    
    return {
      success: true,
      message: 'Rooms and availability sync completed successfully',
      data: {
        processedResorts,
        totalRooms,
        totalAvailabilities
      }
    }
  } catch (error) {
    await monitor.log('error', '❌ Rooms/availability sync failed', error)
    throw error
  }
}

// Combined scraping function with intelligent scheduling
export const scrapeWyndhamInventory = async () => {
  await monitor.setRunning(true)
  await monitor.log('info', '🚀 Starting intelligent Wyndham inventory scraping...')
  
  try {
    // Create scraping plan
    const plan = await intelligentScheduler.createScrapingPlan()
    await monitor.log('info', `📋 Scraping plan: ${plan.reason}`)
    
         let resortResult: SyncResult = { success: true, message: 'Skipped', data: { storedResorts: 0, totalResorts: 0 } }
     let roomResult: SyncResult = { success: true, message: 'Skipped', data: { totalRooms: 0, totalAvailabilities: 0, processedResorts: 0 } }
    
    // Only scrape what's needed based on frequency
    if (plan.needsResorts) {
      await monitor.log('info', '🏨 Scraping resorts (due for update)...')
      resortResult = await syncResorts()
      await intelligentScheduler.updateLastScrapedTime('resorts')
    } else {
      await monitor.log('info', '⏭️ Skipping resorts (not due for update)')
    }
    
    if (plan.needsRooms) {
      await monitor.log('info', '🏠 Scraping rooms (due for update)...')
      roomResult = await syncRooms()
      await intelligentScheduler.updateLastScrapedTime('rooms')
    } else {
      await monitor.log('info', '⏭️ Skipping rooms (not due for update)')
    }
    
    if (plan.needsAvailabilities) {
      await monitor.log('info', '📅 Scraping availabilities (due for update)...')
      // Note: availability scraping is handled within syncRooms for now
      // In future, this could be separated for more granular control
      if (!plan.needsRooms) {
        // If rooms weren't scraped, we need a separate availability scraping function
        await monitor.log('info', '📅 Availability-only scraping not yet implemented')
      }
      await intelligentScheduler.updateLastScrapedTime('availabilities')
    } else {
      await monitor.log('info', '⏭️ Skipping availabilities (not due for update)')
    }
    
    const result = {
      scraped_at: new Date().toISOString(),
      resorts_updated: resortResult.data?.storedResorts || 0,
      total_rooms_found: roomResult.data?.totalRooms || 0,
      available_rooms: roomResult.data?.totalAvailabilities || 0,
      new_availability: roomResult.data?.totalAvailabilities || 0,
      processed_resorts: roomResult.data?.processedResorts || 0,
      plan: plan,
      next_scraping: await intelligentScheduler.getNextScrapingTimes()
    }
    
    await monitor.setStep('Completed')
    await monitor.log('success', '✅ Intelligent scraping completed successfully', result)
    await monitor.setRunning(false)
    
    return result
    
  } catch (error) {
    await monitor.setStep('Failed')
    await monitor.log('error', '❌ Intelligent scraping failed', error)
    await monitor.setRunning(false)
    throw error
  }
}
