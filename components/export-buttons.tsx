"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, Database, Calendar, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExportButtonsProps {
  courseId?: string
  startDate?: string
  endDate?: string
  classId?: string
}

export function ExportButtons({ courseId, startDate, endDate, classId }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async (type: 'attendance' | 'analytics') => {
    setIsExporting(true)
    
    try {
      const params = new URLSearchParams()
      if (courseId) params.append('courseId', courseId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (classId) params.append('classId', classId)

      const url = `/api/export/${type}?${params.toString()}`
      
      // Create a temporary link to trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Started",
        description: `Your ${type} data is being downloaded...`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleExport('attendance')}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
      >
        <Database className="mr-2 h-4 w-4" />
        {isExporting ? "Exporting..." : "Export Attendance"}
      </Button>
      
      <Button
        onClick={() => handleExport('analytics')}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        {isExporting ? "Exporting..." : "Export Analytics"}
      </Button>
    </div>
  )
}
