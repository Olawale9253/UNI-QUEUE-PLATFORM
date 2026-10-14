import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowRight, LogOut, CheckCircle2, Loader2, Eye, EyeOff,
    Ticket, Bell, ShieldCheck, Building2, Lock,
} from 'lucide-react'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease, fadeUp } from '../lib/motion'

const dashboards = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    STAFF: '/staff',
    USER: '/student',
    FRESHER: '/student',
}

const DEFAULT_BRAND = { name: 'UniQueue', logoUrl: null, campusImageUrl: null }

const LOGIN_BACKGROUND =
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1600'

function resolveImageUrl(url) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
    const base = import.meta.env.VITE_API_URL || ''
    return base ? `${base}${url}` : url
}

async function syncExistingPushSubscription() {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        if (!reg) return
        const sub = await reg.pushManager.getSubscription()
        if (!sub) return
        const raw = sub.toJSON()
        await api.post('/api/push/subscribe', { endpoint: raw.endpoint, keys: raw.keys })
    } catch (err) {
        console.debug('[push] re-sync skipped:', err?.message)
    }
}

/* ─────────────────────────────────────────────
   Countdown helpers
   ───────────────────────────────────────────── */

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetTime])

    return remaining
}

function formatWait(seconds) {
    if (seconds <= 0) return 'now'
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m < 60) return s === 0 ? `${m}m` : `${m}m ${s}s`
    const h = Math.floor(m / 60)
    const rem = m % 60
    return rem === 0 ? `${h}h` : `${h}h ${rem}m`
}

/* ─────────────────────────────────────────────
   Left panel
   ───────────────────────────────────────────── */

function LeftPanel({ brand, imageError, onImageError }) {
    const backgroundSrc =
        brand.campusImageUrl && !imageError ? brand.campusImageUrl : LOGIN_BACKGROUND

    return (
        <div className="relative hidden h-full min-h-0 overflow-hidden bg-slate-900 lg:block">
            <motion.img
                key={backgroundSrc}
                src={backgroundSrc}
                alt=""
                aria-hidden
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease }}
                onError={onImageError}
                className="absolute inset-0 h-full w-full object-cover object-center"
                draggable={false}
            />
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'linear-gradient(160deg, rgb(var(--brand-800, 30 64 175) / 0.65) 0%, rgb(var(--brand-900, 30 58 138) / 0.82) 60%, rgb(var(--brand-950, 23 37 84) / 0.94) 100%)',
                }}
                aria-hidden
            />
            <div
                className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
                aria-hidden
            />

            <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-10">
                <Link to="/" className="flex items-center gap-3 text-white">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
                        {brand.logoUrl ? (
                            <img
                                src={brand.logoUrl}
                                alt={brand.name}
                                className="h-full w-full object-contain p-1"
                                onError={(e) => { e.target.style.display = 'none' }}
                            />
                        ) : (
                            <Building2 className="h-4.5 w-4.5 text-white" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-bold uppercase tracking-tight text-white">
                            {brand.name}
                        </div>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/60">
                            Digital Queue System
                        </div>
                    </div>
                </Link>

                <div className="max-w-md">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
                        <span className="h-1 w-1 rounded-full bg-white/80" />
                        Welcome back
                    </div>

                    <h2 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-lg xl:text-4xl">
                        Your spot in line
                        <span className="block text-white/75">is waiting.</span>
                    </h2>

                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
                        Sign in to see live wait times and pick up where you left off.
                    </p>

                    <div className="mt-6 flex max-w-[280px] items-center gap-3 rounded-xl border border-white/20 bg-white/95 px-3.5 py-3 shadow-xl shadow-black/30">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                            <Ticket className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-mono text-base font-black tracking-tight text-brand-700">
                                    A-042
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                                    ● Live
                                </span>
                            </div>
                            <div className="truncate text-[10px] font-medium text-slate-500">
                                Now serving · ≈ 3 min
                            </div>
                        </div>
                    </div>

                    <ul className="mt-5 grid gap-2">
                        <li className="flex items-center gap-2.5 text-xs text-white/85">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                                <Bell className="h-2.5 w-2.5" />
                            </span>
                            Get notified the moment it's your turn
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/85">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                                <ShieldCheck className="h-2.5 w-2.5" />
                            </span>
                            Verified by your university
                        </li>
                    </ul>
                </div>

                <div className="max-w-sm border-l-2 border-white/30 pl-3">
                    <p className="text-xs italic leading-relaxed text-white/80">
                        "Thirty minutes saved every morning — that's a full lecture's worth of time."
                    </p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/50">
                        — Registry staff, LAUTECH
                    </p>
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function Login() {
    const navigate = useNavigate()
    const { login, loading, user, logout } = useAuthStore()
    const { push } = useToastStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [redirecting, setRedirecting] = useState(false)
    const [brand, setBrand] = useState(DEFAULT_BRAND)
    const [imageError, setImageError] = useState(false)
    const [unverified, setUnverified] = useState(false)
    const [rateLimitedUntil, setRateLimitedUntil] = useState(null)

    const remainingSeconds = useCountdown(rateLimitedUntil)
    const isRateLimited = remainingSeconds > 0

    // If the user changes the email, clear the cooldown — different account,
    // fresh rate-limit bucket on the backend.
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
                const d = res.data?.data
                if (d) {
                    setBrand({
                        name: d.name || DEFAULT_BRAND.name,
                        logoUrl: resolveImageUrl(d.logoUrl),
                        campusImageUrl: resolveImageUrl(d.campusImageUrl),
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
        setUnverified(false)

        const res = await login(email, password)
        if (res.success) {
            syncExistingPushSubscription()
            push({ type: 'success', message: 'Signed in successfully' })
            navigate(dashboards[res.role] || '/')
            return
        }
        setRedirecting(false)

        // Rate limited — the banner carries the message; no toast needed.
        if (res.rateLimited && res.retryAfter) {
            setRateLimitedUntil(Date.now() + res.retryAfter * 1000)
            return
        }

        // Email not verified — redirect to verification page.
        const msg = (res.error || '').toLowerCase()
        if (msg.includes('not verified') || msg.includes('verification')) {
            setUnverified(true)
            push({ type: 'info', message: 'Your email is not verified. Redirecting…' })
            setTimeout(() => navigate('/verify-email', { state: { email: email.trim() } }), 1200)
            return
        }

        push({ type: 'error', message: res.error })
    }

    const handleSwitchAccount = () => {
        logout()
        push({ type: 'info', message: 'Signed out' })
        setEmail('')
        setPassword('')
        setRateLimitedUntil(null)
    }

    const showAlreadySignedInBanner = user && !redirecting

    const inputClass =
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'

    return (
        <div className="h-screen overflow-hidden">
            <div className="grid h-full grid-cols-1 lg:grid-cols-2">
                <LeftPanel
                    brand={brand}
                    imageError={imageError}
                    onImageError={() => setImageError(true)}
                />

                <div className="flex h-full min-h-0 items-center justify-center overflow-hidden bg-white px-6 dark:bg-slate-950">
                    <motion.div
                        variants={fadeUp}
                        initial="initial"
                        animate="animate"
                        transition={{ duration: 0.5, ease }}
                        className="w-full max-w-sm"
                    >
                        <div className="mb-6 flex items-center gap-2.5 lg:hidden">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-white">
                                {brand.logoUrl ? (
                                    <img
                                        src={brand.logoUrl}
                                        alt={brand.name}
                                        className="h-full w-full object-contain p-1"
                                        onError={(e) => { e.target.style.display = 'none' }}
                                    />
                                ) : (
                                    <Building2 className="h-4.5 w-4.5" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                                    {brand.name}
                                </div>
                                <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Digital Queue System
                                </div>
                            </div>
                        </div>

                        {showAlreadySignedInBanner && (
                            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                                            Already signed in as <strong>{user.email}</strong>
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Link
                                                to={dashboards[user.role] || '/'}
                                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-emerald-700"
                                            >
                                                Dashboard
                                                <ArrowRight className="h-2.5 w-2.5" />
                                            </Link>
                                            <button
                                                onClick={handleSwitchAccount}
                                                className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300"
                                            >
                                                <LogOut className="h-2.5 w-2.5" />
                                                Switch
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Rate limit banner ── */}
                        {isRateLimited && (
                            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                                        <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                                            Too many sign-in attempts
                                        </p>
                                        <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                                            For security, sign-in is paused for this email.
                                            You can try again in{' '}
                                            <strong className="font-mono tabular-nums">
                                                {formatWait(remainingSeconds)}
                                            </strong>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {unverified && (
                            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                                <p className="font-medium">Your email isn't verified</p>
                                <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                                    Redirecting you now, or{' '}
                                    <Link to="/verify-email" state={{ email: email.trim() }} className="font-medium underline">
                                        click here
                                    </Link>
                                    .
                                </p>
                            </div>
                        )}

                        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                            Sign in
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Enter your credentials to continue.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Email
                                </label>
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
                                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        required
                                        disabled={redirecting || isRateLimited}
                                        className={`${inputClass} pr-9`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-[11px] font-medium text-brand-600 transition-colors hover:text-brand-700"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || redirecting || isRateLimited}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-4 space-y-1.5 text-center text-xs">
                            <p className="text-slate-500 dark:text-slate-400">
                                Don't have an account?{' '}
                                <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
                                    Register
                                </Link>
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                Unverified?{' '}
                                <Link
                                    to="/verify-email"
                                    state={{ email: email.trim() }}
                                    className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                >
                                    Verify now
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}