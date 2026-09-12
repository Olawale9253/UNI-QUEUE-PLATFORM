import { Loader2 } from 'lucide-react'

export default function Spinner({ label, className = '' }) {
    return (
        <div className={`flex items-center justify-center py-12 ${className}`}>
            <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
                {label && <span className="text-sm">{label}</span>}
            </div>
        </div>
    )
}