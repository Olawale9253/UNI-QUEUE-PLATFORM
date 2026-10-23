import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Save, Sparkles, CheckCircle2, XCircle, Building2, DollarSign, Layers, ShieldCheck, Mail, Calendar, Workflow, FileText
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem } from '../../lib/motion'

export const PLANS = {
    FREE: { label: 'Free', color: 'slate', maxQueues: 5, maxStaff: 10, maxTicketsPerDay: 200, price: 0 },
    BASIC: { label: 'Basic', color: 'sky', maxQueues: 15, maxStaff: 30, maxTicketsPerDay: 1000, price: 49 },
    PREMIUM: { label: 'Premium', color: 'violet', maxQueues: 50, maxStaff: 100, maxTicketsPerDay: 5000, price: 199 },
    ENTERPRISE: { label: 'Enterprise', color: 'amber', maxQueues: 500, maxStaff: 1000, maxTicketsPerDay: 50000, price: 799 },
}

const FEATURES = [
    { key: 'featureWaitlist', label: 'Waitlist', description: 'Queue overflow handling', icon: Layers },
    { key: 'featureAppointments', label: 'Appointments', description: '1-on-1 and group bookings', icon: Calendar },
    { key: 'featureWorkflows', label: 'Workflows', description: 'Multi-step clearances', icon: Workflow },
    { key: 'featureDocuments', label: 'Documents', description: 'File uploads (proofs, transcripts)', icon: FileText },
]

export default function TiersAndFeatures() {
    const { push } = useToastStore()
    const [universities, setUniversities] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState({})
    const [rate, setRate] = useState(1500)

    const load = useCallback(async () => {
        try {
            const [uniRes, settingsRes] = await Promise.all([
                api.get('/api/super-admin/universities'),
                api.get('/api/super-admin/settings').catch(() => ({ data: { data: { ngnExchangeRate: 1500 } } }))
            ])
            setUniversities(uniRes.data.data || [])
            if (settingsRes.data?.data?.ngnExchangeRate) {
                setRate(settingsRes.data.data.ngnExchangeRate)
            }
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const updateLocal = (id, field, value) => {
        setUniversities((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        )
    }

    const savePlan = async (uni) => {
        setSaving((item) => ({ ...item, [uni.id]: { ...item[uni.id], plan: true } }))
        try {
            const res = await api.put(`/api/super-admin/universities/${uni.id}/plan`, {
                plan: uni.plan,
            })
            setUniversities((prev) =>
                prev.map((itemValue) => (itemValue.id === uni.id ? { ...itemValue, ...res.data.data } : itemValue))
            )
            push({ type: 'success', message: `${uni.name} updated to ${uni.plan}` })
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to update plan' })
            await load()
        } finally {
            setSaving((itemValue) => ({ ...itemValue, [uni.id]: { ...itemValue[uni.id], plan: false } }))
        }
    }

    const saveFeatures = async (uni) => {
        setSaving((item) => ({ ...item, [uni.id]: { ...item[uni.id], features: true } }))
        try {
            await api.put(`/api/super-admin/universities/${uni.id}/features`, {
                featureWaitlist: uni.featureWaitlist,
                featureAppointments: uni.featureAppointments,
                featureWorkflows: uni.featureWorkflows,
                featureDocuments: uni.featureDocuments,
            })
            push({ type: 'success', message: `${uni.name} features updated` })
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to update features' })
            await load()
        } finally {
            setSaving((itemValue) => ({ ...itemValue, [uni.id]: { ...itemValue[uni.id], features: false } }))
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 pb-12">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Tiers & Features
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage subscription plans, service limits, and feature access for each university.
                </p>
            </div>

            {/* Premium Plans Overview Row */}
            <div>
                <div className="mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-brand-600" />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Available Plans</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(PLANS).map(([key, plan]) => {
                        const ngnPrice = plan.price * rate
                        return (
                            <Card key={key} className="relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{plan.label}</span>
                                    <Badge variant={plan.color}>
                                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                                    </Badge>
                                </div>
                                <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    {plan.price === 0 ? 'Free forever' : `₦${ngnPrice.toLocaleString()}/mo`}
                                </div>
                                <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5"><Layers className="h-3 w-3" /> {plan.maxQueues} Services</div>
                                    <div className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> {plan.maxStaff} Staff</div>
                                    <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {plan.maxTicketsPerDay.toLocaleString()} Tickets/day</div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* University Settings */}
            <div>
                <div className="mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">University Configurations</h2>
                </div>

                {universities.length === 0 ? (
                    <EmptyState icon={Building2} title="No universities yet" description="Register a university first to manage tiers and features." />
                ) : (
                    <motion.div variants={stagger(0, 0.05)} initial="initial" animate="animate" className="space-y-6">
                        {universities.map((uni) => {
                            const planMeta = PLANS[uni.plan] || PLANS.FREE
                            const planSaving = saving[uni.id]?.plan
                            const featuresSaving = saving[uni.id]?.features

                            return (
                                <motion.div key={uni.id} variants={staggerItem}>
                                    <Card>
                                        {/* Card Header */}
                                        <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-700">
                                                    {uni.code?.slice(0, 2) || <Building2 className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{uni.name}</span>
                                                        <Badge variant={planMeta.color}>{planMeta.label}</Badge>
                                                        <Badge variant={uni.isActive ? 'success' : 'default'}>{uni.isActive ? 'Active' : 'Inactive'}</Badge>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        Code: {uni.code} · {uni.queueCount || 0} services · {uni.staffCount || 0} staff
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Two Column Layout */}
                                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

                                            {/* Left Column: Plan & Limits */}
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        <Layers className="h-4 w-4 text-brand-600" />
                                                        Billing Plan
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={uni.plan || 'FREE'}
                                                            onChange={(event) => updateLocal(uni.id, 'plan', event.target.value)}
                                                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                        >
                                                            {Object.entries(PLANS).map(([key, parameter]) => (
                                                                <option key={key} value={key}>
                                                                    {parameter.label} {parameter.price > 0 && `— $${parameter.price} / ₦${(parameter.price * rate).toLocaleString()}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <Button size="sm" icon={Save} onClick={() => savePlan(uni)} loading={planSaving} disabled={planSaving}>
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Limits Row */}
                                                <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                                                    <div>
                                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Max Services</div>
                                                        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{uni.maxQueues}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Max Staff</div>
                                                        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{uni.maxStaff}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Max Tickets/Day</div>
                                                        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{(uni.maxTicketsPerDay || 0).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Feature Toggles */}
                                            <div className="space-y-4">
                                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    <Sparkles className="h-4 w-4 text-brand-600" />
                                                    Feature Access
                                                </h4>

                                                <div className="space-y-3">
                                                    {FEATURES.map((item) => {
                                                        const enabled = uni[item.key] !== false
                                                        const Icon = item.icon
                                                        return (
                                                            <div
                                                                key={item.key}
                                                                className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                                                                    enabled
                                                                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                                                                        : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                                                        enabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                                    }`}>
                                                                        <Icon className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className={`text-sm font-semibold ${enabled ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                            {item.label}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
                                                                    </div>
                                                                </div>

                                                                {/* Custom Toggle Switch */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateLocal(uni.id, item.key, !enabled)}
                                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                                                                        enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                                                    }`}
                                                                >
                                                                    <span
                                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                            enabled ? 'translate-x-6' : 'translate-x-1'
                                                                        }`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                <div className="flex justify-end pt-2">
                                                    <Button size="sm" variant="secondary" icon={Save} onClick={() => saveFeatures(uni)} loading={featuresSaving} disabled={featuresSaving}>
                                                        Save Features
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    )
}