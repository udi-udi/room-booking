export interface Room {
  id: string
  name: string
  locationId: string
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  name: string
  companyId: string
  rooms: Room[]
  _count?: { rooms: number }
  createdAt: string
  updatedAt: string
}
