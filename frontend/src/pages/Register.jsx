import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowRight, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff,
    Ticket, ShieldCheck, Building2, Users,
} from 'lucide-react'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease } from '../lib/motion'
import Logo from '../components/ui/Logo' // ⬅️ IMPORTED CUSTOM LOGO

const REGISTER_BACKGROUND =
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1600'

function resolveImageUrl(url) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
    const base = import.meta.env.VITE_API_URL || ''
    return base ? `${base}${url}` : url
}

/* ─────────────────────────────────────────────
   Left panel — image + brief institutional copy
   ───────────────────────────────────────────── */

function LeftPanel({ university, imageError, onImageError }) {
    const backgroundSrc =
        university?.campusImageUrl && !imageError
            ? resolveImageUrl(university.campusImageUrl)
            : REGISTER_BACKGROUND

    const logoUrl = university?.logoUrl ? resolveImageUrl(university.logoUrl) : null
    const brandName = university?.name || 'UniQueue'

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
                        'linear-gradient(160deg, rgb(var(--brand-800, 30 64 175) / 0.35) 0%, rgb(var(--brand-900, 30 58 138) / 0.55) 50%, rgb(var(--brand-950, 23 37 84) / 0.8) 100%)',
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
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={brandName}
                                className="h-full w-full object-contain p-1"
                                onError={(e) => { e.target.style.display = 'none' }}
                            />
                        ) : (
                            /* ⬅️ CUSTOM FALLBACK LOGO */
                            <Logo size={24} variant="icon" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-bold uppercase tracking-tight text-white">
                            {brandName}
                        </div>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/60">
                            Digital Queue System
                        </div>
                    </div>
                </Link>

                <div className="max-w-md">
                    <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-lg xl:text-4xl">
                        Register once.
                        <span className="block text-white/75">Join every queue.</span>
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
                        One account for every service at your university — Bursary,
                        Registry, Library, Health Center, and more.
                    </p>
                    <ul className="mt-6 grid gap-2.5">
                        <li className="flex items-center gap-2.5 text-xs text-white/85">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                                <Users className="h-2.5 w-2.5" />
                            </span>
                            Built for both new and returning students
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/85">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                                <Ticket className="h-2.5 w-2.5" />
                            </span>
                            Virtual tickets with live position updates
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/85">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                                <ShieldCheck className="h-2.5 w-2.5" />
                            </span>
                            Verified by your university
                        </li>
                    </ul>
                </div>

                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
                    © {new Date().getFullYear()} UniQueue
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function Register() {
    const navigate = useNavigate()
    const { register, loading } = useAuthStore()
    const { push } = useToastStore()

    const [mode, setMode] = useState('student')

    const [universities, setUniversities] = useState([])
    const [loadingUnis, setLoadingUnis] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [imageError, setImageError] = useState(false)

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

    const setField = (field) => (event) =>
        setForm((prev) => ({ ...prev, [field]: event.target.value }))

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

    useEffect(() => { setImageError(false) }, [form.universityId])

    const fresherEnabled = selectedUni?.fresherRegistrationEnabled !== false

    useEffect(() => {
        if (mode === 'fresher' && selectedUni && !fresherEnabled) setMode('student')
    }, [mode, selectedUni, fresherEnabled])

    const submit = async (event) => {
        event.preventDefault()

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
            accountType: mode === 'fresher' ? 'FRESHER' : 'STUDENT',
        }

        if (mode === 'student') {
            payload.matricNumber = form.matricNumber.trim()
        } else {
            if (selectedUni?.requireJambReg !== false) {
                payload.jambRegNumber = form.jambRegNumber.trim() || null
            }
            if (selectedUni?.requireAdmissionRef) {
                payload.admissionRef = form.admissionRef.trim() || null
            }
            if (selectedUni?.requireApplicationNumber) {
                payload.applicationNumber = form.applicationNumber.trim() || null
            }
        }

        const res = await register(payload)
        if (res.success) {
            const status = res.registrationStatus || res.data?.registrationStatus
            push({
                type: 'success',
                message: status === 'PENDING'
                    ? 'Account created. An admin will verify your details shortly.'
                    : 'Account created. Check your email for the code.',
            })
            navigate('/verify-email', {
                state: {
                    email: form.email.trim(),
                    registrationStatus: status,
                },
            })
        } else {
            push({ type: 'error', message: res.error })
        }
    }

    const inputClass =
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 disabled:opacity-50'

    const labelClass = 'mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300'

    const showJamb = mode === 'fresher' && selectedUni?.requireJambReg !== false

    return (
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <div className="grid h-full grid-cols-1 lg:grid-cols-2">
                <LeftPanel
                    university={selectedUni}
                    imageError={imageError}
                    onImageError={() => setImageError(true)}
                />

                <div className="flex h-full min-h-0 items-center justify-center overflow-hidden bg-white px-6 dark:bg-slate-950">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease }}
                        className="w-full max-w-lg"
                    >
                        <div className="mb-5 flex items-center gap-2.5 lg:hidden">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-xs font-bold text-white">
                                {/* ⬅️ CUSTOM FALLBACK LOGO FOR MOBILE */}
                                <Logo size={20} variant="icon" />
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                                    {selectedUni?.name || 'UniQueue'}
                                </div>
                                <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Digital Queue System
                                </div>
                            </div>
                        </div>

                        <div className="mb-5">
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                Create your account
                            </h1>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {mode === 'fresher'
                                    ? 'For new students registering before receiving their matric number.'
                                    : 'For students with an active matric number.'}
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-3">
                            {/* University | Full name */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                            </div>

                            {/* Email | (Matric or JAMB) */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className={!showJamb && mode === 'fresher' ? 'sm:col-span-2' : ''}>
                                    <label className={labelClass}>
                                        {mode === 'fresher' ? 'Personal email' : 'Email'}
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={setField('email')}
                                        placeholder="you@example.com"
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                {mode === 'student' ? (
                                    <div>
                                        <label className={labelClass}>Matric number</label>
                                        <input
                                            type="text"
                                            value={form.matricNumber}
                                            onChange={setField('matricNumber')}
                                            placeholder={selectedUni?.matricExample || 'Enter your matric number'}
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                ) : showJamb ? (
                                    <div>
                                        <label className={labelClass}>
                                            {selectedUni?.jambRegDescription || 'JAMB registration number'}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.jambRegNumber}
                                            onChange={setField('jambRegNumber')}
                                            placeholder={selectedUni?.jambRegExample || 'Enter JAMB registration number'}
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            {/* Fresher extras */}
                            {mode === 'fresher' && selectedUni &&
                                (selectedUni.requireAdmissionRef || selectedUni.requireApplicationNumber) && (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {selectedUni.requireAdmissionRef && (
                                            <div>
                                                <label className={labelClass}>
                                                    {selectedUni.admissionRefDescription || 'Admission reference'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.admissionRef}
                                                    onChange={setField('admissionRef')}
                                                    placeholder={selectedUni.admissionRefExample || 'Enter admission reference'}
                                                    className={inputClass}
                                                />
                                            </div>
                                        )}
                                        {selectedUni.requireApplicationNumber && (
                                            <div>
                                                <label className={labelClass}>
                                                    {selectedUni.applicationNumberDescription || 'Application number'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.applicationNumber}
                                                    onChange={setField('applicationNumber')}
                                                    placeholder={selectedUni.applicationNumberExample || 'Enter application number'}
                                                    className={inputClass}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                            {/* Department | Phone */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>
                                        Department <span className="text-slate-400">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.department}
                                        onChange={setField('department')}
                                        placeholder="e.g. Computer Science"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        Phone <span className="text-slate-400">(optional)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={setField('phone')}
                                        placeholder="e.g. 08012345678"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Password | Confirm */}
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
                                <div>
                                    <label className={labelClass}>Confirm password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={form.confirmPassword}
                                            onChange={setField('confirmPassword')}
                                            placeholder="Re-enter password"
                                            required
                                            className={`${inputClass} pr-9`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
                                        Create account
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-5 space-y-2 text-center text-xs">
                            <p className="text-slate-500 dark:text-slate-400">
                                Already have an account?{' '}
                                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                                    Sign in
                                </Link>
                            </p>

                            {mode === 'student' && fresherEnabled && (
                                <p className="text-slate-400 dark:text-slate-500">
                                    New student without a matric number?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setMode('fresher')}
                                        className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                    >
                                        Register as fresher
                                        <ArrowRight className="h-3 w-3" />
                                    </button>
                                </p>
                            )}

                            {mode === 'fresher' && (
                                <p className="text-slate-400 dark:text-slate-500">
                                    Already have your matric number?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setMode('student')}
                                        className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                    >
                                        <ArrowLeft className="h-3 w-3" />
                                        Standard registration
                                    </button>
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}