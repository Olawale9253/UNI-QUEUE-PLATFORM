export default function Input({
                                  label,
                                  type = 'text',
                                  value,
                                  onChange,
                                  placeholder,
                                  required = false,
                                  error,
                                  hint,
                                  icon: Icon,
                                  ...rest
                              }) {
    return (
        <div className="mb-4">
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Icon className="h-4 w-4 text-slate-400" />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        Icon ? 'pl-9' : ''
                    } ${
                        error
                            ? 'border-rose-400 focus:border-rose-500'
                            : 'border-slate-300 focus:border-indigo-500'
                    }`}
                    {...rest}
                />
            </div>
            {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
            {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
        </div>
    )
}