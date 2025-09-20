"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { 
  QrCode, 
  Calendar, 
  Home, 
  Menu, 
  X,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"

const studentNavItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Scan QR",
    href: "/scan",
    icon: QrCode,
  },
  {
    name: "My Attendance",
    href: "/student-attendance",
    icon: Calendar,
  },
]

export function StudentNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Student Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {studentNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {studentNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Button
              key={item.name}
              asChild
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                isActive && "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            </Button>
          )
        })}
      </nav>
    </>
  )
}
