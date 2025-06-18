import { StarIcon, UsersIcon, HeartIcon } from 'lucide-react'
import Image from 'next/image'

interface RoomType {
  type: string
  guests: number
  credits: number
  dates: string
}

interface Resort {
  id: number
  name: string
  location: string
  image: string
  rating: number
  roomTypes: RoomType[]
  amenities: string[]
  status: 'available' | 'waitlist'
}

interface ResortCardProps {
  resort: Resort
  viewMode: 'grid' | 'list'
}

export default function ResortCard({ resort, viewMode }: ResortCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'waitlist':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available'
      case 'waitlist':
        return 'Waitlist'
      default:
        return status
    }
  }

  const minCredits = Math.min(...resort.roomTypes.map(room => room.credits))

  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
        <div className="relative">
          <Image
            src={resort.image}
            alt={resort.name}
            width={300}
            height={200}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(resort.status)}`}>
              {getStatusText(resort.status)}
            </span>
          </div>
          <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
            <HeartIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{resort.name}</h3>
            <div className="flex items-center space-x-1">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{resort.rating}</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">{resort.location}</p>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{minCredits.toLocaleString()} credits</p>
            <button className="mt-3 w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-64 h-48 md:h-auto">
          <Image
            src={resort.image}
            alt={resort.name}
            width={300}
            height={200}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(resort.status)}`}>
              {getStatusText(resort.status)}
            </span>
          </div>
        </div>
        
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{resort.name}</h3>
              <p className="text-gray-600">{resort.location}</p>
            </div>
            <div className="flex items-center space-x-1">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-gray-600">{resort.rating}</span>
              <button className="ml-3 p-1">
                <HeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors" />
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">🏠 {resort.roomTypes.length} room types available</p>
            <div className="space-y-2">
              {resort.roomTypes.slice(0, 2).map((room, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{room.type}</span>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <UsersIcon className="h-3 w-3" />
                      <span>Up to {room.guests} guests</span>
                    </div>
                    <span className="text-gray-500">• 📅 {room.dates}</span>
                  </div>
                  <span className="font-semibold">{room.credits.toLocaleString()} credits</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {resort.amenities.map((amenity, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {amenity}
              </span>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-bold text-gray-900">From {minCredits.toLocaleString()} credits</p>
            </div>
            <button className="bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-800 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 