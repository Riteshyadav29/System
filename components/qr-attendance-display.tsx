"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Play, Square, Clock, Users, AlertCircle, CheckCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { getAttendanceStatus, formatAttendanceTime } from "@/lib/time-based-attendance"

interface QRSession {
  id: string
  class_id: string
  session_token: string
  start_time: string
  end_time: string
  is_active: boolean
}

interface QRAttendanceDisplayProps {
  classId: string
  className: string
  classTime: string
}

export function QRAttendanceDisplay({ classId, className, classTime }: QRAttendanceDisplayProps) {
  const [session, setSession] = useState<QRSession | null>(null)
  const [currentToken, setCurrentToken] = useState<string>("")
  const [isActive, setIsActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [error, setError] = useState<string>("")
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState<"present" | "late" | "expired">("present")

  const tokenIntervalRef = useRef<NodeJS.Timeout>()
  const countdownIntervalRef = useRef<NodeJS.Timeout>()
  const attendanceIntervalRef = useRef<NodeJS.Timeout>()

  // Start QR attendance session
  const startSession = async () => {
    try {
      setError("")
      const response = await fetch("/api/qr/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setSession(data.session)
      setIsActive(true)

      // Start generating tokens
      generateNewToken(data.session.id)
      startTokenRotation(data.session.id)
      startCountdown(data.session.end_time)
      startAttendancePolling()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session")
    }
  }

  // Stop QR attendance session
  const stopSession = async () => {
    if (!session) return

    try {
      const response = await fetch(`/api/qr/session?sessionId=${session.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      cleanup()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop session")
    }
  }

  // Generate new token
  const generateNewToken = async (sessionId: string) => {
    try {
      const response = await fetch("/api/qr/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()
      if (response.ok) {
        setCurrentToken(data.token)
      }
    } catch (err) {
      console.error("Error generating token:", err)
    }
  }

  // Start token rotation every 5 seconds
  const startTokenRotation = (sessionId: string) => {
    tokenIntervalRef.current = setInterval(() => {
      generateNewToken(sessionId)
    }, 5000)
  }

  // Start countdown timer
  const startCountdown = (endTime: string) => {
    const updateCountdown = () => {
      const now = new Date()
      const end = new Date(endTime)
      const remaining = Math.max(0, end.getTime() - now.getTime())

      setTimeRemaining(Math.floor(remaining / 1000))

      if (session) {
        const sessionStart = new Date(session.start_time)
        const status = getAttendanceStatus(sessionStart, now)
        setCurrentAttendanceStatus(status.status)
      }

      if (remaining <= 0) {
        cleanup()
      }
    }

    updateCountdown()
    countdownIntervalRef.current = setInterval(updateCountdown, 1000)
  }

  // Poll attendance count
  const startAttendancePolling = () => {
    const pollAttendance = async () => {
      try {
        const response = await fetch(`/api/attendance/count?classId=${classId}`)
        if (response.ok) {
          const data = await response.json()
          setAttendanceCount(data.count || 0)
        }
      } catch (err) {
        console.error("Error polling attendance:", err)
      }
    }

    pollAttendance()
    attendanceIntervalRef.current = setInterval(pollAttendance, 3000)
  }

  // Cleanup intervals and reset state
  const cleanup = () => {
    if (tokenIntervalRef.current) clearInterval(tokenIntervalRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    if (attendanceIntervalRef.current) clearInterval(attendanceIntervalRef.current)

    setIsActive(false)
    setCurrentToken("")
    setSession(null)
    setTimeRemaining(0)
    setAttendanceCount(0)
  }

  // Format time remaining
  const formatTime = (seconds: number) => {
    return formatAttendanceTime(seconds)
  }

  // Get time status color
  const getTimeStatusColor = () => {
    switch (currentAttendanceStatus) {
      case "present":
        return "text-green-600"
      case "late":
        return "text-yellow-600"
      case "expired":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  // Get attendance status
  const getAttendanceStatusLabel = () => {
    switch (currentAttendanceStatus) {
      case "present":
        return "Present Window"
      case "late":
        return "Late Window"
      case "expired":
        return "Closed"
      default:
        return "Unknown"
    }
  }

  useEffect(() => {
    return cleanup // Cleanup on unmount
  }, [])

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-2 border-orange-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-orange-600" />
              QR Code Attendance
            </CardTitle>
            <CardDescription>
              {className} • {classTime}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {!isActive ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">Start QR attendance session</p>
              <p className="text-sm text-gray-500 mt-1">Students will have 20 minutes to scan and mark attendance</p>
            </div>
            <Button onClick={startSession} className="bg-orange-600 hover:bg-orange-700">
              <Play className="mr-2 h-4 w-4" />
              Start QR Session
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* QR Code Display */}
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
                {currentToken ? (
                  <QRCodeSVG value={currentToken} size={200} level="M" includeMargin={true} />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">QR code refreshes every 5 seconds</p>
            </div>

            {/* Status Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Clock className={`h-5 w-5 mx-auto mb-1 ${getTimeStatusColor()}`} />
                <div className={`font-mono text-lg font-bold ${getTimeStatusColor()}`}>{formatTime(timeRemaining)}</div>
                <div className="text-xs text-gray-600">Time Remaining</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="font-bold text-lg text-blue-600">{attendanceCount}</div>
                <div className="text-xs text-gray-600">Students Scanned</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <CheckCircle className={`h-5 w-5 mx-auto mb-1 ${getTimeStatusColor()}`} />
                <div className={`font-bold text-sm ${getTimeStatusColor()}`}>{getAttendanceStatusLabel()}</div>
                <div className="text-xs text-gray-600">Current Status</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Instructions for Students:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Scan the QR code with your phone camera or QR scanner app</li>
                <li>• The code changes every 5 seconds for security</li>
                <li>
                  • <span className="font-medium text-green-700">First 10 minutes: Marked as Present</span>
                </li>
                <li>
                  • <span className="font-medium text-yellow-700">10-20 minutes: Marked as Late</span>
                </li>
                <li>
                  • <span className="font-medium text-red-700">After 20 minutes: Attendance window closes</span>
                </li>
              </ul>
            </div>

            {/* Stop Button */}
            <div className="text-center">
              <Button
                onClick={stopSession}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop QR Session
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
