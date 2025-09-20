import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // 1. Overall Statistics Sheet
    const statsData = await generateOverallStats(supabase, courseId, startDate, endDate)
    const statsWorksheet = XLSX.utils.json_to_sheet(statsData)
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Overall Statistics")

    // 2. Student-wise Attendance Sheet
    const studentData = await generateStudentAttendance(supabase, courseId, startDate, endDate)
    const studentWorksheet = XLSX.utils.json_to_sheet(studentData)
    XLSX.utils.book_append_sheet(workbook, studentWorksheet, "Student Attendance")

    // 3. Class-wise Attendance Sheet
    const classData = await generateClassAttendance(supabase, courseId, startDate, endDate)
    const classWorksheet = XLSX.utils.json_to_sheet(classData)
    XLSX.utils.book_append_sheet(workbook, classWorksheet, "Class Attendance")

    // 4. Daily Attendance Sheet
    const dailyData = await generateDailyAttendance(supabase, courseId, startDate, endDate)
    const dailyWorksheet = XLSX.utils.json_to_sheet(dailyData)
    XLSX.utils.book_append_sheet(workbook, dailyWorksheet, "Daily Attendance")

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `attendance_analytics_${timestamp}.xlsx`

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error("Error generating analytics export:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateOverallStats(supabase: any, courseId: string | null, startDate: string | null, endDate: string | null) {
  // Get overall statistics
  let query = supabase
    .from("attendance_records")
    .select(`
      status,
      classes!inner (
        course_id,
        class_date,
        courses (course_code, course_name)
      )
    `)

  if (courseId) {
    query = query.eq('classes.course_id', courseId)
  }
  if (startDate) {
    query = query.gte('classes.class_date', startDate)
  }
  if (endDate) {
    query = query.lte('classes.class_date', endDate)
  }

  const { data: records } = await query

  const totalRecords = records?.length || 0
  const presentCount = records?.filter(r => r.status === 'present').length || 0
  const lateCount = records?.filter(r => r.status === 'late').length || 0
  const absentCount = records?.filter(r => r.status === 'absent').length || 0
  const excusedCount = records?.filter(r => r.status === 'excused').length || 0

  return [
    { Metric: 'Total Attendance Records', Value: totalRecords },
    { Metric: 'Present', Value: presentCount },
    { Metric: 'Late', Value: lateCount },
    { Metric: 'Absent', Value: absentCount },
    { Metric: 'Excused', Value: excusedCount },
    { Metric: 'Overall Attendance Rate (%)', Value: totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0 },
    { Metric: 'Present Rate (%)', Value: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0 },
    { Metric: 'Late Rate (%)', Value: totalRecords > 0 ? Math.round((lateCount / totalRecords) * 100) : 0 },
    { Metric: 'Absent Rate (%)', Value: totalRecords > 0 ? Math.round((absentCount / totalRecords) * 100) : 0 }
  ]
}

async function generateStudentAttendance(supabase: any, courseId: string | null, startDate: string | null, endDate: string | null) {
  // Get student-wise attendance
  let query = supabase
    .from("attendance_records")
    .select(`
      student_id,
      status,
      students!inner (
        student_id,
        first_name,
        last_name,
        email,
        department,
        year_of_study
      ),
      classes!inner (
        course_id,
        class_date,
        courses (course_code, course_name)
      )
    `)

  if (courseId) {
    query = query.eq('classes.course_id', courseId)
  }
  if (startDate) {
    query = query.gte('classes.class_date', startDate)
  }
  if (endDate) {
    query = query.lte('classes.class_date', endDate)
  }

  const { data: records } = await query

  // Group by student
  const studentMap = new Map()
  
  records?.forEach(record => {
    const studentId = record.students.student_id
    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        'Student ID': studentId,
        'Student Name': `${record.students.first_name} ${record.students.last_name}`,
        'Email': record.students.email,
        'Department': record.students.department,
        'Year': record.students.year_of_study,
        'Course Code': record.classes.courses.course_code,
        'Course Name': record.classes.courses.course_name,
        'Total Classes': 0,
        'Present': 0,
        'Late': 0,
        'Absent': 0,
        'Excused': 0,
        'Attendance Rate (%)': 0
      })
    }
    
    const student = studentMap.get(studentId)
    student['Total Classes']++
    student[record.status.charAt(0).toUpperCase() + record.status.slice(1)]++
  })

  // Calculate attendance rates
  Array.from(studentMap.values()).forEach(student => {
    const total = student['Total Classes']
    const present = student['Present']
    const late = student['Late']
    student['Attendance Rate (%)'] = total > 0 ? Math.round(((present + late) / total) * 100) : 0
  })

  return Array.from(studentMap.values())
}

async function generateClassAttendance(supabase: any, courseId: string | null, startDate: string | null, endDate: string | null) {
  // Get class-wise attendance
  let query = supabase
    .from("attendance_records")
    .select(`
      class_id,
      status,
      classes!inner (
        id,
        class_date,
        start_time,
        end_time,
        topic,
        class_type,
        courses (course_code, course_name)
      )
    `)

  if (courseId) {
    query = query.eq('classes.course_id', courseId)
  }
  if (startDate) {
    query = query.gte('classes.class_date', startDate)
  }
  if (endDate) {
    query = query.lte('classes.class_date', endDate)
  }

  const { data: records } = await query

  // Group by class
  const classMap = new Map()
  
  records?.forEach(record => {
    const classId = record.class_id
    if (!classMap.has(classId)) {
      classMap.set(classId, {
        'Class ID': classId,
        'Course Code': record.classes.courses.course_code,
        'Course Name': record.classes.courses.course_name,
        'Class Date': record.classes.class_date,
        'Start Time': record.classes.start_time,
        'End Time': record.classes.end_time,
        'Class Type': record.classes.class_type,
        'Topic': record.classes.topic,
        'Total Students': 0,
        'Present': 0,
        'Late': 0,
        'Absent': 0,
        'Excused': 0,
        'Attendance Rate (%)': 0
      })
    }
    
    const classData = classMap.get(classId)
    classData['Total Students']++
    classData[record.status.charAt(0).toUpperCase() + record.status.slice(1)]++
  })

  // Calculate attendance rates
  Array.from(classMap.values()).forEach(classData => {
    const total = classData['Total Students']
    const present = classData['Present']
    const late = classData['Late']
    classData['Attendance Rate (%)'] = total > 0 ? Math.round(((present + late) / total) * 100) : 0
  })

  return Array.from(classMap.values())
}

async function generateDailyAttendance(supabase: any, courseId: string | null, startDate: string | null, endDate: string | null) {
  // Get daily attendance summary
  let query = supabase
    .from("attendance_records")
    .select(`
      status,
      classes!inner (
        class_date,
        course_id,
        courses (course_code, course_name)
      )
    `)

  if (courseId) {
    query = query.eq('classes.course_id', courseId)
  }
  if (startDate) {
    query = query.gte('classes.class_date', startDate)
  }
  if (endDate) {
    query = query.lte('classes.class_date', endDate)
  }

  const { data: records } = await query

  // Group by date
  const dateMap = new Map()
  
  records?.forEach(record => {
    const date = record.classes.class_date
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        'Date': date,
        'Course Code': record.classes.courses.course_code,
        'Course Name': record.classes.courses.course_name,
        'Total Students': 0,
        'Present': 0,
        'Late': 0,
        'Absent': 0,
        'Excused': 0,
        'Attendance Rate (%)': 0
      })
    }
    
    const dateData = dateMap.get(date)
    dateData['Total Students']++
    dateData[record.status.charAt(0).toUpperCase() + record.status.slice(1)]++
  })

  // Calculate attendance rates
  Array.from(dateMap.values()).forEach(dateData => {
    const total = dateData['Total Students']
    const present = dateData['Present']
    const late = dateData['Late']
    dateData['Attendance Rate (%)'] = total > 0 ? Math.round(((present + late) / total) * 100) : 0
  })

  return Array.from(dateMap.values()).sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
}
