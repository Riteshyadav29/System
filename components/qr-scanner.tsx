"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { QrCode, Camera, CheckCircle, XCircle, Clock, AlertTriangle, Smartphone, RotateCcw } from "lucide-react"
import jsQR from "jsqr"

interface ScanResult {
  success: boolean
  status?: "present" | "late"
  message: string
  error?: string
}

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [lastProcessedToken, setLastProcessedToken] = useState<string>("")
  const [lastProcessedTime, setLastProcessedTime] = useState<number>(0)
  const [hasSuccessfulScan, setHasSuccessfulScan] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout>()
  const { toast } = useToast()

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      setScanResult(null)
      setHasSuccessfulScan(false)
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)

        // Wait for video to be ready before starting scan
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
            // Start scanning for QR codes
            scanIntervalRef.current = setInterval(scanQRCode, 1000) // Scan every 1 second to prevent rapid scanning
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      let errorMessage = "Unable to access camera. Please check permissions or use manual entry."
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow camera permissions and try again."
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found on this device. Please use manual entry."
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Camera not supported on this device. Please use manual entry."
        }
      }
      
      setScanResult({
        success: false,
        error: errorMessage,
        message: "Camera access failed",
      })
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    setIsScanning(false)
  }

  // Scan QR code from video feed
  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing || hasSuccessfulScan) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Use a QR code detection library (this is a simplified version)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code && code.data) {
        const now = Date.now()
        
        // Prevent processing the same token multiple times or too frequently
        if (code.data === lastProcessedToken || (now - lastProcessedTime) < 3000) {
          return
        }
        
        console.log("[v0] QR code detected:", code.data)
        setScanCount(prev => prev + 1)
        setLastProcessedToken(code.data)
        setLastProcessedTime(now)
        await processToken(code.data)
      }
    } catch (error) {
      console.error("Error scanning QR code:", error)
    }
  }

  // Process scanned or manually entered token
  const processToken = async (token: string) => {
    if (!token.trim()) return

    setIsProcessing(true)
    setScanResult(null)

    try {
      console.log("[v0] Processing token:", token.substring(0, 10) + "...")

      const response = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      })

      const data = await response.json()
      console.log("[v0] Scan response:", data)

      if (response.ok) {
        // Set success state immediately to prevent any flickering
        setHasSuccessfulScan(true)
        
        setScanResult({
          success: true,
          status: data.status,
          message: data.message,
        })

        // Show success toast
        toast({
          title: "✅ Attendance Marked Successfully!",
          description: data.message,
          variant: "default",
        })

        // Stop scanning immediately on successful scan
        if (isScanning) {
          stopCamera()
        }
        setManualToken("")
        setLastProcessedToken("") // Reset for next scan
        setLastProcessedTime(0)
      } else {
        // Only show error if we haven't had a successful scan yet
        if (!hasSuccessfulScan) {
          setScanResult({
            success: false,
            error: data.error,
            message: "Scan failed",
          })

          // Show error toast
          toast({
            title: "Scan Failed",
            description: data.error || "Unable to process QR code",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error processing token:", error)
      
      // Only show error if we haven't had a successful scan yet
      if (!hasSuccessfulScan) {
        setScanResult({
          success: false,
          error: "Network error. Please try again.",
          message: "Connection failed",
        })

        // Show error toast
        toast({
          title: "Connection Error",
          description: "Network error. Please check your connection and try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle manual token submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    processToken(manualToken)
  }

  // Reset scanner
  const resetScanner = () => {
    setScanResult(null)
    setManualToken("")
    setScanCount(0)
    setLastProcessedToken("")
    setLastProcessedTime(0)
    setHasSuccessfulScan(false)
    if (isScanning) {
      stopCamera()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const getResultIcon = () => {
    if (!scanResult) return null

    if (scanResult.success) {
      return scanResult.status === "present" ? (
        <CheckCircle className="h-8 w-8 text-green-600" />
      ) : (
        <Clock className="h-8 w-8 text-yellow-600" />
      )
    }
    return <XCircle className="h-8 w-8 text-red-600" />
  }

  const getResultColor = () => {
    if (!scanResult) return ""

    if (scanResult.success) {
      return scanResult.status === "present"
        ? "bg-green-50 border-green-200 text-green-800"
        : "bg-yellow-50 border-yellow-200 text-yellow-800"
    }
    return "bg-red-50 border-red-200 text-red-800"
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* QR Scanner Card */}
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>Scan the QR code displayed by your teacher to mark attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Scanner */}
          <div className="text-center">
            {!isScanning ? (
              <div className="space-y-4">
                <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Camera not active</p>
                  </div>
                </div>
                <Button onClick={startCamera} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera Scanner
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-64 h-64 mx-auto rounded-lg border-2 border-blue-300"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                  </div>
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                      <div className="bg-white rounded-lg p-3 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Processing QR Code...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
                    Stop Scanner
                  </Button>
                  <Button onClick={resetScanner} variant="outline" className="flex-1 bg-transparent">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="border-t pt-4">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <Label htmlFor="manual-token" className="text-sm font-medium">
                  Manual Token Entry
                </Label>
                <p className="text-xs text-gray-600 mb-2">If camera doesn't work, enter the token manually</p>
                <Input
                  id="manual-token"
                  type="text"
                  placeholder="Enter QR token here..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <Button
                type="submit"
                disabled={!manualToken.trim() || isProcessing}
                className="w-full bg-transparent"
                variant="outline"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Submit Token
                  </>
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Result Display */}
      {scanResult && (
        <Card className={`border-2 ${getResultColor()} ${scanResult.success ? 'animate-pulse' : ''}`}>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              {getResultIcon()}
              <div>
                <h3 className="font-bold text-xl">
                  {scanResult.success ? "✅ Attendance Marked Successfully!" : "❌ Scan Failed"}
                </h3>
                <p className="text-base font-medium">{scanResult.message}</p>
                {scanResult.error && !scanResult.success && <p className="text-xs mt-1 opacity-75">{scanResult.error}</p>}
              </div>
              {scanResult.success && scanResult.status && (
                <Badge
                  variant="outline"
                  className={
                    scanResult.status === "present"
                      ? "bg-green-100 text-green-800 border-green-300 text-lg px-4 py-2"
                      : "bg-yellow-100 text-yellow-800 border-yellow-300 text-lg px-4 py-2"
                  }
                >
                  Status: {scanResult.status.toUpperCase()}
                </Badge>
              )}
              {scanResult.success && (
                <div className="pt-2">
                  <p className="text-sm text-green-600 font-medium mb-3">
                    Your attendance has been recorded successfully!
                  </p>
                  <Button onClick={resetScanner} variant="outline" size="sm" className="bg-green-50 hover:bg-green-100">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Scan Another QR Code
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Counter */}
      {isScanning && !hasSuccessfulScan && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-blue-700">
                Scanning... {scanCount > 0 && `(${scanCount} attempts)`}
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium text-sm">How to use:</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1 ml-6">
              <li>• Point your camera at the QR code on the teacher's screen</li>
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
        </CardContent>
      </Card>
    </div>
  )
}
