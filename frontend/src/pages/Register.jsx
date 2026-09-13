import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Mail,
    Lock,
    User,
    Hash,
    Building2,
    ArrowRight,
    CheckCircle2,
    Loader2,
} from 'lucide-react'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
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

export default function Register() {
    const navigate = useNavigate()
    const { register, loading, user } = useAuthStore()
    const { push } = useToastStore()
    const [universities, setUniversities] = useState([])
    const [selectedUni, setSelectedUni] = useState(null)
    const [redirecting, setRedirecting] = useState(false)
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        universityId: '',
        matricNumber: '',
        department: '',
    })

    useEffect(() => {
        api
            .get('/api/auth/universities')
            .then((r) => setUniversities(r.data.data || []))
            .catch(() => {})
    }, [])

    const setField = (f) => (e) => setForm({ ...form, [f]: e.target.value })

    const handleUniChange = (e) => {
        const id = e.target.value
        setForm({ ...form, universityId: id })
        setSelectedUni(universities.find((u) => String(u.id) === String(id)) || null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setRedirecting(true)
        const payload = { ...form, universityId: Number(form.universityId) }
        const res = await register(payload)
        if (res.success) {
            push({ type: 'success', message: 'Account created' })
            navigate('/student')
        } else {
            setRedirecting(false)
            push({ type: 'error', message: res.error })
        }
    }

    const showAlreadySignedInBanner = user && !redirecting

    return (
        <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
            <motion.div
                variants={fadeUp}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.5, ease }}
                className="mx-auto max-w-lg px-4 sm:px-6"
            >
                <Link to="/" className="mb-8 flex items-center justify-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                        UQ
                    </div>
                    <span className="text-lg font-semibold text-slate-900">UniQueue</span>
                </Link>

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
                                <Link
                                    to={dashboards[user.role] || '/'}
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                                >
                                    Go to dashboard
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Create your account
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Join your university's virtual queue network.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8">
                        <Input
                            label="Full name"
                            name="fullName"
                            autoComplete="name"
                            value={form.fullName}
                            onChange={setField('fullName')}
                            placeholder="John Doe"
                            icon={User}
                            required
                            disabled={redirecting}
                        />

                        <Select
                            label="University"
                            name="universityId"
                            value={form.universityId}
                            onChange={handleUniChange}
                            required
                            placeholder="Select your university"
                            options={universities.map((u) => ({
                                value: u.id,
                                label: `${u.name} (${u.code})`,
                            }))}
                            hint={
                                selectedUni
                                    ? `Email must end with ${selectedUni.emailDomain}${
                                        selectedUni.matricDescription
                                            ? ` · Matric format: ${selectedUni.matricDescription}`
                                            : ''
                                    }`
                                    : undefined
                            }
                        />

                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={setField('email')}
                            placeholder={
                                selectedUni?.emailDomain
                                    ? `you${selectedUni.emailDomain}`
                                    : 'you@university.edu.ng'
                            }
                            icon={Mail}
                            required
                            disabled={redirecting}
                        />

                        <Input
                            label="Matric number"
                            name="matricNumber"
                            value={form.matricNumber}
                            onChange={setField('matricNumber')}
                            placeholder={selectedUni?.matricExample || '21/12345/001'}
                            icon={Hash}
                            required
                            disabled={redirecting}
                        />

                        <Input
                            label="Department"
                            name="department"
                            value={form.department}
                            onChange={setField('department')}
                            placeholder="Computer Science"
                            icon={Building2}
                            disabled={redirecting}
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            value={form.password}
                            onChange={setField('password')}
                            placeholder="At least 8 characters"
                            icon={Lock}
                            required
                            hint="Use at least 8 characters with a mix of letters and numbers."
                            disabled={redirecting}
                        />

                        <Button type="submit" fullWidth disabled={loading || redirecting}>
                            {loading || redirecting ? (
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
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}