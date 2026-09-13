export default function Select({
                                   label,
                                   value,
                                   onChange,
                                   options,
                                   placeholder,
                                   required,
                                   hint,
                                   id,
                                   name,
                               }) {
    const selectId = id || name || label?.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="mb-4">
            {label && (
                <label
                    htmlFor={selectId}
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <select
                id={selectId}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
            >
                <option value="">{placeholder || 'Select…'}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
        </div>
    )
}