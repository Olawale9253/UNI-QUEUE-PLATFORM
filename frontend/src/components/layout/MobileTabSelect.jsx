import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Responsive + sticky tabs.
 *   md+   → horizontal tabs
 *   below → dropdown
 *
 * Sticky behavior:
 *   - Pinned at top: 80px (matches Navbar h-20)
 *   - Frosted background so content behind is readable
 *   - Adapts to dark mode
 */
export default function MobileTabSelect({ tabs }) {
    const location = useLocation()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    const current =
        tabs.find((t) => {
            if (t.end) return location.pathname === t.to
            return location.pathname === t.to || location.pathname.startsWith(t.to + '/')
        }) || tabs[0]

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    useEffect(() => {
        setOpen(false)
    }, [location.pathname])

    const CurrentIcon = current.icon

    return (
        <div
            className="
        sticky z-30 -mx-4 mb-6 border-b border-slate-200 bg-slate-50/95 px-4 pt-3 backdrop-blur-sm
        dark:border-slate-700 dark:bg-slate-900/95
        sm:-mx-6 sm:px-6 sm:mb-8
        lg:-mx-8 lg:px-8
      "
            style={{ top: '5rem' }}
        >
            {/* Desktop: horizontal tabs */}
            <div className="hidden md:block">
                <nav className="-mb-px flex gap-1 overflow-x-auto">
                    {tabs.map((t) => (
                        <NavLink
                            key={t.to}
                            to={t.to}
                            end={t.end}
                            className={({ isActive }) =>
                                `inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'border-brand-600 text-brand-600'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200'
                                }`
                            }
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Mobile: dropdown */}
            <div className="relative pb-3 md:hidden" ref={ref}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                    <div className="flex items-center gap-2.5">
                        <CurrentIcon className="h-4 w-4 text-brand-600" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {current.label}
            </span>
                    </div>
                    <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                            open ? 'rotate-180' : ''
                        }`}
                    />
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
                        >
                            <ul className="py-1">
                                {tabs.map((t) => {
                                    const Icon = t.icon
                                    const isCurrent = current.to === t.to

                                    return (
                                        <li key={t.to}>
                                            <NavLink
                                                to={t.to}
                                                end={t.end}
                                                onClick={() => setOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                                    isCurrent
                                                        ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                                                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                <Icon
                                                    className={`h-4 w-4 shrink-0 ${
                                                        isCurrent
                                                            ? 'text-brand-600 dark:text-brand-400'
                                                            : 'text-slate-400'
                                                    }`}
                                                />
                                                <span className="flex-1">{t.label}</span>
                                                {isCurrent && (
                                                    <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                                                )}
                                            </NavLink>
                                        </li>
                                    )
                                })}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}