"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  department: string
  year_of_study: number
  enrollment_date: string
  student_enrollments: { count: number }[]
}

interface StudentsTableProps {
  students: Student[]
}

export function StudentsTable({ students }: StudentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const filteredStudents = students.filter(
    (student) =>
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (studentId: string) => {
    setIsDeleting(studentId)
    try {
      const { error } = await supabase.from("students").update({ is_active: false }).eq("id", studentId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error deleting student:", error)
    } finally {
      setIsDeleting(null)
    }
  }

  const getYearSuffix = (year: number) => {
    switch (year) {
      case 1:
        return "1st Year"
      case 2:
        return "2nd Year"
      case 3:
        return "3rd Year"
      case 4:
        return "4th Year"
      default:
        return `${year}th Year`
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search students by name, ID, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  {searchTerm ? "No students found matching your search." : "No students found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.student_id}</TableCell>
                  <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{student.department}</Badge>
                  </TableCell>
                  <TableCell>{getYearSuffix(student.year_of_study)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.student_enrollments[0]?.count || 0} courses</Badge>
                  </TableCell>
                  <TableCell>{new Date(student.enrollment_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(student.id)}
                          disabled={isDeleting === student.id}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting === student.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
