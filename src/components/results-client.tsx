"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { MapPin, Grid, List, Search, CalendarIcon, Users, Check, Loader2, SlidersHorizontal, Clock } from "lucide-react"

import { SearchResult, MonthGroup, ResortData, RoomInfo, FilterValues } from "@/lib/types"
import { ResortCard } from "@/components/resort-card"

interface Region {
  value: string;
  label: string;
}

const FilterContent = ({
  regions,
  onApplyFilters,
  onToggleExpand,
  isExpanded,
}: {
  regions: Region[];
  onApplyFilters: (filters: FilterValues) => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
}) => {
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(searchParams.get("region_id") || "");
  const [date, setDate] = useState<DateRange | undefined>({
    from: searchParams.get("date_start") ? new Date(searchParams.get("date_start")!) : undefined,
    to: searchParams.get("date_end") ? new Date(searchParams.get("date_end")!) : undefined,
  });
  const [stayMin, setStayMin] = useState(parseInt(searchParams.get("stay_min") || "3", 10));
  const [stayMax, setStayMax] = useState(parseInt(searchParams.get("stay_max") || "7", 10));
  const [guests, setGuests] = useState(parseInt(searchParams.get("guest_min") || "2", 10));
  const [credits, setCredits] = useState([parseInt(searchParams.get("max_credits") || "5000", 10)]);
  
  const [whereOpen, setWhereOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [stayOpen, setStayOpen] = useState(false);

  const handleApply = () => {
    onApplyFilters({
      region_id: location,
      date_start: date?.from,
      date_end: date?.to,
      stay_min: stayMin,
      stay_max: stayMax,
      guest_min: guests,
      max_credits: credits[0],
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Where</label>
        <Popover open={whereOpen} onOpenChange={setWhereOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-start">
              <MapPin className="mr-2 h-4 w-4 text-gray-400" />
              <span className="text-gray-500">
                {location ? regions.find((r) => r.value === location)?.label : "Select region"}
              </span>
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
                        setLocation(currentValue === location ? "" : currentValue);
                        setWhereOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", location === region.value ? "opacity-100" : "opacity-0")} />
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
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
              <span className="text-gray-500">
                {date?.from ? (
                  date.to ? (
                    <>
                      {new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(date.from)} -{" "}
                      {new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date.to)}
                    </>
                  ) : (
                    new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(date.from)
                  )
                ) : ( "Select a date range to search within" )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 max-w-[95vw]" align="start">
            <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={1} className="rounded-md" />
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

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Max credits per night</label>
        <div className="pt-2 px-2">
          <Slider defaultValue={credits} onValueChange={setCredits} max={50000} step={1000} />
        </div>
        <div className="text-right text-sm px-2 text-gray-600">{credits[0].toLocaleString()} credits</div>
      </div>

      <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg">
        <Search className="mr-2 h-5 w-5" />
        Apply Filters
      </Button>

      <div className="pt-4 text-center">
        <button onClick={onToggleExpand} className="text-sm text-blue-600 hover:underline">
          {isExpanded ? "Collapse all rooms" : "Expand all rooms"}
        </button>
      </div>
    </div>
  );
};

export default function ResultsClient({ regions }: { regions: Region[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isExpandedView, setIsExpandedView] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams(searchParams.toString());
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch results");
        setResults(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [searchParams]);

  const handleApplyFilters = (filters: FilterValues) => {
    const params = new URLSearchParams();
    if (filters.region_id) params.set("region_id", filters.region_id);
    if (filters.date_start) params.set("date_start", filters.date_start.toISOString().split("T")[0]);
    if (filters.date_end) params.set("date_end", filters.date_end.toISOString().split("T")[0]);
    if (filters.stay_min) params.set("stay_min", filters.stay_min.toString());
    if (filters.stay_max) params.set("stay_max", filters.stay_max.toString());
    if (filters.guest_min) params.set("guest_min", filters.guest_min.toString());
    if (filters.max_credits) params.set("max_credits", filters.max_credits.toString());
    router.push(`/results?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Searching for available rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const resortsData = results.reduce((acc, result) => {
    const resortKey = result.resort_name;
    if (!acc[resortKey]) {
      acc[resortKey] = {
        id: result.resort_id,
        resort_name: result.resort_name,
        region_name: result.region_name,
        country: result.country,
        state: result.state,
        rooms: [],
        hero_image_url: result.hero_image_url,
      };
    }
    let roomGroup = acc[resortKey].rooms.find((r) => r.room_id === result.room_id);
    if (!roomGroup) {
      roomGroup = { room_id: result.room_id, room_name: result.room_name, availabilities: [] };
      acc[resortKey].rooms.push(roomGroup);
    }
    roomGroup.availabilities.push({
      start_date: result.start_date,
      end_date: result.end_date,
      days_count: result.days_count,
      points: result.points,
      points_per_day: result.points_per_day,
    });
    return acc;
  }, {} as Record<string, ResortData>);

  Object.values(resortsData).forEach((resort) => {
    resort.rooms.sort((a, b) => a.room_name.localeCompare(b.room_name));
    resort.rooms.forEach((room) => {
      room.availabilities.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    });
  });
  const resortList = Object.values(resortsData);

  const groupByMonth = (resorts: ResortData[]): MonthGroup[] => {
    const monthGroups: Record<string, MonthGroup> = {};
    resorts.forEach((resort) => {
      const availabilitiesByMonth: Record<string, { monthDisplay: string; rooms: RoomInfo[] }> = {};
      resort.rooms.forEach((room) => {
        room.availabilities.forEach((availability) => {
          const startDate = new Date(availability.start_date);
          const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
          if (!availabilitiesByMonth[monthKey]) {
            availabilitiesByMonth[monthKey] = {
              monthDisplay: startDate.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
              rooms: [],
            };
          }
          let roomInMonth = availabilitiesByMonth[monthKey].rooms.find((r) => r.room_id === room.room_id);
          if (!roomInMonth) {
            roomInMonth = { room_id: room.room_id, room_name: room.room_name, availabilities: [] };
            availabilitiesByMonth[monthKey].rooms.push(roomInMonth);
          }
          roomInMonth.availabilities.push(availability);
        });
      });
      Object.entries(availabilitiesByMonth).forEach(([monthKey, { monthDisplay, rooms }]) => {
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = { month: monthKey, monthDisplay, resorts: [] };
        }
        monthGroups[monthKey].resorts.push({ ...resort, rooms: rooms.sort((a, b) => a.room_name.localeCompare(b.room_name)) });
      });
    });
    const sortedMonthGroups = Object.values(monthGroups).sort((a, b) => a.month.localeCompare(b.month));
    sortedMonthGroups.forEach((group) => group.resorts.sort((a, b) => a.resort_name.localeCompare(b.resort_name)));
    return sortedMonthGroups;
  };

  const monthGroups = groupByMonth(resortList);

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 min-h-screen hidden md:block">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <FilterContent
            regions={regions}
            onApplyFilters={handleApplyFilters}
            onToggleExpand={() => setIsExpandedView(!isExpandedView)}
            isExpanded={isExpandedView}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
              <p className="text-gray-600">Found {resortList.length} resorts with available rooms</p>
            </div>
            
            {/* Mobile Filter Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full max-w-none h-full overflow-y-auto">
                  <div className="h-full flex flex-col">
                    <SheetTitle className="text-lg font-semibold text-gray-900 mb-6 px-4 pt-4">Filters</SheetTitle>
                    <div className="flex-1 overflow-y-auto">
                      <FilterContent
                        regions={regions}
                        onApplyFilters={handleApplyFilters}
                        onToggleExpand={() => setIsExpandedView(!isExpandedView)}
                        isExpanded={isExpandedView}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="hidden md:flex items-center border rounded-lg ml-4">
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {monthGroups.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or dates</p>
              <Button onClick={() => window.history.back()}>Modify Search</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {monthGroups.map((monthGroup) => (
                <div key={monthGroup.month}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">{monthGroup.monthDisplay}</h2>
                  <div className={cn(
                    "space-y-6", // Mobile: always list view
                    viewMode === "grid" && "md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6"
                  )}>
                    {monthGroup.resorts.map((resort, index) => (
                      <ResortCard
                        key={`${monthGroup.month}-${resort.resort_name}-${index}`}
                        resort={resort}
                        isExpanded={isExpandedView}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 