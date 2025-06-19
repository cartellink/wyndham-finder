'use client'

import { useState, useEffect } from 'react'
import { PlayIcon, RefreshCwIcon, EyeIcon, DatabaseIcon, ClockIcon } from 'lucide-react'
import ApiCallViewer from '@/components/ApiCallViewer'

interface ScrapingStatus {
  isRunning: boolean
  currentStep: string
  progress: {
    resorts: { processed: number; total: number }
    rooms: { processed: number; total: number }
    availability: { processed: number; total: number }
  }
  logs: LogEntry[]
  stats: {
    startTime?: string
    estimatedCompletion?: string
    totalRequests: number
    successfulRequests: number
    errors: number
  }
  apiCalls?: Array<{
    timestamp: string
    url: string
    method: string
    status: number
    duration: number
    payload?: unknown
    response?: unknown
  }>
  currentUrl?: string
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'error' | 'success' | 'warning'
  message: string
  details?: unknown
}

export default function ScrapingMonitorPage() {
  const [status, setStatus] = useState<ScrapingStatus>({
    isRunning: false,
    currentStep: 'Idle',
    progress: {
      resorts: { processed: 0, total: 0 },
      rooms: { processed: 0, total: 0 },
      availability: { processed: 0, total: 0 }
    },
    logs: [],
    stats: {
      totalRequests: 0,
      successfulRequests: 0,
      errors: 0
    }
  })

  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/scraping-status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch scraping status:', error)
    }
  }

  const startScraping = async () => {
    try {
      const response = await fetch('/api/cron/scrape-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true, monitor: true })
      })
      
      if (response.ok) {
        setStatus(prev => ({ ...prev, isRunning: true, currentStep: 'Starting...' }))
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to start scraping:', error)
    }
  }



  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  const getProgressPercentage = (processed: number, total: number) => {
    return total > 0 ? Math.round((processed / total) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wyndham Scraping Monitor</h1>
          <p className="text-gray-600">Real-time monitoring of scraping operations</p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${status.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-lg font-medium">
                {status.isRunning ? `Running: ${status.currentStep}` : 'Idle'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-refresh</span>
              </label>
              
              <button
                onClick={fetchStatus}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCwIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={startScraping}
                disabled={status.isRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PlayIcon className="h-4 w-4" />
                <span>Start Scraping</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resorts</h3>
              <DatabaseIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{status.progress.resorts.processed} / {status.progress.resorts.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage(status.progress.resorts.processed, status.progress.resorts.total)}%` }}
                ></div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {getProgressPercentage(status.progress.resorts.processed, status.progress.resorts.total)}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Rooms</h3>
              <EyeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{status.progress.rooms.processed} / {status.progress.rooms.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage(status.progress.rooms.processed, status.progress.rooms.total)}%` }}
                ></div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {getProgressPercentage(status.progress.rooms.processed, status.progress.rooms.total)}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Availability</h3>
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{status.progress.availability.processed} / {status.progress.availability.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage(status.progress.availability.processed, status.progress.availability.total)}%` }}
                ></div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {getProgressPercentage(status.progress.availability.processed, status.progress.availability.total)}%
              </div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status.stats.totalRequests}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{status.stats.successfulRequests}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{status.stats.errors}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {status.stats.startTime ? new Date(status.stats.startTime).toLocaleTimeString() : '--:--'}
              </div>
              <div className="text-sm text-gray-600">Started</div>
            </div>
          </div>
        </div>

                {/* API Calls and Live Logs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Calls Viewer */}
          <ApiCallViewer 
            apiCalls={status.apiCalls || []} 
            currentUrl={status.currentUrl}
          />

          {/* Live Logs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Live Logs</h3>
            </div>
            <div className="p-6">
              <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                {status.logs.length === 0 ? (
                  <div className="text-gray-500">No logs yet...</div>
                ) : (
                  status.logs.map((log, index) => (
                    <div key={index} className="mb-2 text-gray-300">
                      <span className="text-gray-500">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className="ml-2">{getLogIcon(log.level)}</span>
                      <span className="ml-2">{log.message}</span>
                      {log.details && (
                        <pre className="ml-8 mt-1 text-xs text-gray-400 overflow-x-auto">
                          {String(typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2))}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 