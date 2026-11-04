import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Users,
    Building2,
    ShieldCheck,
    Bell,
    LineChart,
    Route as RouteIcon,
    Ticket,
    GraduationCap,
    CheckCircle2,
    Activity,
    UserPlus,
    ClipboardList,
    BadgeCheck,
    ArrowRight,
    Check,
    X,
    ChevronDown,
    Smartphone,
    Zap,
    Shield,
    HelpCircle,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/layout/Footer'

// ═══════════════════════════════════════════════════════════
//  HERO CAROUSEL
// ═══════════════════════════════════════════════════════════

const SLIDES = [
    {
        id: 'students',
        src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
        alt: 'Students walking on a university campus',
        eyebrow: { icon: GraduationCap, label: 'For students' },
        headline: 'Skip the line.',
        headlineAccent: 'Reclaim your day.',
        sub: 'Join campus queues directly from your dorm or lecture hall, watch your live position update in real time, and show up exactly when your ticket is called.',
        cta: { label: 'Explore campus queues', to: '/register' },
        ctaSecondary: { label: 'Sign in to portal', to: '/login' },
        tags: ['Live Position Sync', 'Push & Audio Chimes', 'Clearance Tracker'],
    },
    {
        id: 'freshers',
        src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
        alt: 'Student checking their phone',
        eyebrow: { icon: Sparkles, label: 'For newly admitted freshers' },
        headline: 'Register before',
        headlineAccent: 'you get your matric.',
        sub: 'Sign up with your JAMB number the instant you are admitted. Access departmental queues and orientation workflows on day one, then upgrade in one tap once your matric arrives.',
        cta: { label: 'Register with JAMB number', to: '/register' },
        ctaSecondary: null,
        tags: ['Instant JAMB Onboarding', 'Zero Orientation Delays', '1-Tap Matric Upgrade'],
    },
    {
        id: 'staff',
        src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
        alt: 'Team collaborating at a bright office desk',
        eyebrow: { icon: Users, label: 'For university staff' },
        headline: 'Serve faster.',
        headlineAccent: 'Zero corridor chaos.',
        sub: 'Call tickets with a click, review uploaded clearance documents, and transfer students between desks seamlessly. All from one distraction-free staff desk dashboard.',
        cta: { label: 'Access staff desk', to: '/login' },
        ctaSecondary: null,
        tags: ['1-Click Next Call', 'Digital Document Audit', 'Smart Desk Transfer'],
    },
    {
        id: 'admins',
        src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
        alt: 'Graduating students celebrating',
        eyebrow: { icon: LineChart, label: 'For campus administrators' },
        headline: 'See every queue.',
        headlineAccent: 'Eliminate bottlenecks.',
        sub: 'Live queue analytics, desk throughput, student wait-time tracking, and verified student feedback. Spot and resolve congestion across offices before students feel it.',
        cta: { label: 'Register your university', to: '/for-universities' },
        ctaSecondary: null,
        tags: ['Real-Time Congestion Heatmap', 'Isolated Multi-Tenancy', 'Service SLA Radar'],
    },
]

const AUTO_ADVANCE_MS = 6000
const SLIDE_MS = 800
const SLIDE_COUNT = SLIDES.length

function buildSrcSet(baseUrl) {
    return [
        `${baseUrl}?auto=format&fit=crop&q=80&w=640&dpr=2 640w`,
        `${baseUrl}?auto=format&fit=crop&q=80&w=1024&dpr=2 1024w`,
        `${baseUrl}?auto=format&fit=crop&q=80&w=1440&dpr=2 1440w`,
        `${baseUrl}?auto=format&fit=crop&q=80&w=1920&dpr=2 1920w`,
        `${baseUrl}?auto=format&fit=crop&q=80&w=2560&dpr=2 2560w`,
    ].join(', ')
}
const FULL_URL = (base) => `${base}?auto=format&fit=crop&q=80&w=1920&dpr=2`

function HeroCarousel() {
    const sectionRef = useRef(null)
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const [imageReady, setImageReady] = useState(() => new Set())
    const preloaded = useRef(false)
    const reduceMotion = useReducedMotion()
    const { user } = useAuthStore()

    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
        FRESHER: '/student',
    }
    const dashboardHref = user ? dashboards[user.role] || '/' : null

    const goTo = useCallback((next) => {
        setIndex(((next % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT)
    }, [])

    const next = useCallback(() => goTo(index + 1), [goTo, index])
    const prev = useCallback(() => goTo(index - 1), [goTo, index])

    useEffect(() => {
        if (paused || reduceMotion) return
        const token = setTimeout(() => goTo(index + 1), AUTO_ADVANCE_MS)
        return () => clearTimeout(token)
    }, [index, paused, reduceMotion, goTo])

    useEffect(() => {
        const onMove = (entry) => {
            const el = sectionRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const inside =
                entry.clientX >= rect.left &&
                entry.clientX <= rect.right &&
                entry.clientY >= rect.top &&
                entry.clientY <= rect.bottom
            setPaused((item) => (item === inside ? item : inside))
        }
        window.addEventListener('mousemove', onMove, { passive: true })
        return () => window.removeEventListener('mousemove', onMove)
    }, [])

    useEffect(() => {
        if (preloaded.current) return
        preloaded.current = true
        SLIDES.forEach((item) => {
            const img = new Image()
            img.srcset = buildSrcSet(item.src)
            img.sizes = '100vw'
            img.src = FULL_URL(item.src)
        })
    }, [])

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'ArrowRight') next()
            else if (event.key === 'ArrowLeft') prev()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [next, prev])

    return (
        <section
            ref={sectionRef}
            className="relative isolate min-h-[640px] sm:min-h-[720px] lg:min-h-[780px] w-full overflow-hidden bg-slate-950 text-white"
            aria-roledescription="carousel"
            aria-label="Product highlights"
        >
            <motion.div
                className="absolute inset-0 flex"
                animate={{ x: `-${index * 100}%` }}
                transition={{
                    duration: reduceMotion ? 0 : SLIDE_MS / 1000,
                    ease: [0.83, 0, 0.17, 1],
                }}
            >
                {SLIDES.map((item, indexValue) => {
                    const isLoaded = imageReady.has(indexValue)
                    const isActive = indexValue === index
                    return (
                        <div
                            key={item.id}
                            className="relative h-full w-full shrink-0 overflow-hidden"
                            aria-hidden={!isActive}
                        >
                            {/* Placeholder skeleton while loading */}
                            <div
                                className={`absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 transition-opacity duration-500 ${
                                    isLoaded ? 'opacity-0' : 'opacity-100'
                                }`}
                            >
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
                                />
                            </div>

                            {/* Background Image */}
                            <img
                                src={FULL_URL(item.src)}
                                srcSet={buildSrcSet(item.src)}
                                sizes="100vw"
                                alt={item.alt}
                                loading={indexValue === 0 ? 'eager' : 'lazy'}
                                fetchPriority={indexValue === 0 ? 'high' : undefined}
                                decoding="async"
                                onLoad={() =>
                                    setImageReady((prev) => {
                                        if (prev.has(indexValue)) return prev
                                        const nxt = new Set(prev)
                                        nxt.add(indexValue)
                                        return nxt
                                    })
                                }
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                                    isLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                                draggable={false}
                            />

                            {/* Layered Rich Gradient Overlays for High Legibility */}
                            <div
                                className="pointer-events-none absolute inset-0"
                                style={{
                                    background:
                                        'linear-gradient(to right, rgba(15,23,42,0.97) 0%, rgba(15,23,42,0.85) 35%, rgba(15,23,42,0.50) 65%, rgba(15,23,42,0.2) 100%)',
                                }}
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/60 to-transparent" />

                            {/* Slide Content */}
                            <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
                                <div className="max-w-2xl lg:max-w-3xl">
                                    {/* Eyebrow Pill */}
                                    <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 sm:gap-3 rounded-full border border-white/20 bg-white/10 py-1.5 pl-2 pr-4 shadow-xl shadow-black/25 backdrop-blur-md">
                                        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-brand-600 shadow-md">
                                            <item.eyebrow.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                                        </span>
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white">
                                            {item.eyebrow.label}
                                        </span>
                                    </div>

                                    {/* Main Headline */}
                                    <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-white drop-shadow-xl sm:text-6xl lg:text-7xl">
                                        {item.headline}{' '}
                                        <span className="block text-brand-300 drop-shadow-[0_2px_10px_rgba(99,102,241,0.4)]">
                                            {item.headlineAccent}
                                        </span>
                                    </h1>

                                    {/* Subtitle */}
                                    <p className="mt-4 sm:mt-6 max-w-xl text-sm leading-relaxed text-slate-200 drop-shadow-md sm:text-lg">
                                        {item.sub}
                                    </p>

                                    {/* Feature Pills */}
                                    {item.tags && (
                                        <div className="mt-5 flex flex-wrap items-center gap-2">
                                            {item.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* CTAs */}
                                    <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
                                        <Link
                                            to={dashboardHref || item.cta.to}
                                            className="group inline-flex items-center gap-2.5 rounded-xl bg-brand-600 px-6 py-3 sm:px-8 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-xl shadow-brand-600/30 transition-all hover:bg-brand-500 hover:scale-105 active:scale-95"
                                        >
                                            {dashboardHref ? 'Go to dashboard' : item.cta.label}
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Link>

                                        {item.ctaSecondary && !dashboardHref && (
                                            <Link
                                                to={item.ctaSecondary.to}
                                                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 sm:px-7 sm:py-4 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/40"
                                            >
                                                {item.ctaSecondary.label}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </motion.div>

            {/* Carousel Arrow Controls */}
            <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="group absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-900/60 p-3.5 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 lg:flex"
            >
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="group absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-900/60 p-3.5 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 lg:flex"
            >
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Slide Indicators with Progress Bar */}
            <div className="absolute inset-x-0 bottom-6 sm:bottom-8 z-20 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                    {SLIDES.map((itemValue, indexValue2) => {
                        const isActive = indexValue2 === index
                        return (
                            <button
                                key={itemValue.id}
                                type="button"
                                onClick={() => goTo(indexValue2)}
                                aria-label={`Go to slide ${indexValue2 + 1}`}
                                className="group relative h-2 overflow-hidden rounded-full bg-white/25 transition-all"
                                style={{ width: isActive ? 44 : 14 }}
                            >
                                <span
                                    className={`absolute inset-0 rounded-full transition-colors ${
                                        isActive ? 'bg-white' : 'bg-white/50 group-hover:bg-white'
                                    }`}
                                />
                                {isActive && !paused && !reduceMotion && (
                                    <motion.span
                                        key={`progress-${index}`}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{
                                            duration: AUTO_ADVANCE_MS / 1000,
                                            ease: 'linear',
                                        }}
                                        className="absolute inset-0 origin-left rounded-full bg-brand-400"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  STATS BANNER
// ═══════════════════════════════════════════════════════════

const STATS = [
    { value: '95%', label: 'Wait Time Reduced', sub: 'No physical corridor standing' },
    { value: '< 4 min', label: 'Average Desk Time', sub: 'Faster service throughput' },
    { value: 'Day 1', label: 'Fresher JAMB Access', sub: 'Register before matric arrives' },
    { value: '100%', label: 'Digital Clearance', sub: 'Zero paper clearance marathons' },
]

function StatsBanner() {
    return (
        <section className="relative z-20 border-y border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="text-center sm:text-left">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                {stat.label}
                            </div>
                            <div className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                                {stat.sub}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  LIVE EXPERIENCE SHOWCASE (Interactive Mockup Previews)
// ═══════════════════════════════════════════════════════════

function LiveExperienceShowcase() {
    return (
        <section className="relative overflow-hidden bg-slate-50 py-16 sm:py-24 dark:bg-slate-950">
            {/* Background Ambient Blur */}
            <div className="pointer-events-none absolute top-1/2 left-1/4 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 right-1/4 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/60 dark:text-brand-300">
                        <Smartphone className="h-3.5 w-3.5" />
                        The UniQueue Experience
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Built for students on the move, desks under pressure, and leaders seeking clarity.
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        Experience the two pillars transforming campus logistics: Real-Time Digital Ticketing and Multi-Department Clearance Workflows.
                    </p>
                </div>

                {/* Dual Showcase Cards */}
                <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">

                    {/* Card 1: The Live Digital Ticket */}
                    <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                                    <Ticket className="h-3.5 w-3.5" /> Live Ticket Tracker
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                    </span>
                                    Live SSE Sync
                                </span>
                            </div>

                            <h3 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                Hold your spot from anywhere. Never stand in line.
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Join queues from your hostel bed, cafeteria, or lecture hall. Your phone tracks your spot and rings when you are 3 positions away.
                            </p>

                            {/* Simulated Digital Ticket UI */}
                            <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Bursary & Student Accounts
                                        </div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            Counter 2 &bull; Tuition Clearance
                                        </div>
                                    </div>
                                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                        Active
                                    </span>
                                </div>

                                <div className="my-4 flex items-baseline justify-between">
                                    <div>
                                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                            YOUR TICKET
                                        </div>
                                        <div className="text-3xl font-black tracking-tight text-brand-600 dark:text-brand-400">
                                            #B-042
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                            CURRENTLY SERVING
                                        </div>
                                        <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-200">
                                            #B-040
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Wait Info */}
                                <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-700 dark:text-slate-300">2 people ahead of you</span>
                                        <span className="text-brand-600 dark:text-brand-400 font-bold">~4 mins wait</span>
                                    </div>
                                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-brand-500 to-emerald-400" />
                                    </div>
                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        <Bell className="h-3 w-3 text-brand-500" />
                                        <span>Audio chime will ring before your number is called</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Zero app download required &bull; Works in any mobile browser</span>
                        </div>
                    </div>

                    {/* Card 2: Multi-Department Clearance Workflow */}
                    <div id="clearance" className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                    <RouteIcon className="h-3.5 w-3.5" /> Clearance Pipelines
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Graduation 2026
                                </span>
                            </div>

                            <h3 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                Chain queues into automated clearance workflows.
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                No more running across campus under the hot sun with physical clearance booklets. Each office verifies documents digitally and unlocks the next step automatically.
                            </p>

                            {/* Simulated Clearance Steps UI */}
                            <div className="mt-6 space-y-2.5">
                                {[
                                    { step: '1', title: 'Department HOD Clearance', status: 'Approved', color: 'emerald' },
                                    { step: '2', title: 'University Library Sign-off', status: 'Approved', color: 'emerald' },
                                    { step: '3', title: 'Bursary & Fee Reconciliation', status: 'In Progress (Ticket #B-042)', color: 'brand' },
                                    { step: '4', title: 'Hostel & Facilities Clearance', status: 'Next Step', color: 'slate' },
                                    { step: '5', title: 'Senate Registry Final Issuance', status: 'Locked', color: 'slate' },
                                ].map((item) => (
                                    <div
                                        key={item.step}
                                        className={`flex items-center justify-between rounded-xl border p-3 text-xs sm:text-sm font-semibold transition-all ${
                                            item.color === 'emerald'
                                                ? 'border-emerald-200 bg-emerald-50/50 text-slate-800 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-200'
                                                : item.color === 'brand'
                                                ? 'border-brand-300 bg-brand-50 text-brand-900 shadow-sm dark:border-brand-700 dark:bg-brand-950/40 dark:text-brand-200'
                                                : 'border-slate-200/70 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                    item.color === 'emerald'
                                                        ? 'bg-emerald-600 text-white'
                                                        : item.color === 'brand'
                                                        ? 'bg-brand-600 text-white'
                                                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                {item.color === 'emerald' ? '✓' : item.step}
                                            </span>
                                            <span>{item.title}</span>
                                        </div>
                                        <span className="text-xs font-bold">{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Admins configure rules &bull; Students complete in hours instead of weeks</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  THE OLD WAY VS THE UNIQUEUE WAY
// ═══════════════════════════════════════════════════════════

function OldWayVsNewWay() {
    return (
        <section id="comparison" className="relative bg-white py-16 sm:py-24 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        The Paradigm Shift
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        The Campus Queuing Crisis vs. UniQueue
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        Why legacy physical lines fail universities, and how digital queuing restores sanity.
                    </p>
                </div>

                {/* Comparison Grid */}
                <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">

                    {/* The Old Way */}
                    <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 sm:p-8 dark:border-rose-900/40 dark:bg-rose-950/20">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                            <X className="h-4 w-4" /> The Physical Line (The Old Way)
                        </div>

                        <ul className="mt-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            {[
                                'Waking up at 5:00 AM to write your name on a paper sign-up sheet pinned outside the door.',
                                'Standing 4 hours under the hot sun or in crowded, unventilated hallways with zero seats.',
                                'Missing lectures, labs, and study groups just to keep a physical spot in line.',
                                'Arriving at an office after waiting hours only to hear "the officer stepped out for lunch."',
                                'Paper clearance booklets getting misplaced or damaged, delaying graduation by an entire semester.',
                            ].map((point, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                                        <X className="h-3 w-3" />
                                    </div>
                                    <span className="leading-relaxed">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* The UniQueue Way */}
                    <div className="rounded-3xl border border-emerald-300 bg-emerald-50/40 p-6 sm:p-8 dark:border-emerald-800/50 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/5">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            <Check className="h-4 w-4" /> The UniQueue Way (Modern Campus)
                        </div>

                        <ul className="mt-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            {[
                                'Join the queue in 2 taps from your phone while resting in your hostel or studying in the library.',
                                'Live countdown shows your exact position and estimated wait time without refreshing.',
                                'Distinct audio chimes and push alerts warn you when you are 3 slots away so you arrive right on time.',
                                'Transparent desk status shows exactly which officers are actively serving before you walk over.',
                                'Multi-office clearance pipelines guide you through each stage digitally with tamper-proof records.',
                            ].map((point, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <span className="leading-relaxed font-medium">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  CORE FEATURES SECTION
// ═══════════════════════════════════════════════════════════

const FEATURES = [
    {
        icon: Ticket,
        badge: 'Virtual Queuing',
        title: 'Real-Time Ticket Tracking',
        body: 'Students join queues remotely and watch their spot update live via Server-Sent Events. Accurate wait times adapt as staff process tickets.',
    },
    {
        icon: RouteIcon,
        badge: 'Clearance Pipelines',
        title: 'Multi-Step Clearance Workflows',
        body: 'Chain queues across Bursary, Library, Faculty, and Registry. Each office approves documents digitally and automatically unlocks the next stage.',
    },
    {
        icon: Sparkles,
        badge: 'Freshers (JAMB)',
        title: 'Fresher Onboarding Portal',
        body: 'Newly admitted students can sign up using their JAMB number before receiving a matriculation number, accessing services on day one.',
    },
    {
        icon: Bell,
        badge: 'Smart Alerts',
        title: 'Proactive Push & Audio Chimes',
        body: 'Audio unlock chimes and push notifications ring your device when your turn is 3 positions away. Never miss a turn or crowd a counter.',
    },
    {
        icon: Users,
        badge: 'Staff Tools',
        title: 'Streamlined Desk Console',
        body: 'Staff call the next ticket, put late arrivals on hold, transfer students across desks, and review uploaded verification documents.',
    },
    {
        icon: ShieldCheck,
        badge: 'Enterprise Security',
        title: 'Multi-Tenant Campus Isolation',
        body: 'Each institution operates with isolated data, custom branding, personalized subdomains, and strict role-based access control.',
    },
]

function Features() {
    return (
        <section id="features" className="relative bg-[#f8fafc] py-16 dark:bg-slate-950 sm:py-24 lg:py-32 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-700 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-400">
                        <Sparkles className="h-3 w-3" />
                        Comprehensive Platform
                    </span>
                    <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a] dark:text-white lg:text-4xl">
                        Engineered for how universities actually run
                    </h2>
                    <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        A single unified platform connecting students, department officers, and executive leadership without friction.
                    </p>
                </div>

                <div className="mt-10 sm:mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((item, index) => {
                        const Icon = item.icon
                        return (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/40 dark:text-brand-400 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            {item.badge}
                                        </span>
                                    </div>
                                    <h3 className="mt-5 text-base sm:text-lg font-bold text-[#0f172a] dark:text-white">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        {item.body}
                                    </p>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  ROLE SHOWCASE TABS
// ═══════════════════════════════════════════════════════════

const ROLES = [
    {
        id: 'student',
        label: 'Students & Freshers',
        title: 'Never waste another hour standing in a corridor.',
        desc: 'Whether you are an incoming fresher clearing credentials with your JAMB number or a final-year student navigating graduation clearance, UniQueue puts complete control in your pocket.',
        bullets: [
            'Join any active university queue from your phone with 1 tap',
            'Watch your live position update without refreshing or calling',
            'Upload and verify clearance credentials securely from home',
            'Book dedicated appointment slots with advisers and HODs',
        ],
        ctaText: 'Sign up for free',
        ctaLink: '/register',
    },
    {
        id: 'staff',
        label: 'Desk Officers & Staff',
        title: 'Process queues with speed and zero hallway congestion.',
        desc: 'Empower desk officers with a clean, fast calling console. Eliminate loud shouting over crowds, manual paper signing, and repetitive inquiries.',
        bullets: [
            '1-Click "Call Next" with keyboard shortcuts for rapid desk flow',
            'Seamlessly transfer students to another desk or department',
            'Directly review and approve uploaded student verification files',
            'Temporarily hold tickets for students in transit without losing order',
        ],
        ctaText: 'Staff Desk Login',
        ctaLink: '/login',
    },
    {
        id: 'admin',
        label: 'Department & Campus Admins',
        title: 'Complete visibility into campus throughput and service speeds.',
        desc: 'Understand wait times, identify bottleneck departments, optimize staff schedules during peak registration weeks, and collect verified student satisfaction metrics.',
        bullets: [
            'Real-time congestion heatmaps across all university offices',
            'Configure multi-department clearance workflow rules and requirements',
            'Track staff service speed, no-show rates, and ticket turnaround',
            'Instant broadcast alerts to all queuing students across campus',
        ],
        ctaText: 'Admin Console',
        ctaLink: '/login',
    },
    {
        id: 'executive',
        label: 'University Executives',
        title: 'Modernize university operations with institutional cloud SaaS.',
        desc: 'Upgrade your university into a smart campus. Deploy a secure multi-tenant environment with custom branding, email domain verification, and 99.9% uptime reliability.',
        bullets: [
            'Dedicated campus subdomain and university identity branding',
            'Full enterprise data isolation and GDPR/institutional compliance',
            'Turnkey setup in under 24 hours with zero engineering needed',
            'Free tier to start with predictable, affordable scaling tiers',
        ],
        ctaText: 'Register your university',
        ctaLink: '/for-universities',
    },
]

function RoleShowcase() {
    const [activeRole, setActiveRole] = useState(0)
    const role = ROLES[activeRole]

    return (
        <section id="freshers" className="relative bg-white py-16 sm:py-24 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/60 dark:text-brand-300">
                        <Users className="h-3.5 w-3.5" /> Tailored Portals
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        One platform. Four tailored experiences.
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        Explore how UniQueue transforms the daily routine of everyone across campus.
                    </p>
                </div>

                {/* Role Tabs */}
                <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
                    {ROLES.map((item, idx) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveRole(idx)}
                            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                activeRole === idx
                                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 scale-105'
                                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Active Tab Content Card */}
                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-7">
                            <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                                {role.label}
                            </span>
                            <h3 className="mt-2 text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                                {role.title}
                            </h3>
                            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                {role.desc}
                            </p>

                            <div className="mt-6 space-y-3">
                                {role.bullets.map((bullet, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span>{bullet}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8">
                                <Link
                                    to={role.ctaLink}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:scale-105 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                >
                                    {role.ctaText}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Visual Accent Box */}
                        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                                        Verified Campus Protocol
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Enterprise Access & Role Controls
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="font-medium">User Status</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Authenticated Session</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="font-medium">Queue Synchronization</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-200">Real-Time Polling + SSE</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="font-medium">Multi-Tenancy</span>
                                    <span className="font-bold text-brand-600 dark:text-brand-400">Strict Tenant Separation</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="font-medium">Mobile Responsiveness</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">100% PWA & Mobile Web</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  HOW IT WORKS
// ═══════════════════════════════════════════════════════════

const STEPS = [
    {
        icon: Building2,
        title: 'Pick a service',
        body: 'Browse Bursary, Library, Admissions, or Faculty departments in one clean list.',
    },
    {
        icon: UserPlus,
        title: 'Join the queue',
        body: 'Get a digital ticket number with estimated wait times from anywhere on campus.',
    },
    {
        icon: Activity,
        title: 'Go about your day',
        body: 'Relax in your hostel or attend class. Your position updates live with zero refreshing.',
    },
    {
        icon: Bell,
        title: 'Get notified',
        body: 'We ring a chime and send a push notification when you are 3 slots away.',
    },
    {
        icon: BadgeCheck,
        title: 'Walk in & get served',
        body: 'Arrive right on time, show your digital ticket, and get served in minutes.',
    },
]

function HowItWorks() {
    return (
        <section id="how-it-works" className="relative overflow-hidden bg-white py-16 dark:bg-slate-900 sm:py-24 lg:py-32 border-t border-slate-200 dark:border-slate-800">
            <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-brand-400">
                        <ClipboardList className="h-3 w-3" />
                        Simple 5-Step Process
                    </span>
                    <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a] dark:text-white lg:text-4xl">
                        How UniQueue Works
                    </h2>
                    <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        Five simple steps from your phone to the front of the line.
                    </p>
                </div>

                <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon
                        return (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.45, delay: index * 0.08 }}
                                className="relative flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div className="absolute -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-md">
                                    {index + 1}
                                </div>
                                <div className="mt-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 text-base font-bold text-[#0f172a] dark:text-white">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {step.body}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  FREQUENTLY ASKED QUESTIONS
// ═══════════════════════════════════════════════════════════

const FAQS = [
    {
        q: 'Can freshers register before getting their university matriculation number?',
        a: 'Yes, absolutely! UniQueue was designed specifically for newly admitted freshers. You can create an account using your JAMB registration number immediately upon admission. Once the university issues your official matriculation number, you can upgrade your account in a single tap without losing any queue history or records.',
    },
    {
        q: 'How will I know when to walk over to the counter or office?',
        a: 'UniQueue provides real-time ticket tracking with dynamic wait-time estimation based on staff calling speeds. As your position advances, the platform sends proactive push notifications and rings an audio chime when you are 3 positions away, giving you plenty of time to walk over to the office comfortably.',
    },
    {
        q: 'What if I am running slightly late when my number is called?',
        a: 'UniQueue includes a smart desk hold feature. Staff members have the ability to place your ticket on a temporary hold rather than cancelling it immediately, allowing you to check in as soon as you step into the room.',
    },
    {
        q: 'How does UniQueue handle multi-office graduation or hostel clearances?',
        a: 'University administrators can configure sequential clearance workflows (e.g. Department HOD → Library → Bursary → Registry). Students upload necessary documents through their portal. As each office reviews and approves a step, the next queue unlocks automatically, eliminating physical paper clearance marathons.',
    },
    {
        q: 'How does a university partner with or onboard onto UniQueue?',
        a: 'University representatives can visit our For Universities page to submit a setup application. We set up an isolated campus instance with your university branding, departmental structures, and staff accounts in under 24 hours. A generous free tier is available to start immediately.',
    },
]

function FAQSection() {
    const [openIdx, setOpenIdx] = useState(0)

    const toggle = (idx) => {
        setOpenIdx((prev) => (prev === idx ? null : idx))
    }

    return (
        <section id="faq" className="relative bg-slate-50 py-16 sm:py-24 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-brand-300">
                        <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Got questions? We have answers.
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                        Everything you need to know about using UniQueue on campus.
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="mt-10 sm:mt-12 space-y-4">
                    {FAQS.map((faq, idx) => {
                        const isOpen = openIdx === idx
                        return (
                            <div
                                key={idx}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(idx)}
                                    className="flex w-full items-center justify-between p-5 sm:p-6 text-left font-bold text-slate-900 transition-colors hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400 cursor-pointer"
                                >
                                    <span className="text-sm sm:text-base pr-4">{faq.q}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                                            isOpen ? 'rotate-180 text-brand-600' : ''
                                        }`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="border-t border-slate-100 px-5 pb-5 pt-3 sm:px-6 sm:pb-6 text-xs sm:text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  FINAL CTA
// ═══════════════════════════════════════════════════════════

function FinalCTA() {
    const { user } = useAuthStore()
    const dashboards = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        STAFF: '/staff',
        USER: '/student',
        FRESHER: '/student',
    }
    const dashboardHref = user ? dashboards[user.role] || '/' : null

    return (
        <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-28 lg:py-32">
            {/* Background Glows */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/40 via-slate-950 to-slate-950" />
            <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-8">
                <div className="mx-auto mb-6 sm:mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-xl shadow-brand-500/30 ring-1 ring-white/20">
                    <Building2 className="h-8 w-8 text-white" />
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white lg:text-6xl">
                    Ready to end the campus queue?
                </h2>
                <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg text-slate-300 leading-relaxed">
                    Join thousands of students and leading universities using UniQueue to eliminate physical lines, accelerate clearance workflows, and modernise campus life.
                </p>

                <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
                    <Link
                        to={dashboardHref || '/register'}
                        className="group inline-flex items-center gap-2.5 rounded-xl bg-brand-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-brand-600/40 transition-all hover:bg-brand-500 hover:scale-105 active:scale-95"
                    >
                        {dashboardHref ? 'Go to dashboard' : 'Get started free'}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>

                    {!user && (
                        <Link
                            to="/for-universities"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/40"
                        >
                            Register your university
                        </Link>
                    )}
                </div>

                <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-slate-400">
                    {[
                        'No credit card required',
                        'Free tier for universities',
                        'Zero app store download needed',
                        'Set up in under 10 minutes',
                    ].map((item) => (
                        <span key={item} className="inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-brand-400" />
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════
//  PAGE ROOT
// ═══════════════════════════════════════════════════════════

export default function Home() {
    return (
        <div className="h-full overflow-y-auto bg-white dark:bg-slate-950">
            <HeroCarousel />
            <StatsBanner />
            <LiveExperienceShowcase />
            <OldWayVsNewWay />
            <Features />
            <RoleShowcase />
            <HowItWorks />
            <FAQSection />
            <FinalCTA />
            <Footer />
        </div>
    )
}
