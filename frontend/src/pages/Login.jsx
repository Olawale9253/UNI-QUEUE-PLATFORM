import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, LogOut, CheckCircle2, Loader2 } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease, fadeUp } from '../lib/motion'

const dashboards = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    STAFF: '/staff',
    USER: '/student',
}

export default function Login() {
    const navigate = useNavigate()
    const { login, loading, user, logout } = useAuthStore()
    const { push } = useToastStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [redirecting, setRedirecting] = useState(false)

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

    // Show the "already signed in" banner only when NOT currently logging in
    const showAlreadySignedInBanner = user && !redirecting

    return (
        <div className="flex min-h-screen">
            {/* Left brand panel */}
            <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, ease }}
                    className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
                />

                <Link to="/" className="relative flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                        UQ
                    </div>
                    <span className="text-lg font-semibold text-white">UniQueue</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1, ease }}
                    className="relative"
                >
                    <h1 className="text-3xl font-semibold leading-tight text-white">
                        Modern queue management for modern universities.
                    </h1>
                    <p className="mt-4 max-w-md text-slate-400">
                        Trusted by administrators, staff, and students to eliminate physical
                        waiting lines and deliver a better service experience.
                    </p>

                    <div className="mt-10 space-y-4">
                        {[
                            'Virtual tickets with live position tracking',
                            'Real-time notifications for students and staff',
                            'Detailed operational analytics for administrators',
                        ].map((item) => (
                            <motion.div
                                key={item}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.3, ease }}
                                className="flex items-start gap-3"
                            >
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/20">
                                    <svg
                                        className="h-3 w-3 text-indigo-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-slate-300">{item}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <div className="relative text-xs text-slate-500">
                    © {new Date().getFullYear()} UniQueue. All rights reserved.
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <motion.div
                    variants={fadeUp}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.5, ease }}
                    className="w-full max-w-sm"
                >
                    <div className="mb-8 lg:hidden">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                                UQ
                            </div>
                            <span className="text-lg font-semibold text-slate-900">UniQueue</span>
                        </Link>
                    </div>

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

                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Sign in
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
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

                        <Button
                            type="submit"
                            fullWidth
                            disabled={loading || redirecting}
                            className="mt-2"
                        >
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

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            Register as a student
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}