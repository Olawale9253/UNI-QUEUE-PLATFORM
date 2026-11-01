import { useEffect, useState } from 'react'
import { Save, DollarSign, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
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

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8 pb-12 pt-2 sm:pt-4 px-4 sm:px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Platform Settings
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage global configuration for the entire UniQueue platform.
                </p>
            </div>

            <form onSubmit={save}>
                <Card className="p-4 sm:p-6">
                    <div className="mb-5 sm:mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 sm:pb-5 dark:border-slate-800">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Currency Configuration</h2>
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                Used to calculate Naira equivalents on pricing pages across the app.
                            </p>
                        </div>
                    </div>

                    <div className="w-full sm:max-w-md">
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

                <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                    <Button type="button" variant="secondary" icon={RefreshCw} onClick={load} disabled={saving} className="w-full sm:w-auto justify-center">
                        Reset
                    </Button>
                    <Button type="submit" icon={Save} loading={saving} disabled={saving} className="w-full sm:w-auto justify-center">
                        Save Settings
                    </Button>
                </div>
            </form>
        </div>
    )
}