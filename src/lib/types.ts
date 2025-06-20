export interface SearchResult {
  room_id: number;
  room_name: string;
  resort_name: string;
  region_name: string;
  country: string;
  state: string;
  start_date: string;
  end_date: string;
  days_count: number;
  points: number;
  points_per_day: number;
  hero_image_url?: string;
}

export interface Availability {
  start_date: string;
  end_date: string;
  days_count: number;
  points: number;
  points_per_day: number;
}

export interface RoomInfo {
  room_id: number;
  room_name: string;
  availabilities: Availability[];
}

export interface ResortData {
  resort_name: string;
  region_name: string;
  country: string;
  state: string;
  rooms: RoomInfo[];
  hero_image_url?: string;
}

export interface MonthGroup {
  month: string;
  monthDisplay: string;
  resorts: ResortData[];
}

export interface FilterValues {
  region_id: string;
  date_start?: Date;
  date_end?: Date;
  stay_min: number;
  stay_max: number;
  guest_min: number;
  max_credits: number;
} 