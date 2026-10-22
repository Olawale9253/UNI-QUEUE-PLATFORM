import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Save, Sparkles, CheckCircle2, XCircle, Building2, DollarSign, Layers,
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
    { key: 'featureWaitlist', label: 'Waitlist', description: 'Queue overflow handling' },
    { key: 'featureAppointments', label: 'Appointments', description: '1-on-1 and group bookings' },
    { key: 'featureWorkflows', label: 'Workflows', description: 'Multi-step clearances' },
    { key: 'featureDocuments', label: 'Documents', description: 'File uploads (proofs, transcripts)' },
]

export default function TiersAndFeatures() {
    const { push } = useToastStore()
    const [universities, setUniversities] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState({})
    const [rate, setRate] = useState(1500) // ⬅️ NEW

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
            push({ type: 'success', message: `${uni.name} → ${uni.plan}` })
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
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        )
    }

    return (
        <>
            <Card className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-brand-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Available plans</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Object.entries(PLANS).map(([key, plan]) => {
                        const ngnPrice = plan.price * rate
                        return (
                            <div key={key} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-900">{plan.label}</span>
                                    <Badge variant={plan.color}>
                                        {plan.price === 0 ? 'Free' : `$${plan.price} / ₦${ngnPrice.toLocaleString()}`}
                                    </Badge>
                                </div>
                                <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                                    <div>{plan.maxQueues} queues</div>
                                    <div>{plan.maxStaff} staff</div>
                                    <div>{plan.maxTicketsPerDay.toLocaleString()} tickets/day</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            {universities.length === 0 ? (
                <EmptyState icon={Building2} title="No universities yet" description="Register a university first to manage tiers and features." />
            ) : (
                <motion.div variants={stagger(0, 0.05)} initial="initial" animate="animate" className="space-y-4">
                    {universities.map((uni) => {
                        const planMeta = PLANS[uni.plan] || PLANS.FREE
                        const planSaving = saving[uni.id]?.plan
                        const featuresSaving = saving[uni.id]?.features
                        const ngnPrice = planMeta.price * rate

                        return (
                            <motion.div key={uni.id} variants={staggerItem}>
                                <Card>
                                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                                                {uni.code?.slice(0, 2)}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-base font-semibold text-slate-900">{uni.name}</span>
                                                    <Badge variant={planMeta.color}>{planMeta.label}</Badge>
                                                    <Badge variant={uni.isActive ? 'success' : 'default'}>{uni.isActive ? 'Active' : 'Inactive'}</Badge>
                                                </div>
                                                <div className="mt-0.5 text-xs text-slate-500">
                                                    Code: {uni.code} · {uni.queueCount || 0} queues · {uni.staffCount || 0} staff
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                        <div>
                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                <Layers className="h-4 w-4 text-brand-600" />
                                                Billing plan
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={uni.plan || 'FREE'}
                                                    onChange={(event) => updateLocal(uni.id, 'plan', event.target.value)}
                                                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
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
                                            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                                                <div><div className="text-slate-500">Max queues</div><div className="mt-0.5 text-sm font-semibold text-slate-900">{uni.maxQueues}</div></div>
                                                <div><div className="text-slate-500">Max staff</div><div className="mt-0.5 text-sm font-semibold text-slate-900">{uni.maxStaff}</div></div>
                                                <div><div className="text-slate-500">Max tickets/day</div><div className="mt-0.5 text-sm font-semibold text-slate-900">{(uni.maxTicketsPerDay || 0).toLocaleString()}</div></div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                <Sparkles className="h-4 w-4 text-brand-600" />
                                                Feature access
                                            </h4>
                                            <div className="space-y-2">
                                                {FEATURES.map((item) => {
                                                    const enabled = uni[item.key] !== false
                                                    return (
                                                        <button
                                                            key={item.key}
                                                            type="button"
                                                            onClick={() => updateLocal(uni.id, item.key, !enabled)}
                                                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${enabled ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    {enabled ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="h-4 w-4 shrink-0 text-slate-400" />}
                                                                    <span className={`text-sm font-medium ${enabled ? 'text-emerald-900' : 'text-slate-600'}`}>{item.label}</span>
                                                                </div>
                                                                <div className={`ml-6 text-xs ${enabled ? 'text-emerald-700' : 'text-slate-500'}`}>{item.description}</div>
                                                            </div>
                                                            <div className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                                                                <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)', left: '2px' }} />
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <Button size="sm" variant="secondary" icon={Save} onClick={() => saveFeatures(uni)} loading={featuresSaving} disabled={featuresSaving}>
                                                    Save features
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
        </>
    )
}