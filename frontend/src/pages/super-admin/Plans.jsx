import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Save, DollarSign, Layers, Users, Ticket, Info } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useToastStore } from '../../store/toastStore'
import { stagger, staggerItem } from '../../lib/motion'

const DEFAULT_COLORS = {
    FREE: 'slate',
    BASIC: 'sky',
    PREMIUM: 'violet',
    ENTERPRISE: 'amber',
}

export default function Plans() {
    const { push } = useToastStore()
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState({})

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/super-admin/plans')
            setPlans(res.data.data || [])
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load plans' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    const updateLocal = (id, field, value) => {
        setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
    }

    const save = async (plan) => {
        setSaving((s) => ({ ...s, [plan.id]: true }))
        try {
            const res = await api.put(`/api/super-admin/plans/${plan.id}`, {
                label: plan.label,
                priceUsd: Number(plan.priceUsd),
                maxQueues: Number(plan.maxQueues),
                maxStaff: Number(plan.maxStaff),
                maxTicketsPerDay: Number(plan.maxTicketsPerDay),
                isActive: plan.isActive,
            })
            setPlans((prev) => prev.map((p) => (p.id === plan.id ? res.data.data : p)))
            push({ type: 'success', message: `${plan.label} plan updated` })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to save plan' })
            await load()
        } finally {
            setSaving((s) => ({ ...s, [plan.id]: false }))
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        )
    }

    return (
        <>
            <PageHeader
                title="Plans & Pricing"
                description="Set prices and limits for each subscription tier. Changes apply immediately to new assignments."
            />

            <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <div>
                    <p className="font-medium">How pricing works</p>
                    <p className="mt-1 text-xs text-sky-800">
                        Prices are for display only — billing integration comes later. When you change
                        a plan's limits, universities currently on that plan keep their existing
                        limits until you re-save their plan on the Tiers tab. Use the limits below as
                        the source of truth for new plan assignments.
                    </p>
                </div>
            </div>

            {plans.length === 0 ? (
                <EmptyState
                    icon={DollarSign}
                    title="No plans configured"
                    description="Restart the backend to seed the default plans."
                />
            ) : (
                <motion.div
                    variants={stagger(0, 0.05)}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                    {plans.map((plan) => {
                        const color = DEFAULT_COLORS[plan.code] || 'slate'
                        const planSaving = saving[plan.id]

                        return (
                            <motion.div key={plan.id} variants={staggerItem}>
                                <Card>
                                    <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-semibold text-slate-900">
                                                    {plan.label}
                                                </h3>
                                                <Badge variant={color}>{plan.code}</Badge>
                                                {!plan.isActive && <Badge variant="default">Inactive</Badge>}
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Currently at <strong>${plan.priceUsd}</strong>/month
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-slate-900">
                                                ${plan.priceUsd}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-wide text-slate-500">
                                                per month
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Monthly price (USD)
                                        </label>
                                        <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                        $
                      </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={plan.priceUsd}
                                                onChange={(e) => updateLocal(plan.id, 'priceUsd', e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Limits */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                                <Layers className="h-3.5 w-3.5 text-slate-400" />
                                                Max queues
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={plan.maxQueues}
                                                onChange={(e) => updateLocal(plan.id, 'maxQueues', e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                                Max staff members
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={plan.maxStaff}
                                                onChange={(e) => updateLocal(plan.id, 'maxStaff', e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                                <Ticket className="h-3.5 w-3.5 text-slate-400" />
                                                Max tickets per day
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={plan.maxTicketsPerDay}
                                                onChange={(e) => updateLocal(plan.id, 'maxTicketsPerDay', e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 pt-1 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={plan.isActive}
                                                onChange={(e) => updateLocal(plan.id, 'isActive', e.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            Available for new assignments
                                        </label>
                                    </div>

                                    <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                                        <Button
                                            size="sm"
                                            icon={Save}
                                            onClick={() => save(plan)}
                                            loading={planSaving}
                                            disabled={planSaving}
                                        >
                                            {planSaving ? 'Saving…' : 'Save plan'}
                                        </Button>
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