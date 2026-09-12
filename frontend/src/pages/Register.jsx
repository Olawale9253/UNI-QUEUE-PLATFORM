import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Hash, Building2, ArrowRight } from 'lucide-react'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

export default function Register() {
    const navigate = useNavigate()
    const { register, loading } = useAuthStore()
    const { push } = useToastStore()
    const [universities, setUniversities] = useState([])
    const [selectedUni, setSelectedUni] = useState(null)
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
        const payload = { ...form, universityId: Number(form.universityId) }
        const res = await register(payload)
        if (res.success) {
            push({ type: 'success', message: 'Account created' })
            navigate('/student')
        } else {
            push({ type: 'error', message: res.error })
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="mx-auto max-w-lg px-6">
                <Link to="/" className="mb-8 flex items-center justify-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                        UQ
                    </div>
                    <span className="text-lg font-semibold text-slate-900">UniQueue</span>
                </Link>

                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Create your account
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Join your university's virtual queue network.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8">
                        <Input
                            label="Full name"
                            value={form.fullName}
                            onChange={setField('fullName')}
                            placeholder="John Doe"
                            icon={User}
                            required
                        />

                        <Select
                            label="University"
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
                            value={form.email}
                            onChange={setField('email')}
                            placeholder={selectedUni?.emailDomain ? `you${selectedUni.emailDomain}` : 'you@university.edu.ng'}
                            icon={Mail}
                            required
                        />

                        <Input
                            label="Matric number"
                            value={form.matricNumber}
                            onChange={setField('matricNumber')}
                            placeholder={selectedUni?.matricExample || '21/12345/001'}
                            icon={Hash}
                            required
                        />

                        <Input
                            label="Department"
                            value={form.department}
                            onChange={setField('department')}
                            placeholder="Computer Science"
                            icon={Building2}
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={form.password}
                            onChange={setField('password')}
                            placeholder="At least 8 characters"
                            icon={Lock}
                            required
                            hint="Use at least 8 characters with a mix of letters and numbers."
                        />

                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? 'Creating account…' : 'Create account'}
                            {!loading && <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}