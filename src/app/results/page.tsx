'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ResortCard from '@/components/ResortCard'
import SearchFilters from '@/components/SearchFilters'
import { GridIcon, ListIcon } from 'lucide-react'

// Mock data for resorts
const mockResorts = [
  {
    id: 1,
    name: 'Club Wyndham Queenstown',
    location: 'Queenstown, New Zealand',
    image: '/api/placeholder/300/200',
    rating: 4.8,
    roomTypes: [
      { type: 'Studio', guests: 2, credits: 1200, dates: 'Dec 15-22, Jan 5-12' },
      { type: '1 Bedroom', guests: 4, credits: 1500, dates: 'Dec 18-25, Jan 8-15' },
      { type: '2 Bedroom', guests: 6, credits: 1800, dates: 'Dec 20-27, Jan 12-19' }
    ],
    amenities: ['Pool', 'Spa', 'Gym', 'Restaurant'],
    status: 'available'
  },
  {
    id: 2,
    name: 'Club Wyndham Rotorua',
    location: 'Rotorua, New Zealand',
    image: '/api/placeholder/300/200',
    rating: 4.6,
    roomTypes: [
      { type: 'Studio', guests: 2, credits: 1000, dates: 'Dec 20-27, Feb 1-8' },
      { type: '1 Bedroom', guests: 4, credits: 1200, dates: 'Dec 22-29, Feb 3-10' }
    ],
    amenities: ['Hot Springs', 'Pool', 'Restaurant'],
    status: 'available'
  },
  {
    id: 3,
    name: 'Club Wyndham Surfers Paradise',
    location: 'Gold Coast, Australia',
    image: '/api/placeholder/300/200',
    rating: 4.7,
    roomTypes: [
      { type: '1 Bedroom', guests: 4, credits: 1800, dates: 'Jan 10-17' },
      { type: '2 Bedroom', guests: 6, credits: 2200, dates: 'Jan 15-22' }
    ],
    amenities: ['Beach Access', 'Pool', 'Gym'],
    status: 'waitlist'
  },
  {
    id: 4,
    name: 'Club Wyndham Sydney',
    location: 'Sydney, Australia',
    image: '/api/placeholder/300/200',
    rating: 4.9,
    roomTypes: [
      { type: 'Studio', guests: 2, credits: 2000, dates: 'Feb 5-12' }
    ],
    amenities: ['City Views', 'Pool', 'Restaurant'],
    status: 'available'
  },
  {
    id: 5,
    name: 'Club Wyndham Denarau Island',
    location: 'Fiji',
    image: '/api/placeholder/300/200',
    rating: 4.8,
    roomTypes: [
      { type: '1 Bedroom', guests: 4, credits: 2200, dates: 'Jan 20-27' }
    ],
    amenities: ['Beach Access', 'Pool', 'Restaurant'],
    status: 'waitlist'
  },
  {
    id: 6,
    name: 'Club Wyndham Ballarat',
    location: 'Ballarat, Australia',
    image: '/api/placeholder/300/200',
    rating: 4.5,
    roomTypes: [
      { type: 'Studio', guests: 2, credits: 1100, dates: 'Dec 28 - Jan 4' }
    ],
    amenities: ['Spa', 'Restaurant'],
    status: 'available'
  }
]

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const [resorts] = useState(mockResorts)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const searchCriteria = {
    location: searchParams.get('location') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    adults: parseInt(searchParams.get('adults') || '2'),
    children: parseInt(searchParams.get('children') || '0'),
    creditRange: searchParams.get('creditRange') || '',
    roomType: searchParams.get('roomType') || ''
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching available resorts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="lg:w-1/4">
            <SearchFilters 
              searchCriteria={searchCriteria}
                             onFiltersChange={(filters: any) => {
                 // Apply filters to resorts
                 console.log('Filters changed:', filters)
               }}
            />
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Available Resorts</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  <GridIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  <ListIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {resorts.map(resort => (
                <ResortCard 
                  key={resort.id} 
                  resort={resort} 
                  viewMode={viewMode} 
                />
              ))}
            </div>

            {resorts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No resorts found matching your criteria.</p>
                <p className="text-gray-400 mt-2">Try adjusting your search filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 