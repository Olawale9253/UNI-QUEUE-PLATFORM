import { useState, useEffect } from 'react'
import { Link as LinkIcon, X as CloseIcon, ImageOff, ImageIcon } from 'lucide-react'

/**
 * URL input with live image preview + clear button.
 *
 * Accepts both:
 *   - Full URLs: https://unilag.edu.ng/logo.png
 *   - Relative paths: /logos/image.jpeg (served from the frontend's public folder)
 *
 * The preview panel is intentionally WHITE in both light and dark mode.
 * University logos are usually PNGs with baked-in white backgrounds —
 * keeping the panel white makes them look intentional, not broken.
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
                    type="text"
                    value={local}
                    onChange={(event) => setLocal(event.target.value)}
                    onBlur={(eventValue) => commit(eventValue.target.value)}
                    placeholder={placeholder}
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
                {local && (
                    <button
                        type="button"
                        onClick={clear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700"
                        aria-label="Clear"
                    >
                        <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {hint && !value && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
            )}

            {/* ── Preview panel — always white ── */}
            <div className="mt-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <ImageIcon className="h-3 w-3" />
                    Preview
                </div>

                <div
                    className={`group relative overflow-hidden rounded-xl border bg-white shadow-md ring-1 ring-slate-900/5 transition-all hover:shadow-lg ${
                        previewError
                            ? 'border-rose-200'
                            : 'border-slate-200'
                    }`}
                >
                    {/* Subtle checkered backdrop so transparent logos stay readable */}
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.035]"
                        style={{
                            backgroundImage:
                                'linear-gradient(45deg, #0f172a 25%, transparent 25%), linear-gradient(-45deg, #0f172a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f172a 75%), linear-gradient(-45deg, transparent 75%, #0f172a 75%)',
                            backgroundSize: '16px 16px',
                            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        }}
                        aria-hidden
                    />

                    <div
                        className={`relative flex ${previewHeight} items-center justify-center p-4`}
                    >
                        {!value ? (
                            <div className="text-center">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                    <ImageIcon className="h-4.5 w-4.5 text-slate-400" />
                                </div>
                                <p className="text-xs font-medium text-slate-500">
                                    No image yet
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Paste a URL above to see the preview.
                                </p>
                            </div>
                        ) : previewError ? (
                            <div className="text-center">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
                                    <ImageOff className="h-4.5 w-4.5 text-rose-500" />
                                </div>
                                <p className="text-xs font-medium text-rose-600">
                                    Couldn't load image
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Check the URL or try a different one.
                                </p>
                            </div>
                        ) : (
                            <img
                                src={value}
                                alt="Preview"
                                onError={() => setPreviewError(true)}
                                className="max-h-full max-w-full rounded-md object-contain drop-shadow-sm"
                            />
                        )}
                    </div>

                    {/* Footer bar — always white too */}
                    {value && !previewError && (
                        <div className="relative flex items-center justify-between border-t border-slate-100 bg-white/80 px-3 py-1.5 backdrop-blur-sm">
                            <span className="truncate font-mono text-[10px] text-slate-500">
                                {value}
                            </span>
                            <button
                                type="button"
                                onClick={clear}
                                className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}