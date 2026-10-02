import { CalendarX } from 'lucide-react'

function parseDate(iso) {
    if (!iso) return null
    return new Date(iso + 'T00:00:00')
}

function formatMonthDay(iso) {
    const d = parseDate(iso)
    if (!d) return { month: '', day: '' }
    return {
        month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
        day: String(d.getDate()).padStart(2, '0'),
    }
}

/**
 * Compact holiday indicator.
 * - Today is a holiday → red single-line banner
 * - Otherwise → one-row strip with up to 3 upcoming holiday pills
 * - Returns null if nothing to show
 *
 * `className` overrides the outer wrapper classes (default: `mb-6`).
 */
export default function HolidayStrip({ closedDates, className = 'mb-6' }) {
    if (!closedDates) return null

    const { todayClosed, todayReason, upcoming = [] } = closedDates

    // ── Today is a holiday ──
    if (todayClosed) {
        return (
            <div className={`${className} flex items-center gap-3 overflow-hidden rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 via-rose-50 to-white px-4 py-2.5 dark:border-rose-900 dark:from-rose-950/40 dark:via-rose-950/30 dark:to-slate-900`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500 shadow-sm shadow-rose-500/30">
                    <CalendarX className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                        Closed today
                    </div>
                    <div className="truncate text-xs text-rose-900 dark:text-rose-200">
                        {todayReason || 'Public holiday'} — all queues resume next working day
                    </div>
                </div>
            </div>
        )
    }

    // ── Upcoming closures ──
    const preview = upcoming.slice(0, 3)
    const remaining = upcoming.length - preview.length
    if (preview.length === 0) return null

    return (
        <div className={`${className} overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900`}>
            <div className="flex items-center gap-3 px-4 py-2">
                {/* Label */}
                <div className="flex shrink-0 items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <CalendarX className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <span className="hidden text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:inline">
                        Next closures
                    </span>
                </div>

                {/* Divider */}
                <div className="hidden h-5 w-px shrink-0 bg-slate-200 sm:block dark:bg-slate-700" />

                {/* Pills */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {preview.map((d, i) => {
                        const { month, day } = formatMonthDay(d.closedDate)
                        return (
                            <div
                                key={d.id}
                                className="inline-flex shrink-0 items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition-transform hover:scale-[1.03] dark:border-slate-700 dark:bg-slate-800"
                                title={d.reason || 'Holiday'}
                            >
                                <span
                                    className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                        i === 0
                                            ? 'bg-brand-600 text-white'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    {month} {day}
                                </span>
                                <span className="max-w-[110px] truncate px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                    {d.reason || 'Holiday'}
                                </span>
                            </div>
                        )
                    })}
                    {remaining > 0 && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            +{remaining}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}