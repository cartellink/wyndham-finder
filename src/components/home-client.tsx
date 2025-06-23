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
import { Search, MapPin, CalendarIcon, Users, Check, Clock } from "lucide-react"
import { useState } from "react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function HomeClient({
  regions,
}: {
  regions: { value: string; label: string }[]
}) {
  const router = useRouter()
  const [date, setDate] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState(2)
  const [location, setLocation] = useState("")
  const [stayMin, setStayMin] = useState(3)
  const [stayMax, setStayMax] = useState(7)

  const [whereOpen, setWhereOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [stayOpen, setStayOpen] = useState(false)

  const handleSearch = () => {
    if (!date?.from || !date?.to) {
      alert("Please select a date range")
      return
    }

    const searchParams = new URLSearchParams({
      region_id: location || "",
      date_start: date.from.toISOString().split('T')[0],
      date_end: date.to.toISOString().split('T')[0],
      stay_min: stayMin.toString(),
      stay_max: stayMax.toString(),
      guest_min: guests.toString(),
      max_credits: "50000", // Default to 50k credits
    })

    router.push(`/results?${searchParams.toString()}`)
  }

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
                  <PopoverContent className="w-auto p-0 max-w-[95vw]" align="start">
                    <Calendar
                      mode="range"
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={1}
                      className="rounded-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Stay length</label>
                <Popover open={stayOpen} onOpenChange={setStayOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">
                        {stayMin === stayMax ? `${stayMin} days` : `${stayMin}-${stayMax} days`}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Minimum stay</div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full" 
                            onClick={() => setStayMin(Math.max(1, stayMin - 1))}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{stayMin}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full" 
                            onClick={() => setStayMin(Math.min(14, stayMin + 1))}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Maximum stay</div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full" 
                            onClick={() => setStayMax(Math.max(stayMin, stayMax - 1))}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{stayMax}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full" 
                            onClick={() => setStayMax(Math.min(14, stayMax + 1))}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

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

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg"
                onClick={handleSearch}
              >
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