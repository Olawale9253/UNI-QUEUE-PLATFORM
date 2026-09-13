import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Button({
                                   children,
                                   variant = 'primary',
                                   size = 'md',
                                   type = 'button',
                                   disabled = false,
                                   loading = false,
                                   onClick,
                                   className = '',
                                   fullWidth = false,
                                   icon: Icon,
                               }) {
    const base =
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary:
            'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow',
        secondary:
            'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
        danger: 'bg-rose-600 text-white hover:bg-rose-700',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700',
        ghost: 'text-slate-600 hover:bg-slate-100',
        subtle:
            'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
    }

    const isDisabled = disabled || loading

    return (
        <motion.button
            type={type}
            disabled={isDisabled}
            onClick={onClick}
            whileHover={isDisabled ? {} : { y: -1 }}
            whileTap={isDisabled ? {} : { scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`${base} ${variants[variant]} ${sizes[size]} ${
                fullWidth ? 'w-full' : ''
            } ${className}`}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                Icon && <Icon className="h-4 w-4" />
            )}
            {children}
        </motion.button>
    )
}