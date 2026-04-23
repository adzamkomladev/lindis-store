// Server-side auth types
declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    name: string | null
    role: 'admin' | 'customer'
  }

  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}
