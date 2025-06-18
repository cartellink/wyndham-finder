import { supabaseAdmin } from './supabase'

// Convert camelCase to snake_case for database columns
export const convertObjectKeysToSnakeCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(convertObjectKeysToSnakeCase)
  }

  const converted: Record<string, unknown> = {}
  Object.keys(obj as Record<string, unknown>).forEach(key => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    converted[snakeKey] = convertObjectKeysToSnakeCase((obj as Record<string, unknown>)[key])
  })

  return converted
}

// Convert snake_case to camelCase for JavaScript objects
export const convertObjectKeysToCamelCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(convertObjectKeysToCamelCase)
  }

  const converted: Record<string, unknown> = {}
  Object.keys(obj as Record<string, unknown>).forEach(key => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    converted[camelKey] = convertObjectKeysToCamelCase((obj as Record<string, unknown>)[key])
  })

  return converted
}

// Export the supabase client for compatibility with original models
export { supabaseAdmin as supabase } 