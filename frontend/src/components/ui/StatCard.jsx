import { motion, animate } from 'framer-motion'
import { useEffect, useState } from 'react'

function AnimatedNumber({ value }) {
    const [display, setDisplay] = useState(0)
    const numeric = typeof value === 'number' ? value : parseFloat(value) || 0

    useEffect(() => {
        const controls = animate(0, numeric, {
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (valueValue) => setDisplay(Math.round(valueValue)),
        })
        return controls.stop
    }, [numeric])

    if (typeof value !== 'number' && isNaN(parseFloat(value))) return value ?? '—'
    return display
}

export default function StatCard({ label, value, icon: Icon, hint, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        <AnimatedNumber value={value} />
                    </p>
                    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
                </div>
                {Icon && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.35, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-lg bg-brand-50 p-2"
                    >
                        <Icon className="h-5 w-5 text-brand-600" />
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}