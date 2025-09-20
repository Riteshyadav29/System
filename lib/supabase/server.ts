import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  try {
    console.log("[v0] Creating Supabase server client")
    const cookieStore = await cookies()
    console.log("[v0] Cookie store obtained")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("[v0] Environment variables check:", !!supabaseUrl, !!supabaseAnonKey)

    if (!supabaseUrl) {
      console.error("[v0] Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
      throw new Error("Supabase configuration error")
    }

    if (!supabaseAnonKey) {
      console.error("[v0] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
      throw new Error("Supabase configuration error")
    }

    console.log("[v0] Creating server client with URL:", supabaseUrl.substring(0, 20) + "...")
    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })

    console.log("[v0] Supabase server client created successfully")
    return client
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    throw error
  }
}
