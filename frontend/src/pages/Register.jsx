import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowRight, Loader2, AlertCircle, BookOpen, Sparkles, Eye, EyeOff,
} from 'lucide-react'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease } from '../lib/motion'

const TABS = [
    { id: 'STUDENT', label: 'Continuing student', icon: BookOpen },
    { id: 'FRESHER', label: 'Fresher', icon: Sparkles },
]

export default function Register() {
    const navigate = useNavigate()
    const { register, loading } = useAuthStore()
    const { push } = useToastStore()

    const [accountType, setAccountType] = useState('STUDENT')
    const [universities, setUniversities] = useState([])
    const [loadingUnis, setLoadingUnis] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        universityId: '',
        department: '',
        phone: '',
        matricNumber: '',
        jambRegNumber: '',
        admissionRef: '',
        applicationNumber: '',
    })

    const setField = (f) => (e) => setForm({ ...form, [f]: e.target.value })

    useEffect(() => {
        let cancelled = false
        api.get('/api/auth/universities')
            .then((res) => { if (!cancelled) setUniversities(res.data?.data || []) })
            .catch(() => { if (!cancelled) push({ type: 'error', message: 'Could not load universities' }) })
            .finally(() => { if (!cancelled) setLoadingUnis(false) })
        return () => { cancelled = true }
    }, [push])

    const selectedUni = useMemo(
        () => universities.find((u) => String(u.id) === String(form.universityId)) || null,
        [universities, form.universityId]
    )

    const fresherEnabled = selectedUni?.fresherRegistrationEnabled !== false

    useEffect(() => {
        if (accountType === 'FRESHER' && selectedUni && !fresherEnabled) setAccountType('STUDENT')
    }, [accountType, selectedUni, fresherEnabled])

    const submit = async (e) => {
        e.preventDefault()
        if (form.password.length < 8) {
            push({ type: 'error', message: 'Password must be at least 8 characters' })
            return
        }
        if (form.password !== form.confirmPassword) {
            push({ type: 'error', message: 'Passwords do not match' })
            return
        }
        if (!form.universityId) {
            push({ type: 'error', message: 'Please select your university' })
            return
        }

        const payload = {
            email: form.email.trim(),
            password: form.password,
            fullName: form.fullName.trim(),
            universityId: Number(form.universityId),
            department: form.department.trim() || null,
            phone: form.phone.trim() || null,
            accountType,
        }

        if (accountType === 'STUDENT') {
            payload.matricNumber = form.matricNumber.trim()
        } else {
            if (selectedUni?.requireJambReg !== false) payload.jambRegNumber = form.jambRegNumber.trim() || null
            if (selectedUni?.requireAdmissionRef) payload.admissionRef = form.admissionRef.trim() || null
            if (selectedUni?.requireApplicationNumber) payload.applicationNumber = form.applicationNumber.trim() || null
        }

        const res = await register(payload)
        if (res.success) {
            push({ type: 'success', message: accountType === 'FRESHER' ? 'Registered as fresher. Check your email for the code.' : 'Account created. Check your email for the code.' })
            navigate('/verify-email', { state: { email: form.email.trim(), devCode: res.devVerificationCode } })
        } else {
            push({ type: 'error', message: res.error })
        }
    }

    const inputClass =
        'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 disabled:opacity-50'

    const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Left brand panel */}
            <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-sm font-bold text-brand-700">UQ</div>
                    <span className="text-lg font-semibold text-white">UniQueue</span>
                </div>

                <div>
                    <h1 className="text-3xl font-semibold leading-tight text-white">
                        Join your university's digital queue system.
                    </h1>
                    <p className="mt-4 max-w-md text-sm text-slate-200">
                        Continuing students sign in with their matric. Freshers register with
                        their JAMB or admission reference.
                    </p>
                    <div className="mt-10 space-y-3">
                        {['Verified students get instant queue access', 'Freshers get a personal dashboard from day one', 'No more standing in line for hours'].map((item) => (
                            <div key={item} className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm text-slate-200">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-xs text-slate-400">© {new Date().getFullYear()} UniQueue. All rights reserved.</div>
            </div>

            {/* Right form */}
            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="w-full max-w-md"
                >
                    <div className="mb-6 lg:hidden">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">UQ</div>
                            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">UniQueue</span>
                        </Link>
                    </div>

                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        Create your account
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Already registered?{' '}
                        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
                    </p>

                    {/* Tabs */}
                    <div className="mt-6 flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                        {TABS.map((t) => {
                            const Icon = t.icon
                            const disabled = t.id === 'FRESHER' && selectedUni && !fresherEnabled
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => setAccountType(t.id)}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                        accountType === t.id
                                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                                            : disabled
                                                ? 'cursor-not-allowed text-slate-300'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {t.label}
                                </button>
                            )
                        })}
                    </div>

                    {accountType === 'FRESHER' && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                Register with your personal email. Use the reference on your
                admission letter. You'll get your matric later.
              </span>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-6 space-y-3">
                        <div>
                            <label className={labelClass}>University</label>
                            <select
                                value={form.universityId}
                                onChange={setField('universityId')}
                                required
                                disabled={loadingUnis}
                                className={`${inputClass} appearance-none`}
                            >
                                <option value="">{loadingUnis ? 'Loading…' : 'Select your university'}</option>
                                {universities.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Full name</label>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={setField('fullName')}
                                placeholder="Your full name"
                                required
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>{accountType === 'FRESHER' ? 'Personal email' : 'Email'}</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={setField('email')}
                                placeholder="Enter your email"
                                required
                                className={inputClass}
                            />
                        </div>

                        {accountType === 'STUDENT' && (
                            <div>
                                <label className={labelClass}>Matric number</label>
                                <input
                                    type="text"
                                    value={form.matricNumber}
                                    onChange={setField('matricNumber')}
                                    placeholder="Enter your matric number"
                                    required
                                    className={inputClass}
                                />
                                {selectedUni?.matricDescription && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Format: <span className="font-mono">{selectedUni.matricDescription}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        {accountType === 'FRESHER' && selectedUni && (
                            <>
                                {selectedUni.requireJambReg !== false && (
                                    <div>
                                        <label className={labelClass}>JAMB registration number</label>
                                        <input
                                            type="text"
                                            value={form.jambRegNumber}
                                            onChange={setField('jambRegNumber')}
                                            placeholder="Enter your JAMB registration number"
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                )}
                                {selectedUni.requireAdmissionRef && (
                                    <div>
                                        <label className={labelClass}>Admission reference</label>
                                        <input
                                            type="text"
                                            value={form.admissionRef}
                                            onChange={setField('admissionRef')}
                                            placeholder="Enter admission reference"
                                            className={inputClass}
                                        />
                                    </div>
                                )}
                                {selectedUni.requireApplicationNumber && (
                                    <div>
                                        <label className={labelClass}>Application number</label>
                                        <input
                                            type="text"
                                            value={form.applicationNumber}
                                            onChange={setField('applicationNumber')}
                                            placeholder="Enter application number"
                                            className={inputClass}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Department (optional)</label>
                                <input
                                    type="text"
                                    value={form.department}
                                    onChange={setField('department')}
                                    placeholder="Enter department"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Phone (optional)</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={setField('phone')}
                                    placeholder="Enter phone number"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={setField('password')}
                                        placeholder="At least 8 characters"
                                        required
                                        className={`${inputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Confirm password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={form.confirmPassword}
                                        onChange={setField('confirmPassword')}
                                        placeholder="Re-enter password"
                                        required
                                        className={`${inputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="!mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating account…
                                </>
                            ) : (
                                <>
                                    {accountType === 'FRESHER' ? 'Create fresher account' : 'Create account'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {accountType === 'FRESHER' && (
                        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                            After you receive your matric, you'll be able to upgrade to full
                            student access from your profile.
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    )
}