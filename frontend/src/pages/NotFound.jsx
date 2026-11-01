import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="max-w-md text-center">
                <div className="mb-4 text-6xl sm:text-7xl font-semibold text-slate-200 dark:text-slate-800">404</div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Page not found
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    to="/"
                    className="mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                </Link>
            </div>
        </div>
    )
}