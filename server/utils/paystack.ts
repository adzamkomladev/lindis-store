export const usePaystack = () => {
  const config = useRuntimeConfig()
  const secretKey = config.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY

  if (!secretKey) {
    throw createError({
      statusCode: 500,
      message: 'Payment provider is not configured (PAYSTACK_SECRET_KEY missing)',
    })
  }

  const fetchPaystack = async (endpoint: string, options: any = {}) => {
    const response = await $fetch(`https://api.paystack.co${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    return response
  }

  return {
    initializeTransaction: async (data: {
      email: string
      amount: number
      reference: string
      callback_url: string
      metadata?: any
    }) => {
      const response: any = await fetchPaystack('/transaction/initialize', {
        method: 'POST',
        body: data,
      })

      if (!response.status) {
        throw createError({
          statusCode: 502,
          message: response.message || 'Paystack transaction initialization failed',
        })
      }

      return response.data
    },
    verifyTransaction: async (reference: string) => {
      const response: any = await fetchPaystack(`/transaction/verify/${reference}`)

      if (!response.status) {
        throw createError({
          statusCode: 502,
          message: response.message || 'Paystack transaction verification failed',
        })
      }

      return response.data
    },
  }
}
