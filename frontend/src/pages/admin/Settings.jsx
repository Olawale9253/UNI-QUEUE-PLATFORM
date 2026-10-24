import { useEffect, useState } from 'react'
import {
    Building2, Palette, Save, GraduationCap, Users, RefreshCw,
    Sparkles, FileText, Hash, CalendarX, Globe, Check,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ImageUrlInput from '../../components/ui/ImageUrlInput'
import ClosedDatesPanel from '../../components/admin/ClosedDatesPanel'
import { useToastStore } from '../../store/toastStore'
import { useUniversityStore } from '../../store/universityStore'

const VERIFICATION_MODES = [
    { value: 'PATTERN', label: 'Pattern only',   hint: 'Fast. Validates format only.' },
    { value: 'LIST',    label: 'Admission list', hint: 'Matches against uploaded list' },
    { value: 'BOTH',    label: 'Both',           hint: 'Strongest. Checks the pattern and student list.' },
]

const TIMEZONES = [
    { value: 'Africa/Lagos', label: 'Africa/Lagos (WAT, Nigeria)' },
    { value: 'Africa/Accra', label: 'Africa/Accra (GMT, Ghana)' },
    { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT, Kenya)' },
    { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST, South Africa)' },
    { value: 'Africa/Cairo', label: 'Africa/Cairo (EET, Egypt)' },
    { value: 'Africa/Casablanca', label: 'Africa/Casablanca (WEST, Morocco)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST, UK)' },
    { value: 'UTC', label: 'UTC' },
]

const COUNTRIES = [
    { value: 'NG', label: 'Nigeria' },
    { value: 'GH', label: 'Ghana' },
    { value: 'KE', label: 'Kenya' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'EG', label: 'Egypt' },
    { value: 'MA', label: 'Morocco' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'US', label: 'United States' },
]

export default function Settings() {
    const { push } = useToastStore()
    const { refresh: refreshUniversity } = useUniversityStore()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        name: '', logoUrl: null, campusImageUrl: null, tagline: '',
        primaryColor: '#4f46e5', emailDomain: '',
        timezone: 'Africa/Lagos',
        countryCode: 'NG',
        matricPattern: '', matricExample: '', matricDescription: '',
        maxStaff: 10, maxQueues: 5,
        fresherRegistrationEnabled: true,
        fresherVerificationMode: 'PATTERN',
        matricVerificationMode: 'PATTERN',
        requireJambReg: true,
        jambRegPattern: '', jambRegExample: '', jambRegDescription: '',
        requireAdmissionRef: false,
        admissionRefPattern: '', admissionRefExample: '', admissionRefDescription: '',
        requireApplicationNumber: false,
        applicationNumberPattern: '', applicationNumberExample: '', applicationNumberDescription: '',
    })

    const load = async () => {
        try {
            const res = await api.get('/api/admin/settings')
            const user = res.data.data
            setForm({
                name: user.name || '',
                logoUrl: user.logoUrl || null,
                campusImageUrl: user.campusImageUrl || null,
                tagline: user.tagline || '',
                primaryColor: user.primaryColor || '#4f46e5',
                emailDomain: user.emailDomain || '',
                timezone: user.timezone || 'Africa/Lagos',
                countryCode: user.countryCode || 'NG',
                matricPattern: user.matricPattern || '',
                matricExample: user.matricExample || '',
                matricDescription: user.matricDescription || '',
                maxStaff: user.maxStaff ?? 10,
                maxQueues: user.maxQueues ?? 5,
                fresherRegistrationEnabled: user.fresherRegistrationEnabled !== false,
                fresherVerificationMode: user.fresherVerificationMode || 'PATTERN',
                matricVerificationMode: user.matricVerificationMode || 'PATTERN',
                requireJambReg: user.requireJambReg !== false,
                jambRegPattern: user.jambRegPattern || '',
                jambRegExample: user.jambRegExample || '',
                jambRegDescription: user.jambRegDescription || '',
                requireAdmissionRef: !!user.requireAdmissionRef,
                admissionRefPattern: user.admissionRefPattern || '',
                admissionRefExample: user.admissionRefExample || '',
                admissionRefDescription: user.admissionRefDescription || '',
                requireApplicationNumber: !!user.requireApplicationNumber,
                applicationNumberPattern: user.applicationNumberPattern || '',
                applicationNumberExample: user.applicationNumberExample || '',
                applicationNumberDescription: user.applicationNumberDescription || '',
            })
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to load settings' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const save = async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
            await api.put('/api/admin/settings', {
                ...form,
                maxStaff: Number(form.maxStaff),
                maxQueues: Number(form.maxQueues),
            })
            push({ type: 'success', message: 'Settings saved' })
            refreshUniversity()
            await load()
        } catch (err) {
            push({ type: 'error', message: err.message || 'Failed to save' })
        } finally {
            setSaving(false)
        }
    }

    const setField = (field) => (eventValue) => setForm({ ...form, [field]: eventValue.target.value })
    const setCheck = (field) => (eventValue) => setForm({ ...form, [field]: eventValue.target.checked })

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-6 pb-12">
                <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                ))}
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your university's identity, rules, and schedule.</p>
            </div>

            <form onSubmit={save} className="space-y-6">
                {/* BRANDING */}
                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                            <Palette className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Branding</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Logo, brand color, and campus photo.</p>
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
                        hint="Shown on the login page hero."
                    />

                    {/* 🔧 NEW: Brand Color Picker */}
                    <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            <Palette className="h-4 w-4 text-slate-500" />
                            Brand Color
                        </label>
                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                            This color is used for buttons, active tabs, and highlights across your entire workspace.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-900/10">
                                <input
                                    type="color"
                                    value={form.primaryColor}
                                    onChange={setField('primaryColor')}
                                    className="absolute -left-2 -top-2 h-20 w-20 cursor-pointer border-0 p-0"
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-sm font-medium text-slate-400">#</span>
                                    <input
                                        type="text"
                                        value={form.primaryColor.replace('#', '')}
                                        onChange={(e) => setForm({ ...form, primaryColor: `#${e.target.value}` })}
                                        maxLength={6}
                                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-8 pr-3 font-mono text-sm uppercase text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ImageUrlInput
                            label="University logo URL"
                            value={form.logoUrl}
                            onChange={(url) => setForm({ ...form, logoUrl: url })}
                            placeholder="https://unilag.edu.ng/logo.png"
                            hint="Paste your school's logo URL."
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
                </Card>

                {/* ... (Keep the rest of the file exactly as it is: Schedule, Registration Rules, Fresher, Limits, and the sticky Save button) ... */}
                {/* I have omitted the remaining cards to save space, but you should just paste the updated Branding card over the old one in your file. */}

                <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:-mx-6 sm:px-6">
                    <Button type="button" variant="secondary" icon={RefreshCw} onClick={load} disabled={saving}>Reset</Button>
                    <Button type="submit" icon={Save} loading={saving} disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </div>
    )
}