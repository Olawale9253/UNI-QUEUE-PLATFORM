import { Link } from 'react-router-dom'
import {
    Shield,
    Clock,
    ArrowUpRight,
    Mail,
} from 'lucide-react'
import Logo from '../ui/Logo'

export default function Footer() {
    const scrollToSection = (id) => (e) => {
        const el = document.getElementById(id)
        if (el) {
            e.preventDefault()
            el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        const container = document.querySelector('.overflow-y-auto')
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    return (
        <footer className="relative border-t border-slate-200/80 bg-slate-900 text-slate-300 dark:border-slate-800 dark:bg-slate-950">
            {/* Subtle top ambient glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

            {/* Main Footer Content */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">

                    {/* Brand Column (Spans 4 columns on large screens) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 p-2 shadow-inner ring-1 ring-white/15 backdrop-blur-md">
                                <Logo size={32} variant="icon" />
                            </div>
                            <div>
                                <span className="text-xl font-extrabold tracking-tight text-white">
                                    UniQueue
                                </span>
                                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400">
                                    Campus Operations Reimagined
                                </span>
                            </div>
                        </div>

                        <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                            The intelligent queue management and clearance workflow platform engineered for universities. Eliminating physical lines, hallway crowding, and administrative bottlenecks.
                        </p>

                        {/* Live System Status Pill */}
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            <span>All Campus Systems Operational</span>
                        </div>

                        {/* Trust highlights */}
                        <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-brand-400" /> Multi-Tenant Isolation
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-brand-400" /> &lt;5s Live Sync
                            </span>
                        </div>
                    </div>

                    {/* Links Columns (Spans 8 columns) */}
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">

                        {/* Col 1: Platform Capabilities */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                                Platform
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-sm">
                                <li>
                                    <a
                                        href="#features"
                                        onClick={scrollToSection('features')}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        Virtual Ticketing
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#clearance"
                                        onClick={scrollToSection('clearance')}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        Clearance Pipelines
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#freshers"
                                        onClick={scrollToSection('freshers')}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        Fresher JAMB Portal
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#how-it-works"
                                        onClick={scrollToSection('how-it-works')}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        How It Works
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#comparison"
                                        onClick={scrollToSection('comparison')}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        The UniQueue Way
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Col 2: Solutions by Role */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                                Roles
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-sm">
                                <li>
                                    <Link
                                        to="/register"
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        For Students
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/register"
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        For Freshers (JAMB)
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/login"
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        For Desk Staff
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/login"
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        For Department Admins
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/for-universities"
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        Super Admin Console
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Col 3: For Universities */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                                Universities
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-sm">
                                <li>
                                    <Link
                                        to="/for-universities"
                                        className="inline-flex items-center gap-1 font-medium text-brand-300 hover:text-brand-200 transition-colors"
                                    >
                                        Register Campus <ArrowUpRight className="h-3 w-3" />
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/for-universities"
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        Free Tier & Plans
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="#faq"
                                        onClick={scrollToSection('faq')}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        Campus FAQ
                                    </a>
                                </li>
                                <li>
                                    <span className="text-slate-500 cursor-default">
                                        Multi-Campus Tenants
                                    </span>
                                </li>
                                <li>
                                    <span className="text-slate-500 cursor-default">
                                        Custom Domain & Branding
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Col 4: Quick Portals & Contact */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                                Access
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-sm">
                                <li>
                                    <Link
                                        to="/login"
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        Portal Sign In
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/register"
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        Create Account
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/forgot-password"
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        Account Recovery
                                    </Link>
                                </li>
                                <li className="pt-2">
                                    <a
                                        href="mailto:contact@uniqueue.edu"
                                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-300 transition-colors"
                                    >
                                        <Mail className="h-3.5 w-3.5" />
                                        contact@uniqueue.edu
                                    </a>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>

                {/* Sub-footer Bottom Divider & Legal */}
                <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-4 text-center sm:text-left">
                        <span>
                            &copy; {new Date().getFullYear()} UniQueue Technologies. All rights reserved.
                        </span>
                        <span className="hidden sm:inline text-slate-700">&bull;</span>
                        <span className="text-slate-400">
                            Empowering higher education with frictionless campus logistics.
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={scrollToTop}
                            className="text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            Back to Top &uarr;
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    )
}
