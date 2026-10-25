import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Loader2, Eye, EyeOff,
    ShieldCheck, GraduationCap, Zap, Search, Check, Sparkles, User
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
        <div className="relative hidden h-full min-h-screen flex-col overflow-hidden bg-[#eef2ff] p-10 dark:bg-slate-950 lg:flex">
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
                <div className="absolute inset-0 bg-gradient-to-b from-[#eef2ff] via-[#eef2ff] to-transparent to-[65%] dark:from-slate-950 dark:via-slate-950 dark:to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div>
                    <Link to="/" className="flex w-fit items-center gap-3 transition-opacity hover:opacity-80">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                            {logoUrl ? (
                                <img src={logoUrl} alt={brandName} className="h-full w-full object-contain p-1" onError={(e) => { e.target.style.display = 'none' }} />
                            ) : (
                                <Logo size={24} variant="icon" />
                            )}
                        </div>
                        <div>
                            <div className="text-sm font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                                {brandName}
                            </div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400">
                                Digital Queue System
                            </div>
                        </div>
                    </Link>

                    <div className="mt-14 max-w-md">
                        <h2 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-[#0f172a] dark:text-white">
                            Your University<br />
                            <span className="text-brand-600 dark:text-brand-400">Queue, Made Simple</span>
                        </h2>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            Join the university community and enjoy a faster, easier and more organized queue experience.
                        </p>
                    </div>

                    <ul className="mt-10 space-y-5">
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
                    </ul>
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

    const [uniSearch, setUniSearch] = useState('')
    const [uniDropdownOpen, setUniDropdownOpen] = useState(false)
    const uniRef = useRef(null)

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (uniRef.current && !uniRef.current.contains(event.target)) {
                setUniDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredUniversities = useMemo(() => {
        if (!uniSearch.trim()) return universities
        return universities.filter(u => u.name.toLowerCase().includes(uniSearch.toLowerCase()))
    }, [universities, uniSearch])

    const selectedUni = useMemo(
        () => universities.find((u) => String(u.id) === String(form.universityId)) || null,
        [universities, form.universityId]
    )

    const handleSelectUni = (uni) => {
        setForm((prev) => ({ ...prev, universityId: uni.id }))
        setUniSearch(uni.name)
        setUniDropdownOpen(false)
        setImageError(false)
    }

    const fresherEnabled = selectedUni?.fresherRegistrationEnabled !== false
    useEffect(() => {
        if (mode === 'fresher' && selectedUni && !fresherEnabled) {
            setMode('student')
        }
    }, [mode, selectedUni, fresherEnabled])

    const submit = async (event) => {
        event.preventDefault()

        if (!form.firstName.trim() || !form.middleName.trim() || !form.lastName.trim()) {
            push({ type: 'error', message: 'First name, middle name, and last name are all required.' })
            return
        }
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
            firstName: form.firstName.trim(),
            middleName: form.middleName.trim(),
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
                state: { email: form.email.trim(), registrationStatus: status },
            })
        } else {
            push({ type: 'error', message: res.error })
        }
    }

    const inputClass =
        'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
    const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300'
    const sectionTitleClass = 'flex items-center gap-3 mb-4'

    const showJamb = mode === 'fresher' && selectedUni?.requireJambReg !== false
    const showAdmissionRef = mode === 'fresher' && selectedUni?.requireAdmissionRef
    const showApplicationNo = mode === 'fresher' && selectedUni?.requireApplicationNumber

    return (
        <div className="h-full w-full overflow-y-auto bg-white dark:bg-slate-950 lg:overflow-hidden">
            <div className="flex min-h-full flex-col lg:grid lg:h-full lg:grid-cols-2">
                <LeftPanel university={selectedUni} imageError={imageError} onImageError={() => setImageError(true)} />

                <div className="flex w-full items-start justify-center bg-white px-6 py-10 dark:bg-slate-950 sm:px-12 lg:h-full lg:overflow-y-auto lg:py-12">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="w-full max-w-[600px]">

                        <div className="mb-8 flex w-full items-center justify-between lg:hidden">
                            <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-white">
                                    <Logo size={22} variant="icon" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                                        UniQueue
                                    </div>
                                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400">
                                        Digital Queue System
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="mb-8">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Create your account</h1>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {mode === 'fresher'
                                    ? 'For new students registering before receiving their matric number.'
                                    : 'Fill in the details below to register and get started.'}
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-8">

                            <section>
                                <div className={sectionTitleClass}>
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Personal Information</h2>
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className={labelClass}>First name</label>
                                        <input type="text" autoComplete="given-name" value={form.firstName} onChange={setField('firstName')} placeholder="Enter first name" required className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Middle name</label>
                                        <input type="text" autoComplete="additional-name" value={form.middleName} onChange={setField('middleName')} placeholder="Enter middle name" required className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Last name</label>
                                        <input type="text" autoComplete="family-name" value={form.lastName} onChange={setField('lastName')} placeholder="Enter last name" required className={inputClass} />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className={sectionTitleClass}>
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Details</h2>
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </div>

                                {selectedUni && (
                                    <div className="mb-5">
                                        <label className={labelClass}>I am a...</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setMode('student')}
                                                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all ${
                                                    mode === 'student'
                                                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                <User className="h-4 w-4" />
                                                Continuing Student
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMode('fresher')}
                                                disabled={!fresherEnabled}
                                                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all ${
                                                    mode === 'fresher'
                                                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                <Sparkles className="h-4 w-4" />
                                                New Student (Fresher)
                                            </button>
                                        </div>
                                        {!fresherEnabled && (
                                            <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                                                This university has disabled fresher registration. Please register as a continuing student.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>Email address</label>
                                        <input type="email" autoComplete="email" value={form.email} onChange={setField('email')} placeholder="you@example.com" required className={inputClass} />
                                    </div>

                                    <div className="relative" ref={uniRef}>
                                        <label className={labelClass}>University</label>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search for your university..."
                                                value={uniSearch}
                                                onChange={(e) => {
                                                    setUniSearch(e.target.value)
                                                    setUniDropdownOpen(true)
                                                    if (form.universityId) setForm(prev => ({ ...prev, universityId: '' }))
                                                }}
                                                onFocus={() => setUniDropdownOpen(true)}
                                                required={!form.universityId}
                                                className={`${inputClass} pl-10`}
                                            />
                                        </div>

                                        {uniDropdownOpen && (
                                            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                                                {loadingUnis ? (
                                                    <div className="px-4 py-3 text-sm text-slate-500">Loading universities...</div>
                                                ) : filteredUniversities.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-slate-500">No universities found.</div>
                                                ) : (
                                                    filteredUniversities.map((uni) => (
                                                        <button
                                                            key={uni.id}
                                                            type="button"
                                                            onClick={() => handleSelectUni(uni)}
                                                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                                        >
                                                            <span>{uni.name}</span>
                                                            {form.universityId === uni.id && <Check className="h-4 w-4 text-brand-600" />}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {selectedUni && (
                                        mode === 'student' ? (
                                            <div>
                                                <label className={labelClass}>Matric number</label>
                                                <input type="text" value={form.matricNumber} onChange={setField('matricNumber')} placeholder={selectedUni?.matricExample || 'Enter your matric number'} required className={inputClass} />
                                            </div>
                                        ) : (
                                            <>
                                                {showJamb && (
                                                    <div>
                                                        <label className={labelClass}>{selectedUni?.jambRegDescription || 'JAMB registration number'}</label>
                                                        <input type="text" value={form.jambRegNumber} onChange={setField('jambRegNumber')} placeholder={selectedUni?.jambRegExample || 'Enter JAMB registration number'} required className={inputClass} />
                                                    </div>
                                                )}

                                                {showAdmissionRef && (
                                                    <div>
                                                        <label className={labelClass}>{selectedUni?.admissionRefDescription || 'Admission reference number'}</label>
                                                        <input type="text" value={form.admissionRef} onChange={setField('admissionRef')} placeholder={selectedUni?.admissionRefExample || 'Enter admission reference'} required className={inputClass} />
                                                    </div>
                                                )}

                                                {showApplicationNo && (
                                                    <div>
                                                        <label className={labelClass}>{selectedUni?.applicationNumberDescription || 'Application number'}</label>
                                                        <input type="text" value={form.applicationNumber} onChange={setField('applicationNumber')} placeholder={selectedUni?.applicationNumberExample || 'Enter application number'} required className={inputClass} />
                                                    </div>
                                                )}
                                            </>
                                        )
                                    )}

                                    <div>
                                        <label className={labelClass}>Password</label>
                                        <div className="relative">
                                            <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={setField('password')} placeholder="At least 8 characters" required className={`${inputClass} pr-11`} />
                                            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Confirm password</label>
                                        <div className="relative">
                                            <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={setField('confirmPassword')} placeholder="Re-enter password" required className={`${inputClass} pr-11`} />
                                            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30 disabled:opacity-60">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating account…
                                    </>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </form>

                        <div className="mt-8">
                            <div className="mb-6 flex items-center">
                                <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                                <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Already have an account?
                                </span>
                                <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                            </div>

                            <Link
                                to="/login"
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white py-3.5 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-brand-400 dark:hover:bg-slate-700"
                            >
                                Sign in instead
                            </Link>
                        </div>

                    </motion.div>
                </div>
            </div>
        </div>
    )
}