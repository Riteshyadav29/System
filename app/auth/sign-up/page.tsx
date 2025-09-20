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
import { GraduationCap } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const createDemoAccount = async () => {
    setEmail("admin@demo.com")
    setPassword("admin123")
    setRepeatPassword("admin123")
    setError(null)
    setIsLoading(true)

    const supabase = createClient()

    try {
      console.log("[v0] Attempting to create demo account with email:", "admin@demo.com")

      const { data, error } = await supabase.auth.signUp({
        email: "admin@demo.com",
        password: "admin123",
        options: {
          emailRedirectTo: undefined,
          data: {
            email_confirm: false,
          },
        },
      })

      console.log("[v0] Supabase response:", { data, error })

      if (error) {
        console.log("[v0] Supabase error details:", error)
        throw error
      }

      console.log("[v0] Demo account created successfully, redirecting to dashboard")
      router.push("/dashboard")
    } catch (error: unknown) {
      console.log("[v0] Caught error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      console.log("[v0] Attempting to sign up with email:", email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            email_confirm: false,
          },
        },
      })

      console.log("[v0] Supabase signup response:", { data, error })

      if (error) {
        console.log("[v0] Supabase signup error:", error)
        throw error
      }

      console.log("[v0] Account created successfully, redirecting to dashboard")
      router.push("/dashboard")
    } catch (error: unknown) {
      console.log("[v0] Signup error caught:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Join Attendance System</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Create your account to get started</p>
        </div>

        <Card className="mb-4 bg-blue-50/90 backdrop-blur-sm border-blue-200">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-blue-700 mb-3">
                <strong>Quick Start:</strong> Create the demo admin account
              </p>
              <Button onClick={createDemoAccount} className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Creating Demo Account..." : "Create Demo Admin Account"}
              </Button>
              <p className="text-xs text-blue-600 mt-2">This will create: admin@demo.com / admin123</p>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up Form */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Or enter your information to create a custom account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
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
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password">Confirm Password</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="bg-white/70"
                  />
                </div>
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
                )}
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-green-600 hover:text-green-700 underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
