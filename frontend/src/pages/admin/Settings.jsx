import { useEffect, useState } from 'react'
import {
    Building2, Palette, Save, GraduationCap, Users, RefreshCw,
    Sparkles, FileText, Hash, CalendarX, Globe,
} from 'lucide-react'
import api from '../../api/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ImageUrlInput from '../../components/ui/ImageUrlInput'
import PageHeader from '../../components/layout/PageHeader'
import ClosedDatesPanel from '../../components/admin/ClosedDatesPanel'
import { useToastStore } from '../../store/toastStore'
import { useUniversityStore } from '../../store/universityStore'

const VERIFICATION_MODES = [
    { value: 'PATTERN', label: 'Pattern only',   hint: 'Fast — validates format only' },
    { value: 'LIST',    label: 'Admission list', hint: 'Matches against uploaded list' },
    { value: 'BOTH',    label: 'Both',           hint: 'Strongest — pattern + list match' },
]

const TIMEZONES = [
    { value: 'Africa/Lagos', label: 'Africa/Lagos (WAT — Nigeria)' },
    { value: 'Africa/Accra', label: 'Africa/Accra (GMT — Ghana)' },
    { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT — Kenya)' },
    { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST — South Africa)' },
    { value: 'Africa/Cairo', label: 'Africa/Cairo (EET — Egypt)' },
    { value: 'Africa/Casablanca', label: 'Africa/Casablanca (WEST — Morocco)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST — UK)' },
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
            const u = res.data.data
            setForm({
                name: u.name || '',
                logoUrl: u.logoUrl || null,
                campusImageUrl: u.campusImageUrl || null,
                tagline: u.tagline || '',
                primaryColor: u.primaryColor || '#4f46e5',
                emailDomain: u.emailDomain || '',
                timezone: u.timezone || 'Africa/Lagos',
                countryCode: u.countryCode || 'NG',
                matricPattern: u.matricPattern || '',
                matricExample: u.matricExample || '',
                matricDescription: u.matricDescription || '',
                maxStaff: u.maxStaff ?? 10,
                maxQueues: u.maxQueues ?? 5,
                fresherRegistrationEnabled: u.fresherRegistrationEnabled !== false,
                fresherVerificationMode: u.fresherVerificationMode || 'PATTERN',
                requireJambReg: u.requireJambReg !== false,
                jambRegPattern: u.jambRegPattern || '',
                jambRegExample: u.jambRegExample || '',
                jambRegDescription: u.jambRegDescription || '',
                requireAdmissionRef: !!u.requireAdmissionRef,
                admissionRefPattern: u.admissionRefPattern || '',
                admissionRefExample: u.admissionRefExample || '',
                admissionRefDescription: u.admissionRefDescription || '',
                requireApplicationNumber: !!u.requireApplicationNumber,
                applicationNumberPattern: u.applicationNumberPattern || '',
                applicationNumberExample: u.applicationNumberExample || '',
                applicationNumberDescription: u.applicationNumberDescription || '',
            })
        } catch (err) {
            push({ type: 'error', message: err.response?.data?.message || 'Failed to load settings' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const save = async (e) => {
        e.preventDefault()
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
            push({ type: 'error', message: err.response?.data?.message || 'Failed to save' })
        } finally {
            setSaving(false)
        }
    }

    const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value })
    const setCheck = (field) => (e) => setForm({ ...form, [field]: e.target.checked })

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 h-10 w-1/3 animate-pulse rounded-lg bg-slate-200" />
                <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
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
                description="Manage branding, registration rules, and fresher verification."
            />

            <form onSubmit={save} className="space-y-6">
                {/* BRANDING */}
                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                            <Palette className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Branding</h2>
                            <p className="text-xs text-slate-500">Logo and campus photo.</p>
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

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ImageUrlInput
                            label="University logo URL"
                            value={form.logoUrl}
                            onChange={(url) => setForm({ ...form, logoUrl: url })}
                            placeholder="https://unilag.edu.ng/logo.png"
                            hint="Paste your school's logo URL, or use /logos/your-file.png if you've uploaded one."
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

                {/* SCHEDULE & CLOSED DATES */}
                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                            <CalendarX className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Schedule</h2>
                            <p className="text-xs text-slate-500">
                                Time zone, country, and days when your university is closed.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                University time zone
                            </label>
                            <select
                                value={form.timezone}
                                onChange={setField('timezone')}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-500">
                                Queue opening hours, holidays, and analytics use this time zone.
                            </p>
                        </div>

                        <div>
                            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                <Globe className="h-3.5 w-3.5 text-slate-400" />
                                Country (public holidays)
                            </label>
                            <select
                                value={form.countryCode || 'NG'}
                                onChange={setField('countryCode')}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            >
                                {COUNTRIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-500">
                                Holidays auto-sync from this country's calendar. Supports 200+ countries.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-6">
                        <div className="mb-4">
                            <div className="text-sm font-medium text-slate-900">Closed dates</div>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Public holidays and other days when the university is closed.
                                Click <strong>Sync</strong> to pull them automatically from the
                                national calendar, or add specific dates manually.
                            </p>
                        </div>
                        <ClosedDatesPanel />
                    </div>
                </Card>

                {/* REGISTRATION RULES */}
                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                            <GraduationCap className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Registration rules</h2>
                            <p className="text-xs text-slate-500">How continuing students validate their identity.</p>
                        </div>
                    </div>

                    <Input
                        label="Email domain"
                        value={form.emailDomain}
                        onChange={setField('emailDomain')}
                        placeholder="@unilag.edu.ng"
                        hint="Only emails ending with this are accepted for continuing students."
                    />
                    <Input
                        label="Matric number pattern (regex)"
                        value={form.matricPattern}
                        onChange={setField('matricPattern')}
                        placeholder="^\d{2}/\d{5}/\d{3}$"
                        hint="Format enforced when students submit a matric."
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input label="Matric example" value={form.matricExample} onChange={setField('matricExample')} placeholder="21/12345/001" />
                        <Input label="Matric format description" value={form.matricDescription} onChange={setField('matricDescription')} placeholder="YY/XXXXX/XXX" />
                    </div>
                </Card>

                {/* FRESHER REGISTRATION */}
                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                            <Sparkles className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Fresher registration</h2>
                            <p className="text-xs text-slate-500">How new students register before they get a matric number.</p>
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <input
                            type="checkbox"
                            checked={form.fresherRegistrationEnabled}
                            onChange={setCheck('fresherRegistrationEnabled')}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                            <div className="text-sm font-medium text-slate-900">Allow fresher registration</div>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Freshers register with their JAMB / admission info and can
                                access fresher-friendly queues. They upgrade to full
                                student access once they receive a matric.
                            </p>
                        </div>
                    </label>

                    {form.fresherRegistrationEnabled && (
                        <>
                            <div className="mt-5">
                                <label className="mb-2 block text-sm font-medium text-slate-700">Verification mode</label>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {VERIFICATION_MODES.map((m) => (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, fresherVerificationMode: m.value })}
                                            className={`rounded-lg border p-3 text-left transition-colors ${
                                                form.fresherVerificationMode === m.value
                                                    ? 'border-brand-500 bg-brand-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className={`text-sm font-semibold ${form.fresherVerificationMode === m.value ? 'text-brand-700' : 'text-slate-900'}`}>
                                                {m.label}
                                            </div>
                                            <div className="mt-0.5 text-xs text-slate-500">{m.hint}</div>
                                        </button>
                                    ))}
                                </div>
                                {(form.fresherVerificationMode === 'LIST' || form.fresherVerificationMode === 'BOTH') && (
                                    <p className="mt-2 text-xs text-amber-700">
                                        ⚠️ Requires an uploaded admission list. Upload it from the super admin panel.
                                    </p>
                                )}
                            </div>

                            <div className="mt-5 rounded-lg border border-slate-200 p-4">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input type="checkbox" checked={form.requireJambReg} onChange={setCheck('requireJambReg')} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                                            Require JAMB registration number
                                        </div>
                                    </div>
                                </label>
                                {form.requireJambReg && (
                                    <div className="mt-3 grid grid-cols-1 gap-3 pl-7 sm:grid-cols-3">
                                        <Input label="Pattern (regex)" value={form.jambRegPattern} onChange={setField('jambRegPattern')} placeholder="^\d{10}$" />
                                        <Input label="Example" value={form.jambRegExample} onChange={setField('jambRegExample')} placeholder="2025123456" />
                                        <Input label="Description" value={form.jambRegDescription} onChange={setField('jambRegDescription')} placeholder="10-digit number" />
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 rounded-lg border border-slate-200 p-4">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input type="checkbox" checked={form.requireAdmissionRef} onChange={setCheck('requireAdmissionRef')} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                                            Require admission reference number
                                        </div>
                                    </div>
                                </label>
                                {form.requireAdmissionRef && (
                                    <div className="mt-3 grid grid-cols-1 gap-3 pl-7 sm:grid-cols-3">
                                        <Input label="Pattern (regex)" value={form.admissionRefPattern} onChange={setField('admissionRefPattern')} placeholder="^ADM/\d{4}/\d{5}$" />
                                        <Input label="Example" value={form.admissionRefExample} onChange={setField('admissionRefExample')} placeholder="ADM/2025/00123" />
                                        <Input label="Description" value={form.admissionRefDescription} onChange={setField('admissionRefDescription')} placeholder="ADM/YYYY/NNNNN" />
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 rounded-lg border border-slate-200 p-4">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input type="checkbox" checked={form.requireApplicationNumber} onChange={setCheck('requireApplicationNumber')} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                                            Require application number
                                        </div>
                                    </div>
                                </label>
                                {form.requireApplicationNumber && (
                                    <div className="mt-3 grid grid-cols-1 gap-3 pl-7 sm:grid-cols-3">
                                        <Input label="Pattern (regex)" value={form.applicationNumberPattern} onChange={setField('applicationNumberPattern')} placeholder="^APP-\d{4}-\d{5}$" />
                                        <Input label="Example" value={form.applicationNumberExample} onChange={setField('applicationNumberExample')} placeholder="APP-2025-00123" />
                                        <Input label="Description" value={form.applicationNumberDescription} onChange={setField('applicationNumberDescription')} placeholder="APP-YYYY-NNNNN" />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </Card>

                {/* LIMITS */}
                <Card>
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                            <Users className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Account limits</h2>
                            <p className="text-xs text-slate-500">Maximum staff members and queues.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input label="Max staff members" type="number" min="1" value={form.maxStaff} onChange={setField('maxStaff')} />
                        <Input label="Max active queues" type="number" min="1" value={form.maxQueues} onChange={setField('maxQueues')} />
                    </div>
                </Card>

                <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
                    <Button type="button" variant="secondary" icon={RefreshCw} onClick={load} disabled={saving}>Reset</Button>
                    <Button type="submit" icon={Save} loading={saving} disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </div>
    )
}