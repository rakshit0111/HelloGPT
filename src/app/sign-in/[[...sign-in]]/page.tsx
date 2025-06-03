import { SignIn } from "@clerk/nextjs"
import { MessageSquare, Sparkles, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full"></div>
        </div>

        {/* Logo and Brand */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">HelloGPT</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Welcome Back to
            <span className="block text-blue-200">Your AI Assistant</span>
          </h1>

          <p className="text-blue-100 text-lg mb-8 max-w-md">
            Continue your intelligent conversations and unlock the full potential of AI-powered assistance.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <span>Pick up where you left off</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <span>Your conversations are secure</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <span>Instant access to all features</span>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">10+</div>
              <div className="text-blue-200 text-sm">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">100+</div>
              <div className="text-blue-200 text-sm">Conversations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-blue-200 text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-xl">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ChatClone</span>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to continue your AI journey</p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="flex justify-center">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-2xl border-0 w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50 text-gray-700",
                  socialButtonsBlockButtonText: "font-medium",
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-3",
                  formFieldInput: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                  footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                  identityPreviewText: "text-gray-700",
                  formFieldLabel: "text-gray-700 font-medium",
                },
                layout: {
                  socialButtonsPlacement: "top",
                },
              }}
              redirectUrl="/dashboard"
            />
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Do not have an account?{" "}
              <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Secure login</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles className="h-4 w-4" />
                <span>Instant access</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4" />
                <span>Always available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
