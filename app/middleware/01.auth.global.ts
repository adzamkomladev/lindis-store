const authenticatedRoutes = [
  { path: "/admin", exact: false },
  { path: "/account", exact: false },
]

const publicRoutes = [
  { path: "/admin/login", exact: true },
  { path: "/login", exact: true },
  { path: "/register", exact: true },
  { path: "/forgot-password", exact: true },
  { path: "/reset-password", exact: false },
]

export default defineNuxtRouteMiddleware(async (to) => {
  const url = to.path

  // Skip public routes
  const isPublic = publicRoutes.some((route) =>
    route.exact ? url === route.path : url.startsWith(route.path)
  )
  if (isPublic) {
    return
  }

  // Check if route requires authentication
  const requiresAuth = authenticatedRoutes.some((route) =>
    route.exact ? url === route.path : url.startsWith(route.path)
  )

  if (!requiresAuth) {
    return
  }

  const { loggedIn, user } = useUserSession()

  // If not logged in, try to fetch session
  if (!loggedIn.value) {
    await useUserSession().fetch()
  }

  // If still not logged in, redirect to login
  if (!loggedIn.value) {
    return navigateTo({
      path: "/admin/login",
      query: { redirect: url },
    })
  }

  // Route-specific role checks
  const isAdminRoute = url.startsWith('/admin')
  const isAccountRoute = url.startsWith('/account')

  if (isAdminRoute && user.value?.role !== 'admin') {
    return navigateTo({
      path: "/admin/login",
      query: { redirect: url, error: "unauthorized" },
    })
  }

  if (isAccountRoute && user.value?.role !== 'customer') {
    return navigateTo({
      path: "/login",
      query: { redirect: url },
    })
  }
})
