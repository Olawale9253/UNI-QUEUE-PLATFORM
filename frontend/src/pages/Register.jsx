import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Mail, Lock, User as UserIcon, GraduationCap, Building2,
    Phone, Briefcase, ArrowRight, Loader2, AlertCircle,
    BookOpen, FileText, Hash, Sparkles,
} from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
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

    // ── Load university list ──
    useEffect(() => {
        let cancelled = false
        api.get('/api/auth/universities')
            .then((res) => {
                if (!cancelled) setUniversities(res.data?.data || [])
            })
            .catch(() => {
                if (!cancelled) push({ type: 'error', message: 'Could not load universities' })
            })
            .finally(() => {
                if (!cancelled) setLoadingUnis(false)
            })
        return () => { cancelled = true }
    }, [push])

    const selectedUni = useMemo(
        () => universities.find((u) => String(u.id) === String(form.universityId)) || null,
        [universities, form.universityId]
    )

    const fresherEnabled = selectedUni?.fresherRegistrationEnabled !== false

    // Auto-switch away from fresher tab if disabled
    useEffect(() => {
        if (accountType === 'FRESHER' && selectedUni && !fresherEnabled) {
            setAccountType('STUDENT')
        }
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
            // Only send identifiers that are required by this university
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
            push({
                type: 'success',
                message: accountType === 'FRESHER'
                    ? 'Registered as fresher. Check your email for the code.'
                    : 'Account created. Check your email for the code.',
            })
            navigate('/verify-email', { state: { email: form.email.trim(), devCode: res.devVerificationCode } })
        } else {
            push({ type: 'error', message: res.error })
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
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
                        {[
                            'Verified students get instant queue access',
                            'Freshers get a personal dashboard from day one',
                            'No more standing in line for hours',
                        ].map((item) => (
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

                <div className="text-xs text-slate-400">
                    © {new Date().getFullYear()} UniQueue. All rights reserved.
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="w-full max-w-md"
                >
                    {/* Mobile brand */}
                    <div className="mb-6 lg:hidden">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">UQ</div>
                            <span className="text-base font-semibold text-slate-900">UniQueue</span>
                        </Link>
                    </div>

                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Create your account
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Already registered?{' '}
                        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                            Sign in
                        </Link>
                    </p>

                    {/* Account type tabs */}
                    <div className="mt-6 flex rounded-lg bg-slate-100 p-0.5">
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
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : disabled
                                                ? 'cursor-not-allowed text-slate-300'
                                                : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {t.label}
                                </button>
                            )
                        })}
                    </div>

                    {accountType === 'FRESHER' && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                            <span>
                Register with your <strong>personal email</strong>. Use the JAMB / admission
                reference on your admission letter. You'll get your matric later.
              </span>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-6 space-y-3">
                        {/* University */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                University
                            </label>
                            <div className="relative">
                                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={form.universityId}
                                    onChange={setField('universityId')}
                                    required
                                    disabled={loadingUnis}
                                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                                >
                                    <option value="">
                                        {loadingUnis ? 'Loading…' : 'Select your university'}
                                    </option>
                                    {universities.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Full name */}
                        <Input
                            label="Full name"
                            value={form.fullName}
                            onChange={setField('fullName')}
                            placeholder={accountType === 'FRESHER' ? 'As on your admission letter' : 'Your full name'}
                            icon={UserIcon}
                            required
                        />

                        {/* Email */}
                        <Input
                            label={accountType === 'FRESHER' ? 'Personal email' : 'Email'}
                            type="email"
                            value={form.email}
                            onChange={setField('email')}
                            placeholder={
                                accountType === 'FRESHER'
                                    ? 'you@gmail.com'
                                    : selectedUni?.emailDomain
                                        ? `you${selectedUni.emailDomain}`
                                        : 'you@university.edu.ng'
                            }
                            icon={Mail}
                            required
                        />

                        {/* Continuing student fields */}
                        {accountType === 'STUDENT' && (
                            <Input
                                label="Matric number"
                                value={form.matricNumber}
                                onChange={setField('matricNumber')}
                                placeholder={selectedUni?.matricExample || '21/12345/001'}
                                hint={selectedUni?.matricDescription}
                                icon={Hash}
                                required
                            />
                        )}

                        {/* Fresher identifier fields */}
                        {accountType === 'FRESHER' && selectedUni && (
                            <>
                                {selectedUni.requireJambReg !== false && (
                                    <Input
                                        label="JAMB registration number"
                                        value={form.jambRegNumber}
                                        onChange={setField('jambRegNumber')}
                                        placeholder={selectedUni.jambRegExample || 'e.g. 202512345678'}
                                        hint={selectedUni.jambRegDescription}
                                        icon={FileText}
                                        required
                                    />
                                )}
                                {selectedUni.requireAdmissionRef && (
                                    <Input
                                        label="Admission reference"
                                        value={form.admissionRef}
                                        onChange={setField('admissionRef')}
                                        placeholder={selectedUni.admissionRefExample || 'e.g. ADM/2025/00123'}
                                        hint={selectedUni.admissionRefDescription}
                                        icon={FileText}
                                    />
                                )}
                                {selectedUni.requireApplicationNumber && (
                                    <Input
                                        label="Application number"
                                        value={form.applicationNumber}
                                        onChange={setField('applicationNumber')}
                                        placeholder={selectedUni.applicationNumberExample || 'e.g. APP-2025-00123'}
                                        hint={selectedUni.applicationNumberDescription}
                                        icon={FileText}
                                    />
                                )}
                            </>
                        )}

                        {/* Optional shared fields */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Input
                                label="Department (optional)"
                                value={form.department}
                                onChange={setField('department')}
                                placeholder="Computer Science"
                                icon={Briefcase}
                            />
                            <Input
                                label="Phone (optional)"
                                type="tel"
                                value={form.phone}
                                onChange={setField('phone')}
                                placeholder="+234 801 234 5678"
                                icon={Phone}
                            />
                        </div>

                        {/* Passwords */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Input
                                label="Password"
                                type="password"
                                value={form.password}
                                onChange={setField('password')}
                                placeholder="At least 8 characters"
                                icon={Lock}
                                required
                            />
                            <Input
                                label="Confirm password"
                                type="password"
                                value={form.confirmPassword}
                                onChange={setField('confirmPassword')}
                                placeholder="Re-enter password"
                                icon={Lock}
                                required
                            />
                        </div>

                        <Button type="submit" fullWidth disabled={loading} className="!mt-5">
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
                        </Button>
                    </form>

                    {accountType === 'FRESHER' && (
                        <p className="mt-4 text-center text-xs text-slate-500">
                            After you receive your matric, you'll be able to upgrade to full
                            student access from your profile.
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    )
}