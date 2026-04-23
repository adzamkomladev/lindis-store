const authenticatedRoutes = [
  { path: "/admin", exact: false },
]

const publicRoutes = [
  "/admin/login",
]

export default defineNuxtRouteMiddleware(async (to) => {
  const url = to.path

  // Skip public routes
  if (publicRoutes.includes(url)) {
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

  // Check if user is admin
  if (user.value?.role !== 'admin') {
    return navigateTo({
      path: "/admin/login",
      query: { redirect: url, error: "unauthorized" },
    })
  }
})
