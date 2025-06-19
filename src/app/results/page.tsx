"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Heart, MapPin, Grid, List, SlidersHorizontal, Search, CalendarIcon, Users, Coins, Bed, Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

const resortImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "https://images.unsplash.com/photo-1464983953574-0892a716854b",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
]

const mockResorts = [
  {
    id: 1,
    name: "Club Wyndham Queenstown",
    location: "Queenstown, New Zealand",
    rating: 4.8,
    available: true,
    amenities: ["Pool", "Spa", "Gym", "Restaurant"],
    rooms: [
      {
        type: "Studio",
        maxGuests: 2,
        credits: 1200,
        availableDates: ["Dec 15-22", "Jan 5-12", "Feb 10-17"]
      },
      {
        type: "1 Bedroom",
        maxGuests: 4,
        credits: 1500,
        availableDates: ["Dec 18-25", "Jan 8-15"]
      },
      {
        type: "2 Bedroom",
        maxGuests: 6,
        credits: 1800,
        availableDates: ["Dec 20-27", "Jan 12-19"]
      }
    ]
  },
  {
    id: 2,
    name: "Club Wyndham Rotorua",
    location: "Rotorua, New Zealand",
    rating: 4.6,
    available: true,
    amenities: ["Hot Springs", "Pool", "Restaurant"],
    rooms: [
      {
        type: "Studio",
        maxGuests: 2,
        credits: 1000,
        availableDates: ["Dec 20-27", "Feb 1-8", "Mar 5-12"]
      },
      {
        type: "1 Bedroom",
        maxGuests: 4,
        credits: 1200,
        availableDates: ["Dec 22-29", "Feb 3-10"]
      }
    ]
  },
  {
    id: 3,
    name: "Club Wyndham Surfers Paradise",
    location: "Gold Coast, Australia",
    rating: 4.7,
    available: false,
    amenities: ["Beach Access", "Pool", "Gym", "Kids Club"],
    rooms: [
      {
        type: "1 Bedroom",
        maxGuests: 4,
        credits: 1600,
        availableDates: ["Waitlist only"]
      },
      {
        type: "2 Bedroom",
        maxGuests: 6,
        credits: 1800,
        availableDates: ["Waitlist only"]
      },
      {
        type: "3 Bedroom",
        maxGuests: 8,
        credits: 2200,
        availableDates: ["Waitlist only"]
      }
    ]
  },
  {
    id: 4,
    name: "Club Wyndham Sydney",
    location: "Sydney, Australia",
    rating: 4.9,
    available: true,
    amenities: ["City Views", "Pool", "Gym", "Restaurant"],
    rooms: [
      {
        type: "Studio",
        maxGuests: 2,
        credits: 1800,
        availableDates: ["Jan 15-22", "Mar 10-17", "Apr 5-12"]
      },
      {
        type: "1 Bedroom",
        maxGuests: 4,
        credits: 2000,
        availableDates: ["Jan 18-25", "Mar 12-19"]
      }
    ]
  },
  {
    id: 5,
    name: "Club Wyndham Denarau Island",
    location: "Fiji",
    rating: 4.8,
    available: false,
    amenities: ["Beach Access", "Pool", "Spa", "Restaurant"],
    rooms: [
      {
        type: "1 Bedroom",
        maxGuests: 4,
        credits: 2000,
        availableDates: ["Waitlist only"]
      },
      {
        type: "2 Bedroom",
        maxGuests: 6,
        credits: 2200,
        availableDates: ["Waitlist only"]
      }
    ]
  },
  {
    id: 6,
    name: "Club Wyndham Ballarat",
    location: "Ballarat, Australia",
    rating: 4.5,
    available: true,
    amenities: ["Pool", "Gym", "Restaurant", "Golf"],
    rooms: [
      {
        type: "Studio",
        maxGuests: 2,
        credits: 900,
        availableDates: ["Dec 10-17", "Jan 20-27", "Feb 15-22"]
      },
      {
        type: "1 Bedroom",
        maxGuests: 4,
        credits: 1100,
        availableDates: ["Dec 12-19", "Jan 22-29"]
      },
      {
        type: "2 Bedroom",
        maxGuests: 6,
        credits: 1300,
        availableDates: ["Dec 15-22", "Feb 1-8"]
      }
    ]
  },
]

const FilterContent = () => {
  const [resortOpen, setResortOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Where</label>
        <Popover open={resortOpen} onOpenChange={setResortOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <MapPin className="mr-2 h-4 w-4" />
              <span>Queenstown, NZ</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="font-semibold mb-2">Select a resort or region</div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>All Resorts</span>
              </li>
              <li className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">
                <MapPin className="h-4 w-4 text-pink-400" />
                <span>Gold Coast, QLD</span>
              </li>
              <li className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">
                <MapPin className="h-4 w-4 text-green-400" />
                <span>Queenstown, NZ</span>
              </li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">When</label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Dec 15-22</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="range" />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Guests</label>
        <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <Users className="mr-2 h-4 w-4" />
              <span>2 Adults</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="font-semibold mb-2">Guests</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Adults</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">-</Button>
                  <span>2</span>
                  <Button variant="outline" size="icon" className="h-8 w-8">+</Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Children</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">-</Button>
                  <span>0</span>
                  <Button variant="outline" size="icon" className="h-8 w-8">+</Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Credits Range</label>
        <Popover open={creditsOpen} onOpenChange={setCreditsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <Coins className="mr-2 h-4 w-4" />
              <span>Any credits</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="font-semibold mb-2">Credits Range</div>
            <ul className="space-y-2">
              <li className="cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">Any credits</li>
              <li className="cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">0 - 1,000 credits</li>
              <li className="cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">1,000 - 2,000 credits</li>
              <li className="cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">2,000+ credits</li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Resort</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="All resorts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resorts</SelectItem>
            <SelectItem value="queenstown">Club Wyndham Queenstown</SelectItem>
            <SelectItem value="rotorua">Club Wyndham Rotorua</SelectItem>
            <SelectItem value="surfers">Club Wyndham Surfers Paradise</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Room Type</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="All room types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All room types</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="1br">1 Bedroom</SelectItem>
            <SelectItem value="2br">2 Bedroom</SelectItem>
            <SelectItem value="3br">3 Bedroom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Price Range</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Any price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any price</SelectItem>
            <SelectItem value="0-1000">0 - 1,000 credits</SelectItem>
            <SelectItem value="1000-2000">1,000 - 2,000 credits</SelectItem>
            <SelectItem value="2000+">2,000+ credits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        <Search className="mr-2 h-4 w-4" />
        Update Search
      </Button>
    </div>
  )
}

export default function ResultsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="w-72 shrink-0 hidden lg:block sticky top-8 self-start">
            <Card>
              <CardHeader>
                <CardTitle>Search & Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          {/* Results Area */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold">Available Resorts</h2>
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Search & Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Search & Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'}`}>
              {mockResorts.map((resort, idx) => (
                <Card key={resort.id} className="overflow-hidden">
                  {viewMode === 'grid' ? (
                    // Grid View Layout
                    <>
                      <div className="relative h-48 w-full">
                        <img
                          src={resortImages[idx % resortImages.length]}
                          alt={resort.name}
                          className="object-cover w-full h-full"
                        />
                        <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:bg-pink-100 transition">
                          <Heart className="h-5 w-5 text-gray-400 hover:text-pink-500" />
                        </button>
                        <Badge
                          variant={resort.available ? "default" : "secondary"}
                          className="absolute top-3 left-3 bg-pink-100 text-pink-600 text-xs rounded-full px-2 py-1"
                        >
                          {resort.available ? "Available" : "Waitlist"}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{resort.name}</span>
                          <span className="text-yellow-500 font-semibold">★ {resort.rating}</span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {resort.location}
                        </div>
                        
                        <div className="space-y-3 mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Bed className="h-4 w-4 mr-1" />
                            <span>{resort.rooms.length} room type{resort.rooms.length > 1 ? 's' : ''} available</span>
                          </div>
                          <div className="space-y-2">
                            {resort.rooms.map((room, roomIdx) => (
                              <div key={roomIdx} className="bg-gray-50 rounded-lg p-3 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{room.type}</span>
                                  <span className="font-bold text-sm">{room.credits.toLocaleString()} credits</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-600">
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>Up to {room.maxGuests} guests</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>{room.availableDates.join(", ")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {resort.amenities.slice(0, 3).map((amenity) => (
                            <Badge key={amenity} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {resort.amenities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{resort.amenities.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            From {Math.min(...resort.rooms.map(r => r.credits)).toLocaleString()} credits
                          </span>
                          <Button className="rounded-full px-4 py-1 text-sm" variant={resort.available ? "default" : "secondary"}>
                            {resort.available ? "View Details" : "Join Waitlist"}
                          </Button>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    // List View Layout
                    <div className="flex">
                      <div className="relative w-48 h-32 shrink-0">
                        <img
                          src={resortImages[idx % resortImages.length]}
                          alt={resort.name}
                          className="object-cover w-full h-full"
                        />
                        <Badge
                          variant={resort.available ? "default" : "secondary"}
                          className="absolute top-2 left-2 bg-pink-100 text-pink-600 text-xs rounded-full px-2 py-1"
                        >
                          {resort.available ? "Available" : "Waitlist"}
                        </Badge>
                      </div>
                      <CardContent className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-lg">{resort.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-500 font-semibold">★ {resort.rating}</span>
                              <button className="bg-white rounded-full p-1.5 shadow hover:bg-pink-100 transition">
                                <Heart className="h-4 w-4 text-gray-400 hover:text-pink-500" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-500 text-sm mb-3">
                            <MapPin className="h-4 w-4 mr-1" />
                            {resort.location}
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <Bed className="h-4 w-4 mr-1" />
                              <span>{resort.rooms.length} room type{resort.rooms.length > 1 ? 's' : ''} available</span>
                            </div>
                            <div className="space-y-2">
                              {resort.rooms.map((room, roomIdx) => (
                                <div key={roomIdx} className="bg-gray-50 rounded-lg p-2 flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="font-medium text-sm">{room.type}</div>
                                    <div className="flex items-center text-xs text-gray-600">
                                      <Users className="h-3 w-3 mr-1" />
                                      <span>Up to {room.maxGuests} guests</span>
                                      <span className="mx-2">•</span>
                                      <Clock className="h-3 w-3 mr-1" />
                                      <span>{room.availableDates.slice(0, 2).join(", ")}{room.availableDates.length > 2 ? '...' : ''}</span>
                                    </div>
                                  </div>
                                  <div className="font-bold text-sm">{room.credits.toLocaleString()} credits</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {resort.amenities.map((amenity) => (
                              <Badge key={amenity} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg text-gray-600">
                            From {Math.min(...resort.rooms.map(r => r.credits)).toLocaleString()} credits
                          </span>
                          <Button className="rounded-full px-6 py-2" variant={resort.available ? "default" : "secondary"}>
                            {resort.available ? "View Details" : "Join Waitlist"}
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 