import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                            <AlertTriangle className="h-6 w-6 text-rose-600" />
                        </div>
                        <h1 className="text-lg font-semibold text-slate-900">
                            Something went wrong
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            We hit an unexpected error. Your data is safe — try reloading the page.
                        </p>
                        {this.state.error?.message && (
                            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-left font-mono text-xs text-slate-600">
                                {this.state.error.message}
                            </p>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reload application
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}