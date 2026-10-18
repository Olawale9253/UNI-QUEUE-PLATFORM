import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, CheckCircle2, Loader2, GraduationCap } from 'lucide-react'
import api from '../api/axios'
import { useToastStore } from '../store/toastStore'
import { ease } from '../lib/motion'
import Logo from '../components/ui/Logo'

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

    const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500'
    const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'

    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Application received</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:px-12">
                <Link to="/" className="mb-8 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                        <Logo size={22} variant="icon" />
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">UniQueue</span>
                </Link>

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
                    <div className="max-w-md">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
                            <Building2 className="h-3 w-3" /> For universities
                        </span>
                        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                            Bring UniQueue to your campus.
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                            Set up a managed queue workspace for your university in under 24 hours. No setup fee, no engineering team required.
                        </p>
                        <ul className="mt-8 space-y-4">
                            {[
                                { icon: Building2, text: 'Dedicated subdomain and branded dashboard' },
                                { icon: GraduationCap, text: 'Full student, staff, and admin accounts' },
                                { icon: CheckCircle2, text: 'Free tier to start — upgrade anytime' },
                            ].map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">
                                            <Icon className="h-3.5 w-3.5" />
                                        </span>
                                        {item.text}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Request a workspace</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fill this out and our team will email you a setup link.</p>

                        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

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
                            <hr className="my-4 border-slate-100 dark:border-slate-800" />
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