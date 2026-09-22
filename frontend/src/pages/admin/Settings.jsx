import { useEffect, useState, useCallback } from 'react'
import {
    Building2,
    Palette,
    Save,
    GraduationCap,
    Users,
    RefreshCw,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ImageUrlInput from '../../components/ui/ImageUrlInput'
import PageHeader from '../../components/layout/PageHeader'
import { useToastStore } from '../../store/toastStore'
import { useUniversityStore } from '../../store/universityStore'

const PRESET_COLORS = [
    { label: 'Indigo', value: '#4f46e5' },
    { label: 'Blue', value: '#2563eb' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Rose', value: '#e11d48' },
    { label: 'Amber', value: '#d97706' },
    { label: 'Violet', value: '#7c3aed' },
    { label: 'Slate', value: '#0f172a' },
    { label: 'Crimson', value: '#b91c1c' },
    { label: 'Teal', value: '#0d9488' },
]

export default function Settings() {
    const { push } = useToastStore()
    const { refresh: refreshUniversity } = useUniversityStore()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        name: '',
        logoUrl: null,
        campusImageUrl: null,
        tagline: '',
        primaryColor: '#4f46e5',
        emailDomain: '',
        matricPattern: '',
        matricExample: '',
        matricDescription: '',
        maxStaff: 10,
        maxQueues: 5,
    })

    const load = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/settings')
            const u = res.data.data
            setForm({
                name: u.name || '',
                logoUrl: u.logoUrl || null,
                campusImageUrl: u.campusImageUrl || null,
                tagline: u.tagline || '',
                primaryColor: u.primaryColor || '#4f46e5',
                emailDomain: u.emailDomain || '',
                matricPattern: u.matricPattern || '',
                matricExample: u.matricExample || '',
                matricDescription: u.matricDescription || '',
                maxStaff: u.maxStaff ?? 10,
                maxQueues: u.maxQueues ?? 5,
            })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load settings' })
        } finally {
            setLoading(false)
        }
    }, [push])

    useEffect(() => {
        load()
    }, [load])

    // Live color preview — updates CSS variables as user picks colors
    useEffect(() => {
        const root = document.documentElement
        const base = form.primaryColor || '#4f46e5'
        const hexToRgb = (hex) => {
            const h = hex.replace('#', '')
            const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
            const n = parseInt(full, 16)
            return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
        }
        const rgbToHex = (r, g, b) =>
            `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`
        const mix = (color, target, amount) => {
            const c = hexToRgb(color)
            const t = target === 'white' ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
            const a = Math.abs(amount)
            return rgbToHex(c.r + (t.r - c.r) * a, c.g + (t.g - c.g) * a, c.b + (t.b - c.b) * a)
        }
        const shades = {
            50:  mix(base, 'white', 0.95),
            100: mix(base, 'white', 0.88),
            200: mix(base, 'white', 0.72),
            300: mix(base, 'white', 0.5),
            400: mix(base, 'white', 0.24),
            500: mix(base, 'white', 0.1),
            600: base,
            700: mix(base, 'black', 0.18),
            800: mix(base, 'black', 0.32),
            900: mix(base, 'black', 0.48),
            950: mix(base, 'black', 0.65),
        }
        Object.entries(shades).forEach(([k, v]) => root.style.setProperty(`--color-brand-${k}`, v))
    }, [form.primaryColor])

    const save = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.put('/api/admin/settings', {
                name: form.name,
                logoUrl: form.logoUrl,
                campusImageUrl: form.campusImageUrl,
                tagline: form.tagline,
                primaryColor: form.primaryColor,
                emailDomain: form.emailDomain,
                matricPattern: form.matricPattern,
                matricExample: form.matricExample,
                matricDescription: form.matricDescription,
                maxStaff: Number(form.maxStaff),
                maxQueues: Number(form.maxQueues),
            })
            push({ type: 'success', message: 'Settings saved' })
            refreshUniversity()
            await load()
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to save' })
        } finally {
            setSaving(false)
        }
    }

    const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 h-10 w-1/3 animate-pulse rounded-lg bg-slate-200" />
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                title="University Settings"
                description="Manage your university's branding and registration rules."
            />

            <form onSubmit={save} className="space-y-6">
                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                            <Palette className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Branding</h2>
                            <p className="text-xs text-slate-500">
                                Logo, campus photo and colors shown across the app for your users.
                            </p>
                        </div>
                    </div>

                    <Input
                        label="University name"
                        value={form.name}
                        onChange={setField('name')}
                        placeholder="University of Lagos"
                        required
                        icon={Building2}
                    />

                    <Input
                        label="Tagline"
                        value={form.tagline}
                        onChange={setField('tagline')}
                        placeholder="Skip the line. Not the service."
                        hint="Short marketing line shown on the login page hero."
                    />

                    {/* Logo + Campus photo URL inputs */}
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ImageUrlInput
                            label="University logo URL"
                            value={form.logoUrl}
                            onChange={(url) => setForm({ ...form, logoUrl: url })}
                            placeholder="https://unilag.edu.ng/logo.png"
                            hint="Right-click the logo on your school's website → Copy image address."
                            previewHeight="h-32"
                        />
                        <ImageUrlInput
                            label="Campus photo URL"
                            value={form.campusImageUrl}
                            onChange={(url) => setForm({ ...form, campusImageUrl: url })}
                            placeholder="https://unilag.edu.ng/campus.jpg"
                            hint="Paste any public image URL of your campus."
                            previewHeight="h-32"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Primary color
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, primaryColor: c.value })}
                                    className={`h-9 w-9 rounded-lg border-2 transition-transform hover:scale-110 ${
                                        form.primaryColor === c.value
                                            ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-1'
                                            : 'border-white shadow-sm'
                                    }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                    aria-label={c.label}
                                />
                            ))}

                            <label className="ml-2 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
                                <input
                                    type="color"
                                    value={form.primaryColor}
                                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                                    className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                                />
                                <span className="font-mono text-xs text-slate-600">
                                    {form.primaryColor}
                                </span>
                            </label>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">
                            Applied live — buttons, tabs, and accents update as you pick.
                        </p>
                    </div>
                </Card>

                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                            <GraduationCap className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Registration rules</h2>
                            <p className="text-xs text-slate-500">
                                How students validate their identity when signing up.
                            </p>
                        </div>
                    </div>

                    <Input
                        label="Email domain"
                        value={form.emailDomain}
                        onChange={setField('emailDomain')}
                        placeholder="@unilag.edu.ng"
                        hint="Only emails ending with this will be accepted at registration."
                    />

                    <Input
                        label="Matric number pattern (regex)"
                        value={form.matricPattern}
                        onChange={setField('matricPattern')}
                        placeholder="^\d{2}/\d{5}/\d{3}$"
                        hint="Regular expression the matric number must match."
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Matric example"
                            value={form.matricExample}
                            onChange={setField('matricExample')}
                            placeholder="21/12345/001"
                        />
                        <Input
                            label="Matric format description"
                            value={form.matricDescription}
                            onChange={setField('matricDescription')}
                            placeholder="YY/XXXXX/XXX"
                        />
                    </div>
                </Card>

                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                            <Users className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Account limits</h2>
                            <p className="text-xs text-slate-500">
                                Maximum staff members and queues your university can create.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Max staff members"
                            type="number"
                            min="1"
                            value={form.maxStaff}
                            onChange={setField('maxStaff')}
                        />
                        <Input
                            label="Max active queues"
                            type="number"
                            min="1"
                            value={form.maxQueues}
                            onChange={setField('maxQueues')}
                        />
                    </div>
                </Card>

                <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
                    <Button
                        type="button"
                        variant="secondary"
                        icon={RefreshCw}
                        onClick={load}
                        disabled={saving}
                    >
                        Reset
                    </Button>
                    <Button type="submit" icon={Save} loading={saving} disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </div>
    )
}