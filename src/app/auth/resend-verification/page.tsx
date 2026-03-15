'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, CheckCircle2 } from 'lucide-react'

function ResendVerificationForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Email sent!</h2>
        <p className="text-gray-500">
          If <span className="font-medium text-gray-700">{email}</span> matches an unverified account,
          you&apos;ll receive a new verification link shortly.
        </p>
        <Link href="/auth/login" className="inline-block mt-4 text-sm font-medium text-primary hover:text-[#8a3a7a]">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="text-center md:text-left">
        <Link href="/" className="inline-block mb-4">
          <Image src="/logo.png" alt="FirmCare Logo" width={120} height={120} className="object-contain" />
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">Resend verification</h2>
        <p className="mt-2 text-gray-500">
          Enter your email and we&apos;ll send you a new verification link.
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary transition-colors"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-[#8a3a7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send verification email'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:text-[#8a3a7a]">
            Sign in
          </Link>
        </p>
      </form>
    </>
  )
}

export default function ResendVerificationPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-white">
      <div className="w-full max-w-md space-y-4">
        <Suspense fallback={null}>
          <ResendVerificationForm />
        </Suspense>
      </div>
    </div>
  )
}
