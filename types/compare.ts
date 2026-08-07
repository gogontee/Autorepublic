export interface Vehicle {
  id: string
  user_id: string

  title: string
  brand: string
  model: string
  trim: string | null

  year: number
  price: number

  mileage: string | null
  fuel_type: string | null
  transmission: string | null

  color: string | null
  interior_color: string | null
  engine_type: string | null

  vin: string | null
  car_code: string | null

  description: string | null

  condition: string | null
  category: string | null

  images: string[] | null
  cover_image: string | null

  city: string | null
  state: string | null
  country: string | null

  phone: string | null

  status: string | null

  featured: boolean | null
  sold: boolean | null

  unavailable: boolean | null

  views: number | null

  report_counts: number | null

  created_at: string
  updated_at: string
}

export interface CompareFeature {
  label: string
  key: keyof Vehicle | "location"
  formatter?: (value: any) => string
}