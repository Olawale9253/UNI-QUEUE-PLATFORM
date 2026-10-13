import { Link } from 'react-router-dom'
import {
    Building2,
    GraduationCap,
    Bell,
    Ticket,
    CheckCircle2,
    ShieldCheck,
    Sparkles,
} from 'lucide-react'

/**
 * Split-screen auth shell.
 *
 * Left:  branded background image + headline + value props (hidden on mobile)
 * Right: whatever form you pass as children
 *
 * Usage:
 *   <AuthLayout variant="login">
 *     <h1>Welcome back</h1>
 *     <LoginForm />
 *   </AuthLayout>
 */

const BACKGROUND_IMAGE =
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1920&dpr=2'

const COPY = {
    login: {
        badge: 'Welcome back',
        headline: 'The line is gone.',
        headlineAccent: 'Your spot is waiting.',
        sub: 'Sign in to pick up right where you left off — your queue position is saved.',
        bullets: [
            { icon: Ticket, text: 'Track your place in real time' },
            { icon: Bell, text: 'Get a chime when it’s almost your turn' },
            { icon: ShieldCheck, text: 'Secure, university-verified access' },
        ],
        quote: {
            text: 'Thirty minutes saved every morning. That adds up.',
            author: 'Bursary staff, LAUTECH',
        },
    },
    register: {
        badge: 'Get started free',
        headline: 'Join the queue',
        headlineAccent: 'from anywhere.',
        sub: 'Create your account in under a minute. Your first ticket is one tap away.',
        bullets: [
            { icon: GraduationCap, text: 'Built for freshers and continuing students' },
            { icon: Ticket, text: 'No app download — works in your browser' },
            { icon: Sparkles, text: 'Free for students, forever' },
        ],
        quote: {
            text: 'No more sitting in the corridor for two hours.',
            author: 'Fresher, Lagos State University',
        },
    },
}

function LeftPanel({ variant }) {
    const copy = COPY[variant] || COPY.login

    return (
        <div className="relative hidden overflow-hidden bg-slate-900 lg:block">
            {/* Background image */}
            <img
                src={BACKGROUND_IMAGE}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
            />

            {/* Brand-colored gradient overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'linear-gradient(135deg, rgb(var(--brand-900, 30 58 138) / 0.94) 0%, rgb(var(--brand-800, 30 64 175) / 0.86) 45%, rgb(var(--brand-950, 23 37 84) / 0.95) 100%)',
                }}
                aria-hidden
            />

            {/* Subtle noise / pattern for depth */}
            <div
                className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
                    backgroundSize: '64px 64px, 96px 96px',
                }}
                aria-hidden
            />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
                {/* Brand header */}
                <Link to="/" className="flex items-center gap-3 text-white">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                        <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-base font-bold uppercase tracking-tight">
                            UniQueue
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                            Digital Queue System
                        </div>
                    </div>
                </Link>

                {/* Middle — the pitch */}
                <div className="max-w-md">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                        {copy.badge}
                    </div>

                    <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-white xl:text-5xl">
                        {copy.headline}
                        <span className="block text-white/70">{copy.headlineAccent}</span>
                    </h2>

                    <p className="mt-5 text-sm leading-relaxed text-white/75">
                        {copy.sub}
                    </p>

                    <ul className="mt-8 space-y-3">
                        {copy.bullets.map((b) => {
                            const Icon = b.icon
                            return (
                                <li
                                    key={b.text}
                                    className="flex items-center gap-3 text-sm text-white/90"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/15">
                                        <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    {b.text}
                                </li>
                            )
                        })}
                    </ul>
                </div>

                {/* Bottom — quote */}
                <div className="max-w-md border-l-2 border-white/30 pl-4">
                    <p className="text-sm italic leading-relaxed text-white/85">
                        “{copy.quote.text}”
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-white/50">
                        — {copy.quote.author}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function AuthLayout({ children, variant = 'login' }) {
    return (
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
            <LeftPanel variant={variant} />

            <div className="flex items-center justify-center bg-white px-6 py-12 dark:bg-slate-950">
                <div className="w-full max-w-md">
                    {/* Mobile-only compact brand header — replaces the left panel on small screens */}
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                                UniQueue
                            </div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                Digital Queue System
                            </div>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    )
}