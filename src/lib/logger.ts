// Simple logger utility to match the original serverless project interface
// Debug configuration
const DEBUG_MODE = process.env.SCRAPER_DEBUG === 'true' || false

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${new Date().toISOString()}:`, message, ...args)
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, message, ...args)
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${new Date().toISOString()}:`, message, ...args)
  },
  debug: (message: string, ...args: unknown[]) => {
    if (DEBUG_MODE) {
      console.debug(`[DEBUG] ${new Date().toISOString()}:`, message, ...args)
    }
  }
}

// Enhanced logger helper for scraper with debug mode awareness
export const loggerHelper = {
  log: (level: 'info' | 'error' | 'success' | 'warning' | 'debug', message: string, details?: unknown) => {
    // Filter out debug messages when debug mode is off
    if (level === 'debug' && !DEBUG_MODE) {
      return
    }
    
    // Also filter out detailed info messages when debug mode is off (unless they're progress-related)
    if (level === 'info' && !DEBUG_MODE) {
      // Allow progress messages, step updates, and important status messages
      const isProgressMessage = message.includes('Progress -') || 
                               message.includes('Step:') ||
                               message.includes('Starting') ||
                               message.includes('Fetching') ||
                               message.includes('Getting') ||
                               message.includes('Found') && (message.includes('locations') || message.includes('resorts')) ||
                               message.includes('resort #') ||
                               message.includes('availability for resort #') ||
                               message.startsWith('✅') ||
                               message.startsWith('🏨') ||
                               message.startsWith('🏠') ||
                               message.startsWith('📅') ||
                               message.startsWith('🎯') ||
                               message.startsWith('🔐') ||
                               message.startsWith('🌍')
      
      if (!isProgressMessage) {
        return
      }
    }
    
    const loggerMethod = level === 'success' ? 'info' : level === 'warning' ? 'warn' : level === 'debug' ? 'debug' : level
    logger[loggerMethod](message, details)
  },
  
  logApiCall: (url: string, method: string, status: number, duration: number, payload?: unknown, response?: unknown) => {
    // Parameters payload and response are available for future debugging but not currently used
    void payload
    void response
    
    // Only log API calls in debug mode or if there's an error
    if (!DEBUG_MODE && status >= 200 && status < 400) {
      return
    }
    
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
  },
  
  // Helper method to log debug information
  debug: (message: string, details?: unknown) => {
    logger.debug(message, details)
  }
} 