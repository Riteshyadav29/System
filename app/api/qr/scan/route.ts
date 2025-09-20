import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { QRTokenManager } from "@/lib/qr-token-manager"
import { validateAttendanceWindow } from "@/lib/time-based-attendance"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] QR scan API called")
    const { token } = await request.json()
    console.log("[v0] Token received:", !!token)

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
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

    console.log("[v0] Getting student info")
    // Get student info
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("email", user.email)
      .single()
    console.log("[v0] Student query result:", !!student, !!studentError)

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    console.log("[v0] Getting QR manager instance")
    const qrManager = QRTokenManager.getInstance()
    console.log("[v0] Validating token")
    const validation = await qrManager.validateToken(token)
    console.log("[v0] Token validation result:", validation.isValid)

    if (!validation.isValid || !validation.session) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    const sessionStart = new Date(validation.session.start_time)
    const attendanceValidation = validateAttendanceWindow(sessionStart)

    if (!attendanceValidation.canMark) {
      return NextResponse.json(
        {
          error: attendanceValidation.reason || "Attendance window has closed",
        },
        { status: 400 },
      )
    }

    // Check if student is enrolled in the course
    const { data: classInfo, error: classError } = await supabase
      .from("classes")
      .select("course_id")
      .eq("id", validation.session.class_id)
      .single()

    if (classError || !classInfo) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("student_enrollments")
      .select("*")
      .eq("student_id", student.id)
      .eq("course_id", classInfo.course_id)
      .eq("is_active", true)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: "Student not enrolled in this course" }, { status: 403 })
    }

    // Check if attendance already marked
    const { data: existingAttendance } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_id", student.id)
      .eq("class_id", validation.session.class_id)
      .single()

    const attendanceStatus = attendanceValidation.status

    if (existingAttendance) {
      // Update existing record only if new status is better (present > late)
      const shouldUpdate =
        (existingAttendance.status === "late" && attendanceStatus === "present") ||
        (existingAttendance.status === "absent" && (attendanceStatus === "present" || attendanceStatus === "late"))

      if (shouldUpdate) {
        console.log("[v0] Updating existing attendance record")
        const { error: updateError } = await supabase
          .from("attendance_records")
          .update({
            status: attendanceStatus,
            marked_at: new Date().toISOString(),
            notes: `Updated via QR code scan - ${attendanceStatus}`,
          })
          .eq("id", existingAttendance.id)

        if (updateError) {
          console.error("[v0] Error updating attendance record:", updateError)
          return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          status: attendanceStatus,
          message: `Attendance updated to ${attendanceStatus}`,
        })
      } else {
        return NextResponse.json({
          success: true,
          status: existingAttendance.status,
          message: `Attendance already marked as ${existingAttendance.status}`,
        })
      }
    } else {
      // Create new attendance record
      console.log("[v0] Creating new attendance record")
      const { error: insertError } = await supabase.from("attendance_records").insert({
        student_id: student.id,
        class_id: validation.session.class_id,
        status: attendanceStatus,
        marked_at: new Date().toISOString(),
        notes: `Marked via QR code scan - ${attendanceStatus}`,
      })

      if (insertError) {
        console.error("[v0] Error creating new attendance record:", insertError)
        return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        status: attendanceStatus,
        message: `Attendance marked as ${attendanceStatus}`,
      })
    }
  } catch (error) {
    console.error("[v0] Error in QR scan API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
