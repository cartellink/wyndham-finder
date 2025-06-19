"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Search, MapPin } from "lucide-react"
import { useState } from "react"

export default function SearchPage() {
  const [resortOpen, setResortOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-12">
      {/* Centered Expedia-style Search Bar */}
      <div className="flex justify-center pt-12 sm:pt-24">
        <form className="flex w-full max-w-4xl rounded-full shadow-lg bg-white px-2 py-2 items-center gap-1 border border-gray-200 overflow-x-auto">
          {/* Where */}
          <Popover open={resortOpen} onOpenChange={setResortOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" className="rounded-full px-4 py-3 font-normal text-gray-700 hover:bg-gray-100 flex-1 min-w-0">
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-medium text-gray-900">Where</span>
                  <span className="text-sm text-gray-500 truncate">Resort or region</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 rounded-2xl shadow-xl mt-2">
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
                <li className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">
                  <MapPin className="h-4 w-4 text-yellow-400" />
                  <span>Fiji</span>
                </li>
              </ul>
            </PopoverContent>
          </Popover>
          
          <span className="h-8 w-px bg-gray-200" />
          
          {/* When */}
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" className="rounded-full px-4 py-3 font-normal text-gray-700 hover:bg-gray-100 flex-1 min-w-0">
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-medium text-gray-900">When</span>
                  <span className="text-sm text-gray-500 truncate">Add dates</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-2xl shadow-xl mt-2 p-4">
              <Calendar mode="range" />
            </PopoverContent>
          </Popover>
          
          <span className="h-8 w-px bg-gray-200" />
          
          {/* Guests */}
          <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" className="rounded-full px-4 py-3 font-normal text-gray-700 hover:bg-gray-100 flex-1 min-w-0">
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-medium text-gray-900">Guests</span>
                  <span className="text-sm text-gray-500 truncate">2 Adults</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 rounded-2xl shadow-xl mt-2 p-4">
              <div className="font-semibold mb-4">Guests</div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Adults</span>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">-</Button>
                    <span className="w-8 text-center">2</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">+</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Children</span>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">-</Button>
                    <span className="w-8 text-center">0</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">+</Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <span className="h-8 w-px bg-gray-200" />
          
          {/* Credits */}
          <Popover open={creditsOpen} onOpenChange={setCreditsOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" className="rounded-full px-4 py-3 font-normal text-gray-700 hover:bg-gray-100 flex-1 min-w-0">
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-medium text-gray-900">Credits</span>
                  <span className="text-sm text-gray-500 truncate">Any range</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 rounded-2xl shadow-xl mt-2 p-4">
              <div className="font-semibold mb-2">Credits Range</div>
              <ul className="space-y-2">
                <li className="cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">Any range</li>
                <li className="cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">0 - 1,000 credits</li>
                <li className="cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">1,000 - 2,000 credits</li>
                <li className="cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1">2,000+ credits</li>
              </ul>
            </PopoverContent>
          </Popover>
          
          {/* Search Button */}
          <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold ml-2 px-8 py-3 h-12">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </form>
      </div>
    </div>
  )
} 