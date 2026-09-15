export default function RatingBar({ stars, count, total, color = '#f59e0b' }) {
    const pct = total > 0 ? (count / total) * 100 : 0
    return (
        <div className="flex items-center gap-3">
            <div className="flex w-20 shrink-0 items-center gap-0.5 text-xs font-medium text-slate-600">
                {stars}
                <span className="text-amber-500">★</span>
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <div className="w-12 shrink-0 text-right text-xs text-slate-500">
                {count}
            </div>
        </div>
    )
}