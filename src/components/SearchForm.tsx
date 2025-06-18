'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarIcon, MapPinIcon, UsersIcon, CreditCardIcon, HomeIcon, SearchIcon } from 'lucide-react'

export default function SearchForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    creditRange: '',
    roomType: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Navigate to results page with search params
    const params = new URLSearchParams({
      location: formData.location,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      adults: formData.adults.toString(),
      children: formData.children.toString(),
      creditRange: formData.creditRange,
      roomType: formData.roomType
    })
    router.push(`/results?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Search Resorts</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Where */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Where</label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            >
              <option value="">Select resort or region</option>
              <option value="queenstown">Queenstown, NZ</option>
              <option value="rotorua">Rotorua, NZ</option>
              <option value="gold-coast">Gold Coast, Australia</option>
              <option value="sydney">Sydney, Australia</option>
              <option value="ballarat">Ballarat, Australia</option>
              <option value="fiji">Fiji</option>
            </select>
          </div>
        </div>

        {/* When */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">When</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Select check-in and check-out dates"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.checkIn && formData.checkOut ? `${formData.checkIn} - ${formData.checkOut}` : ''}
              readOnly
            />
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
          <div className="relative">
            <UsersIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={`${formData.adults} Adults, ${formData.children} Children`}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
          </div>
        </div>

        {/* Credits Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Credits Range</label>
          <div className="relative">
            <CreditCardIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={formData.creditRange}
              onChange={(e) => setFormData(prev => ({ ...prev, creditRange: e.target.value }))}
            >
              <option value="">Any credit range</option>
              <option value="1000-1500">1,000 - 1,500 credits</option>
              <option value="1500-2000">1,500 - 2,000 credits</option>
              <option value="2000-2500">2,000 - 2,500 credits</option>
              <option value="2500+">2,500+ credits</option>
            </select>
          </div>
        </div>

        {/* Room Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
          <div className="relative">
            <HomeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              value={formData.roomType}
              onChange={(e) => setFormData(prev => ({ ...prev, roomType: e.target.value }))}
            >
              <option value="">Any room type</option>
              <option value="studio">Studio</option>
              <option value="1-bedroom">1 Bedroom</option>
              <option value="2-bedroom">2 Bedroom</option>
              <option value="3-bedroom">3 Bedroom</option>
            </select>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <SearchIcon className="h-5 w-5" />
          <span>Search Resorts</span>
        </button>
      </form>
    </div>
  )
} 