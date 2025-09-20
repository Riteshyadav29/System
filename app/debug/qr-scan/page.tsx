"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Bug, CheckCircle, XCircle } from "lucide-react"

export default function QRScanDebugPage() {
  const [testToken, setTestToken] = useState("")
  const [debugResult, setDebugResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testQRScan = async () => {
    if (!testToken.trim()) {
      setDebugResult({ error: "Please enter a token to test" })
      return
    }

    setIsLoading(true)
    setDebugResult(null)

    try {
      console.log("Testing QR scan with token:", testToken)
      
      const response = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: testToken.trim() }),
      })

      const data = await response.json()
      console.log("QR scan response:", data)

      setDebugResult({
        status: response.status,
        success: response.ok,
        data: data,
        error: response.ok ? null : data.error || "Unknown error"
      })
    } catch (error) {
      console.error("QR scan test error:", error)
      setDebugResult({
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        data: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkActiveSessions = async () => {
    setIsLoading(true)
    setDebugResult(null)

    try {
      const response = await fetch("/api/qr/session")
      const data = await response.json()
      
      setDebugResult({
        status: response.status,
        success: response.ok,
        data: data,
        error: response.ok ? null : data.error || "No active sessions"
      })
    } catch (error) {
      console.error("Check sessions error:", error)
      setDebugResult({
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        data: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-6 w-6 text-red-600" />
              QR Scan Debug Tool
            </CardTitle>
            <CardDescription>
              Debug QR code scanning issues and check system status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Check Active Sessions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1. Check Active QR Sessions</h3>
              <Button onClick={checkActiveSessions} disabled={isLoading}>
                {isLoading ? "Checking..." : "Check Active Sessions"}
              </Button>
            </div>

            {/* Test QR Scan */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2. Test QR Token Scan</h3>
              <div className="space-y-2">
                <Label htmlFor="test-token">Enter QR Token to Test</Label>
                <Input
                  id="test-token"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="Paste QR token here..."
                />
                <Button onClick={testQRScan} disabled={isLoading || !testToken.trim()}>
                  {isLoading ? "Testing..." : "Test QR Scan"}
                </Button>
              </div>
            </div>

            {/* Debug Results */}
            {debugResult && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Debug Results</h3>
                <Card className={debugResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      {debugResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-semibold">
                        {debugResult.success ? "Success" : "Error"}
                      </span>
                      <span className="text-sm text-gray-600">
                        (Status: {debugResult.status})
                      </span>
                    </div>
                    
                    {debugResult.error && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-red-700">Error:</p>
                        <p className="text-sm text-red-600">{debugResult.error}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Response Data:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(debugResult.data, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Common Issues */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Common Issues & Solutions</h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-medium text-yellow-800">1. "Student not found"</p>
                  <p className="text-yellow-700">Make sure you're logged in with a student account that exists in the database.</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-medium text-yellow-800">2. "Invalid or expired token"</p>
                  <p className="text-yellow-700">The QR code token has expired (15 seconds) or is invalid. Get a fresh QR code from the teacher.</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-medium text-yellow-800">3. "Student not enrolled in this course"</p>
                  <p className="text-yellow-700">The student needs to be enrolled in the course. Check student enrollments in the admin panel.</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-medium text-yellow-800">4. "Attendance window has closed"</p>
                  <p className="text-yellow-700">The 20-minute attendance window has expired. Attendance can only be marked within 20 minutes of class start.</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-medium text-yellow-800">5. "Class not found"</p>
                  <p className="text-yellow-700">The QR session is linked to a class that doesn't exist. Check if the class was properly created.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
