import type { CartItem, CartState } from '~~/types/cart'

export const useCart = () => {
  const cart = useState<CartState>('cart', () => ({
    items: [],
  }))

  const cartLoaded = ref(false)

  // ---- Server sync helpers ----

  /** Fetch cart from the server cart actor and merge into local state. */
  async function syncFromServer(): Promise<void> {
    try {
      const data = await $fetch('/api/cart')
      cart.value.items = (data.items || []).map((i: any) => ({
        id: i.productId,
        name: i.productName,
        slug: i.productSlug,
        price: i.price,
        image: i.productImages?.[0],
        quantity: i.quantity,
        customTexts: i.customText ? [i.customText] : [],
      }))
    } catch {
      // Server unavailable — keep local state
    }
  }

  /** Push a mutation to the server. Logs errors but never throws. */
  async function pushToServer(url: string, body?: any): Promise<void> {
    try {
      await $fetch(url, { method: 'POST', body })
    } catch (err) {
      console.warn('[Cart] Server sync failed, using local state:', (err as Error).message)
    }
  }

  // ---- Lifecycle ----

  if (import.meta.client) {
    // 1. Hydrate from localStorage first (instant, no flash)
    onMounted(async () => {
      const saved = localStorage.getItem('lindis-store-cart')
      if (saved) {
        try {
          cart.value = JSON.parse(saved)
        } catch {
          // corrupt data, ignore
        }
      }
      // 2. Then sync from server (overwrites localStorage if server has newer state)
      await syncFromServer()
      cartLoaded.value = true
    })

    // Persist to localStorage on every change
    watch(cart, (newCart) => {
      localStorage.setItem('lindis-store-cart', JSON.stringify(newCart))
    }, { deep: true })
  }

  // ---- Public API (synchronous for UI, async server sync in background) ----

  const addToCart = (product: any, quantity = 1) => {
    const productId = (product._id || product.id).toString()
    const existing = cart.value.items.find((i) => i.id === productId)
    if (existing) {
      existing.quantity += quantity
      if (!existing.customTexts) existing.customTexts = []
      existing.customTexts.push(...Array(quantity).fill(''))
    } else {
      cart.value.items.push({
        id: productId,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images?.[0],
        quantity,
        customTexts: Array(quantity).fill(''),
      })
    }

    pushToServer('/api/cart/add', {
      product: {
        _id: productId,
        name: product.name,
        slug: product.slug,
        images: product.images ?? [],
        price: product.price,
      },
      quantity,
    })
  }

  const removeFromCart = (productId: string) => {
    const index = cart.value.items.findIndex((i) => i.id === productId)
    if (index > -1) {
      cart.value.items.splice(index, 1)
    }

    pushToServer('/api/cart/remove', { productId })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.value.items.find((i) => i.id === productId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId)
        return
      }
      const oldQuantity = item.quantity
      item.quantity = quantity
      if (!item.customTexts) item.customTexts = Array(oldQuantity).fill('')
      if (quantity > oldQuantity) {
        item.customTexts.push(...Array(quantity - oldQuantity).fill(''))
      } else if (quantity < oldQuantity) {
        item.customTexts.splice(quantity)
      }

      pushToServer('/api/cart/update', { productId, quantity })
    }
  }

  const clearCart = () => {
    cart.value.items = []

    pushToServer('/api/cart/clear')
  }

  const applyDiscount = async (code: string) => {
    try {
      const data = await $fetch('/api/cart/discount', {
        method: 'POST',
        body: { code },
      })
      if (data?.items) {
        cart.value.items = data.items.map((i: any) => ({
          id: i.productId,
          name: i.productName,
          slug: i.productSlug,
          price: i.price,
          image: i.productImages?.[0],
          quantity: i.quantity,
          customTexts: i.customText ? [i.customText] : [],
        }))
      }
      return data?.discount ?? null
    } catch (err: any) {
      throw new Error(err?.statusMessage || err?.message || 'Failed to apply discount')
    }
  }

  const removeDiscount = async () => {
    try {
      await $fetch('/api/cart/discount', { method: 'DELETE' })
      await syncFromServer()
    } catch {
      // ignore
    }
  }

  const cartTotal = computed(() => {
    return cart.value.items.reduce((total, item) => total + item.price * item.quantity, 0)
  })

  const cartCount = computed(() => {
    return cart.value.items.reduce((total, item) => total + item.quantity, 0)
  })

  return {
    cart,
    cartLoaded,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyDiscount,
    removeDiscount,
    cartTotal,
    cartCount,
  }
}
