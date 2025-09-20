import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { QRTokenManager } from "@/lib/qr-token-manager"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] QR token API called")
    const { sessionId } = await request.json()
    console.log("[v0] Session ID received:", !!sessionId)

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    console.log("[v0] Creating Supabase client")
    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    console.log("[v0] Auth check:", !!user, !!authError)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Getting QR manager instance")
    const qrManager = QRTokenManager.getInstance()
    console.log("[v0] Generating rotating token")
    const token = await qrManager.generateRotatingToken(sessionId)
    console.log("[v0] Token generated:", !!token)

    if (!token) {
      return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
    }

    // Clean up expired tokens
    console.log("[v0] Cleaning up expired tokens")
    await qrManager.cleanupExpiredTokens()

    console.log("[v0] Returning token response")
    return NextResponse.json({ token })
  } catch (error) {
    console.error("[v0] Error in QR token API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
