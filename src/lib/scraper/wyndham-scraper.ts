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
interface LoginResponse {
  status: string
  [key: string]: unknown
}

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

import * as cheerio from 'cheerio'
import axios, { AxiosInstance } from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

import { logger } from '../logger'
import * as dbResorts from '../models/resorts'
import * as dbRooms from '../models/rooms'  
import * as dbAvailabilities from '../models/availabilities'
import '../promiseAllConcurrent'

// Configure axios with cookie support
const jar = new CookieJar()
const client: AxiosInstance = wrapper(axios.create({ jar, timeout: 30000 }))

const baseUrl = 'http://clubwyndhamsp.com'

// Helper function to extract JavaScript variables from HTML
const findTextAndReturnRemainder = (target: string, variable: string): string => {
  const chopFront = target.substring(target.search(variable) + variable.length, target.length)
  const result = chopFront.substring(0, chopFront.search(';'))
  return result
}

// Make API calls to Club Wyndham
const callApi = async (payload: ApiPayload): Promise<unknown> => {
  logger.info('callApi start')
  const url = 'https://clubwyndhamsp.com/wp-admin/admin-ajax.php'
  
  // Extract sensitive data for logging purposes, but don't log them
  const { memberid, password, ...rest } = payload
  void memberid // Suppress unused variable warning
  void password // Suppress unused variable warning
  logger.info(JSON.stringify(rest, null, 2))
  
  // Convert payload to URLSearchParams format
  const params = new URLSearchParams()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, String(value))
    }
  })
  
  const response = await client.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  })

  logger.info('callApi end')
  return response.data
}

// Get security nonce from the main page
const getSecurity = async (): Promise<string> => {
  const response = await client.get(baseUrl)
  const $ = cheerio.load(response.data)
  const text = $('#custom-js-extra').html()
  
  if (!text) {
    throw new Error('Could not find security nonce')
  }
  
  const findAndClean = findTextAndReturnRemainder(text, 'var ajax_object =')
  const ajaxObject = JSON.parse(findAndClean) as { ajax_nonce: string }
  
  return ajaxObject.ajax_nonce
}

// Login to Club Wyndham
const login = async (security: string): Promise<LoginResponse> => {
  logger.info('login start')

  const payload: ApiPayload = {
    action: 'whpp_login',
    memberid: process.env.WYNDHAM_MEMBER_ID,
    password: process.env.WYNDHAM_PASSWORD,
    security
  }

  const loginResponse = await callApi(payload) as LoginResponse
  
  if (loginResponse.status === "SUCCESS") {
    logger.info('login success')
  } else {
    throw new Error('Login failed: ' + JSON.stringify(loginResponse))
  }

  logger.info('login end')
  return loginResponse
}

// Get all location regions
const getLocations = async (): Promise<Record<string, Location>> => {
  logger.info('getLocations start')
  const url = 'https://clubwyndhamsp.com/book-now-new-with-calendar/'
  
  const response = await client.get(url)
  const $ = cheerio.load(response.data)
  const regionOptions = $('#iris_region option')
  const locations: Record<string, Location> = {}

  regionOptions.each((key, el) => {
    const $el = $(el)
    if ($el.text() !== '--Select Region--') {
      const id = el.attribs.value
      const text = $el.text()
      const regex = /(.*)-\((.*)\) (.*)/
      const matches = text.match(regex)
      
      logger.info(`Processing location: ${id} - ${text}`)

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
      } else {
        logger.error(`Unable to parse location: ${text}`)
      }
    }
  })

  logger.info('getLocations end')
  logger.info(JSON.stringify(locations, null, 2))
  return locations
}

// Get resorts by location
const getResortsByLocation = async (location: Location, security: string): Promise<ScraperResort[]> => {
  logger.info('getResortsByLocation start')

  const payload: ApiPayload = {
    action: 'filter_resort_by_region',
    iris_region: location.id,
    security
  }

  const resorts = await callApi(payload) as ScraperResort[]
  logger.info('getResortsByLocation end')

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
  logger.info('getAllResorts start')
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

  logger.info('getAllResorts end')
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
    const pageResponse = await client.get(url)
    const $ = cheerio.load(pageResponse.data)

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
    logger.info('🏨 Starting resort sync...')
    
    const security = await getSecurity()
    await login(security)
    const locations = await getLocations()
    const resorts = await getAllResorts(locations, security)

    let successCount = 0
    for (const resort of Object.values(resorts)) {
      const success = await dbResorts.store(resort)
      if (success) successCount++
    }

    logger.info(`✅ Resort sync completed: ${successCount}/${Object.keys(resorts).length} resorts stored`)
    
    return {
      success: true,
      message: 'Resort sync completed successfully',
      data: {
        totalResorts: Object.keys(resorts).length,
        storedResorts: successCount
      }
    }
  } catch (error) {
    logger.error('❌ Resort sync failed:', error)
    throw error
  }
}

export const syncRooms = async (): Promise<SyncResult> => {
  try {
    logger.info('🏠 Starting rooms/availability sync...')
    
    const security = await getSecurity()
    await login(security)

    const resorts = await dbResorts.fetchByCountryCode(["AUS"])
    logger.info(`Fetching availability for ${resorts.length} resorts`)
    
    let processedResorts = 0
    let totalRooms = 0
    let totalAvailabilities = 0

    await Promise.allConcurrent(1)(resorts.map(resort => async () => {
      processedResorts++
      logger.info(`Getting resort #${processedResorts}: ${resort.name || resort.id}`)
      
      const results = await getAvailability(resort as unknown as ScraperResort, security)
      if (!results) {
        logger.info('No valid availabilities found')
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

      await delay(5000) // 5 second delay between resorts
    }))

    logger.info(`✅ Rooms/availability sync completed: ${processedResorts} resorts, ${totalRooms} rooms, ${totalAvailabilities} availability records`)
    
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
    logger.error('❌ Rooms/availability sync failed:', error)
    throw error
  }
}

// Combined scraping function for the cron job
export const scrapeWyndhamInventory = async () => {
  logger.info('🚀 Starting Wyndham inventory scraping...')
  
  try {
    // First sync resorts (if needed)
    const resortResult = await syncResorts()
    
    // Then sync rooms and availability
    const roomResult = await syncRooms()
    
    const result = {
      scraped_at: new Date().toISOString(),
      resorts_updated: resortResult.data?.storedResorts || 0,
      total_rooms_found: roomResult.data?.totalRooms || 0,
      available_rooms: roomResult.data?.totalAvailabilities || 0,
      new_availability: roomResult.data?.totalAvailabilities || 0,
      processed_resorts: roomResult.data?.processedResorts || 0
    }
    
    logger.info('✅ Wyndham inventory scraping completed:', result)
    return result
    
  } catch (error) {
    logger.error('❌ Wyndham inventory scraping failed:', error)
    throw error
  }
}

// Example structure for when you adapt your existing script:
/*
export async function scrapeResortAvailability(resortId: string) {
  // Your existing API calls here
  const response = await fetch(`${process.env.WYNDHAM_API_BASE_URL}/resorts/${resortId}/availability`, {
    headers: {
      'Authorization': `Bearer ${process.env.WYNDHAM_AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
  
  const data = await response.json()
  
  // Process and save to database
  return data
}
*/ 