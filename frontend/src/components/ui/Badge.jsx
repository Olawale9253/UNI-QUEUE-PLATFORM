export default function Badge({ children, variant = 'default', size = 'md' }) {
    const variants = {
        default: 'bg-slate-100 text-slate-700',
        info: 'bg-sky-50 text-sky-700',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-700',
        danger: 'bg-rose-50 text-rose-700',
        indigo: 'bg-indigo-50 text-indigo-700',
    }
    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
    }
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]}`}
        >
      {children}
    </span>
    )
}