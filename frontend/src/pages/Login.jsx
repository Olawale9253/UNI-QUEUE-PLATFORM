import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease, fadeUp } from '../lib/motion'

export default function Login() {
    const navigate = useNavigate()
    const { login, loading } = useAuthStore()
    const { push } = useToastStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const res = await login(email, password)
        if (res.success) {
            push({ type: 'success', message: 'Signed in successfully' })
            navigate(dashboards[res.role] || '/')
        } else {
            push({ type: 'error', message: res.error })
        }
    }

    return (
        <div className="flex min-h-screen">
            <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
                {/* Soft gradient orb */}
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

                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={{
                            initial: {},
                            animate: { transition: { delayChildren: 0.3, staggerChildren: 0.08 } },
                        }}
                        className="mt-10 space-y-4"
                    >
                        {[
                            'Virtual tickets with live position tracking',
                            'Real-time notifications for students and staff',
                            'Detailed operational analytics for administrators',
                        ].map((item) => (
                            <motion.div
                                key={item}
                                variants={{
                                    initial: { opacity: 0, x: -10 },
                                    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
                                }}
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
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm text-slate-300">{item}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                <div className="relative text-xs text-slate-500">
                    © {new Date().getFullYear()} UniQueue. All rights reserved.
                </div>
            </div>

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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@university.edu.ng"
                            icon={Mail}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            icon={Lock}
                            required
                        />

                        <Button type="submit" fullWidth disabled={loading} className="mt-2">
                            {loading ? 'Signing in…' : 'Sign in'}
                            {!loading && <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
                            Register as a student
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}