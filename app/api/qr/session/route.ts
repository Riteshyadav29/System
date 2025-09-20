import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { QRTokenManager } from "@/lib/qr-token-manager"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] QR session API called")
    const { classId } = await request.json()
    console.log("[v0] Class ID received:", !!classId)

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
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

    // Check if there's already an active session
    console.log("[v0] Checking for existing session")
    const existingSession = await qrManager.getActiveSession(classId)
    if (existingSession) {
      console.log("[v0] Found existing session")
      return NextResponse.json({ session: existingSession })
    }

    // Create new session
    console.log("[v0] Creating new session")
    const session = await qrManager.createSession(classId, user.id)
    console.log("[v0] Session created:", !!session)

    if (!session) {
      return NextResponse.json({ error: "Failed to create QR session" }, { status: 500 })
    }

    console.log("[v0] Returning session response")
    return NextResponse.json({ session })
  } catch (error) {
    console.error("[v0] Error in QR session creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("[v0] QR session DELETE API called")
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
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
    console.log("[v0] Ending session")
    const success = await qrManager.endSession(sessionId)
    console.log("[v0] Session ended:", success)

    if (!success) {
      return NextResponse.json({ error: "Failed to end session" }, { status: 500 })
    }

    console.log("[v0] Returning success response")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error ending QR session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
