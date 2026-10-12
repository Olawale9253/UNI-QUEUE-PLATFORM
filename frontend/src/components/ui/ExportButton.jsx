import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { exportToCsv } from '../../lib/csv'
import { useToastStore } from '../../store/toastStore'

/**
 * CSV export button — reusable across any list/table page.
 *
 * Usage:
 *   <ExportButton
 *       rows={logs}
 *       columns={[
 *           { key: 'id', label: 'ID' },
 *           { key: 'action', label: 'Action' },
 *           { key: 'createdAt', label: 'Timestamp',
 *             value: (r) => new Date(r.createdAt).toLocaleString() },
 *       ]}
 *       filename="uniqueue-audit-logs"
 *       label="Export CSV"
 *   />
 */
export default function ExportButton({
                                         rows,
                                         columns,
                                         filename = 'export',
                                         label = 'Export CSV',
                                         variant = 'outline',
                                         size = 'sm',
                                         disabled = false,
                                         className = '',
                                         onExported,
                                     }) {
    const { push } = useToastStore()
    const [busy, setBusy] = useState(false)

    const handleClick = () => {
        if (disabled || busy) return

        if (!rows || rows.length === 0) {
            push({ type: 'info', message: 'Nothing to export yet' })
            return
        }
        if (!columns || columns.length === 0) {
            push({ type: 'error', message: 'No columns defined for export' })
            return
        }

        setBusy(true)
        try {
            const name = exportToCsv(rows, columns, filename)
            if (!name) {
                push({ type: 'info', message: 'Nothing to export yet' })
                return
            }
            push({
                type: 'success',
                message: `Exported ${rows.length} row${rows.length === 1 ? '' : 's'} → ${name}`,
            })
            onExported?.(name, rows.length)
        } catch (err) {
            console.error('[ExportButton] failed', err)
            push({ type: 'error', message: 'Export failed' })
        } finally {
            setTimeout(() => setBusy(false), 300)
        }
    }

    const variantClasses = {
        primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50',
        secondary:
            'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100',
        outline:
            'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
    }

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled || busy}
            className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors ${
                variantClasses[variant] ?? variantClasses.outline
            } ${sizeClasses[size] ?? sizeClasses.sm} ${className}`}
        >
            {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
                <Download className="h-3.5 w-3.5" />
            )}
            {label}
        </button>
    )
}