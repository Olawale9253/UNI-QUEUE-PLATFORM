import { motion } from 'framer-motion'

/**
 * EmptyState — consistent empty-state card used across the app.
 *
 * Props:
 *   icon         — lucide icon component (required)
 *   title        — short headline
 *   description  — one-line explanation
 *   action       — React node for the primary CTA (optional)
 *   variant      — 'neutral' | 'info' | 'warning' | 'danger' | 'success'
 *   size         — 'sm' | 'md' | 'lg'
 *   className    — extra classes for the outer wrapper
 *   bordered     — dashed border by default (set false for borderless use)
 */
export default function EmptyState({
                                       icon: Icon,
                                       title,
                                       description,
                                       action,
                                       variant = 'neutral',
                                       size = 'md',
                                       className = '',
                                       bordered = true,
                                   }) {
    const variants = {
        neutral: {
            iconBg: 'bg-slate-100 dark:bg-slate-800',
            iconColor: 'text-slate-400 dark:text-slate-500',
            titleColor: 'text-slate-900 dark:text-slate-100',
        },
        info: {
            iconBg: 'bg-sky-50 dark:bg-sky-950/40',
            iconColor: 'text-sky-500 dark:text-sky-400',
            titleColor: 'text-slate-900 dark:text-slate-100',
        },
        warning: {
            iconBg: 'bg-amber-50 dark:bg-amber-950/40',
            iconColor: 'text-amber-500 dark:text-amber-400',
            titleColor: 'text-slate-900 dark:text-slate-100',
        },
        danger: {
            iconBg: 'bg-rose-50 dark:bg-rose-950/40',
            iconColor: 'text-rose-500 dark:text-rose-400',
            titleColor: 'text-slate-900 dark:text-slate-100',
        },
        success: {
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
            iconColor: 'text-emerald-500 dark:text-emerald-400',
            titleColor: 'text-slate-900 dark:text-slate-100',
        },
    }

    const sizes = {
        sm: {
            pad: 'px-5 py-10',
            iconBox: 'h-10 w-10',
            icon: 'h-5 w-5',
            title: 'text-sm',
            desc: 'text-xs',
        },
        md: {
            pad: 'px-6 py-16',
            iconBox: 'h-12 w-12',
            icon: 'h-6 w-6',
            title: 'text-sm',
            desc: 'text-sm',
        },
        lg: {
            pad: 'px-8 py-20',
            iconBox: 'h-14 w-14',
            icon: 'h-7 w-7',
            title: 'text-base',
            desc: 'text-sm',
        },
    }

    const value = variants[variant] ?? variants.neutral
    const stringValue = sizes[size] ?? sizes.md

    const wrapper = bordered
        ? 'rounded-xl border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
        : 'rounded-xl bg-slate-50/50 dark:bg-slate-900/40'

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex flex-col items-center justify-center text-center ${wrapper} ${stringValue.pad} ${className}`}
        >
            {Icon && (
                <div
                    className={`mb-4 flex items-center justify-center rounded-full ${stringValue.iconBox} ${value.iconBg}`}
                >
                    <Icon className={`${stringValue.icon} ${value.iconColor}`} strokeWidth={2} />
                </div>
            )}
            <h3 className={`font-semibold ${stringValue.title} ${value.titleColor}`}>{title}</h3>
            {description && (
                <p
                    className={`mt-1 max-w-sm text-slate-500 dark:text-slate-400 ${stringValue.desc}`}
                >
                    {description}
                </p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </motion.div>
    )
}