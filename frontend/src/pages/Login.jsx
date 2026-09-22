import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, LogOut, CheckCircle2, Loader2 } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease, fadeUp } from '../lib/motion'

const dashboards = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    STAFF: '/staff',
    USER: '/student',
}

const DEFAULT_BRAND = {
    name: 'UniQueue',
    logoUrl: null,
    campusImageUrl: null,
}

function resolveImageUrl(url) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url
    }
    const base = import.meta.env.VITE_API_URL || ''
    return base ? `${base}${url}` : url
}

export default function Login() {
    const navigate = useNavigate()
    const { login, loading, user, logout } = useAuthStore()
    const { push } = useToastStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [redirecting, setRedirecting] = useState(false)
    const [brand, setBrand] = useState(DEFAULT_BRAND)
    const [imageError, setImageError] = useState(false)

    // ── Detect university from email domain (debounced) ──
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
                const res = await api.get(
                    `/api/auth/universities/lookup?domain=${encodeURIComponent(domain)}`
                )
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setRedirecting(true)
        const res = await login(email, password)
        if (res.success) {
            push({ type: 'success', message: 'Signed in successfully' })
            navigate(dashboards[res.role] || '/')
        } else {
            setRedirecting(false)
            push({ type: 'error', message: res.error })
        }
    }

    const handleSwitchAccount = () => {
        logout()
        push({ type: 'info', message: 'Signed out — sign in with another account' })
        setEmail('')
        setPassword('')
    }

    const showAlreadySignedInBanner = user && !redirecting

    return (
        <div className="flex min-h-screen">
            {/* ══════════ LEFT: Full-bleed image panel ══════════ */}
            <div className="relative hidden w-1/2 shrink-0 overflow-hidden bg-slate-900 lg:block xl:w-[55%]">
                {/* Campus image fills the container; gradient fallback if none */}
                {brand.campusImageUrl && !imageError ? (
                    <motion.img
                        key={brand.campusImageUrl}
                        src={brand.campusImageUrl}
                        alt=""
                        aria-hidden="true"
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.1, ease }}
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900" />
                )}

                {/* Subtle right-edge shadow so the panels feel distinct */}
                <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-950/25 to-transparent" />
            </div>

            {/* ══════════ RIGHT: Login form ══════════ */}
            <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 dark:bg-slate-950">
                <motion.div
                    variants={fadeUp}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.5, ease }}
                    className="w-full max-w-sm"
                >
                    {/* ─── School header: logo → name → subtitle ─── */}
                    <motion.div
                        key={`form-brand-${brand.name}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10 flex flex-col items-center text-center"
                    >
                        {/* Logo */}
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden">
                            {brand.logoUrl ? (
                                <img
                                    src={brand.logoUrl}
                                    alt={brand.name}
                                    className="h-full w-full object-contain"
                                    onError={(e) => { e.target.style.display = 'none' }}
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
                                    UQ
                                </div>
                            )}
                        </div>

                        {/* School name */}
                        <h1 className="mt-6 text-xl font-bold uppercase leading-tight tracking-wide text-slate-900 dark:text-slate-100 sm:text-2xl">
                            {brand.name}
                        </h1>

                        {/* Subtitle */}
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Queue Management System
                        </p>
                    </motion.div>

                    {/* Already-signed-in banner */}
                    {showAlreadySignedInBanner && (
                        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-emerald-900">
                                        You're already signed in
                                    </p>
                                    <p className="mt-0.5 text-xs text-emerald-700">
                                        Signed in as <strong>{user.email}</strong>
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Link
                                            to={dashboards[user.role] || '/'}
                                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                                        >
                                            Go to dashboard
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                        <button
                                            onClick={handleSwitchAccount}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
                                        >
                                            <LogOut className="h-3 w-3" />
                                            Switch account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        Sign in
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Enter your credentials to access your dashboard.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8">
                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@university.edu.ng"
                            icon={Mail}
                            required
                            disabled={redirecting}
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            icon={Lock}
                            required
                            disabled={redirecting}
                        />

                        <div className="-mt-2 mb-4 flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button type="submit" fullWidth disabled={loading || redirecting} className="mt-2">
                            {loading || redirecting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="font-medium text-brand-600 hover:text-brand-700"
                        >
                            Register as a student
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}