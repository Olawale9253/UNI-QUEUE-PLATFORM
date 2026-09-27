import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/**
 * Copy-to-clipboard button.
 *
 * @param {string} text       — the string to copy
 * @param {string} [title]    — tooltip text (defaults to "Copy")
 * @param {string} [className] — optional extra classes
 */
export default function CopyButton({ text, title = 'Copy', className = '' }) {
    const [copied, setCopied] = useState(false)

    const copy = async (e) => {
        e?.stopPropagation?.()
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // Clipboard API blocked (insecure context or user denied) — silent fail
        }
    }

    return (
        <button
            type="button"
            onClick={copy}
            title={copied ? 'Copied!' : title}
            aria-label={copied ? 'Copied' : title}
            className={`rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 ${className}`}
        >
            {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
                <Copy className="h-3.5 w-3.5" />
            )}
        </button>
    )
}