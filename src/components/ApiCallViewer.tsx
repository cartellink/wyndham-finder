'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, GlobeIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'

interface ApiCall {
  timestamp: string
  url: string
  method: string
  status: number
  duration: number
  payload?: unknown
  response?: unknown
  error?: boolean
}

interface ApiCallViewerProps {
  apiCalls: ApiCall[]
  currentUrl?: string
}

export default function ApiCallViewer({ apiCalls, currentUrl }: ApiCallViewerProps) {
  const [expandedCalls, setExpandedCalls] = useState<Set<number>>(new Set())

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedCalls)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCalls(newExpanded)
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 400) return 'text-red-600'
    return 'text-yellow-600'
  }

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircleIcon className="h-4 w-4 text-green-600" />
    if (status >= 400 || status === 0) return <XCircleIcon className="h-4 w-4 text-red-600" />
    return <ClockIcon className="h-4 w-4 text-yellow-600" />
  }

  const safeStringify = (value: unknown): string => {
    try {
      if (typeof value === 'string') return value
      if (value === null || value === undefined) return 'null'
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return {
        domain: urlObj.hostname,
        path: urlObj.pathname,
        query: urlObj.search
      }
    } catch {
      return { domain: '', path: url, query: '' }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <GlobeIcon className="h-5 w-5 mr-2" />
            API Calls ({apiCalls.length})
          </h3>
          {currentUrl && (
            <div className="text-sm text-gray-600">
              Current: <span className="font-mono">{formatUrl(currentUrl).domain}{formatUrl(currentUrl).path}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {apiCalls.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No API calls yet...
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {apiCalls.slice(-20).reverse().map((call, index) => {
              const actualIndex = apiCalls.length - 1 - index
              const isExpanded = expandedCalls.has(actualIndex)
              const urlParts = formatUrl(call.url)
              
              return (
                <div key={actualIndex} className="p-4 hover:bg-gray-50">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpanded(actualIndex)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      
                      {getStatusIcon(call.status)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {call.method}
                          </span>
                          <span className={`text-sm font-medium ${getStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {call.duration}ms
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-sm text-gray-600 font-mono">
                            {urlParts.domain}
                          </span>
                          <span className="text-sm text-gray-900 font-mono">
                            {urlParts.path}
                          </span>
                          {urlParts.query && (
                            <span className="text-sm text-gray-500 font-mono">
                              {urlParts.query}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 flex-shrink-0 ml-4">
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-3 ml-11 space-y-3">
                      {call.payload && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Request Payload:</h4>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {safeStringify(call.payload)}
                          </pre>
                        </div>
                      )}
                      
                      {call.response && (
                        <div>
                          <h4 className={`text-sm font-medium mb-1 ${call.error ? 'text-red-900' : 'text-gray-900'}`}>
                            {call.error ? 'Error Details:' : 'Response:'}
                          </h4>
                          <pre className={`text-xs p-2 rounded overflow-x-auto max-h-64 ${call.error ? 'bg-red-50 text-red-800' : 'bg-gray-100'}`}>
                            {safeStringify(call.response)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 