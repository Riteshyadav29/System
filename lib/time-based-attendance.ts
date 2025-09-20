export interface TimeWindow {
  start: Date
  end: Date
  status: "present" | "late" | "expired"
  label: string
}

export interface AttendanceTimeConfig {
  presentWindowMinutes: number // Default: 10 minutes
  lateWindowMinutes: number // Default: 20 minutes total (10 more after present window)
  totalSessionMinutes: number // Default: 20 minutes total
}

export class TimeBasedAttendance {
  private config: AttendanceTimeConfig

  constructor(config?: Partial<AttendanceTimeConfig>) {
    this.config = {
      presentWindowMinutes: config?.presentWindowMinutes ?? 10,
      lateWindowMinutes: config?.lateWindowMinutes ?? 20,
      totalSessionMinutes: config?.totalSessionMinutes ?? 20,
    }
  }

  // Calculate time windows for a session
  getTimeWindows(sessionStart: Date): TimeWindow[] {
    const presentEnd = new Date(sessionStart.getTime() + this.config.presentWindowMinutes * 60 * 1000)
    const lateEnd = new Date(sessionStart.getTime() + this.config.lateWindowMinutes * 60 * 1000)
    const sessionEnd = new Date(sessionStart.getTime() + this.config.totalSessionMinutes * 60 * 1000)

    return [
      {
        start: sessionStart,
        end: presentEnd,
        status: "present",
        label: "Present Window",
      },
      {
        start: presentEnd,
        end: lateEnd,
        status: "late",
        label: "Late Window",
      },
      {
        start: lateEnd,
        end: sessionEnd,
        status: "expired",
        label: "Expired",
      },
    ]
  }

  // Get current attendance status based on time
  getCurrentStatus(
    sessionStart: Date,
    currentTime: Date = new Date(),
  ): {
    status: "present" | "late" | "expired"
    timeRemaining: number // seconds
    windowLabel: string
    canMarkAttendance: boolean
  } {
    const windows = this.getTimeWindows(sessionStart)
    const currentWindow = windows.find((window) => currentTime >= window.start && currentTime < window.end)

    if (!currentWindow) {
      // Session has ended
      return {
        status: "expired",
        timeRemaining: 0,
        windowLabel: "Session Ended",
        canMarkAttendance: false,
      }
    }

    const timeRemaining = Math.max(0, Math.floor((currentWindow.end.getTime() - currentTime.getTime()) / 1000))

    return {
      status: currentWindow.status,
      timeRemaining,
      windowLabel: currentWindow.label,
      canMarkAttendance: currentWindow.status !== "expired",
    }
  }

  // Check if a session is still active
  isSessionActive(sessionStart: Date, currentTime: Date = new Date()): boolean {
    const sessionEnd = new Date(sessionStart.getTime() + this.config.totalSessionMinutes * 60 * 1000)
    return currentTime < sessionEnd
  }

  // Get session progress percentage
  getSessionProgress(sessionStart: Date, currentTime: Date = new Date()): number {
    const sessionEnd = new Date(sessionStart.getTime() + this.config.totalSessionMinutes * 60 * 1000)
    const totalDuration = sessionEnd.getTime() - sessionStart.getTime()
    const elapsed = currentTime.getTime() - sessionStart.getTime()

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  }

  // Format time remaining as MM:SS
  formatTimeRemaining(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get color class for time status
  getStatusColor(status: "present" | "late" | "expired"): string {
    switch (status) {
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

  // Get background color class for time status
  getStatusBgColor(status: "present" | "late" | "expired"): string {
    switch (status) {
      case "present":
        return "bg-green-50 border-green-200"
      case "late":
        return "bg-yellow-50 border-yellow-200"
      case "expired":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  // Validate if attendance can be marked at current time
  validateAttendanceTime(
    sessionStart: Date,
    currentTime: Date = new Date(),
  ): {
    canMark: boolean
    status: "present" | "late" | "expired"
    reason?: string
  } {
    const currentStatus = this.getCurrentStatus(sessionStart, currentTime)

    if (!currentStatus.canMarkAttendance) {
      return {
        canMark: false,
        status: "expired",
        reason: "Attendance window has closed",
      }
    }

    return {
      canMark: true,
      status: currentStatus.status,
    }
  }
}

// Default instance with standard timing
export const defaultTimeBasedAttendance = new TimeBasedAttendance()

// Export utility functions for common use cases
export const getAttendanceStatus = (sessionStart: Date, currentTime?: Date) =>
  defaultTimeBasedAttendance.getCurrentStatus(sessionStart, currentTime)

export const isAttendanceActive = (sessionStart: Date, currentTime?: Date) =>
  defaultTimeBasedAttendance.isSessionActive(sessionStart, currentTime)

export const formatAttendanceTime = (seconds: number) => defaultTimeBasedAttendance.formatTimeRemaining(seconds)

export const validateAttendanceWindow = (sessionStart: Date, currentTime?: Date) =>
  defaultTimeBasedAttendance.validateAttendanceTime(sessionStart, currentTime)
