export const CATEGORY_LABELS = {
    ACADEMIC_ADVISING: 'Academic Advising',
    COURSE_REGISTRATION: 'Course Registration',
    PROJECT_SUPERVISION: 'Project Supervision',
    COUNSELLING: 'Counselling',
    MEDICAL: 'Medical',
    FINANCIAL: 'Financial',
    CAREER: 'Career',
    ADMINISTRATIVE: 'Administrative',
    OTHER: 'Other',
}

export const CATEGORY_STYLES = {
    ACADEMIC_ADVISING: 'bg-indigo-50 text-indigo-700',
    COURSE_REGISTRATION: 'bg-sky-50 text-sky-700',
    PROJECT_SUPERVISION: 'bg-violet-50 text-violet-700',
    COUNSELLING: 'bg-emerald-50 text-emerald-700',
    MEDICAL: 'bg-rose-50 text-rose-700',
    FINANCIAL: 'bg-amber-50 text-amber-700',
    CAREER: 'bg-cyan-50 text-cyan-700',
    ADMINISTRATIVE: 'bg-slate-100 text-slate-700',
    OTHER: 'bg-slate-100 text-slate-700',
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
}))

export function formatSlotRange(startIso, endIso) {
    const start = new Date(startIso)
    const end = new Date(endIso)
    const date = start.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
    const startTime = start.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    })
    const endTime = end.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    })
    return { date, startTime, endTime }
}