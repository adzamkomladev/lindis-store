export const useAuth = () => {
  const { loggedIn, user, clear, fetch } = useUserSession()

  const login = async (credentials: any) => {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    await fetch() // Refresh session
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    navigateTo('/admin/login')
  }

  return {
    loggedIn,
    user,
    login,
    logout
  }
}
