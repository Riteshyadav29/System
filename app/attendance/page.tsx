import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AttendanceInterface } from "@/components/attendance-interface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExportButtons } from "@/components/export-buttons"
import Link from "next/link"
import { ArrowLeft, Calendar } from "lucide-react"

export default async function AttendancePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get today's classes with course and enrollment information
  const today = new Date().toISOString().split("T")[0]

  const { data: todaysClasses, error: classesError } = await supabase
    .from("classes")
    .select(`
      *,
      courses (
        id,
        course_code,
        course_name,
        department
      )
    `)
    .eq("class_date", today)
    .eq("is_cancelled", false)
    .order("start_time")

  if (classesError) {
    console.error("Error fetching classes:", classesError)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
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
                <Calendar className="h-8 w-8 text-orange-600" />
                Attendance Tracking
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Mark attendance for today's classes - {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <ExportButtons />
        </div>

        {/* Today's Classes */}
        {!todaysClasses || todaysClasses.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>No Classes Today</CardTitle>
              <CardDescription>There are no scheduled classes for today.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Check back tomorrow or contact administration if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {todaysClasses.map((classItem) => (
              <AttendanceInterface key={classItem.id} classData={classItem} userId={data.user.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
