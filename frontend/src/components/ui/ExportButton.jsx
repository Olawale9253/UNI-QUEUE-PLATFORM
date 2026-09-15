import { Download } from 'lucide-react'
import Button from './Button'
import { exportToCsv } from '../../lib/csv'
import { useToastStore } from '../../store/toastStore'

export default function ExportButton({ rows, columns, filename, label = 'Export CSV' }) {
    const { push } = useToastStore()

    const handleExport = () => {
        try {
            if (!rows || rows.length === 0) {
                push({ type: 'info', message: 'Nothing to export' })
                return
            }
            exportToCsv(rows, columns, filename || 'export')
            push({ type: 'success', message: `Exported ${rows.length} rows` })
        } catch (err) {
            push({ type: 'error', message: err.message || 'Export failed' })
        }
    }

    return (
        <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
            {label}
        </Button>
    )
}