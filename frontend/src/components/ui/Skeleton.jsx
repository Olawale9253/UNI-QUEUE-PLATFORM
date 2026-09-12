import { motion } from 'framer-motion'

export function SkeletonBox({ className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className={`rounded-md bg-slate-200 ${className}`}
        />
    )
}

export function SkeletonCard() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SkeletonBox className="h-4 w-1/3" />
            <SkeletonBox className="mt-3 h-8 w-1/2" />
            <SkeletonBox className="mt-2 h-3 w-2/3" />
        </div>
    )
}

export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 px-6 py-4">
            <SkeletonBox className="h-9 w-9 rounded-lg" />
            <div className="flex-1">
                <SkeletonBox className="h-3 w-1/4" />
                <SkeletonBox className="mt-2 h-3 w-1/3" />
            </div>
            <SkeletonBox className="h-6 w-16 rounded-full" />
        </div>
    )
}

export function SkeletonQueueGrid({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}

export function SkeletonStats({ count = 4 }) {
    return (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}