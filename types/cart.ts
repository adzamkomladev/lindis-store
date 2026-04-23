export interface CartItem {
  id: string    // MongoDB ObjectId string (was: number)
  name: string
  slug: string
  price: number // in minor units (pesewas)
  image?: string
  quantity: number
  customTexts?: string[]
}

export interface CartState {
  items: CartItem[]
}
