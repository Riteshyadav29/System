"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function AddCourseDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    department: "",
    credits: "",
    semester: "",
    academic_year: "",
    instructor_name: "",
  })

  const router = useRouter()
  const supabase = createClient()

  const departments = [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Information Technology",
    "Electronics Engineering",
  ]

  const semesters = ["Fall", "Spring", "Summer"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("courses").insert([
        {
          ...formData,
          credits: Number.parseInt(formData.credits),
          instructor_name: formData.instructor_name || null,
        },
      ])

      if (error) throw error

      setOpen(false)
      setFormData({
        course_code: "",
        course_name: "",
        department: "",
        credits: "",
        semester: "",
        academic_year: "",
        instructor_name: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error adding course:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>Enter the course information to add it to the system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course_code" className="text-right">
                Course Code
              </Label>
              <Input
                id="course_code"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                className="col-span-3"
                placeholder="e.g., CS301"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course_name" className="text-right">
                Course Name
              </Label>
              <Input
                id="course_name"
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                className="col-span-3"
                placeholder="e.g., Database Systems"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credits" className="text-right">
                Credits
              </Label>
              <Select value={formData.credits} onValueChange={(value) => setFormData({ ...formData, credits: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select credits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Credit</SelectItem>
                  <SelectItem value="2">2 Credits</SelectItem>
                  <SelectItem value="3">3 Credits</SelectItem>
                  <SelectItem value="4">4 Credits</SelectItem>
                  <SelectItem value="5">5 Credits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="semester" className="text-right">
                Semester
              </Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => setFormData({ ...formData, semester: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>
                      {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="academic_year" className="text-right">
                Academic Year
              </Label>
              <Input
                id="academic_year"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                className="col-span-3"
                placeholder="e.g., 2024-25"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="instructor_name" className="text-right">
                Instructor
              </Label>
              <Input
                id="instructor_name"
                value={formData.instructor_name}
                onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                className="col-span-3"
                placeholder="e.g., Dr. John Smith"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
