import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, CheckCircle2, Loader2, GraduationCap } from 'lucide-react'
import api from '../api/axios'
import { useToastStore } from '../store/toastStore'
import { ease } from '../lib/motion'
import Logo from '../components/ui/Logo'

// ⬅️ NEW BACKGROUND IMAGE: A classic university building
const BG_IMAGE = 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=2000'

export default function PublicRegisterUniversity() {
    const { push } = useToastStore()
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(null)
    const [form, setForm] = useState({
        universityName: '', universityCode: '', emailDomain: '',
        adminFullName: '', adminEmail: '', adminPhone: '', adminRole: '', message: '',
    })

    const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const submit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await api.post('/api/public/university-applications', form)
            setSubmitted(true)
            push({ type: 'success', message: 'Application submitted!' })
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not submit your application.'
            setError(msg)
            push({ type: 'error', message: msg })
        } finally {
            setLoading(false)
        }
    }

    const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
    const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700'

    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-xl">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Application received</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Our team will review your request and send a setup link to <strong>{form.adminEmail}</strong>.
                    </p>
                    <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                        <ArrowLeft className="h-4 w-4" /> Back to home
                    </Link>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen bg-slate-900 flex items-center justify-center py-12 px-6 sm:px-8 lg:px-12">
            {/* Background Image & Overlays */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img src={BG_IMAGE} alt="University Campus Building" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/75 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
            </div>

            {/* ⬅️ REMOVED THE EXTRA LOGO CONTAINER HERE */}
            <div className="relative z-10 w-full max-w-5xl">
                {/* ⬅️ CHANGED items-center TO items-start FOR TOP ALIGNMENT */}
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-start">

                    {/* Left: Pitch */}
                    {/* Added lg:pt-8 so the text aligns perfectly with the inside of the form card */}
                    <div className="text-white lg:pt-8">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/20 px-3 py-1 text-xs font-medium text-brand-200 backdrop-blur-md">
                            <Building2 className="h-3 w-3" /> For universities
                        </span>
                        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                            Bring UniQueue to <br className="hidden sm:block" />
                            <span className="text-brand-400">your campus.</span>
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-slate-300 max-w-lg">
                            Set up a managed queue workspace for your university in under 24 hours. No setup fee, no engineering team required.
                        </p>

                        {/* Features */}
                        <ul className="mt-8 space-y-4">
                            {[
                                { icon: Building2, text: 'Dedicated subdomain and branded dashboard' },
                                { icon: GraduationCap, text: 'Full student, staff, and admin accounts' },
                                { icon: CheckCircle2, text: 'Free tier to start, upgrade anytime' },
                            ].map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <li key={index} className="flex items-center gap-3 text-sm font-medium text-slate-200">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                                            <Icon className="h-4 w-4 text-brand-300" />
                                        </span>
                                        {item.text}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Right: Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
                    >
                        <h2 className="text-xl font-bold text-slate-900">Request a workspace</h2>
                        <p className="mt-1 text-sm text-slate-500">Fill this out and our team will email you a setup link.</p>

                        {error && (
                            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <div>
                                <label className={labelClass}>University name</label>
                                <input type="text" value={form.universityName} onChange={setField('universityName')} placeholder="University of Lagos" required className={inputClass} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Short code</label>
                                    <input type="text" value={form.universityCode} onChange={setField('universityCode')} placeholder="UNILAG" required maxLength={10} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Email domain (optional)</label>
                                    <input type="text" value={form.emailDomain} onChange={setField('emailDomain')} placeholder="@unilag.edu.ng" className={inputClass} />
                                </div>
                            </div>

                            <hr className="my-4 border-slate-200" />

                            <div>
                                <label className={labelClass}>Your full name</label>
                                <input type="text" value={form.adminFullName} onChange={setField('adminFullName')} placeholder="Jane Doe" required className={inputClass} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Your role</label>
                                    <input type="text" value={form.adminRole} onChange={setField('adminRole')} placeholder="ICT Director" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone (optional)</label>
                                    <input type="tel" value={form.adminPhone} onChange={setField('adminPhone')} placeholder="+234 801 234 5678" className={inputClass} />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Your email</label>
                                <input type="email" value={form.adminEmail} onChange={setField('adminEmail')} placeholder="jane@unilag.edu.ng" required className={inputClass} />
                            </div>

                            <div>
                                <label className={labelClass}>Anything we should know? (optional)</label>
                                <textarea value={form.message} onChange={setField('message')} rows={3} placeholder="We have 8,000 students..." className={inputClass} />
                            </div>

                            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                                    </>
                                ) : (
                                    'Submit application'
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}