"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin } from "lucide-react"
import type { ResortData } from "@/lib/types"

interface ResortCardProps {
  resort: ResortData
  isExpanded?: boolean
}

export const ResortCard = ({ resort, isExpanded = false }: ResortCardProps) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(
    resort.rooms[0]?.room_id.toString()
  )

  const selectedRoom = resort.rooms.find(
    (r) => r.room_id.toString() === selectedRoomId
  )

  const ExpandedView = () => (
    <div className="space-y-4">
      {resort.rooms.map((room) => (
        <div key={room.room_id}>
          <h4 className="font-medium text-gray-900 mb-2">{room.room_name}</h4>
          <div className="grid grid-cols-2 gap-3">
            {room.availabilities.map((availability, availIndex) => (
              <div
                key={availIndex}
                className="rounded-lg p-3 bg-gray-100 text-center border"
              >
                <div className="text-sm font-semibold text-gray-800">
                  {new Date(availability.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(availability.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div className="text-xs text-gray-500">
                  {availability.days_count} nights
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-indigo-600">
                    {availability.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 -mt-1">credits</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ({Math.round(availability.points_per_day).toLocaleString()} / night)
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <Card className="overflow-hidden flex flex-col">
      <div 
        className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative bg-cover bg-center"
        style={{
          backgroundImage: resort.hero_image_url 
            ? `url(${resort.hero_image_url})` 
            : undefined
        }}
      >
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-semibold text-lg mb-1 drop-shadow-lg">
            {resort.resort_name}
          </h3>
          <div className="flex items-center text-white text-sm drop-shadow-lg">
            <MapPin className="mr-1 h-4 w-4" />
            {resort.state && `${resort.state}, `}
            {resort.country}
          </div>
        </div>
      </div>
      <CardContent className="p-6 flex-1">
        {isExpanded ? (
          <ExpandedView />
        ) : (
          <>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a room type..." />
              </SelectTrigger>
              <SelectContent>
                {resort.rooms.map((room) => (
                  <SelectItem
                    key={room.room_id}
                    value={room.room_id.toString()}
                  >
                    {room.room_name} ({room.availabilities.length} dates)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRoom && (
              <div className="grid grid-cols-2 gap-3 pt-4">
                {selectedRoom.availabilities.map((availability, availIndex) => (
                  <div
                    key={availIndex}
                    className="rounded-lg p-3 bg-gray-100 text-center border"
                  >
                    <div className="text-sm font-semibold text-gray-800">
                      {new Date(availability.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(availability.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {availability.days_count} nights
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-bold text-indigo-600">
                        {availability.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 -mt-1">credits</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ({Math.round(availability.points_per_day).toLocaleString()} / night)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 