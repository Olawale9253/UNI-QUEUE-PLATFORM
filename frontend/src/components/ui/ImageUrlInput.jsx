import { useState, useEffect } from 'react'
import { Link as LinkIcon, X, ImageOff } from 'lucide-react'

/**
 * Simple URL input with live image preview + clear button.
 * Use for pasting external image URLs (e.g. school logos from their website).
 */
export default function ImageUrlInput({
                                          label,
                                          value,
                                          onChange,
                                          placeholder = 'https://example.edu.ng/logo.png',
                                          hint,
                                          previewHeight = 'h-32',
                                      }) {
    const [local, setLocal] = useState(value || '')
    const [previewError, setPreviewError] = useState(false)

    // Sync when parent resets
    useEffect(() => {
        setLocal(value || '')
        setPreviewError(false)
    }, [value])

    const commit = (raw) => {
        const trimmed = (raw || '').trim()
        setPreviewError(false)
        onChange(trimmed || null)
    }

    const clear = () => {
        setLocal('')
        setPreviewError(false)
        onChange(null)
    }

    return (
        <div>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                </label>
            )}

            <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="url"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    onBlur={(e) => commit(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
                {local && (
                    <button
                        type="button"
                        onClick={clear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700"
                        aria-label="Clear"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {hint && !value && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
            )}

            {/* Preview */}
            {value && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                    <div className={`flex ${previewHeight} items-center justify-center p-2`}>
                        {previewError ? (
                            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                                <ImageOff className="mx-auto mb-1 h-5 w-5 text-rose-500" />
                                Couldn't load image from this URL
                            </div>
                        ) : (
                            <img
                                src={value}
                                alt="Preview"
                                onError={() => setPreviewError(true)}
                                className="max-h-full max-w-full object-contain"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}