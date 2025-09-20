import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CoursesTable } from "@/components/courses-table"
import { AddCourseDialog } from "@/components/add-course-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch courses with enrollment count
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select(`
      *,
      student_enrollments(count),
      classes(count)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (coursesError) {
    console.error("Error fetching courses:", coursesError)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Management</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage courses and class schedules</p>
            </div>
          </div>
          <AddCourseDialog />
        </div>

        {/* Courses Table */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <CardDescription>View and manage all active courses</CardDescription>
          </CardHeader>
          <CardContent>
            <CoursesTable courses={courses || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
