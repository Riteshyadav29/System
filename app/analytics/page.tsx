import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AttendanceAnalytics } from "@/components/attendance-analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExportButtons } from "@/components/export-buttons"
import Link from "next/link"
import { ArrowLeft, BarChart3, TrendingUp, Users, Calendar } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get overall statistics
  const [totalStudentsResult, totalCoursesResult, totalClassesResult, attendanceRecordsResult, recentAttendanceResult] =
    await Promise.all([
      supabase.from("students").select("id", { count: "exact" }).eq("is_active", true),
      supabase.from("courses").select("id", { count: "exact" }).eq("is_active", true),
      supabase.from("classes").select("id", { count: "exact" }),
      supabase.from("attendance_records").select("id", { count: "exact" }),
      supabase
        .from("attendance_records")
        .select("status", { count: "exact" })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

  // Get attendance by status for recent records
  const [presentResult, absentResult, lateResult, excusedResult] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("id", { count: "exact" })
      .eq("status", "present")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("attendance_records")
      .select("id", { count: "exact" })
      .eq("status", "absent")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("attendance_records")
      .select("id", { count: "exact" })
      .eq("status", "late")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("attendance_records")
      .select("id", { count: "exact" })
      .eq("status", "excused")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const stats = {
    totalStudents: totalStudentsResult.count || 0,
    totalCourses: totalCoursesResult.count || 0,
    totalClasses: totalClassesResult.count || 0,
    totalAttendanceRecords: attendanceRecordsResult.count || 0,
    weeklyAttendance: {
      present: presentResult.count || 0,
      absent: absentResult.count || 0,
      late: lateResult.count || 0,
      excused: excusedResult.count || 0,
    },
  }

  const totalWeeklyRecords = Object.values(stats.weeklyAttendance).reduce((sum, count) => sum + count, 0)
  const attendanceRate =
    totalWeeklyRecords > 0 ? ((stats.weeklyAttendance.present / totalWeeklyRecords) * 100).toFixed(1) : "0"

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
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
                <BarChart3 className="h-8 w-8 text-purple-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">Comprehensive attendance reports and insights</p>
            </div>
          </div>
          <ExportButtons />
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200 dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active enrollments</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200 dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Courses</CardTitle>
              <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active courses</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-orange-200 dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Classes Held</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClasses}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total sessions</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-purple-200 dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceRate}%</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Attendance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-green-50/80 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{stats.weeklyAttendance.present}</div>
              <p className="text-xs text-green-600">
                {totalWeeklyRecords > 0 ? ((stats.weeklyAttendance.present / totalWeeklyRecords) * 100).toFixed(1) : 0}%
                of total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50/80 backdrop-blur-sm border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800">{stats.weeklyAttendance.absent}</div>
              <p className="text-xs text-red-600">
                {totalWeeklyRecords > 0 ? ((stats.weeklyAttendance.absent / totalWeeklyRecords) * 100).toFixed(1) : 0}%
                of total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50/80 backdrop-blur-sm border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800">{stats.weeklyAttendance.late}</div>
              <p className="text-xs text-yellow-600">
                {totalWeeklyRecords > 0 ? ((stats.weeklyAttendance.late / totalWeeklyRecords) * 100).toFixed(1) : 0}% of
                total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Excused</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{stats.weeklyAttendance.excused}</div>
              <p className="text-xs text-blue-600">
                {totalWeeklyRecords > 0 ? ((stats.weeklyAttendance.excused / totalWeeklyRecords) * 100).toFixed(1) : 0}%
                of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <AttendanceAnalytics />
      </div>
    </div>
  )
}
