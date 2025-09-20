"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface CourseAttendance {
  course_code: string
  course_name: string
  total_classes: number
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_rate: number
}

interface StudentAttendance {
  student_id: string
  student_name: string
  total_classes: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_rate: number
}

interface DailyAttendance {
  date: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
  attendance_rate: number
}

export function AttendanceAnalytics() {
  const [courseAttendance, setCourseAttendance] = useState<CourseAttendance[]>([])
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([])
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("7")
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const daysAgo = Number.parseInt(selectedPeriod)
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

      // Fetch course attendance data
      const { data: courseData, error: courseError } = await supabase
        .from("attendance_records")
        .select(`
          status,
          classes (
            id,
            courses (
              course_code,
              course_name
            )
          )
        `)
        .gte("created_at", startDate)

      if (courseError) throw courseError

      // Process course attendance
      const courseMap = new Map<string, any>()
      courseData?.forEach((record: any) => {
        const courseCode = record.classes?.courses?.course_code
        const courseName = record.classes?.courses?.course_name
        if (!courseCode) return

        if (!courseMap.has(courseCode)) {
          courseMap.set(courseCode, {
            course_code: courseCode,
            course_name: courseName,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total_records: 0,
          })
        }

        const course = courseMap.get(courseCode)
        course[record.status]++
        course.total_records++
      })

      const courseAttendanceData = Array.from(courseMap.values()).map((course) => ({
        ...course,
        attendance_rate: course.total_records > 0 ? (course.present / course.total_records) * 100 : 0,
      }))

      setCourseAttendance(courseAttendanceData)

      // Fetch student attendance data
      const { data: studentData, error: studentError } = await supabase
        .from("attendance_records")
        .select(`
          status,
          students (
            student_id,
            first_name,
            last_name
          )
        `)
        .gte("created_at", startDate)

      if (studentError) throw studentError

      // Process student attendance
      const studentMap = new Map<string, any>()
      studentData?.forEach((record: any) => {
        const studentId = record.students?.student_id
        const studentName = `${record.students?.first_name} ${record.students?.last_name}`
        if (!studentId) return

        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            student_id: studentId,
            student_name: studentName,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total_classes: 0,
          })
        }

        const student = studentMap.get(studentId)
        student[record.status]++
        student.total_classes++
      })

      const studentAttendanceData = Array.from(studentMap.values()).map((student) => ({
        ...student,
        attendance_rate: student.total_classes > 0 ? (student.present / student.total_classes) * 100 : 0,
      }))

      setStudentAttendance(studentAttendanceData.sort((a, b) => b.attendance_rate - a.attendance_rate))

      // Fetch daily attendance data
      const { data: dailyData, error: dailyError } = await supabase
        .from("attendance_records")
        .select("status, created_at")
        .gte("created_at", startDate)
        .order("created_at")

      if (dailyError) throw dailyError

      // Process daily attendance
      const dailyMap = new Map<string, any>()
      dailyData?.forEach((record: any) => {
        const date = new Date(record.created_at).toISOString().split("T")[0]

        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
          })
        }

        const day = dailyMap.get(date)
        day[record.status]++
        day.total++
      })

      const dailyAttendanceData = Array.from(dailyMap.values())
        .map((day) => ({
          ...day,
          attendance_rate: day.total > 0 ? (day.present / day.total) * 100 : 0,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setDailyAttendance(dailyAttendanceData)
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = {
    present: "#10b981",
    absent: "#ef4444",
    late: "#f59e0b",
    excused: "#3b82f6",
  }

  const pieData = [
    {
      name: "Present",
      value: courseAttendance.reduce((sum, course) => sum + course.present, 0),
      color: COLORS.present,
    },
    { name: "Absent", value: courseAttendance.reduce((sum, course) => sum + course.absent, 0), color: COLORS.absent },
    { name: "Late", value: courseAttendance.reduce((sum, course) => sum + course.late, 0), color: COLORS.late },
    {
      name: "Excused",
      value: courseAttendance.reduce((sum, course) => sum + course.excused, 0),
      color: COLORS.excused,
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">Loading analytics data...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analytics Period</CardTitle>
              <CardDescription>Select the time period for detailed analytics</CardDescription>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Attendance Bar Chart */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Attendance by Course</CardTitle>
            <CardDescription>Attendance rates across different courses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                attendance_rate: {
                  label: "Attendance Rate",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseAttendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="course_code" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="attendance_rate" fill="var(--color-attendance_rate)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Attendance Distribution Pie Chart */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Overall Attendance Distribution</CardTitle>
            <CardDescription>Breakdown of attendance status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                present: { label: "Present", color: COLORS.present },
                absent: { label: "Absent", color: COLORS.absent },
                late: { label: "Late", color: COLORS.late },
                excused: { label: "Excused", color: COLORS.excused },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Attendance Trend */}
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Daily Attendance Trend</CardTitle>
          <CardDescription>Attendance rate over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              attendance_rate: {
                label: "Attendance Rate",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="attendance_rate" stroke="var(--color-attendance_rate)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Student Performance Table */}
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Student Attendance Performance</CardTitle>
          <CardDescription>Individual student attendance rates (top performers)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Excused</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentAttendance.slice(0, 10).map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium">{student.student_id}</TableCell>
                    <TableCell>{student.student_name}</TableCell>
                    <TableCell>{student.total_classes}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-700 border-green-200">
                        {student.present}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-red-700 border-red-200">
                        {student.absent}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-yellow-700 border-yellow-200">
                        {student.late}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-blue-700 border-blue-200">
                        {student.excused}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.attendance_rate >= 80
                            ? "default"
                            : student.attendance_rate >= 60
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {student.attendance_rate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <Progress value={student.attendance_rate} className="w-[60px]" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
