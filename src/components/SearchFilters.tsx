import { useState } from 'react'
import { SearchIcon } from 'lucide-react'

interface SearchCriteria {
  location: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  creditRange: string
  roomType: string
}

interface SearchFiltersProps {
  searchCriteria: SearchCriteria
  onFiltersChange: (filters: SearchCriteria) => void
}

export default function SearchFilters({ searchCriteria, onFiltersChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState(searchCriteria)

  const updateFilters = (key: keyof SearchCriteria, value: string | number) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Search & Filters</h2>
      
      <div className="space-y-4">
        {/* Where */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Where</label>
          <select
            value={filters.location}
            onChange={(e) => updateFilters('location', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All locations</option>
            <option value="queenstown">Queenstown, NZ</option>
            <option value="rotorua">Rotorua, NZ</option>
            <option value="gold-coast">Gold Coast, Australia</option>
            <option value="sydney">Sydney, Australia</option>
            <option value="ballarat">Ballarat, Australia</option>
            <option value="fiji">Fiji</option>
          </select>
        </div>

        {/* When */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">When</label>
          <input
            type="text"
            value="Dec 15-22"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            readOnly
          />
        </div>

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
          <input
            type="text"
            value={`${filters.adults} Adults`}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            readOnly
          />
        </div>

        {/* Credits Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Credits Range</label>
          <select
            value={filters.creditRange}
            onChange={(e) => updateFilters('creditRange', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Any credits</option>
            <option value="1000-1500">1,000 - 1,500 credits</option>
            <option value="1500-2000">1,500 - 2,000 credits</option>
            <option value="2000-2500">2,000 - 2,500 credits</option>
            <option value="2500+">2,500+ credits</option>
          </select>
        </div>

        {/* Resort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Resort</label>
          <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All resorts</option>
            <option value="queenstown">Club Wyndham Queenstown</option>
            <option value="rotorua">Club Wyndham Rotorua</option>
            <option value="surfers">Club Wyndham Surfers Paradise</option>
            <option value="sydney">Club Wyndham Sydney</option>
            <option value="denarau">Club Wyndham Denarau Island</option>
            <option value="ballarat">Club Wyndham Ballarat</option>
          </select>
        </div>

        {/* Room Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
          <select
            value={filters.roomType}
            onChange={(e) => updateFilters('roomType', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All room types</option>
            <option value="studio">Studio</option>
            <option value="1-bedroom">1 Bedroom</option>
            <option value="2-bedroom">2 Bedroom</option>
            <option value="3-bedroom">3 Bedroom</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
          <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Any price</option>
            <option value="1000-1500">1,000 - 1,500 credits</option>
            <option value="1500-2000">1,500 - 2,000 credits</option>
            <option value="2000+">2,000+ credits</option>
          </select>
        </div>

        {/* Update Search Button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
          <SearchIcon className="h-4 w-4" />
          <span>Update Search</span>
        </button>
      </div>
    </div>
  )
} 