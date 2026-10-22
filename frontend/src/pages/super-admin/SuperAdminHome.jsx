import { Link } from 'react-router-dom'
import { Building2, Users, Activity, ArrowRight, ShieldCheck } from 'lucide-react'
import Card from '../../components/ui/Card'

export default function SuperAdminHome() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-brand-600">
                        <Building2 className="h-5 w-5" />
                        <span className="text-sm font-semibold">Universities</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-slate-500">Manage and view all registered institutions on the platform.</p>
                        <Link to="/super-admin/universities" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                            View universities <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-sky-600">
                        <Users className="h-5 w-5" />
                        <span className="text-sm font-semibold">Users</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-slate-500">Manage students, staff, and admin accounts across all tenants.</p>
                        <Link to="/super-admin/users" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700">
                            View users <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-amber-600">
                        <Activity className="h-5 w-5" />
                        <span className="text-sm font-semibold">Analytics</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-slate-500">Platform-wide metrics, ticket volume, and user growth.</p>
                        <Link to="/super-admin/analytics" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700">
                            View analytics <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-sm font-semibold">Pending</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-slate-500">Review new university applications waiting for approval.</p>
                        <Link to="/super-admin/pending-requests" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                            Review requests <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </Card>
            </div>

            <Card>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Welcome to the Platform Console</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    This is your central hub for managing the entire UniQueue multi-tenant ecosystem.
                    From here, you can oversee all registered universities, manage users, review system analytics, and handle new university applications.
                    Use the navigation menu on the left to access specific management tools.
                </p>
            </Card>
        </div>
    )
}