import { Link } from 'react-router-dom'
import { Ticket, Clock, Activity, Bell, ArrowRight, Building2, BookOpen, Home, FileText } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const STATS = [
    { label: 'Active Queues', value: '1', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Your Tickets', value: '2', icon: Ticket, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Average Wait Time', value: '12 min', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Notifications', value: '3', icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const SERVICES = [
    { title: 'Bursary', desc: 'Get your financial matters sorted', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Library', desc: 'Book issue/return and enquiries', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Hostel', desc: 'Room allocation, payments', icon: Home, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Exams', desc: 'Exam registration and information', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
]

export default function StudentDashboard() {
    const { user } = useAuthStore()

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Good morning, {user?.fullName?.split(' ')[0] || 'Student'} 👋
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Welcome back to UniQueue. Here's what's happening at your university today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STATS.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Popular Services */}
            <div>
                <h2 className="mb-4 text-lg font-bold text-slate-900">Popular Services</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {SERVICES.map((service, i) => {
                        const Icon = service.icon
                        return (
                            <Link
                                key={i}
                                to="/student/join"
                                className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                            >
                                <div>
                                    <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${service.bg} ${service.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900">{service.title}</h3>
                                    <p className="mt-1 text-xs text-slate-500">{service.desc}</p>
                                </div>
                                <div className="mt-4 flex items-center text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                                    Join Queue <ArrowRight className="ml-1 h-4 w-4" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}