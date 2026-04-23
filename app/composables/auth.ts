export const useAuth = () => {
  const { loggedIn, user, clear, fetch } = useUserSession()

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isCustomer = computed(() => user.value?.role === 'customer')

  const login = async (credentials: any) => {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    await fetch()
  }

  const register = async (data: any) => {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: data
    })
    await fetch()
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    navigateTo('/')
  }

  return {
    loggedIn,
    user,
    isAdmin,
    isCustomer,
    login,
    register,
    logout
  }
}
