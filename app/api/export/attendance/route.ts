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
    const classId = searchParams.get('classId')

    let query = supabase
      .from("attendance_records")
      .select(`
        *,
        students (
          student_id,
          first_name,
          last_name,
          email,
          department,
          year_of_study
        ),
        classes (
          id,
          class_date,
          start_time,
          end_time,
          topic,
          class_type,
          courses (
            course_code,
            course_name,
            department
          )
        )
      `)

    // Apply filters
    if (classId) {
      query = query.eq('class_id', classId)
    } else if (courseId) {
      // Get all classes for this course
      const { data: classes } = await supabase
        .from("classes")
        .select("id")
        .eq("course_id", courseId)
      
      if (classes && classes.length > 0) {
        query = query.in('class_id', classes.map(c => c.id))
      }
    }

    if (startDate) {
      query = query.gte('classes.class_date', startDate)
    }
    if (endDate) {
      query = query.lte('classes.class_date', endDate)
    }

    const { data: attendanceRecords, error } = await query.order('marked_at', { ascending: false })

    if (error) {
      console.error("Error fetching attendance records:", error)
      return NextResponse.json({ error: "Failed to fetch attendance data" }, { status: 500 })
    }

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return NextResponse.json({ error: "No attendance records found" }, { status: 404 })
    }

    // Prepare data for Excel
    const excelData = attendanceRecords.map((record, index) => ({
      'S.No': index + 1,
      'Student ID': record.students?.student_id || 'N/A',
      'Student Name': `${record.students?.first_name || ''} ${record.students?.last_name || ''}`.trim(),
      'Email': record.students?.email || 'N/A',
      'Department': record.students?.department || 'N/A',
      'Year': record.students?.year_of_study || 'N/A',
      'Course Code': record.classes?.courses?.course_code || 'N/A',
      'Course Name': record.classes?.courses?.course_name || 'N/A',
      'Class Date': record.classes?.class_date || 'N/A',
      'Start Time': record.classes?.start_time || 'N/A',
      'End Time': record.classes?.end_time || 'N/A',
      'Class Type': record.classes?.class_type || 'N/A',
      'Topic': record.classes?.topic || 'N/A',
      'Attendance Status': record.status || 'N/A',
      'Marked At': record.marked_at ? new Date(record.marked_at).toLocaleString() : 'N/A',
      'Notes': record.notes || 'N/A'
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // S.No
      { wch: 12 },  // Student ID
      { wch: 20 },  // Student Name
      { wch: 25 },  // Email
      { wch: 15 },  // Department
      { wch: 8 },   // Year
      { wch: 12 },  // Course Code
      { wch: 25 },  // Course Name
      { wch: 12 },  // Class Date
      { wch: 10 },  // Start Time
      { wch: 10 },  // End Time
      { wch: 12 },  // Class Type
      { wch: 30 },  // Topic
      { wch: 15 },  // Attendance Status
      { wch: 20 },  // Marked At
      { wch: 30 }   // Notes
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Records")

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `attendance_records_${timestamp}.xlsx`

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
    console.error("Error generating Excel export:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
