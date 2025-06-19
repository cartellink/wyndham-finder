import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { MapPin, Star, Users, CreditCard } from "lucide-react"

interface ResortDetailModalProps {
  isOpen: boolean
  onClose: () => void
  resort: {
    id: number
    name: string
    location: string
    rating: number
    credits: number
    image: string
    description: string
    amenities: string[]
    roomTypes: {
      name: string
      credits: number
      maxGuests: number
      available: boolean
    }[]
  }
}

export function ResortDetailModal({ isOpen, onClose, resort }: ResortDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{resort.name}</DialogTitle>
          <DialogDescription className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {resort.location}
            <span className="mx-2">•</span>
            <Star className="h-4 w-4 fill-current text-yellow-400" />
            <span className="ml-1">{resort.rating}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-video relative rounded-lg overflow-hidden">
              <img
                src={resort.image}
                alt={resort.name}
                className="object-cover w-full h-full"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{resort.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {resort.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Availability Calendar</h3>
              <Calendar
                mode="single"
                className="rounded-md border"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-4">Room Types</h3>
              <div className="space-y-4">
                {resort.roomTypes.map((room) => (
                  <div
                    key={room.name}
                    className="p-4 rounded-lg border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{room.name}</h4>
                      <Badge variant={room.available ? "default" : "secondary"}>
                        {room.available ? "Available" : "Waitlist"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Up to {room.maxGuests} guests
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-1" />
                        {room.credits.toLocaleString()} credits
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant={room.available ? "default" : "secondary"}
                    >
                      {room.available ? "Book Now" : "Join Waitlist"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 