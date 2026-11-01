import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Save, DollarSign, Layers, Users, Ticket, Info } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
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
    const [rate, setRate] = useState(1500)

    const load = useCallback(async () => {
        try {
            const [plansRes, settingsRes] = await Promise.all([
                api.get('/api/super-admin/plans'),
                api.get('/api/super-admin/settings').catch(() => ({ data: { data: { ngnExchangeRate: 1500 } } }))
            ])
            setPlans(plansRes.data.data || [])
            if (settingsRes.data?.data?.ngnExchangeRate) {
                setRate(settingsRes.data.data.ngnExchangeRate)
            }
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load plans' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const updateLocal = (id, field, value) => {
        setPlans((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
    }

    const save = async (plan) => {
        setSaving((item) => ({ ...item, [plan.id]: true }))
        try {
            const res = await api.put(`/api/super-admin/plans/${plan.id}`, {
                label: plan.label,
                priceUsd: Number(plan.priceUsd),
                maxQueues: Number(plan.maxQueues),
                maxStaff: Number(plan.maxStaff),
                maxTicketsPerDay: Number(plan.maxTicketsPerDay),
                isActive: plan.isActive,
            })
            setPlans((prev) => prev.map((itemValue) => (itemValue.id === plan.id ? res.data.data : itemValue)))
            push({ type: 'success', message: `${plan.label} plan updated` })
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to save plan' })
            await load()
        } finally {
            setSaving((itemValue) => ({ ...itemValue, [plan.id]: false }))
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 pb-12 px-4 sm:px-6">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        )
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-12 px-4 sm:px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Subscription Plans
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Configure pricing, service limits, and availability for each tier.
                </p>
            </div>

            <div className="flex items-start gap-2 sm:gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 sm:p-4 text-xs sm:text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <div>
                    <p className="font-semibold">How pricing works</p>
                    <p className="mt-0.5 text-[10px] sm:text-xs text-sky-800 dark:text-sky-300">
                        Prices are for display only. Naira equivalents are calculated using the Exchange Rate in Platform Settings (currently 1 USD = ₦{Number(rate).toLocaleString()}).
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
                    className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2"
                >
                    {plans.map((plan) => {
                        const color = DEFAULT_COLORS[plan.code] || 'slate'
                        const planSaving = saving[plan.id]
                        const ngnPrice = plan.priceUsd * rate

                        return (
                            <motion.div key={plan.id} variants={staggerItem}>
                                <Card className="h-full flex flex-col p-4 sm:p-6">
                                    <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4 sm:pb-5 dark:border-slate-800">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                                                    {plan.label}
                                                </h3>
                                                <Badge variant={color} className="text-[10px] sm:text-xs">{plan.code}</Badge>
                                                {!plan.isActive && <Badge variant="default" className="text-[10px] sm:text-xs">Inactive</Badge>}
                                            </div>
                                            <p className="mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                                Currently at <strong>${plan.priceUsd}</strong> / <strong>₦{ngnPrice.toLocaleString()}</strong> /month
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right mt-2 sm:mt-0">
                                            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                                                ${plan.priceUsd}
                                            </div>
                                            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                ₦{ngnPrice.toLocaleString()} / month
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 sm:space-y-5">
                                        <div>
                                            <label className="mb-1.5 block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Monthly price (USD)
                                            </label>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-xs sm:text-sm font-medium text-slate-400">
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={plan.priceUsd}
                                                    onChange={(event) => updateLocal(plan.id, 'priceUsd', event.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 sm:py-2.5 pl-7 sm:pl-8 pr-3 text-xs sm:text-sm font-medium text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            <div>
                                                <label className="mb-1.5 flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Layers className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Services
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={plan.maxQueues}
                                                    onChange={(event) => updateLocal(plan.id, 'maxQueues', event.target.value)}
                                                    className="w-full rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Staff
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={plan.maxStaff}
                                                    onChange={(event) => updateLocal(plan.id, 'maxStaff', event.target.value)}
                                                    className="w-full rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    <Ticket className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Tickets
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={plan.maxTicketsPerDay}
                                                    onChange={(event) => updateLocal(plan.id, 'maxTicketsPerDay', event.target.value)}
                                                    className="w-full rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                />
                                            </div>
                                        </div>

                                        <label className="flex cursor-pointer items-start gap-2 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={plan.isActive}
                                                onChange={(event) => updateLocal(plan.id, 'isActive', event.target.checked)}
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            <span>Available for new university assignments</span>
                                        </label>
                                    </div>

                                    <div className="mt-5 sm:mt-6 flex justify-end border-t border-slate-100 pt-4 sm:pt-5 dark:border-slate-800">
                                        <Button
                                            icon={Save}
                                            onClick={() => save(plan)}
                                            loading={planSaving}
                                            disabled={planSaving}
                                            className="w-full sm:w-auto justify-center text-xs sm:text-sm"
                                        >
                                            {planSaving ? 'Saving…' : 'Save Plan Configuration'}
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}
        </div>
    )
}