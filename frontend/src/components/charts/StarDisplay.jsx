import { Star } from 'lucide-react'

export default function StarDisplay({ rating, size = 14, showValue = false }) {
    const rounded = Math.round(rating || 0)
    return (
        <div className="inline-flex items-center gap-1">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((count) => (
                    <Star
                        key={count}
                        style={{ width: size, height: size }}
                        className={
                            count <= rounded
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                        }
                    />
                ))}
            </div>
            {showValue && (
                <span className="ml-1 text-xs font-medium text-slate-600">
          {(rating || 0).toFixed(1)}
        </span>
            )}
        </div>
    )
}