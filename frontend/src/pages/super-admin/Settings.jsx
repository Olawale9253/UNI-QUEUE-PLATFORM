import { useEffect, useState } from 'react'
import { Save, DollarSign, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PageHeader from '../../components/layout/PageHeader'
import { useToastStore } from '../../store/toastStore'

export default function Settings() {
    const { push } = useToastStore()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [rate, setRate] = useState(1500)

    const load = async () => {
        try {
            const res = await api.get('/api/super-admin/settings')
            setRate(res.data.data.ngnExchangeRate || 1500)
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load settings' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const save = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.put('/api/super-admin/settings', { ngnExchangeRate: Number(rate) })
            push({ type: 'success', message: 'Platform settings updated' })
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to save' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading settings…</div>

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader
                title="Platform Settings"
                description="Manage global configuration for the entire application."
            />

            <form onSubmit={save} className="space-y-6">
                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                            <DollarSign className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Currency Settings</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Used to calculate Naira equivalents on the pricing pages.
                            </p>
                        </div>
                    </div>

                    <div className="max-w-xs">
                        <Input
                            label="USD to NGN Exchange Rate"
                            type="number"
                            step="1"
                            min="1"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            hint="e.g., 1500 means $1 = ₦1,500"
                            required
                        />
                    </div>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" icon={RefreshCw} onClick={load} disabled={saving}>
                        Reset
                    </Button>
                    <Button type="submit" icon={Save} loading={saving} disabled={saving}>
                        Save Settings
                    </Button>
                </div>
            </form>
        </div>
    )
}