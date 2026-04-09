'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

function LoginForm() {
  const searchParams = useSearchParams()
  const toast = useToast()
  const callbackUrl = searchParams.get('callbackUrl') || ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const urlError = searchParams.get('error')
  const [error, setError] = useState(urlError === 'account_deactivated' ? 'Your account has been deactivated.' : '')
  const [isEmailUnverified, setIsEmailUnverified] = useState(false)
  const [isDeactivated, setIsDeactivated] = useState(urlError === 'account_deactivated')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setIsEmailUnverified(false)
    setIsDeactivated(false)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.code === 'email_not_verified') {
          setError('Your email address has not been verified.')
          setIsEmailUnverified(true)
        } else if (result.code === 'account_deactivated') {
          setError('Your account has been deactivated.')
          setIsDeactivated(true)
        } else {
          setError('Invalid email or password')
        }
      } else {
        // Fetch session to check user role
        const response = await fetch('/api/auth/session')
        const session = await response.json()

        // Admins always go to admin; agents to agent dashboard.
        // Regular users go to callbackUrl if present, otherwise dashboard.
        const role = session?.user?.role
        toast.success('Welcome back! Redirecting…')
        setTimeout(() => {
          if (role === 'ADMIN' || role === 'SUPERADMIN') {
            window.location.href = '/admin'
          } else if (role === 'AGENT') {
            window.location.href = '/agent/dashboard'
          } else if (callbackUrl && callbackUrl.startsWith('/')) {
            window.location.href = callbackUrl
          } else {
            window.location.href = '/dashboard'
          }
        }, 1000)
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Side - Image/Branding */}
      <div className="hidden md:flex flex-col justify-center items-center bg-primary/10 p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="relative z-10 text-center max-w-lg">
          <h1 className="text-4xl font-bold text-primary mb-6">Welcome Back</h1>
          <p className="text-lg text-gray-600">
            Access your dashboard to manage appointments, view results, and track your wellness journey.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
             <Link href="/" className="inline-block mb-4">
               <Image src="/logo.png" alt="FirmCare Logo" width={120} height={120} className="object-contain" />
             </Link>
             <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
             <p className="mt-2 text-gray-500">
               New to FirmCare?{' '}
               <Link href={`/auth/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="font-medium text-primary hover:text-[#8a3a7a]">
                 Create an account
               </Link>
             </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition-colors pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary-dark font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    {isEmailUnverified && (
                      <p className="mt-1 text-sm text-red-700">
                        Check your inbox for the verification link, or{' '}
                        <Link
                          href={`/auth/resend-verification?email=${encodeURIComponent(email)}`}
                          className="font-medium underline hover:text-red-900"
                        >
                          resend the verification email
                        </Link>.
                      </p>
                    )}
                    {isDeactivated && (
                      <p className="mt-1 text-sm text-red-700">
                        Please contact the administrator to restore access.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-[#8a3a7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
