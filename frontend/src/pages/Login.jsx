import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowRight, Loader2, Eye, EyeOff,
    ShieldCheck, Users, Zap, MapPin, Lock
} from 'lucide-react'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease } from '../lib/motion'
import Logo from '../components/ui/Logo'

const LOGIN_BACKGROUND =
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1600'

function resolveImageUrl(url) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
    const base = import.meta.env.VITE_API_URL || ''
    return base ? `${base}${url}` : url
}

function LeftPanel({ brand, imageError, onImageError }) {
    const backgroundSrc =
        brand.campusImageUrl && !imageError ? brand.campusImageUrl : LOGIN_BACKGROUND

    return (
        <div className="relative hidden h-full min-h-screen flex-col justify-between overflow-hidden bg-[#eef2ff] p-10 dark:bg-slate-950 lg:flex">

            {/* Background Image & Overlays */}
            <div className="absolute inset-0 z-0">
                <motion.img
                    key={backgroundSrc}
                    src={backgroundSrc}
                    alt=""
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, ease }}
                    onError={onImageError}
                    className="absolute bottom-0 left-0 h-[55%] w-full object-cover object-top"
                    draggable={false}
                />

                {/* 1. Top blend: Keeps text area solid light blue (or dark slate), fades to transparent */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#eef2ff] via-[#eef2ff] to-transparent to-[75%] dark:from-slate-950 dark:via-slate-950" />

                {/* 2. Bottom darken: Makes the footer text readable */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0f172a]/80 via-[#0f172a]/20 to-transparent" />
            </div>

            {/* Top: Logo */}
            {/* 👇 ADDED: Wrapped in Link to navigate home */}
            <Link to="/" className="relative z-10 flex w-fit items-center gap-3 transition-opacity hover:opacity-80">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                    {brand.logoUrl ? (
                        <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="h-full w-full object-contain p-1"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                    ) : (
                        <Logo size={24} variant="icon" />
                    )}
                </div>
                <div>
                    <div className="text-sm font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                        {brand.name}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400">
                        Digital Queue System
                    </div>
                </div>
            </Link>

            {/* Middle: Features */}
            <div className="relative z-10 max-w-md pt-8">
                <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#0f172a] dark:text-white">
                    Welcome back.<br />
                    <span className="text-brand-600 dark:text-brand-400">Your spot is waiting.</span>
                </h2>

                <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-800 dark:text-slate-300">
                    Sign in to see live wait times and pick up where you left off.
                </p>

                <ul className="mt-8 space-y-5">
                    <li className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700 dark:text-brand-400">
                            <Zap className="h-5 w-5" />
                        </span>
                        <div>
                            <strong className="block text-sm font-bold text-slate-900 dark:text-white">Quick Access</strong>
                            <span className="text-sm text-slate-700 dark:text-slate-400">Skip long lines and save time</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700 dark:text-brand-400">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <strong className="block text-sm font-bold text-slate-900 dark:text-white">Secure & Reliable</strong>
                            <span className="text-sm text-slate-700 dark:text-slate-400">Your data is always protected</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700 dark:text-brand-400">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <strong className="block text-sm font-bold text-slate-900 dark:text-white">Built for Students</strong>
                            <span className="text-sm text-slate-700 dark:text-slate-400">Designed for a better university experience</span>
                        </div>
                    </li>
                </ul>
            </div>

            {/* Bottom: Footer */}
            <div className="relative z-10 pt-10">
                <div className="flex items-center gap-2 text-xs font-medium text-white drop-shadow-md">
                    <MapPin className="h-4 w-4" />
                    {brand.name} · Digital Queue System
                </div>
                <div className="mt-1 text-[11px] text-white/80">
                    © {new Date().getFullYear()} All rights reserved.
                </div>
            </div>
        </div>
    )
}

function useCountdown(targetTime) {
    const computeRemaining = () =>
        targetTime ? Math.max(0, Math.ceil((targetTime - Date.now()) / 1000)) : 0

    const [remaining, setRemaining] = useState(computeRemaining)

    useEffect(() => {
        if (!targetTime) {
            setRemaining(0)
            return
        }
        setRemaining(computeRemaining())
        const interval = setInterval(() => {
            setRemaining(computeRemaining())
        }, 1000)
        return () => clearInterval(interval)
    }, [targetTime])

    return remaining
}

function formatWait(seconds) {
    if (seconds <= 0) return 'now'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`
}

const DEFAULT_BRAND = { name: 'UniQueue', logoUrl: null, campusImageUrl: null }

export default function Login() {
    const navigate = useNavigate()
    const { login, loading } = useAuthStore()
    const { push } = useToastStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [redirecting, setRedirecting] = useState(false)

    const [brand, setBrand] = useState(DEFAULT_BRAND)
    const [imageError, setImageError] = useState(false)
    const [rateLimitedUntil, setRateLimitedUntil] = useState(null)

    const remainingSeconds = useCountdown(rateLimitedUntil)
    const isRateLimited = remainingSeconds > 0

    const handleEmailChange = (event) => {
        const next = event.target.value
        if (next.trim().toLowerCase() !== email.trim().toLowerCase()) {
            setRateLimitedUntil(null)
        }
        setEmail(next)
    }

    useEffect(() => {
        const trimmed = email.trim().toLowerCase()
        const at = trimmed.indexOf('@')
        if (at === -1 || at === trimmed.length - 1) {
            setBrand(DEFAULT_BRAND)
            return
        }
        const domain = trimmed.slice(at + 1)
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/api/auth/universities/lookup?domain=${encodeURIComponent(domain)}`)
                const universityData = res.data?.data
                if (universityData) {
                    setBrand({
                        name: universityData.name || DEFAULT_BRAND.name,
                        logoUrl: resolveImageUrl(universityData.logoUrl),
                        campusImageUrl: resolveImageUrl(universityData.campusImageUrl),
                    })
                    setImageError(false)
                } else {
                    setBrand(DEFAULT_BRAND)
                }
            } catch {
                setBrand(DEFAULT_BRAND)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [email])

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (isRateLimited) return

        setRedirecting(true)

        const res = await login(email, password)

        if (res.success) {
            push({ type: 'success', message: 'Signed in successfully' })
            navigate(dashboards[res.role] || '/')
            return
        }

        setRedirecting(false)

        if (res.rateLimited && res.retryAfter) {
            setRateLimitedUntil(Date.now() + res.retryAfter * 1000)
            return
        }

        // 🔧 FIX: Check if the error is related to an unverified account
        const msg = (res.error || '').toLowerCase()
        if (
            msg.includes('not verified') ||
            msg.includes('unverified') ||
            msg.includes('verify') ||
            msg.includes('verification') ||
            msg.includes('activate')
        ) {
            push({ type: 'info', message: 'Please verify your email to continue.' })
            // Redirect immediately to the verification page, passing the email
            navigate('/verify-email', { state: { email: email.trim() } })
            return
        }

        push({ type: 'error', message: res.error })
    }

    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
        FRESHER: '/student',
    }

    const inputClass =
        'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
    const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300'

    return (
        /* 👇 THE FIX: h-full w-full overflow-y-auto allows mobile scrolling */
        <div className="h-full w-full overflow-y-auto bg-white dark:bg-slate-950 lg:overflow-hidden">
            <div className="flex min-h-full flex-col lg:grid lg:h-full lg:grid-cols-2">

                <LeftPanel
                    brand={brand}
                    imageError={imageError}
                    onImageError={() => setImageError(true)}
                />

                <div className="flex w-full items-start justify-center bg-white px-6 py-10 dark:bg-slate-950 sm:px-12 lg:h-full lg:overflow-y-auto lg:py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease }}
                        className="w-full max-w-[420px] mt-10 sm:mt-20"
                    >

                        {/* 👇 ADDED: Wrapped Mobile Logo in Link to navigate home */}
                        <Link to="/" className="mb-8 flex w-fit items-center gap-2.5 transition-opacity hover:opacity-80 lg:hidden">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-white">
                                <Logo size={20} variant="icon" />
                            </div>
                            <div className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                                {brand.name}
                            </div>
                        </Link>

                        <div className="mb-8">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                Sign in
                            </h1>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                Enter your credentials to continue.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    required
                                    disabled={redirecting}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        required
                                        disabled={redirecting || isRateLimited}
                                        className={`${inputClass} pr-11`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-1">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || redirecting || isRateLimited}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30 disabled:opacity-60"
                            >
                                {isRateLimited ? (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        Try again in {formatWait(remainingSeconds)}
                                    </>
                                ) : loading || redirecting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Signing in…
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                    </>
                                )}
                            </button>

                            {isRateLimited && (
                                <p className="text-center text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                    Too many attempts on this email. Sign-in is paused for security.
                                </p>
                            )}
                        </form>

                        <div className="mt-8">
                            <div className="mb-6 flex items-center">
                                <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                                <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">New to UniQueue?</span>
                                <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                            </div>

                            <Link
                                to="/register"
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white py-3.5 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-brand-400 dark:hover:bg-slate-700"
                            >
                                Create an account
                            </Link>
                        </div>

                    </motion.div>
                </div>
            </div>
        </div>
    )
}