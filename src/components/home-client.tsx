"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search, MapPin, CalendarIcon, Users, Check } from "lucide-react"
import { useState } from "react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

export function HomeClient({
  regions,
}: {
  regions: { value: string; label: string }[]
}) {
  const [date, setDate] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState(2)
  const [location, setLocation] = useState("")
  const [credits, setCredits] = useState([5000])
  const [stayLength, setStayLength] = useState([3, 7])

  const [whereOpen, setWhereOpen] = useState(false)
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
                <Popover open={whereOpen} onOpenChange={setWhereOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={whereOpen}
                      className="w-full justify-start"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                      {location
                        ? regions.find((region) => region.value === location)?.label
                        : "Select region"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0">
                    <Command>
                      <CommandInput placeholder="Search region..." />
                      <CommandList>
                        <CommandEmpty>No region found.</CommandEmpty>
                        <CommandGroup>
                          {regions.map((region) => (
                            <CommandItem
                              key={region.value}
                              value={region.value}
                              onSelect={(currentValue) => {
                                setLocation(currentValue === location ? "" : currentValue)
                                setWhereOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  location === region.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {region.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search between</label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">
                        {date?.from ? (
                          date.to ? (
                            <>
                              {new Intl.DateTimeFormat("en-US", {
                                day: "numeric",
                                month: "short",
                              }).format(date.from)}{" "}
                              -{" "}
                              {new Intl.DateTimeFormat("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }).format(date.to)}
                            </>
                          ) : (
                            new Intl.DateTimeFormat("en-US", {
                              day: "numeric",
                              month: "short",
                            }).format(date.from)
                          )
                        ) : (
                          "Select a date range to search within"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">For a stay of</label>
                <div className="pt-2">
                  <Slider
                    defaultValue={stayLength}
                    onValueChange={setStayLength}
                    max={14}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{stayLength[0]} days</span>
                  <span>{stayLength[1]} days</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Guests</label>
                  <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Users className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">{guests} Guests</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52" align="start">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Guests</div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setGuests(Math.max(1, guests - 1))}>-</Button>
                          <span className="w-8 text-center">{guests}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setGuests(guests + 1)}>+</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Max credits per night</label>
                  <div className="pt-2">
                    <Slider
                      defaultValue={credits}
                      onValueChange={setCredits}
                      max={10000}
                      step={100}
                      className="w-full"
                    />
                  </div>
                  <div className="text-right text-sm text-gray-500">{credits[0]} credits</div>
                </div>
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