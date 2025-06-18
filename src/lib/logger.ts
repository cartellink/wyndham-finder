// Simple logger utility to match the original serverless project interface
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
    console.debug(`[DEBUG] ${new Date().toISOString()}:`, message, ...args)
  }
} 