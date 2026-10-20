import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowRight, ArrowLeft, Loader2, Eye, EyeOff,
    ShieldCheck, Users, GraduationCap, Zap, MapPin,
} from 'lucide-react'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { ease } from '../lib/motion'
import Logo from '../components/ui/Logo'

const REGISTER_BACKGROUND =
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1600'

function resolveImageUrl(url) {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
    const base = import.meta.env.VITE_API_URL || ''
    return base ? `${base}${url}` : url
}

function LeftPanel({ university, imageError, onImageError }) {
    const backgroundSrc =
        university?.campusImageUrl && !imageError
            ? resolveImageUrl(university.campusImageUrl)
            : REGISTER_BACKGROUND

    const logoUrl = university?.logoUrl ? resolveImageUrl(university.logoUrl) : null
    const brandName = university?.name || 'UniQueue'

    return (
        <div className="relative hidden h-full min-h-0 overflow-hidden bg-blue-200 lg:block">
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
                        'linear-gradient(180deg, rgba(232, 239, 255, 0.95) 0%, rgba(211, 225, 255, 0.76) 38%, rgba(85, 119, 196, 0.42) 66%, rgba(20, 34, 79, 0.94) 100%)',
                }}
                aria-hidden
            />
            <div
                className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
                aria-hidden
            />

            <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-10">
                <Link to="/" className="flex items-center gap-3 text-slate-900">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/70">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={brandName}
                                className="h-full w-full object-contain p-1"
                                onError={(e) => { e.target.style.display = 'none' }}
                            />
                        ) : (
                            <Logo size={24} variant="icon" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold uppercase tracking-tight text-slate-900">
                            {brandName}
                        </div>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                            Digital Queue System
                        </div>
                    </div>
                </Link>

                <div className="max-w-md pb-8">
                    <h2 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-[#14254c] xl:text-4xl">
                        Your University
                        <span className="block text-brand-700">Queue, Made Simple</span>
                    </h2>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-700">
                        Join the university community and enjoy a faster, easier and more organized queue experience.
                    </p>
                    <ul className="mt-7 grid gap-3.5">
                        <li className="flex items-center gap-3 text-xs text-slate-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/75 text-brand-600 shadow-sm ring-1 ring-white/80">
                                <Zap className="h-4 w-4" />
                            </span>
                            <span><strong className="block text-sm font-semibold">Quick Access</strong><span className="text-slate-600">Skip long lines and save time</span></span>
                        </li>
                        <li className="flex items-center gap-3 text-xs text-slate-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/75 text-brand-600 shadow-sm ring-1 ring-white/80">
                                <ShieldCheck className="h-4 w-4" />
                            </span>
                            <span><strong className="block text-sm font-semibold">Secure &amp; Reliable</strong><span className="text-slate-600">Your data is always protected</span></span>
                        </li>
                        <li className="flex items-center gap-3 text-xs text-slate-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/75 text-brand-600 shadow-sm ring-1 ring-white/80">
                                <Users className="h-4 w-4" />
                            </span>
                            <span><strong className="block text-sm font-semibold">Built for Students</strong><span className="text-slate-600">Designed for a better university experience</span></span>
                        </li>
                    </ul>
                </div>

                <div className="text-[10px] text-white/80">
                    <div className="flex items-center gap-2 font-medium"><MapPin className="h-3.5 w-3.5" />{brandName} · Digital Queue System</div>
                    <div className="mt-2 text-white/55">© {new Date().getFullYear()} All rights reserved.</div>
                </div>
            </div>
        </div>
    )
}

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

    // ⬅️ REMOVED Department and Phone from the state
    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        middleName: '',
        lastName: '',
        universityId: '',
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
        if (!form.firstName.trim() || !form.lastName.trim()) {
            push({ type: 'error', message: 'First name and last name are required' })
            return
        }

        const payload = {
            email: form.email.trim(),
            password: form.password,
            firstName: form.firstName.trim(),
            middleName: form.middleName.trim() || null,
            lastName: form.lastName.trim(),
            universityId: Number(form.universityId),
            department: null, // ⬅️ Send null since we removed the field
            phone: null,      // ⬅️ Send null since we removed the field
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
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50'

    const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700'

    const showJamb = mode === 'fresher' && selectedUni?.requireJambReg !== false

    return (
        <div className="registration-page min-h-screen bg-white lg:h-screen lg:overflow-hidden">
            <div className="grid min-h-screen grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-[36.7fr_63.3fr]">
                <LeftPanel
                    university={selectedUni}
                    imageError={imageError}
                    onImageError={() => setImageError(true)}
                />

                <div className="flex min-h-0 items-start justify-center overflow-y-auto bg-white px-6 py-7 sm:px-10 lg:h-full lg:py-8 xl:px-[5.4vw]">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease }}
                        className="w-full max-w-[760px]"
                    >
                        <div className="mb-7 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 lg:hidden">
                                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-xs font-bold text-white">
                                <Logo size={20} variant="icon" />
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-bold uppercase tracking-tight text-slate-900">
                                        {selectedUni?.name || 'UniQueue'}
                                    </div>
                                    <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Digital Queue System
                                    </div>
                                </div>
                            </div>
                            <p className="ml-auto whitespace-nowrap text-xs text-slate-600">
                                <span className="hidden sm:inline">Already have an account? </span>
                                <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in <ArrowRight className="inline h-3 w-3" /></Link>
                            </p>
                        </div>

                        <div className="mb-7 flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-[#14254c] sm:text-[28px]">
                                Create your account
                            </h1>
                            <p className="mt-1.5 text-sm text-slate-500">
                                {mode === 'fresher'
                                    ? 'For new students registering before receiving their matric number.'
                                    : 'For students with an active matric number.'}
                            </p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <section>
                            <div className="mb-3 flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-sm">1</span>
                                <h2 className="shrink-0 text-sm font-bold text-[#14254c]">Personal Information</h2>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div>
                                    <label className={labelClass}>First name</label>
                                    <input
                                        type="text"
                                        autoComplete="given-name"
                                        value={form.firstName}
                                        onChange={setField('firstName')}
                                        placeholder="First name"
                                        required
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Middle name <span className="font-normal text-slate-400">(optional)</span></label>
                                    <input
                                        type="text"
                                        autoComplete="additional-name"
                                        value={form.middleName}
                                        onChange={setField('middleName')}
                                        placeholder="Middle name"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Last name</label>
                                    <input
                                        type="text"
                                        autoComplete="family-name"
                                        value={form.lastName}
                                        onChange={setField('lastName')}
                                        placeholder="Last name"
                                        required
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            </section>

                            <section>
                            <div className="mb-3 flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-sm">2</span>
                                <h2 className="shrink-0 text-sm font-bold text-[#14254c]">Account Details</h2>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>
                            <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Email address</label>
                                    <input type="email" autoComplete="email" value={form.email} onChange={setField('email')} placeholder="you@example.com" required className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>University</label>
                                    <select value={form.universityId} onChange={setField('universityId')} required disabled={loadingUnis} className={`${inputClass} appearance-none`}>
                                        <option value="">{loadingUnis ? 'Loading…' : 'Select your university'}</option>
                                        {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
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

                                {mode === 'fresher' && selectedUni?.requireAdmissionRef && (
                                    <div>
                                        <label className={labelClass}>{selectedUni.admissionRefDescription || 'Admission reference'}</label>
                                        <input type="text" value={form.admissionRef} onChange={setField('admissionRef')} placeholder={selectedUni.admissionRefExample || 'Enter admission reference'} className={inputClass} />
                                    </div>
                                )}
                                {mode === 'fresher' && selectedUni?.requireApplicationNumber && (
                                    <div>
                                        <label className={labelClass}>{selectedUni.applicationNumberDescription || 'Application number'}</label>
                                        <input type="text" value={form.applicationNumber} onChange={setField('applicationNumber')} placeholder={selectedUni.applicationNumberExample || 'Enter application number'} className={inputClass} />
                                    </div>
                                )}

                            {/* Password | Confirm */}
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
                            </section>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
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

                        <div className="mt-5">
                            <div className="my-4 flex items-center">
                                <div className="flex-1 border-t border-slate-200" />
                                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Or</span>
                                <div className="flex-1 border-t border-slate-200" />
                            </div>

                            {mode === 'student' && fresherEnabled && (
                                <button
                                    type="button"
                                    onClick={() => setMode('fresher')}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white py-3 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
                                >
                                    <GraduationCap className="h-4 w-4 text-slate-400" />
                                    Register as a Fresher
                                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                                </button>
                            )}

                            {mode === 'fresher' && (
                                <button
                                    type="button"
                                    onClick={() => setMode('student')}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white py-3 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
                                >
                                    <ArrowLeft className="h-4 w-4 text-slate-400" />
                                    Back To Student Registration
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}