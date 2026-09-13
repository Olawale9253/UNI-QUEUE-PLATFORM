import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUniversityStore } from '../../store/universityStore'

export default function UniversityBanner() {
    const { university } = useUniversityStore()
    const [logoError, setLogoError] = useState(false)

    if (!university?.name) return null

    const initials = university?.code || university?.name?.slice(0, 2).toUpperCase() || 'UQ'
    const accent = university?.primaryColor || '#4f46e5'
    const showImage = !!university?.logoUrl && !logoError

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            {/* Accent bar at very top */}
            <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

            {/* Very faint brand tint */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{ backgroundColor: accent }}
            />

            <div className="relative flex flex-col items-center px-6 py-8 sm:py-10">
                {/* ─── LOGO ─── */}
                <div
                    className="flex items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white"
                    style={{ width: 112, height: 112 }}
                >
                    {showImage ? (
                        <img
                            src={university.logoUrl}
                            alt={university.name}
                            className="h-full w-full object-contain p-1"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div
                            className="flex h-full w-full items-center justify-center text-3xl font-bold text-white"
                            style={{ backgroundColor: accent }}
                        >
                            {initials}
                        </div>
                    )}
                </div>

                {/* ─── NAME ─── */}
                <h1 className="mt-5 text-xl font-bold uppercase leading-tight tracking-[0.15em] text-slate-900 sm:text-3xl">
                    {university.name}
                </h1>

                {/* ─── SUBTITLE ─── */}
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-slate-500 sm:text-sm">
                    Digital Queue System
                </p>

                {/* ─── DECORATIVE UNDERLINE ─── */}
                <div
                    className="mt-5 h-[3px] w-20 rounded-full"
                    style={{ backgroundColor: accent }}
                />
            </div>
        </motion.div>
    )
}