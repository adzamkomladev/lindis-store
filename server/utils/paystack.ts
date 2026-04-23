export const usePaystack = () => {
  const config = useRuntimeConfig()
  const secretKey = config.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set in runtimeConfig')
  }

  const fetchPaystack = async (endpoint: string, options: any = {}) => {
    return await $fetch(`https://api.paystack.co${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }

  return {
    initializeTransaction: async (data: { email: string; amount: number; reference: string; callback_url: string; metadata?: any }) => {
      const response: any = await fetchPaystack('/transaction/initialize', {
        method: 'POST',
        body: data
      })
      return response.data
    },
    verifyTransaction: async (reference: string) => {
      const response: any = await fetchPaystack(`/transaction/verify/${reference}`)
      return response.data
    }
  }
}
