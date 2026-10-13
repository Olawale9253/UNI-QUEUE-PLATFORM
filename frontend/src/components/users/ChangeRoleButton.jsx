import { useState } from 'react'
import { UserCog, Loader2, X } from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'

/**
 * Role-change button. Shared between super-admin Users page and admin Students page.
 *
 * Props:
 *   user         — the user object (needs id, fullName, email, role)
 *   onChanged    — callback after a successful change
 *   variant      — 'compact' | 'default'
 *   endpoint     — API base path, e.g. '/api/super-admin/users' or '/api/admin/users'
 *   allowedRoles — array of assignable role values. Roles NOT in this list are
 *                  greyed out for the target and blocked from selection.
 *
 * If allowedRoles is undefined, all four roles are offered (super-admin default).
 */

const ALL_ROLES = [
    { value: 'USER',    label: 'Student (returning)' },
    { value: 'FRESHER', label: 'Fresher' },
    { value: 'STAFF',   label: 'Staff' },
    { value: 'ADMIN',   label: 'Admin' },
]

const ROLE_LABEL = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    STAFF: 'Staff',
    USER: 'Student',
    FRESHER: 'Fresher',
}

export default function ChangeRoleButton({
                                             user,
                                             onChanged,
                                             variant = 'compact',
                                             endpoint = '/api/super-admin/users',
                                             allowedRoles,
                                         }) {
    const { push } = useToastStore()
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [role, setRole] = useState(user?.role || 'USER')

    // Which roles can this caller assign?
    const assignable = allowedRoles
        ? ALL_ROLES.filter((r) => allowedRoles.includes(r.value))
        : ALL_ROLES

    // Is the target user's current role even editable by this caller?
    // e.g. super-admin: user.role=SUPER_ADMIN isn't in allowedRoles → can't edit.
    //      admin:       user.role=ADMIN or SUPER_ADMIN isn't in allowedRoles → can't edit.
    const targetIsEditable = !allowedRoles
        || allowedRoles.includes(user?.role)

    const unchanged = role === user?.role

    const openModal = () => {
        setRole(user?.role || assignable[0]?.value || 'USER')
        setOpen(true)
    }

    const close = () => {
        if (busy) return
        setOpen(false)
    }

    const save = async () => {
        if (unchanged) return
        setBusy(true)
        try {
            const res = await api.post(
                `${endpoint}/${user.id}/change-role`,
                { role }
            )
            push({
                type: 'success',
                message: res.data?.message || `Role changed to ${ROLE_LABEL[role] || role}`,
            })
            setOpen(false)
            onChanged?.()
        } catch (err) {
            push({
                type: 'error',
                message: err.response?.data?.message || 'Failed to change role',
            })
        } finally {
            setBusy(false)
        }
    }

    // Caller can't edit this user's role — render a disabled hint.
    if (!targetIsEditable) {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                title={`You cannot change ${ROLE_LABEL[user?.role] || user?.role} accounts`}
            >
                <UserCog className="h-3 w-3" />
                Role
            </span>
        )
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                title="Change this user's role"
                className={
                    variant === 'compact'
                        ? 'inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        : 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }
            >
                <UserCog className="h-3 w-3" />
                Role
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={close}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Change role
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    <strong className="text-slate-700 dark:text-slate-200">
                                        {user.fullName}
                                    </strong>
                                    <br />
                                    {user.email}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={close}
                                disabled={busy}
                                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800/60">
                            <span className="text-slate-500 dark:text-slate-400">Current:</span>
                            <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                {ROLE_LABEL[user.role] || user.role}
                            </span>
                        </div>

                        <div className="mt-4">
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                New role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                disabled={busy}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {assignable.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>

                            <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                The user will be signed out and will need to sign in
                                again for the change to take effect.
                            </p>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={close}
                                disabled={busy}
                                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={save}
                                disabled={busy || unchanged}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {busy ? 'Saving…' : unchanged ? 'No change' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}