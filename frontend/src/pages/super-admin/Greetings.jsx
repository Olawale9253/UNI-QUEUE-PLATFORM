import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Image as ImageIcon, Send, Trash2, Mail } from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import { useToastStore } from '../../store/toastStore'
import { formatDate } from '../../lib/format'

export default function Greetings() {
    const { push } = useToastStore()
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        title: '',
        message: '',
        imageUrl: '',
        scheduledDate: new Date().toISOString().split('T')[0]
    })

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/super-admin/greetings')
            setCampaigns(res.data.data || [])
        } catch {
            push({ type: 'error', message: 'Failed to load greetings' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => { load() }, [load])

    const handleCreate = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.post('/api/super-admin/greetings', form)
            push({ type: 'success', message: 'Greeting scheduled successfully!' })
            setForm({ title: '', message: '', imageUrl: '', scheduledDate: new Date().toISOString().split('T')[0] })
            load()
        } catch (err) {
            push({ type: 'error', message: 'Failed to schedule greeting' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this greeting?")) return
        try {
            await api.delete(`/api/super-admin/greetings/${id}`)
            load()
        } catch {
            push({ type: 'error', message: 'Failed to delete' })
        }
    }

    return (
        <div className="space-y-6 pb-12 px-4 sm:px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Holiday Greetings</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Schedule automated greeting cards to be emailed to all users on special days.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-1">
                    <Card className="p-5 sticky top-24">
                        <form onSubmit={handleCreate} className="space-y-4">
                            <Input
                                label="Event Title"
                                placeholder="e.g. Happy Independence Day!"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                required
                            />
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Message</label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    rows={4}
                                    placeholder="Wishing all our students a wonderful celebration..."
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    required
                                />
                            </div>
                            <Input
                                label="Banner Image URL (Optional)"
                                placeholder="https://example.com/banner.jpg"
                                value={form.imageUrl}
                                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            />
                            <Input
                                type="date"
                                label="Send Date"
                                value={form.scheduledDate}
                                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                                required
                            />
                            <Button type="submit" icon={Calendar} loading={saving} className="w-full justify-center">
                                Schedule Greeting
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading...</div>
                    ) : campaigns.length === 0 ? (
                        <EmptyState icon={Mail} title="No greetings scheduled" description="Schedule your first automated email card." />
                    ) : (
                        campaigns.map((c) => (
                            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start">
                                    <div className="flex gap-4">
                                        {c.imageUrl ? (
                                            <img src={c.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                                        ) : (
                                            <div className="h-16 w-16 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                                                <ImageIcon className="h-6 w-6 text-brand-600" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-slate-100">{c.title}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{c.message}</p>
                                            <div className="mt-2 flex items-center gap-3 text-xs font-medium">
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <Calendar className="h-3 w-3" /> {formatDate(c.scheduledDate)}
                                                </span>
                                                {c.sent ? (
                                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Sent</span>
                                                ) : (
                                                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Scheduled</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="secondary" onClick={() => handleDelete(c.id)} className="text-rose-600 hover:bg-rose-50 shrink-0">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}