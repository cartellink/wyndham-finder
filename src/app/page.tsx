"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, CalendarIcon, Users, Coins } from "lucide-react"
import { useState } from "react"

export default function Home() {
  const [dateOpen, setDateOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-12">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Search All Club Wyndham South Pacific Resorts</h1>
            <p className="text-gray-600">Real-time availability across all Club Wyndham SP resorts</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Search Resorts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Where</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Select resort or region" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resorts</SelectItem>
                    <SelectItem value="queenstown">Club Wyndham Queenstown</SelectItem>
                    <SelectItem value="rotorua">Club Wyndham Rotorua</SelectItem>
                    <SelectItem value="surfers">Club Wyndham Surfers Paradise</SelectItem>
                    <SelectItem value="sydney">Club Wyndham Sydney</SelectItem>
                    <SelectItem value="denarau">Club Wyndham Denarau Island</SelectItem>
                    <SelectItem value="ballarat">Club Wyndham Ballarat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">When</label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">Select check-in and check-out dates</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Guests</label>
                <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Users className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">2 Adults, 0 Children</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Adults</div>
                          <div className="text-sm text-gray-500">Ages 13 or above</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">-</Button>
                          <span className="w-8 text-center">2</span>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">+</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Children</div>
                          <div className="text-sm text-gray-500">Ages 2-12</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">-</Button>
                          <span className="w-8 text-center">0</span>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">+</Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Credits Range</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <Coins className="mr-2 h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Any credit range" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any credit range</SelectItem>
                    <SelectItem value="0-1000">0 - 1,000 credits</SelectItem>
                    <SelectItem value="1000-2000">1,000 - 2,000 credits</SelectItem>
                    <SelectItem value="2000-3000">2,000 - 3,000 credits</SelectItem>
                    <SelectItem value="3000+">3,000+ credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Room Type</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any room type</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="1br">1 Bedroom</SelectItem>
                    <SelectItem value="2br">2 Bedroom</SelectItem>
                    <SelectItem value="3br">3 Bedroom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg">
                <Search className="mr-2 h-5 w-5" />
                Search Resorts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
