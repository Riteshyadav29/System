"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Clock, MapPin, BookOpen, Users, Save, CheckCircle, XCircle, Clock3, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { QRAttendanceDisplay } from "./qr-attendance-display"

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  email: string
}

interface AttendanceRecord {
  id?: string
  student_id: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string
}

interface ClassData {
  id: string
  class_date: string
  start_time: string
  end_time: string
  topic: string | null
  location: string | null
  courses: {
    id: string
    course_code: string
    course_name: string
    department: string
  }
}

interface AttendanceInterfaceProps {
  classData: ClassData
  userId: string
}

export function AttendanceInterface({ classData, userId }: AttendanceInterfaceProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasExistingRecords, setHasExistingRecords] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchStudentsAndAttendance()
  }, [classData.id])

  const fetchStudentsAndAttendance = async () => {
    try {
      // Fetch enrolled students for this course
      const { data: enrolledStudents, error: studentsError } = await supabase
        .from("student_enrollments")
        .select(`
          students (
            id,
            student_id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("course_id", classData.courses.id)
        .eq("is_active", true)

      if (studentsError) throw studentsError

      const studentsList = enrolledStudents?.map((enrollment: any) => enrollment.students).filter(Boolean) || []

      setStudents(studentsList)

      // Check for existing attendance records
      const { data: existingAttendance, error: attendanceError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("class_id", classData.id)

      if (attendanceError) throw attendanceError

      if (existingAttendance && existingAttendance.length > 0) {
        setHasExistingRecords(true)
        const attendanceMap: Record<string, AttendanceRecord> = {}
        const notesMap: Record<string, string> = {}

        existingAttendance.forEach((record) => {
          attendanceMap[record.student_id] = {
            id: record.id,
            student_id: record.student_id,
            status: record.status,
            notes: record.notes,
          }
          if (record.notes) {
            notesMap[record.student_id] = record.notes
          }
        })

        setAttendance(attendanceMap)
        setNotes(notesMap)
      } else {
        // Initialize with default "present" status
        const initialAttendance: Record<string, AttendanceRecord> = {}
        studentsList.forEach((student) => {
          initialAttendance[student.id] = {
            student_id: student.id,
            status: "present",
          }
        })
        setAttendance(initialAttendance)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateAttendance = (studentId: string, status: "present" | "absent" | "late" | "excused") => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }))
  }

  const updateNotes = (studentId: string, noteText: string) => {
    setNotes((prev) => ({
      ...prev,
      [studentId]: noteText,
    }))
  }

  const saveAttendance = async () => {
    setIsSaving(true)
    try {
      const attendanceRecords = Object.values(attendance).map((record) => ({
        ...record,
        class_id: classData.id,
        marked_by: userId,
        notes: notes[record.student_id] || null,
      }))

      if (hasExistingRecords) {
        // Update existing records
        for (const record of attendanceRecords) {
          const { error } = await supabase
            .from("attendance_records")
            .update({
              status: record.status,
              notes: record.notes,
              marked_by: record.marked_by,
              updated_at: new Date().toISOString(),
            })
            .eq("class_id", classData.id)
            .eq("student_id", record.student_id)

          if (error) throw error
        }
      } else {
        // Insert new records
        const { error } = await supabase.from("attendance_records").insert(attendanceRecords)
        if (error) throw error
        setHasExistingRecords(true)
      }

      router.refresh()
    } catch (error) {
      console.error("Error saving attendance:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "late":
        return <Clock3 className="h-4 w-4 text-yellow-600" />
      case "excused":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 border-green-200"
      case "absent":
        return "bg-red-100 text-red-800 border-red-200"
      case "late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "excused":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <QRAttendanceDisplay
          classId={classData.id}
          className={`${classData.courses.course_code} - ${classData.courses.course_name}`}
          classTime={`${classData.start_time} - ${classData.end_time}`}
        />
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">Loading class information...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* QR Attendance Display */}
      <QRAttendanceDisplay
        classId={classData.id}
        className={`${classData.courses.course_code} - ${classData.courses.course_name}`}
        classTime={`${classData.start_time} - ${classData.end_time}`}
      />

      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-orange-600" />
                {classData.courses.course_code} - {classData.courses.course_name}
              </CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {classData.start_time} - {classData.end_time}
                  </span>
                  {classData.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {classData.location}
                    </span>
                  )}
                  <Badge variant="outline">{classData.courses.department}</Badge>
                </div>
                {classData.topic && (
                  <div className="mt-2 text-gray-600">
                    <strong>Topic:</strong> {classData.topic}
                  </div>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {students.length} students
              </Badge>
              {hasExistingRecords && (
                <Badge variant="secondary" className="text-green-700 bg-green-100">
                  Previously Saved
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No students enrolled in this course.</div>
            ) : (
              <>
                {/* Students List */}
                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="border rounded-lg p-4 bg-white/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">
                            {student.first_name} {student.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {student.student_id} • {student.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(attendance[student.id]?.status || "present")}
                          <Badge className={getStatusColor(attendance[student.id]?.status || "present")}>
                            {attendance[student.id]?.status || "present"}
                          </Badge>
                        </div>
                      </div>

                      {/* Status Buttons */}
                      <div className="flex gap-2 mb-3">
                        {["present", "absent", "late", "excused"].map((status) => (
                          <Button
                            key={status}
                            variant={attendance[student.id]?.status === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateAttendance(student.id, status as any)}
                            className={
                              attendance[student.id]?.status === status
                                ? status === "present"
                                  ? "bg-green-600 hover:bg-green-700"
                                  : status === "absent"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : status === "late"
                                      ? "bg-yellow-600 hover:bg-yellow-700"
                                      : "bg-blue-600 hover:bg-blue-700"
                                : ""
                            }
                          >
                            {getStatusIcon(status)}
                            <span className="ml-1 capitalize">{status}</span>
                          </Button>
                        ))}
                      </div>

                      {/* Notes */}
                      <div>
                        <Label htmlFor={`notes-${student.id}`} className="text-xs text-gray-600">
                          Notes (optional)
                        </Label>
                        <Textarea
                          id={`notes-${student.id}`}
                          placeholder="Add any notes about this student's attendance..."
                          value={notes[student.id] || ""}
                          onChange={(e) => updateNotes(student.id, e.target.value)}
                          className="mt-1 text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveAttendance} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700">
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : hasExistingRecords ? "Update Attendance" : "Save Attendance"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
