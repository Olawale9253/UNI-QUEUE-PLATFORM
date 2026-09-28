import { FileText } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'

export default function StaffDocuments() {
    return (
        <>
            <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Documents
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Review and process document requests from students.
                </p>
            </div>

            <EmptyState
                icon={FileText}
                title="No pending documents"
                description="When students submit documents for your review, they'll appear here."
            />
        </>
    )
}