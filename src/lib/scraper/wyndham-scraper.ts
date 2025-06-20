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
  resort_id?: number
  [key: string]: unknown
}

interface Availability {
  FromDate: string
  ToDate: string
  Room: Array<{
    AvailArray: string[]
    PointArray: string[]
  }>
}

interface AvailabilityRecord {
  roomId: number
  date: string
  availability_status: number
  point: number
  [key: string]: unknown // Add index signature to match the model's Availability interface
}

// Monitoring interface

import * as cheerio from 'cheerio'
import axios, { AxiosInstance } from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

import { logger } from '../logger'
import * as dbResorts from '../models/resorts'
import * as dbRooms from '../models/rooms'  
import * as dbAvailabilities from '../models/availabilities'
import * as dbMarketingResorts from '../models/marketing-resorts'
import { mapRegionToId } from '../utils'
import '../promiseAllConcurrent'
import { intelligentScheduler } from './intelligent-scheduler'
import { authSessionManager } from './auth-session-manager'
import { supabase } from '../supabase'

// Configure axios with cookie support - like request.jar()
const jar = new CookieJar()
const client: AxiosInstance = wrapper(axios.create({ jar, timeout: 30000 }))

const baseUrl = 'http://clubwyndhamsp.com'

// Monitoring helper
// Simple logging helper to replace monitor
const loggerHelper = {
  log: (level: 'info' | 'error' | 'success' | 'warning', message: string, details?: unknown) => {
    const loggerMethod = level === 'success' ? 'info' : level === 'warning' ? 'warn' : level
    logger[loggerMethod](message, details)
  },
  
  logApiCall: (url: string, method: string, status: number, duration: number, payload?: unknown, response?: unknown) => {
    // Parameters payload and response are available for future debugging but not currently used
    void payload
    void response
    if (status >= 200 && status < 400) {
      logger.info(`API call: ${method} ${url} - ${status} (${duration}ms)`)
    } else {
      logger.error(`API call failed: ${method} ${url} - ${status} (${duration}ms)`)
    }
  },
  
  setStep: (step: string) => {
    logger.info(`Step: ${step}`)
  },
  
  setRunning: (isRunning: boolean) => {
    logger.info(`Scraping ${isRunning ? 'started' : 'stopped'}`)
  },
  
  updateProgress: (type: 'resorts' | 'rooms' | 'availability', processed: number, total: number) => {
    logger.info(`Progress - ${type}: ${processed}/${total}`)
  }
}

// Make API calls to Club Wyndham with monitoring and session recovery
const callApi = async (payload: Record<string, unknown>, retryCount: number = 0): Promise<unknown> => {
  const url = 'https://clubwyndhamsp.com/wp-admin/admin-ajax.php'
  const startTime = Date.now()
  
  try {
    loggerHelper.log('info', 'callApi start')
    
    // Extract sensitive data for logging purposes, but don't log them
    const { memberid, password, ...rest } = payload
    void memberid // Suppress unused variable warning
    void password // Suppress unused variable warning
          loggerHelper.log('info', JSON.stringify(rest, null, 2))
    
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
      
      // Possible session expiration - verify with proper authentication check
      if (retryCount === 0) {
        loggerHelper.log('warning', '⚠️ API call returned possible session-expired response, verifying authentication...')
        
        const isAuth = await isAuthenticated()
        if (!isAuth) {
          loggerHelper.log('warning', '⚠️ Authentication check failed, attempting re-authentication...')
          const reAuthSuccess = await ensureAuthenticated()
          if (reAuthSuccess) {
            loggerHelper.log('info', '🔄 Re-authentication successful, retrying API call...')
            return await callApi(payload, retryCount + 1) // Retry with re-auth
          } else {
            loggerHelper.log('error', '❌ Re-authentication failed')
            throw new Error('Session expired and re-authentication failed')
          }
        } else {
          loggerHelper.log('info', '✅ Authentication is still valid, API response might be legitimate')
        }
      } else {
        loggerHelper.log('error', '❌ API call failed even after re-authentication')
        throw new Error('API call failed after re-authentication attempt')
      }
    }
    
    // Log full response data for better debugging
    loggerHelper.logApiCall(url, 'POST', response.status, duration, rest, 'Success')

    loggerHelper.log('info', 'callApi end')
    return response.data
    
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Extract sensitive data for logging purposes, but don't log them
    const { memberid, password, ...restForError } = payload
    void memberid // Suppress unused variable warning
    void password // Suppress unused variable warning
    
    // Error details for debugging (commented out to avoid unused variable warning)
    // const errorDetails = {
    //   error: errorMessage,
    //   stack: error instanceof Error ? error.stack : undefined,
    //   axiosError: error && typeof error === 'object' && 'response' in error ? {
    //     status: (error as unknown as { response?: { status?: number } }).response?.status,
    //     statusText: (error as unknown as { response?: { statusText?: string } }).response?.statusText,
    //     data: (error as unknown as { response?: { data?: unknown } }).response?.data,
    //     headers: (error as unknown as { response?: { headers?: unknown } }).response?.headers
    //   } : undefined
    // }
    
    loggerHelper.logApiCall(url, 'POST', 0, duration, restForError, errorMessage)
    throw error
  }
}

// Check if we're authenticated by testing the user-dashboard endpoint
const isAuthenticated = async (): Promise<boolean> => {
  const url = 'https://clubwyndhamsp.com/user-dashboard/'
  const startTime = Date.now()
  
  try {
    loggerHelper.log('info', '🔍 Checking authentication status...')
    
    const response = await client.get(url)
    const duration = Date.now() - startTime
    
    // Check for the specific login prompt HTML pattern
    const responseText = typeof response.data === 'string' ? response.data : String(response.data)
    const needsLogin = responseText.includes('Please <a class="text-link" href="#" data-toggle="modal" data-target="#login"')
    
    loggerHelper.logApiCall(url, 'GET', response.status, duration, undefined, needsLogin ? 'Not authenticated' : 'Authenticated')
    
    if (needsLogin) {
      loggerHelper.log('warning', '❌ Authentication check failed - login required')
      return false
    } else {
      loggerHelper.log('success', '✅ Authentication check passed')
      return true
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    loggerHelper.logApiCall(url, 'GET', 0, duration, undefined, errorMessage)
    
    // If we can't access the dashboard, assume we're not authenticated
    loggerHelper.log('error', '❌ Authentication check failed with error', error)
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
    
    // Extract security nonce from JavaScript
    const ajaxObjectStart = text.indexOf('var ajax_object =') + 'var ajax_object ='.length
    const ajaxObjectEnd = text.indexOf(';', ajaxObjectStart)
    const ajaxObjectStr = text.substring(ajaxObjectStart, ajaxObjectEnd)
    const ajaxObject = JSON.parse(ajaxObjectStr) as { ajax_nonce: string }
    
    const duration = Date.now() - startTime
    loggerHelper.logApiCall(baseUrl, 'GET', response.status, duration, undefined, 'Security nonce extracted')
    
    return ajaxObject.ajax_nonce
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Error details for debugging (commented out to avoid unused variable warning)
    // const errorDetails = {
    //   error: errorMessage,
    //   stack: error instanceof Error ? error.stack : undefined,
    //   possibleCause: 'Failed to extract security nonce from page'
    // }
    loggerHelper.logApiCall(baseUrl, 'GET', 0, duration, undefined, errorMessage)
    throw error
  }
}

// Simple authentication that just loads PHPSESSID from database
const ensureAuthenticated = async (): Promise<boolean> => {
  loggerHelper.log('info', '🔐 Loading authentication session...')
  
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
      loggerHelper.log('info', '🍪 Found valid session in database, extracting PHPSESSID...')
      
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
          loggerHelper.log('info', `🍪 Found PHPSESSID in database: ${phpSessionId.substring(0, 8)}...`)
          
          // Set the PHPSESSID directly on our cookie jar
          const manualCookie = `PHPSESSID=${phpSessionId}; Path=/; Domain=clubwyndhamsp.com`
          await jar.setCookie(manualCookie, baseUrl)

          // also add this cookies
          const wordpressLoggedInCookie = 'wordpress_logged_in_abcdef123456789=test; Path=/; Domain=clubwyndhamsp.com'
          await jar.setCookie(wordpressLoggedInCookie, baseUrl)

          client.defaults.jar = jar
          
          // Test if authentication works by checking the user dashboard
          const isAuth = await isAuthenticated()
          
          if (isAuth) {
            loggerHelper.log('success', '✅ Database session is working perfectly!')
            
            // Update last_used_at timestamp
            await supabase
              .from('auth_sessions')
              .update({ last_used_at: new Date().toISOString() })
              .eq('id', 'wyndham-auth')
            
            return true
          } else {
            loggerHelper.log('warning', '⚠️ Database session exists but authentication check failed, will re-authenticate')
            await supabase.from('auth_sessions').update({ is_valid: false }).eq('id', 'wyndham-auth')
          }
        } else {
          loggerHelper.log('warning', '⚠️ Session found but no PHPSESSID in cookies')
        }
      } catch (parseError) {
        loggerHelper.log('warning', '⚠️ Failed to parse stored cookies', parseError)
      }
    } else {
      loggerHelper.log('info', '📝 No valid session found in database')
    }

    // If we get here, we need to do full authentication
    loggerHelper.log('info', '🔐 Performing full authentication with 2FA...')
    const fullAuthSuccess = await authSessionManager.ensureAuthenticated(client)
    
    if (fullAuthSuccess) {
      loggerHelper.log('success', '✅ Full authentication successful')
      return true
    } else {
      loggerHelper.log('error', '❌ Full authentication failed')
      return false
    }
    
  } catch (error) {
    loggerHelper.log('error', '❌ Authentication error', error)
    return false
  }
}

// Get all location regions
 
const getLocations = async (): Promise<Record<string, Location>> => {
  loggerHelper.log('info', '🌍 Fetching location regions...')
  const url = 'https://clubwyndhamsp.com/book-now-new-with-calendar/'
  const startTime = Date.now()
  
  try {
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
          loggerHelper.log('info', `Parsed location: ${regionCode}-${countryCode} ${areaName} (ID: ${id})`)
        } else {
          loggerHelper.log('warning', `Failed to parse location text: "${text}" (ID: ${id})`)
        }
      }
    })

    loggerHelper.log('success', `✅ Found ${Object.keys(locations).length} locations`)
    
    // Log a sample of parsed locations for debugging
    const sampleLocations = Object.values(locations).slice(0, 5)
    loggerHelper.log('info', `Sample locations:`, sampleLocations)
    
    return locations
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    loggerHelper.logApiCall(url, 'GET', 0, duration, undefined, errorMessage)
    throw error
  }
}

// Marketing resort information from the public website
interface MarketingResort {
  name: string
  url: string
  imageUrl: string // Initial image from listing page
  excerpt: string
  resortId: string | null
  slug?: string
}

// Scrape marketing website for resort information
const getMarketingResorts = async (): Promise<MarketingResort[]> => {
  loggerHelper.log('info', '🎯 Fetching marketing resort data...')
  
  const allResorts: MarketingResort[] = []
  let currentPage = 1
  let maxPages = 1
  
  // Keep fetching pages until we reach the maximum
  while (currentPage <= maxPages) {
    loggerHelper.log('info', `📖 Fetching marketing page ${currentPage}/${maxPages}...`)
    
    const payload = {
      action: 'resort_loadmore',
      paged: currentPage.toString()
    }
    
    try {
      const response = await callApi(payload) as { max: number, html: string }
      
      // Update max pages from response
      if (response.max) {
        maxPages = response.max
        loggerHelper.log('info', `📊 Total pages available: ${maxPages}`)
      }
      
      // Parse HTML content to extract resort information
      const $ = cheerio.load(response.html)
      
      $('.resort-box').each((index, element) => {
        const $el = $(element)
        
        // Extract resort name
        const nameElement = $el.find('h4 a.text-link')
        const name = nameElement.text().trim()
        const url = nameElement.attr('href') || ''
        
        // Extract image URL
        const imageUrl = $el.find('.image img').attr('src') || ''
        
        // Extract excerpt/description
        const excerpt = $el.find('.excerpt a').text().trim()
        
        // Extract resort ID from booking link
        const bookingLink = $el.find('.booknow a').attr('href') || ''
        const resortIdMatch = bookingLink.match(/resortId=(\d+)/)
        const resortId = resortIdMatch ? resortIdMatch[1] : null
        
        // Extract slug from URL
        const urlParts = url.split('/')
        const slug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1]
        
        if (name && url) {
          const resort: MarketingResort = {
            name,
            url,
            imageUrl,
            excerpt,
            resortId,
            slug
          }
          
          allResorts.push(resort)
          loggerHelper.log('info', `✅ Found resort: ${name} (ID: ${resortId || 'unknown'})`)
        }
      })
      
      loggerHelper.log('info', `📄 Page ${currentPage}: Found ${$('.resort-box').length} resorts`)
      currentPage++
      
      // Add delay between requests to be respectful
      if (currentPage <= maxPages) {
        await delay(2000) // 2 second delay between pages
      }
      
    } catch (error) {
      loggerHelper.log('error', `❌ Failed to fetch marketing page ${currentPage}`, error)
      break
    }
  }
  
  loggerHelper.log('success', `✅ Marketing scrape completed: ${allResorts.length} resorts found`)
  return allResorts
}

// Scrape detailed resort page for additional information
const getResortDetails = async (resort: MarketingResort): Promise<MarketingResort & { heroImage?: string, galleryImages?: string[], additionalInfo?: Record<string, unknown> }> => {
  loggerHelper.log('info', `🔍 Fetching details for: ${resort.name}`)
  
  try {
    const response = await client.get(resort.url)
    const $ = cheerio.load(response.data)
    
    // Extract hero image from the specific selector
    let heroImage = ''
    const heroImageElement = $('.resort-hero-banner .image picture img').first()
    if (heroImageElement.length > 0) {
      heroImage = heroImageElement.attr('src') || ''
    }
    
    // Fallback to picture source elements if img doesn't have src
    if (!heroImage) {
      const pictureSource = $('.resort-hero-banner .image picture source').first()
      if (pictureSource.length > 0) {
        heroImage = pictureSource.attr('srcset')?.split(' ')[0] || ''
      }
    }
    
    // Fallback to CSS background image in style attribute
    if (!heroImage) {
      const imageDiv = $('.resort-hero-banner .image[style*="background:url"]').first()
      if (imageDiv.length > 0) {
        const styleAttr = imageDiv.attr('style') || ''
        const bgUrlMatch = styleAttr.match(/background:url\(([^)]+)\)/)
        if (bgUrlMatch && bgUrlMatch[1]) {
          heroImage = bgUrlMatch[1]
        }
      }
    }
    
    // If still no hero image found, try meta property images
    if (!heroImage) {
      const ogImage = $('meta[property="og:image"]').attr('content')
      if (ogImage) {
        heroImage = ogImage
      }
    }
    
    // Extract gallery images from the owl carousel
    const galleryImages: string[] = []
    $('.gallery .item img').each((index, element) => {
      const imgSrc = $(element).attr('src')
      if (imgSrc && !galleryImages.includes(imgSrc)) {
        galleryImages.push(imgSrc)
      }
    })
    
    // Remove duplicates and filter out cloned images if they exist
    const uniqueGalleryImages = [...new Set(galleryImages)]
    
    // Extract additional metadata that might be useful
    const additionalInfo: Record<string, unknown> = {
      metaDescription: $('meta[name="description"]').attr('content') || '',
      ogTitle: $('meta[property="og:title"]').attr('content') || '',
      ogDescription: $('meta[property="og:description"]').attr('content') || ''
    }
    
    loggerHelper.log('info', `✅ Details extracted for: ${resort.name}${heroImage ? ' (with hero image)' : ''}${uniqueGalleryImages.length > 0 ? ` (${uniqueGalleryImages.length} gallery images)` : ''}`)
    
    return {
      ...resort,
      heroImage: heroImage || undefined,
      galleryImages: uniqueGalleryImages.length > 0 ? uniqueGalleryImages : undefined,
      additionalInfo
    }
    
  } catch (error) {
    loggerHelper.log('error', `❌ Failed to fetch details for: ${resort.name}`, error)
    return resort
  }
}

// Match marketing resorts with existing database resorts and calculate confidence
const matchMarketingWithDatabase = async (marketingResorts: MarketingResort[]) => {
  loggerHelper.log('info', '🔗 Matching marketing data with database resorts...')
  
  const matches: Array<{
    marketing: MarketingResort
    dbResort?: unknown
    matchMethod: 'resortId' | 'name' | 'slug' | 'none'
    confidence: number
  }> = []
  
  for (const marketing of marketingResorts) {
    let dbResort = null
    let matchMethod: 'resortId' | 'name' | 'slug' | 'none' = 'none'
    let confidence = 0.0
    
    // Try to match by resort ID first (most reliable)
    if (marketing.resortId) {
      const { data: resortById } = await supabase
        .from('resorts')
        .select('*')
        .eq('iris_id', marketing.resortId)
        .single()
      
      if (resortById) {
        dbResort = resortById
        matchMethod = 'resortId'
        confidence = 1.0 // Exact ID match is 100% confidence
      }
    }
    
    // If no match by ID, try by name similarity
    if (!dbResort) {
      const { data: resortsByName } = await supabase
        .from('resorts')
        .select('*')
        .ilike('name', `%${marketing.name.replace(/WorldMark |Wyndham |Ramada /i, '')}%`)
      
      if (resortsByName && resortsByName.length > 0) {
        dbResort = resortsByName[0] // Take the first match
        matchMethod = 'name'
        confidence = 0.8 // Name match is 80% confidence
      }
    }
    
    // Try matching by URL slug if still no match
    if (!dbResort && marketing.slug) {
      const { data: resortsBySlug } = await supabase
        .from('resorts')
        .select('*')
        .ilike('name', `%${marketing.slug.replace(/-/g, ' ')}%`)
      
      if (resortsBySlug && resortsBySlug.length > 0) {
        dbResort = resortsBySlug[0]
        matchMethod = 'slug'
        confidence = 0.6 // Slug match is 60% confidence
      }
    }
    
    matches.push({
      marketing,
      dbResort: dbResort || undefined,
      matchMethod,
      confidence
    })
    
    const statusIcon = dbResort ? '✅' : '❌'
    loggerHelper.log('info', `${statusIcon} ${marketing.name} - Match: ${matchMethod} (${Math.round(confidence * 100)}%) ${dbResort ? `(DB ID: ${(dbResort as { id?: number }).id})` : '(No match)'}`)
  }
  
  const matchedCount = matches.filter(m => m.dbResort).length
  loggerHelper.log('success', `🔗 Matching completed: ${matchedCount}/${marketingResorts.length} resorts matched`)
  
  return matches
}

// Main function to sync marketing data
export const syncMarketingData = async (): Promise<SyncResult> => {
  try {
    loggerHelper.setStep('Syncing Marketing Data')
    loggerHelper.log('info', '🎯 Starting marketing data sync...')
    
    const authenticated = await ensureAuthenticated()
    if (!authenticated) {
      throw new Error('Authentication failed')
    }
    
    // Step 1: Get all marketing resorts
    const marketingResorts = await getMarketingResorts()
    
    // Step 2: Get detailed information for each resort
    loggerHelper.log('info', '📋 Fetching detailed resort information...')
    const detailedResorts: (MarketingResort & { heroImage?: string, galleryImages?: string[], additionalInfo?: Record<string, unknown> })[] = []
    

    // ignore the error here
    // @ts-expect-error - allConcurrent is not a method of PromiseConstructor
    await Promise.allConcurrent(2)(marketingResorts.map(resort => async () => {
      const detailed = await getResortDetails(resort)
      detailedResorts.push(detailed)
      await delay(1000) // 1 second delay between detail requests
    }))
    
    // Step 3: Match with database resorts
    const matches = await matchMarketingWithDatabase(detailedResorts)
    
    // Step 4: Store marketing data in database
    loggerHelper.log('info', '💾 Storing marketing data in database...')
    let storedCount = 0
    
    for (const match of matches) {
      const detailedMarketing = match.marketing as MarketingResort & { 
        heroImage?: string, 
        galleryImages?: string[],
        additionalInfo?: Record<string, unknown> 
      }
      
      // Create image URLs array including both the initial image and gallery images
      const imageUrls: string[] = []
      if (detailedMarketing.imageUrl) {
        imageUrls.push(detailedMarketing.imageUrl)
      }
      if (detailedMarketing.galleryImages) {
        // Add gallery images, filtering out duplicates
        detailedMarketing.galleryImages.forEach(img => {
          if (!imageUrls.includes(img)) {
            imageUrls.push(img)
          }
        })
      }
      
      const marketingData: dbMarketingResorts.MarketingResort = {
        name: detailedMarketing.name,
        url: detailedMarketing.url,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        hero_image_url: detailedMarketing.heroImage || undefined,
        excerpt: detailedMarketing.excerpt || undefined,
        resort_id: detailedMarketing.resortId || undefined,
        slug: detailedMarketing.slug || undefined,
        matched_resort_id: detailedMarketing.resortId ? parseInt(detailedMarketing.resortId) : undefined,
        match_method: match.matchMethod,
        match_confidence: match.confidence,
        meta_description: detailedMarketing.additionalInfo?.metaDescription as string || undefined,
        og_title: detailedMarketing.additionalInfo?.ogTitle as string || undefined,
        og_description: detailedMarketing.additionalInfo?.ogDescription as string || undefined,
        additional_info: detailedMarketing.additionalInfo || undefined
      }
      
      const success = await dbMarketingResorts.store(marketingData)
      if (success) {
        storedCount++
      }
    }
    
    const matchedCount = matches.filter(m => m.dbResort).length
    
    loggerHelper.log('success', `✅ Marketing sync completed: ${detailedResorts.length} resorts processed, ${matchedCount} matched, ${storedCount} stored`)
    
    return {
      success: true,
      message: 'Marketing data sync completed successfully',
      data: {
        totalResorts: detailedResorts.length,
        storedResorts: storedCount,
        matchedResorts: matchedCount,
        processedResorts: detailedResorts.length
      }
    }
    
  } catch (error) {
    loggerHelper.log('error', '❌ Marketing sync failed', error)
    throw error
  }
}

// Get resorts by location and store them immediately
const getResortsByLocation = async (location: Location, security: string): Promise<number> => {
  const payload = {
    action: 'filter_resort_by_region',
    iris_region: location.id,
    security
  }

  const resorts = await callApi(payload) as ScraperResort[]
  let storedCount = 0

  for (const resort of resorts) {
    const addresses = resort.addresses as Array<{ country: { name: string }, state: { name: string } }>
    if (!resort.country && addresses?.[0]?.country?.name) {
      resort.country = addresses[0].country.name
    }
    if (!resort.state && addresses?.[0]?.state?.name) {
      resort.state = addresses[0].state.name
    }

    // Map the region using the new normalized region system
    const regionId = await mapRegionToId(
      location.id, // iris_id from the location
      location.countryCode,
      resort.state as string | undefined,
      location.areaName
    )

    const normalizedResort = {
      ...resort,
      id: parseInt(resort.irisId),
      locationId: parseInt(location.id),
      regionId: regionId || undefined, // Convert null to undefined for TypeScript
      // Keep old fields for backward compatibility during transition
      regionCode: location.regionCode,
      countryCode: location.countryCode,
      areaName: location.areaName
    }
    
    const success = await dbResorts.store(normalizedResort)
    if (success) {
      storedCount++
      loggerHelper.log('info', `Stored resort: ${normalizedResort.name || normalizedResort.id} with region_id: ${regionId}`)
    } else {
      loggerHelper.log('error', `Failed to store resort: ${normalizedResort.name || normalizedResort.id}`)
    }
  }

  return storedCount
}

// Get all resorts from all locations and store them immediately
 
const getAllResorts = async (locations: Record<string, Location>, security: string): Promise<number> => {
  loggerHelper.log('info', '🏨 Fetching and storing resorts from all locations...')

  // @ts-expect-error - allConcurrent is not a method of PromiseConstructor
  const results = await Promise.allConcurrent(1)(Object.keys(locations).map(locationId => async () => {
    const location = locations[locationId]
    loggerHelper.log('info', 'getResortsByLocation ' + locationId)
    return getResortsByLocation(location, security)
  }))

  // Sum up all stored counts
  const totalStored = results.reduce((sum: number, count: number) => sum + count, 0)

  loggerHelper.log('success', `✅ Stored ${totalStored} resorts`)
  return totalStored
}

// Get rooms for a resort and store them immediately
const getRoomsAndStore = async (resort: ScraperResort, security: string): Promise<Room[]> => {
  const payload = {
    action: 'filter_rooms_by_resort',
    irisresort: resort.id,
    iris_resort: resort.id,
    security
  }

  const rooms = await callApi(payload) as Room[]
  
  // Store each room immediately with resort_id
  for (const room of rooms) {
    const roomWithResort = {
      ...room,
      resort_id: resort.id
    }
    await dbRooms.store(roomWithResort)
    loggerHelper.log('info', `Stored room ${room.id} for resort ${resort.id}`)
  }

  return rooms
}

// Get rooms for a resort WITHOUT storing availability - just rooms
const getRoomsOnly = async (resort: ScraperResort, security: string): Promise<{ totalRooms: number }> => {
  const rooms = await getRoomsAndStore(resort, security)
  return { totalRooms: rooms.length }
}

// Get availability for a specific room over a date range
const getAvailabilityByRoom = async (
  resort: ScraperResort, 
  room: Room, 
  monthStart: number, 
  monthEnd: number, 
  security: string
): Promise<Availability> => {
  console.log('region id', resort)
  const payload = {
    action: 'get_four_months_availability',
    iris_resort: resort.id,
    iris_region: resort.location_id,
    room_type: room.id,
    scrool_action: null,
    calendar_start: monthStart,
    calendar_end: monthEnd,
    security
  }

  let monthTotalArray: string[] = []
  let monthTotalPointsArray: string[] = []
  
  await callApi(payload)
   
  // For now, let's force the fallback to test the HTML parsing
  const shouldUseFallback = true
  loggerHelper.log('info', '🔧 FORCING HTML FALLBACK FOR TESTING')

  if (shouldUseFallback) {
    loggerHelper.log('info', 'getAvailabilityByRoom-fallback start')
    // Build URL with proper parameters to get the specific room/resort calendar
    const url = `https://clubwyndhamsp.com/book-now-new-with-calendar/`
    const startTime = Date.now()
    
    try {
      const pageResponse = await client.get(url)
      const $ = cheerio.load(pageResponse.data)

      const duration = Date.now() - startTime
      loggerHelper.logApiCall(url, 'GET', pageResponse.status, duration, undefined, 'Fallback calendar page')

      // DEBUG: Log the number of script tags found
      const allScripts = $('script')
      const calendarScripts = $('.calendars script')
      loggerHelper.log('info', `🔍 DEBUG: Found ${allScripts.length} total script tags, ${calendarScripts.length} within .calendars`)

      // Try both .calendars script and all script tags since the structure might vary
      const scriptSelectors = ['.calendars script', 'script']
      let foundArrays = false

      for (const selector of scriptSelectors) {
        if (foundArrays) break

        $(selector).each((key, el) => {
          const scriptContent = $(el).html()
          if (!scriptContent) return

          // Check if this script contains calendar arrays
          if (!scriptContent.includes('monthArray') && !scriptContent.includes('monthPointArray')) {
            return
          }

          loggerHelper.log('info', `🔍 DEBUG: Processing script ${key + 1} with selector "${selector}"`)
          loggerHelper.log('info', `🔍 DEBUG: Script content preview: ${scriptContent.substring(0, 200)}...`)

          // Regular expressions to find the arrays - match the actual format from the HTML
          const monthArrayRegex = /var monthArray(\d+) = (\[[^\]]+\]);/g
          const monthPointArrayRegex = /var monthPointArray(\d+) = (\[[^\]]+\]);/g

          let match
          while ((match = monthArrayRegex.exec(scriptContent)) !== null) {
            loggerHelper.log('info', `🔍 DEBUG: Found monthArray${match[1]}: ${match[2]}`)
            try {
              const monthArray = JSON.parse(match[2]) as string[]
              monthTotalArray = [...monthTotalArray, ...monthArray]
              foundArrays = true
              loggerHelper.log('info', `🔍 DEBUG: Successfully parsed monthArray${match[1]} with ${monthArray.length} items`)
            } catch (parseError) {
              loggerHelper.log('error', `Failed to parse monthArray${match[1]}:`, parseError)
            }
          }

          while ((match = monthPointArrayRegex.exec(scriptContent)) !== null) {
            loggerHelper.log('info', `🔍 DEBUG: Found monthPointArray${match[1]}: ${match[2]}`)
            try {
              const monthPointArray = JSON.parse(match[2]) as string[]
              monthTotalPointsArray = [...monthTotalPointsArray, ...monthPointArray]
              foundArrays = true
              loggerHelper.log('info', `🔍 DEBUG: Successfully parsed monthPointArray${match[1]} with ${monthPointArray.length} items`)
            } catch (parseError) {
              loggerHelper.log('error', `Failed to parse monthPointArray${match[1]}:`, parseError)
            }
          }
        })
      }

      loggerHelper.log('info', `🔍 DEBUG: Final arrays - Availability: ${monthTotalArray.length} items, Points: ${monthTotalPointsArray.length} items`)
      loggerHelper.log('info', `🔍 DEBUG: Sample availability values: ${monthTotalArray.slice(0, 10)}`)
      loggerHelper.log('info', `🔍 DEBUG: Sample point values: ${monthTotalPointsArray.slice(0, 10)}`)

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      loggerHelper.logApiCall(url, 'GET', 0, duration, undefined, errorMessage)
      throw error
    }

    loggerHelper.log('info', 'getAvailabilityByRoom-fallback end')
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

// Get availability ONLY for existing rooms (separate from room fetching)
const getAvailabilityOnly = async (resort: ScraperResort, security: string): Promise<{ totalAvailabilities: number }> => {
  // Get existing rooms from database instead of fetching new ones
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('resort_id', resort.id) // Assuming rooms table has resort_id FK

  if (error || !rooms || rooms.length === 0) {
    loggerHelper.log('warning', `No existing rooms found for resort ${resort.id}`)
    return { totalAvailabilities: 0 }
  }

  let totalAvailabilities = 0

  // @ts-expect-error - allConcurrent is not a method of PromiseConstructor
  await Promise.allConcurrent(1)(rooms.map(room => async () => {
    const availabilityQ1 = await getAvailabilityByRoom(resort, room, 0, 8, security)
    const availabilityQ2 = await getAvailabilityByRoom(resort, room, 8, 16, security)
    
    logger.info(`Availability dates: ${availabilityQ1.ToDate} - ${availabilityQ2.ToDate}`)
    
    // Combine the two availability periods
    const combinedAvailability: Availability = {
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

    // Normalize and store availability data immediately
    const normalizedAvailability = normalizeAvailabilityData(combinedAvailability, room.id)
    for (const availabilityData of normalizedAvailability) {
      await dbAvailabilities.store(availabilityData)
      totalAvailabilities++
    }
    logger.info(`Stored ${normalizedAvailability.length} availability records for room ${room.id}`)
  }))

  return { totalAvailabilities }
}

// Normalize availability data for database storage
const normalizeAvailabilityData = (availability: Availability, roomId: number): AvailabilityRecord[] => {
  // DEBUG: Print the input availability data
  loggerHelper.log('info', '🔍 DEBUG: Input availability data for normalization:', {
    roomId,
    availability: {
      FromDate: availability.FromDate,
      ToDate: availability.ToDate,
      RoomCount: availability.Room.length,
      FirstRoomData: availability.Room[0] ? {
        AvailArrayLength: availability.Room[0].AvailArray?.length,
        PointArrayLength: availability.Room[0].PointArray?.length,
        FirstFewAvailValues: availability.Room[0].AvailArray?.slice(0, 5),
        FirstFewPointValues: availability.Room[0].PointArray?.slice(0, 5)
      } : 'No room data'
    }
  })

  const fromDate = new Date(availability.FromDate)
  const toDate = new Date(availability.ToDate)
  const roomData = availability.Room[0]
  const normalizedData: AvailabilityRecord[] = []

  const loopDate = new Date(fromDate)

  for (; loopDate <= toDate; loopDate.setDate(loopDate.getDate() + 1)) {
    const index = Math.floor((loopDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))

    const record = {
      roomId,
      date: loopDate.toISOString().split('T')[0],
      availability_status: parseInt(roomData.AvailArray[index], 10),
      point: parseInt(roomData.PointArray[index], 10)
    }

    normalizedData.push(record)

    // DEBUG: Print first record for inspection
    if (normalizedData.length === 1) {
      loggerHelper.log('info', '🔍 DEBUG: First normalized record sample:', {
        record,
        rawAvailValue: roomData.AvailArray[index],
        rawPointValue: roomData.PointArray[index],
        index,
        totalDays: Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      })
    }
  }

  // DEBUG: Print summary of normalized data
  loggerHelper.log('info', '🔍 DEBUG: Normalized data summary:', {
    totalRecords: normalizedData.length,
    firstRecord: normalizedData[0],
    lastRecord: normalizedData[normalizedData.length - 1]
  })

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
    matchedResorts?: number
  }
}

// Main scraping functions
export const syncResorts = async (): Promise<SyncResult> => {
  try {
    loggerHelper.setStep('Syncing Resorts')
    loggerHelper.log('info', '🏨 Starting resort sync...')
    
    const authenticated = await ensureAuthenticated()
    if (!authenticated) {
      throw new Error('Authentication failed')
    }
    const security = await getSecurity()
    const locations = await getLocations()
    // await syncMarketingData()
    const storedResorts = await getAllResorts(locations, security)

    loggerHelper.log('success', `✅ Resort sync completed (marketing data only)`)
    
    return {
      success: true,
      message: 'Resort sync completed successfully',
      data: {
        totalResorts: storedResorts,
        storedResorts: storedResorts
      }
    }
  } catch (error) {
    loggerHelper.log('error', '❌ Resort sync failed', error)
    throw error
  }
}

export const syncRooms = async (): Promise<SyncResult> => {
  try {
    loggerHelper.setStep('Syncing Rooms')
    loggerHelper.log('info', '🏠 Starting rooms sync...')
    
    const authenticated = await ensureAuthenticated()
    if (!authenticated) {
      throw new Error('Authentication failed')
    }
    const security = await getSecurity()

    // get countrycode AUS and ANZ
    const resorts = await dbResorts.fetchByCountryCode(["AUS", "ANZ"])
    
    loggerHelper.log('info', `Fetching rooms for ${resorts.length} resorts`)
    
    let processedResorts = 0
    let totalRooms = 0

    // @ts-expect-error - allConcurrent is not a method of PromiseConstructor
    await Promise.allConcurrent(1)(resorts.map(resort => async () => {
      processedResorts++
      loggerHelper.log('info', `Getting resort #${processedResorts}: ${resort.name || resort.id}`)
      loggerHelper.updateProgress('rooms', processedResorts, resorts.length)
      
      const results = await getRoomsOnly(resort as unknown as ScraperResort, security)
      if (!results || results.totalRooms === 0) {
        loggerHelper.log('info', 'No rooms found')
        return
      }

      totalRooms += results.totalRooms
      await delay(5000) // 5 second delay between resorts
    }))

    loggerHelper.log('success', `✅ Rooms sync completed: ${processedResorts} resorts, ${totalRooms} rooms`)
    
    return {
      success: true,
      message: 'Rooms sync completed successfully',
      data: {
        processedResorts,
        totalRooms
      }
    }
  } catch (error) {
    loggerHelper.log('error', '❌ Rooms sync failed', error)
    throw error
  }
}

export const syncAvailabilities = async (): Promise<SyncResult> => {
  try {
    loggerHelper.setStep('Syncing Availabilities')
    loggerHelper.log('info', '📅 Starting availabilities sync...')
    
    const authenticated = await ensureAuthenticated()
    if (!authenticated) {
      throw new Error('Authentication failed')
    }
    const security = await getSecurity()

    const resorts = await dbResorts.fetchByCountryCode(["AUS", "ANZ"])

    loggerHelper.log('info', `Fetching availability for ${resorts.length} resorts`)
    
    let processedResorts = 0
    let totalAvailabilities = 0

    // @ts-expect-error - allConcurrent is not a method of PromiseConstructor
    await Promise.allConcurrent(1)(resorts.map(resort => async () => {
      processedResorts++
      loggerHelper.log('info', `Getting availability for resort #${processedResorts}: ${resort.name || resort.id}`)
      loggerHelper.updateProgress('availability', processedResorts, resorts.length)
      
      const results = await getAvailabilityOnly(resort as unknown as ScraperResort, security)
      if (!results || results.totalAvailabilities === 0) {
        loggerHelper.log('info', 'No availabilities found')
        return
      }

      totalAvailabilities += results.totalAvailabilities
      await delay(5000) // 5 second delay between resorts
    }))

    loggerHelper.log('success', `✅ Availabilities sync completed: ${processedResorts} resorts, ${totalAvailabilities} availability records`)
    
    return {
      success: true,
      message: 'Availabilities sync completed successfully',
      data: {
        processedResorts,
        totalAvailabilities
      }
    }
  } catch (error) {
    loggerHelper.log('error', '❌ Availabilities sync failed', error)
    throw error
  }
}

// Combined scraping function with intelligent scheduling
export const scrapeWyndhamInventory = async () => {
  loggerHelper.setRunning(true)
  loggerHelper.log('info', '🚀 Starting intelligent Wyndham inventory scraping...')
  
  try {
    // Create scraping plan
    const plan = await intelligentScheduler.createScrapingPlan()
    loggerHelper.log('info', `📋 Scraping plan: ${plan.reason}`)
    
    let resortResult: SyncResult = { success: true, message: 'Skipped', data: { storedResorts: 0, totalResorts: 0 } }
    let roomResult: SyncResult = { success: true, message: 'Skipped', data: { totalRooms: 0, processedResorts: 0 } }
    let availabilityResult: SyncResult = { success: true, message: 'Skipped', data: { totalAvailabilities: 0, processedResorts: 0 } }
    
    // Only scrape what's needed based on frequency
    if (plan.needsResorts) {
      loggerHelper.log('info', '🏨 Scraping resorts (due for update)...')
      resortResult = await syncResorts()
      await intelligentScheduler.updateLastScrapedTime('resorts')
    } else {
      loggerHelper.log('info', '⏭️ Skipping resorts (not due for update)')
    }
    
    if (plan.needsRooms) {
      loggerHelper.log('info', '🏠 Scraping rooms (due for update)...')
      roomResult = await syncRooms()
      await intelligentScheduler.updateLastScrapedTime('rooms')
    } else {
      loggerHelper.log('info', '⏭️ Skipping rooms (not due for update)')
    }
    
    if (plan.needsAvailabilities) {
      loggerHelper.log('info', '📅 Scraping availabilities (due for update)...')
      availabilityResult = await syncAvailabilities()
      await intelligentScheduler.updateLastScrapedTime('availabilities')
    } else {
      loggerHelper.log('info', '⏭️ Skipping availabilities (not due for update)')
    }
    
    const result = {
      scraped_at: new Date().toISOString(),
      resorts_updated: resortResult.data?.storedResorts || 0,
      total_rooms_found: roomResult.data?.totalRooms || 0,
      available_rooms: availabilityResult.data?.totalAvailabilities || 0,
      new_availability: availabilityResult.data?.totalAvailabilities || 0,
      processed_resorts: Math.max(
        resortResult.data?.processedResorts || 0,
        roomResult.data?.processedResorts || 0,
        availabilityResult.data?.processedResorts || 0
      ),
      plan: plan,
      next_scraping: await intelligentScheduler.getNextScrapingTimes()
    }
    
    loggerHelper.setStep('Completed')
    loggerHelper.log('success', '✅ Intelligent scraping completed successfully', result)
    loggerHelper.setRunning(false)
    
    return result
    
  } catch (error) {
    loggerHelper.setStep('Failed')
    loggerHelper.log('error', '❌ Intelligent scraping failed', error)
    loggerHelper.setRunning(false)
    throw error
  }
}
