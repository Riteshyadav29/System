import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StudentNav } from "@/components/student-nav"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, QrCode } from "lucide-react"

export default async function StudentAttendancePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user is a student
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("email", data.user.email)
    .single()

  if (studentError || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center py-12">
              <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This page is only available for registered students.
              </p>
              <Button asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get student's attendance records with class and course information
  const { data: attendanceRecords, error: attendanceError } = await supabase
    .from("attendance_records")
    .select(`
      *,
      classes (
        id,
        class_date,
        start_time,
        end_time,
        topic,
        class_type,
        courses (
          course_code,
          course_name,
          department
        )
      )
    `)
    .eq("student_id", student.id)
    .order("marked_at", { ascending: false })
    .limit(20)

  // Get today's classes for the student
  const today = new Date().toISOString().split("T")[0]
  const { data: todaysClasses, error: todaysClassesError } = await supabase
    .from("classes")
    .select(`
      *,
      courses (
        course_code,
        course_name,
        department
      )
    `)
    .eq("class_date", today)
    .eq("is_cancelled", false)
    .in("course_id", 
      await supabase
        .from("student_enrollments")
        .select("course_id")
        .eq("student_id", student.id)
        .eq("is_active", true)
        .then(({ data }) => data?.map(e => e.course_id) || [])
    )

  // Calculate attendance statistics
  const totalRecords = attendanceRecords?.length || 0
  const presentCount = attendanceRecords?.filter(r => r.status === 'present').length || 0
  const lateCount = attendanceRecords?.filter(r => r.status === 'late').length || 0
  const absentCount = attendanceRecords?.filter(r => r.status === 'absent').length || 0
  const attendancePercentage = totalRecords > 0 ? Math.round((presentCount + lateCount) / totalRecords * 100) : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'excused':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Present</Badge>
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Late</Badge>
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Absent</Badge>
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Excused</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-8 w-8 text-green-600" />
                My Attendance
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {student.first_name} {student.last_name} - {student.student_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/scan">
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR Code
              </Link>
            </Button>
            <StudentNav />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-green-600">{attendancePercentage}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Classes */}
        {todaysClasses && todaysClasses.length > 0 && (
          <Card className="bg-blue-50 border-blue-200 mb-8">
            <CardHeader>
              <CardTitle className="text-blue-800">Today's Classes</CardTitle>
              <CardDescription>Classes scheduled for today - {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{classItem.courses?.course_name}</p>
                        <p className="text-sm text-gray-600">
                          {classItem.start_time} - {classItem.end_time} • {classItem.courses?.course_code}
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/scan">
                        <QrCode className="mr-2 h-4 w-4" />
                        Mark Attendance
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Attendance Records */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Attendance Records</CardTitle>
            <CardDescription>Your latest attendance marks</CardDescription>
          </CardHeader>
          <CardContent>
            {!attendanceRecords || attendanceRecords.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No attendance records found</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Start attending classes to see your records here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-medium">{record.classes?.courses?.course_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {record.classes?.courses?.course_code} • {record.classes?.class_date} • {record.classes?.start_time}
                        </p>
                        {record.classes?.topic && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Topic: {record.classes.topic}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Marked at: {new Date(record.marked_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
