import { motion } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

export function SkeletonBox({ className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className={`rounded-md bg-slate-200 dark:bg-slate-700 ${className}`}
        />
    )
}

/** Multi-line text skeleton — width percentages are approximate. */
export function SkeletonText({ lines = 3, className = '' }) {
    const widths = ['100%', '92%', '78%', '85%', '88%', '70%']
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBox
                    key={i}
                    className="h-3"
                    style={{ width: widths[i % widths.length] }}
                />
            ))}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Card / Grid / Stats                                                */
/* ------------------------------------------------------------------ */

export function SkeletonCard() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SkeletonBox className="h-4 w-1/3" />
            <SkeletonBox className="mt-3 h-8 w-1/2" />
            <SkeletonBox className="mt-2 h-3 w-2/3" />
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

/* ------------------------------------------------------------------ */
/*  List rows                                                          */
/* ------------------------------------------------------------------ */

/** Generic row — matches most list items in the app. */
export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 px-6 py-4">
            <SkeletonBox className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
                <SkeletonBox className="h-3 w-1/4" />
                <SkeletonBox className="mt-2 h-3 w-1/3" />
            </div>
            <SkeletonBox className="h-6 w-16 shrink-0 rounded-full" />
        </div>
    )
}

/** Stack of rows — for a list of tickets, notifications, etc. */
export function SkeletonList({ count = 5, className = '' }) {
    return (
        <div className={`divide-y divide-slate-100 dark:divide-slate-800 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonRow key={i} />
            ))}
        </div>
    )
}

/** Card-shaped list item — matches ticket cards. */
export function SkeletonListCard({ count = 3, className = '' }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                >
                    <div className="flex items-start justify-between gap-3">
                        <SkeletonBox className="h-4 w-1/3" />
                        <SkeletonBox className="h-5 w-16 rounded-full" />
                    </div>
                    <SkeletonBox className="mt-3 h-3 w-1/2" />
                    <SkeletonBox className="mt-2 h-3 w-2/3" />
                </div>
            ))}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Form / Settings                                                    */
/* ------------------------------------------------------------------ */

/** Settings-style card with header + body. */
export function SkeletonSettingsCard() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
                <SkeletonBox className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                    <SkeletonBox className="h-3.5 w-1/4" />
                    <SkeletonBox className="mt-2 h-3 w-1/2" />
                </div>
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <SkeletonBox className="h-2.5 w-20" />
                        <SkeletonBox className="mt-2 h-9 w-full" />
                    </div>
                    <div>
                        <SkeletonBox className="h-2.5 w-20" />
                        <SkeletonBox className="mt-2 h-9 w-full" />
                    </div>
                </div>
                <div>
                    <SkeletonBox className="h-2.5 w-24" />
                    <SkeletonBox className="mt-2 h-9 w-full" />
                </div>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Workflow timeline                                                  */
/* ------------------------------------------------------------------ */

export function SkeletonStepTimeline({ count = 4 }) {
    return (
        <div className="space-y-0">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <SkeletonBox className="h-8 w-8 shrink-0 rounded-full" />
                        {i < count - 1 && <SkeletonBox className="mt-1 h-full w-0.5" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-5">
                        <SkeletonBox className="h-2.5 w-16" />
                        <SkeletonBox className="mt-2 h-4 w-2/3" />
                        <SkeletonBox className="mt-1 h-3 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    )
}