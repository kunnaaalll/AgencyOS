// AgencyOS V2 — Login Page

import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Hexagon } from 'lucide-react'
import { useLogin } from './authApi'
import type { LoginRequest } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export function LoginPage() {
  const { mutate: login, isPending, error } = useLogin()
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginRequest) => {
    console.log('Form submitting...', data);
    login(data, {
      onError: (err) => console.log('Login mutation error:', err),
      onSuccess: () => console.log('Login mutation success')
    })
  }

  const errorMessage =
    (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ?? 'Login failed. Please check your credentials.'

  useGSAP(() => {
    // Apple-like smooth staggered entrance
    gsap.fromTo('.gsap-fade-up', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", delay: 0.1 }
    )
    
    // Floating logo animation
    gsap.to('.gsap-float', {
      y: -5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] relative overflow-hidden">
      
      {/* Login Card Container */}
      <div className="relative w-full max-w-[420px] mx-4 perspective-1000">
        
        {/* Logo Section */}
        <div className="text-center mb-8 gsap-fade-up flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-5 shadow-lg shadow-indigo-500/10 gsap-float p-3">
            <img src="/stand-transparent.png" alt="AgencyOS Emblem" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center justify-center mb-2">
            <img src="/Logo-transparent.png" alt="AgencyOS" className="h-8 w-auto object-contain dark:hidden" />
            <img src="/Logo-dark.png" alt="AgencyOS" className="h-8 w-auto object-contain hidden dark:block" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Autonomous Agency Intelligence & Operations Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface-card)] rounded-2xl p-8 shadow-sm border border-[var(--color-hairline)] gsap-fade-up">
          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)(e); }} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-claude-body-sm font-semibold text-[var(--color-ink)] tracking-wide uppercase">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@agency.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                })}
              />
              {errors.email && (
                <p className="text-claude-body-sm text-[var(--color-error)]">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-claude-body-sm font-semibold text-[var(--color-ink)] tracking-wide uppercase">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
              />
              {errors.password && (
                <p className="text-claude-body-sm text-[var(--color-error)]">{errors.password.message}</p>
              )}
            </div>

            {/* API Error */}
            {error && (
              <div className="px-4 py-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
                <p className="text-claude-body-sm text-[var(--color-error)]">{errorMessage}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 space-y-3">
              <Button
                variant="primary"
                size="lg"
                type="submit"
                disabled={isPending}
                className="w-full font-semibold"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 gsap-fade-up flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <img src="/stand-transparent.png" alt="AgencyOS" className="w-4 h-4 object-contain" />
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">AgencyOS</span>
          <span>•</span>
          <span>Autonomous Growth & Retainer Infrastructure</span>
        </div>
      </div>
    </div>
  )
}
