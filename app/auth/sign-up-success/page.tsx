import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-800">Account Created Successfully!</CardTitle>
            <CardDescription>Please check your email to verify your account</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>Verification email sent</span>
            </div>
            <p className="text-sm text-gray-600">
              You&apos;ve successfully signed up for the Attendance Monitoring System. Please check your email and click
              the verification link to activate your account.
            </p>
            <div className="pt-4">
              <Button asChild className="w-full">
                <Link href="/auth/login">Return to Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
