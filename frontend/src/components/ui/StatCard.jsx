// frontend/src/components/ui/StatCard.jsx
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

export default function StatCard({ label, value, icon: Icon, hint, delay = 0, iconColor = "blue" }) {
    // Map colors to match the reference images
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        <AnimatedNumber value={value} />
                    </p>
                    {hint && <p className="mt-1 text-xs font-medium text-slate-400">{hint}</p>}
                </div>
                {Icon && (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[iconColor]}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>
        </motion.div>
    )
}