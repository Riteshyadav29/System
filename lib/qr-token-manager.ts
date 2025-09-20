import { createClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"

export interface QRSession {
  id: string
  class_id: string
  session_token: string
  start_time: string
  end_time: string
  is_active: boolean
}

export interface QRToken {
  id: string
  session_id: string
  token: string
  expires_at: string
  is_used: boolean
}

export class QRTokenManager {
  private static instance: QRTokenManager

  static getInstance(): QRTokenManager {
    if (!QRTokenManager.instance) {
      QRTokenManager.instance = new QRTokenManager()
    }
    return QRTokenManager.instance
  }

  private async getSupabase() {
    try {
      return await createClient()
    } catch (error) {
      console.error("Failed to create Supabase client:", error)
      throw new Error("Database connection failed")
    }
  }

  // Generate a secure random token
  private generateToken(): string {
    return randomBytes(32).toString("hex")
  }

  // Create a new QR attendance session
  async createSession(classId: string, userId: string): Promise<QRSession | null> {
    try {
      const now = new Date()
      const endTime = new Date(now.getTime() + 20 * 60 * 1000) // 20 minutes from now
      const sessionToken = this.generateToken()

      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from("qr_attendance_sessions")
        .insert({
          class_id: classId,
          session_token: sessionToken,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          created_by: userId,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating QR session:", error)
      return null
    }
  }

  // Generate a new rotating token for a session
  async generateRotatingToken(sessionId: string): Promise<string | null> {
    try {
      const token = this.generateToken()
      const expiresAt = new Date(Date.now() + 5000) // 5 seconds from now

      const supabase = await this.getSupabase()
      const { error } = await supabase.from("qr_tokens").insert({
        session_id: sessionId,
        token,
        expires_at: expiresAt.toISOString(),
      })

      if (error) throw error
      return token
    } catch (error) {
      console.error("Error generating rotating token:", error)
      return null
    }
  }

  // Validate a QR token and return session info
  async validateToken(token: string): Promise<{
    isValid: boolean
    session?: QRSession
    timeStatus?: "present" | "late" | "expired"
  }> {
    try {
      console.log("[v0] QRTokenManager: Starting token validation for token:", token.substring(0, 8) + "...")
      const supabase = await this.getSupabase()
      console.log("[v0] QRTokenManager: Supabase client obtained")

      const { data: tokenData, error: tokenError } = await supabase
        .from("qr_tokens")
        .select(`
          *,
          qr_attendance_sessions (*)
        `)
        .eq("token", token)
        .eq("is_used", false)
        .single()

      console.log("[v0] QRTokenManager: Token query result:", !!tokenData, !!tokenError)
      if (tokenError) {
        console.error("[v0] QRTokenManager: Token query error:", tokenError)
      }

      if (tokenError || !tokenData) {
        return { isValid: false }
      }

      const now = new Date()
      const tokenExpiry = new Date(tokenData.expires_at)
      console.log("[v0] QRTokenManager: Token expiry check:", now.toISOString(), "vs", tokenExpiry.toISOString())

      const session = Array.isArray(tokenData.qr_attendance_sessions)
        ? tokenData.qr_attendance_sessions[0]
        : (tokenData.qr_attendance_sessions as QRSession)

      console.log("[v0] QRTokenManager: Session data:", !!session)
      if (!session) {
        console.log("[v0] QRTokenManager: No session found")
        return { isValid: false }
      }

      // Check if token is expired
      if (now > tokenExpiry) {
        console.log("[v0] QRTokenManager: Token expired")
        return { isValid: false }
      }

      // Check if session is still active
      const sessionStart = new Date(session.start_time)
      const sessionEnd = new Date(session.end_time)

      if (now > sessionEnd || !session.is_active) {
        console.log("[v0] QRTokenManager: Session expired or inactive")
        return { isValid: false, timeStatus: "expired" }
      }

      // Determine time status
      const minutesFromStart = (now.getTime() - sessionStart.getTime()) / (1000 * 60)
      let timeStatus: "present" | "late" | "expired"

      if (minutesFromStart <= 10) {
        timeStatus = "present"
      } else if (minutesFromStart <= 20) {
        timeStatus = "late"
      } else {
        timeStatus = "expired"
      }

      console.log("[v0] QRTokenManager: Time status determined:", timeStatus)

      // Mark token as used
      console.log("[v0] QRTokenManager: Marking token as used")
      await supabase.from("qr_tokens").update({ is_used: true }).eq("id", tokenData.id)

      console.log("[v0] QRTokenManager: Token validation successful")
      return {
        isValid: true,
        session,
        timeStatus,
      }
    } catch (error) {
      console.error("[v0] QRTokenManager: Error validating token:", error)
      return { isValid: false }
    }
  }

  // Get active session for a class
  async getActiveSession(classId: string): Promise<QRSession | null> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from("qr_attendance_sessions")
        .select("*")
        .eq("class_id", classId)
        .eq("is_active", true)
        .gte("end_time", new Date().toISOString())
        .single()

      if (error) return null
      return data
    } catch (error) {
      console.error("Error getting active session:", error)
      return null
    }
  }

  // End a QR session
  async endSession(sessionId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      const { error } = await supabase.from("qr_attendance_sessions").update({ is_active: false }).eq("id", sessionId)

      return !error
    } catch (error) {
      console.error("Error ending session:", error)
      return false
    }
  }

  // Clean up expired tokens
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase.from("qr_tokens").delete().lt("expires_at", new Date().toISOString())
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error)
    }
  }
}
