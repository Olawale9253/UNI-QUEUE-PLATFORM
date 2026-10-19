import { useState } from 'react'
import { UserCog, Loader2, X } from 'lucide-react'
import api from '../../api/axios'
import { useToastStore } from '../../store/toastStore'

/**
 * Role-change button for the super-admin user list.
 *
 * Opens a small modal, lets the super admin pick a new role, then POSTs to
 *   /api/super-admin/users/:id/change-role
 *
 * The backend bumps the user's tokenVersion, so the target user must sign in
 * again before the new role takes effect on their session.
 */

const ASSIGNABLE_ROLES = [
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

export default function ChangeRoleButton({ user, onChanged, variant = 'compact' }) {
    const { push } = useToastStore()
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [role, setRole] = useState(user?.role || 'USER')

    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    const unchanged = role === user?.role

    const openModal = () => {
        setRole(user?.role || 'USER')
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
                `/api/super-admin/users/${user.id}/change-role`,
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
                message: err.message || 'Failed to change role',
            })
        } finally {
            setBusy(false)
        }
    }

    // Super admin's role can't be changed — render a disabled hint instead.
    if (isSuperAdmin) {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                title="Super admin role cannot be changed"
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
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Header */}
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

                        {/* Current role pill */}
                        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800/60">
                            <span className="text-slate-500 dark:text-slate-400">
                                Current:
                            </span>
                            <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                {ROLE_LABEL[user.role] || user.role}
                            </span>
                        </div>

                        {/* Select */}
                        <div className="mt-4">
                            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                                New role
                            </label>
                            <select
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                                disabled={busy}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {ASSIGNABLE_ROLES.map((assignableRole) => (
                                    <option key={assignableRole.value} value={assignableRole.value}>
                                        {assignableRole.label}
                                    </option>
                                ))}
                            </select>

                            <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                The user will be signed out and will need to sign in
                                again for the change to take effect.
                            </p>
                        </div>

                        {/* Actions */}
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