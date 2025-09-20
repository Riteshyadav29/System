import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentsTable } from "@/components/students-table"
import { AddStudentDialog } from "@/components/add-student-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch students with their enrollment count
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select(`
      *,
      student_enrollments(count)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (studentsError) {
    console.error("Error fetching students:", studentsError)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage student records and enrollments</p>
            </div>
          </div>
          <AddStudentDialog />
        </div>

        {/* Students Table */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>All Students</CardTitle>
            <CardDescription>View and manage all registered students</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentsTable students={students || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
