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
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1600'

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
        <div className="relative hidden h-full min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-[#e8eeff] via-[#f4f6fc] to-[#d9e4ff] p-10 lg:flex">

            {/* Background Image - Bottom Half */}
            <div className="absolute inset-x-0 bottom-0 z-0 h-[65%]">
                <motion.img
                    key={backgroundSrc}
                    src={backgroundSrc}
                    alt=""
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, ease }}
                    onError={onImageError}
                    className="h-full w-full object-cover object-top"
                    draggable={false}
                />
                {/* Smooth gradient overlay to blend the image into the background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#eef2ff] via-[#eef2ff]/80 to-transparent to-[45%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/70 via-transparent to-transparent" />
            </div>

            {/* Top: Logo */}
            <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
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
                <div>
                    <div className="text-sm font-extrabold uppercase tracking-tight text-slate-900">
                        {brandName}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                        Digital Queue System
                    </div>
                </div>
            </div>

            {/* Middle: Features */}
            <div className="relative z-10 max-w-md pt-4">
                <h2 className="text-[38px] font-extrabold leading-[1.1] tracking-tight text-[#0f172a]">
                    Your University<br />
                    <span className="text-brand-600">Queue, Made Simple</span>
                </h2>
                <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-700">
                    Join the university community and enjoy a faster, easier and more organized queue experience.
                </p>
                <ul className="mt-8 space-y-4">
                    <li className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-brand-600 shadow-sm ring-1 ring-white/50 backdrop-blur-sm">
                            <Zap className="h-5 w-5" />
                        </span>
                        <div>
                            <strong className="block text-sm font-bold text-slate-900">Quick Access</strong>
                            <span className="text-sm text-slate-600">Skip long lines and save time</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-brand-600 shadow-sm ring-1 ring-white/50 backdrop-blur-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <strong className="block text-sm font-bold text-slate-900">Secure & Reliable</strong>
                            <span className="text-sm text-slate-600">Your data is always protected</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-brand-600 shadow-sm ring-1 ring-white/50 backdrop-blur-sm">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <strong className="block text-sm font-bold text-slate-900">Built for Students</strong>
                            <span className="text-sm text-slate-600">Designed for a better university experience</span>
                        </div>
                    </li>
                </ul>
            </div>

            {/* Bottom: Footer */}
            <div className="relative z-10 pt-10">
                <div className="flex items-center gap-2 text-xs font-medium text-white">
                    <MapPin className="h-4 w-4" />
                    {brandName} · Digital Queue System
                </div>
                <div className="mt-1 text-[11px] text-white/60">
                    © {new Date().getFullYear()} All rights reserved.
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
            department: null,
            phone: null,
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
        'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
    const labelClass = 'mb-1.5 block text-[11px] font-semibold text-slate-700 uppercase tracking-wide'
    const sectionTitleClass = 'flex items-center gap-3 mb-4'

    const showJamb = mode === 'fresher' && selectedUni?.requireJambReg !== false

    return (
        <div className="min-h-screen bg-white lg:h-screen lg:overflow-hidden">
            {/* Using h-screen and overflow-hidden on the wrapper stops the weird inner scrolling */}
            <div className="grid min-h-screen grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-[45%_55%]">

                <LeftPanel
                    university={selectedUni}
                    imageError={imageError}
                    onImageError={() => setImageError(true)}
                />

                <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-white px-6 py-8 sm:px-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease }}
                        className="w-full max-w-[560px] py-4"
                    >
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 lg:hidden">
                                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-white">
                                    <Logo size={20} variant="icon" />
                                </div>
                                <div className="text-sm font-bold uppercase tracking-tight text-slate-900">
                                    {selectedUni?.name || 'UniQueue'}
                                </div>
                            </div>
                            <p className="ml-auto text-[13px] text-slate-500">
                                Already have an account?{' '}
                                <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                                    Sign in <ArrowRight className="inline h-3 w-3" />
                                </Link>
                            </p>
                        </div>

                        {/* Title */}
                        <div className="mb-8">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">
                                Create your account
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                {mode === 'fresher'
                                    ? 'For new students registering before receiving their matric number.'
                                    : 'Fill in the details below to register and get started.'}
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">

                            {/* Section 1: Personal Information */}
                            <section>
                                <div className={sectionTitleClass}>
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                                        1
                                    </span>
                                    <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div>
                                        <label className={labelClass}>First name</label>
                                        <input
                                            type="text"
                                            autoComplete="given-name"
                                            value={form.firstName}
                                            onChange={setField('firstName')}
                                            placeholder="Enter first name"
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Middle name <span className="font-normal text-slate-400 normal-case">(optional)</span></label>
                                        <input
                                            type="text"
                                            autoComplete="additional-name"
                                            value={form.middleName}
                                            onChange={setField('middleName')}
                                            placeholder="Enter middle name"
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
                                            placeholder="Enter last name"
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Account Details */}
                            <section>
                                <div className={sectionTitleClass}>
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                                        2
                                    </span>
                                    <h2 className="text-sm font-bold text-slate-900">Account Details</h2>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>
                                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
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
                                                placeholder={selectedUni?.jambRegExample || 'Enter JAMB reg number'}
                                                required
                                                className={inputClass}
                                            />
                                        </div>
                                    ) : <div className="hidden sm:block"></div>}

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
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600"
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
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600"
                                            >
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {mode === 'fresher' && selectedUni?.requireAdmissionRef && (
                                        <div>
                                            <label className={labelClass}>{selectedUni.admissionRefDescription || 'Admission reference'}</label>
                                            <input type="text" value={form.admissionRef} onChange={setField('admissionRef')} placeholder="Enter reference" className={inputClass} />
                                        </div>
                                    )}
                                    {mode === 'fresher' && selectedUni?.requireApplicationNumber && (
                                        <div>
                                            <label className={labelClass}>{selectedUni.applicationNumberDescription || 'Application number'}</label>
                                            <input type="text" value={form.applicationNumber} onChange={setField('applicationNumber')} placeholder="Enter app number" className={inputClass} />
                                        </div>
                                    )}

                                </div>
                            </section>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating account…
                                    </>
                                ) : (
                                    <>
                                        Create account
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer / Mode Toggle */}
                        <div className="mt-6">
                            <div className="mb-4 flex items-center">
                                <div className="flex-1 border-t border-slate-200" />
                                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Or</span>
                                <div className="flex-1 border-t border-slate-200" />
                            </div>

                            {mode === 'student' && fresherEnabled && (
                                <button
                                    type="button"
                                    onClick={() => setMode('fresher')}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white py-3 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                                >
                                    Register as a Fresher
                                    <ArrowRight className="h-4 w-4 text-brand-400" />
                                </button>
                            )}

                            {mode === 'fresher' && (
                                <button
                                    type="button"
                                    onClick={() => setMode('student')}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white py-3 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                                >
                                    <ArrowLeft className="h-4 w-4 text-brand-400" />
                                    Back to Student Registration
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}