"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { GraduationCap, Users, BarChart3 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingDemo, setIsCreatingDemo] = useState(false)
  const router = useRouter()

  const createDemoAccount = async () => {
    const supabase = createClient()
    setIsCreatingDemo(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email: "admin@demo.com",
        password: "admin123",
        options: {
          emailRedirectTo: undefined,
        },
      })
      if (error) throw error

      setEmail("admin@demo.com")
      setPassword("admin123")
      setError("Demo account created! You can now sign in with the credentials below.")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred creating demo account")
    } finally {
      setIsCreatingDemo(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      if (errorMessage.includes("Invalid login credentials")) {
        setError("Invalid login credentials. If this is your first time, please create the demo account first.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance System</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Sign in to manage student attendance and analytics</p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-blue-100">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Student Management</p>
          </div>
          <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-green-100">
            <GraduationCap className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Attendance Tracking</p>
          </div>
          <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-purple-100">
            <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Analytics Dashboard</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@demo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/70"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/70"
                  />
                </div>
                {error && (
                  <div
                    className={`p-3 text-sm rounded-md ${
                      error.includes("Demo account created")
                        ? "text-green-600 bg-green-50 border border-green-200"
                        : "text-red-600 bg-red-50 border border-red-200"
                    }`}
                  >
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="text-blue-600 hover:text-blue-700 underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-4 bg-gray-50/90 backdrop-blur-sm border-gray-200">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 text-center mb-2">
              <strong>Demo Credentials:</strong>
            </p>
            <p className="text-xs text-gray-500 text-center mb-3">
              Email: admin@demo.com
              <br />
              Password: admin123
            </p>
            <div className="text-center">
              <Button
                onClick={createDemoAccount}
                variant="outline"
                size="sm"
                className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 mb-2 w-full"
                disabled={isCreatingDemo}
              >
                {isCreatingDemo ? "Creating Demo Account..." : "Create Demo Account"}
              </Button>
              <p className="text-xs text-gray-500">Click above to create the demo account, then sign in</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
