"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Edit, Trash2, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface Course {
  id: string
  course_code: string
  course_name: string
  department: string
  credits: number
  semester: string
  academic_year: string
  instructor_name: string | null
  student_enrollments: { count: number }[]
  classes: { count: number }[]
}

interface CoursesTableProps {
  courses: Course[]
}

export function CoursesTable({ courses }: CoursesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const filteredCourses = courses.filter(
    (course) =>
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor_name && course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleDelete = async (courseId: string) => {
    setIsDeleting(courseId)
    try {
      const { error } = await supabase.from("courses").update({ is_active: false }).eq("id", courseId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error deleting course:", error)
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search courses by code, name, department, or instructor..."
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
              <TableHead>Course Code</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {searchTerm ? "No courses found matching your search." : "No courses found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.course_code}</TableCell>
                  <TableCell>{course.course_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{course.department}</Badge>
                  </TableCell>
                  <TableCell>{course.instructor_name || "Not assigned"}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.student_enrollments[0]?.count || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.classes[0]?.count || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{course.semester}</div>
                      <div className="text-gray-500">{course.academic_year}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Classes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(course.id)}
                          disabled={isDeleting === course.id}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting === course.id ? "Deleting..." : "Delete"}
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
