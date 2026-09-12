export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            {Icon && (
                <div className="mb-4 rounded-full bg-slate-100 p-3">
                    <Icon className="h-6 w-6 text-slate-400" />
                </div>
            )}
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}