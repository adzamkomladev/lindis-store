import type { CartItem, CartState } from '~~/types/cart'

export const useCart = () => {
  const cart = useState<CartState>('cart', () => ({
    items: []
  }))

  // Load from local storage on client side only
  if (import.meta.client) {
    onMounted(() => {
      const saved = localStorage.getItem('lindis-store-cart')
      if (saved) {
        try {
          cart.value = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to load cart', e)
        }
      }
    })

    // Watch for changes and save to local storage
    watch(cart, (newCart) => {
      localStorage.setItem('lindis-store-cart', JSON.stringify(newCart))
    }, { deep: true })
  }

  const addToCart = (product: any, quantity = 1) => {
    const existing = cart.value.items.find(i => i.id === (product._id || product.id).toString())
    if (existing) {
      existing.quantity += quantity
      if (!existing.customTexts) existing.customTexts = []
      existing.customTexts.push(...Array(quantity).fill(''))
    } else {
      cart.value.items.push({
        id: (product._id || product.id).toString(),
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images?.[0], // Take first image
        quantity,
        customTexts: Array(quantity).fill('')
      })
    }
  }

  const removeFromCart = (productId: string) => {
    const index = cart.value.items.findIndex(i => i.id === productId)
    if (index > -1) {
      cart.value.items.splice(index, 1)
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.value.items.find(i => i.id === productId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId)
      } else {
        const oldQuantity = item.quantity
        item.quantity = quantity
        if (!item.customTexts) item.customTexts = Array(oldQuantity).fill('')
        if (quantity > oldQuantity) {
          item.customTexts.push(...Array(quantity - oldQuantity).fill(''))
        } else if (quantity < oldQuantity) {
          item.customTexts.splice(quantity)
        }
      }
    }
  }

  const clearCart = () => {
    cart.value.items = []
  }

  const cartTotal = computed(() => {
    return cart.value.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  const cartCount = computed(() => {
    return cart.value.items.reduce((total, item) => total + item.quantity, 0)
  })

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount
  }
}
