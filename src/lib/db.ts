import { supabaseAdmin } from './supabase'

// Helper function to convert camelCase to snake_case
const camelToSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // detect substrings that are uppercase, but are followed by a camelCase substring. e.g. URLCode -> URL_Code
    .replace(/([a-z\d])([A-Z])/g, '$1_$2') // standard camelCase conversion
    .toLowerCase()
}

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
    const snakeKey = camelToSnakeCase(key)
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