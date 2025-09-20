import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { StudentNav } from "@/components/student-nav"
import Link from "next/link"
import { Users, BookOpen, Calendar, BarChart3, QrCode } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user is a student
  const { data: student } = await supabase.from("students").select("*").eq("email", data.user.email).single()

  // Get dashboard statistics
  const [studentsResult, coursesResult, classesTodayResult] = await Promise.all([
    supabase.from("students").select("id", { count: "exact" }).eq("is_active", true),
    supabase.from("courses").select("id", { count: "exact" }).eq("is_active", true),
    supabase.from("classes").select("id", { count: "exact" }).eq("class_date", new Date().toISOString().split("T")[0]),
  ])

  const stats = {
    students: studentsResult.count || 0,
    courses: coursesResult.count || 0,
    classesToday: classesTodayResult.count || 0,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Attendance Monitoring System</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Welcome back, {data.user.email}!{" "}
              {student
                ? `(${student.first_name} ${student.last_name})`
                : "Manage student attendance and analytics efficiently."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {student && <StudentNav />}
            <LogoutButton />
          </div>
        </div>

        {/* Stats Cards - Only show for non-students */}
        {!student && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200 dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Students</CardTitle>
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.students}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-green-200 dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.courses}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Classes Today</CardTitle>
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.classesToday}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Student-specific actions */}
          {student && (
            <>
              <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <QrCode className="h-5 w-5" />
                    Scan QR Code
                  </CardTitle>
                  <CardDescription>Scan QR code to mark your attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/scan">
                      <QrCode className="mr-2 h-4 w-4" />
                      Open QR Scanner
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Calendar className="h-5 w-5" />
                    My Attendance
                  </CardTitle>
                  <CardDescription>View your attendance history and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                    <Link href="/student-attendance">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Attendance
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Admin/Teacher actions - Only show for non-students */}
          {!student && (
            <>
              <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Users className="h-5 w-5" />
                    Student Management
                  </CardTitle>
                  <CardDescription>Add, edit, and manage student records</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/students">Manage Students</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <BookOpen className="h-5 w-5" />
                    Course Management
                  </CardTitle>
                  <CardDescription>Manage courses and class schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                    <Link href="/courses">Manage Courses</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Calendar className="h-5 w-5" />
                    Take Attendance
                  </CardTitle>
                  <CardDescription>Mark attendance for today's classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                    <Link href="/attendance">Take Attendance</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <BarChart3 className="h-5 w-5" />
                    Analytics
                  </CardTitle>
                  <CardDescription>View attendance reports and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                    <Link href="/analytics">View Analytics</Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
