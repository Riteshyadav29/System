import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { StudentNav } from "@/components/student-nav"
import Link from "next/link"
import { ArrowLeft, QrCode } from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"

export default async function ScanPage() {
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
              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                QR code scanning is only available for registered students.
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <QrCode className="h-8 w-8 text-blue-600" />
                Scan Attendance
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Welcome, {student.first_name} {student.last_name}
              </p>
            </div>
          </div>
          <StudentNav />
        </div>

        {/* QR Scanner */}
        <QRScanner />
      </div>
    </div>
  )
}
